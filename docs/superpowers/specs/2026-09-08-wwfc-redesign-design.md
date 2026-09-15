# WWFC Website Redesign — Design Specification

**Date:** 2026-09-08  
**Status:** Ready for client review  
**Revision:** 2026-09-08 — corrected schedule model, publishing, preview, and verification  
**Website:** https://wwfc.com.pl/  
**Language:** Polish  
**Timezone:** Europe/Warsaw

## 1. Executive summary

The existing Warsaw West Fight Club website will be replaced with a fast, accessible, multi-page website focused on helping visitors choose suitable classes and check when they take place. The website will not provide reservations, online membership purchases, customer accounts, or payment processing.

The public frontend will use Astro and TypeScript and will be statically generated. A separately hosted Sanity Studio will provide a protected editing panel for the schedule, pricing, coaches, disciplines, notices, FAQ, opening hours, and other recurring content. Published content changes will trigger one GitHub Actions validation-and-deployment workflow through an authenticated webhook receiver. Only the artifact validated by that workflow may be deployed to Cloudflare Pages.

The approved design direction combines a raw documentary fight-club aesthetic with warmer community-focused communication. The home page uses the approved “brand plus quick decision” layout, and the schedule uses the approved hybrid presentation: a weekly grid on desktop and a selected-day list on mobile.

## 2. Goals

1. Let a visitor reach a relevant schedule with visible days and times within two navigation or selection actions from the home page on defined audience journeys. Reading guidance and entering additional preferences are measured separately; necessary information must not be removed to meet the target.
2. Make the offer understandable to beginners, parents, women, and experienced athletes.
3. Replace image-based schedules with accessible, filterable HTML content.
4. Give a non-technical WWFC employee a simple, protected content editor.
5. Improve local SEO for Ożarów Mazowiecki and the western Warsaw area.
6. Meet WCAG 2.2 AA and Core Web Vitals targets on mobile and desktop.
7. Preserve WWFC's strong visual identity while replacing outdated renders with authentic photography.
8. Reduce operational risk by serving static pages that remain available if the CMS is temporarily unavailable.

## 3. Non-goals

- No class reservations or attendance limits.
- No online purchase of memberships or passes.
- No customer accounts, authentication, member dashboard, or training history.
- No payment gateway.
- No custom CRM.
- No mobile application.
- No embedded live social-media feed.
- No autoplaying video or background video required for core navigation.
- No free-form page builder in the CMS.

## 4. Findings from the existing website

The current website is a single MailerLite landing page. A desktop and mobile inspection on 2026-09-08 found:

- the mobile document is 626 px wide inside a 375 px viewport, causing horizontal overflow;
- the mobile page is approximately 14,160 px tall;
- the document language is declared as English despite Polish content;
- the page contains three H1 elements;
- 39 of 42 images have empty alternative text and three have no `alt` attribute;
- embedded YouTube frames do not have descriptive titles;
- the document has no canonical link and incomplete Open Graph metadata;
- the “zacząć” link points to an invalid external domain;
- the “Polityka prywatności” link points to a Warsaw West Tennis Club regulations PDF;
- metadata and visible content include outdated opening and summer-schedule language;
- schedule information is presented primarily as images rather than structured text;
- the contact and newsletter purposes are combined in one consent statement.

The redesign must correct these issues rather than reproduce the current page structure.

## 5. Primary audiences and journeys

### 5.1 Beginner adult

The visitor selects “Zaczynam od zera,” sees classes marked `INTRO`, checks practical first-training guidance, then uses the phone, email, or directions link if needed.

### 5.2 Parent

The visitor selects “Dla dzieci,” filters by age group, checks the coach and safety information, and verifies the class time.

### 5.3 Woman looking for a dedicated group

The visitor selects “Dla kobiet,” sees only dedicated classes and self-defence options, then checks time and practical information.

### 5.4 Experienced athlete

The visitor filters the schedule by discipline and level, checks the coach, room, and sparring requirements, and attends the selected class.

