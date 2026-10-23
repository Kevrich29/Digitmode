const T={P:'Presenza',F:'Ferie',R:'Permesso ROL',X:'Ex Festività',M:'Malattia',MA:'Maternità',L:'Lutto',I:'Infortunio',A:'Altra assenza'};
const DR={f:14.42,x:2.67,r1:0,r2:3,r3:6,y1:2,y2:4,p1:0,p2:50,fa:22,ra:72,xa:32};
const syncR=()=>{const Q=S.rules;Q.r1=Q.ra*Q.p1/100/12;Q.r2=Q.ra*Q.p2/100/12};
let S={emps:[],ent:[],rules:{...DR}};
const rd=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
let ready=false,toastT,storageOK=true;try{localStorage.setItem('presenze_t','1');localStorage.removeItem('presenze_t')}catch(e){storageOK=false}
function toast(msg,type){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.appendChild(t)}t.textContent=msg;t.className='show '+(type||'ok');clearTimeout(toastT);toastT=setTimeout(()=>{t.className=''},2200)}
const save=q=>{try{localStorage.setItem('presenze_v2',JSON.stringify(S));autoSchedule();if(ready&&!q)toast('✓ Dati salvati');return true}catch(e){toast('Salvataggio non riuscito','err');if(!save.w){save.w=1;alert('Attenzione: il browser non riesce a salvare i dati (archiviazione bloccata o piena). Esporta subito un backup da Impostazioni.')}return false}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id),iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fh=n=>(Math.round(n*100)/100).toLocaleString('it-IT'),uid=()=>Math.random().toString(36).slice(2,9);
let now=new Date();let view='az',sel=null,Y=now.getFullYear();
// Selettore anno: la lista va dal primo anno con dati fino all'anno prossimo (non cresce all'infinito) + frecce ‹ › per scorrere
function fillYears(){const ny=new Date().getFullYear();let lo=ny;
 try{(S.emps||[]).forEach(e=>{const y=+String(e.hire||'').slice(0,4);if(y>1990&&y<lo)lo=y});(S.ent||[]).forEach(t=>{const y=+String(t.date||'').slice(0,4);if(y>1990&&y<lo)lo=y})}catch(e){}
 const hi=ny+1;lo=Math.min(lo,Y);const h=Math.max(hi,Y);let o='';for(let y=h;y>=lo;y--)o+=`<option${y==Y?' selected':''}>${y}</option>`;
 const s=$('yr');if(s.dataset.k!==lo+'-'+h){s.innerHTML=o;s.dataset.k=lo+'-'+h}s.value=Y;
 $('yp').disabled=Y<=lo;$('yn').disabled=Y>=h}
fillYears();
const stepY=d=>{const s=$('yr'),v=+s.value+d;if([...s.options].some(o=>+o.value==v)){Y=v;mr();render()}};
$('yp').onclick=()=>stepY(-1);$('yn').onclick=()=>stepY(1);
const mr=()=>{$('pf').value=Y+'-01-01';$('pt').value=Y+'-12-31'};mr();
$('yr').onchange=e=>{Y=+e.target.value;mr();render()};
$('pf').onchange=$('pt').onchange=()=>render();
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{view=b.dataset.v;EDIT=null;render()});{const lg=document.querySelector('.brand');lg.title='Vai ad Azienda';lg.onclick=()=>{view='az';EDIT=null;render()}}
// maturazione: accredito a fine mese; mese di assunzione se assunto entro il 15
// Base per il costo ore residue. mm==='' => tutto l'anno (residuo precedente + maturato anno, goduto nell'anno);
// mm = mese => SOLO quel mese (maturato nel mese, goduto nel mese).
function costBase(e,mm){
 if(mm===''){const a=accr(e,new Date(Y,11,31,23)),cy=carry(e),to=Y+'-12-31';return{mF:cy.F+a.F,mP:cy.R+cy.X+a.R+a.X,gF:used(e.id,'F',to),gP:used(e.id,'R',to)+used(e.id,'X',to)}}
 const m=+mm,a=accr(e,new Date(Y,m+1,0,23)),p=m?accr(e,new Date(Y,m,0,23)):{F:0,R:0,X:0},to=iso(new Date(Y,m+1,0,12)),tp=m?iso(new Date(Y,m,0,12)):'0000-00-00',u=(k,t)=>used(e.id,k,t);
 return{mF:a.F-p.F,mP:a.R+a.X-p.R-p.X,gF:u('F',to)-u('F',tp),gP:u('R',to)+u('X',to)-u('R',tp)-u('X',tp)}}
function accr(e,upto,Yr=Y){let f=0,r=0,x=0;const h=new Date(e.hire);
 for(let m=0;m<12;m++){const end=new Date(Yr,m+1,0);if(end>upto)break;if(h>end)continue;
  if(h.getFullYear()==Yr&&h.getMonth()==m&&h.getDate()>15)continue;
  const yrs=(end-h)/(365.25*864e5),Q=S.rules;f+=Q.f;x+=Q.x;r+=yrs<Q.y1?Q.r1:yrs<Q.y2?Q.r2:Q.r3}
 return{F:f,R:r,X:x}}
const used=(id,t,to,Yr=Y)=>S.ent.filter(a=>a.emp==id&&a.type==t&&a.date.startsWith(String(Yr))&&(!to||a.date<=to)).reduce((s,a)=>s+a.h,0);
// RESIDUO PRECEDENTE AUTOMATICO: per ogni anno dall'assunzione fino all'anno prima di Yr, maturato (a fine anno) meno goduto. Risultato in ORE.
function carry(e,Yr=Y){const o={F:0,R:0,X:0},y0=+String(e.hire).slice(0,4);
 for(let y=y0;y<Yr;y++){const a=accr(e,new Date(y,11,31,23),y);['F','R','X'].forEach(k=>{o[k]+=a[k]-used(e.id,k,'',y)})}
 return o}
const p2=n=>String(n).padStart(2,'0');
function entsIn(e,from,to){return S.ent.filter(a=>a.emp==e.id&&a.date>=from&&a.date<=to)}
// UNICO conteggio giorni/ore usato ovunque (riquadri in alto, Dettaglio periodo, Azienda, PDF): solo giorni lavorativi, dall'assunzione fino a oggi. Ogni giorno vale 1 e si divide in base alle ore inserite (es. 2 h presenza + 6 h permesso = 0,25 + 0,75); se le ore inserite sono meno delle ore giornaliere, il giorno vale solo quella parte.
function cnt(e,f,t){const a=f>e.hire?f:e.hire,z=t<iso(now)?t:iso(now),o={},dy={},m={};Object.keys(T).forEach(k=>{o[k]=0;dy[k]=0});let fe=0;
 if(a<=z){for(let d=new Date(a+'T12:00:00');iso(d)<=z;d.setDate(d.getDate()+1)){if(![0,6].includes(d.getDay())&&festivo(d))fe++}
  entsIn(e,a,z).forEach(x=>{if(lavorativo(new Date(x.date+'T12:00:00'))){o[x.type]+=x.h;const q=m[x.date]=m[x.date]||{};q[x.type]=(q[x.type]||0)+x.h}});
  Object.keys(m).forEach(ds=>{const q=m[ds],su=Math.max(Object.keys(q).reduce((t,k)=>t+q[k],0),e.hpd);Object.keys(q).forEach(k=>{dy[k]+=q[k]/su})});
  Object.keys(dy).forEach(k=>{dy[k]=Math.round(dy[k]*100)/100})}
 return{fe,o,dy,tot:Math.round((Object.keys(dy).reduce((t,k)=>t+dy[k],0)+fe)*100)/100}}
const st=c=>{const o={};Object.keys(T).forEach(k=>o[k]={h:c.o[k]||0,d:c.dy[k]||0});return o};
function stats(id){const e=S.emps.find(x=>x.id==id);return e?st(cnt(e,$('pf').value,$('pt').value)):st({o:{},dy:{}})}
function balances(e){const ref=Y==now.getFullYear()?now:new Date(Y,11,31,23),a=accr(e,ref),p=accr(e,new Date(Y,11,31,23));
 const cy=carry(e);return['F','R','X'].map(k=>{const c=cy[k],g=used(e.id,k,iso(ref)),gt=used(e.id,k);
  return{k,c,mat:a[k],g,saldo:c+a[k]-g,proj:c+p[k]-gt,pm:p[k]}})}
const cl=n=>n<0?'neg':'pos';
// ---- PRESENZE AUTOMATICHE ----
// Ogni giorno lavorativo (lun-ven, esclusi festivi nazionali) fino a oggi viene registrata la presenza con le ore giornaliere del dipendente,
// meno le ore di eventuali assenze già registrate (anche inserite in anticipo). Ogni dipendente ha un segnalino 'auto' (ultimo giorno elaborato).
function pasqua(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=(h+l-7*m+114)%31+1;return new Date(y,mo-1,da)}
const FEST=['01-01','01-06','04-25','05-01','06-02','08-15','11-01','12-07','12-08','12-25','12-26'];
const FNAME={'01-01':'Capodanno','01-06':'Epifania','04-25':'Festa della Liberazione','05-01':'Festa dei Lavoratori','06-02':'Festa della Repubblica','08-15':'Ferragosto','11-01':'Tutti i Santi','12-07':"Sant'Ambrogio (Patrono di Milano)",'12-08':'Immacolata Concezione','12-25':'Natale','12-26':'Santo Stefano'};
function festName(d){const k=p2(d.getMonth()+1)+'-'+p2(d.getDate());if(FNAME[k])return FNAME[k];if(iso(pasqua(d.getFullYear()))==iso(d))return 'Pasqua';const p=pasqua(d.getFullYear());if(p.getDate()+1&&(p.setDate(p.getDate()+1),iso(p)==iso(d)))return "Lunedì dell'Angelo (Pasquetta)";return 'Festività'}
function festivo(d){const k=p2(d.getMonth()+1)+'-'+p2(d.getDate());if(FEST.includes(k))return true;const p=pasqua(d.getFullYear());p.setDate(p.getDate()+1);return iso(p)==iso(d)}
const lavorativo=d=>![0,6].includes(d.getDay())&&!festivo(d);
function fixDay(e,ds,create){if(!e||!e.auto||ds>e.auto||ds<e.hire)return false;const d=new Date(ds+'T12:00:00');if(!lavorativo(d))return false;
 const altre=S.ent.some(a=>a.emp==e.id&&a.date==ds&&a.type!='P'),pr=S.ent.find(a=>a.emp==e.id&&a.date==ds&&a.type=='P');
 if(pr){if(altre)S.ent=S.ent.filter(a=>a!==pr);else pr.h=e.hpd;return true}
 if(create&&!altre){S.ent.push({id:uid(),emp:e.id,date:ds,type:'P',h:e.hpd});return true}return false}
