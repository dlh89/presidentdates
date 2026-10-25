import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {openStore,digest,validUsername,validPassword,hashPassword,verifyPassword} from './store.js';
import {firstDate,time} from './public/history.js';
const publicDir=fileURLToPath(new URL('./public/',import.meta.url));
const DAY=86400000;
export async function createApp(options={}){
 const production=options.production??process.env.NODE_ENV==='production';
 const origin=options.origin??process.env.APP_ORIGIN??'http://127.0.0.1:3000';
 const parsedOrigin=new URL(origin);
 if(parsedOrigin.origin!==origin||(!['http:','https:'].includes(parsedOrigin.protocol)))throw Error('APP_ORIGIN must be a full origin without a trailing slash or path.');
 if(production&&parsedOrigin.protocol!=='https:')throw Error('Production requires an HTTPS APP_ORIGIN.');
 const registration=options.registration??process.env.ALLOW_REGISTRATION==='true';
 const trustProxy=options.trustProxy??process.env.TRUST_PROXY==='true';
 const db=openStore(options.dbPath??process.env.DB_PATH??'data/quiz.sqlite');
 const dummy=await hashPassword(randomBytes(32).toString('hex'));
 const cookieName=production?'__Host-president_session':'president_session';
 const cookie=(token,maxAge)=>cookieName+'='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+maxAge+(production?'; Secure':'');
 const stats=userId=>db.prepare('SELECT COUNT(*) total,COALESCE(SUM(correct),0) correct FROM attempts WHERE user_id=?').get(userId);
 let activeHashes=0;
 const clean=setInterval(()=>{try{db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('DELETE FROM rate_limits WHERE expires<?').run(Date.now());}catch{}},60*60*1000);clean.unref();
 function throttle(key,max,windowMs){
  const now=Date.now();
  db.prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<? THEN excluded.expires ELSE expires END').run(key,now+windowMs,now,now);
  const row=db.prepare('SELECT count,expires FROM rate_limits WHERE key=?').get(key);
  return row.count>max?Math.ceil((row.expires-now)/1000):0;
 }
 async function body(req){
  if(!req.headers['content-type']?.startsWith('application/json'))throw Object.assign(Error('Expected JSON.'),{status:415});
  req.setEncoding('utf8');
  let text='';
  for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>8192)throw Object.assign(Error('Request too large.'),{status:413});}
  try{const data=JSON.parse(text);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw Object.assign(Error('Invalid request.'),{status:400});}
 }
 function session(req){
  const raw=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  if(!raw||! /^[a-f0-9]{64}$/.test(raw))return null;
  return db.prepare('SELECT s.*,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=? AND expires>?').get(digest(raw),Date.now())??null;
 }
 function startSession(req,res,user){
  const old=session(req);if(old)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(old.token_hash);
  const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(token),user.id,csrf,Date.now()+30*DAY);
  res.setHeader('Set-Cookie',cookie(token,30*86400));return {username:user.username,csrf};
 }
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  res.setHeader('Cache-Control','no-store');
  const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  try{
   const url=new URL(req.url,'http://internal'),route=url.pathname;
   if(req.method==='GET'&&route==='/healthz')return json({ok:true});
   if(req.method==='POST'){
    if(req.headers.origin!==origin)return json({error:'Invalid request origin. Please reopen the configured site address.'},403);
    if(req.headers['sec-fetch-site']==='cross-site')return json({error:'Cross-site request rejected.'},403);
   }
   if(req.method==='GET'&&route==='/api/me'){
    const s=session(req);return json({user:s?{username:s.username,csrf:s.csrf}:null,registration});
   }
   if(req.method==='POST'&&(route==='/api/login'||route==='/api/register')){
    const ip=trustProxy?(req.headers['x-forwarded-for']?.split(',').at(-1)?.trim()??req.socket.remoteAddress):req.socket.remoteAddress;
    const limited=throttle('ip:'+digest(ip??'unknown'),30,15*60*1000);
    if(limited){res.setHeader('Retry-After',limited);return json({error:'Too many attempts. Try again in a few minutes.'},429);}
    const input=await body(req);
    if(!validUsername(input.username)||typeof input.password!=='string'||Buffer.byteLength(input.password)>256)return json({error:'Enter a valid username and password.'},400);
    const username=input.username.toLowerCase();
    const userLimit=throttle('user:'+username,15,15*60*1000);
    if(userLimit){res.setHeader('Retry-After',userLimit);return json({error:'Too many attempts. Try again in a few minutes.'},429);}
    if(activeHashes>=4)return json({error:'The server is busy. Please try again.'},503);
    activeHashes++;
    try{
     if(route==='/api/register'){
      if(!registration)return json({error:'Public sign-up is disabled. Ask the server owner for an account.'},403);
      if(!validPassword(input.password))return json({error:'Use a password of at least 12 characters (maximum 256 bytes).'},400);
      const hash=await hashPassword(input.password),id=randomUUID();
      try{db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(id,username,hash,Date.now());}catch(e){if(String(e.message).includes('UNIQUE'))return json({error:'That username is unavailable.'},409);throw e;}
      return json({user:startSession(req,res,{id,username})},201);
     }
     const user=db.prepare('SELECT * FROM users WHERE username=?').get(username);
     const valid=await verifyPassword(input.password,user?.password_hash??dummy);
     if(!user||!valid)return json({error:'Username or password is incorrect.'},401);
     return json({user:startSession(req,res,user)});
    }finally{activeHashes--;}
   }
   if(route.startsWith('/api/')){
    const s=session(req);if(!s)return json({error:'Please sign in again.'},401);
    if(req.method==='POST'&&req.headers['x-csrf-token']!==s.csrf)return json({error:'Your session has changed. Reload and try again.'},403);
    if(req.method==='POST'&&route==='/api/logout'){
     db.prepare('DELETE FROM sessions WHERE token_hash=?').run(s.token_hash);res.setHeader('Set-Cookie',cookie('',0));return json({ok:true});
    }
    if(req.method==='GET'&&route==='/api/progress'){
     const history=db.prepare('SELECT id,date,correct,created_at AS createdAt FROM attempts WHERE user_id=? ORDER BY created_at DESC,rowid DESC LIMIT 3000').all(s.user_id).reverse();
     return json({stats:stats(s.user_id),history});
    }
    if(req.method==='POST'&&route==='/api/progress'){
     const input=await body(req),today=new Date().toISOString().slice(0,10);
     if(typeof input.id!=='string'||! /^[a-zA-Z0-9-]{10,80}$/.test(input.id)||typeof input.correct!=='boolean'||typeof input.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!Number.isFinite(time(input.date))||new Date(time(input.date)).toISOString().slice(0,10)!==input.date||input.date<firstDate||input.date>today)return json({error:'Invalid answer.'},400);
     db.prepare('INSERT INTO attempts VALUES(?,?,?,?,?) ON CONFLICT(user_id,id) DO NOTHING').run(input.id,s.user_id,input.date,input.correct?1:0,Date.now());
     return json({stats:stats(s.user_id)});
    }
    return json({error:'Not found.'},404);
   }
   const assets={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/history.js':['history.js','text/javascript'],'/style.css':['style.css','text/css']};
   const asset=Object.hasOwn(assets,route)?assets[route]:null;
   if(!asset||!['GET','HEAD'].includes(req.method))return json({error:'Not found.'},404);
   const data=await readFile(path.join(publicDir,asset[0]));res.writeHead(200,{'Content-Type':asset[1]+'; charset=utf-8'});res.end(req.method==='HEAD'?undefined:data);
  }catch(e){if(!res.headersSent)json({error:e.status?e.message:'Something went wrong. Please try again.'},e.status??500);else res.end();if(!e.status)console.error('Request failed:',e.message);}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;server.maxHeadersCount=40;
 return {server,db,close:async()=>{clearInterval(clean);if(server.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}db.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 process.umask(0o077);
 const app=await createApp(),port=Number(process.env.PORT??3000),host=process.env.HOST??'127.0.0.1';
 app.server.listen(port,host,()=>console.log('Presidential practice listening on '+host+':'+port));
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await app.close();process.exit(0);});
}
