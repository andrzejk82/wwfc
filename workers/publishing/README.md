# Publishing receiver

This package is the server boundary for Sanity publication, editorial preflight,
and CI publication status. Nothing in this package creates a cloud resource when
running `npm test`, `npm run typecheck`, or `npm run build`. The build uses
`wrangler deploy --dry-run`. Run `npm ci` in the repository root as well: the
receiver bundles the shared content query and pure validator from `src/lib/content`.

## Configuration

Configure one Worker custom domain. `workers_dev` and preview URLs remain disabled.
The `PUBLICATIONS` binding uses one SQLite Durable Object, with the checked-in v1
migration. SQLite Durable Objects are available on Workers Free; account limits
still apply. No secrets, accounts, routes or Access policies are supplied by this
repository.

Worker secrets (use the provider secret store; never put these in `wrangler.jsonc`):

| Secret | Scope |
| --- | --- |
| `SANITY_WEBHOOK_SECRET` | Separate high-entropy signing secret configured in Sanity |
| `SANITY_READ_TOKEN` | Read access to project `objbb93c`, dataset `production`, including drafts |
| `PUBLICATION_CALLBACK_SECRET` | At least 32 characters, shared only with the trusted CI environments |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App RSA private key in **PKCS#8** PEM format |

Worker variables:

| Variable | Required value |
| --- | --- |
| `GITHUB_REPOSITORY` | Operator-selected `owner/repository`; never comes from a request |
| `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID` | Decimal IDs for the installation restricted to that repository |
| `STUDIO_ORIGIN` | Exact HTTPS origin, without trailing slash |
| `ACCESS_TEAM_DOMAIN` | `your-team.cloudflareaccess.com`, without scheme or path |
| `ACCESS_AUDIENCE` | Access application audience |
| `EDITOR_EMAILS` | Comma-separated editor email allowlist |
| `PRODUCTION_PAGES_PROJECT` | Production Pages project name |
| `PREVIEW_PAGES_PROJECT` | Separate protected draft Pages project name |
| `DRAFT_PREVIEW_ENABLED` | Default `false`; set `true` only after independently verifying protection on every preview hostname |

The GitHub App needs Actions read/write only, installed on the selected repository.
The receiver generates a short-lived App JWT and requests an installation token
restricted to that repository and Actions write. GitHub's downloaded PKCS#1 key
must be converted locally to PKCS#8, e.g. `openssl pkcs8 -topk8 -nocrypt -in
app-key.pem -out app-key-pkcs8.pem`. Treat both files as secrets. No PAT is accepted.

Protect the editor paths with Cloudflare Access and an editor identity policy;
configure the Access application to pass browser preflight OPTIONS requests to the
Worker. `/cms` uses Sanity signatures and `/complete` uses its separate CI secret,
so these paths must not require an interactive Access session. Receiver code still
verifies JWT signature, RS256 algorithm, issuer, audience, expiry, issuance time,
subject, application type and email allowlist. A user-email header alone is never
trusted. Studio fetches use `credentials: 'include'` and the exact configured Origin.
JWT keys are fetched only from the configured Cloudflare team JWKS endpoint.

## HTTP contract

JSON bodies only; maximum 16 KiB, streaming reads with a 15 second deadline.
Errors return `{ "error": "stable_code" }`, without raw exceptions or content.
All JSON responses are `Cache-Control: no-store`. Editor CORS permits only the
configured Studio origin and credentials. The receiver does not log request
bodies, headers, tokens or draft content.

- `POST /cms`: Sanity's `sanity-webhook-signature` authenticates **raw body bytes**.
  Body: `{eventId,projectId:"objbb93c",dataset:"production",operation:"create" |
  "update" | "delete",documentId,documentType,revision?}`. IDs must be published
  canonical IDs, never `drafts.*` or `versions.*`. Allowed types: `siteSettings`,
  `coach`, `discipline`, `scheduleRelease`, `pricingPage`, `priceGroup`, `faqItem`.
  Unknown fields are rejected. The signed timestamp may be at most 24 hours old
  and at most one minute in the future. Returns 202 and `PublicationStatus`.
- `POST /preflight`: Access required. `{documentId,revision}` uses the canonical
  document ID and the exact draft `_rev`. Returns `{valid:true,documentId,revision,validatedAt}`;
  409 `revision_changed`, 404 `draft_not_found`, or 422 `invalid_content` otherwise.
  The server fetches published documents, assets and only the requested draft in
  one raw-perspective Sanity query. It overlays that draft at the canonical ID,
  evaluates the shared GROQ projection and validates the result. It never accepts
  a client snapshot or persists the candidate. The temporary `published` metadata
  identifies the in-memory validation candidate, not a deployed draft artifact.
  Limits: 2,000 raw documents, 4 MB Sanity response, 15 second network deadline.
  Studio must check the draft revision again immediately before standard publish.
- `POST /preview`: Access required. `{}`. Returns 202 and `PublicationStatus` for
  `draft-preview`; 403 `preview_disabled` unless explicitly enabled.
- `POST /retry`: Access required. `{requestId}`. Only failed requests can retry.
  Returns 202 and a new pending request; repeating retry on the same failed request
  returns that same retry, so double clicks cannot create two requests.
- `GET /status?requestId=UUID`: Access required. Returns `PublicationStatus`, or 404.
- `GET /status?documentId=canonical-id&since=ISODate`: Access required. Returns
  `{status:PublicationStatus|null}` for the newest matching request created at or
  after `since`. Studio uses the server-provided preflight validatedAt timestamp to avoid displaying a prior
  success as the new publication, independently of the editor device clock.
- `POST /complete`: `Authorization: Bearer PUBLICATION_CALLBACK_SECRET`.
  `{requestId,target,dataset:"production",phase:"running"|"succeeded"|"failed",
  commit?,snapshotHash?,deploymentUrl?}`. Commit is 40 lowercase hex characters;
  hash is 64. Success requires all three and a prior running claim. URLs must be
  HTTPS `https://<8–64 hex deployment-id>.<configured-target-project>.pages.dev/`.
  Returns `{accepted:boolean,status:PublicationStatus}`. The first running callback
  **atomically claims** the request. Every workflow must stop before deployment
  when `accepted` is false or the response is uncertain. A validation failure may
  mark a pending request failed without claiming it. Unknown IDs and wrong targets
  are refused. Terminal states never regress; duplicate callbacks return accepted
  false. Commit cannot change after a claim.

