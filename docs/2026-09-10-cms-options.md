# Darmowy CMS dla WWFC — propozycja, nie zatwierdzona migracja

**Decyzja użytkownika z 10.09.2026:** pozostajemy przy pierwotnym stosie Sanity Free + Astro + Cloudflare Pages. Poniższe porównanie zachowujemy jako analizę historyczną; rekomendacja Decap i wstrzymanie integracji Sanity są nieaktualne. Nie wdrażamy migracji do Payload, PostgreSQL ani Decap.

Stan weryfikacji: 10.09.2026. Użytkownik wskazał priorytet rozwiązań darmowych i poprosił o porównanie Payload CMS z Sanity oraz rekomendację. Integracja z Sanity jest wstrzymana do rozstrzygnięcia wyboru. Ten dokument nie oznacza zatwierdzenia Decap ani Payload.

## Rekomendacja

Decap CMS (wersja open source, bez Decap Turbo) + istniejący frontend Astro + GitHub + Cloudflare Pages Free. Wniosek dotyczy obecnego zakresu: publiczna strona klubu, grafik, trenerzy, dyscypliny, cennik, komunikaty. System zapisów, rozliczeń i kont klubowiczów wymagałby osobnej oceny.

Decap zapisuje treści w repozytorium i ma interfejs szkiców, przeglądu i publikacji oparty o branche oraz pull requesty. Nie potrzebuje osobnej bazy danych. Dla backendu GitHub redaktorzy potrzebują kont GitHub i dostępu push do repozytorium. Uwierzytelnianie wymaga usługi OAuth; dokumentacja wymienia także rozwiązanie społecznościowe na Cloudflare Pages. Ten element wymaga przeglądu bezpieczeństwa i testu logowania przed publikacją.

- https://decapcms.org/docs/github-backend/
- https://decapcms.org/docs/editorial-workflows/
- https://decapcms.org/docs/external-oauth-clients/

## Payload

Technicznie może zastąpić Sanity bez zmiany publicznego frontendu Astro: panel/API Payload uruchomilibyśmy jako osobną aplikację Next.js. Wymaga hostingu aplikacji, bazy danych i trwałego przechowywania zdjęć. Ma oficjalny szablon Workers + D1 + R2. README szablonu nadal wskazuje Paid Workers ze względu na rozmiar; aktualna dokumentacja limitów Cloudflare podaje już inne limity wielkości. Dlatego starszego argumentu o 3 MB nie należy traktować jako dowodu obecnej niemożliwości darmowego wdrożenia. Nadal obowiązuje limit 10 ms CPU na żądanie w Workers Free; bez próby wdrożenia i pomiarów nie gwarantujemy kosztu 0 zł. Workers Paid zaczyna się od 5 USD miesięcznie, z dodatkowymi rozliczeniami zależnymi od wykorzystania.

- https://payloadcms.com/docs/production/deployment
- https://github.com/payloadcms/payload/blob/main/templates/with-cloudflare-d1/README.md
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/

Payload warto ponownie rozważyć przy rozbudowie o aplikację klubową i zaawansowane uprawnienia. Dla obecnej strony dodatkowe utrzymanie jest słabiej dopasowane do priorytetu kosztowego.

## Pozostałe opcje

- Sanity Free już ma plan 0 USD: do 20 kont, 10 tys. dokumentów, role Administrator/Viewer. Osobna rola Editor wymaga Growth. Limity darmowej usługi i zależność od dostawcy pozostają. https://www.sanity.io/pricing
- Keystatic jest alternatywą zapisującą pliki w GitHub. Cloud upraszcza uwierzytelnienie, darmowo do 3 użytkowników zespołu; własny GitHub mode wymaga konfiguracji aplikacji GitHub. Integracja Astro wymaga sprawdzenia zgodności z wersją Astro używaną w projekcie. Decap ma bardziej bezpośrednio udokumentowany proces redakcyjnego zatwierdzania. https://keystatic.com/docs/cloud oraz https://keystatic.com/docs/github-mode

## Koszty i sposób publikacji proponowanego zestawu

Cel: 0 zł miesięcznie za CMS i hosting strony w darmowych limitach. Domena, skrzynka pocztowa, praca wdrożeniowa i utrzymanie nie są w tej kwocie. Darmowy hosting nie znosi limitów usług.

Cloudflare nie nalicza opłat za statyczne żądania Pages. Funkcja OAuth korzysta z limitów Workers Free. Jeżeli budowanie i testy odbywają się w GitHub Actions, obowiązują limity Actions: GitHub Free ma dla repozytoriów prywatnych 2000 minut miesięcznie i 500 MB artefaktów; standardowe runnery dla publicznych repozytoriów są bezpłatne. Nie zmieniamy widoczności repozytorium dla oszczędności. Retencję artefaktów i blokowanie płatnego przekroczenia trzeba ustawić przy konfiguracji konta.

- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/pages/platform/limits/
- https://docs.github.com/en/billing/concepts/product-billing/github-actions

Proponowany przebieg: redaktor zmienia formularz grafiku → szkic w GitHub → walidacja danych i testy → przegląd → publikacja sprawdzonego artefaktu. Awaria CMS lub nieudana aktualizacja nie usuwa poprzedniej statycznej strony. Opóźnienie publikacji zależy od czasu budowania i testów; nie obiecujemy zmian natychmiastowych.

## Wpływ na istniejącą pracę

Pozostają layouty, podstrony, model zajęć i wyjątków, silnik dat Europe/Warsaw oraz testy. Trzeba wymienić adapter treści i warunek produkcyjny wymagający obecnie source=sanity, usunąć niepotrzebne zależności, przygotować konfigurację panelu oraz zastąpić plan webhooka Sanity procesem Git. Wygląd formularzy do 81 zajęć i atomowa publikacja okresów grafiku wymagają próbnego scenariusza redakcyjnego przed uznaniem integracji za gotową.