function autoFill(){const oggi=iso(now);let n=0;
 S.emps.forEach(e=>{if(e.auto&&e.auto>=oggi)return;
  const y0=new Date(now.getFullYear(),0,1),h=new Date(e.hire+'T12:00:00');
  let from=e.auto?new Date(e.auto+'T12:00:00'):(h>y0?h:y0);if(e.auto)from.setDate(from.getDate()+1);if(from<h)from=new Date(h);
  for(let d=new Date(from.getFullYear(),from.getMonth(),from.getDate());iso(d)<=oggi;d.setDate(d.getDate()+1)){
   if(!lavorativo(d))continue;const ds=iso(d);
   if(S.ent.some(a=>a.emp==e.id&&a.date==ds))continue;
   S.ent.push({id:uid(),emp:e.id,date:ds,type:'P',h:e.hpd});n++}
  e.auto=oggi});
 return n}
// Un giorno puo' avere ore parziali (es. 4 h ferie + 4 h presenza); se le voci non sono valide (duplicati o ore oltre le ore giornaliere) si riporta a una sola voce intera.
// Se per lo stesso giorno ci sono piu' voci vince il tipo con piu' ore (a parita' l'assenza vince sulla presenza).
function normEnt(){let ch=false;const by={};S.ent.forEach(a=>{const k=a.emp+'|'+a.date;(by[k]=by[k]||[]).push(a)});const out=[];
 Object.keys(by).forEach(k=>{const L=by[k],em=S.emps.find(x=>x.id==L[0].emp);if(!em){out.push(...L);return}
  const su=L.reduce((t,a)=>t+a.h,0);if(L.every((a,i)=>L.findIndex(b=>b.type==a.type)==i)&&su<=em.hpd+1e-9){out.push(...L);return}
  const m={};L.forEach(a=>m[a.type]=(m[a.type]||0)+a.h);let bt=null;Object.keys(m).forEach(t=>{if(bt===null||m[t]>m[bt]||(m[t]==m[bt]&&bt=='P'))bt=t});
  const w=L.find(a=>a.type==bt);if(L.length>1||w.h!=em.hpd)ch=true;w.h=em.hpd;out.push(w)});
 S.ent=out;return ch}
function autoRun(rend){const prima=JSON.stringify(S.emps.map(e=>e.auto)),n=autoFill();if(n||JSON.stringify(S.emps.map(e=>e.auto))!==prima){save(true);if(rend&&['az','dip'].includes(view))render()}return n}
setInterval(()=>{if(iso(new Date())!==iso(now)){now=new Date();autoRun(true)}},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&iso(new Date())!==iso(now)){now=new Date();autoRun(true)}});
const okH=h=>Number.isFinite(h)&&h>0&&h<=24;
function limH(el){if(el.value==='')return;const n=+el.value;if(n>24){el.value=24;toast('Massimo 24 ore al giorno','err')}else if(n<0){el.value='';toast('Le ore non possono essere negative','err')}}
function render(){fillYears();document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v==view));
 const A=$('app');if(!S.emps.length&&!['anag','imp'].includes(view)){A.innerHTML='<div class="card">Nessun dipendente. Aggiungilo in <b>Anagrafica</b>.</div>';return}
 if(['dip','reg'].includes(view)&&!empsY().length){A.innerHTML='<div class="card">Nessun dipendente assunto nel '+Y+' o prima. Cambia anno oppure aggiungi un dipendente in <b>Anagrafica</b>.</div>';return}
 ({az:vAz,dip:vDip,reg:vReg,anag:vAnag,imp:vImp})[view](A);
 if(!storageOK)A.insertAdjacentHTML('afterbegin','<div class="card warn">⚠ Questo browser non consente di salvare i dati (archiviazione bloccata, navigazione privata o file aperto da anteprima/zip). Ciò che inserisci andrà perso al ricaricamento. Apri il file direttamente dalla cartella con Chrome, Edge o Firefox, oppure esporta spesso un backup da <b>Impostazioni</b>.</div>');
 saveUI()}
const UIK='presenze_ui';function saveUI(){try{localStorage.setItem(UIK,JSON.stringify({view,sel,Y,MM,MY1,MY2,pf:$('pf').value,pt:$('pt').value}))}catch(e){}}
const MN=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const dim=(y,m)=>new Date(y,m+1,0).getDate(),nd=()=>Math.max(...MN.map((_,m)=>dim(Y,m))),dh=()=>Array.from({length:nd()},(_,i)=>`<th>${i+1}</th>`).join('');
const legend=()=>`<div class="lg">${['P','F','R','M'].map(k=>`<span class="c-${k}"><b>${k}</b> ${k=='R'?'Permessi':T[k]}</span>`).join('')}<span class="c-A"><b>A</b> Altre assenze</span><span class="c-H"><b>FN</b> Festività</span></div>`;
function cell(e0,id,dt){const ds=iso(dt),a=S.ent.find(x=>x.emp==id&&x.date==ds&&x.type!='P')||S.ent.find(x=>x.emp==id&&x.date==ds),c0=a?a.type:'',c=c0=='X'?'R':c0,fn=!c&&(festivo(dt)||iso(pasqua(dt.getFullYear()))==iso(dt));
 return `<td class="${c?'c-'+c:fn?'c-H':[0,6].includes(dt.getDay())?'we':'e'}" title="${a?(c=='R'?'Permessi':T[c0])+' · '+fh(a.h)+' h':fn?festName(dt):''}">${fn?'FN':['MA','L','I','A'].includes(c)?'A':c}</td>`}
function grid(id,m){const e0=S.emps.find(x=>x.id==id),n=dim(Y,m);let r='';
 for(let d=1;d<=nd();d++)r+=d>n?'<td class="x"></td>':cell(e0,id,new Date(Y,m,d));return r}
function gridT(id){const e0=S.emps.find(x=>x.id==id);let r='';
 for(let d=1;d<=nd();d++){r+=`<tr><th>${d}</th>`;for(let m=0;m<12;m++)r+=d>dim(Y,m)?'<td class="x"></td>':cell(e0,id,new Date(Y,m,d));r+='</tr>'}return r}
