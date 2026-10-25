import {DatabaseSync,backup} from 'node:sqlite';
import path from 'node:path';
import {existsSync} from 'node:fs';
const dest=process.argv[2];
if(!dest){console.error('Usage: npm run backup -- /absolute/path/quiz-backup.sqlite');process.exit(1);}
const src=process.env.DB_PATH??'data/quiz.sqlite';
if(!existsSync(src)||existsSync(dest)||path.resolve(src)===path.resolve(dest))throw Error('Source must exist; backup destination must be a new file.');
process.umask(0o077);
const db=new DatabaseSync(src);
try{await backup(db,dest);console.log('Backup saved to '+dest);}finally{db.close();}
