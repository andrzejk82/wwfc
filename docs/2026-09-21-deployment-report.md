# Wdrożenie WWFC — 21.09.2026

Strona jest dostępna: https://wwfc-production.pages.dev/.
Panel redakcyjny: https://wwfc-andrzejk82.sanity.studio/ (GitHub). Sprawdzono zalogowany panel z sekcjami grafiku, cennika, trenerów i ustawień.

## Potwierdzone wyniki

- [Pierwsza publikacja](https://github.com/andrzejk82/wwfc/actions/runs/35626739958): verify i publish zakończone sukcesem. Przeszły testy kodu, kontrole typów, build, testy przeglądarkowe, 18 pomiarów Lighthouse dla 6 adresów, weryfikacja artefaktu i zdalny test wdrożenia.
- [Publikacja wywołana rzeczywistym webhookiem Sanity](https://github.com/andrzejk82/wwfc/actions/runs/35627984511): sukces. Request `a69d6ab4-46fb-4d8e-be63-0ed2be8e68e1`, Worker potwierdził `phase=succeeded`.
- Wdrożenie: https://139bd43c.wwfc-production.pages.dev; commit `b2c66db1e21a6ab81370e9d087c3715522f40c64`.
- Hash snapshotu w callbacku i publicznym `version.json`: `4bac28b23c3fe83dc06a777993432727870898eed875ded7d676e6b7e679988d`, źródło `published`.
- Sanity: 43 opublikowane dokumenty, zatwierdzone treści i dokumenty prawne; webhook aktywny, bez szkiców, odpowiedź 202.
- Publiczne strony główna, grafik, cennik, polityka i regulamin odpowiedziały HTTP 200. Zachowano dokładnie dotychczasowy link polityki zgodnie z decyzją właściciela oraz oba linki regulaminów WWFC.

## Konfiguracja i zakres odbioru

Sanity Free, Cloudflare Pages i Worker pozostają w darmowym wariancie. Nie włączono Zero Trust ani podglądu szkiców online. Sekrety są poza repozytorium. Publikacja w Sanity automatycznie uruchamia walidację i wdrożenie; sam zapis szkicu nie zmienia strony.

Właściciel może już testować stronę pod adresem Pages i edytować treści w Studio. Domena `wwfc.com.pl` nie została przełączona. Formularz kontaktowy, newsletter i analityka nie są aktywne; strona udostępnia telefon i e-mail.

Pozostała czynność administracyjna: zatwierdzić w GitHub zapis `ALLOW_FIRST_DEPLOYMENT=false`. Formularz jest przygotowany, lecz GitHub wyświetlił „Confirm access” z prośbą o hasło właściciela. Nie blokuje to działania wdrożonej strony.
