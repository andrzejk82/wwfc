# WWFC Website Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować szybką, dostępną i łatwą w edycji witrynę WWFC, na której użytkownik w maksymalnie dwóch działaniach nawigacyjnych dociera do właściwego grafiku z widoczną godziną; dodatkowe preferencje i czytanie wskazówek mierzymy osobno.

**Architecture:** Publiczna witryna jest statycznie generowana w Astro z jednego zwalidowanego snapshotu Sanity, a Studio jest hostowane osobno. Zajęcia cykliczne należą do wersji grafiku; odwołania i zastępstwa są wyjątkami konkretnej daty. GitHub Actions stanowi jedyną ścieżkę walidacji i publikacji do Cloudflare Pages; wdrażany jest dokładnie sprawdzony artefakt, a poprzednia wersja pozostaje aktywna po błędzie.

**Tech Stack:** Astro, TypeScript strict, Sanity Studio, Zod, Vitest, Playwright, axe-core, Lighthouse CI, Cloudflare Pages Functions, Turnstile, Resend, MailerLite, GA4 Consent Mode.

**Spec:** `docs/superpowers/specs/2026-09-08-wwfc-redesign-design.md`

**Revision:** 2026-09-08 — korekty po analizie obu dokumentów. Ten plan aktualizuje wcześniejszą wersję; Task 0 i Task 6A są obowiązkowymi wczesnymi etapami, a Task 13 rozszerza już działające CI zamiast tworzyć je dopiero na końcu. Dokument opisuje przyszłą implementację; checkboxy nie oznaczają prac wykonanych podczas tej korekty.

## Global Constraints

- Język publicznej witryny: polski; `lang="pl"`; strefa czasu: `Europe/Warsaw`.
- Brak rezerwacji, płatności, kont klientów, panelu członkowskiego i CRM.
- Publiczne trasy są generowane statycznie; brak globalnego runtime React.
- Studio jest osobnym projektem w `studio/`; React występuje wyłącznie w zależnościach Studio. Brak `/studio/` w publicznym Astro.
- CMS: Sanity; hosting: Cloudflare Pages; kanoniczny host: `https://wwfc.com.pl/`.
- Kontakt: Cloudflare Pages Function + Turnstile + Resend do `biuro@wwfc.com.pl`.
- Newsletter: osobna integracja MailerLite i osobna zgoda.
- GA4 `G-FK4R4J6S63` ładuje się dopiero po zgodzie analitycznej.
- Dostępność: WCAG 2.2 AA; brak poziomego scrollowania strony przy 320 CSS px.
- Core Web Vitals: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 w 75. percentylu.
- Budżet początkowego JavaScriptu: ≤ 75 KB gzip na publiczną trasę; osobne Studio i skrypty aktywowane świadomie po zgodzie są mierzone oddzielnie.
- Budżet pierwszego transferu strony głównej: ≤ 1,5 MB bez filmu uruchamianego przez użytkownika.
- Lighthouse CI: ≥ 90 dla performance, accessibility, best practices i SEO.
- Kolory: `#0A0A0A`, `#FF3B12`, `#F3F0E9`; fonty: lokalne statyczne Barlow Condensed 600/700 i Inter Variable, z polskimi znakami.
- Kod wdrożeniowy nie może kopiować nieaktualnych informacji, błędnego linku „zacząć” ani obecnego linku do rzekomej polityki prywatności.
- Brak, wygaśnięcie lub przyszły okres grafiku dają fallback; błędne dane i nakładające się okresy blokują publikację.
- CI wdraża ten sam snapshot i `dist`, które sprawdziło. Produkcyjne Deploy Hooks i automatyczne buildy Pages z Git są wyłączone.
- E2E uruchamia gotowy artefakt przez Wrangler; zegar i dane są deterministyczne w testach fixture. Snapshot fixture nigdy nie trafia do produkcji.

---

## Docelowa struktura plików

```text
.
├── .env.example
├── .gitignore
├── astro.config.mjs
├── package.json
├── playwright.config.ts
├── wrangler.jsonc
├── tsconfig.json
├── vitest.config.ts
├── lighthouserc.cjs
├── functions/
│   └── api/contact.ts
├── public/
│   ├── fonts/
│   ├── icons/
│   ├── images/
│   └── _headers
├── studio/
│   ├── package.json
│   ├── sanity.config.ts
│   ├── sanity.cli.ts
│   └── schemas/
│       ├── classSession.ts
│       ├── sessionException.ts
│       ├── coach.ts
│       ├── discipline.ts
│       ├── faqItem.ts
│       ├── index.ts
│       ├── notice.ts
│       ├── priceGroup.ts
│       ├── pricingPage.ts
│       ├── scheduleRelease.ts
│       └── siteSettings.ts
├── workers/publishing/
│   ├── src/index.ts
│   └── wrangler.jsonc
├── scripts/
│   ├── fetch-content.mjs
│   ├── verify-content.mjs
│   ├── import-content.mjs
│   └── measure-assets.mjs
├── .github/workflows/publish.yml
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   ├── home/
│   │   ├── schedule/
│   │   └── seo/
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── lib/
│   │   ├── contact/
│   │   ├── content/
│   │   ├── consent/
│   │   ├── schedule/
│   │   └── seo/
│   ├── pages/
│   ├── scripts/
│   └── styles/
└── tests/
    ├── e2e/
    ├── fixtures/
    └── unit/
```

Każdy katalog grupuje pliki zmieniające się razem. Logika domenowa pozostaje w `src/lib`, komponenty renderują przekazane dane, a strony wyłącznie składają komponenty i wykonują zapytania contentowe.

---

### Task 0: Prawdziwe dane i scenariusze odbioru

**Files:** Create: `docs/content-inventory.md`, `docs/schedule-cases.md`.

**Interfaces:** Produces: zatwierdzony zestaw danych do pierwszej próby redaktora, rozdzielony od fikcyjnych danych automatycznych testów.

- [ ] **Step 1:** Zapisz źródło i osobę zatwierdzającą grafik, godziny, wiek, sale i dane kontaktowe. Zaznacz brakujące materiały jako zależności publikacji, bez wymyślania treści.
- [ ] **Step 2:** Opisz przypadki: bieżący i przyszły okres, odwołanie jednego wtorku, zmiana godziny jednego wtorku, zamknięcie klubu, dwa równoległe treningi, koniec dnia i wygasły grafik. Dla każdego zapisz wejściową datę i oczekiwane godziny/statusy.
- [ ] **Step 3:** Zdefiniuj pięć ścieżek odbiorców. Dwa działania oznaczają przejście lub wybór kontrolki; wpisanie wieku i zapoznanie się ze wskazówkami są osobną częścią scenariusza. Strony odbiorców muszą pokazywać pasujące godziny lub bezpośredni link do odpowiedniego widoku.

**Odbiór:** Dane wystarczają do demonstracji jednej poprawnej publikacji; pozostałe zdjęcia i teksty mogą być zbierane równolegle.

---

### Task 1: Fundament projektu, test runner i bazowy layout

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `package.json`
- Create: `.node-version`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `wrangler.jsonc`
- Create: `src/env.d.ts`
- Create: `src/lib/seo/page-meta.ts`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/pages/index.astro`
- Test: `tests/unit/page-meta.test.ts`

**Interfaces:**
- Produces: `PageMeta`, `buildPageMeta(input: PageMetaInput): PageMeta`, `BaseLayout` przyjmujący `title`, `description`, `canonicalPath`, `image`, `robots`.
- Produces: skrypty `dev`, `build`, `check`, `test`, `test:unit`, `test:e2e`, `test:lighthouse`.

- [ ] **Step 1: Zainicjalizuj repozytorium i zależności**

Run:

```bash
git init -b main
npm init -y
npm install astro @astrojs/sitemap @sanity/client zod @fontsource/barlow-condensed @fontsource-variable/inter
npm install -D @astrojs/check typescript vitest jsdom @playwright/test @axe-core/playwright eslint prettier @lhci/cli wrangler tsx
```

Jeżeli repozytorium już istnieje, pomiń `git init`. Wybierz wspieraną wersję Node zgodną z instalowanymi pakietami, zapisz ją w `.node-version` i `engines`, a dokładne wersje pakietów utrwal lockfile. Expected: instalacja i `git status --short` kończą się bez błędów.

- [ ] **Step 2: Zapisz konfigurację i skrypty projektu**

`package.json` ma zawierać co najmniej:

```json
{
  "name": "wwfc-website",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "preview:pages": "wrangler pages dev dist --ip 127.0.0.1 --port 8788",
    "check": "astro check",
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:lighthouse": "lhci autorun"
  }
}
```

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://wwfc.com.pl',
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap()]
});
```

`.env.example`:

```dotenv
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_READ_TOKEN=
CONTENT_SNAPSHOT_PATH=.cache/content.json
TURNSTILE_SECRET_KEY=
PUBLIC_TURNSTILE_SITE_KEY=
RESEND_API_KEY=
CONTACT_FROM_EMAIL=
MAILERLITE_FORM_ACTION=
```

Dane publicznych stron pochodzą wyłącznie ze snapshotu. W Task 1 strona bazowa nie wymaga dostępu do CMS. Sekrety funkcji lokalnych przechowuj w ignorowanym `.dev.vars`, produkcyjne w Cloudflare, a token pobierania snapshotu w CI. Receiver z Task 6A ma osobny serwerowy token odczytu do preflight; żaden token nie trafia do publicznego JS. `wrangler.jsonc` zawiera `name: "wwfc-website"`, `pages_build_output_dir: "./dist"` i `compatibility_date: "2026-09-08"`.

`.gitignore`:

