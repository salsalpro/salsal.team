import {defineConfig} from '@playwright/test';
import {randomBytes} from 'node:crypto';
const testSecret=randomBytes(48).toString('base64url');
export default defineConfig({
 testDir:'./tests',testMatch:'e2e.spec.ts',fullyParallel:false,workers:1,timeout:45000,
 expect:{timeout:10000},reporter:[['list'],['html',{open:'never',outputFolder:'work/playwright-report'}]],outputDir:'work/test-results',
 use:{baseURL:'http://localhost:3100',headless:true,viewport:{width:1440,height:1000},trace:'retain-on-failure',screenshot:'only-on-failure',launchOptions:{executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']}},
 webServer:{command:'node scripts/prepare-e2e.mjs && npm run start -- --port 3100',url:'http://localhost:3100/en',reuseExistingServer:false,timeout:120000,env:{DATABASE_PATH:'work/e2e.sqlite',BETTER_AUTH_SECRET:testSecret,BETTER_AUTH_URL:'http://localhost:3100',NEXT_PUBLIC_SITE_URL:'http://localhost:3100',TMPDIR:`${process.cwd()}/work/tmp`}},
});
