import { DatabaseSync } from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {randomBytes,scrypt as derive,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);
export const digest=s=>createHash('sha256').update(s).digest('hex');
export const validUsername=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{3,32}$/.test(s);
export const validPassword=s=>typeof s==='string'&&s.length>=12&&Buffer.byteLength(s)<=256;
export async function hashPassword(password){
 const salt=randomBytes(16).toString('hex');
 const key=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 return 'scrypt$'+salt+'$'+key.toString('hex');
}
export async function verifyPassword(password,stored){
 const [,salt,key]=stored.split('$');
 const actual=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 const expected=Buffer.from(key,'hex');
 return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
export function openStore(file){
 if(file!==':memory:')mkdirSync(path.dirname(path.resolve(file)),{recursive:true,mode:0o700});
 const db=new DatabaseSync(file);
 db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 // Versioned, transactional schema changes; user_version advances only on success.
 const version=db.prepare('PRAGMA user_version').get().user_version;
 if(version>1)throw Error('Database was created by a newer app version.');
 if(version===0)db.exec(`
 BEGIN IMMEDIATE;
 CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE COLLATE NOCASE,password_hash TEXT NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE INDEX sessions_user ON sessions(user_id);
 CREATE TABLE attempts(id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,date TEXT NOT NULL,correct INTEGER NOT NULL CHECK(correct IN (0,1)),created_at INTEGER NOT NULL,PRIMARY KEY(user_id,id));
 CREATE INDEX attempts_user_time ON attempts(user_id,created_at);
 CREATE TABLE rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
 PRAGMA user_version=1;
 COMMIT;`);
 return db;
}