```gitignore
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
coverage/
playwright-report/
test-results/
sanity-schema.json
.superpowers/
.cache/
.wrangler/
.dev.vars
.dev.vars.*
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts']
  }
});
```

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

const viewports = [320, 360, 390, 768, 1024, 1440];

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts/,
  testIgnore: /production-smoke\.spec\.ts/,
  use: { baseURL: 'http://127.0.0.1:8788', browserName: 'chromium' },
  projects: viewports.map(width => ({
    name: `chromium-${width}`,
    use: { viewport: { width, height: width < 768 ? 800 : 900 } }
  })),
  webServer: {
    command: 'npm run preview:pages',
    url: 'http://127.0.0.1:8788',
    reuseExistingServer: false
  }
});
```

Każde lokalne wywołanie `test:e2e` poprzedź buildem aktualnego kodu. Od Task 4 użyj `npm run build:fixture` dla testów fixture; ten skrypt generuje snapshot fixture i uruchamia build z jawną ścieżką do niego. E2E nie buduje strony ponownie po jej sprawdzeniu. Osobny `playwright.production.config.ts` z Task 6A uruchamia testy rzeczywistego snapshotu bez nazw i liczebności fixture.

- [ ] **Step 3: Napisz test metadanych, który najpierw nie przechodzi**

`tests/unit/page-meta.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildPageMeta } from '../../src/lib/seo/page-meta';

describe('buildPageMeta', () => {
  it('buduje kanoniczny adres non-www z końcowym ukośnikiem', () => {
    expect(buildPageMeta({
      title: 'Grafik zajęć',
      description: 'Aktualny grafik WWFC',
      canonicalPath: '/grafik'
    })).toEqual({
      title: 'Grafik zajęć | Warsaw West Fight Club',
      description: 'Aktualny grafik WWFC',
      canonicalUrl: 'https://wwfc.com.pl/grafik/',
      image: 'https://wwfc.com.pl/images/og-default.jpg',
      robots: 'index,follow'
    });
  });
});
```

- [ ] **Step 4: Uruchom test i potwierdź prawidłową porażkę**

Run: `npm run test:unit -- tests/unit/page-meta.test.ts`

Expected: FAIL z błędem importu `src/lib/seo/page-meta`.

- [ ] **Step 5: Zaimplementuj helper i bazowy layout**

`src/lib/seo/page-meta.ts`:

```ts
export interface PageMetaInput {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  robots?: string;
}

export interface PageMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  image: string;
  robots: string;
}

export function buildPageMeta(input: PageMetaInput): PageMeta {
  const path = input.canonicalPath === '/'
    ? '/'
    : `/${input.canonicalPath.replace(/^\/+|\/+$/g, '')}/`;
  return {
    title: `${input.title} | Warsaw West Fight Club`,
    description: input.description,
    canonicalUrl: new URL(path, 'https://wwfc.com.pl').href,
    image: input.image ?? 'https://wwfc.com.pl/images/og-default.jpg',
    robots: input.robots ?? 'index,follow'
  };
}
```

`src/layouts/BaseLayout.astro` ma używać `buildPageMeta`, ustawiać `lang="pl"`, pojedynczy `<main id="main">`, link „Przejdź do treści”, canonical, Open Graph i Twitter cards. `src/pages/index.astro` renderuje jeden H1 „Wejdź na matę”.

- [ ] **Step 6: Zweryfikuj fundament**

Run:

```bash
npm run test:unit -- tests/unit/page-meta.test.ts
npm run check
npm run build
```

Expected: test PASS, Astro check bez błędów, statyczny `dist/index.html` istnieje.

- [ ] **Step 7: Commit**

```bash
git add .gitignore .env.example .node-version package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts playwright.config.ts wrangler.jsonc src tests/unit/page-meta.test.ts docs/superpowers
git commit -m "chore: bootstrap WWFC Astro site"
```

---

### Task 2: Tokeny wizualne, fonty i współdzielone komponenty

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/components/common/SiteHeader.astro`
- Create: `src/components/common/SiteFooter.astro`
- Create: `src/components/common/ButtonLink.astro`
- Create: `src/components/common/Picture.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Test: `tests/e2e/shell.spec.ts`

**Interfaces:**
- Consumes: `BaseLayout` z Task 1.
- Produces: `SiteHeader`, `SiteFooter`, `ButtonLink`, `Picture` oraz tokeny CSS używane przez wszystkie następne komponenty.

- [ ] **Step 1: Napisz test semantycznego shellu**

`tests/e2e/shell.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('strona ma polski dokument, skip link, jeden h1 i brak overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(page.getByRole('link', { name: 'Przejdź do treści' })).toHaveAttribute('href', '#main');
  await expect(page.locator('h1')).toHaveCount(1);
  const sizes = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth
  }));
  expect(sizes.scroll).toBe(sizes.client);
});
```

- [ ] **Step 2: Uruchom test i potwierdź porażkę na brakującym shellu**

Run: `npm run build`, następnie `npm run test:e2e -- tests/e2e/shell.spec.ts`. Nie nadpisuj viewportu projektu w teście.

Bazowy layout już ma skip link i H1. Dodaj do testu oczekiwanie widocznego logo i nawigacji (po otwarciu menu na mobile), aby jego porażka dotyczyła brakującego shellu, a nie elementów dostarczonych w Task 1.

- [ ] **Step 3: Dodaj system wizualny**

`src/styles/tokens.css` definiuje:

```css
:root {
  --color-ink: #0a0a0a;
  --color-accent: #ff3b12;
  --color-paper: #f3f0e9;
  --color-muted-light: #6b6b6b;
  --color-muted-dark: #b8b8b8;
  --font-display: "Barlow Condensed", sans-serif;
  --font-body: "Inter Variable", sans-serif;
  --content-width: 80rem;
  --space-section: clamp(4rem, 8vw, 8rem);
  --focus-ring: 0 0 0 3px #f3f0e9, 0 0 0 6px #ff3b12;
}
```

`global.css` importuje `@fontsource/barlow-condensed/600.css`, `@fontsource/barlow-condensed/700.css` oraz `@fontsource-variable/inter/index.css`. Uwzględnij zarówno podstawowe znaki łacińskie, jak i polskie glify; nie importuj wyłącznie zakresu Latin Extended. Dodaj reset `box-sizing`, responsywne obrazy, widoczny `:focus-visible`, `overflow-wrap`, cele dotykowe i reduced motion. Sprawdź faktyczny font tekstu „Zażółć gęślą jaźń”. Fontsource dostarcza lokalne zasoby; przeglądarka nie pobiera fontów z Google Fonts.

- [ ] **Step 4: Zbuduj header, footer i prymitywy**

`SiteHeader.astro` renderuje logo tekstowe lub SVG, nawigację do `/grafik/`, `/dyscypliny/`, `/trenerzy/`, `/cennik/`, `/klub/`, `/kontakt/` i przycisk menu z `aria-expanded`. `SiteFooter.astro` renderuje adres, telefon, email, godziny, social media i trzy trasy prawne. `ButtonLink.astro` przyjmuje `href`, `variant: 'primary' | 'secondary'` i slot. `Picture.astro` wymaga `src`, `alt`, `width`, `height` i nie pozwala pominąć tekstu alternatywnego.

- [ ] **Step 5: Uruchom test shellu w sześciu szerokościach**

Uruchom `npm run test:e2e -- tests/e2e/shell.spec.ts`; konfiguracja z Task 1 wykona test przy 320, 360, 390, 768, 1024 i 1440 px.

Expected: PASS we wszystkich projektach; brak poziomego overflow.

- [ ] **Step 6: Commit**

```bash
git add src/styles src/components/common src/layouts/BaseLayout.astro tests/e2e/shell.spec.ts playwright.config.ts
git commit -m "feat: add WWFC visual foundation"
```

---

### Task 3: Osobne Studio i model wersji grafiku

**Files:**
- Create: `studio/package.json`, `studio/package-lock.json`, `studio/sanity.config.ts`, `studio/sanity.cli.ts`.
- Create: `studio/schemas/{index,siteSettings,scheduleRelease,classSession,sessionException,discipline,coach,priceGroup,pricingPage,faqItem,notice}.ts`.
- Create: `src/lib/content/schemas.ts`, `src/lib/content/validate-snapshot.ts`.
- Test: `tests/unit/content-schemas.test.ts`.

**Interfaces:**
- Produces: `ClassSessionSchema`, `SessionExceptionSchema`, `ScheduleReleaseSchema`, `ContentSnapshotSchema` i typy z `z.infer`.
- `ClassSession`: `key, weekday, startTime, endTime, disciplineSlug, coachSlug, room, audience, ageMin, ageMax, level, sortOrder, archived`. Nie przechowuje statusu odwołania.
- `SessionException`: `sessionKey, date, kind: 'cancelled' | 'changed', explanation, replacement?`; replacement może zawierać `startTime, endTime, room, coachSlug`.
- `ScheduleRelease`: `id, title, validFrom, validTo, publicationNote, sessions[], exceptions[], notices[]`; validFrom wymagane, validTo może być null; daty włącznie.
- `ContentSnapshot`: `schemaVersion, source: 'fixture' | 'sanity', perspective: 'published' | 'drafts', fetchedAt, sourceCommit, settings, releases[], disciplines[], coaches[], pricing, faq[]`. Hash liczony z zapisanych bajtów snapshotu trafia do manifestu buildu.

- [ ] **Step 1: Zapisz testy reguł lokalnych**

```ts
const session = {
  key: 'boxing-tuesday', weekday: 2,
  startTime: '18:00', endTime: '19:00',
  disciplineSlug: 'boks', coachSlug: 'norbert-dabrowski',
  room: 'mata-1', audience: 'adults', level: 'intro',
  ageMin: null, ageMax: null, sortOrder: 0, archived: false
};
expect(ClassSessionSchema.safeParse(session).success).toBe(true);
expect(ClassSessionSchema.safeParse({ ...session, endTime: '17:00' }).success).toBe(false);
expect(ClassSessionSchema.safeParse({ ...session, audience: 'children' }).success).toBe(false);
expect(SessionExceptionSchema.safeParse({
  sessionKey: session.key, date: '2026-09-15', kind: 'changed',
  explanation: 'Zastępstwo', replacement: {}
}).success).toBe(false);
```

Dodaj przypadki nieistniejącej daty, wieku min > max, nieznanego klucza zajęć, powtórzonego wyjątku i wyjątku poza okresem lub dniem zajęć. Uruchom testy, potwierdź konkretną brakującą regułę, następnie zaimplementuj enumy, format HH:mm i walidację dat kalendarzowych.

- [ ] **Step 2: Zaimplementuj release jako kolekcję i obiekty należące do wersji**

`scheduleRelease` jest dokumentem kolekcji. `classSession`, `sessionException` i `notice` są typami object w jego tablicach, z własnymi `_key`. Mapowanie do domeny zamienia `_key` na `key`. Kopiowanie okresu tworzy niezależną tablicę sesji; wyjątki i zamknięcia nie są kopiowane automatycznie. Daty obowiązywania są włączne w Europe/Warsaw; validTo może być null, co oznacza okres bez wskazanej daty końcowej. Edytor nie ma skrótu do przenoszenia pojedynczych zajęć na inny dzień; ten wariant pozostaje poza zakresem.

`notice` ma `key, title, message, startDate, endDate, closed`. Zamknięcie ma pierwszeństwo przed zastępstwem. Zmiana godziny zachowuje oryginał w sesji, a nową wartość w replacement. startTime jest wymagane; endTime może być null, jeśli źródło nie podaje zakończenia. Gdy obie godziny są znane, muszą być poprawne i rosnące. Nie domyślaj czasu trwania.

- [ ] **Step 3: Zaimplementuj walidację całego snapshotu**

`validateSnapshot(raw): ContentSnapshot` wykonuje Zod parse, sprawdza unikalność slugów w obrębie typu, referencje i niepokrywające się okresy. W Task 5 rozszerz ten sam walidator o konflikty sal po zastosowaniu wyjątków, korzystając ze wspólnej logiki wystąpień. Sprawdzaj również konflikt zmienionej godziny z inną sesją; odwołane zajęcia nie zajmują sali. Brak bieżącej wersji jest poprawnym stanem; nie rzucaj błędu wyłącznie z powodu wygaśnięcia.

Lokalne reguły powtórz w Studio z polskimi komunikatami. Akcja publikacji z Task 6A uruchamia preflight całego zestawu opublikowanych okresów z podmienianym dokumentem; ostateczną bramką jest ten sam walidator w CI, także dla importów API.

- [ ] **Step 4: Skonfiguruj i zbuduj osobne Studio**

Użyj oficjalnego generatora Sanity w katalogu `studio/`, wybierając istniejący projekt/dataset i TypeScript. Utrwal zależności i lockfile Studio; nie instaluj `@astrojs/react` w publicznym Astro. Singletonami są tylko `siteSettings` i `pricingPage`. Skonfiguruj polską nawigację, role oraz dozwolone origins.

Run: `npm run test:unit -- tests/unit/content-schemas.test.ts`, `npm --prefix studio run build`, `npm run check`.
Expected: walidacje PASS, osobny build Studio PASS, publiczne trasy bez runtime Studio.

- [ ] **Step 5: Commit**

```bash
git add studio src/lib/content tests/unit/content-schemas.test.ts
git commit -m "feat: define dated schedule releases and separate Studio"
```

---

### Task 4: Jeden snapshot treści, wybór wersji i dane testowe

**Files:**
- Create: `src/lib/content/{queries,repository,errors}.ts`.
- Create: `scripts/fetch-content.mjs`, `scripts/build-fixture.mjs`, `scripts/verify-content.mjs`.
- Create: `tests/fixtures/content.ts`, `tests/e2e/fixture-test.ts`.
- Modify: `tests/e2e/shell.spec.ts` — przejście na wspólny import fixture-test.
- Modify: `package.json`.
- Test: `tests/unit/content-repository.test.ts`.

**Interfaces:**
- `createSnapshotRepository(snapshot): ContentRepository` czyta wyłącznie już zwalidowany snapshot; strony nie odpytują ponownie Sanity.
- Repository: `getSiteSettings()`, `getScheduleData(): ScheduleRelease[]`, `getDisciplines()`, `getCoaches()`, `getPricing()`, `getFaq()`.
- `makeSession(overrides?: Partial<ClassSession>): ClassSession`, `makeRelease(overrides?: Partial<ScheduleRelease>): ScheduleRelease`.
- `ContentValidationError` zawiera nazwę sekcji i ścieżkę pola, bez całych odpowiedzi ani tokenów.

- [ ] **Step 1: Napisz test wyboru źródła i walidacji**

```ts
expect(() => createSnapshotRepository(invalidTimeSnapshot))
  .toThrow(ContentValidationError);
