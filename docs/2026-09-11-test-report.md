# Weryfikacja frontendu WWFC — 11.09.2026

Zakres: lokalny frontend Astro, dane źródłowe z wwfc.com.pl odczytane 08.09.2026 oraz osobne scenariusze testowe wyjątków w grafiku. Architektura pozostaje bez zmian: Astro + Sanity Free + Cloudflare Pages.

## Potwierdzone wyniki

| Kontrola | Wynik |
|---|---|
| `npm run build` | 45 stron; Astro check: 0 błędów, 0 ostrzeżeń, 0 podpowiedzi |
| `npm run test:unit` | 19/19 zaliczonych |
| `npm run test:e2e` | 119 zaliczonych, 0 błędów, 13 celowych pominięć |
| `npm run test:lighthouse` | 18/18 pomiarów; wszystkie progi zaliczone |
| Dostępność axe | Brak wykrytych naruszeń WCAG 2 A/AA oraz 2.1 A/AA na 7 trasach przy 6 szerokościach |
| Budżet JS | Wszystkie 6 mierzonych tras poniżej 75 KB gzip |
| Transfer strony głównej | Poniżej 1,5 MB |
| Audyt wszystkich zależności npm | Wynik historyczny zastąpiony audytem online: patrz `docs/2026-09-11-sanity-report.md`; pozostały podatności narzędziowe |
| Polskie litery w zoptymalizowanych fontach | Komplet znaków w 3/3 plikach |
| `git diff --check` | Bez błędów białych znaków w śledzonych zmianach |

Testy przeglądarkowe uruchomiono na gotowym katalogu `dist` przez lokalny Wrangler Pages, w Chromium, przy szerokościach 320, 360, 390, 768, 1024 i 1440 px. Trzynaście pominięć jest zamierzone: po pięć powtórzeń kontroli HTTP i rozmiaru zasobów, które nie zależą od szerokości, oraz trzy desktopowe powtórzenia scenariusza automatycznego wyboru dnia na telefonie.

Sprawdzono: wszystkie wygenerowane trasy HTML i ich lokalne linki/zasoby, odpowiedź 404, robots/noindex wersji testowej, obraz OG i nagłówek nosniff, brak poziomego przepełnienia, nawigację klawiaturą, okno szczegółów, zachowanie grafiku bez JavaScriptu, filtry i historię przeglądarki, zmianę dnia/tygodnia w strefie Europe/Warsaw, wyjątki jednorazowe, odwołania, zamknięcie klubu, wygaśnięcie okresu oraz wydruk. Obejrzano zrzuty strony głównej i grafiku w widokach mobilnym i desktopowym.

## Poprawki wynikające z testów

- Walidacja wykrywa cykliczny konflikt sal także wtedy, gdy pierwszy tydzień obejmuje zamknięcie lub odwołanie. Zachowuje poprawność krótkiego okresu, w którym konflikt został odwołany przez cały czas jego obowiązywania.
- Reset filtrów wraca do bieżącego tygodnia, z dzisiejszym dniem na telefonie i pełnym tygodniem na desktopie. Zmiana dyscypliny nie wyłącza automatycznej zmiany dnia o północy.
- Wybranie wszystkich dni zachowuje się po odświeżeniu; Wstecz/Dalej przywraca filtry; nieistniejący trener lub dyscyplina w URL nie ukrywa wszystkich zajęć.
- Nawigacja tygodniowa respektuje zakres opublikowanych okresów. Przy braku pokrycia widoczny jest kontakt telefoniczny do recepcji.
- Wydruk zawiera wybrany tydzień, filtry, okres obowiązywania i wyjątki z pierwotnymi wartościami; nie powiela statycznego grafiku.
- Tab i Shift+Tab pozostają w oknie szczegółów; Escape przywraca fokus na zajęcia.
- Nazwa dostępna linku z logo zawiera jego widoczny tekst. Usunięto powtórzone opisy zdjęć w linkach zawierających już imię i nazwisko trenera.
- Krytyczne fonty są ładowane wcześniej, a style wbudowane w HTML. Rozszerzenia czcionek ograniczono do polskich liter; podstawowy alfabet łaciński pozostaje. Skrypt regeneracji: `scripts/subset-fonts.py`; pliki i licencje: `src/assets/fonts/`. Build nie wymaga Pythona, ponieważ gotowe fonty są częścią źródeł.
- Raporty Playwright/Lighthouse i pliki tymczasowe wyłączono z analizy TypeScript oraz śledzenia Git. Raport Playwright zapisuje ślady i zrzuty przy niepowodzeniu.