let DM='',MM='',EDIT=null,REG=null,MY1=null,MY2=null;
const CFOK=/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPR-T][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/,eur=n=>(+n).toLocaleString('it-IT',{style:'currency',currency:'EUR'}),hasC=v=>v!==''&&v!=null&&Number.isFinite(+v);
function report(sel,mm){const yr=mm==='';mm=yr?11:+mm;const list=S.emps.filter(e=>(sel=='all'||e.id==sel)&&+String(e.hire).slice(0,4)<=Y),ref=new Date(Y,mm+1,0,23),pre=Y+'-'+String(mm+1).padStart(2,'0'),logo=document.querySelector('.brand img').src,N={F:'Ferie',R:'ROL',X:'Ex Festività'},DC={P:'#16a34a',F:'#7c5cff',R:'#0891b2',X:'#0891b2',M:'#dc2626',MA:'#ec4899',L:'#64748b',I:'#f59e0b',A:'#d97706'};
 $('print').innerHTML=list.map(e=>{const g=v=>fh(v/e.hpd),en=entsIn(e,yr?Y+'-01-01':pre+'-01',yr?Y+'-12-31':pre+'-31'),a=accr(e,ref),pv=mm&&!yr?accr(e,new Date(Y,mm,0,23)):{F:0,R:0,X:0},pj=accr(e,new Date(Y,11,31,23));
  const cc=cnt(e,yr?Y+'-01-01':pre+'-01',yr?Y+'-12-31':pre+'-31'),tr=Object.keys(T).filter(k=>!['M','MA','L','I'].includes(k)).map(k=>`<tr><td><i class="dt" style="background:${DC[k]}"></i>${T[k]}</td><td>${fh(cc.dy[k])}</td><td>${fh(cc.o[k])}</td></tr>`).join('');
  const cyr=carry(e),mt=['F','R','X'].map(k=>{const c=cyr[k],gd=used(e.id,k,iso(ref)),gt=used(e.id,k);return yr?`<tr><td>${N[k]}</td><td>${g(c)}</td><td>${g(a[k])}</td><td>${g(gd)}</td><td><b>${g(c+a[k]-gd)}</b></td></tr>`:`<tr><td>${N[k]}</td><td>${g(c)}</td><td>${g(a[k]-pv[k])}</td><td>${g(a[k])}</td><td>${g(gd)}</td><td><b>${g(c+a[k]-gd)}</b></td><td>${g(c+pj[k]-gt)}</td></tr>`}).join('');
  const sd=k=>cyr[k]+a[k]-used(e.id,k,iso(ref)),kc=(l,v,c)=>'<div style="--c:'+c+'"><small>'+l+'</small><b>'+v+'</b></div>',pk=kc('Giorni di presenza',fh(cc.dy.P),'#16a34a')+kc('Ore lavorate',fh(cc.o.P),'#0891b2')+kc('Saldo ferie (gg)',g(sd('F')),'#7c5cff')+kc('Saldo permessi (gg)',g(sd('R')+sd('X')),'#ea5f1c');
  const cg0=e.cg||{},ceP=(h,c)=>hasC(c)?eur(h*c):'—';let totR=0;const pcR=(l,c,ks)=>{const cb=costBase(e,yr?'':String(mm)),gd=ks[0]=='F'?cb.gF:cb.gP,mtp=ks[0]=='F'?cb.mF:cb.mP,rs=mtp-gd;if(hasC(c))totR+=rs*c;return `<tr><td>${l}</td><td>${hasC(c)?eur(c):'—'}</td><td>${fh(mtp)}</td><td>${fh(gd)}</td><td>${fh(rs)}</td><td>${ceP(rs,c)}</td></tr>`},pc=pcR('Ferie',e.cost,['F'])+pcR('Permessi (ROL + Ex Fest)',e.costP,['R','X'])+`<tr class="tt"><td colspan="5">Totale costo ore residue (ferie + permessi)</td><td>${eur(totR)}</td></tr>`;
  return `<div class="pg"><div class="ph"><img src="${logo}" alt=""><div class="pt"><h2>Digitmode – Presenze e maturazione</h2><span class="sub">${yr?'Tutto l\'anno '+Y:MN[mm]+' '+Y}</span></div></div>
  <div class="emp"><div><small>Dipendente</small><b>${esc(e.name)}</b></div><div><small>Data assunzione</small><b>${e.hire}</b></div><div><small>Ore giornaliere</small><b>${e.hpd}</b></div></div>
  <div class="pk">${pk}</div>
  <h3>Presenze e assenze ${yr?'dell\'anno':'del mese'}</h3><table><tr><th>Tipo</th><th>Giorni</th><th>Ore</th></tr>${tr}</table>
  <h3>Ferie, ROL ed ex festività (GG = giorni)</h3><table>${yr?'<tr><th></th><th>Residuo prec.</th><th>Maturato nell\'anno</th><th>Goduto nell\'anno</th><th>Saldo a fine anno</th></tr>':'<tr><th></th><th>Residuo prec.</th><th>Maturato nel mese</th><th>Maturato da inizio anno</th><th>Goduto da inizio anno</th><th>Saldo a fine mese</th><th>Proiezione saldo a fine anno</th></tr>'}${mt}</table>
  <h3>Costo ferie e permessi</h3><table><tr><th></th><th>Costo orario (€/h)</th><th>Ore maturate</th><th>Ore godute</th><th>Ore residue</th><th>Costo ore residue</th></tr>${pc}</table>
  <div class="pf"><span>Digitmode · Presenze e maturazione</span></div></div>`}).join('');
 const t=document.title;document.title='Digitmode-maturazione-'+(yr?'anno':MN[mm])+'-'+Y;window.print();document.title=t}
function askFmt(id,mm){
 const lab=mm===''?'tutto l\'anno '+Y:MN[+mm]+' '+Y;
 const ov=document.createElement('div');ov.className='fmt';
 ov.innerHTML=`<div class="fmtb" role="dialog" aria-modal="true"><h4>Scarica ${lab}</h4><p>Vuoi scaricarlo in PDF o in Excel?</p><div class="fmtr"><button class="btn" data-f="pdf">PDF</button><button class="btn xl" data-f="xl">Excel</button></div><button class="btn c" data-f="">Annulla</button></div>`;
 const close=f=>{document.removeEventListener('keydown',esc);ov.remove();DM='';const s=$('dm');if(s)s.value='';
  if(f==='pdf')report(id,mm);else if(f==='xl')exportExcel(mm,id)};
 const esc=ev=>{if(ev.key==='Escape')close('')};
 document.addEventListener('keydown',esc);
 ov.onclick=ev=>{if(ev.target===ov)close('');const b=ev.target.closest('[data-f]');if(b)close(b.dataset.f)};
 document.body.appendChild(ov);const b=ov.querySelector('[data-f="pdf"]');if(b)b.focus()}
function demo(){const y=now.getFullYear(),E=[['Giulia Bianchi','2015-06-01',{F:4,R:3,X:1}],['Marco Verdi','2019-09-16',{F:2,R:1,X:0}],['Sara Neri','2023-02-01',{F:3,R:0,X:0}],['Luca Gialli','2025-03-03',{F:0,R:0,X:0}],['Elena Rosa','2021-11-02',{F:6,R:2,X:1}]].map(([name,hire,cg])=>({id:uid(),name,hire,hpd:8,cg}));
 const Rg=[[0,'F','04-06','04-10'],[1,'F','04-06','04-10'],[0,'F','08-10','08-21'],[1,'F','08-10','08-21'],[2,'F','08-10','08-21'],[3,'F','08-17','08-21'],[2,'F','12-21','12-24'],[0,'L','05-12','05-14'],[1,'M','02-10','02-10'],[2,'M','01-19','01-20'],[3,'M','03-16','03-18'],[1,'I','06-15','06-19'],[4,'MA','05-04','12-31'],[3,'A','06-02','06-02'],[1,'X','03-23','03-23'],[1,'X','10-19','10-19'],[0,'R','02-27','02-27'],[0,'R','07-03','07-03'],[2,'R','05-22','05-22'],[1,'R','09-04','09-04']],M=new Map(),ent=[];
 Rg.forEach(([i,t,a,b])=>{for(let d=new Date(y,+a.slice(0,2)-1,+a.slice(3));iso(d)<=y+'-'+b;d.setDate(d.getDate()+1)){if(![0,6].includes(d.getDay()))M.set(E[i].id+iso(d),t)}});
 E.forEach(e=>{for(let d=new Date(y,0,1);d.getFullYear()==y;d.setDate(d.getDate()+1)){if([0,6].includes(d.getDay()))continue;const ds=iso(d);if(ds<e.hire)continue;let t=M.get(e.id+ds);if(!t&&ds<=iso(now))t='P';if(t)ent.push({id:uid(),emp:e.id,date:ds,type:t,h:8})}});
 E.forEach(e=>e.auto=iso(now));S={emps:E,ent,rules:{...DR}};save()}
function empsY(){return S.emps.filter(e=>+String(e.hire).slice(0,4)<=Y)}
function vAz(A){let tot={},rows='',W=0,WH=0,mF=0,mP=0,mFd=0,mPd=0;Object.keys(T).forEach(k=>tot[k]={h:0,d:0});
 S.emps.filter(e=>!$('pt').value||e.hire<=$('pt').value).forEach(e=>{const s=stats(e.id);const b=balances(e),gp=k=>(b.find(x=>x.k==k)||{pm:0}).pm,w=wdays(e,$('pf').value,$('pt').value),h=e.hpd||8;W+=w;WH+=w*h;mF+=gp('F');mP+=gp('R')+gp('X');mFd+=gp('F')/h;mPd+=(gp('R')+gp('X'))/h;Object.keys(T).forEach(k=>{tot[k].h+=s[k].h;tot[k].d+=s[k].d});
  const ab=['M','MA','L','I','A'].reduce((n,k)=>n+s[k].d,0);
  rows+=`<tr><td>${esc(e.name)}</td><td data-l="Giorni lavorati">${fh(s.P.d)}</td><td data-l="Ore lavorate">${fh(s.P.h)}</td><td data-l="Giorni ferie">${fh(s.F.d)}</td><td data-l="Giorni permessi">${fh(s.R.d+s.X.d)}</td><td data-l="Giorni malattia">${fh(s.M.d)}</td><td data-l="Altre assenze">${fh(ab-s.M.d)}</td></tr>`});
 const kp=kpiAgg(tot,W,WH,mF,mP,mFd,mPd,1);
 A.innerHTML=bkNote()+`<div class="kp k3 kd"><div><span>Giorni lavorati</span>${kp[0]}</div><div><span>Ore lavorate</span>${kp[1]}</div><div><span>Giorni di ferie</span>${kp[2]}</div><div><span>Giorni malattia</span>${kp[3]}</div><div><span>Giorni permessi</span>${kp[4]}</div><div><span>Altre assenze</span>${kp[5]}</div></div>
 <div class="card"><h2>Riepilogo periodo <span class="nw">${$('pf').value}</span> → <span class="nw">${$('pt').value}</span></h2><div class="tw"><table class="rs"><tr><th>Dipendente</th><th>Giorni lavorati</th><th>Ore lavorate</th><th>Giorni ferie</th><th>Giorni permessi</th><th>Giorni malattia</th><th>Altre assenze</th></tr>${rows}</table></div></div>`}
// Percentuali nei riquadri del Dipendente: presenza/malattia sui giorni lavorabili fino a oggi; ferie e permessi sulla maturazione dell'anno.
const fd=n=>n.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
function wdays(e,f,t){const a=f>e.hire?f:e.hire,z=t<iso(now)?t:iso(now);let n=0;if(a<=z)for(let d=new Date(a+'T12:00:00');iso(d)<=z;d.setDate(d.getDate()+1))if(lavorativo(d))n++;return n}
function pcb(v,den,cap){if(!(den>0))return'<em class="pc"><i style="width:0"></i></em><small>Percentuale non calcolabile</small>';const p=v/den*100;return'<em class="pc"><i style="width:'+Math.min(100,p)+'%"></i></em><small><strong>'+fd(p)+'%</strong> '+cap+'</small>'}
function kpiPct(e,s,b,f,t,fe){const wd=wdays(e,f,t),h=e.hpd||8,g=k=>(b.find(x=>x.k==k)||{pm:0}).pm,mF=g('F'),mP=g('R')+g('X');
 return[pcb(s.P.d,wd,'dei '+fh(wd)+' gg lavorabili finora'),pcb(s.P.h,wd*h,'delle '+fh(wd*h)+' h lavorabili finora'),pcb(s.F.h,mF,'su '+fd(mF/h)+' gg di ferie maturabili nell\'anno'),pcb(s.M.d,wd,'dei '+fh(wd)+' gg lavorabili finora'),pcb(s.R.h+s.X.h,mP,'su '+fd(mP/h)+' gg di permessi ROL maturabili nell\'anno'),pcb(s.MA.d+s.L.d+s.I.d+s.A.d,wd,'dei '+fh(wd)+' gg lavorabili finora')]}
function pcz(v,den,cap,tot){if(!(den>0))return'<b>—</b><em class="pc"><i style="width:0"></i></em><small><strong>'+tot+'</strong> percentuale non calcolabile</small>';const p=v/den*100;return'<b>'+fd(p)+'%</b><em class="pc"><i style="width:'+Math.min(100,p)+'%"></i></em><small><strong>'+tot+'</strong> '+cap+'</small>'}
// Riquadri di Azienda e Dipendente: in grande la percentuale, sotto la barra il totale e il valore di riferimento.
function kpiAgg(s,wd,wh,mF,mP,mFd,mPd,az){const lav=' lavorabili finora',pr=n=>fh(n)+' gg',alt=s.MA.d+s.L.d+s.I.d+s.A.d;
 return[pcz(s.P.d,wd,'dei '+pr(wd)+lav,pr(s.P.d)),pcz(s.P.h,wh,'delle '+fh(wh)+' h'+lav,fh(s.P.h)+' h'),pcz(s.F.h,mF,'su '+fd(mFd)+' gg di ferie maturabili nell\'anno',pr(s.F.d)),pcz(s.M.d,wd,'dei '+pr(wd)+lav,pr(s.M.d)),pcz(s.R.h+s.X.h,mP,'su '+fd(mPd)+' gg di permessi ROL maturabili nell\'anno',pr(s.R.d+s.X.d)),pcz(alt,wd,'dei '+pr(wd)+lav,pr(alt))]}
function vDip(A){if(!empsY().find(e=>e.id==sel))sel=empsY()[0].id;const e=S.emps.find(x=>x.id==sel),b=balances(e),pf0=MM===''?Y+'-01-01':iso(new Date(Y,+MM,1)),pt0=MM===''?Y+'-12-31':iso(new Date(Y,+MM+1,0)),per=cnt(e,pf0,pt0),s=st(per),kp=kpiPct(e,s,b,pf0,pt0,per.fe);
 const N={F:'Ferie',R:'ROL',X:'Ex Festività'},K=['F','R','X'],g=v=>fh(v/e.hpd);
 const c0={F:0,R:0,X:0};
 const g2=v=>(v/e.hpd).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2}),cg7='<colgroup><col class="c1">'+'<col>'.repeat(6)+'</colgroup>',cg6='<colgroup><col class="c1">'+'<col>'.repeat(5)+'</colgroup>';
 let mat,matM;
 if(MM===''){
 let prev={F:0,R:0,X:0},tot={F:0,R:0,X:0},rows='';const rm={F:'',R:'',X:''};
 MN.forEach((mn,m)=>{const end=new Date(Y,m+1,0,23),af=accr(e,end),cur=Y==now.getFullYear()&&m==now.getMonth(),fut=end>now,a=cur?accr(e,now):af;
  const cells=K.map(k=>{const mt1=a[k]-prev[k],sd=c0[k]+a[k]-used(e.id,k,iso(cur?now:end));tot[k]+=af[k]-prev[k];rm[k]+=`<tr class="${cur?'cur':fut?'fut':''}"><td>${mn}</td><td>${g2(mt1)}</td><td class="${cl(sd)}"><b>${g2(sd)}</b></td></tr>`;return `<td class="g${k}">${g2(mt1)}</td><td class="g${k} ge ${cl(sd)}"><b>${g2(sd)}</b></td>`}).join('');
  prev=af;rows+=`<tr class="${cur?'cur':fut?'fut':''}"><td class="mn">${mn}${cur?' · in corso':fut?' · previsione':''}</td>${cells}</tr>`});
 mat=cg7+`<thead><tr><th rowspan="2" class="mn">Mese</th>${K.map(k=>`<th colspan="2" class="g${k} ge">${N[k]} (GG)</th>`).join('')}</tr>
  <tr>${K.map(k=>`<th class="g${k}">Maturato</th><th class="g${k} ge">Residuo</th>`).join('')}</tr></thead>
  <tbody>${rows}
  <tr class="tt"><td class="mn">Totale maturato nell'anno</td>${K.map(k=>`<td class="g${k} ge" colspan="2"><b>${g2(tot[k])}</b></td>`).join('')}</tr></tbody>`;
 matM=K.map(k=>`<section class="mb g${k}"><h3>${N[k]} (GG)</h3><table><colgroup><col class="c1"><col><col></colgroup><thead><tr><th>Mese</th><th>Maturato</th><th>Residuo</th></tr></thead><tbody>${rm[k]}<tr class="tt"><td>Totale anno</td><td><b>${g2(tot[k])}</b></td><td></td></tr></tbody></table></section>`).join('')+'<p class="mu mleg">Riga evidenziata: mese in corso · righe grigie: previsione.</p>';
 }else{
 const m=+MM,ref=Y==now.getFullYear()&&m==now.getMonth()?now:new Date(Y,m+1,0,23),a=accr(e,ref),pv=m?accr(e,new Date(Y,m,0,23)):{F:0,R:0,X:0},pj=accr(e,new Date(Y,11,31,23));
 matM=K.map(k=>{const gd=used(e.id,k,iso(ref)),gt=used(e.id,k),sd=c0[k]+a[k]-gd,pr=c0[k]+pj[k]-gt,L=[['Maturato nel mese',a[k]-pv[k]],['Maturato da inizio anno',a[k]],['Goduto da inizio anno',gd],['Saldo a fine '+MN[m].toLowerCase(),sd,1],['Proiezione saldo fine anno',pr,1]];return `<section class="mb g${k}"><h3>${N[k]} (GG)</h3><dl>${L.map(([l,v,c])=>`<div><dt>${l}</dt><dd${c?` class="${cl(v)}"`:''}>${c?'<b>'+g2(v)+'</b>':g2(v)}</dd></div>`).join('')}</dl></section>`}).join('');
 mat=cg6+`<thead><tr><th class="mn"></th><th>Maturato nel mese (GG)</th><th>Maturato da inizio anno (GG)</th><th class="ge">Goduto da inizio anno (GG)</th><th>Saldo a fine ${MN[m].toLowerCase()} (GG)</th><th>Proiezione saldo fine anno (GG)</th></tr></thead><tbody>`+K.map(k=>{const gd=used(e.id,k,iso(ref)),gt=used(e.id,k),sd=c0[k]+a[k]-gd,pr=c0[k]+pj[k]-gt;return `<tr><td class="mn g${k}">${N[k]}</td><td>${g2(a[k]-pv[k])}</td><td>${g2(a[k])}</td><td class="ge">${g2(gd)}</td><td class="${cl(sd)}"><b>${g2(sd)}</b></td><td class="${cl(pr)}"><b>${g2(pr)}</b></td></tr>`}).join('')+'</tbody>';
 }

 const hy=+e.hire.slice(0,4),ny=now.getFullYear(),yL=[];for(let y=hy;y<=Math.max(ny,Y);y++)yL.push(y);
 let multi='';if(yL.length){let a1=yL.includes(MY1)?MY1:Math.max(hy,Y-2),a2=yL.includes(MY2)?MY2:Y;if(a1>a2)[a1,a2]=[a2,a1];
  const T3={F:[0,0],R:[0,0],X:[0,0]};let mr='';
  for(let y=a1;y<=a2;y++){const ac=accr(e,y==ny?now:new Date(y,11,31,23),y),cu=y==ny,fu=y>ny;
   mr+=`<tr class="${cu?'cur':fu?'fut':''}"><td class="mn">${y}${cu?' · in corso':fu?' · previsione':''}</td>${K.map(k=>{const mt=ac[k],gd=used(e.id,k,'',y),sd=mt-gd;T3[k][0]+=mt;T3[k][1]+=gd;return `<td class="g${k}">${g2(mt)}</td><td class="g${k}">${g2(gd)}</td><td class="g${k} ge ${cl(sd)}"><b>${g2(sd)}</b></td>`}).join('')}</tr>`}
  const yo=sv=>yL.map(y=>`<option ${y==sv?'selected':''}>${y}</option>`).join('');
  multi=`<div class="card"><div class="row mh"><h2>Quadro multi-anno</h2><label>Dal<select id="my1">${yo(a1)}</select></label><label>Al<select id="my2">${yo(a2)}</select></label></div>
  <div class="tw"><table class="mt my"><colgroup><col class="c1">${'<col>'.repeat(9)}</colgroup><thead><tr><th rowspan="2" class="mn">Anno</th>${K.map(k=>`<th colspan="3" class="g${k} ge">${N[k]} (GG)</th>`).join('')}</tr><tr>${K.map(k=>`<th class="g${k}">Maturato</th><th class="g${k}">Goduto</th><th class="g${k} ge">Saldo</th>`).join('')}</tr></thead><tbody>${mr}<tr class="tt"><td class="mn">Totale ${a1==a2?a1:a1+'–'+a2}</td>${K.map(k=>{const sd=T3[k][0]-T3[k][1];return `<td class="g${k}"><b>${g2(T3[k][0])}</b></td><td class="g${k}"><b>${g2(T3[k][1])}</b></td><td class="g${k} ge ${cl(sd)}"><b>${g2(sd)}</b></td>`}).join('')}</tr></tbody></table></div>
</div>`}
 const ref2=MM===''?new Date(Y,11,31,23):new Date(Y,+MM+1,0,23),to2=iso(ref2),ac2=accr(e,ref2),cF=hasC(e.cost)?+e.cost:null,cP=hasC(e.costP)?+e.costP:null,ce=(h,c)=>c==null?'—':eur(h*c),
  cRow=(l,c,mt,gd)=>`<tr><td>${l}</td><td data-l="Costo orario">${c==null?'—':eur(c)}</td><td data-l="Ore maturate">${fh(mt)}</td><td data-l="Ore godute">${fh(gd)}</td><td data-l="Ore residue">${fh(mt-gd)}</td><td data-l="Costo ore residue">${ce(mt-gd,c)}</td></tr>`,
  cb=costBase(e,MM),mF2=cb.mF,mP2=cb.mP,gF=cb.gF,gP=cb.gP,totRes=(cF==null?0:(mF2-gF)*cF)+(cP==null?0:(mP2-gP)*cP),
  costT=`<h3 style="margin:18px 0 8px">Costo ferie e permessi <span class="mu" style="font-weight:400">(${MM===''?'anno '+Y:MN[+MM].toLowerCase()+' '+Y})</span></h3><div class="tw"><table class="rs"><tr><th></th><th>Costo orario (€/h)</th><th>Ore maturate</th><th>Ore godute</th><th>Ore residue</th><th>Costo ore residue</th></tr>${cRow('Ferie',cF,mF2,gF)}${cRow('Permessi (ROL + Ex Fest)',cP,mP2,gP)}<tr class="tot"><td colspan="5">Totale costo ore residue (ferie + permessi)</td><td data-l="Totale costo ore residue"><b>${eur(totRes)}</b></td></tr></table></div>${cF==null&&cP==null?'<p class="mu mleg">Imposta il costo orario ferie e permessi in Anagrafica per vedere i costi.</p>':''}`;
 A.innerHTML=`<div class="card row"><label>Dipendente<select id="ds">${empsY().map(x=>`<option value="${x.id}" ${x.id==sel?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><span class="mu">Assunto il ${e.hire} · ${e.hpd} h/giorno${hasC(e.cost)?' · ferie '+eur(e.cost)+'/h':''}${hasC(e.costP)?' · permessi '+eur(e.costP)+'/h':''}</span></div>
 <div class="kp k3 kd"><div><span>Giorni di presenza</span><b>${fh(s.P.d)}</b>${kp[0]}</div><div><span>Ore lavorate</span><b>${fh(s.P.h)}</b>${kp[1]}</div><div><span>Ferie godute</span><b>${fh(s.F.d)} gg</b>${kp[2]}</div><div><span>Malattia</span><b>${fh(s.M.d)} gg</b>${kp[3]}</div><div><span>Permessi goduti</span><b>${fh(s.R.d+s.X.d)} gg</b>${kp[4]}</div><div><span>Altre assenze</span><b>${fh(s.MA.d+s.L.d+s.I.d+s.A.d)} gg</b>${kp[5]}</div></div>
 <div class="card"><div class="row mh"><h2>Maturazione ${Y}</h2><label>Mese<select id="mm"><option value="">Tutti i mesi</option>${MN.map((m,i)=>`<option value="${i}" ${MM!==''&&+MM===i?'selected':''}>${m}</option>`).join('')}</select></label></div><div class="tw mtw desk"><table class="mt${MM===''?'':' md'}">${mat}</table></div><div class="mtm">${matM}</div>${costT}</div>
 ${multi}
 <div class="card"><h2>Dettaglio periodo (fino a oggi)</h2><div class="tw"><table><tr><th>Tipo</th><th>Giorni</th><th>Ore</th></tr>${Object.keys(T).filter(k=>!['MA','L','I'].includes(k)||per.o[k]>0).map(k=>`<tr><td>${T[k]}</td><td>${fh(per.dy[k])}</td><td>${fh(per.o[k])}</td></tr>`).join('')}<tr class="tot"><td><b>Totale fino a oggi</b></td><td><b>${fh(per.tot-per.fe)}</b></td><td><b>${fh(Object.keys(T).reduce((t,k)=>t+per.o[k],0))}</b></td></tr></table></div></div>
 <div class="card dl"><div class="dlc"><label>Maturazione ferie, ROL ed ex festività da scaricare<select id="dm"><option value="" ${DM===''?'selected':''}>Scegli...</option><option value="y" ${DM==='y'?'selected':''}>Tutto l'anno ${Y}</option>${MN.map((m,i)=>`<option value="${i}" ${DM!==''&&DM!=='y'&&+DM===i?'selected':''}>${m} ${Y}</option>`).join('')}</select></label></div></div>
 <div class="card"><h2>Quadro annuale ${Y}</h2>${legend()}<div class="tw gdesk"><table class="gr"><tr><th>Mese</th>${dh()}</tr>${MN.map((m,i)=>`<tr><td>${m}</td>${grid(e.id,i)}</tr>`).join('')}</table></div><div class="gmob"><div class="tw"><table class="gr gt"><tr><th></th>${MN.map(m=>`<th>${m.slice(0,3)}</th>`).join('')}</tr>${gridT(e.id)}</table></div></div></div>`;
 if($('my1')){$('my1').onchange=ev=>{MY1=+ev.target.value;render()};$('my2').onchange=ev=>{MY2=+ev.target.value;render()}}$('dm').onchange=ev=>{DM=ev.target.value;if(DM!==''){MM=DM==='y'?'':DM;render();askFmt(e.id,DM==='y'?'':DM)}};$('mm').onchange=ev=>{MM=ev.target.value;render()};
 $('ds').onchange=ev=>{sel=ev.target.value;render()}}
// Ricalcola il giorno: le ore non coperte da assenze diventano presenza; senza assenze il giorno torna a presenza intera.
function balDay(em,ds){const np=S.ent.filter(a=>a.emp==em.id&&a.date==ds&&a.type!='P');
 if(!np.length){fixDay(em,ds,true);S.ent.filter(a=>a.emp==em.id&&a.date==ds&&a.type=='P').forEach(a=>a.h=em.hpd);return}
 S.ent=S.ent.filter(a=>!(a.emp==em.id&&a.date==ds&&a.type=='P'));
 const rest=Math.round((em.hpd-np.reduce((t,a)=>t+a.h,0))*100)/100;
 if(rest>1e-9&&lavorativo(new Date(ds+'T12:00:00')))S.ent.push({id:uid(),emp:em.id,date:ds,type:'P',h:rest})}
function dropEnt(old){S.ent=S.ent.filter(a=>a!==old);if(old.type=='P')return;const em=S.emps.find(x=>x.id==old.emp);if(!em)return;balDay(em,old.date)}
function vReg(A){const e0=empsY().find(e=>e.id==sel)||empsY()[0];sel=e0.id;
 const y0=Y+'-01-01',y1=Y+'-12-31',dd=Y==now.getFullYear()?iso(now):iso(new Date(Y,now.getMonth(),Math.min(now.getDate(),new Date(Y,now.getMonth()+1,0).getDate())));
 if(REG&&!S.ent.some(a=>a.id==REG&&a.emp==sel))REG=null;
 const list=S.ent.filter(a=>a.emp==sel&&a.date.startsWith(Y)).sort((a,b)=>b.date.localeCompare(a.date)),gm={};list.forEach(a=>{const k=a.date.slice(0,7);(gm[k]=gm[k]||[]).push(a)});const ks=Object.keys(gm).sort().reverse(),eo=REG?S.ent.find(a=>a.id==REG&&a.emp==sel):null,rw=a=>`<tr><td>${a.date}</td><td>${T[a.type]}</td><td>${fh(a.h)}</td><td><button class="btn g mod" data-m="${a.id}">Modifica</button><button class="btn g" data-d="${a.id}">✕</button></td></tr>`;
 A.innerHTML=`<div class="card"><h2>Registro assenze</h2><div class="row">
 <label>Dipendente<select id="re">${empsY().map(x=>`<option value="${x.id}" ${x.id==sel?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
 <label>Tipo<select id="rt">${['F','R','M','A','P'].concat(eo&&!['F','R','M','A','P'].includes(eo.type)?[eo.type]:[]).map(k=>`<option value="${k}"${eo&&eo.type==k?' selected':''}>${k=='P'?'Presenza (correzione manuale)':T[k]}</option>`).join('')}</select></label>
 <label>Dal<input type="date" id="rf" value="${eo?eo.date:dd}" min="${y0}" max="${y1}"></label><label>Al<input type="date" id="rz" value="${eo?eo.date:dd}" min="${y0}" max="${y1}"></label>
 <label>Ore al giorno<input type="number" id="rh" value="${eo?eo.h:8}" min="0" max="24" step="any" inputmode="decimal"></label>
 <button class="btn" id="ra">${eo?'Salva modifiche':'Aggiungi'}</button>${eo?'<button class="btn g" id="rx">Annulla</button>':''}</div></div>
 ${ks.length?ks.map((k,i)=>`<div class="card"><h2>${i?'':'Ultimo mese · '}${MN[+k.slice(5)-1]} ${k.slice(0,4)}</h2><div class="tw"><table class="lv"><tr><th>Data</th><th>Tipo</th><th>Ore</th><th></th></tr>${gm[k].map(rw).join('')}</table></div></div>`).join(''):'<div class="card"><h2>Ultimo mese</h2>Nessuna voce registrata.</div>'}`;
 $('re').onchange=ev=>{sel=ev.target.value;REG=null;render()};
 $('rh').oninput=ev=>limH(ev.target); if($('rx'))$('rx').onclick=()=>{REG=null;render()};
 A.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{REG=b.dataset.m;render();window.scrollTo({top:0,behavior:'smooth'})});
 $('ra').onclick=()=>{const f=$('rf').value,z=$('rz').value,em=S.emps.find(x=>x.id==sel),hd=em.hpd;if(!f||!z||z<f)return alert('Controlla le date');if(f<y0||z>y1)return alert('Le date devono essere dentro l\'anno '+Y+' scelto nel filtro Anno');
  const tp=$('rt').value,oi=+$('rh').value;if($('rh').value.trim()==='')return toast('Inserisci le ore al giorno','err');if(!okH(oi))return toast('Le ore devono essere maggiori di 0 e al massimo 24','err');
  const h=Math.min(oi,hd),r2=v=>Math.round(v*100)/100,sm=L=>L.reduce((t,a)=>t+a.h,0);let wk=false;
  for(let d=new Date(f+'T12:00:00');iso(d)<=z;d.setDate(d.getDate()+1))if(![0,6].includes(d.getDay())){wk=true;break}
  if(!wk)return alert('Scegli almeno un giorno lavorativo (da lunedì a venerdì)');
  const bak=JSON.stringify(S.ent),old=REG?S.ent.find(a=>a.id==REG&&a.emp==sel):null;if(old)S.ent=S.ent.filter(a=>a!==old);
  // Le ore si aggiungono allo stesso giorno, a mano: stessa voce = si aggiorna, voci diverse = restano insieme (es. 4 h presenza + 4 h permesso).
  // Solo la presenza intera automatica del giorno viene tolta quando inserisci le ore a mano; una voce che copre tutte le ore del giorno sostituisce le altre.
  const plan=[];let big=null;
  for(let d=new Date(f+'T12:00:00');iso(d)<=z;d.setDate(d.getDate()+1)){if([0,6].includes(d.getDay()))continue;const ds=iso(d),oth=S.ent.filter(a=>a.emp==sel&&a.date==ds);
   const aut=tp!='P';
   const keep=h>=hd?[]:oth.filter(a=>a.type!=tp&&!(aut&&a.type=='P'));
   const L=[...keep.map(a=>({type:a.type,h:a.h})),{type:tp,h}];
   if(!big&&sm(L)>hd+1e-9)big={ds,t:r2(sm(L))};
   // Le ore che restano nella giornata diventano presenza in automatico (solo giorni lavorativi).
   if(aut&&lavorativo(d)&&sm(L)<hd-1e-9)L.push({type:'P',h:r2(hd-sm(L))});
   plan.push({oth,ds,L,sost:h>=hd&&oth.some(a=>a.type!=tp&&a.type!='P')})}
  if(big){S.ent=JSON.parse(bak);return alert('Il '+big.ds.split('-').reverse().join('/')+' arriverebbe a '+fh(big.t)+' ore, ma il giorno ne ha '+fh(hd)+'. Riduci le ore oppure modifica o elimina l\'altra voce di quel giorno.')}
  REG=null;let nw=0,gia=0,rp=0;const fixOld=()=>{if(old&&old.type!='P'&&!plan.some(p=>p.ds==old.date))balDay(em,old.date)};
  plan.forEach(({oth,ds,L,sost})=>{
   if(L.length==oth.length&&L.every(x=>oth.some(a=>a.type==x.type&&Math.abs(a.h-x.h)<1e-9))){gia++;return}
   if(sost)rp++;
   S.ent=S.ent.filter(a=>!oth.includes(a));L.forEach(x=>S.ent.push({id:uid(),emp:sel,date:ds,type:x.type,h:x.h}));nw++});
  fixOld();
  if(!nw){if(old){save();render()}return toast(gia>1?'Dati già inseriti: questi '+gia+' giorni sono già registrati':'Dato già inserito: questo giorno è già registrato','warn')}
  save();render();if(old)toast('✓ Voce modificata');else if(gia)toast(nw+' giorni salvati · '+gia+' già inseriti','warn');else if(rp)toast(rp+(rp>1?' giorni':' giorno')+': assenza precedente sostituita','warn')};
 A.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{if(!confirm('Vuoi eliminare questa voce?'))return;const old=S.ent.find(a=>a.id==b.dataset.d);if(old)dropEnt(old);if(REG==b.dataset.d)REG=null;save();render()})}
