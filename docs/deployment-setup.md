# Uruchomienie WWFC — stan 21.09.2026

## Obowiązujący wariant

Astro + Sanity Free + Cloudflare Pages Direct Upload. Podgląd szkiców online jest wyłączony; Zero Trust nie jest potrzebny. Projekt `wwfc-drafts` pozostaje pusty. Treści zatwierdza i publikuje upoważniona osoba w Sanity Studio.

## Skonfigurowane połączenia

- Sanity: projekt `objbb93c`, publiczny dataset `production`.
- Panel redaktora: https://wwfc-andrzejk82.sanity.studio/ (logowanie GitHub).
- Strona do odbioru: https://wwfc-production.pages.dev/.
- Repozytorium: `andrzejk82/wwfc`, workflow `publish.yml`, gałąź `main`.
- GitHub App: `wwfc-publishing-andrzejk82`, ID `4956537`, instalacja `161995249`; Actions write i Metadata read, wyłącznie repozytorium WWFC.
- Cloudflare: konto `118177073d312aa29373bd161d6131b0`, Pages `wwfc-production`.
- Worker: `https://wwfc-publishing.andrzejkob.workers.dev`. Włączono workers.dev wyłącznie dla odbiornika webhooków. Adresy podglądowe Workera są wyłączone. Ścieżki redaktora pozostają niedostępne bez konfiguracji Access.
- Webhook Sanity `WWFC production publication`, ID `GDMb0xaaiFNu2pKD`: create/update/delete opublikowanych dokumentów, bez szkiców i wersji. Przesyła tylko identyfikatory i metadane zdarzenia.

Sekrety Workera: `GITHUB_APP_PRIVATE_KEY` (PKCS#8), `SANITY_WEBHOOK_SECRET`, `PUBLICATION_CALLBACK_SECRET`. GitHub przechowuje `CLOUDFLARE_API_TOKEN` i ten sam `PUBLICATION_CALLBACK_SECRET`. Wartości sekretów nie trafiają do repozytorium.

Zmienne GitHub: `CLOUDFLARE_ACCOUNT_ID`, `PRODUCTION_PAGES_PROJECT_NAME`, `PUBLICATION_RECEIVER_URL`, `DEPLOYMENT_ENABLED=true`. `SCHEDULED_PUBLISH_ENABLED` pozostaje wyłączone. `ALLOW_FIRST_DEPLOYMENT=true` pozwoliło na pierwszy upload. Zmiana na `false` po udanym wdrożeniu została przygotowana, ale GitHub wymaga ponownego potwierdzenia dostępu przez właściciela. Istniejąca strona i kolejne publikacje działają; wyjątek dotyczy tylko braku wcześniejszego wdrożenia do rollbacku.

## Publikowanie

1. Redaktor zatwierdza aktualność grafiku, cennika, kontaktu i treści prawnych w Studio oraz publikuje dokumenty.
2. Sanity wysyła podpisane zdarzenie do `/cms`.
3. Worker uruchamia GitHub Actions. Status sprawdzamy w Actions; Studio nie ma przycisków podglądu ani statusu Workera.
4. CI pobiera świeży snapshot opublikowanych dokumentów, waliduje go, buduje i testuje stronę, a następnie przesyła dokładnie przetestowany artefakt do Pages.
5. Po wdrożeniu test HTTP i porównanie `version.json` potwierdzają wersję. Błąd testu powoduje rollback, jeżeli istnieje wcześniejsze wdrożenie.

Brak zatwierdzenia lub niepełne treści zatrzymują budowę. Sam zapis/publikacja w Sanity nie oznacza aktualizacji strony.

## Odbiór

Właściciel potwierdził aktualność grafiku i cennika oraz polecił zachować dokładnie dotychczasowy odnośnik polityki, po poinformowaniu, że prowadzi on do regulaminu WWTC. Zachowano również dwa odnośniki regulaminów WWFC z dotychczasowej strony. Zatwierdzony zestaw 43 dokumentów i 81 zajęć przeszedł walidację produkcyjną. Pierwsze wdrożenie przeszło wszystkie bramki w [Actions](https://github.com/andrzejk82/wwfc/actions/runs/35626739958): testy kodu, budowę, testy przeglądarkowe, 18 pomiarów Lighthouse, kontrolę artefaktu i test po uploadzie. Sprawdzono także publiczny adres Pages oraz zgodność odnośników PDF. Domena klubu nie została przełączona.

## Dostęp i koszty

Pełna ścieżka Sanity → Worker → GitHub → Pages → callback została potwierdzona w [run 35627984511](https://github.com/andrzejk82/wwfc/actions/runs/35627984511). Worker zapisał `phase=succeeded`, a publiczny `version.json` zgadza się z hashem snapshotu z callbacku. Szczegóły: [raport wdrożenia](2026-09-21-deployment-report.md).

Pozostajemy na planach darmowych. Nie aktywowano Zero Trust, płatnego Workers ani automatycznych publikacji co 30 minut. Odczyt opublikowanych danych publicznego datasetu nie wymaga tokena Sanity. Sekret webhooka i sekret callbacku są oddzielne. Szczegóły protokołu znajdują się w `workers/publishing/README.md`.
