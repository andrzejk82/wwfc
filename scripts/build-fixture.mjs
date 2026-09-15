import {spawnSync} from 'node:child_process';
// Source data are the explicitly labelled local fixture; never a production input.
const env={...process.env,DEPLOY_ENV:'preview'};
delete env.CONTENT_SNAPSHOT_PATH;delete env.CONTENT_PERSPECTIVE;
const result=spawnSync(process.execPath,['--import','tsx','scripts/build.mjs'],{env,stdio:'inherit'});
process.exitCode=result.status??1;
