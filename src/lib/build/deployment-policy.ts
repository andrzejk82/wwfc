export function isProjectDeploymentUrl(value:string,project:string){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&(url.hostname===`${project}.pages.dev`||url.hostname.endsWith(`.${project}.pages.dev`));}catch{return false;}
}
export function deploymentPolicy(env:Record<string,string|undefined>){
 if(env.GITHUB_REF!=='refs/heads/main')throw new Error('Wdrożenie wymaga zaufanej gałęzi main.');
 const target=env.PUBLICATION_TARGET;
 if(target==='draft-preview')throw new Error('Podgląd szkiców online został wyłączony.');
 if(target!=='production')throw new Error('Nieprawidłowy cel publikacji.');
 if(env.DEPLOY_ENV!==target||env.CONTENT_PERSPECTIVE!=='published')throw new Error('Nieprawidłowa perspektywa lub środowisko.');
 const project=env.PAGES_PROJECT_NAME,account=env.CLOUDFLARE_ACCOUNT_ID;
 const productionProject=env.PRODUCTION_PAGES_PROJECT_NAME,draftProject=env.DRAFT_PAGES_PROJECT_NAME;
 if(!productionProject||productionProject===draftProject||project!==productionProject)throw new Error('Produkcja musi mieć jawnie przypisany projekt Pages.');
 if(!project||!/^[a-z0-9][a-z0-9-]{0,57}$/.test(project)||!account||!/^[a-f0-9]{32}$/.test(account))throw new Error('Brak poprawnej konfiguracji Pages.');
 return {target,project,account} as const;
}