const repo = createSnapshotRepository(validSnapshot);
expect(repo.getScheduleData()).toEqual(validSnapshot.releases);
expect(createSnapshotRepository({ ...validSnapshot, releases: [] }).getScheduleData()).toEqual([]);
```

Fixtures definiują wszystkie dane używane przez powyższy test. Sprawdź, że przyszły release pozostaje w payloadzie i że dwa odczyty repository nie wywołują sieci.

- [ ] **Step 2: Pobierz spójny snapshot**

Skrypt `fetch-content.mjs` używa `@sanity/client`, jawnej wersji API, `useCdn: false` i perspektywy `published` dla produkcji lub `drafts` wyłącznie dla chronionego preview. Jedno zapytanie GROQ pobiera ustawienia, wszystkie okresy grafiku oraz potrzebne kolekcje. Projekcja dereferencjonuje dyscypliny i trenerów. Snapshot zapisuje się do `CONTENT_SNAPSHOT_PATH`, po walidacji; token nie jest częścią danych.

Żadna strona Astro nie wybiera najnowszego release przez samo sortowanie `validFrom`. Wszystkie wersje trafiają do logiki domenowej z Task 5. Skrypt verify uruchamia ten sam walidator i daje czytelny raport braków. Brak settings, błędny rekord lub niedostępność CMS blokują build; pusty/przyszły/wygasły grafik daje fallback.

- [ ] **Step 3: Zdefiniuj fixture oraz kontrolowany zegar**

`makeSession` zwraca sesję z przykładu Task 3. `makeRelease` zwraca okres 2026-09-01–2026-09-30, tę sesję oraz puste exceptions/notices. Pełny snapshot fixture obejmuje wszystkie trasy testowe, dodatkową sesję i przyszły październikowy okres.

`scripts/build-fixture.mjs` generuje fixture przez tsx, zapisuje `.cache/fixture.json` i uruchamia Astro z `CONTENT_SNAPSHOT_PATH` oraz `BUILD_NOW=2026-09-08T12:00:00Z`. Skrypt `build:fixture` wywołuje ten plik; manifest otrzymuje `source: fixture`. Import `tests/e2e/fixture-test.ts` rozszerza test Playwright, instalując `page.clock.install({ time: new Date('2026-09-08T12:00:00Z') })` przed nawigacją. Wszystkie testy fixture korzystają z tego importu. Produkcyjny build odrzuca `BUILD_NOW` i snapshot fixture.

- [ ] **Step 4: Zweryfikuj i commit**

Run: `npm run test:unit -- tests/unit/content-repository.test.ts tests/unit/content-schemas.test.ts`, `npm run build:fixture`.
Expected: PASS, brak połączeń do CMS podczas budowania z fixture.

```bash
git add src/lib/content scripts tests/fixtures tests/e2e/fixture-test.ts tests/unit/content-repository.test.ts package.json
git commit -m "feat: build pages from one validated content snapshot"
```

---

### Task 5: Wystąpienia zajęć, daty warszawskie i filtry

**Files:**
- Create: `src/lib/schedule/{types,schedule,filters}.ts`.
- Modify: `src/lib/content/validate-snapshot.ts`, `tests/unit/content-schemas.test.ts`.
- Test: `tests/unit/schedule.test.ts`, `tests/unit/schedule-filters.test.ts`.

**Interfaces:**
- `ScheduleState = { kind: 'active' | 'expired' | 'future' | 'missing'; release: ScheduleRelease | null }`.
- `selectRelease(releases, date: string): ScheduleState` wybiera okres zawierający daną datę; w luce pokazuje brak pokrycia, przed pierwszym okresem future, po ostatnim expired.
- `Occurrence`: `id, releaseId, sessionKey, date, status, explanation, original, effective`. ID jest kombinacją releaseId, sessionKey i daty; original/effective zawierają pola ClassSession.
- `occurrencesForDate(releases, date): Occurrence[]`, `occurrencesForWeek(releases, monday): Occurrence[]`, `upcomingToday(releases, now: Date, limit = 3): Occurrence[]`.
- `dateInWarsaw(date)`, `weekdayInWarsaw(date)`, `sortOccurrences(items)`, `filterOccurrences(items, filters)`, `serializeFilters(filters)`, `parseFilters(searchParams)`.
- `ScheduleFilterState`: opcjonalne `week, day, discipline, audience, age, level, room, coach`. Week to data poniedziałku; day to 1–7.

- [ ] **Step 1: Napisz test jednorazowej zmiany i niezależności kolejnego tygodnia**

```ts
const release = makeRelease({
  exceptions: [{
    sessionKey: 'boxing-tuesday', date: '2026-09-15', kind: 'changed',
    explanation: 'Wyjątkowa godzina', replacement: { startTime: '19:00', endTime: '20:00' }
  }]
});
expect(occurrencesForDate([release], '2026-09-15')[0].effective.startTime).toBe('19:00');
expect(occurrencesForDate([release], '2026-09-15')[0].original.startTime).toBe('18:00');
expect(occurrencesForDate([release], '2026-09-22')[0].effective.startTime).toBe('18:00');
expect(upcomingToday([release], new Date('2026-09-15T18:30:00Z'))).toEqual([]);
```

Dodaj przypadki cancelled, zamknięcia nadrzędnego wobec changed, przyszłego release niewypierającego bieżącego, granic validFrom/validTo oraz braku zajęć. Nie ukrywaj cancelled w pełnym grafiku; wyklucz je tylko z upcomingToday.

- [ ] **Step 2: Napisz testy dat, czasu i URL**

```ts
expect(dateInWarsaw(new Date('2026-09-07T22:30:00Z'))).toBe('2026-09-08');
expect(dateInWarsaw(new Date('2026-01-05T23:30:00Z'))).toBe('2026-01-06');
const filters = { week: '2026-09-14', day: 2, discipline: 'boks', level: 'intro' };
expect(parseFilters(new URLSearchParams(serializeFilters(filters)))).toEqual(filters);
```

Uwzględnij przejścia czasu letniego 2026-03-29 i zimowego 2026-10-25, koniec miesiąca, tydzień na granicy dwóch release oraz niepoprawną datę week. Iteruj po datach kalendarzowych, nie przez dodawanie 24 godzin do warszawskich północy.

- [ ] **Step 3: Uruchom testy, następnie zaimplementuj funkcje**

Selektor nie dopuszcza nakładających się okresów. Rozwiń cykliczną sesję do konkretnej daty, zastosuj wyjątek, potem zamknięcie. Sortuj według daty → effective.startTime → effective.sortOrder; filtry trenera/sali dotyczą effective. `upcomingToday` wymaga aktywnego okresu i godziny rozpoczęcia późniejszej od lokalnej bieżącej godziny; rozpoczęte zajęcia nie są nadchodzące.

Parser ignoruje nieznane wartości, odrzuca nieprawidłowe daty i nie modyfikuje danych CMS. Brak filtra day oznacza pełny tydzień; wybór dnia na mobile jest stanem widoku, nie ukrytym ograniczeniem desktopu. Rozszerz validateSnapshot o konflikty sal dla znanych przedziałów (brak endTime daje ostrzeżenie o niepełnej kontroli, nigdy domyślną godzinę): dozwolony styk końca i początku, niedozwolone przecięcie przedziałów w tej samej sali, wyjątki i zamknięcia uwzględnione. Logika schedule konsumuje typy/schematy i nie importuje validateSnapshot, aby uniknąć cyklu modułów.

- [ ] **Step 4: Weryfikacja i commit**

Run: `npm run test:unit -- tests/unit/schedule.test.ts tests/unit/schedule-filters.test.ts`.
Expected: PASS dla bieżącego, przyszłego, wygasłego okresu i wszystkich wyjątków.

```bash
git add src/lib/schedule src/lib/content/validate-snapshot.ts tests/unit/content-schemas.test.ts tests/unit/schedule.test.ts tests/unit/schedule-filters.test.ts
git commit -m "feat: resolve dated schedule occurrences and filters"
```

---

### Task 6: Responsywna strona grafiku

**Files:**
- Create: `src/components/schedule/ScheduleFilters.astro`
- Create: `src/components/schedule/WeeklyGrid.astro`
- Create: `src/components/schedule/DayTabs.astro`
- Create: `src/components/schedule/DayList.astro`
- Create: `src/components/schedule/SessionDetails.astro`
- Create: `src/components/schedule/ScheduleNotice.astro`
- Create: `src/scripts/schedule.ts`
- Create: `src/styles/schedule.css`
- Create: `src/pages/grafik/index.astro`
- Test: `tests/e2e/schedule.spec.ts`

**Interfaces:**
- Consumes: `ContentRepository`, `Occurrence`, funkcje z `src/lib/schedule` i wszystkie release ze snapshotu.
- Produces: `/grafik/` z tygodniowym gridem ≥ 1024 px, listą dnia < 1024 px i query-string filters.

- [ ] **Step 1: Napisz test pięciu podstawowych zachowań grafiku**

`tests/e2e/schedule.spec.ts` sprawdza: tydzień na desktopie, domyślny dzień warszawski na mobile, filtr dyscypliny, URL, widoczny tekst „Odwołane”, jednorazową zmienioną godzinę, reset, back/forward, brak JS i overflow. Importuj `test` z `./fixture-test`; viewport pochodzi wyłącznie z konfiguracji projektu.

```ts
await page.goto('/grafik/?week=2026-09-14&day=2&discipline=boks');
await expect(page.getByRole('heading', { name: 'Grafik zajęć' })).toBeVisible();
await expect(page.locator('[data-occurrence]:visible')).toHaveCount(2);
await page.getByRole('button', { name: 'Wyczyść filtry' }).click();
await expect(page).toHaveURL(/\/grafik\/$/);
```

- [ ] **Step 2: Uruchom test i potwierdź 404**

Run: `npm run build:fixture`, następnie `npm run test:e2e -- tests/e2e/schedule.spec.ts`.

Expected: FAIL, ponieważ `/grafik/` nie istnieje.

- [ ] **Step 3: Zbuduj semantyczny HTML obu widoków**

`WeeklyGrid.astro` używa tabeli z podpisem konkretnego tygodnia i nagłówkami dnia/godziny, uwzględniając równoległe zajęcia. `DayList.astro` renderuje cały datowany tydzień przed uruchomieniem JS; dopiero udana inicjalizacja wybiera dzień mobile. Tablist ma powiązane tabpanels, aria-selected, tabindex i sterowanie strzałkami. Ukryty wariant desktop/mobile nie jest dostępny dla czytnika ani focusu; identyfikatory szczegółów są unikalne w obu wariantach. Dialog obsługuje Escape, focus początkowy i powrót focusu. Przed JS szczegóły pozostają czytelne inline.

- [ ] **Step 4: Dodaj interakcję bez frameworka**

`schedule.ts` używa współdzielonych funkcji domenowych, kontroluje tydzień i widok dnia oraz aktualizuje URL przy świadomym wyborze przez `history.pushState`; `popstate` odtwarza stan. Canonical pozostaje `/grafik/`. Główne kontrolki: tydzień/dzień, dyscyplina, odbiorcy. Wiek pokazuje się po wyborze dzieci; poziom, sala i trener są pod „Więcej filtrów”. Telefon fallback pochodzi z settings, bez drugiej stałej w kodzie.

Payload zawiera release bieżące i przyszłe. Na starcie, co minutę i po `visibilitychange` przelicz datę, ważność i statusy; zachowaj wybrany historyczny tydzień, jeśli użytkownik wybrał go jawnie. HTML bez JS jest oznaczony datą tygodnia, okresem ważności i czasem snapshotu, z telefonicznym fallbackiem. Nigdy nie opisuj nieważnego snapshotu jako bezwarunkowo aktualnego.

- [ ] **Step 5: Dodaj druk i breakpoint**

`schedule.css` przełącza widoki przy 1024 CSS px. Drukuje dokładnie jeden wariant wybranego tygodnia, okres obowiązywania, wyjątki i dane kontaktowe; usuwa kontrolki i nie dubluje mobile/desktop. Sprawdź wydruk także z filtrem i bez JavaScriptu.

- [ ] **Step 6: Zweryfikuj widoki i dostępność**

Run:

```bash
npm run test:unit -- tests/unit/schedule.test.ts tests/unit/schedule-filters.test.ts
npm run build:fixture
npm run test:e2e -- tests/e2e/schedule.spec.ts
npm run check
```

Expected: wszystkie testy PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/schedule src/scripts/schedule.ts src/styles/schedule.css src/pages/grafik tests/e2e/schedule.spec.ts
git commit -m "feat: build responsive WWFC schedule"
```

