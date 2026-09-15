# Inwentaryzacja treści WWFC

Data kontroli: 2026-09-08. Status: użytkownik wskazał aktualne grafiki na wwfc.com.pl jako źródło; trwa ich transkrypcja.

## Źródła i odpowiedzialność

Źródłem grafiku wskazanym przez użytkownika jest [obecna strona WWFC](https://wwfc.com.pl/). Inne dane poniżej odczytano ze strony; nadal wymagają weryfikacji przed nową publikacją. Osoba zatwierdzająca i redaktor CMS nie zostali jeszcze wskazani.

| Obszar | Ustalenie | Co pozostaje do potwierdzenia |
|---|---|---|
| Grafik | Użytkownik potwierdził źródło na stronie. Obrazy zawierają godziny rozpoczęcia, bez zakończeń i daty końca ważności. | Dokończenie transkrypcji; nieczytelne etykiety wymagają potwierdzenia. Końce zajęć pozostają null, okres bez daty końca. |
| Kontakt | Strzykulska 6a, 05-850 Ożarów Mazowiecki; +48 604 066 669; biuro@wwfc.com.pl. | Zatwierdzenie danych oraz współrzędnych. |
| Godziny | Strona podaje pn–pt 7:00–22:00 i weekend 10:00–14:00. | Aktualność, święta i dni zamknięcia. |
| Sale | Obrazy grafiku wskazują Mata 1, Mata 2, Salka i Strefa cardio. | Reguły równoległych zajęć; uwzględnić cardio w enumie i filtrze. |
| Cennik | Materiały obrazkowe; w sąsiedztwie pozostał tekst wakacyjny. | Aktualne ceny, okres ważności i zasady karnetów. |
| Trenerzy | Profile istnieją na dotychczasowej stronie. | Aktualny skład, biografie i zatwierdzone zdjęcia. |
| Fotografie | Strona miesza zdjęcia z materiałami opisywanymi jako rendery. | Wybór autentycznych zdjęć i uprawnienia do ich publikacji. |
| Dokumenty prawne | Dotychczasowy link prowadzi do materiału WWTC. | Osobne zatwierdzone teksty dla WWFC. |

## Dostępy integracyjne

Do pierwszej prawdziwej próby publikacji potrzebne są:

- repozytorium GitHub [andrzejk82/wwfc](https://github.com/andrzejk82/wwfc), wskazane przez użytkownika; odczyt referencji potwierdził pusty remote. Uprawnienia do push i konfiguracji Actions wymagają sprawdzenia;
- projekt Sanity, dataset próbny/produkcyjny i redaktor;
- konto Cloudflare, projekt Pages oraz możliwość konfiguracji Workera i Access;
- później: konfiguracja Turnstile, zweryfikowany nadawca Resend i formularz MailerLite.

Nie zapisujemy sekretów w dokumentach ani kodzie. Brak dostępów nie blokuje lokalnych testów, ale blokuje uznanie Task 6A za ukończony.

## Rozdzielenie danych

Fixture służą wyłącznie testom. Ich daty, nazwiska i godziny nie mogą zostać uznane za aktualną ofertę. Lokalny podgląd fixture ma widoczne oznaczenie danych demonstracyjnych i noindex. Build produkcyjny ma odrzucać fixture.

## Próby publikacji

Nie wykonano jeszcze próby na prawdziwych kontach. Po uruchomieniu integracji zapisać: redaktora, środowisko, datę, identyfikator żądania, hash snapshotu, zmieniane wystąpienie, czas publikacji, wynik, przywrócenie danych oraz wynik testu błędu/rollbacku.