const CFO=[1,0,5,7,9,13,15,17,19,21,2,4,18,20,11,3,6,8,12,14,16,10,22,25,24,23],CFD=[1,0,5,7,9,13,15,17,19,21];
function cfCtl(s){let t=0;for(let i=0;i<15;i++){const c=s[i],dg=c>='0'&&c<='9',d=dg?+c:c.charCodeAt(0)-65;t+=i%2?d:(dg?CFD[d]:CFO[d])}return String.fromCharCode(65+t%26)}
const cfSex=cf=>+cf.slice(9,11).replace(/[LMNPQRSTUV]/g,c=>'LMNPQRSTUV'.indexOf(c))>40?'F':'M';
function cfCheck(cf,sx){if(!CFOK.test(cf))return'Codice fiscale non valido: deve avere 16 caratteri nel formato corretto (es. RSSMRA85T10A562S).';
 if(cfCtl(cf)!==cf[15])return'Codice fiscale non valido: il carattere di controllo non corrisponde. Controlla che sia scritto correttamente.';
 if(sx&&sx!==cfSex(cf))return'Il sesso indicato non coincide con quello del codice fiscale ('+(cfSex(cf)=='F'?'Femmina':'Maschio')+').';return''}
function vAnag(A){const ed=EDIT?S.emps.find(x=>x.id==EDIT):null;if(!ed)EDIT=null;
 const nm=ed?ed.name.split(' ')[0]:'',cg=ed?ed.name.split(' ').slice(1).join(' '):'',c=ed&&ed.cg||{};
 A.innerHTML=`<div class="two"><div class="card"><h2>${ed?'Modifica dipendente':'Nuovo dipendente'}</h2><div class="form">
 <label>Nome<input id="an" value="${esc(nm)}"></label><label>Cognome<input id="ac" value="${esc(cg)}"></label>
 <label>Codice fiscale<input id="af" maxlength="16" autocomplete="off" style="text-transform:uppercase" value="${esc(ed&&ed.cf||'')}"></label>
 <label>Sesso<select id="as"><option value="">—</option><option value="M" ${ed&&ed.sex=='M'?'selected':''}>Maschio</option><option value="F" ${ed&&ed.sex=='F'?'selected':''}>Femmina</option></select></label>
 <label>Data assunzione<input type="date" id="ah" value="${ed?ed.hire:''}"></label><label>Ore/giorno<input type="number" id="ap" value="${ed?ed.hpd:8}" step="0.25" min="0.25" max="24" inputmode="decimal"></label>
 <label>Costo orario ferie (€/h)<input type="number" id="ak" min="0" step="0.01" value="${ed&&hasC(ed.cost)?ed.cost:''}"></label>
 <label>Costo orario permessi (€/h)<input type="number" id="akp" min="0" step="0.01" value="${ed&&hasC(ed.costP)?ed.costP:''}"></label>
 <button class="btn" id="aa">${ed?'Salva modifiche':'Aggiungi'}</button>${ed?'<button class="btn g" id="ae">Annulla</button>':''}</div></div>
 <div class="card"><h2>Dipendenti</h2><div class="tw"><table class="rs"><tr><th>Nome e cognome</th><th>Codice fiscale</th><th>Sesso</th><th>Assunzione</th><th>Ore/gg</th><th>Costo orario ferie</th><th>Costo orario permessi</th><th></th></tr>${S.emps.map(e=>`<tr><td>${esc(e.name)}</td><td data-l="Codice fiscale">${esc(e.cf||'—')}</td><td data-l="Sesso">${e.sex||'—'}</td><td data-l="Assunzione">${e.hire}</td><td data-l="Ore/gg">${e.hpd}</td><td data-l="Costo orario ferie">${hasC(e.cost)?eur(e.cost):'—'}</td><td data-l="Costo orario permessi">${hasC(e.costP)?eur(e.costP):'—'}</td><td class="ac"><button class="btn g" data-e="${e.id}">Modifica</button> <button class="btn g" data-x="${e.id}">Elimina</button></td></tr>`).join('')}</table></div></div></div>`;
 $('ap').oninput=ev=>limH(ev.target);
 $('aa').onclick=()=>{const n1=$('an').value.trim(),n2=$('ac').value.trim(),h=$('ah').value,cf=$('af').value.replace(/\s+/g,'').toUpperCase(),co=$('ak').value,cp=$('akp').value;let sx=$('as').value;
  if(!n1||!n2||!h)return alert('Nome, cognome e data assunzione sono obbligatori');
  if(cf){const er=cfCheck(cf,sx);if(er)return alert(er);
   if(S.emps.some(x=>x.cf===cf&&x.id!=EDIT))return alert('Esiste già un dipendente con questo codice fiscale.');if(!sx)sx=cfSex(cf)}
  if(co!==''&&!(+co>=0))return alert('Il costo orario ferie deve essere un numero positivo');
  if(cp!==''&&!(+cp>=0))return alert('Il costo orario permessi deve essere un numero positivo');
  if(!okH(+$('ap').value))return toast('Le ore giornaliere devono essere maggiori di 0 e al massimo 24','err');
  const rec={name:n1+' '+n2,hire:h,hpd:+$('ap').value,cf,sex:sx,cost:co===''?'':+co,costP:cp===''?'':+cp};
  if(ed)Object.assign(ed,rec);else S.emps.push({id:uid(),...rec});
  EDIT=null;autoFill();save();render()};
 if($('ae'))$('ae').onclick=()=>{EDIT=null;render()};
 A.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{EDIT=b.dataset.e;render();try{scrollTo(0,0)}catch(x){}});
 A.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{if(confirm('Eliminare il dipendente e le sue voci?')){if(EDIT==b.dataset.x)EDIT=null;S.emps=S.emps.filter(e=>e.id!=b.dataset.x);S.ent=S.ent.filter(a=>a.emp!=b.dataset.x);save();render()}})}

