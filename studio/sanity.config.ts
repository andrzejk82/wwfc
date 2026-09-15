import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemas'
import {polishStructure} from './structure'
import {SafeDuplicateReleaseAction} from './actions/safeDuplicateRelease'

const singletonTypes = new Set(['siteSettings', 'pricingPage'])

export default defineConfig({
  name: 'wwfc',
  title: 'WWFC — panel treści',
  projectId: 'objbb93c',
  dataset: 'production',
  plugins: [structureTool({title: 'Treści', structure: polishStructure})],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((template) => !singletonTypes.has(template.schemaType)),
  },
  document: {
    askToEdit: {enabled: false},
    newDocumentOptions: (previous) => previous.filter((item) => !singletonTypes.has(item.templateId)),
    actions: (previous, context) => {
      // Native Sanity publishing; whole-site validation runs in CI.
      // Online draft preview and Access-dependent actions are disabled.
      const publishingActions = previous
      if (context.schemaType === 'scheduleRelease') {
        return [...publishingActions.filter((action) => action.action !== 'duplicate'), SafeDuplicateReleaseAction]
      }
      if (singletonTypes.has(context.schemaType)) {
        return publishingActions.filter((action) => action.action !== 'duplicate' && action.action !== 'delete')
      }
      return publishingActions
    },
  },
})
