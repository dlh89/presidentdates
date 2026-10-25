import {openStore,validUsername,validPassword,hashPassword} from './store.js';
import {randomUUID} from 'node:crypto';
import readline from 'node:readline';
import {Writable} from 'node:stream';
const [action,username]=process.argv.slice(2);
if(!['create','reset'].includes(action)||!validUsername(username)){
 console.error('Usage: npm run account -- create USERNAME  (or reset USERNAME)');process.exit(1);
}
if(!process.stdin.isTTY){console.error('Run interactively; passwords are never accepted in command arguments.');process.exit(1);}
let muted=false;
const output=new Writable({write(chunk,enc,callback){if(!muted)process.stdout.write(chunk);callback();}});
const rl=readline.createInterface({input:process.stdin,output,terminal:true});
const ask=prompt=>new Promise(resolve=>{muted=false;rl.question(prompt,answer=>{muted=false;process.stdout.write('\n');resolve(answer);});muted=true;});
const password=await ask('New password (hidden): '),again=await ask('Confirm password (hidden): ');rl.close();
if(password!==again||!validPassword(password)){console.error('Passwords must match and contain at least 12 characters, maximum 256 bytes.');process.exit(1);}
process.umask(0o077);
const db=openStore(process.env.DB_PATH??'data/quiz.sqlite'),hash=await hashPassword(password),name=username.toLowerCase();
try{
 if(action==='create')db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(randomUUID(),name,hash,Date.now());
 else{
  const user=db.prepare('SELECT id FROM users WHERE username=?').get(name);if(!user)throw Error('Account not found.');
  db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash,user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 }
 console.log(action==='create'?'Account created.':'Password reset; existing sessions signed out.');
}catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}