// ---- BACKUP ----
const LB='presenze_lastbackup';let bkSess=false;
function lastBackup(){try{const v=localStorage.getItem(LB);return v?new Date(v):null}catch(e){return null}}
function bkStatus(){const as=$('as');if(as)as.textContent=autoText();const el=$('bs');if(!el)return;const l=lastBackup();
 el.textContent='Dati attuali: '+S.emps.length+' dipendenti, '+S.ent.length+' voci. '+(l?'Ultimo backup esportato: '+l.toLocaleString('it-IT')+'.':'Nessun backup esportato da questo browser.')}
function bkNote0(){const l=lastBackup(),old=!bkSess&&(!l||(Date.now()-l)>7*864e5);
 return old?'<div class="card warn bkw">⚠ '+(l?'L\'ultimo backup risale al '+l.toLocaleDateString('it-IT'):'Non hai ancora esportato nessun backup')+'. Vai in <b>Impostazioni → Backup dei dati</b> ed esportalo per non perdere i dati.</div>':''}
// ===== Salvataggio automatico su file (Chrome / Edge: File System Access API) =====
const AUTO_OK='showSaveFilePicker' in window,AUTOL='presenze_autolast';
let autoH=null,autoSt='off',autoT=0,autoBusy=false,autoDirty=false,autoErr='';
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open('digitmode_auto',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function idbGet(k){const d=await idb();return new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function idbSet(k,v){const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');v===undefined?t.objectStore('kv').delete(k):t.objectStore('kv').put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
function backupPayload(d){return{app:'Digitmode-Presenze',format:1,exportedAt:d.toISOString(),data:{emps:S.emps,ent:S.ent,rules:S.rules}}}
function autoLast(){try{const v=localStorage.getItem(AUTOL);return v?new Date(v):null}catch(e){return null}}
function autoText(){if(!AUTO_OK)return 'Il salvataggio automatico su file non è disponibile in questo browser: usa Chrome o Edge.';
 if(autoSt==='off')return 'Salvataggio automatico non attivo. Attivalo e scegli dove salvare il file (meglio una cartella sincronizzata, ad esempio OneDrive o Google Drive): si aggiorna da solo a ogni modifica.';
 if(autoSt==='need')return 'Salvataggio automatico in pausa: il browser chiede di riconfermare l\'accesso al file «'+(autoH?autoH.name:'')+'».';
 if(autoSt==='err')return 'Salvataggio automatico non riuscito'+(autoErr?' ('+autoErr+')':'')+'. Controlla che il file esista ancora.';
 const l=autoLast();return 'Salvataggio automatico attivo su «'+(autoH?autoH.name:'')+'»'+(l?'. Ultimo salvataggio: '+l.toLocaleString('it-IT'):'')+'.'}
function autoBtn(){if(!AUTO_OK)return '';
 if(autoSt==='off')return '<button class="btn" data-auto="on">Attiva salvataggio automatico su file</button>';
 return (autoSt==='need'||autoSt==='err'?'<button class="btn" data-auto="re">Riattiva</button>':'')+'<button class="btn g" data-auto="off">Disattiva salvataggio automatico</button>'}
function autoUI(){if(ready)render()}
async function autoWrite(){if(!autoH||autoSt!=='ok')return;
 if(autoBusy){autoDirty=true;return}autoBusy=true;
 try{const w=await autoH.createWritable();await w.write(JSON.stringify(backupPayload(new Date()),null,1));await w.close();
  try{localStorage.setItem(AUTOL,new Date().toISOString())}catch(e){}autoErr='';
  const as=$('as');if(as)as.textContent=autoText()}
 catch(e){autoSt='err';autoErr=(e&&e.message)||String(e);autoDirty=false;autoBusy=false;autoUI();return}
 autoBusy=false;if(autoDirty){autoDirty=false;autoWrite()}}
function autoSchedule(){if(autoSt!=='ok')return;clearTimeout(autoT);autoT=setTimeout(autoWrite,700)}
async function autoEnable(){
 try{const h=await showSaveFilePicker({suggestedName:'Digitmode-dati.json',types:[{description:'Backup Digitmode (.json)',accept:{'application/json':['.json']}}]});
  const f=await h.getFile();let D=null;
  if(f.size>0){try{D=cleanBackup(JSON.parse(await f.text()))}catch(e){D=null}
   if(D){if(!confirm('Il file scelto contiene già dei dati ('+D.emps.length+' dipendenti, '+D.ent.length+' voci).\n\nOK = CARICA i dati del file (sostituiscono quelli attuali di questo browser)\nAnnulla = non caricarli'))
     {D=null;if(!confirm('Vuoi allora SOVRASCRIVERE il file con i dati attuali ('+S.emps.length+' dipendenti, '+S.ent.length+' voci)?'))return}}
   else if(!confirm('Il file scelto non è un backup di Digitmode e verrà SOVRASCRITO con i tuoi dati. Continuare?'))return}
  if(D){try{localStorage.setItem('presenze_v2_prima_import',JSON.stringify(S))}catch(e){}
   S={emps:D.emps,ent:D.ent,rules:D.rules,rv:10,fv:1};syncR();normEnt();autoFill();if(!save())return;sel=null;view=S.emps.length?'az':'anag'}
  autoH=h;autoSt='ok';autoErr='';await idbSet('fh',h);await autoWrite();autoUI();if(autoSt==='ok')toast('✓ Salvataggio automatico attivato')}
 catch(e){if(e&&e.name==='AbortError')return;autoErr=(e&&e.message)||String(e);alert('Impossibile attivare il salvataggio automatico: '+autoErr)}}
async function autoDisable(){autoH=null;autoSt='off';autoErr='';clearTimeout(autoT);try{await idbSet('fh',undefined)}catch(e){}autoUI()}
async function autoReactivate(){if(!autoH)return;
 try{const r=await autoH.requestPermission({mode:'readwrite'});if(r!=='granted')return;autoSt='ok';autoErr='';await autoWrite();autoUI()}
 catch(e){autoSt='err';autoErr=(e&&e.message)||String(e);autoUI()}}
async function initAuto(){if(!AUTO_OK)return;
 try{const h=await idbGet('fh');if(!h)return;autoH=h;const q=await h.queryPermission({mode:'readwrite'});autoSt=q==='granted'?'ok':'need';if(autoSt==='ok')autoWrite();autoUI()}catch(e){}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-auto]');if(!b)return;const a=b.dataset.auto;
 if(a==='on')autoEnable();else if(a==='re')autoReactivate();else if(a==='off'&&confirm('Disattivare il salvataggio automatico su file?'))autoDisable()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&autoSt==='ok'){clearTimeout(autoT);autoWrite()}});
