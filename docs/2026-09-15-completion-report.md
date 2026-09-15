# Zakończenie lokalnej integracji CMS i publikacji — 15.09.2026

Architektura pozostaje bez zmian: Astro + Sanity + Cloudflare Pages. Zakończono rozpoczęte prace nad integracją ustawień, cennika i FAQ oraz kodem kontrolowanej publikacji. Wdrożenie online i odbiór produkcyjny pozostają otwarte.

## Wykonane prace

- Strony korzystają z ustawień kontaktowych, godzin, SEO, komunikatu, cennika i FAQ w snapshotach Sanity. Wspólna walidacja działa także w Workerze.
- Studio ma walidację przed publikacją, sprawdzenie aktualności szkicu i osobny status wdrożenia. Podgląd szkiców wymaga jawnego włączenia po odbiorze ochrony dostępu.
- Worker weryfikuje podpisy Sanity, tożsamość redaktora przez Access i callback CI. Trwała kolejka rozpoznaje duplikaty i pozwala ponawiać błędy.
- GitHub Actions buduje i testuje jeden artefakt. Manifest oraz skrót katalogu chronią przed podmianą między testami a uploadem. Produkcja i szkice mają osobne projekty Pages. Przy błędzie po uploadzie przygotowano rollback.
- Poprawiono błędny import współdzielonego adaptera, zbyt krótki czas oczekiwania kolejki, zależność statusu od zegara redaktora i ignorowanie rozbieżnego callbacku. Ograniczony ponowny przegląd tych trzech ostatnich uwag nie wykazał pozostałych usterek.
- Do Sanity dodano 10 brakujących szkiców: trzy grupy cen, stronę cennika i sześć FAQ; uzupełniono godziny otwarcia. Import zachował istniejące dokumenty i flagi zatwierdzenia. Odczyt kontrolny potwierdził 43 szkice, 81 zajęć, sześć FAQ, trzy grupy cen, `approved=false` i zero opublikowanych dokumentów treści.

## Potwierdzona weryfikacja

| Sprawdzenie | Wynik |
|---|---|
| Testy jednostkowe strony i pipeline | 41 zaliczonych |
| Testy Workera | 23 zaliczone |
| Testy Studio | 17 zaliczonych |
| TypeScript Studio i Workera | Bez błędów |
| Astro check | 62 pliki, zero błędów, ostrzeżeń i podpowiedzi |
| Build Astro | 45 stron, dodatkowo endpoint `version.json` |
| Pełne E2E, sześć szerokości | 119 zaliczonych, 13 celowo pominiętych, zero błędów |
| Test gotowego artefaktu | 2 zaliczone; 1 test zdalnego Access pominięty lokalnie |
| Lighthouse | 18 pomiarów na sześciu adresach, wszystkie progi zaliczone |
| Manifest i integralność `dist` | Zgodne |
| Build Studio i Worker dry-run | Zaliczone, bez wdrożenia |
| Audyt npm: strona / Studio / Worker | 0 / 0 / 0 zgłoszonych podatności |
| YAML workflow | Poprawnie sparsowany |

Testy E2E i Lighthouse wykonano na jawnych danych źródłowych, nie na zatwierdzonym snapshocie produkcyjnym. Testy cyklu życia Workera używają adaptera pamięciowego; nie zastępują sprawdzenia rzeczywistych alarmów Cloudflare, Access, uprawnień GitHub App i dostarczenia webhooka. Nie wykonano push, wdrożenia ani publikacji dokumentów Sanity.

Końcowy odczyt Sanity potwierdził również zachowanie dwóch zdjęć trenerów i dwóch wpisów godzin otwarcia.

## Pozostałe warunki uruchomienia

Potrzebne są konto Cloudflare, dwa projekty Pages, domena Workera, polityki Access, GitHub App oraz sekrety w magazynach usług. Należy zatwierdzić aktualność grafiku, cen i dokumentów prawnych, a następnie wykonać rzeczywistą próbę publikacji i rollbacku. Task 6A pozostaje otwarty do tej próby. Formularz, newsletter, analityka i końcowa migracja pozostają dalszymi zadaniami planu.

Konfiguracja: [deployment-setup.md](deployment-setup.md). Obsługa: [editor-guide.md](editor-guide.md). Szczegółowy kontrakt serwera: [README Workera](../workers/publishing/README.md).