### 5.5 Existing member

The visitor opens the schedule directly, defaults to the current day, and checks notices or exceptions without navigating through marketing content.

## 6. Information architecture

The public routes are:

- `/` — home;
- `/grafik/` — full schedule;
- `/cennik/` — passes, prices, and practical payment information;
- `/pierwszy-trening/` — preparation, clothing, arrival time, and class selection;
- `/dyscypliny/` — discipline index;
- `/dyscypliny/[slug]/` — one route per discipline;
- `/dzieci/` — children's offer and age groups;
- `/dla-kobiet/` — dedicated groups and self-defence;
- `/trenerzy/` — coach index;
- `/trenerzy/[slug]/` — coach profile;
- `/klub/` — venue, equipment, story, and gallery;
- `/kontakt/` — address, opening hours, phone, email, directions, and contact form;
- `/faq/` — frequently asked questions;
- `/polityka-prywatnosci/`;
- `/polityka-cookies/`;
- `/regulamin/`;
- `/404/`.

Legacy hash links are inventoried and preserved with matching anchors where useful; fragments cannot be redirected by the server. Any indexed legacy path discovered during migration will receive a permanent redirect to the closest new route. Sanity Studio is hosted separately and is not a public website route.

## 7. Home page structure

The approved order is:

1. Sticky header with logo, schedule, offer, coaches, pricing, club, and contact.
2. Hero with the headline “Wejdź na matę,” Ożarów Mazowiecki context, authentic photography, and two calls to action: “Sprawdź grafik” and “Jak zacząć?”.
3. “Dzisiaj w WWFC” showing up to three upcoming, non-cancelled occurrences for today's Warsaw date, after applying exceptions and closures, and a link to the full schedule. Started sessions are excluded. After the last session, show “Na dziś to już wszystkie zajęcia” and the schedule link; never silently show tomorrow under a “Dzisiaj” heading.
4. Audience paths: beginners, children, women, and experienced athletes.
5. Discipline grid with links to dedicated pages.
6. Club proof: real venue photography and the verified figures for total space, mat area, and octagon.
7. Three-step first-training explanation.
8. Compact previews for coaches, pricing, contact, and FAQ.
9. Footer with address, opening hours, legal links, and verified social profiles.

The home page contains summaries. Full schedules, biographies, pricing, and discipline information live on dedicated routes to prevent another excessively long landing page.

## 8. Schedule experience

### 8.1 Desktop

At viewports of 1024 px and wider, the schedule displays a Monday-to-Sunday weekly grid for a visibly labelled calendar week. Time is the vertical reference. Each occurrence displays discipline, audience or age, level, room, and start time. Concurrent classes in different rooms remain readable. Selecting an occurrence opens an accessible details panel without navigating away. The initial desktop view shows the entire current week and highlights today; it does not silently filter away the other days.

### 8.2 Mobile and tablet

Below 1024 px, the schedule displays day tabs and a chronological list. The current day is selected by default. A visitor can move between days without horizontal page scrolling.

### 8.3 Filters

Primary controls show the calendar week, day, discipline, and audience. Age group, level, room, and coach are available under “Więcej filtrów”; choosing children reveals age selection. Filters include:

- day;
- discipline;
- audience: adults, children, women;
- age group;
- level: intro, beginner, mixed, intermediate, sparring;
- room: Mata 1, Mata 2, Salka, Strefa cardio;
- coach.

Filters update the URL query string so the resulting view can be bookmarked and shared. `week=YYYY-MM-DD` identifies the Warsaw Monday; an omitted week means the current week. “Wyczyść filtry” restores the current week, showing all days on desktop and today on mobile. Week navigation is limited to loaded release coverage; dates without a valid release show the phone fallback. Back/forward navigation restores the view.

### 8.4 Status and exceptions

Each dated occurrence derives one of three statuses from the recurring session and any exception:

- `active` — shown normally;
- `cancelled` — shown with a visible “Odwołane” label and explanation;
- `changed` — shown with the original value struck through and the replacement time, room, or coach.

