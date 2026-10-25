import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createApp} from '../server.js';
import {presidents,answer,choose,time,iso} from '../public/history.js';
test('history: all handovers and adaptive practice',()=>{
 assert.equal(presidents.length,47);
 for(let i=1;i<presidents.length;i++){
  const [date,name]=presidents[i],previous=presidents[i-1][1];
  assert.equal(answer(iso(time(date)-86400000)).name,previous);
  assert.equal(answer(date).name,previous+' → '+name);
  assert.equal(answer(iso(time(date)+86400000)).name,name);
 }
 assert.equal(answer('1901-09-13').name,'William McKinley');
 assert.equal(answer('1923-08-01').name,'Warren G. Harding');
 let seed=321;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const missed=[{id:'miss',date:'1901-09-13',correct:0,createdAt:1}];
 let ordinary=0,review=0;
 for(let i=0;i<10000;i++){
  const q=choose(missed,'2026-10-25',[],rng);assert(q.date>='1789-04-30'&&q.date<='2026-10-25');
  if(q.kind==='ordinary'){ordinary++;assert(!presidents.some(p=>p[0].slice(0,4)===q.date.slice(0,4)));}
  if(q.kind==='review'){review++;assert(Math.abs(time(q.date)-time('1901-09-14'))<=30*86400000);}
 }
 assert(ordinary>4700&&ordinary<5300);assert(review>2200&&review<2800);
 const mastered=[...missed,...[2,3,4].map(createdAt=>({...missed[0],correct:1,createdAt}))];
 assert.notEqual(choose(mastered,'2026-10-25',[],()=>.9).kind,'review');
});
test('accounts, isolation, CSRF, validation, idempotency, sessions and persistence',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'president-node-')),dbPath=path.join(dir,'quiz.sqlite'),origin='http://127.0.0.1:3000';
 let app=await createApp({dbPath,origin,production:false,registration:true});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 let base='http://127.0.0.1:'+app.server.address().port;
 async function req(route,body,cookie='',csrf='',customOrigin=origin){
  const r=await fetch(base+route,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:customOrigin}:{}),Cookie:cookie,'X-CSRF-Token':csrf},...(body?{body:JSON.stringify(body)}:{})});
  return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};
 }
 try{
  assert.equal((await req('/api/progress')).status,401);
  assert.equal((await req('/api/login',{username:'alice',password:'a'.repeat(12)},'','','https://evil.example')).status,403);
  assert.equal((await req('/api/register',{username:'alice',password:'short'})).status,400);
  const alice=await req('/api/register',{username:'Alice',password:'test-password-alice'});assert.equal(alice.status,201);assert.match(alice.headers.get('set-cookie'),/HttpOnly/);assert.match(alice.headers.get('set-cookie'),/SameSite=Lax/);
  const bob=await req('/api/register',{username:'bob',password:'test-password-bob'});assert.equal(bob.status,201);
  assert.equal((await req('/api/register',{username:'ALICE',password:'test-password-other'})).status,409);
  assert.equal((await req('/api/login',{username:'alice',password:'wrong-password'})).status,401);
  const cookie=alice.cookie,csrf=alice.data.user.csrf,id=randomUUID(),payload={id,date:'1901-09-13',correct:false};
  assert.equal((await req('/api/progress',payload,cookie)).status,403);
  assert.equal((await req('/api/progress',{...payload,date:'1901-02-30'},cookie,csrf)).status,400);
  assert.equal((await req('/api/progress',{...payload,date:'2999-01-01'},cookie,csrf)).status,400);
  assert.equal((await req('/api/progress',{...payload,correct:'yes'},cookie,csrf)).status,400);
  assert.equal((await req('/api/progress',payload,cookie,csrf)).status,200);
  await req('/api/progress',payload,cookie,csrf);
  await req('/api/progress',{id:randomUUID(),date:'1923-08-03',correct:true},cookie,csrf);
  const progress=await req('/api/progress',null,cookie);assert.deepEqual(progress.data.stats,{total:2,correct:1});assert.equal(progress.data.history.length,2);
  assert.equal((await req('/api/progress',null,bob.cookie)).data.stats.total,0);
  // The same attempt ID on a different account cannot access or alter Alice's result.
  await req('/api/progress',payload,bob.cookie,bob.data.user.csrf);
  assert.equal((await req('/api/progress',null,cookie)).data.stats.total,2);
  const row=app.db.prepare('SELECT password_hash FROM users WHERE username=?').get('alice');assert(row.password_hash.startsWith('scrypt$'));assert(!row.password_hash.includes('test-password'));
  const token=cookie.split('=')[1];assert(!app.db.prepare('SELECT token_hash FROM sessions').all().some(s=>s.token_hash===token));
  await app.close();
  app=await createApp({dbPath,origin,production:false,registration:false});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+app.server.address().port;
  assert.equal((await req('/api/progress',null,cookie)).data.stats.total,2);
  assert.equal((await req('/api/register',{username:'charlie',password:'test-password-charlie'})).status,403);
  assert.equal((await req('/api/logout',{},cookie,csrf)).status,200);
  assert.equal((await req('/api/progress',null,cookie)).status,401);
  const login=await req('/api/login',{username:'alice',password:'test-password-alice'});assert.equal(login.status,200);
  assert.equal((await req('/api/progress',null,login.cookie)).data.stats.correct,1);
  app.db.prepare('UPDATE sessions SET expires=0').run();
  assert.equal((await req('/api/progress',null,login.cookie)).status,401);
 }finally{await app.close();await rm(dir,{recursive:true,force:true});}
});
test('production config, secure cookies and throttling',async()=>{
 await assert.rejects(()=>createApp({production:true,origin:'http://quiz.example.com',dbPath:':memory:'}),/HTTPS/);
 const app=await createApp({production:true,origin:'https://quiz.example.com',dbPath:':memory:',registration:true});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+app.server.address().port;
 try{
  const call=body=>fetch(base+'/api/register',{method:'POST',headers:{Origin:'https://quiz.example.com','Content-Type':'application/json'},body:JSON.stringify(body)});
  const r=await call({username:'tester',password:'a-strong-test-password'});assert.equal(r.status,201);assert.match(r.headers.get('set-cookie'),/^__Host-president_session=/);assert.match(r.headers.get('set-cookie'),/; Secure/);
  let last;
  for(let i=0;i<32;i++)last=await call({username:'bad',password:'x'});
  assert.equal(last.status,429);assert(Number(last.headers.get('retry-after'))>0);
 }finally{await app.close();}
});