---

### Task 6A: Wczesna próba CMS → walidacja → publikacja i chroniony draft preview

**Files:**
- Create: `.github/workflows/publish.yml`, `playwright.production.config.ts`, `tests/e2e/production-smoke.spec.ts`.
- Create: `workers/publishing/src/index.ts`, `workers/publishing/wrangler.jsonc`, `workers/publishing/package.json`, `workers/publishing/package-lock.json`.
- Create: `studio/actions/publishing.ts`, `studio/components/PublicationStatus.tsx`.
- Create: `scripts/write-build-manifest.mjs`, `src/pages/version.json.ts`, `docs/deployment.md`, `docs/editor-guide.md`.
- Modify: `package.json`, `docs/content-inventory.md`.
- Test: `tests/unit/publishing.test.ts`.

**Interfaces:**
- Receiver: `POST /cms` dla podpisanych webhooków; `/preflight`, `/preview`, `/retry`, `/status` dla redaktorów uwierzytelnionych przez Cloudflare Access; `/complete` wymaga osobnego sekretu callback z CI.
- `PublicationStatus`: identyfikator żądania, dataset, target, faza `pending | running | succeeded | failed`, commit, snapshot hash, czas, URL wdrożenia i komunikat błędu bez danych poufnych.
- `BuildManifest`: `source: fixture | published | drafts`, `snapshotHash`, `sourceCommit`, `builtAt`. Publiczny `version.json` zawiera wyłącznie manifest produkcyjny bez identyfikatorów użytkowników i tokenów.