Exceptions apply only to the specified session and Warsaw calendar date. A cancellation never modifies subsequent weeks. Changed occurrences retain both original and replacement values for display and use the replacement values for sorting and filtering. Closure notices cancel all affected occurrences within their inclusive date range. Colour is never the only status indicator. Notices appear above the schedule and next to affected sessions. Print output includes the selected week, validity dates and applied exceptions; an image or PDF is never the primary version.

## 9. Visual design direction

The approved direction is “raw documentary” with selected community elements.

### 9.1 Foundation

- Primary black: `#0A0A0A`.
- Accent red-orange: `#FF3B12`.
- Warm light background: `#F3F0E9`.
- Neutral text grey: `#6B6B6B` on light backgrounds and `#B8B8B8` on dark backgrounds.
- Display typeface: self-hosted static Barlow Condensed, weights 600 and 700, with Polish characters.
- Body and interface typeface: self-hosted Inter Variable with Polish characters.

### 9.2 Photography

Photography is authentic, high-contrast, and documentary. Required subjects are the real venue, coaches teaching, beginners, children's groups, women's groups, equipment, and community moments. Images are predominantly neutral or monochrome, with colour retained where it communicates warmth and inclusion.

Existing renderings are not used on public pages after real photography is available. They may be retained outside the website as archival source material.

### 9.3 Motion

Motion is limited to navigation feedback, filter transitions, and short entrance effects using opacity and transforms. The site respects `prefers-reduced-motion`. Motion never delays access to the schedule or hides content before JavaScript executes.

## 10. CMS content model

Sanity Studio uses a Polish-language navigation structure and role-protected login, deployed separately from the public Astro site. Editors do not receive a free-form layout builder. Studio code and configuration live in `studio/`; the public site has no React integration. A protected static draft preview is described in section 12; live visual editing is outside this scope.

### 10.1 Singleton documents

`siteSettings` contains club name, address, coordinates, phone, email, opening hours, social links, default SEO text, and announcement settings.

`pricingPage` contains price groups, price rows, explanatory notes, and payment information.

### 10.2 Collection documents

`scheduleRelease` is a collection document, not a singleton. It contains title, required Warsaw calendar date `validFrom` and optional inclusive `validTo` (null means no stated end date), publication note, and owned arrays of recurring sessions, exceptions, and notices. Current, future and archived releases may coexist, but published validity ranges must not overlap. Copying a release creates independent session objects; changes to a future release cannot alter the current one. The editor sees release validity and public deployment status separately.

`classSession` is an embedded recurring-session object owned by a release and contains:

- weekday from 1 to 7;
- start and end time in 24-hour `HH:mm` format;
- discipline reference;
- coach reference;
- room enum;
- audience enum;
- optional age minimum and maximum;
- level enum;
- sort order;
- archived flag used to remove obsolete recurring sessions from the active editing view without deleting their history.

Each session has a stable key within its release. Required validation prevents publishing without a key, day, start time, discipline, coach, audience, level, or room. End time may be null when the authoritative source does not provide it. When present, it must be later than start time; overnight sessions are outside scope. Never infer duration from another class. Child sessions require an ordered age range. Known session intervals in the same room must not overlap after exceptions are applied. Unknown end times are reported as incomplete collision coverage, not fabricated.

`sessionException` is owned by a release and contains `sessionKey`, `date`, `kind: cancelled | changed`, required explanation, and optional replacement start/end time, room, and coach. A changed exception must replace at least one value. At most one exception may exist per session/date; it must reference a session occurring on that date inside the release validity period. The unchanged recurring session supplies original values. Replacement times, when both are known, must remain ordered. Moving a single occurrence to another day and adding one-off extra classes are outside the initial editor's scope; they must not be approximated by a recurring session that unintentionally repeats in later weeks.