Scenariusze regresji najpierw odtworzyły błędy, a następnie przeszły po poprawkach. Pełny końcowy przebieg E2E obejmuje te poprawki. Odczytowy przegląd drugiego agenta wskazał problemy wydruku i nieznanych slugów; poprawki zweryfikowano testami w zadaniu głównym.

## Lighthouse

Końcowy pomiar zakończony z kodem 0: trzy uruchomienia dla każdej z sześciu tras. Wszystkie progi zaliczone: performance/accessibility/best-practices/SEO ≥90, LCP ≤2,5 s, CLS ≤0,1, transfer ≤1,5 MB. Pomiary lokalne w symulowanym profilu mobilnym; nie są danymi rzeczywistych użytkowników. Poniżej mediany z trzech uruchomień; transfer podano w dziesiętnych KB.

| Trasa | Performance | Accessibility | Best practices | SEO* | LCP | CLS | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 99 | 100 | 100 | 100 | 1,980 s | 0 | 157,7 KB |
| `/grafik/` | 100 | 100 | 100 | 100 | 1,528 s | 0 | 101,4 KB |
| `/dyscypliny/boks/` | 100 | 100 | 100 | 100 | 1,523 s | 0 | 89,2 KB |
| `/trenerzy/norbert-dabrowski/` | 100 | 100 | 100 | 100 | 1,523 s | 0 | 89,0 KB |
| `/cennik/` | 100 | 100 | 100 | 100 | 1,522 s | 0 | 89,3 KB |
| `/kontakt/` | 100 | 100 | 100 | 100 | 1,524 s | 0 | 89,3 KB |

*Celowo pominięto jedynie kontrolę `is-crawlable`: wersja testowa musi zachować `noindex,nofollow` oraz zakaz indeksowania w robots.txt. Wynik SEO nie potwierdza gotowości do indeksacji produkcji.

## Ograniczenia i następny etap

To odbiór istniejącego frontendu, a nie zakończenie wdrożenia produkcyjnego. Nie przeprowadzono testów na fizycznym iPhonie/Androidzie ani w Safari i Firefox. Automatyczne testy dostępności nie zastępują odbioru z czytnikiem ekranu. Wydruk sprawdzono w trybie CSS print; nie wykonano prób na fizycznej drukarce.

Nie ma jeszcze rzeczywistej próby redakcji i publikacji w Sanity, integracji kont Cloudflare/GitHub, produkcyjnego formularza, newslettera ani analityki. Treści prawne i źródłowy grafik wymagają zatwierdzenia przed publikacją. Brakujące godziny zakończenia zajęć pozostają nieznane; walidacja nie może wykryć wszystkich kolizji czasowych bez tych danych.

Następny etap zgodnie z planem: standalone Sanity Studio i adapter snapshotów, następnie ścieżka publikacji i próba edycji grafiku/zdjęcia przez administratora. Pozostałe integracje i odbiór produkcyjny pozostają otwarte. W tym zadaniu nie publikowano strony ani nie wysyłano wiadomości.

Raport interaktywny: `playwright-report/index.html`. Zrzuty: `test-results/`. Lighthouse: `.lighthouseci/reports/`. Artefakty testowe są lokalne i wyłączone z Git.