`write-build-manifest.mjs` przed buildem zapisuje `.cache/build-manifest.json` z hashem istniejącego snapshotu i jednym czasem buildu. `src/pages/version.json.ts` renderuje ten manifest statycznie. Po buildzie nie przepisuj version.json innymi wartościami; porównuj plik z manifestem kontrolowanym przez CI. Manifest źródła fixture generuj także dla lokalnych testów, ale nie publikuj go do projektu produkcyjnego.

- [ ] **Step 1: Zbuduj i przetestuj receiver**

Weryfikuj podpis surowego body przez oficjalny helper Sanity, dozwolony project/dataset i zdarzenia publikacji/usunięcia. Dopiero po walidacji wywołuj GitHub workflow dispatch. Powtórzony event ID nie tworzy drugiego żądania; stan i klucze deduplikacji przechowuj w trwałym storage receivera z atomowym zapisem (Durable Object). Usuń klucze starsze niż 7 dni. Wiele różnych zmian może oczekiwać na publikację; ich stan wskazuje odpowiadający workflow, a nie sam fakt przyjęcia webhooka.

Testy: niepoprawny podpis → 401 i zero dispatch; niewłaściwy dataset → odrzucenie; duplikat → jeden dispatch; nieautoryzowany preview/retry/status → brak dostępu; callback bez sekretu → odrzucenie. Dane webhooka nie mogą wybierać repozytorium, gałęzi ani projektu Cloudflare.

Token GitHub App z minimalnymi uprawnieniami do Actions pozostaje sekretem Workera. Ogranicz CORS do Studio, zweryfikuj tożsamość Access i allowlist redaktorów po stronie receivera. `/preflight` ładuje wskazany szkic po ID i opublikowane dokumenty z Sanity przy użyciu serwerowego tokenu odczytu, zastępuje właściwy rekord w kandydacie snapshotu i uruchamia współdzielony validateSnapshot. Nie przyjmuje gotowego snapshotu jako zaufanego od klienta. Dopiero poprawny preflight pozwala akcji Studio wywołać standardową publikację. Sposób działania i sesja Access muszą być sprawdzone w rzeczywistej przeglądarce Studio.

- [ ] **Step 2: Utwórz jeden workflow publikacji**

Źródła wyzwolenia: push chronionej main, PR bez produkcyjnych sekretów, podpisany CMS przez workflow_dispatch, ręczny retry i harmonogram. Fragment konfiguracji:

```yaml
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
    inputs:
      target:
        type: choice
        options: [production, draft-preview]
        default: production
      request_id:
        type: string
  schedule:
    - cron: '*/30 * * * *'
    - cron: '0 22,23 * * *'
```

Produkcja i draft preview mają osobne chronione environments, tokeny i projekty Pages. Workflow odrzuca produkcyjny target dla ref innego niż main. Dla produkcyjnych jobów ustaw stałą grupę concurrency `wwfc-production`, `cancel-in-progress: false`; snapshot pobieraj dopiero po wejściu joba do tej grupy. Nie przypisuj starszego snapshotu do późniejszego joba. Kolejka może scalać oczekujące wyzwolenia; po każdym sukcesie status wskazuje najnowszy wdrożony snapshot, a żądania zastąpione oznacza jako obsłużone przez nowszą publikację.

Kolejność: npm ci → testy jednostkowe → fixture build/E2E → pobranie rzeczywistego snapshotu → walidacja → manifest → build → E2E artefaktu przez Wrangler → upload tego samego dist → smoke URL wdrożenia i porównanie hash → callback. Od Task 12 wymagany jest również Lighthouse i pomiar budżetów. Sprawdź schematyczną kompletność i HTML rzeczywistych tras, bez zależności od nazw fixture. `playwright.production.config.ts` wybiera wyłącznie production-smoke, uruchamia Wrangler lokalnie albo używa jawnego URL po deployu. Użyj `npx playwright test --config playwright.production.config.ts`; job udostępnia sekret Access service token wyłącznie zaufanym testom chronionego preview.

Wczesna bramka dopuszcza tylko fundament i grafik na chronionym środowisku próbnym. Produkcyjny DNS cutover wymaga wszystkich późniejszych zadań. Wyłącz buildy Pages Git i Deploy Hooks; używaj jedynie `wrangler pages deploy dist`. Błąd przed uploadem nie może publikować artefaktu. Test po uploadzie potwierdza dostępność; po niepowodzeniu uruchom opisany rollback i zgłoś niepowodzenie. Harmonogram to best-effort; poprawność dat w otwartej przeglądarce zapewnia również logika z Task 6.

- [ ] **Step 3: Skonfiguruj statyczny podgląd szkiców**

Osobny projekt Pages draft-preview zabezpiecz Cloudflare Access na domenie własnej oraz wszystkich deployment hostnames. Brak skutecznej ochrony dowolnego adresu blokuje publikowanie szkiców. Endpoint preview wymaga uprawnionego redaktora i dispatchuje workflow z perspektywą `drafts`; token odczytu istnieje wyłącznie w CI. Nie zapisuj szkiców jako publicznych artefaktów Actions. Dodaj noindex, czas snapshotu oraz wyłącz GA4, zapis newslettera i rzeczywistą wysyłkę formularza.

Test anonimowy każdego typu URL ma kończyć się logowaniem/odmową, bez treści szkicu. Zalogowany redaktor widzi zmianę przed jej publikacją. Preview PR z opublikowanych danych pozostaje osobną funkcją. Nie obiecuj live visual editing.

- [ ] **Step 4: Przeprowadź wczesny odbiór z redaktorem**

Na dataset/projekcie próbnym wprowadź zatwierdzony grafik, potem jednorazowo zmień 15 września 18:00 na 19:00. Sprawdź draft preview, opublikuj, poczekaj na status succeeded, porównaj hash i widoczną godzinę na mobile. Potwierdź, że 22 września nadal ma 18:00. Przywróć dane i ponownie zweryfikuj. Zasymuluj błąd walidacji oraz wygaśnięcie okresu; poprzednie wdrożenie pozostaje dostępne, a stan błędu jest czytelny. Zmierz czas obu udanych publikacji i zapisz wyniki.

**Bramka:** Task 7 zaczyna się po tej próbie. Brak kont lub uprawnień oznacza otwartą zależność integracyjną, nigdy deklarację sukcesu na podstawie mocków.

- [ ] **Step 5: Zapisz instrukcje i commit**

Instrukcje obejmują logowanie, preview, publikację, oczekiwanie na status, retry, alarm do opiekuna i rollback. Użyj rzeczywistych pomiarów zamiast obietnicy 1–2 minut.

```bash
git add .github workers studio/actions studio/components scripts/write-build-manifest.mjs src/pages/version.json.ts playwright.production.config.ts tests/e2e/production-smoke.spec.ts tests/unit/publishing.test.ts docs package.json
git commit -m "feat: verify early editorial publishing and protected previews"
```

---

### Task 7: Zatwierdzona strona główna

**Files:**
- Create: `src/components/home/Hero.astro`
- Create: `src/components/home/TodaysClasses.astro`
- Create: `src/components/home/AudiencePaths.astro`
- Create: `src/components/home/DisciplineGrid.astro`
- Create: `src/components/home/ClubProof.astro`
- Create: `src/components/home/FirstTrainingSteps.astro`
- Create: `src/components/home/HomeLinks.astro`
- Create: `src/scripts/todays-classes.ts`
- Create: `src/styles/home.css`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `ScheduleRelease[]`, `upcomingToday`, `ButtonLink`, `Picture`.
- Produces: pełną stronę `/` w zatwierdzonej kolejności i maksymalnie trzy najbliższe zajęcia dnia.

- [ ] **Step 1: Napisz test kolejności i ścieżek użytkownika**

Test sprawdza dostępność grafiku, pierwszego treningu i czterech ścieżek odbiorców. Odbiór wizualny sprawdza zatwierdzoną hierarchię sekcji; test funkcjonalny nie utrwala tablicy identyfikatorów DOM.

```ts
await expect(page.getByRole('link', { name: 'Sprawdź grafik', exact: true }).first()).toBeVisible();
await page.getByRole('link', { name: 'Sprawdź grafik', exact: true }).first().click();
await expect(page.getByRole('heading', { name: 'Grafik zajęć' })).toBeVisible();
```

- [ ] **Step 2: Uruchom test i potwierdź porażkę struktury**

Run: `npm run test:e2e -- tests/e2e/home.spec.ts`

Expected: FAIL, ponieważ strona zawiera wyłącznie fundament z Task 1.

- [ ] **Step 3: Zbuduj komponenty strony głównej**

Hero zawiera H1 „Wejdź na matę”, lokalizację, opis, zdjęcie z poprawnymi wymiarami i dwa CTA. `AudiencePaths` prowadzi do `/pierwszy-trening/`, `/dzieci/`, `/dla-kobiet/`, `/grafik/?level=intermediate`. `DisciplineGrid` prowadzi do dynamicznych tras dyscyplin. `ClubProof` używa wyłącznie zweryfikowanych wartości z CMS.

- [ ] **Step 4: Zaimplementuj „Dzisiaj w WWFC”**

`todays-classes.ts` wywołuje `upcomingToday(releases, now, 3)`. Uwzględnia aktualną datę i godzinę Warszawy, release, wyjątki i zamknięcia. Wyklucza rozpoczęte oraz odwołane zajęcia; zmienione pokazuje według effective. Przelicza na starcie, co minutę i po powrocie do karty. Po ostatnich zajęciach pokazuje „Na dziś to już wszystkie zajęcia”; przy braku zajęć, zamknięciu lub nieważnym grafiku wyświetla odrębny komunikat i link do grafiku. Bez JS pozostaje link i datowana informacja, bez błędnej listy „dzisiejszych” zajęć. Nie renderuj całego tygodnia jako widocznej listy na home.

