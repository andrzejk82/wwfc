# Sanity — stan i weryfikacja 11.09.2026

Zakres: lokalne standalone Studio oraz adapter opublikowanych treści dla Astro. Projekt `objbb93c`, publiczny dataset `production`. Nie jest to odbiór produkcyjny całego projektu WWFC.

## Wykonane

- Studio Sanity 6.13.1 z osobnym lockfile, formularzami i polską nawigacją; nie dodano React do publicznego frontendu Astro. Konfiguracja odpowiada instalacji standalone; nie uruchamiano generatora wymagającego logowania.
- Trenerzy, dyscypliny i zdjęcia z opisem alternatywnym; okresy grafiku, zajęcia, jednorazowe odwołania/zastępstwa i zamknięcia. Przy wyborze zajęć dla wyjątku służy lista zamiast ręcznego wpisywania identyfikatora.
- Singletony ustawień i cennika; bezpieczne kopiowanie grafiku tworzy szkic z nowymi kluczami zajęć i pustymi wyjątkami/komunikatami. Wspólna walidacja domenowa sprawdza także kolizje po zmianie godziny.
- Adapter jednego zapytania GROQ z perspektywą `published`, bez CDN. Odrzuca błędne powiązania, nakładające się okresy i niepoprawne dane. Nie nadpisuje poprzedniego pliku, gdy pobranie lub walidacja zawiedzie.
- Produkcja wymaga zatwierdzonego snapshotu Sanity `published` z datą pobrania oraz treści prawnych. Lokalny frontend wciąż działa na danych źródłowych, dopóki operator nie wskaże snapshotu.
- Import do Sanity: 33 szkice i 81 zajęć, po logowaniu CLI przez GitHub. Dodano dwa istniejące zdjęcia trenerów z lokalnego projektu, wyłącznie do brakujących pól zdjęć w szkicach. Odczyt po imporcie potwierdził liczby, istnienie zasobów, 0 opublikowanych dokumentów treści oraz `approved: false`.
- Użytkownik zalogował się w lokalnym Studio. Potwierdzono ekran kolekcji oraz nawigację. W Sanity Manage sprawdzono publiczny pusty dataset, CORS localhost:3333 z uwierzytelnianiem oraz automatyczny powrót Growth Trial do Free.

## Wyniki końcowe

| Kontrola | Wynik |
|---|---|
| `npm run test:unit` | 28/28 PASS, w tym rzeczywista ewaluacja GROQ z referencjami i zdjęciem |
| `npm --prefix studio run test` | 8/8 PASS |
| `npm --prefix studio run typecheck` | PASS |
| `npm run build` | PASS, 45 stron; 0 błędów/ostrzeżeń/podpowiedzi |
| `npm run studio:build` | PASS |
| `npm run test:e2e -- --project=chromium-390 --project=chromium-1440 --workers=2` | 41 PASS, 3 celowe pominięcia, 0 błędów |
| `npm run content:prepare-import` | 33 szkice, 81 zajęć |
| Odczyt publicznego API | Połączenie działa; kontrolowany błąd braku opublikowanego `site-settings`, brak nowego snapshotu |
| Logowanie lokalnego Studio | Potwierdzone w przeglądarce |
| Import CLI i odczyt kontrolny | 33 szkice, 81 zajęć, 2 zdjęcia, 0 opublikowanych dokumentów treści |
| Walidacja dokumentów datasetu | Wyłącznie 162 komunikaty `reference.not-published` w grafiku; trenerzy i dyscypliny pozostają szkicami |

Regresje formularzy najpierw odtworzyły awarię walidacji pustego obiektu, brak wykrywania konfliktu po zastępstwie i brak możliwości oznaczenia nieznanej godziny końca zastępstwa; po poprawkach przypadki przechodzą. Wykonano zapis szkiców i upload zdjęć przez CLI oraz sprawdzono formularz grafiku w Studio. Nie wykonano publikacji treści ani pełnej próby redakcji i wdrożenia. Przegląd drugiego agenta wskazał brak jawnej nieznanej godziny końca; dodano przełącznik mapowany na `null` w domenie i GROQ.

## Audyt zależności

Wynik dawnego audytu „0” w raporcie frontendu nie jest aktualnym audytem wszystkich zależności. Audyt online po instalacji wykrył problemy; uruchomiono zwykłe `npm audit fix` bez `--force`.

- Zależności produkcyjne Astro: **0** zgłoszeń (`npm audit --omit=dev` wykonane z siecią; `.cache/audit-runtime-online.json`).
- Całe drzewo strony po zgodnych aktualizacjach: **12** zgłoszeń (2 low, 3 moderate, 7 high), w narzędziach Lighthouse/CLI oraz ich zależnościach. Między innymi extract-zip, tmp, uuid i qs.
- Studio: **13** zgłoszeń (11 moderate, 2 high), obejmujących łańcuch CLI Sanity i zależności adm-zip, js-yaml, smol-toml, uuid. Pełny raport: `.cache/studio-audit-online.json`.

Automatyczna proponowana naprawa wymuszałaby m.in. downgrade Sanity do 5.14.1 lub Lighthouse CLI do 0.1.0. Nie zastosowano jej. Przed uruchomieniem produkcyjnego pipeline należy zamknąć aktualizacje zależności i udokumentować pozostałe wyjątki. Nie należy opisywać bieżącego audytu jako czystego.

## Pozostałe kroki

CLI uzyskało dostęp po osobnym logowaniu GitHub. `sanity projects list` potwierdziło projekt WWFC i jednego użytkownika. Instrukcja w `docs/sanity-setup.md`. Nie pobierano sekretów z sesji przeglądarki.

Następnie: odbiór treści, próba edycji i publikacji grafiku/zdjęcia, preflight całego datasetu w ścieżce publikacji, chroniony preview, workflow GitHub/Cloudflare. Przycisk publikacji grafiku jest obecnie zablokowany, ponieważ trenerzy i dyscypliny wymagają wcześniejszej publikacji; nie omijano tej kontroli. Cennik/FAQ i pozostałe ustawienia mają schematy Studio, ale nie są jeszcze obsługiwane przez adapter stron. Formularz, newsletter, analityka, prawne treści końcowe oraz odbiór produkcyjny pozostają zgodnie z planem otwarte.
