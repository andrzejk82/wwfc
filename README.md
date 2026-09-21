# WWFC

Statyczna strona Astro z grafikiem zajęć i osobnym panelem Sanity, wdrożona na Cloudflare Pages Direct Upload. Podgląd szkiców online jest wyłączony; Zero Trust nie jest wymagany w obecnym wariancie.

- [Strona do testów i odbioru](https://wwfc-production.pages.dev/)
- [Panel redaktora Sanity — logowanie GitHub](https://wwfc-andrzejk82.sanity.studio/)

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
- [Raport wdrożenia](docs/2026-09-21-deployment-report.md)
- [Mechanizm webhooków](workers/publishing/README.md)

Strona i panel są dostępne online. Domena `wwfc.com.pl` pozostaje przy dotychczasowej stronie do czasu odbioru. Formularz kontaktowy, newsletter i analityka nie są aktywowane; dostępne są kontakt telefoniczny i e-mail.