Dodaj testy z zegarem przed zajęciami, po rozpoczęciu, po ostatnich zajęciach, po północy i po wygaśnięciu release; sprawdź zmianę daty bez ponownego buildu.

- [ ] **Step 5: Zweryfikuj projekt i budżet transferu**

Run:

```bash
npm run test:e2e -- tests/e2e/home.spec.ts
npm run build
```

Expected: PASS; `dist/index.html` zawiera jeden H1, a obrazy poniżej hero mają `loading="lazy"`.

- [ ] **Step 6: Commit**

```bash
git add src/components/home src/scripts/todays-classes.ts src/styles/home.css src/pages/index.astro tests/e2e/home.spec.ts
git commit -m "feat: implement approved WWFC homepage"
```

---

### Task 8: Podstrony oferty, trenerów, klubu, cen i FAQ

**Files:**
- Create: `src/components/content/CardGrid.astro`
- Create: `src/components/content/CoachCard.astro`
- Create: `src/components/content/PriceTable.astro`
- Create: `src/components/content/FaqList.astro`
- Create: `src/pages/dyscypliny/index.astro`
- Create: `src/pages/dyscypliny/[slug].astro`
- Create: `src/pages/trenerzy/index.astro`
- Create: `src/pages/trenerzy/[slug].astro`
- Create: `src/pages/pierwszy-trening.astro`
- Create: `src/pages/dzieci.astro`
- Create: `src/pages/dla-kobiet.astro`
- Create: `src/pages/klub.astro`
- Create: `src/pages/cennik.astro`
- Create: `src/pages/faq.astro`
- Test: `tests/e2e/content-routes.spec.ts`

**Interfaces:**
- Consumes: metody repository `getDisciplines()`, `getCoaches()`, `getPricing()`, `getFaq()`.
- Produces: statyczne trasy i `getStaticPaths()` dla dyscyplin oraz trenerów.

- [ ] **Step 1: Napisz test kompletności tras**

Test otwiera dokładnie `/dyscypliny/`, `/pierwszy-trening/`, `/dzieci/`, `/dla-kobiet/`, `/trenerzy/`, `/klub/`, `/cennik/` i `/faq/`, oczekuje statusu 200, jednego H1, canonicala non-www i linku do grafiku. Następnie otwiera pierwszą trasę dyscypliny i trenera zwróconą przez fixture content. `/kontakt/` powstaje w Task 9, a trasy prawne w Task 10.

- [ ] **Step 2: Uruchom test i potwierdź brak tras**

Run: `npm run test:e2e -- tests/e2e/content-routes.spec.ts`

Expected: FAIL na `/dyscypliny/`.

- [ ] **Step 3: Zaimplementuj listy i dynamiczne strony**

`[slug].astro` eksportuje `getStaticPaths`, które mapuje rekordy CMS do `{ params: { slug }, props: { item } }`. Nie znaleziony lub pusty slug nie generuje strony. Każda strona dyscypliny pokazuje odbiorców, poziomy, wymagania, właściwych trenerów i link do `/grafik/?discipline=<slug>`.

- [ ] **Step 4: Zaimplementuj strony odbiorców i „pierwszy trening”**

`dzieci.astro` filtruje grupy wiekowe, `dla-kobiet.astro` filtruje audience `women`, a `pierwszy-trening.astro` przedstawia wybór `INTRO` oraz zatwierdzone zasady przyjścia, stroju i sprzętu. Nie utrwalaj „15 minut wcześniej” bez potwierdzenia klubu. Każda strona pokazuje pasujące datowane zajęcia lub prowadzi drugim działaniem do odpowiednio filtrowanego grafiku. W razie pustego dzisiejszego dnia pokaż pasujące terminy tygodnia zamiast wymagać zgadywania dnia. Żadna strona nie sugeruje rezerwacji miejsca.

- [ ] **Step 5: Zaimplementuj klub, cennik i FAQ**

`PriceTable.astro` używa semantycznej tabeli z `<caption>`. `FaqList.astro` używa natywnych `<details><summary>`. `klub.astro` prezentuje realne fotografie i zweryfikowane parametry obiektu; nie używa renderów.

- [ ] **Step 6: Zweryfikuj trasy**

Run:

```bash
npm run test:e2e -- tests/e2e/content-routes.spec.ts
npm run check
npm run build
```

Expected: wszystkie publiczne trasy powstają w `dist` i test PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/content src/pages tests/e2e/content-routes.spec.ts
git commit -m "feat: add WWFC content routes"
```

---

### Task 9: Formularz kontaktowy i osobny newsletter

**Files:**
- Create: `src/lib/contact/schema.ts`
- Create: `src/lib/contact/handler.ts`
- Create: `functions/api/contact.ts`
- Create: `src/components/forms/ContactForm.astro`
- Create: `src/components/forms/NewsletterForm.astro`
- Create: `src/scripts/contact-form.ts`
- Create: `src/pages/kontakt.astro`
- Test: `tests/unit/contact-handler.test.ts`
- Test: `tests/e2e/contact.spec.ts`

**Interfaces:**
- Produces: `ContactPayloadSchema`, `handleContact(request, env): Promise<Response>`.
- Consumes: `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`, `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `MAILERLITE_FORM_ACTION`.

- [ ] **Step 1: Napisz testy payloadu i handlera**

Testy obejmują: poprawny email, poprawny telefon bez emaila, brak kanału kontaktu, niepoprawny Turnstile, błąd Resend i sukces 200. Mock `fetch` musi potwierdzić, że wiadomość idzie wyłącznie do `biuro@wwfc.com.pl`.

```ts
expect(ContactPayloadSchema.safeParse({
  name: 'Jan Kowalski',
  email: 'jan@example.com',
  phone: '',
  message: 'Czy mogę przyjść na boks dla początkujących?',
  turnstileToken: 'valid-token'
}).success).toBe(true);
```

- [ ] **Step 2: Uruchom test i potwierdź porażkę importu**

Run: `npm run test:unit -- tests/unit/contact-handler.test.ts`

Expected: FAIL, ponieważ handler nie istnieje.

- [ ] **Step 3: Zaimplementuj walidację i wysyłkę**

`ContactPayloadSchema` wymaga imienia, wiadomości 10–2000 znaków oraz co najmniej jednego poprawnego kanału odpowiedzi. `handleContact` weryfikuje Turnstile przez `https://challenges.cloudflare.com/turnstile/v0/siteverify`, następnie wysyła przez `https://api.resend.com/emails`; nie loguje treści wiadomości.

Mapuj standardowe pole FormData `cf-turnstile-response` na `turnstileToken`. Po zużyciu lub wygaśnięciu tokenu zresetuj widget przed retry, zachowując pozostałe pola. Dodaj test rzeczywistego POST do `/api/contact` uruchomionego przez Wrangler; tylko transporty zewnętrzne Turnstile/Resend zastąp kontrolowanym transportem testowym w lokalnym runtime. Flaga testowa nie może być aktywna na produkcji. Oddzielnie wykonaj jedną autoryzowaną próbę realnej dostawy podczas odbioru.

Ładuj Turnstile po rozpoczęciu interakcji z formularzem, aby nie obciążał pierwszego renderu. Gotowość widgetu ma czytelny stan; wysyłka czeka na token. Test budżetu początkowego i test działającego formularza obejmują oba stany.

- [ ] **Step 4: Dodaj formularz dostępny bez utraty danych**

Formularz ma etykiety, `autocomplete`, `aria-describedby`, kontener `aria-live="polite"` i oddzielne komunikaty pól. `contact-form.ts` wysyła `FormData`, czyści pola dopiero po 200 i zachowuje wartości po 400, 422, 429 lub 503. Fallback zawiera telefon i `mailto:`.

- [ ] **Step 5: Dodaj osobny newsletter**

`NewsletterForm.astro` publikuje wyłącznie email oraz nie zaznaczony domyślnie checkbox zgody newsletterowej do `MAILERLITE_FORM_ACTION`. Nie używa zgody kontaktowej i nie blokuje formularza kontaktowego.

- [ ] **Step 6: Zweryfikuj jednostkowo i E2E**

Run:

```bash
npm run test:unit -- tests/unit/contact-handler.test.ts
npm run test:e2e -- tests/e2e/contact.spec.ts
```

Expected: wszystkie przypadki PASS, w tym zachowanie danych po zasymulowanym 503.

- [ ] **Step 7: Commit**

```bash
git add functions src/lib/contact src/components/forms src/scripts/contact-form.ts src/pages/kontakt.astro tests/unit/contact-handler.test.ts tests/e2e/contact.spec.ts
git commit -m "feat: add contact and newsletter forms"
```

---

### Task 10: Zgody, analityka i prywatne osadzanie multimediów

**Files:**
- Create: `src/lib/consent/state.ts`
- Create: `src/components/common/ConsentBanner.astro`
- Create: `src/components/common/DeferredVideo.astro`
- Create: `src/scripts/consent.ts`
- Create: `src/scripts/deferred-video.ts`
- Create: `src/pages/polityka-prywatnosci.astro`
- Create: `src/pages/polityka-cookies.astro`
- Create: `src/pages/regulamin.astro`
- Test: `tests/unit/consent.test.ts`
- Test: `tests/e2e/consent.spec.ts`

**Interfaces:**
- Produces: `ConsentState`, `readConsent(storage)`, `writeConsent(storage, state)`, `loadGa4()`.
- Produces: zdarzenie `wwfc:consent-changed` z `{ analytics: boolean }`.

- [ ] **Step 1: Napisz testy wersjonowanego stanu zgody**

