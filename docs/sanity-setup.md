# Sanity WWFC — uruchomienie i pierwszy import

Projekt: `objbb93c`, dataset: `production` (publiczny). Osobne Studio znajduje się w `studio/`; frontend pozostaje w Astro. W panelu konta sprawdzono dozwolony origin `http://localhost:3333` z uwierzytelnianiem. Obecny Growth Trial automatycznie przejdzie na Free; nie uruchomiono płatnego planu.

## Panel redakcyjny

Z katalogu `D:\codex\WWFC`:

```powershell
npm run studio:dev
```

Otwórz `http://localhost:3333` i zaloguj się swoim kontem Sanity. Logowanie i połączenie lokalnego Studio z projektem zostały sprawdzone. Zmiany formularzy zapisują szkice w Sanity; Publish publikuje dokument w CMS. Obecna strona wwfc.com.pl nie jest jeszcze połączona z automatycznym wdrażaniem zmian.

## Pierwsze dane

Zaimportowano 33 szkice: 18 trenerów, 13 dyscyplin, ustawienia klubu i jeden okres z 81 zajęciami. Plik źródłowy: `.cache/sanity-initial.ndjson`. Dane pochodzą z odczytu wwfc.com.pl z 08.09.2026 i wymagają sprawdzenia przez klub. Nieznane godziny końca pozostają puste. Import nie zatwierdza treści ani dokumentów prawnych. Odczyt kontrolny potwierdził 33 szkice, 81 zajęć, 0 opublikowanych dokumentów treści oraz `approved: false`.

Odświeżenie pliku:

```powershell
npm run content:prepare-import
```

Import został już wykonany przez CLI zalogowane przez GitHub. Poniższe polecenia służą do odtworzenia konfiguracji na nowym komputerze (sesja przeglądarki nie jest sesją CLI):

```powershell
Set-Location D:\codex\WWFC\studio
.\node_modules\.bin\sanity.cmd login
.\node_modules\.bin\sanity.cmd datasets import ..\.cache\sanity-initial.ndjson --dataset production --project-id objbb93c --missing
```

Polecenie importuje wyłącznie szkice. `--missing` zachowuje istniejące dokumenty o tych samych identyfikatorach; nie używaj `--replace` na redagowanych danych. Nie uruchamiaj ponownie importu po rozpoczęciu publikacji dokumentów bez sprawdzenia stanu datasetu.

Zdjęcia trenerów edytuj w polu „Zdjęcie”, wraz z tekstem alternatywnym. Pliki `public/images/jarek-malinowski.webp` i `public/images/karolina-owczarz.webp` przesłano do Sanity i przypisano do szkiców tych trenerów. Odczyt kontrolny potwierdził istnienie obu zasobów. Pozostałe zdjęcia oraz zdjęcia dyscyplin można dodać ręcznie.

## Redakcja grafiku

- Najpierw przejrzyj i opublikuj trenerów oraz dyscypliny, potem grafik. Powiązania importowanych szkiców zostaną wzmocnione przy publikacji.
- Daty początku i końca okresu są włączne. Przed kolejnym okresem zamknij poprzedni, jeśli nie ma daty końcowej.
- Odwołanie lub zastępstwo dodaj w „Odwołania i zastępstwa”, wybierając zajęcia z listy i konkretną datę. Puste pole nowej godziny końca zachowuje wartość zajęć cyklicznych. Przełącznik „Godzina końca nieznana” usuwa ją tylko dla danego wystąpienia.
- „Skopiuj okres bez wyjątków” tworzy niezależny szkic i czyści odwołania, zastępstwa oraz komunikaty. Ustaw nowe daty przed publikacją.
- Walidacja lokalna sprawdza daty, godziny, wiek, wyjątki oraz kolizje sal przy znanych godzinach zakończenia. Walidacja snapshotu dodatkowo sprawdza cały zestaw okresów i powiązań. Preflight całego datasetu przed przyciskiem Publish i automatyczny pipeline publikacji pozostają kolejnym etapem.

## Pobranie danych do Astro

Lokalny `.env` zawiera identyfikator projektu i datasetu. Nie zawiera tokena. Po opublikowaniu przynajmniej ustawień klubu oraz sprawdzonych dokumentów:

```powershell
Set-Location D:\codex\WWFC
npm run content:fetch
$env:CONTENT_SNAPSHOT_PATH = '.cache/content.json'
npm run build
Remove-Item Env:CONTENT_SNAPSHOT_PATH
```

Jedno zapytanie pobiera opublikowany stan bez CDN. Niepoprawne dane nie nadpisują ostatniego snapshotu. Bez wskazanego snapshotu lokalny build korzysta nadal ze źródłowego grafiku. Produkcja wymaga snapshotu `published`, daty pobrania oraz zatwierdzonych treści i dokumentów prawnych.

Obecny adapter obsługuje grafik, trenerów, dyscypliny, zdjęcia i flagi zatwierdzenia. Cennik, FAQ i pozostałe ustawienia mają przygotowane formularze Studio; ich podłączenie do stron pozostaje do wykonania. Nie wdrożono jeszcze chronionego podglądu szkiców ani automatycznego wdrażania Cloudflare/GitHub.

## Weryfikacja

`npm run test:unit`, `npm --prefix studio run test`, `npm --prefix studio run typecheck`, `npm run build`, `npm run studio:build`. Aktualne wyniki i ograniczenia: `docs/2026-09-11-sanity-report.md`.
# Aktualizacja 15.09.2026

Integracja obejmuje już cennik, FAQ i pozostałe ustawienia. Bieżące instrukcje: [edycja](editor-guide.md), [wdrożenie](deployment-setup.md), [raport weryfikacji](2026-09-15-completion-report.md). Starsze liczby szkiców i wyniki audytu poniżej opisują wcześniejszy etap; aktualny import zawiera 43 szkice, bez publikacji.
