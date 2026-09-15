import {describe,it,expect} from 'vitest';
import {deploymentPolicy,isProjectDeploymentUrl} from '../../src/lib/build/deployment-policy';
const env={GITHUB_REF:'refs/heads/main',PUBLICATION_TARGET:'production',PAGES_PROJECT_NAME:'wwfc-site',PRODUCTION_PAGES_PROJECT_NAME:'wwfc-site',DRAFT_PAGES_PROJECT_NAME:'wwfc-drafts',CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),DEPLOY_ENV:'production',CONTENT_PERSPECTIVE:'published'};
describe('deployment isolation',()=>{
 it('rejects untrusted refs and mismatched perspectives',()=>{
  expect(deploymentPolicy(env).project).toBe('wwfc-site');
  expect(()=>deploymentPolicy({...env,GITHUB_REF:'refs/heads/pr'})).toThrow();
  expect(()=>deploymentPolicy({...env,CONTENT_PERSPECTIVE:'drafts'})).toThrow();
 });
 it('requires an explicit separately protected draft target',()=>{
  const draft={...env,PAGES_PROJECT_NAME:'wwfc-drafts',PUBLICATION_TARGET:'draft-preview',DEPLOY_ENV:'draft-preview',CONTENT_PERSPECTIVE:'drafts'};
  expect(()=>deploymentPolicy(draft)).toThrow();
  expect(()=>deploymentPolicy({...draft,DRAFT_PREVIEW_PROTECTION_VERIFIED:'true'})).toThrow('Podgląd szkiców online został wyłączony.');
  expect(()=>deploymentPolicy({...draft,PAGES_PROJECT_NAME:'wwfc-site',DRAFT_PREVIEW_PROTECTION_VERIFIED:'true'})).toThrow();
 });
 it('accepts only HTTPS deployment hosts belonging to the configured Pages project',()=>{
  expect(isProjectDeploymentUrl('https://abc12345.wwfc-site.pages.dev','wwfc-site')).toBe(true);
  for(const url of ['https://wwfc-site.pages.dev.attacker.test','https://else.pages.dev','http://wwfc-site.pages.dev','https://u:p@wwfc-site.pages.dev'])expect(isProjectDeploymentUrl(url,'wwfc-site')).toBe(false);
 });
});