```ts
const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key)
};

expect(readConsent(storage)).toBeNull();
writeConsent(storage, { version: 1, analytics: false, decidedAt: '2026-09-08T12:00:00.000Z' });
expect(readConsent(storage)?.analytics).toBe(false);
```

- [ ] **Step 2: Uruchom test i potwierdź porażkę importu**

Run: `npm run test:unit -- tests/unit/consent.test.ts`

Expected: FAIL, ponieważ `state.ts` nie istnieje.

- [ ] **Step 3: Zaimplementuj consent state i banner**

Banner oferuje „Akceptuję analitykę”, „Tylko niezbędne” i link do ustawień. Bez decyzji nie powstaje request do `googletagmanager.com`. Zgoda ładuje `gtag.js?id=G-FK4R4J6S63` i ustawia Consent Mode; odmowa zapisuje wyłącznie lokalną decyzję.

Ustawienia są dostępne także w stopce. Test obejmuje wycofanie uprzedniej zgody: zatrzymanie dalszych zdarzeń analitycznych, aktualizację stanu i usunięcie własnych cookies analitycznych. Draft preview ma analitykę wyłączoną niezależnie od zapisanej zgody.

- [ ] **Step 4: Zaimplementuj DeferredVideo**

Komponent renderuje lokalny poster, tytuł, opis i przycisk „Odtwórz film na YouTube”. Dopiero kliknięcie tworzy iframe `youtube-nocookie.com` z opisowym `title`; film nie autoplayuje przed kliknięciem.

- [ ] **Step 5: Dodaj zatwierdzone treści prawne jako oddzielne strony**

Każda trasa prawna ma własny H1, datę wersji, poprawny canonical i linki wzajemne. Treść pochodzi z zatwierdzonych materiałów operatora i nie wskazuje pliku WWTC jako polityki WWFC.

- [ ] **Step 6: Zweryfikuj brak requestu GA4 przed zgodą**

Run: `npm run test:e2e -- tests/e2e/consent.spec.ts`

Expected: przed zgodą zero requestów do Google; po akceptacji dokładnie jeden loader GA4; po odmowie nadal zero.

- [ ] **Step 7: Commit**

```bash
git add src/lib/consent src/components/common/ConsentBanner.astro src/components/common/DeferredVideo.astro src/scripts/consent.ts src/scripts/deferred-video.ts src/pages/polityka-prywatnosci.astro src/pages/polityka-cookies.astro src/pages/regulamin.astro tests/unit/consent.test.ts tests/e2e/consent.spec.ts
git commit -m "feat: add consent-aware analytics and media"
```

---

### Task 11: SEO lokalne, dane strukturalne, 404 i nagłówki bezpieczeństwa

**Files:**
- Create: `src/lib/seo/health-club.ts`
- Create: `src/lib/seo/breadcrumbs.ts`
- Create: `src/components/seo/JsonLd.astro`
- Create: `src/pages/robots.txt.ts`
- Create: `src/pages/404.astro`
- Create: `public/_headers`
- Create: `tests/unit/structured-data.test.ts`
- Create: `tests/e2e/seo.spec.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `astro.config.mjs`

**Interfaces:**
- Produces: `buildHealthClubJsonLd(settings): HealthClubJsonLd`, `buildBreadcrumbJsonLd(items)`.
- Consumes: zweryfikowane `siteSettings` z CMS.

- [ ] **Step 1: Napisz test danych HealthClub**

Test wymaga `@context`, `@type: 'HealthClub'`, nazwy, pełnego adresu, `geo`, telefonu, emaila, `openingHoursSpecification`, kanonicznego URL i zweryfikowanego `sameAs`.

- [ ] **Step 2: Uruchom test i potwierdź porażkę importu**

Run: `npm run test:unit -- tests/unit/structured-data.test.ts`

Expected: FAIL, ponieważ `health-club.ts` nie istnieje.

- [ ] **Step 3: Zaimplementuj bezpieczną serializację JSON-LD**

`JsonLd.astro` serializuje dane przez `JSON.stringify(data).replace(/</g, '\\u003c')`. `buildHealthClubJsonLd` nie publikuje pustych social links ani niezweryfikowanych godzin. Home i kontakt osadzają `HealthClub`; podstrony osadzają breadcrumbs.

- [ ] **Step 4: Dodaj robots, 404 i metadane**

`robots.txt.ts` zwraca `User-agent: *`, `Allow: /`, `Sitemap: https://wwfc.com.pl/sitemap-index.xml`. Studio ma osobny host; publiczna witryna nie ma trasy `/studio/`. Strona 404 ma `robots="noindex,follow"`, link do grafiku i kontaktu; żądanie nieistniejącej trasy musi zwrócić HTTP 404. Sitemap pomija 404 i techniczny version.json. Każda publiczna strona treści ma własne metadane; warianty filtrów mają canonical `/grafik/`.

- [ ] **Step 5: Dodaj nagłówki Cloudflare**

`public/_headers` zawiera:

```text
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://dashboard.mailerlite.com; img-src 'self' data: https://cdn.sanity.io https://i.ytimg.com; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com; connect-src 'self' https://*.api.sanity.io wss://*.api.sanity.io https://challenges.cloudflare.com https://www.google-analytics.com; frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com; upgrade-insecure-requests
```

Powyższy zestaw jest bazą do weryfikacji, nie gotową allowlistą produkcyjną. Usuń domeny Sanity z connect-src publicznej witryny, ponieważ CMS jest pobierany w CI. Dopasuj form-action do faktycznego action zatwierdzonego formularza MailerLite, domeny GA4 do faktycznych żądań i dodaj hashe wymaganych skryptów inline z artefaktu; nie rozwiązuj błędów przez globalne script-src unsafe-inline. Zweryfikuj CSP na gotowej stronie w Cloudflare, również po zgodzie, uruchomieniu filmu i wysłaniu formularza. Osobne Studio ma własną politykę. Nagłówki odpowiedzi Functions ustawiaj w handlerze; nie zakładaj, że public/_headers obejmuje endpoint API. Resend jest wywoływany wyłącznie po stronie serwera.

- [ ] **Step 6: Zweryfikuj SEO i brak błędnych linków**

Run:

```bash
npm run test:unit -- tests/unit/structured-data.test.ts
npm run test:e2e -- tests/e2e/seo.spec.ts
npm run build
rg -n "xn--zacz-etam|wwtc\.pl.*Regulamin" dist
```

Expected: testy PASS; ostatnia komenda nie zwraca wyniku.

- [ ] **Step 7: Commit**

```bash
git add src/lib/seo src/components/seo src/pages/robots.txt.ts src/pages/404.astro src/layouts/BaseLayout.astro astro.config.mjs public/_headers tests/unit/structured-data.test.ts tests/e2e/seo.spec.ts
git commit -m "feat: add local SEO and security controls"
```

---

### Task 12: Pełna dostępność, scenariusze użytkowników i budżety wydajności

**Files:**
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/user-journeys.spec.ts`
- Create: `tests/e2e/responsive.spec.ts`
- Create: `lighthouserc.cjs`
- Create: `scripts/measure-assets.mjs`
- Modify: `.github/workflows/publish.yml`
- Modify: komponenty wskazane przez testy wyłącznie w celu usunięcia wykrytych naruszeń

**Interfaces:**
- Consumes: wszystkie publiczne trasy.
- Produces: automatyczną bramkę jakości przed wdrożeniem.

- [ ] **Step 1: Dodaj axe do reprezentatywnych tras**

Test iteruje po `/`, `/grafik/`, `/dyscypliny/boks/`, `/trenerzy/norbert-dabrowski/`, `/cennik/`, `/kontakt/`, uruchamia `new AxeBuilder({ page }).analyze()` i wymaga braku `critical` oraz `serious` violations. To zestaw fixture; test produkcyjny dobiera istniejące slugi ze snapshotu. Automatyczny wynik axe nie jest deklaracją pełnej zgodności WCAG — wykonaj też ręczny odbiór ze specyfikacji.

- [ ] **Step 2: Dodaj pięć scenariuszy użytkowników**

Playwright sprawdza pięć ścieżek określonych w Task 0, od home do widocznej godziny w maksymalnie dwóch działaniach nawigacyjnych. Testy wyboru dodatkowego wieku/poziomu oraz czytania wskazówek są osobne. Sprawdź też odbiorcę bez zajęć dzisiaj — musi zobaczyć najbliższe pasujące dni bez przeklikiwania całego tygodnia.

- [ ] **Step 3: Dodaj test overflow i focus dla wszystkich breakpointów**

Test iteruje wyłącznie po trasach; szerokości 320, 360, 390, 768, 1024 i 1440 pochodzą z projektów Playwright. Nie twórz drugiej pętli viewportów ani setViewportSize w środku testu. Porównaj scrollWidth/clientWidth; przejdź przez header, filtry, szczegóły i formularz klawiszem Tab i sprawdź widoczny focus.

- [ ] **Step 4: Skonfiguruj Lighthouse CI**

`lighthouserc.cjs`:

```js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview:pages',
      numberOfRuns: 3,
      url: [
        'http://127.0.0.1:8788/',
        'http://127.0.0.1:8788/grafik/',
        'http://127.0.0.1:8788/dyscypliny/boks/',
        'http://127.0.0.1:8788/trenerzy/norbert-dabrowski/',
        'http://127.0.0.1:8788/cennik/',
        'http://127.0.0.1:8788/kontakt/'
      ]
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-byte-weight': ['error', { maxNumericValue: 1500000 }]
      }
    }
  }
};
```

Powyższe URL są dla fixture. Przed pomiarem rzeczywistego artefaktu generuj listę reprezentatywnych tras z tego samego snapshotu; nie zakładaj istnienia przykładowego trenera. E2E i Lighthouse uruchamiaj sekwencyjnie, zwalniając port po zakończeniu. Lighthouse sprawdza warunki laboratoryjne; INP i percentyle ruchu rzeczywistego oceniaj po uruchomieniu, gdy dostępna jest wystarczająca próbka.

`measure-assets.mjs` odczytuje zasoby JS faktycznie ładowane przez reprezentatywne trasy przed zgodą, deduplikuje URL i liczy gzip; kod 1 przy przekroczeniu 75 KB. Osobno sprawdza transfer home ≤ 1,5 MB oraz zapisuje koszty po zgodzie. Skrypt `test:assets` wywołuje ten pomiar na gotowym dist przez lokalny serwer. Dodaj Lighthouse i test:assets do publish.yml przed uploadem; nie buduj ponownie po tych testach.

- [ ] **Step 5: Uruchom pełną bramkę jakości i popraw konkretne naruszenia**

Run:

```bash
npm run check
npm run test:unit
npm run build:fixture
npm run test:e2e
npm run test:lighthouse
npm run test:assets
```

Expected: wszystkie polecenia kończą się kodem 0; brak naruszeń axe `critical` lub `serious`; wszystkie progi Lighthouse spełnione.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e lighthouserc.cjs scripts/measure-assets.mjs .github/workflows/publish.yml package.json src
git commit -m "test: enforce WWFC accessibility and performance budgets"
```

