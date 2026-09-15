## Obowiązująca decyzja: bez podglądu online i Zero Trust

Na polecenie właściciela wyłączono podgląd szkiców online. Nie aktywujemy Zero Trust ani nie podajemy karty. Projekt wwfc-drafts pozostaje pusty i nieużywany. Studio korzysta ze standardowego publikowania Sanity; przyciski podglądu, preflightu Access i statusu Workera nie są podłączone. Cały snapshot produkcyjny nadal musi przejść walidację i testy CI; status wdrożenia sprawdzamy w GitHub Actions. Workflow oraz skrypt uploadu odrzucają draft-preview. Podpisany webhook /cms i callback /complete nie wymagają Zero Trust. Opisy ochrony podglądu poniżej są historyczne i nie są krokami bieżącej konfiguracji.

# Edycja WWFC w Sanity

Projekt: `objbb93c`, dataset: `production`. Zaloguj się przez GitHub. Studio zapisuje zmiany automatycznie jako szkice.

- **Grafiki:** edytuj wydanie grafiku, jego daty i zajęcia. Nie dopisuj nieznanych godzin zakończenia. Kolejne wydania nie mogą nakładać się datami; zakończ poprzednie przed rozpoczęciem kolejnego.
- **Trenerzy i dyscypliny:** aktualizuj opis, nazwę i zdjęcie. Zdjęcie powinno mieć opis alternatywny. Zmiana adresu slug wpływa na adres podstrony.
- **Cennik:** popraw pozycje w grupach cenowych; dokument cennika ustala kolejność grup.
- **FAQ:** edytuj pytanie, odpowiedź i kolejność.
- **Ustawienia strony:** kontakt, adres, godziny otwarcia, odnośniki społecznościowe, komunikat, domyślne SEO i treści prawne.

Po podłączeniu usługi publikacji przycisk publikowania najpierw sprawdza dane. Jeśli ktoś zmieni szkic w czasie sprawdzania, trzeba ponowić operację. Zapis w Sanity i wdrożenie strony to dwa etapy: dopiero status zakończenia wdrożenia wraz z adresem potwierdza aktualizację strony.

Przycisk **Chroniony podgląd szkiców** jest dostępny po konfiguracji ochrony dostępu. Wymaga zalogowania do Cloudflare Access. Bez konfiguracji usługi przyciski publikacji są wyłączone, ale edycja szkiców działa.

Jeśli publikacja nie powiedzie się, szkic pozostaje zapisany. Sprawdź komunikat i użyj ponowienia dla nieudanego zadania. Nie uznawaj samego kliknięcia „Publikuj” za potwierdzenie aktualizacji witryny.

Importowane dane nie są zatwierdzeniem aktualności cen, grafiku ani dokumentów prawnych. Te pola zatwierdza upoważniona osoba z klubu przed uruchomieniem produkcji.