`PublicationStatus` contains `requestId`, `dataset`, `target`, `phase`, `createdAt`,
`updatedAt`, optional `documentId`, `documentRevision`, `commit`, `snapshotHash`,
`deploymentUrl`, `error`. Internal event keys and outbox state are never returned.

Example Sanity webhook projection (verify with an actual create/update/delete
before enabling; disable draft/version events):

```groq
{
  "eventId": coalesce(after()._rev, before()._rev) + ":" + delta::operation() + ":" + coalesce(after()._id, before()._id),
  "projectId": sanity::projectId(),
  "dataset": sanity::dataset(),
  "operation": delta::operation(),
  "documentId": coalesce(after()._id, before()._id),
  "documentType": coalesce(after()._type, before()._type),
  "revision": coalesce(after()._rev, before()._rev)
}
```

Filter to the seven allowed document types and published IDs. `eventId` is inside
the signed payload; unsigned `idempotency-key` headers are not trusted for dedup.

## Delivery and failure semantics

The single coordinator transaction atomically persists a request and its event
key. A durable alarm is armed before enqueue; ordinary concurrent duplicates
produce one request and one dispatch. Dispatch is asynchronous and targets only
`publish.yml`, `main`, with inputs `target` and `request_id`. An alarm lease survives
process termination. Maintenance wakes every 90 seconds and processes at most ten
dispatches per pass. No direct Cloudflare deployment is implemented here.

Network dispatch cannot be atomically committed with local storage. Ambiguous
delivery therefore does **not** imply exactly-once dispatch: recovery checks the
fixed workflow's runs for exact display title `WWFC:${target}:${request_id}` before
considering another dispatch of the **same** request ID. If the first 100 runs do
not establish absence, it remains pending. CI's atomic running claim prevents two
delivered runs from deploying the same request. A lost claim response causes that
run to stop. Pending requests become failed after 48 hours; running claims after 30 minutes. An editor can request
a new ID. A definite HTTP dispatch refusal becomes failed immediately. Operators
must investigate repeated `workflow_timeout` or `dispatch_failed` statuses.

Requests and event keys expire after seven days. Retained requests are capped at
2,000; capacity exhaustion fails closed with 503 until cleanup releases space.
The 24-hour signature window prevents replay after dedup retention has expired.
The maintenance alarm remains enabled even after an empty queue to avoid racing
an enqueue, around 28,800 alarm invocations per 30 days before request traffic.

## Verification limits

Unit tests use real Sanity signatures, real RSA/JWT verification and the shared
GROQ/content validator. Lifecycle tests use an explicit in-memory transactional
storage adapter and mocked GitHub HTTP responses; they do not prove Cloudflare
input/output gates or alarm delivery in a deployed Durable Object. A Wrangler
dry-run verifies bundling only. The real acceptance test must cover Access in
Studio, signed Sanity delivery including deletion, recovery after interruption,
GitHub App installation permissions, callback claims, protected deployment URLs,
draft confidentiality and production hash comparison. No remote acceptance is
claimed from local tests.

Primary references: [Sanity webhook toolkit](https://github.com/sanity-io/webhook-toolkit),
[Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/),
[SQLite Durable Object pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).
