import {useState} from 'react'
import {CopyIcon} from '@sanity/icons'
import {useClient, type DocumentActionComponent} from 'sanity'
import {copyScheduleRelease, type ScheduleReleaseDocument} from '../lib/schedule-validation'

const key = () => crypto.randomUUID().replaceAll('-', '').slice(0, 12)

export const SafeDuplicateReleaseAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion: '2026-09-01'})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>()
  const source = (props.draft ?? props.published) as ScheduleReleaseDocument | null

  return {
    action: 'safe-duplicate-release',
    label: busy ? 'Kopiowanie…' : 'Skopiuj okres bez wyjątków',
    icon: CopyIcon,
    disabled: busy || !source,
    title: 'Tworzy niezależny szkic, kopiuje sesje i usuwa odwołania, zastępstwa oraz zamknięcia.',
    dialog: message ? {type: 'dialog', onClose: () => {setMessage(undefined); props.onComplete()}, header: 'Kopia wersji grafiku', content: message} : undefined,
    onHandle: async () => {
      if (!source) return
      setBusy(true)
      try {
        const id = `drafts.schedule-release-${crypto.randomUUID()}`
        await client.create(copyScheduleRelease(source, id, key))
        setMessage('Utworzono bezpieczny szkic. Ustaw jego daty obowiązywania przed publikacją.')
      } catch (error) {
        setMessage(`Nie udało się utworzyć kopii: ${error instanceof Error ? error.message : 'nieznany błąd'}`)
      } finally {
        setBusy(false)
      }
    },
  }
}
