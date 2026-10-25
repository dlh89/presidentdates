import {choose,answer,pretty} from './history.js';
const $=id=>document.getElementById(id);
let user=null,history=[],all={total:0,correct:0},session={total:0,correct:0},question=null,recent=[],revealed=false,busy=false,registration=false,signup=false,pending=null,retryAction=null;
function error(message,retry=null){$('error-text').textContent=message;$('error').hidden=false;retryAction=retry;$('retry').hidden=!retry;}
function clearError(){$('error').hidden=true;retryAction=null;}
function setBusy(value){busy=value;for(const id of ['reveal','wrong','right','auth-submit','toggle-auth','logout','retry'])$(id).disabled=value;if(!value&&user&&question&&!revealed&&!retryAction)$('reveal').focus();}
async function api(path,body){
 const r=await fetch(path,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json',...(user?{'X-CSRF-Token':user.csrf}:{})},body:JSON.stringify(body)}:{})});
 let data;try{data=await r.json();}catch{throw Error('The server could not be reached. Please retry.');}
 if(!r.ok)throw Error(data.error??'Request failed.');return data;
}
function scores(){$('session-score').textContent=session.correct+' / '+session.total;$('all-score').textContent=all.correct+' / '+all.total;$('percentage').textContent=all.total?Math.round(100*all.correct/all.total)+'% correct':'correct';}
function next(){
 question={...choose(history,new Date().toISOString().slice(0,10),recent),id:crypto.randomUUID()};
 recent=[...recent.slice(-11),question.date];revealed=false;pending=null;
 $('date').textContent=pretty(question.date);$('before').hidden=false;$('after').hidden=true;$('reveal').focus();
}
function reveal(){if(!question||busy||revealed)return;const result=answer(question.date);$('answer').textContent=result.name;$('explanation').textContent=result.detail;$('before').hidden=true;$('after').hidden=false;revealed=true;$('wrong').focus();}
async function loadProgress(){
 setBusy(true);clearError();
 try{const data=await api('/api/progress');history=data.history;all=data.stats;session={total:0,correct:0};scores();$('saved').textContent='Progress saved to your account · '+user.username;next();}
 catch(e){error(e.message,loadProgress);}finally{setBusy(false);}
}
async function grade(correct){
 if(!question||!revealed||busy||retryAction)return;
 pending=correct;setBusy(true);clearError();
 try{
  const data=await api('/api/progress',{id:question.id,date:question.date,correct});
  history=[...history,{id:question.id,date:question.date,correct:correct?1:0,createdAt:Date.now()}].slice(-3000);
  all=data.stats;session.total++;if(correct)session.correct++;scores();$('notice').textContent=correct?'Correct — next question.':'Marked for more practice — next question.';next();
 }catch(e){error(e.message,()=>{retryAction=null;grade(pending);});}
 finally{setBusy(false);}
}
function authView(){
 $('auth').hidden=false;$('quiz').hidden=true;$('logout').hidden=true;
 $('auth-title').textContent=signup?'Create an account':'Welcome back';
 $('auth-submit').textContent=signup?'Create account':'Sign in';
 $('password').autocomplete=signup?'new-password':'current-password';$('password').minLength=signup?12:1;
 $('auth-help').textContent=signup?'Choose a username and a password of at least 12 characters.':'Sign in to keep your progress across devices.';
 $('toggle-auth').hidden=!registration;$('toggle-auth').textContent=signup?'Already have an account? Sign in':'Create an account';
}
$('auth-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;setBusy(true);clearError();
 try{const data=await api(signup?'/api/register':'/api/login',{username:$('username').value,password:$('password').value});user=data.user;$('password').value='';$('auth').hidden=true;$('quiz').hidden=false;$('logout').hidden=false;recent=[];await loadProgress();}
 catch(e){error(e.message);}finally{setBusy(false);}
});
$('toggle-auth').onclick=()=>{if(!busy){signup=!signup;clearError();authView();}};
$('logout').onclick=async()=>{if(busy)return;setBusy(true);clearError();try{await api('/api/logout',{});user=null;signup=false;question=null;history=[];session={total:0,correct:0};authView();}catch(e){error(e.message);}finally{setBusy(false);}};
$('reveal').onclick=reveal;$('wrong').onclick=()=>grade(false);$('right').onclick=()=>grade(true);$('retry').onclick=()=>retryAction?.();
document.addEventListener('keydown',event=>{
 if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||busy||retryAction||!user||['INPUT','A','SUMMARY'].includes(event.target.tagName))return;
 if(event.code==='Space'&&!revealed){event.preventDefault();reveal();}
 else if(revealed&&event.key==='1'){event.preventDefault();grade(false);}
 else if(revealed&&event.key==='2'){event.preventDefault();grade(true);}
});
async function boot(){
 setBusy(true);clearError();$('loading').hidden=false;
 try{const data=await api('/api/me');user=data.user;registration=data.registration;if(user){$('quiz').hidden=false;$('logout').hidden=false;await loadProgress();}else authView();}
 catch(e){error(e.message,boot);}finally{$('loading').hidden=true;setBusy(false);}
}
boot();