setTimeout(initAuto,0);
function bkNote(){if(autoSt==='ok')return '';
 if(autoSt==='need')return '<div class="card warn bkw" data-a="1">⚠ Salvataggio automatico in pausa: il browser chiede di riconfermare l\'accesso al file. <button class="btn" data-auto="re" style="margin-left:8px">Riattiva</button></div>';
 if(autoSt==='err')return '<div class="card warn bkw" data-a="1">⚠ Salvataggio automatico non riuscito'+(autoErr?' ('+esc(autoErr)+')':'')+'. Controlla che il file esista ancora. <button class="btn" data-auto="re" style="margin-left:8px">Riprova</button></div>';
 return bkNote0()}
function exportBackup(){const d=new Date(),p=n=>String(n).padStart(2,'0');
 const payload=backupPayload(d);
 const blob=new Blob([JSON.stringify(payload,null,1)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='Digitmode-backup-'+iso(d)+'_'+p(d.getHours())+p(d.getMinutes())+'.json';document.body.appendChild(a);a.click();
 setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},2000);
 bkSess=true;document.querySelectorAll('.bkw:not([data-a])').forEach(x=>x.remove());try{localStorage.setItem(LB,d.toISOString())}catch(e){}}
function cleanBackup(raw){const D=raw&&raw.data?raw.data:raw;
 if(!D||!Array.isArray(D.emps)||!Array.isArray(D.ent))throw new Error('il file non è un backup di Digitmode Presenze.');
 const okD=v=>typeof v=='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(new Date(v)),fin=v=>v!==''&&v!==null&&Number.isFinite(+v);
 const ids=new Set(),emps=D.emps.map((e,i)=>{
  if(!e||e.id==null||String(e.id)==='')throw new Error('dipendente n. '+(i+1)+' senza identificativo.');
  const id=String(e.id),name=String(e.name==null?'':e.name).trim();
  if(!name)throw new Error('dipendente n. '+(i+1)+' senza nome.');
  if(!okD(e.hire))throw new Error('dipendente "'+name+'": data di assunzione non valida.');
  if(ids.has(id))throw new Error('dipendente "'+name+'" duplicato.');ids.add(id);
  const c=e.cg||{};
  const cf0=String(e.cf==null?'':e.cf).replace(/\s+/g,'').toUpperCase();
  if(cf0&&!CFOK.test(cf0))throw new Error('dipendente "'+name+'": codice fiscale non valido.');
  return{id,name,hire:e.hire,hpd:fin(e.hpd)&&okH(+e.hpd)?+e.hpd:8,cg:{F:fin(c.F)?+c.F:0,R:fin(c.R)?+c.R:0,X:fin(c.X)?+c.X:0},cf:cf0,sex:['M','F'].includes(e.sex)?e.sex:'',cost:fin(e.cost)&&+e.cost>=0?+e.cost:'',costP:fin(e.costP)&&+e.costP>=0?+e.costP:'',auto:okD(e.auto)?e.auto:''}});
 const ent=D.ent.map((a,i)=>{
  if(!a||!ids.has(String(a.emp)))throw new Error('voce n. '+(i+1)+' collegata a un dipendente inesistente.');
  if(!okD(a.date))throw new Error('voce n. '+(i+1)+': data non valida.');
  if(!T[a.type])throw new Error('voce n. '+(i+1)+': tipo "'+a.type+'" sconosciuto.');
  if(!fin(a.h)||!okH(+a.h))throw new Error('voce n. '+(i+1)+': ore non valide (devono essere tra 0 e 24).');
  return{id:a.id!=null&&String(a.id)!==''?String(a.id):uid(),emp:String(a.emp),date:a.date,type:a.type,h:+a.h}});
 const R=D.rules||{},rules={};Object.keys(DR).forEach(k=>rules[k]=fin(R[k])?+R[k]:DR[k]);if(!fin(R.p1)){rules.y1=DR.y1;rules.y2=DR.y2}
 return{emps,ent,rules}}
