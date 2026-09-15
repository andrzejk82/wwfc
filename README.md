# WWFC

Statyczna strona Astro z grafikiem zajęć i osobnym panelem Sanity. Docelowy hosting: Cloudflare Pages Direct Upload. Podgląd szkiców online jest wyłączony; Zero Trust nie jest wymagany w obecnym wariancie.

## Lokalnie

Wymagany Node.js 22.23.2.

```sh
npm ci
npm ci --prefix studio
npm ci --prefix workers/publishing
npm run build:fixture
npm run dev
```

Panel redakcyjny: `npm run studio:dev`. Konfigurację lokalną przygotuj na podstawie `.env.example`; sekretów nie dodawaj do Git. Dane źródłowe wymagają zatwierdzenia klubu i nie stanowią gotowego snapshotu produkcyjnego.

## Weryfikacja

```sh
npm run test:unit
npm --prefix studio run test
npm --prefix workers/publishing run test
npx playwright install chromium
npm run build:fixture
npm run test:e2e
npm run test:production
npm run test:lighthouse
npm run verify:artifact
```

## Wdrożenie

Workflow sprawdza kod; upload wymaga jawnego `DEPLOYMENT_ENABLED=true`, konfiguracji usług oraz zatwierdzonych, opublikowanych treści Sanity. Sam push nie włącza publikacji witryny. Nie uruchamiaj produkcji na materiałach źródłowych.

- [Instrukcja konfiguracji](docs/deployment-setup.md)
- [Instrukcja redaktora](docs/editor-guide.md)
- [Raport weryfikacji](docs/2026-09-15-completion-report.md)
- [Mechanizm webhooków](workers/publishing/README.md)

Projekt pozostaje w trakcie wdrożenia; formularz kontaktowy, newsletter, analityka i końcowy odbiór są dalszymi etapami planu.
