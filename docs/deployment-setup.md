## Obowiązująca decyzja: bez podglądu online i Zero Trust

Na polecenie właściciela wyłączono podgląd szkiców online. Nie aktywujemy Zero Trust ani nie podajemy karty. Projekt wwfc-drafts pozostaje pusty i nieużywany. Studio korzysta ze standardowego publikowania Sanity; przyciski podglądu, preflightu Access i statusu Workera nie są podłączone. Cały snapshot produkcyjny nadal musi przejść walidację i testy CI; status wdrożenia sprawdzamy w GitHub Actions. Workflow oraz skrypt uploadu odrzucają draft-preview. Podpisany webhook /cms i callback /complete nie wymagają Zero Trust. Opisy ochrony podglądu poniżej są historyczne i nie są krokami bieżącej konfiguracji.

# Uruchomienie WWFC — Astro, Sanity i Cloudflare

Stan 15.09.2026: kod mechanizmu publikacji jest przygotowany lokalnie. Konta, domeny, sekrety i rzeczywista próba publikacji wymagają konfiguracji. Testy lokalne nie oznaczają wdrożenia.

## Kolejność konfiguracji

1. Udostępnić repozytorium `andrzejk82/wwfc` i umieścić sprawdzony kod na `main`. Lokalna gałąź robocza to `codex/wwfc-redesign`. Chronić `main`; sekrety udostępniać wyłącznie zaufanym zadaniom.
2. W Cloudflare utworzyć dwa osobne projekty Pages **Direct Upload**: stronę produkcyjną oraz podgląd szkiców. Nazwy ustala właściciel. Nie włączać równoległego automatycznego buildu z Git.
3. Najpierw umieścić w podglądzie publiczny, pusty materiał kontrolny. Skonfigurować Access dla domeny projektu, aliasu `main`, wszystkich adresów poszczególnych wdrożeń i każdej własnej domeny. Sprawdzić odmowę dostępu bez logowania. Nie przesyłać szkiców przed tym odbiorem.
4. Skonfigurować Worker według `workers/publishing/README.md`: własna domena, SQLite Durable Object, GitHub App i sekrety. Ścieżki redaktora zabezpieczyć Access. `/cms` weryfikuje podpis Sanity, `/complete` osobny sekret CI. Wyłączyć `workers.dev` i adresy podglądowe Workera.
5. Utworzyć środowiska GitHub `production` i `draft-preview`. Wprowadzić zmienne i sekrety z tabel poniżej. Dopiero po konfiguracji ustawić `DEPLOYMENT_ENABLED=true`.
6. Udostępnić Studio pod HTTPS. Ustawić `SANITY_STUDIO_PUBLICATION_URL` na domenę Workera i tę samą domenę Studio jako `STUDIO_ORIGIN` Workera. Dopisać adres Studio do CORS Sanity. `SANITY_STUDIO_DRAFT_PREVIEW_ENABLED=true` dopiero po odbiorze Access.
7. Skonfigurować webhook Sanity dla opublikowanych dokumentów; filtr i projekcja są w README Workera. Sprawdzić create/update/delete oraz duplikat zdarzenia.
8. Wykonać próbę edycji, walidacji, publikacji, błędu, ponowienia i rollbacku. Porównać `/version.json` z manifestem CI. Dopiero potem przełączać domenę klubu.

## Zmienne GitHub

| Zmienna | Znaczenie |
|---|---|
| `DEPLOYMENT_ENABLED` | `true` dopiero po konfiguracji |
| `SCHEDULED_PUBLISH_ENABLED` | Domyślnie wyłączone; włączyć po ocenie limitu minut Actions |
| `PUBLICATION_RECEIVER_URL` | HTTPS Workera |
| `CLOUDFLARE_ACCOUNT_ID` | Identyfikator konta |
| `PRODUCTION_PAGES_PROJECT_NAME` | Projekt produkcji |
| `DRAFT_PAGES_PROJECT_NAME` | Inny projekt dla szkiców |
| `DRAFT_PREVIEW_PROTECTION_VERIFIED` | `true` dopiero po odbiorze ochrony wszystkich adresów |
| `PREVIEW_PROTECTION_URLS` | Tablica JSON adresów: projekt, `main`, istniejące wdrożenie kontrolne oraz własne domeny |
| `ALLOW_FIRST_DEPLOYMENT` | Jednorazowo `true` po zatwierdzeniu pierwszego wdrożenia; później `false` |

Próby HTTP wykrywają brak ochrony znanych adresów, ale nie zastępują sprawdzenia polityki obejmującej przyszłe adresy wdrożeń.

## Sekrety GitHub

| Sekret | Zakres |
|---|---|
| `SANITY_API_READ_TOKEN` | Odczyt projektu `objbb93c`, dataset `production`; szkice tylko w chronionym środowisku |
| `CLOUDFLARE_API_TOKEN` | Pages w wybranym koncie |
| `PUBLICATION_CALLBACK_SECRET` | Wspólny z Workerem; minimum 32 znaki |
| `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` | Konto techniczne wyłącznie do testów chronionego podglądu |

Nie wpisywać sekretów w pliki ani rozmowę. Sekrety Workera i GitHub App opisano osobno w README Workera.

## Zasady publikacji

CI pobiera świeży snapshot po wejściu do kolejki. Buduje stronę, testuje ją i sprawdza Lighthouse, następnie zapisuje skrót całego katalogu `dist`. Upload odrzuca zmienione pliki; nie wykonuje ponownego buildu. Identyfikator źródła, commit i skrót snapshotu trafiają do `version.json`.

Produkcja wymaga opublikowanych i zatwierdzonych danych. Materiał źródłowy i szkice nie przechodzą tej bramki. W podglądzie logi buildu i Lighthouse pozostają na runnerze i nie są publikowane jako artefakty. Pierwsze wdrożenie nie ma wcześniejszej wersji do rollbacku — wymaga osobnego odbioru.

Kolejka ma limit 48 godzin oczekiwania; przejęte zadanie wygasa po 30 minutach bez zakończenia. GitHub job ma limit 25 minut. Powtórzony callback przejęcia nie uruchamia drugiego uploadu. Nieudany test wdrożenia uruchamia powrót do poprzedniej wersji, o ile taka istnieje.

## Koszty i dalsze zadania

Pozostajemy przy planach darmowych. Harmonogram publikacji jest domyślnie wyłączony, żeby nie zużywać cyklicznie minut Actions. Przed uruchomieniem sprawdzić limity kont i nie aktywować płatnych planów. Sam Docker nie jest potrzebny.

Uruchomienie produkcji nadal wymaga zatwierdzenia treści klubu i dokumentów prawnych. Formularz kontaktowy, newsletter i analityka pozostają osobnymi zadaniami planu. Ten etap nie stanowi odbioru całego projektu.