function importBackup(file){const r=new FileReader();
 r.onerror=()=>alert('Importazione annullata: impossibile leggere il file.');
 r.onload=()=>{let raw,D;
  try{raw=JSON.parse(r.result)}catch(e){return alert('Importazione annullata: il file non è un JSON valido.')}
  try{D=cleanBackup(raw)}catch(e){return alert('Importazione annullata: '+e.message)}
  if(!confirm('Il backup contiene '+D.emps.length+' dipendenti e '+D.ent.length+' voci.\n\nI dati attuali ('+S.emps.length+' dipendenti, '+S.ent.length+' voci) verranno SOSTITUITI.\n\nContinuare?'))return;
  try{localStorage.setItem('presenze_v2_prima_import',JSON.stringify(S))}catch(e){}
  S={emps:D.emps,ent:D.ent,rules:D.rules,rv:10,fv:1};syncR();normEnt();autoFill();
  if(!save())return;
  sel=null;view=S.emps.length?'az':'anag';render();alert('Backup importato correttamente.')};
 r.readAsText(file)}
// ---- EXCEL (.xlsx): generato direttamente nel browser, senza librerie e senza internet ----
const XE=t=>String(t).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const colL=i=>{let t='';for(i++;i>0;i=Math.floor((i-1)/26))t=String.fromCharCode(65+(i-1)%26)+t;return t};
const serial=d=>Math.round((Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10))-Date.UTC(1899,11,30))/864e5);
const XS={n2:2,date:3,eur:4};
function cellXml(c,r,ci,head){const ref=colL(ci)+(r+1);
 if(c==null||c==='')return head?`<c r="${ref}" s="1"/>`:'';
 if(head)return `<c r="${ref}" s="1" t="inlineStr"><is><t>${XE(c)}</t></is></c>`;
 if(typeof c=='string')return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${XE(c)}</t></is></c>`;
 if(typeof c=='number')return `<c r="${ref}"><v>${c}</v></c>`;
 if(c.d)return `<c r="${ref}" s="3"><v>${serial(c.d)}</v></c>`;
 return `<c r="${ref}" s="${XS[c.s]||0}">${c.f?`<f>${XE(c.f)}</f>`:''}<v>${c.v}</v></c>`}
function sheetXml(sh){const R=sh.rows,nc=Math.max(...R.map(r=>r.length));
 const w=sh.widths||[],cols=Array.from({length:nc},(_,i)=>`<col min="${i+1}" max="${i+1}" width="${w[i]||16}" customWidth="1"/>`).join('');
 const pane=sh.freeze?`<pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/>`:'';
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols><sheetData>${R.map((r,ri)=>`<row r="${ri+1}">${r.map((c,ci)=>cellXml(c,ri,ci,ri===0&&sh.head)).join('')}</row>`).join('')}</sheetData>${sh.filter?`<autoFilter ref="A1:${colL(nc-1)}${R.length}"/>`:''}</worksheet>`}
const XSTY='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="#,##0.00"/><numFmt numFmtId="166" formatCode="#,##0.00 &quot;€&quot;"/></numFmts><fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFDE3D3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFB0B6C4"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
const CRCT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRCT[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
function zipStore(files,mime){const te=new TextEncoder(),parts=[],cd=[],u16=v=>[v&255,v>>8&255],u32=v=>[v&255,v>>8&255,v>>16&255,v>>>24&255];let off=0;
 files.forEach(([name,txt])=>{const nb=te.encode(name),d=te.encode(txt),crc=crc32(d);
  const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(d.length),...u32(d.length),...u16(nb.length),...u16(0)]);
  parts.push(lh,nb,d);
  cd.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(d.length),...u32(d.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb);
  off+=lh.length+nb.length+d.length});
 const cs=cd.reduce((n,x)=>n+x.length,0),end=new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cs),...u32(off),0,0]);
 return new Blob([...parts,...cd,end],{type:mime})}
