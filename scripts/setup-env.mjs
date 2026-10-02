import {existsSync, writeFileSync, mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
mkdirSync('.data', {recursive:true});
if (!existsSync('.env.local')) {
  writeFileSync('.env.local', `BETTER_AUTH_SECRET=${randomBytes(48).toString('base64url')}\nBETTER_AUTH_URL=http://localhost:3000\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\nDATABASE_PATH=.data/salsal.sqlite\n`, {mode:0o600});
  console.log('Created private local environment configuration.');
} else console.log('Existing local environment preserved.');
