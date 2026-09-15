## Obowiązująca decyzja: bez podglądu online i Zero Trust

Na polecenie właściciela wyłączono podgląd szkiców online. Nie aktywujemy Zero Trust ani nie podajemy karty. Projekt wwfc-drafts pozostaje pusty i nieużywany. Studio korzysta ze standardowego publikowania Sanity; przyciski podglądu, preflightu Access i statusu Workera nie są podłączone. Cały snapshot produkcyjny nadal musi przejść walidację i testy CI; status wdrożenia sprawdzamy w GitHub Actions. Workflow oraz skrypt uploadu odrzucają draft-preview. Podpisany webhook /cms i callback /complete nie wymagają Zero Trust. Opisy ochrony podglądu poniżej są historyczne i nie są krokami bieżącej konfiguracji.

# Cloudflare — konfiguracja konta, 15.09.2026

Potwierdzono dostęp przez zalogowany panel do konta wskazanego przez właściciela.

- Account ID: `118177073d312aa29373bd161d6131b0`.
- Utworzono pusty projekt Pages Direct Upload `wwfc-production`.
- Utworzono pusty projekt Pages Direct Upload `wwfc-drafts`.
- Nie przesłano plików, nie wykonano wdrożenia i nie zmieniano domen ani istniejącego projektu konta.
- Cloudflare Access / Zero Trust nie był skonfigurowany.

Wybrano ofertę Zero Trust Free. Ekran aktywacji wymaga metody płatności, akceptacji regulaminu oraz zgody na opłaty za przekroczenie darmowych limitów. Nie zaakceptowano tych warunków i nie aktywowano usługi. Decyzja wymaga właściciela konta ze względu na wymóg bezpłatnego rozwiązania.

Podgląd szkiców pozostaje wyłączony. Nie utworzono tokenów API, Workera ani integracji GitHub. Kolejne kroki opisuje `deployment-setup.md`; nazwy projektów można już ustawić zgodnie z powyższą listą.