`notice` contains a stable key, title, message, inclusive start/end dates and `closed: boolean`. A closure takes precedence over a changed session. Schema validation checks local fields; publication preflight and the deployment workflow check cross-document release overlap, references, and room conflicts. API imports cannot bypass deployment validation.

Other collections are `discipline`, `coach`, `priceGroup`, and `faqItem`. Slugs are unique within their route type and generated from Polish titles with normalized ASCII paths. Notices and exceptions are edited within their owning release.

## 11. Technical architecture

- Framework: Astro with TypeScript in strict mode.
- Rendering: static generation for all public routes.
- Interactive components: framework-free TypeScript where practical; no site-wide React runtime.
- CMS: Sanity, fetched server-side using `@sanity/client`; separate Studio built with Sanity's supported tooling.
- Hosting: Cloudflare Pages.
- Publishing: a Sanity webhook receiver verifies the signature and allowed dataset, then dispatches the GitHub Actions workflow. Direct production builds from Pages Git integration and Deploy Hooks are disabled. Git changes, CMS publication, manual retry and scheduled refresh all enter this same workflow.
- Forms: Cloudflare Pages Function with server-side validation, Cloudflare Turnstile, and Resend delivery to `biuro@wwfc.com.pl`.
- Newsletter: separate MailerLite integration with separate consent.
- Analytics: retain GA4 property `G-FK4R4J6S63`, load it only after analytics consent, and implement Google Consent Mode.
- Source control and deployment: Git repository with protected main, CI-deployed pull-request previews, and production uploads from the validated main workflow. A production deployment job uses `wrangler pages deploy` on the exact tested artifact, without rebuilding it.

Public builds query only published Sanity content. Draft preview is limited to authenticated editors. CMS credentials and service keys remain server-side environment variables.

## 12. Data flow and failure behaviour

1. An editor changes content in Sanity Studio and runs publication preflight.
2. A signed published-content webhook dispatches the single deployment workflow; duplicate event IDs are ignored.
3. The workflow fetches one content snapshot with explicit `perspective: published`, validates it with Zod and cross-record rules, and records snapshot hash and source commit.
4. Astro builds from that snapshot; all artifact checks use that same snapshot. Deterministic fixture tests run separately from live-content assertions.
5. Required checks run against the built artifact and Cloudflare Functions runtime before upload. Production jobs are serialized so an older job cannot overwrite a newer deployment; queued work fetches current content when it starts.
6. Cloudflare receives the tested artifact. A public version file and smoke test confirm the snapshot hash. Studio shows pending, successful or failed publication, with a retry action; a failure alerts the designated maintainer.

Time-dependent content is refreshed through the same workflow every 30 minutes, plus UTC 22:00 and 23:00 boundary runs covering midnight in Warsaw across daylight-saving seasons. These runs are best-effort, not an exact publication-time guarantee. The built payload includes current and future releases. The browser recomputes the current release, date and upcoming occurrences on load, every minute and when the tab regains visibility; switching dates never requires another CMS publication. All HTML views always show validity dates, the build timestamp, and a phone fallback. Without JavaScript, show a dated weekly snapshot labelled as such, with a request to confirm times outside its validity period; do not make a timeless “current schedule” claim.

Draft preview uses a separate protected Cloudflare Pages project covered by Cloudflare Access, including its deployment hostnames. An authenticated editor action requests a static preview build from a `drafts` snapshot using a server-only read token. Preview artifacts never enter the production project or public CI artifacts/logs; they receive `noindex` and have analytics, newsletter submissions and real email delivery disabled. Reviewers see the snapshot timestamp. This is an asynchronous static preview, not live visual editing. A PR preview with published content does not substitute for draft preview.

If Sanity is unavailable or data validation fails, the build fails and the currently published website remains online. Missing, expired, or future-only schedule coverage is valid data and must not itself fail a build: it renders a clear date-aware message with the club's phone number. For a chosen date, select the release whose inclusive range contains it; never blindly select the release with the latest `validFrom`. Overlapping releases are invalid. An expired schedule is never promoted as a list of upcoming classes.