---

### Task 13: Końcowa migracja, rozszerzenie działającego CI i odbiór uruchomienia

**Files:**
- Create: `scripts/import-content.mjs`
- Modify: `scripts/verify-content.mjs`
- Modify: `docs/content-inventory.md`
- Modify: `docs/editor-guide.md`
- Modify: `docs/deployment.md`
- Modify: `.github/workflows/publish.yml`
- Modify: `package.json`
- Test: `tests/unit/content-migration.test.ts`

**Interfaces:**
- Consumes: eksport zatwierdzonych danych WWFC oraz schematy z Task 3.
- Produces: powtarzalny import Sanity, raport braków i końcowy odbiór workflow, który działa od Task 6A. Nie twórz drugiej ścieżki publikacji.

- [ ] **Step 1: Napisz test normalizacji treści migracyjnej**

Test sprawdza polskie slugi, alt dla zdjęć informacyjnych, celowo puste alt dla dekoracji, niepublikowanie przeterminowanego komunikatu wakacyjnego i brak błędnego linku WWTC. Osobno potwierdza, że poprawny, lecz wygasły release przechodzi walidację i daje stan expired, a nakładające się okresy są odrzucane.

- [ ] **Step 2: Uruchom test i potwierdź porażkę importu**

Run: `npm run test:unit -- tests/unit/content-migration.test.ts`

Expected: FAIL, ponieważ moduł migracji nie istnieje.

- [ ] **Step 3: Zaimplementuj import i weryfikację**

`import-content.mjs` przyjmuje ścieżkę do zatwierdzonego JSON, waliduje rekordy i używa transakcji Sanity z deterministycznymi `_id` oraz `_key`. Nie współdzieli obiektów sesji między release. Przed zapisem wykonuje dry-run z raportem zmienianych rekordów; token importu ma zapis wyłącznie do właściwego datasetu i nie jest tokenem buildu. Powtórny import tych samych danych nie tworzy duplikatów.

`verify-content.mjs` z Task 4 kończy się kodem 1 dla błędnego schematu, nieprawidłowych referencji, nakładających się okresów, kolizji sal, brakującego alt zdjęcia informacyjnego, pustego telefonu, nieunikalnego sluga w danym typie lub błędnego linku prawnego. Brak/wygaśnięcie/przyszłe pokrycie grafiku to ostrzeżenie i fallback, nie błąd walidacji. Odbiór pierwszego uruchomienia wymaga jednak aktualnego zatwierdzonego grafiku.

- [ ] **Step 4: Uzupełnij istniejącą bramkę CI**

Workflow publish.yml z Task 6A instaluje z lockfile i uruchamia wymagane kontrole: check, unit, fixture build/E2E, pobranie jednego rzeczywistego snapshotu, walidację, build, E2E rzeczywistego artefaktu, Lighthouse, budżety zasobów i audit. Produkcyjny job sprawdza `source: sanity` i `perspective: published`, odrzuca stały zegar testowy, dopiero potem uploaduje dokładnie ten dist. Zależności Studio i Workera mają osobne kontrole typów, build i audit z własnych lockfile. Kod PR nie otrzymuje produkcyjnych ani draftowych sekretów. Nie używaj pull_request_target do uruchamiania niezaufanego kodu PR.

- [ ] **Step 5: Zapisz instrukcje operacyjne**

Rozszerz editor-guide.md o kopiowanie okresu, jednorazowy wyjątek, zamknięcie klubu, preview szkicu, rozróżnienie „opublikowano w CMS” i „wdrożono na stronie”, status błędu i retry. Czas publikacji podaj na podstawie pomiarów obu prób, bez gwarancji 1–2 minut.

deployment.md opisuje Sanity → podpisany receiver → GitHub Actions → upload Cloudflare Pages, strefy sekretów, serializację jobów, best-effort harmonogram, ochronę wszystkich hostname preview, alarmy oraz rollback do ostatniego poprawnego deploymentu. Zapisz wpływ rollbacku: cofnięcie strony nie cofa danych CMS; przed kolejną publikacją trzeba naprawić źródło błędu. Dodaj rekordy DNS, www → non-www, testy smoke i odpowiedzialnego opiekuna z procedurą zastępstwa.

- [ ] **Step 6: Powtórz próbę publikacji z kompletną stroną**

Na próbnym datasecie z zatwierdzoną kopią prawdziwych danych powtórz scenariusz Task 6A. Nie edytuj fixture używanych przez CI ani produkcyjnego grafiku w celu testu. Sprawdź zmianę jednej daty, niezmieniony następny tydzień, szkic niewidoczny anonimowo, poprawny hash po publikacji, failure i rollback. Przywróć dane i zapisz czasy, wynik oraz osobę wykonującą próbę w content-inventory.md.

- [ ] **Step 7: Uruchom końcową weryfikację**

Run:

```bash
npm run check
npm run test:unit
npm run build:fixture
npm run test:e2e
npm run test:lighthouse
npm run test:assets
npm audit --audit-level=high
```

Expected: lokalna bramka fixture kończy się kodem 0. Następnie uruchom istniejący publish.yml na właściwym środowisku; wymagaj zielonych kontroli rzeczywistego snapshotu, wszystkich publicznych tras treści, poprawnego kodu 404 i zgodnego manifestu po wdrożeniu. Zielone testy fixture nie są dowodem poprawności wdrożenia produkcyjnego.

- [ ] **Step 8: Commit**

```bash
git add scripts docs .github/workflows/publish.yml package.json package-lock.json tests/unit/content-migration.test.ts
git commit -m "docs: add WWFC publishing and launch workflow"
```

---

## Końcowy odbiór przed DNS cutover

- [ ] WWFC zatwierdza teksty, ceny, grafik, zdjęcia, trenerów, godziny i dokumenty prawne.
- [ ] Redaktor WWFC samodzielnie publikuje jedną zmianę grafiku w preview.
- [ ] Wczesna próba z Task 6A i końcowa próba z Task 13 mają zapisane wyniki i czasy.
- [ ] Odwołanie/zmiana dotyczy tylko wskazanej daty; przyszły release nie zmienia bieżącego.
- [ ] Po ostatnich zajęciach, o północy i po wygaśnięciu okresu pojawia się poprawny komunikat, również bez nowej publikacji CMS.
- [ ] Desktop pokazuje cały tydzień, mobile bieżący dzień; fallback bez JS zawiera datowany tydzień.
- [ ] Draft preview jest chroniony na każdym hostname; produkcja nigdy nie przyjmuje fixture ani drafts.
- [ ] Publish.yml publikuje sprawdzony artefakt; status redaktora odpowiada wdrożonemu hash, a błąd walidacji pozostawia poprzedni deployment.
- [ ] Formularz dostarcza testową wiadomość do `biuro@wwfc.com.pl` bez utrwalenia jej w Sanity.
- [ ] Newsletter zapisuje testowy adres wyłącznie po osobnej zgodzie.
- [ ] GA4 nie wysyła żądań przed zgodą analityczną.
- [ ] Wszystkie testy automatyczne, testy urządzeń fizycznych i smoke testy przechodzą.
- [ ] Cloudflare ma aktywny redirect `www.wwfc.com.pl` → `https://wwfc.com.pl/`.
- [ ] Po zmianie DNS sprawdzone są `/`, `/grafik/`, `/kontakt/`, formularz, sitemap, robots, canonical i 404.
- [ ] Stara wersja MailerLite pozostaje dostępna do szybkiego rollbacku przez 7 dni po uruchomieniu.

## Źródła decyzji technicznych

- [Barlow Condensed — poprawny pakiet statyczny](https://fontsource.org/fonts/barlow-condensed/install).
- [Sanity Studio w Astro — wymagania osadzenia i możliwość osobnego hostowania](https://www.sanity.io/docs/astro/embedding-studio-in-astro).
- [Cloudflare Pages Functions — testowanie przez Wrangler](https://developers.cloudflare.com/pages/functions/local-development/).
- [Cloudflare Deploy Hooks — uruchamianie buildu, bez powiązania z osobną bramką GitHub](https://developers.cloudflare.com/pages/configuration/deploy-hooks/).
- [Cloudflare — wdrażanie gotowego artefaktu z CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).
- [Sanity — podpisane webhooki](https://www.sanity.io/docs/content-lake/webhooks).
- [Turnstile — walidacja i jednorazowość tokenów](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
