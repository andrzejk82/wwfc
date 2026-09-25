import {useEffect, useState} from 'react'
import {Select} from '@sanity/ui'
import {set, unset, useClient, useFormValue, type StringInputProps} from 'sanity'
import type {ClassSession} from '../lib/schedule-validation'
import {sessionOptionLabel} from '../lib/session-option-label'

export function SessionSelect(props: StringInputProps) {
  const sessions = (useFormValue(['sessions']) as ClassSession[] | undefined) ?? []
  const client = useClient({apiVersion: '2026-09-01'})
  const [disciplineNames, setDisciplineNames] = useState<Record<string, string>>({})
  const referenceIds = [...new Set(sessions.flatMap(session => {
    const id = session.discipline?._ref
    return id ? [id.replace(/^drafts\./, ''), `drafts.${id.replace(/^drafts\./, '')}`] : []
  }))]
  const referenceKey = referenceIds.join('|')

  useEffect(() => {
    if (!referenceKey) {
      setDisciplineNames({})
      return
    }
    let active = true
    client.fetch<Array<{_id: string; name?: string}>>(
      '*[_type == "discipline" && _id in $ids]{_id,name}',
      {ids: referenceKey.split('|')},
      {perspective: 'raw'},
    ).then(documents => {
      if (!active) return
      const names: Record<string, string> = {}
      for (const document of documents.filter(item => !item._id.startsWith('drafts.'))) {
        if (document.name) names[document._id] = document.name
      }
      for (const document of documents.filter(item => item._id.startsWith('drafts.'))) {
        if (document.name) names[document._id.slice('drafts.'.length)] = document.name
      }
      setDisciplineNames(names)
    }).catch(() => {
      if (active) setDisciplineNames({})
    })
    return () => { active = false }
  }, [client, referenceKey])

  return <Select {...props.elementProps} value={props.value ?? ''} disabled={props.readOnly}
    onChange={event => props.onChange(event.currentTarget.value ? set(event.currentTarget.value) : unset())}>
    <option value="">Wybierz zajęcia z tej wersji grafiku</option>
    {props.value && !sessions.some(session => session._key === props.value) && <option value={props.value}>Usunięte zajęcia — wybierz ponownie</option>}
    {sessions.map((session, index) => <option key={session._key} value={session._key}>
      {sessionOptionLabel(session, disciplineNames[session.discipline?._ref?.replace(/^drafts\./, '') ?? ''], index)}
    </option>)}
  </Select>
}