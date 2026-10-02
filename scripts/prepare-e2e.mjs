import Database from 'better-sqlite3';
import {mkdirSync,existsSync,rmSync} from 'node:fs';
mkdirSync('work/tmp',{recursive:true});
if(!existsSync('.data/salsal.sqlite')||!existsSync('.data/demo-credentials.json'))throw new Error('Run npm run setup and npm run db:seed before the isolated browser suite.');
for(const suffix of ['', '-wal','-shm'])if(existsSync(`work/e2e.sqlite${suffix}`))rmSync(`work/e2e.sqlite${suffix}`);
const source=new Database('.data/salsal.sqlite',{readonly:true});
await source.backup('work/e2e.sqlite');source.close();
console.log('Prepared isolated browser-test database.');
