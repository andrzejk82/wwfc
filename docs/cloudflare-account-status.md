# Cloudflare — konfiguracja konta, 17.09.2026

Konto: `118177073d312aa29373bd161d6131b0`, subdomena Workers: `andrzejkob.workers.dev`.

- Pages Direct Upload `wwfc-production` jest utworzony, bez pierwszego wdrożenia strony.
- `wwfc-drafts` pozostaje pusty i nieużywany na polecenie właściciela.
- Worker `wwfc-publishing` jest wdrożony pod `https://wwfc-publishing.andrzejkob.workers.dev` z SQLite Durable Object `PublicationCoordinator`.
- W magazynie sekretów Workera zapisano klucz GitHub App w PKCS#8 oraz osobne sekrety webhooka Sanity i callbacku CI.
- Token Pages do wdrożeń jest zapisany jako sekret repozytorium GitHub. Lokalny Wrangler został połączony przez OAuth w ograniczonym zakresie Workers, skryptów oraz odczytu konta/użytkownika.
- Zero Trust nie został aktywowany. Nie dodano karty ani płatnego planu.
- Nie zmieniono domeny klubu ani projektu `andrzej-kobialka-site`.

Aktualna procedura uruchomienia i pozostałe kroki znajdują się w [deployment-setup.md](deployment-setup.md).
