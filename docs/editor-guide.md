# Edycja WWFC w Sanity

Otwórz [panel WWFC](https://wwfc-andrzejk82.sanity.studio/) i zaloguj się przez GitHub. Projekt: `objbb93c`, dataset: `production`. Studio zapisuje zmiany automatycznie jako szkice. Gotową stronę sprawdzisz pod adresem [wwfc-production.pages.dev](https://wwfc-production.pages.dev/).

- **Grafiki:** edytuj wydanie grafiku, jego daty i zajęcia. Nie dopisuj nieznanych godzin zakończenia. Kolejne wydania nie mogą nakładać się datami.
- **Trenerzy i dyscypliny:** aktualizuj opis, nazwę i zdjęcie. Uzupełnij opis alternatywny zdjęcia.
- **Cennik:** popraw pozycje w grupach cenowych; dokument cennika ustala kolejność grup.
- **FAQ:** edytuj pytanie, odpowiedź i kolejność.
- **Ustawienia strony:** kontakt, godziny otwarcia, odnośniki, komunikat, SEO i treści prawne.

## Publikacja

Używaj standardowego przycisku Publish w Sanity. Po opublikowaniu dokumentu webhook uruchamia [GitHub Actions](https://github.com/andrzejk82/wwfc/actions). Budowa sprawdza kompletność i zatwierdzenie wszystkich treści; błędne lub niezatwierdzone dane zatrzymują aktualizację witryny.

Zapis szkicu, publikacja w Sanity i wdrożenie strony to osobne etapy. Dopiero udane zadanie wdrożenia w Actions potwierdza aktualizację strony. Przy błędzie sprawdź nieudany krok; po poprawieniu danych opublikuj dokument ponownie albo uruchom workflow ręcznie.

Podgląd szkiców online jest wyłączony. Nie ma przycisków podglądu ani statusu Workera w Studio; Cloudflare Zero Trust nie jest używany.

Pierwszy zestaw treści został zatwierdzony przez właściciela i wdrożony 21.09.2026. Przy kolejnych zmianach sprawdzaj aktualność grafiku, cennika, kontaktu i dokumentów przed publikacją.