If JavaScript fails, all routes, primary content, dated schedule entries, contact information, and links remain readable. Filters degrade to the unfiltered, dated weekly snapshot, including exceptions. Mobile controls must not hide the remaining days before enhancement initializes.

The contact form preserves entered values after recoverable validation errors, shows field-level messages, and provides a direct email and phone fallback. Video embeds use local poster images and load YouTube only after user interaction.

## 13. Accessibility requirements

- Conformance target: WCAG 2.2 AA.
- Root document language: `pl`.
- One descriptive H1 per route and logical heading order.
- Keyboard-accessible navigation, filters, dialogs, accordions, and day tabs.
- Visible focus indicators with at least 3:1 contrast against adjacent colours.
- Text alternatives for meaningful images; decorative images use empty `alt` deliberately.
- Captions or transcripts for informative video content.
- Minimum touch target of 24 by 24 CSS pixels, with primary controls designed at 44 px or larger.
- No content or functionality requires horizontal page scrolling at 320 CSS pixels.
- Error messages are associated with fields and announced to assistive technology.
- Reduced-motion mode disables non-essential transitions.
- Schedule status is represented by text and iconography in addition to colour.

## 14. Performance requirements

- Core Web Vitals targets at the 75th percentile: LCP at or below 2.5 s, INP at or below 200 ms, and CLS at or below 0.1.
- Initial JavaScript budget: no more than 75 KB compressed per public route. The separate Studio and scripts activated deliberately after consent are measured separately.
- Home-page transfer budget: no more than 1.5 MB on first load, excluding user-initiated video.
- Images use responsive `srcset`, explicit dimensions, and AVIF/WebP with a compatible fallback.
- The hero image is appropriately preloaded; below-the-fold imagery is lazy-loaded.
- Fonts are self-hosted, subset for Latin Extended, and use `font-display: swap`.
- YouTube, maps, and analytics do not block the first render.
- Lighthouse CI performance, accessibility, best-practices, and SEO scores must each be at least 90 on the agreed production-like test environment.

## 15. SEO and local discovery

Every route receives a unique title, meta description, canonical URL, Open Graph metadata, and share image. The site publishes `sitemap.xml`, `robots.txt`, and structured breadcrumbs.

The contact and home pages include JSON-LD using `HealthClub`, including the verified name, postal address, geographic coordinates, telephone number, email, opening hours, URL, logo, image, and verified social-profile URLs. Discipline pages use descriptive Polish content targeted to local intent without duplicating paragraphs across routes.

The schedule remains indexable as HTML. Filtered query-string variants use the canonical URL of `/grafik/` to avoid duplicate indexing.

## 16. Privacy and security

- Contact and newsletter purposes have separate controls and copy.
- The contact form contains only name, email or telephone, and message fields.
- The form requires one reply channel but does not require both email and telephone.
- Sanity stores public editorial content only and does not store contact submissions.
- Contact submissions are delivered to the club mailbox and are not persisted by the website.
- Analytics and marketing scripts wait for the corresponding consent state.
- Privacy, cookie, and club regulation documents are separate routes with correct labels.
- Security headers include a restrictive Content Security Policy, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and a restrictive `Permissions-Policy`.
- Dependency updates and automated vulnerability checks run through the source repository.

Final legal wording and retention rules must be supplied or approved by the website operator's legal adviser before launch; implementation will not reuse the incorrect current privacy link.

## 17. Testing strategy

### Automated

