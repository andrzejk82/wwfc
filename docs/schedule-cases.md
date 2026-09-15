# Scenariusze odbioru grafiku

Przypadki poniżej są danymi testowymi, nie zatwierdzonym grafikiem WWFC. Strefa: Europe/Warsaw. Okres wrześniowy: 2026-09-01–2026-09-30; październikowy: 2026-10-01–2026-10-31. Obie granice włącznie.

| Przypadek | Wejście | Oczekiwany wynik |
|---|---|---|
| Stałe zajęcia | Boks we wtorek 18:00–19:00, Mata 1 | 8 i 22 września mają 18:00–19:00. |
| Jeden zmieniony wtorek | Wyjątek 15 września: 19:00–20:00 | Tego dnia oryginał przekreślony, nowa godzina widoczna; 22 września bez zmiany. |
| Jedno odwołanie | Wyjątek cancelled na 15 września | W pełnym grafiku wpis z wyjaśnieniem; nie pojawia się w nadchodzących zajęciach. |
| Zamknięcie klubu | Notice closed na 15 września | Wszystkie wystąpienia odwołane, także mające wcześniej changed. |
| Przyszły okres | Październikowe zajęcia o 17:00, bieżąca data 8 września | Wrześniowa godzina nie ulega zmianie. |
| Tydzień na granicy | Tydzień zaczynający się 28 września | Każdy dzień korzysta z właściwego okresu, bez duplikatów. |
| Koniec ważności | Bieżąca data 1 listopada bez nowego release | Komunikat o nieaktualnym grafiku, daty i telefon; brak listy nadchodzących zajęć. |
| Przyszłe pokrycie | Tylko październikowy release, data 8 września | Komunikat o przyszłym okresie, bez udawania bieżącego grafiku. |
| Równoległe zajęcia | Dwie sesje 18:00–19:00 w różnych salach | Obie czytelne; nie są konfliktem. |
| Konflikt sali | 18:00–19:00 i 18:30–19:30 w Mata 1 | Walidacja odrzuca snapshot; stara strona pozostaje dostępna. |
| Styk przedziałów | 18:00–19:00 i 19:00–20:00 w Mata 1 | Poprawne dane. |
| Zajęcia już rozpoczęte | Lokalna godzina 18:30, zajęcia 18:00–19:00 | Nie są prezentowane jako nadchodzące. |
| Ostatnie zajęcia | Lokalna godzina 22:00, brak kolejnych sesji | Komunikat „Na dziś to już wszystkie zajęcia”. |
| Północ letnia | 2026-09-07T22:30:00Z | Lokalna data 8 września. |
| Północ zimowa | 2026-01-05T23:30:00Z | Lokalna data 6 stycznia. |
| Zmiana czasu | 29 marca i 25 października 2026 | Iteracja dat bez utraty lub powtórzenia dnia. |
| Brak JavaScriptu | Wyłączony JS na mobile | Cały datowany tydzień czytelny, okres i telefon widoczne. |

## Ścieżki użytkowników

1. Początkujący: home → pierwszy trening → grafik INTRO z widoczną godziną.
2. Rodzic: home → dzieci z terminami; wiek jest dodatkowym wyborem, który filtruje rzeczywiste grupy.
3. Osoba szukająca grup kobiecych: home → oferta kobieca z terminami lub bezpośrednim filtrem grafiku.
4. Zawodnik: home → grafik poziomu średniozaawansowanego z widoczną godziną.
5. Stały klubowicz: home → grafik; mobile wybiera dzisiejszy dzień, desktop pokazuje tydzień z wyróżnieniem dzisiaj.

Liczymy przejścia i wybory kontrolek, nie czytanie. Jeśli dzisiaj nie ma pasujących zajęć, użytkownik otrzymuje informację o pozostałych dniach tygodnia. Widoki nie mogą wymagać przeklikiwania pustych dni w poszukiwaniu wyniku.