function buildXlsx(sheets){const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',RT='http://schemas.openxmlformats.org/officeDocument/2006/relationships',PK='http://schemas.openxmlformats.org/package/2006/relationships',CT='application/vnd.openxmlformats-officedocument.spreadsheetml.';
 return zipStore([
  ['[Content_Types].xml',H+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="'+CT+'sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="'+CT+'styles+xml"/>'+sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="${CT}worksheet+xml"/>`).join('')+'</Types>'],
  ['_rels/.rels',H+`<Relationships xmlns="${PK}"><Relationship Id="rId1" Type="${RT}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
  ['xl/workbook.xml',H+`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${RT}"><bookViews><workbookView/></bookViews><sheets>${sheets.map((s,i)=>`<sheet name="${XE(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><calcPr fullCalcOnLoad="1"/></workbook>`],
  ['xl/_rels/workbook.xml.rels',H+`<Relationships xmlns="${PK}">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="${RT}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="${RT}/styles" Target="styles.xml"/></Relationships>`],
  ['xl/styles.xml',XSTY],
  ...sheets.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,H+sheetXml(s).replace(/^<\?xml[^>]*\?>/,'')])],CT+'sheet')}
function exportExcel(mm,empId){try{
 const f0=mm===''?Y+'-01-01':Y+'-'+p2(+mm+1)+'-01',f1=mm===''?Y+'-12-31':Y+'-'+p2(+mm+1)+'-31';
 const sub=S.emps.filter(e=>!empId||e.id==empId),ent=sub.flatMap(e=>entsIn(e,f0,f1).map(a=>({a,e}))).sort((x,y)=>x.e.name.localeCompare(y.e.name,'it')||x.a.date.localeCompare(y.a.date));
 const reg=[['Dipendente','Data','Mese','Tipo','Ore','Ore/giorno','Costo orario ferie (€/h)','Costo orario permessi (€/h)','Giorni']];
 ent.forEach(({a,e})=>{const ri=reg.length+1;reg.push([e.name,{d:a.date},MN[+a.date.slice(5,7)-1],T[a.type],{v:a.h,s:'n2'},e.hpd,hasC(e.cost)?{v:+e.cost,s:'eur'}:'',hasC(e.costP)?{v:+e.costP,s:'eur'}:'',{f:`E${ri}/F${ri}`,v:a.h/e.hpd,s:'n2'}])});
 const RL={fa:'Ferie annue (giorni)',f:'Ferie ogni mese (ore)',ra:'ROL annuo (ore)',r3:'ROL ogni mese (ore, dal 3° periodo)',r1:'ROL ore/mese 1° periodo',y1:'Anni fine 1° periodo',r2:'ROL ore/mese 2° periodo',y2:'Anni fine 2° periodo',xa:'Ex Fest annue (ore)',x:'Ex Fest ogni mese (ore)',p1:'ROL spettanti 1ª fascia (%)',p2:'ROL spettanti 2ª fascia (%)'};
 const reg2=[['Parametro','Valore'],...Object.keys(RL).map(k=>[RL[k],{v:+S.rules[k]||0,s:'n2'}]),[''],['Formule'],
  ['Giorni = Ore / Ore per giorno'],
  ['Saldo a fine mese = Residuo prec. + Maturato da inizio anno − Goduto da inizio anno']];
 // foglio costo ore residue (ferie + permessi): ore residue = maturate − godute; costo = ore residue × costo orario
 const ref2=mm===''?new Date(Y,11,31,23):new Date(Y,+mm+1,0,23),to2=iso(ref2),cs=[['Dipendente','Voce','Costo orario (€/h)','Ore maturate','Ore godute','Ore residue','Costo ore residue']],totRows=[];let gt=0;
 sub.forEach(e=>{const cg=e.cg||{},ac=accr(e,ref2),cF=hasC(e.cost)?+e.cost:null,cP=hasC(e.costP)?+e.costP:null,
  cb=costBase(e,mm),mF=cb.mF,mP=cb.mP,gF=cb.gF,gP=cb.gP,
  r1=cs.length+1,r2=r1+1,r3=r1+2,tF=cF==null?0:(mF-gF)*cF,tP=cP==null?0:(mP-gP)*cP,
  line=(l,r,c,m,g)=>[e.name,l,c==null?'':{v:c,s:'eur'},{v:m,s:'n2'},{v:g,s:'n2'},{f:`D${r}-E${r}`,v:m-g,s:'n2'},c==null?'':{f:`F${r}*C${r}`,v:(m-g)*c,s:'eur'}];
  cs.push(line('Ferie',r1,cF,mF,gF),line('Permessi (ROL + Ex Fest)',r2,cP,mP,gP),[e.name,'Totale costo ore residue (ferie + permessi)','','','','',{f:`SUM(G${r1}:G${r2})`,v:tF+tP,s:'eur'}]);
  gt+=tF+tP;totRows.push(r3)});
 if(sub.length>1)cs.push([''],['TOTALE AZIENDA','','','','','',{f:totRows.map(r=>'G'+r).join('+'),v:gt,s:'eur'}]);
 cs.push([''],[(mm===''?'Calcolo a fine anno '+Y+': maturate = residuo precedente + maturato nell\'anno; ':'Calcolo di '+MN[+mm]+' '+Y+' (solo il mese): maturate e godute nel mese; ')+'ore residue = maturate − godute; costo ore residue = ore residue × costo orario']);
 const blob=buildXlsx([
  {name:'Registro',rows:reg,head:1,filter:1,freeze:1,widths:[24,12,12,16,9,11,16,16,9]},
  {name:'Costo ore residue',rows:cs,head:1,widths:[24,40,17,14,12,12,20]},
  {name:'Regole e note',rows:reg2,head:1,widths:[46,12]}]);
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='Digitmode-maturazione-'+(sub.length==1?sub[0].name.replace(/[^A-Za-z0-9]+/g,'-')+'-':'')+(mm===''?'anno':MN[+mm])+'-'+Y+'.xlsx';document.body.appendChild(a);a.click();
 setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},2000);
 }catch(e){alert('Impossibile creare il file Excel: '+e.message)}}
function vImp(A){const Q=S.rules,ni=(k,l)=>`<input type="number" step="1" min="0" data-r="${k}" value="${Q[k]}" aria-label="${l}" style="width:92px">`,pi=k=>`<input type="number" step="1" min="0" max="100" data-r="${k}" value="${Q[k]}" aria-label="ROL spettanti (%)" style="width:76px">`,n=(k,l)=>`<input type="number" step="0.01" data-r="${k}" value="${Q[k]}" aria-label="${l}" style="width:92px">`;
 A.innerHTML=`<div class="card"><h2>Regole di maturazione</h2>
 <div class="rr"><b>Ferie annue</b>${n('fa','Ferie annue')}<span>giorni</span><span class="sep">ogni mese:</span>${n('f','Ferie ogni mese')}<span>ore</span><span class="mu" id="fd"></span></div>
 <div class="rr"><b>ROL</b>${n('ra','ROL annuo')}<span>ore</span><span class="sep">ogni mese:</span>${n('r3','ROL ogni mese')}<span>ore</span></div>
 <div class="rr"><b>Ex Fest</b>${n('xa','Ex Fest annue')}<span>ore</span><span class="sep">ogni mese:</span>${n('x','Ex Fest ogni mese')}<span>ore</span></div>
  <h2>Maturazione per anzianità di servizio</h2>
 <div class="rr"><b>Fasce</b>${ni('y1','Anni della 1ª fascia')}<span>anni</span><span class="sep">fino al:</span>${ni('y2','Anno di fine 2ª fascia')}<span>anno</span></div>
 <div class="tw"><table class="rs"><tr><th>Periodo</th><th>Ex Fest (ore/anno)</th><th>ROL spettanti</th><th>ROL (ore/anno)</th><th>Totale (ore/anno)</th></tr>
 <tr><td><b id="l1"></b></td><td data-l="Ex Fest (ore/anno)" id="tx1"></td><td data-l="ROL spettanti">${pi('p1')} %</td><td data-l="ROL (ore/anno)" id="tr1"></td><td data-l="Totale (ore/anno)"><b id="tt1"></b></td></tr>
 <tr><td><b id="l2"></b></td><td data-l="Ex Fest (ore/anno)" id="tx2"></td><td data-l="ROL spettanti">${pi('p2')} %</td><td data-l="ROL (ore/anno)" id="tr2"></td><td data-l="Totale (ore/anno)"><b id="tt2"></b></td></tr>
 <tr><td><b id="l3"></b></td><td data-l="Ex Fest (ore/anno)" id="tx3"></td><td data-l="ROL spettanti">100 %</td><td data-l="ROL (ore/anno)" id="tr3"></td><td data-l="Totale (ore/anno)"><b id="tt3"></b></td></tr></table></div>
 <div class="row" style="margin-top:16px"><button class="btn" id="rs">Salva regole</button></div></div>
 <div class="card"><h2>Backup dei dati</h2>
 <p class="mu" style="margin:0 0 10px">I dati sono salvati nel browser. Per non perderli attiva il salvataggio automatico su file (consigliato) oppure esporta un backup regolarmente: il file contiene dipendenti, presenze/assenze e regole di maturazione, e si può reimportare anche su un altro computer o browser.</p>
 <div class="row"><button class="btn" id="bx">Esporta backup</button><label>Importa backup (file .json)<input type="file" id="bi" accept=".json,application/json"></label></div>
 <div class="row" style="margin-top:12px">${autoBtn()}</div><p class="mu" id="as"></p><p class="mu" id="bs"></p></div>`;
 const q=k=>A.querySelectorAll('[data-r="'+k+'"]'),v=k=>+q(k)[0].value||0,r2=x=>Math.round(x*100)/100,put=(k,x,ex)=>q(k).forEach(i=>{if(i!==ex)i.value=x}),fd=()=>{$('fd').textContent=fh(v('f')/8)+' giorni'};
 q('fa')[0].oninput=()=>{put('f',r2(v('fa')*8/12));fd()};
 q('f')[0].oninput=fd;fd();
 q('xa')[0].oninput=()=>put('x',r2(v('xa')/12));
 q('ra')[0].oninput=()=>put('r3',r2(v('ra')/12));
 q('r3').forEach(i=>i.oninput=ev=>{put('r3',ev.target.value,ev.target);q('ra')[0].value=r2(v('r3')*12)});
 bkStatus();
 const pc=k=>Math.min(100,Math.max(0,v(k))),rf=()=>{const x=v('xa'),ra=v('ra'),y1=v('y1'),y2=v('y2'),P=[pc('p1'),pc('p2'),100];
 [1,2,3].forEach(i=>{const rl=ra*P[i-1]/100;$('tx'+i).textContent=fh(x);$('tr'+i).textContent=fh(rl);$('tt'+i).textContent=fh(x+rl)});
 $('l1').textContent='Primi '+y1+' anni';$('l2').textContent='Dal '+(y1+1)+'° al '+y2+'° anno';$('l3').textContent='Dal '+(y2+1)+'° anno in poi'};
 A.querySelector('.card').oninput=rf;rf();
 $('bx').onclick=()=>{exportBackup();bkStatus()};
 $('bi').onchange=ev=>{const f=ev.target.files[0];ev.target.value='';if(f)importBackup(f)};
 $('rs').onclick=()=>{if(v('y2')<=v('y1'))return alert('La fine della 2ª fascia deve essere dopo la fine della 1ª.');A.querySelectorAll('[data-r]').forEach(i=>S.rules[i.dataset.r]=+i.value||0);['p1','p2'].forEach(k=>S.rules[k]=pc(k));syncR();if(save())toast('✓ Regole salvate');render()};
}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
{const st=rd('presenze_v2');if(st)S={...S,...st};else{let raw=null;try{raw=localStorage.getItem('presenze_v2')}catch(e){}if(raw){try{localStorage.setItem('presenze_v2_corrotto',raw)}catch(e){}}demo()}}if(S.rv!==10){S.rules={...DR,...(S.rules||{}),f:DR.f,x:DR.x,r3:DR.r3,fa:DR.fa,ra:DR.ra,xa:DR.xa,y1:DR.y1,y2:DR.y2,p1:DR.p1,p2:DR.p2};S.rv=10;syncR();save()}S.rules={...DR,...S.rules};syncR();view=S.emps.length?'az':'anag';
{const U=rd(UIK)||{},mOk=v=>v===''||(/^\d+$/.test(String(v))&&+v<=11),dOk=v=>typeof v=='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
 const yo=[...$('yr').options].map(o=>+o.value);if(yo.includes(+U.Y)){Y=+U.Y;$('yr').value=Y;mr()}
 if(dOk(U.pf)&&dOk(U.pt)&&U.pf<=U.pt){$('pf').value=U.pf;$('pt').value=U.pt}
 if(S.emps.length){if(['az','dip','reg','anag','imp'].includes(U.view))view=U.view;if(S.emps.some(e=>e.id==U.sel))sel=U.sel}
 if(U.MM!=null&&mOk(U.MM))MM=String(U.MM);
 if(Number.isInteger(U.MY1))MY1=U.MY1;if(Number.isInteger(U.MY2))MY2=U.MY2}
if(S.fv!==1){normEnt();S.fv=1}autoFill();save(true);ready=true;render();

