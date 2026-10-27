# Instrukcja użytkownika panelu WWFC w Sanity

Ta instrukcja jest przeznaczona dla osoby aktualizującej treści strony WWFC. Nie wymaga instalowania programu ani uruchamiania poleceń. Opis odpowiada konfiguracji projektu z 26.09.2026.

## 1. Logowanie i podstawowe zasady

1. Otwórz [panel WWFC](https://wwfc-andrzejk82.sanity.studio/) i zaloguj się przez GitHub kontem z dostępem do projektu.
2. Wybierz zakładkę **Treści**. Po lewej stronie znajdziesz: **Ustawienia klubu**, **Cennik**, **Wersje grafiku**, **Dyscypliny**, **Trenerzy**, **Grupy cenowe** oraz **Pytania i odpowiedzi**.
3. Otwórz dokument z listy albo utwórz nowy w sekcji, która dopuszcza wiele dokumentów. **Ustawienia klubu** i **Cennik** mają po jednym dokumencie: edytuj istniejący.
4. Zmiany w formularzu zapisują się w Sanity jako **szkic**. Poczekaj, aż panel zakończy zapis. Sam szkic nie zmienia publicznej strony.
5. Gdy dane są sprawdzone i formularz nie pokazuje błędów, kliknij **Publish** przy danym dokumencie. Potem sprawdź wynik aktualizacji strony według [sekcji 8](#8-publikacja-i-sprawdzenie-strony).

Edytujesz projekt Sanity `objbb93c`, zbiór `production`. Aktualna strona do sprawdzenia zmian to [wwfc-production.pages.dev](https://wwfc-production.pages.dev/). Domena `wwfc.com.pl` pozostaje przy dotychczasowej stronie do czasu jej osobnego przełączenia.

**Ważne:** każda publikacja uruchamia budowę *całej* strony. Jeśli inny dokument jest niepełny lub błędny, aktualizacja strony może się zatrzymać, choć zmieniony dokument został opublikowany w Sanity. Przy pracy kilku osób uzgodnij moment publikacji.

## 2. Ustawienia klubu

Otwórz **Ustawienia klubu**. Tu zmieniasz dane używane na stronie klubu i w kontakcie:

| Pole | Co wpisać lub sprawdzić |
| --- | --- |
| **Nazwa klubu** | Pełną, aktualną nazwę. |
| **Adres** | Ulicę z numerem, kod pocztowy i miasto. Wszystkie trzy części są wymagane przy budowie strony. |
| **Współrzędne** | Położenie klubu na mapie, jeśli jest potrzebne. Sprawdź punkt przed publikacją. |
| **Telefon**, **E-mail** | Aktualne dane recepcji. E-mail musi mieć poprawny format. |
| **Godziny otwarcia** | Dodaj wiersze z numerem dnia 1–7, etykietą wyświetlaną na stronie i godzinami, np. `Poniedziałek–piątek` oraz `7:00–22:00`. Numer 1 oznacza poniedziałek, 7 niedzielę. Na stronie wyświetlają się etykieta i godziny. |
| **Profile społecznościowe** | Nazwę serwisu oraz pełny adres URL każdego profilu. |
| **Domyślne SEO** | Tytuł, opis i ewentualną grafikę widoczne w metadanych strony. Dla dodanej grafiki wpisz tekst alternatywny. |
| **Ogłoszenie** | Tytuł i treść komunikatu. Przełącznik **Widoczne** decyduje o jego pokazywaniu. |
| **Treści prawne** | Treść polityki prywatności i regulaminu. Zmieniaj je po zatwierdzeniu przez osobę odpowiedzialną za te dokumenty. |

Są tu dwa oddzielne przełączniki zatwierdzenia: **Treści zatwierdzone do produkcji** i, wewnątrz **Treści prawne**, **Treści prawne zatwierdzone**. Włącz je po sprawdzeniu odpowiednich treści. Budowa strony wymaga obu zatwierdzeń oraz niepustej polityki prywatności i regulaminu. Po edycji ustawień kliknij **Publish**.

## 3. Trenerzy i dyscypliny

W sekcjach **Trenerzy** i **Dyscypliny** otwórz istniejący profil albo dodaj nowy. Dla każdego dokumentu:

1. Wpisz **Imię i nazwisko** trenera albo **Nazwę** dyscypliny oraz **Opis**.
2. Uzupełnij pole **Adres**. Jeśli panel oferuje wygenerowanie go z nazwy, użyj tej funkcji i sprawdź wynik. Adres powinien być krótki, unikalny i stabilny; jego zmiana może zmienić adres podstrony.
3. Dodaj lub wymień **Zdjęcie**. Ustaw kadr, jeśli wymaga poprawy, i wpisz **Tekst alternatywny** opisujący zdjęcie. Po dodaniu zdjęcia tekst alternatywny jest wymagany.
4. Dla trenera możesz ustawić **Kolejność**: mniejsza liczba wyświetla profil wcześniej. Profile bez zdjęcia trafiają na koniec listy.
5. Kliknij **Publish**.

Grafik wskazuje trenerów i dyscypliny przez odnośniki do tych dokumentów. Gdy dodajesz nowego trenera lub nową dyscyplinę do grafiku, najpierw opublikuj te profile, a potem wersję grafiku. Przed usunięciem profilu sprawdź, czy nie jest używany w zajęciach.

## 4. Cennik

Cennik ma dwa poziomy: dokumenty **Grupy cenowe** zawierają pozycje i ceny, a dokument **Cennik** łączy wybrane grupy oraz zawiera objaśnienia.

### Zmiana ceny lub pozycji

1. Otwórz **Grupy cenowe** i wybierz odpowiednią grupę.
2. W polu **Pozycje cennika** zmień lub dodaj pozycję. Wpisz jej **Nazwę**, **Cenę** w brzmieniu, które ma zobaczyć klient (np. `250 zł`), oraz ewentualne **Uwagi**.
3. Sprawdź **Nazwę**, **Identyfikator** i **Opis** grupy. Identyfikator powinien być unikalny; zmieniaj go tylko wtedy, gdy trzeba.
4. Pole **Kolejność** ustala miejsce grupy na stronie: mniejsza liczba oznacza wcześniejsze wyświetlenie. Kolejność wierszy wewnątrz grupy ustaw w tablicy **Pozycje cennika**.
5. Kliknij **Publish**.

### Dodanie grupy albo zmiana objaśnień

1. Nową grupę utwórz w **Grupy cenowe**, uzupełnij pozycje i opublikuj.
2. Otwórz pojedynczy dokument **Cennik**. W polu **Grupy cenowe** dodaj odnośnik do opublikowanej grupy. Sprawdź **Tytuł**, **Objaśnienia** i **Informacje o płatności**.
3. Opublikuj **Cennik**. Na stronie grupy są sortowane według pola **Kolejność** w dokumentach grup, więc samo przeciągnięcie odnośników w dokumencie Cennik nie ustali ich kolejności wyświetlania.

Przed publikacją porównaj wszystkie ceny i warunki z zatwierdzonym cennikiem klubu.

## 5. Pytania i odpowiedzi

W sekcji **Pytania i odpowiedzi** otwórz pytanie lub dodaj nowe. Wpisz **Pytanie**, **Odpowiedź** i **Kolejność**. Pytanie i odpowiedź są wymagane. Mniejsza liczba w polu **Kolejność** wyświetla wpis wcześniej; przy tej samej liczbie rozstrzyga treść pytania. Każdy wpis publikuje się osobno przyciskiem **Publish**.

## 6. Grafik — zwykłe, powtarzające się zajęcia

Grafik jest podzielony na dokumenty w **Wersje grafiku**. Każda wersja ma okres obowiązywania i własną listę zajęć. Daty **Obowiązuje od** i **Obowiązuje do (włącznie)** obejmują wskazane dni. Puste pole końca oznacza okres bez wskazanej daty zakończenia. Okresy dwóch opublikowanych wersji nie mogą się nakładać.

### Zmiana zajęć w istniejącej wersji

1. Otwórz **Wersje grafiku** i wybierz wersję obejmującą właściwą datę. Sprawdź **Nazwę wersji**, zakres dat oraz ewentualną **Notatkę publikacyjną**.
2. W **Zajęcia cykliczne** otwórz wybraną pozycję lub dodaj nową. Jedna pozycja oznacza zajęcia powtarzane w wybranym dniu tygodnia przez cały okres tej wersji.
3. Wybierz **Dzień tygodnia** i wpisz **Początek** w formacie 24-godzinnym `HH:mm`, np. `18:30`. **Koniec** wpisz tylko wtedy, gdy znasz potwierdzoną godzinę zakończenia. Nie szacuj czasu trwania; nieznany koniec zostaw pusty.
4. Wybierz istniejącą **Dyscyplinę**, **Trenera**, **Salę** i **Grupę**. Sale to Mata 1, Mata 2, Salka i Cardio. Grupa może być ogólna, dziecięca albo dla kobiet.
5. W razie potrzeby uzupełnij **Wiek od**, **Wiek do** i **Poziom**. Dla grupy dziecięcej minimalny wiek jest wymagany. Maksymalny wiek nie może być niższy od minimalnego.
6. Ustaw **Kolejność** i **Archiwalne**. Włączenie **Archiwalne** ukrywa pozycję w widoku grafiku.
7. Sprawdź całą wersję i kliknij **Publish**. Panel sprawdza między innymi poprawność dat, godzin i wyjątków. Budowa strony sprawdza również pozostałe wersje oraz kolizje zajęć w tej samej sali, jeśli znane są godziny końca.

Jeśli stała zmiana ma obowiązywać dopiero od nowej daty, utwórz nową wersję grafiku. Zachowaj historię starego okresu.

### Utworzenie kolejnej wersji

1. Otwórz dotychczasową wersję i wybierz akcję **Skopiuj okres bez wyjątków**. Panel utworzy osobny szkic z tymi samymi zajęciami, bez odwołań, zastępstw i komunikatów.
2. Otwórz nowy szkic, nadaj mu nazwę i ustaw daty. Jeśli stara wersja nie ma daty końca, uzupełnij ją i opublikuj. Nowa wersja może zacząć się najwcześniej następnego dnia po końcu poprzedniej.
3. Popraw zajęcia w nowej wersji. Ponownie dodaj tylko te wyjątki i komunikaty, które naprawdę mają obowiązywać w nowym okresie.
4. Opublikuj nową wersję i sprawdź tydzień przejścia między wersjami na stronie.

**Uwaga:** akcja kopiowania tworzy szkic z datami starej wersji. Ustaw nowe daty przed publikacją; dwa okresy z tymi samymi datami zablokują budowę strony.

## 7. Grafik — jednorazowe zmiany i zamknięcia

### Odwołanie jednych zajęć

W odpowiedniej wersji grafiku rozwiń **Odwołania i zastępstwa** i dodaj wpis. W polu **Zajęcia** wybierz pozycję z tej wersji, ustaw konkretną **Datę**, wybierz **Odwołane** i wpisz **Wyjaśnienie**. Data musi należeć do okresu wersji i przypadać w zwykły dzień tygodnia tych zajęć. Opublikuj wersję grafiku.

### Zmiana godziny, sali lub trenera w jednym dniu

Dodaj wpis w **Odwołania i zastępstwa**, wybierz zajęcia i datę, ustaw rodzaj **Zmienione** oraz wpisz **Wyjaśnienie**. W **Wartości zastępcze** podaj przynajmniej jedną zmianę: **Nowy początek**, **Nowy koniec**, **Nowa sala** lub **Nowy trener**. Puste pola zachowują wartości zwykłych zajęć. Jeśli godzina końca tego jednego wystąpienia jest nieznana, włącz **Godzina końca nieznana**. Sprawdź wynik i opublikuj wersję. Dla tych samych zajęć i tej samej daty może istnieć tylko jeden wyjątek.

### Zamknięcie klubu lub komunikat na kilka dni

W **Komunikaty i zamknięcia** dodaj wpis z **Tytułem**, opcjonalną **Treścią** i datami **Od** oraz **Do (włącznie)**. Włącz **Klub zamknięty**, jeśli wszystkie zajęcia w tym zakresie mają być odwołane. Zamknięcie ma pierwszeństwo przed pojedynczymi zastępstwami. Jeśli wpis ma jedynie informować, pozostaw przełącznik wyłączony. Opublikuj wersję grafiku.

## 8. Publikacja i sprawdzenie strony

1. Przed kliknięciem **Publish** sprawdź pisownię, daty, ceny, dane kontaktowe i powiązania z innymi dokumentami. Zwróć uwagę na komunikaty walidacji pod polami.
2. Kliknij **Publish** w dokumencie, który zmieniłeś. Jeżeli zmieniałeś kilka dokumentów, opublikuj każdy z nich. Dla nowej grupy cenowej, trenera lub dyscypliny opublikuj najpierw dokument, do którego odwołują się inne treści.
3. Otwórz [GitHub Actions dla WWFC](https://github.com/andrzejk82/wwfc/actions) i znajdź najnowsze zadanie **WWFC validation and publication**. Poczekaj na zakończenie kroku **publish**. Zielony wynik potwierdza udaną aktualizację strony; czerwony oznacza, że trzeba przejrzeć nieudany krok. Budowa może trwać kilka minut.
4. Po udanym wdrożeniu otwórz [stronę WWFC](https://wwfc-production.pages.dev/) i sprawdź odpowiednie miejsce, szczególnie na telefonie, jeśli zmiana dotyczy grafiku. Przy zmianie dat w grafiku sprawdź zarówno bieżący tydzień, jak i tydzień, w którym zmiana zacznie obowiązywać.

Publikacja dokumentu w Sanity i udane wdrożenie strony to dwa różne etapy. Jeśli zadanie GitHub zakończy się błędem, publiczna strona nie potwierdza jeszcze nowej treści. Po poprawieniu danych opublikuj odpowiedni dokument ponownie; uprawniona osoba może też uruchomić workflow ręcznie. Panel nie ma obecnie podglądu szkiców online ani widoku statusu usługi publikacji.

## 9. Najczęstsze problemy

| Objaw | Co sprawdzić |
| --- | --- |
| Nie możesz wejść do panelu | Zaloguj się przez GitHub kontem z dostępem do projektu Sanity. Jeśli dostępu nie ma, poproś administratora projektu o jego nadanie. |
| **Publish** jest niedostępny lub panel pokazuje błąd | Sprawdź wymagane pola i komunikaty przy nich. Dla grafiku skontroluj format godziny, zakres dat, wiek dzieci, odnośniki do trenera i dyscypliny oraz ewentualną kolizję sal. |
| Zmiana jest w panelu, lecz nie widać jej na stronie | Sprawdź, czy dokument został opublikowany, a nie tylko zapisany jako szkic. Następnie sprawdź wynik najnowszego zadania w GitHub Actions i odśwież stronę. |
| Nowy trener lub dyscyplina nie pojawia się w grafiku | Opublikuj jego profil, wybierz go w zajęciach właściwej wersji grafiku i opublikuj także tę wersję. |
| Nowa grupa cenowa nie pojawia się w cenniku | Opublikuj grupę, dodaj ją do pola **Grupy cenowe** w dokumencie **Cennik**, a potem opublikuj **Cennik**. |
| Nowa wersja grafiku zatrzymuje budowę | Sprawdź, czy wcześniejsza wersja ma datę końca i czy zakresy dat się nie nakładają. Skontroluj także zajęcia powiązane z tą wersją. |
| Strona nie przechodzi kontroli treści | Sprawdź oba przełączniki zatwierdzenia w **Ustawieniach klubu**, niepuste dokumenty prawne oraz kompletny adres, telefon, e-mail i godziny otwarcia. |

W razie niejasności zanotuj nazwę dokumentu, opis błędu i adres nieudanego zadania GitHub Actions. Przekaż te informacje osobie administrującej stroną, zamiast ponawiać publikację bez ustalenia przyczyny.