- Unit tests for release selection, recurrence expansion, one-date exceptions, closures, replacement values, sorting, filters, expired/future coverage, and Warsaw date/daylight-saving boundaries using an injected clock.
- Schema tests for valid and invalid CMS records.
- Playwright tests for the five primary audience journeys.
- Playwright tests at 320, 360, 390, 768, 1024, and 1440 px viewport widths without overriding project viewports inside shared tests.
- Automated axe accessibility checks on every page template.
- Lighthouse CI budgets on home, schedule, discipline, coach, pricing, and contact routes.
- Link checking, sitemap validation, HTML validation, and structured-data validation.
- Form tests covering success, invalid input, Turnstile failure, delivery failure, and retry without lost input, including a fresh single-use Turnstile token after a consumed or expired token.
- Artifact E2E tests run on `wrangler pages dev dist`; mocked UI tests alone do not demonstrate Pages Functions integration. Fixture builds use a fixed clock and never deploy to production. Production artifact smoke tests do not depend on fixture names or counts.
- Lighthouse is a laboratory gate; field Core Web Vitals at the 75th percentile are measured after launch when sufficient data exists. Automated axe checks complement manual WCAG assessment.

### Manual

- Keyboard-only review.
- Screen-reader smoke test on the home page, schedule, and contact form.
- iOS Safari and Android Chrome review on physical devices.
- Current Chrome, Edge, Firefox, and Safari review on desktop.
- Print-preview review of the schedule.
- CMS publishing rehearsal by the designated WWFC editor.

## 18. Content and migration requirements

Before launch, WWFC supplies or approves:

- current schedule and its validity date;
- verified prices and pass rules;
- final coach roster, disciplines, biographies, and profile photographs;
- real venue and training photography;
- opening hours and holiday rules;
- verified address, coordinates, phone, email, and social profiles;
- first-training rules and equipment requirements;
- privacy, cookie, and club regulation text.

The implementation team migrates and rewrites reusable content, removes outdated opening language, replaces renderings in primary pages, verifies every link, and compresses all approved media. The production domain remains `https://wwfc.com.pl/`, and the `www` hostname redirects permanently to the canonical non-`www` hostname.

## 19. Delivery phases

1. Inventory real content and obtain a representative approved schedule, including cancellations and seasonal changes.
2. Refine information architecture, audience journeys and responsive home/schedule wireframes.
3. Build Astro foundations, separate Sanity Studio, release schemas and date-aware schedule logic.
4. Implement the minimum responsive schedule and the shared validation/deployment workflow on protected preview infrastructure.
5. Early editor rehearsal: change one occurrence, preview a draft, publish, verify the public snapshot and restore the original data; test a failed build. This gate precedes the remaining public pages.
6. Complete the visual system, home page, content routes and migration.
7. Add contact, newsletter, analytics, SEO and legal integrations; extend the same workflow's required checks.
8. Complete automated and manual quality assurance, including accessibility and real-device review.
9. Repeat the editor rehearsal with final content, train the maintainer, perform DNS cutover, launch and monitor.

The expected delivery window is five to seven weeks after all required content, account access, and legal text are available.

## 20. Acceptance criteria

The redesign is accepted when:

1. All routes in the information architecture are deployed on the production domain.
2. A WWFC editor can change and publish the schedule without editing code.
3. The current-day schedule is reachable from the home page in one interaction.
4. Desktop uses the dated weekly-grid schedule and smaller viewports use the day-list schedule without horizontal page scrolling; extra filters are progressively revealed.
5. Every active class exposes discipline, day, start time, audience, level, and room.
6. No booking, payment, or customer-account functionality is present.
7. Contact and newsletter consent are separate.
8. All automated tests and production smoke tests pass.
9. Lighthouse CI scores are at least 90 in all four required categories on the defined representative routes.
10. No critical or serious axe violations remain.
11. All visible content is current and approved by WWFC.
12. The current invalid link and incorrect privacy-policy link are absent.
13. The designated WWFC editor completes one successful schedule update and publication rehearsal.
14. A one-date cancellation or changed time affects only that occurrence; subsequent weeks and future releases retain their independent values.
15. Future, expired and missing releases, midnight rollover, closures and the end of today's classes produce the defined messages without requiring an editor change.
16. Draft preview is inaccessible anonymously, and a failed workflow cannot replace production. The deployed version matches the tested snapshot.
17. Both the early publishing rehearsal and final rehearsal are recorded with measured build times; no unmeasured 1–2 minute publication promise is made.
