const T={P:'Presenza',F:'Ferie',R:'Permesso ROL',X:'Ex Festività',M:'Malattia',MA:'Maternità',L:'Lutto',I:'Infortunio',A:'Altra assenza'};
const DR={f:14.42,x:2.67,r1:0,r2:3,r3:6,y1:2,y2:4,p1:0,p2:50,fa:22,ra:72,xa:32};
const syncR=()=>{const Q=S.rules;Q.r1=Q.ra*Q.p1/100/12;Q.r2=Q.ra*Q.p2/100/12};
let S={emps:[],ent:[],rules:{...DR}};
const rd=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
let ready=false,toastT,storageOK=true;try{localStorage.setItem('presenze_t','1');localStorage.removeItem('presenze_t')}catch(e){storageOK=false}
function toast(msg,type){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.appendChild(t)}t.textContent=msg;t.className='show '+(type||'ok');clearTimeout(toastT);toastT=setTimeout(()=>{t.className=''},2200)}
const save=()=>{try{localStorage.setItem('presenze_v2',JSON.stringify(S));if(ready)toast('✓ Dati salvati');return true}catch(e){toast('Salvataggio non riuscito','err');if(!save.w){save.w=1;alert('Attenzione: il browser non riesce a salvare i dati (archiviazione bloccata o piena). Esporta subito un backup da Impostazioni.')}return false}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id),iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fh=n=>(Math.round(n*100)/100).toLocaleString('it-IT'),uid=()=>Math.random().toString(36).slice(2,9);
const now=new Date();let view='az',sel=null,Y=now.getFullYear();
$('yr').innerHTML=Array.from({length:Y+1-2021+1},(_,i)=>2021+i).map(y=>`<option ${y==Y?'selected':''}>${y}</option>`).join('');
const mr=()=>{$('pf').value=Y+'-01-01';$('pt').value=Y+'-12-31'};mr();
$('yr').onchange=e=>{Y=+e.target.value;mr();render()};
$('pf').onchange=$('pt').onchange=()=>render();
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{view=b.dataset.v;EDIT=null;render()});
// maturazione: accredito a fine mese; mese di assunzione se assunto entro il 15
function accr(e,upto,Yr=Y){let f=0,r=0,x=0;const h=new Date(e.hire);
 for(let m=0;m<12;m++){const end=new Date(Yr,m+1,0);if(end>upto)break;if(h>end)continue;
  if(h.getFullYear()==Yr&&h.getMonth()==m&&h.getDate()>15)continue;
  const yrs=(end-h)/(365.25*864e5),Q=S.rules;f+=Q.f;x+=Q.x;r+=yrs<Q.y1?Q.r1:yrs<Q.y2?Q.r2:Q.r3}
 return{F:f,R:r,X:x}}
const used=(id,t,to,Yr=Y)=>S.ent.filter(a=>a.emp==id&&a.type==t&&a.date.startsWith(String(Yr))&&(!to||a.date<=to)).reduce((s,a)=>s+a.h,0);
const p2=n=>String(n).padStart(2,'0');
function entsIn(e,from,to){return S.ent.filter(a=>a.emp==e.id&&a.date>=from&&a.date<=to)}
function stats(id){const o={};Object.keys(T).forEach(k=>o[k]={h:0,d:0});const e=S.emps.find(x=>x.id==id);
 if(e)entsIn(e,$('pf').value,$('pt').value).forEach(a=>{o[a.type].h+=a.h;o[a.type].d++});return o}
function balances(e){const ref=Y==now.getFullYear()?now:new Date(Y,11,31,23),a=accr(e,ref),p=accr(e,new Date(Y,11,31,23));
 return['F','R','X'].map(k=>{const c=(+(e.cg||{})[k]||0)*e.hpd,g=used(e.id,k,iso(ref)),gt=used(e.id,k);
  return{k,c,mat:a[k],g,saldo:c+a[k]-g,proj:c+p[k]-gt,pm:p[k]}})}
const cl=n=>n<0?'neg':'pos';
const okH=h=>Number.isFinite(h)&&h>0&&h<=24;
function limH(el){if(el.value==='')return;const n=+el.value;if(n>24){el.value=24;toast('Massimo 24 ore al giorno','err')}else if(n<0){el.value='';toast('Le ore non possono essere negative','err')}}
function render(){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v==view));
 const A=$('app');if(!S.emps.length&&!['anag','imp'].includes(view)){A.innerHTML='<div class="card">Nessun dipendente. Aggiungilo in <b>Anagrafica</b>.</div>';return}
 ({az:vAz,dip:vDip,reg:vReg,anag:vAnag,imp:vImp})[view](A);
 if(!storageOK)A.insertAdjacentHTML('afterbegin','<div class="card warn">⚠ Questo browser non consente di salvare i dati (archiviazione bloccata, navigazione privata o file aperto da anteprima/zip). Ciò che inserisci andrà perso al ricaricamento. Apri il file direttamente dalla cartella con Chrome, Edge o Firefox, oppure esporta spesso un backup da <b>Impostazioni</b>.</div>');
 saveUI()}
const UIK='presenze_ui';function saveUI(){try{localStorage.setItem(UIK,JSON.stringify({view,sel,Y,MM,PM,XM,MY1,MY2,pf:$('pf').value,pt:$('pt').value}))}catch(e){}}
const MN=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const dim=(y,m)=>new Date(y,m+1,0).getDate(),nd=()=>Math.max(...MN.map((_,m)=>dim(Y,m))),dh=()=>Array.from({length:nd()},(_,i)=>`<th>${i+1}</th>`).join('');
const legend=()=>`<div class="lg">${['P','F','R','M'].map(k=>`<span class="c-${k}"><b>${k}</b> ${k=='R'?'Permessi':T[k]}</span>`).join('')}<span class="c-A"><b>A</b> Altre assenze</span></div>`;
function cell(e0,id,dt){const ds=iso(dt),a=S.ent.find(x=>x.emp==id&&x.date==ds),c0=a?a.type:'',c=c0=='X'?'R':c0;
 return `<td class="${c?'c-'+c:[0,6].includes(dt.getDay())?'we':'e'}" title="${a?(c=='R'?'Permessi':T[c0])+' · '+fh(a.h)+' h':''}">${['MA','L','I','A'].includes(c)?'A':c}</td>`}
function grid(id,m){const e0=S.emps.find(x=>x.id==id),n=dim(Y,m);let r='';
 for(let d=1;d<=nd();d++)r+=d>n?'<td class="x"></td>':cell(e0,id,new Date(Y,m,d));return r}
function gridT(id){const e0=S.emps.find(x=>x.id==id);let r='';
 for(let d=1;d<=nd();d++){r+=`<tr><th>${d}</th>`;for(let m=0;m<12;m++)r+=d>dim(Y,m)?'<td class="x"></td>':cell(e0,id,new Date(Y,m,d));r+='</tr>'}return r}
let PM=now.getMonth(),MM='',XM=String(now.getMonth()),EDIT=null,MY1=null,MY2=null;
const CFOK=/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPR-T][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/,eur=n=>(+n).toLocaleString('it-IT',{style:'currency',currency:'EUR'}),hasC=v=>v!==''&&v!=null&&Number.isFinite(+v);
function report(sel,mm){const yr=mm==='';mm=yr?11:+mm;const list=S.emps.filter(e=>sel=='all'||e.id==sel),ref=new Date(Y,mm+1,0,23),pre=Y+'-'+String(mm+1).padStart(2,'0'),logo=document.querySelector('.brand img').src,N={F:'Ferie',R:'ROL',X:'Ex Festività'};
 $('print').innerHTML=list.map(e=>{const g=v=>fh(v/e.hpd),en=entsIn(e,yr?Y+'-01-01':pre+'-01',yr?Y+'-12-31':pre+'-31'),a=accr(e,ref),pv=mm&&!yr?accr(e,new Date(Y,mm,0,23)):{F:0,R:0,X:0},pj=accr(e,new Date(Y,11,31,23));
  const tr=Object.keys(T).map(k=>{const x=en.filter(y=>y.type==k);return `<tr><td>${T[k]}</td><td>${x.length}</td><td>${fh(x.reduce((s,y)=>s+y.h,0))}</td></tr>`}).join('');
  const mt=['F','R','X'].map(k=>{const c=(+(e.cg||{})[k]||0)*e.hpd,gd=used(e.id,k,iso(ref)),gt=used(e.id,k);return yr?`<tr><td>${N[k]}</td><td>${g(c)}</td><td>${g(a[k])}</td><td>${g(gd)}</td><td><b>${g(c+a[k]-gd)}</b></td></tr>`:`<tr><td>${N[k]}</td><td>${g(c)}</td><td>${g(a[k]-pv[k])}</td><td>${g(a[k])}</td><td>${g(gd)}</td><td><b>${g(c+a[k]-gd)}</b></td><td>${g(c+pj[k]-gt)}</td></tr>`}).join('');
  return `<div class="pg"><div class="ph"><img src="${logo}" alt=""><div><h2>Digitmode – Presenze e maturazione</h2><div>${yr?'Tutto l\'anno '+Y:MN[mm]+' '+Y}</div></div></div>
  <p><b>Dipendente:</b> ${esc(e.name)} &nbsp;&nbsp; <b>Data assunzione:</b> ${e.hire} &nbsp;&nbsp; <b>Ore giornaliere:</b> ${e.hpd}</p>
  <h3>Presenze e assenze ${yr?'dell\'anno':'del mese'}</h3><table><tr><th>Tipo</th><th>Giorni</th><th>Ore</th></tr>${tr}</table>
  <h3>Ferie, ROL ed ex festività (GG = giorni)</h3><table>${yr?'<tr><th></th><th>Residuo prec.</th><th>Maturato nell\'anno</th><th>Goduto nell\'anno</th><th>Saldo a fine anno</th></tr>':'<tr><th></th><th>Residuo prec.</th><th>Maturato nel mese</th><th>Maturato da inizio anno</th><th>Goduto da inizio anno</th><th>Saldo a fine mese</th><th>Proiezione saldo a fine anno</th></tr>'}${mt}</table>
  <p><small>Documento generato il ${new Date().toLocaleDateString('it-IT')}. Valori in GG (giorni) calcolati sulle ore giornaliere del dipendente.</small></p></div>`}).join('');
 const t=document.title;document.title='Digitmode-maturazione-'+(yr?'anno':MN[mm])+'-'+Y;window.print();document.title=t}
function demo(){const y=now.getFullYear(),E=[['Giulia Bianchi','2015-06-01',{F:4,R:3,X:1}],['Marco Verdi','2019-09-16',{F:2,R:1,X:0}],['Sara Neri','2023-02-01',{F:3,R:0,X:0}],['Luca Gialli','2025-03-03',{F:0,R:0,X:0}],['Elena Rosa','2021-11-02',{F:6,R:2,X:1}]].map(([name,hire,cg])=>({id:uid(),name,hire,hpd:8,cg}));
 const Rg=[[0,'F','04-06','04-10'],[1,'F','04-06','04-10'],[0,'F','08-10','08-21'],[1,'F','08-10','08-21'],[2,'F','08-10','08-21'],[3,'F','08-17','08-21'],[2,'F','12-21','12-24'],[0,'L','05-12','05-14'],[1,'M','02-10','02-10'],[2,'M','01-19','01-20'],[3,'M','03-16','03-18'],[1,'I','06-15','06-19'],[4,'MA','05-04','12-31'],[3,'A','06-02','06-02'],[1,'X','03-23','03-23'],[1,'X','10-19','10-19'],[0,'R','02-27','02-27'],[0,'R','07-03','07-03'],[2,'R','05-22','05-22'],[1,'R','09-04','09-04']],M=new Map(),ent=[];
 Rg.forEach(([i,t,a,b])=>{for(let d=new Date(y,+a.slice(0,2)-1,+a.slice(3));iso(d)<=y+'-'+b;d.setDate(d.getDate()+1)){if(![0,6].includes(d.getDay()))M.set(E[i].id+iso(d),t)}});
 E.forEach(e=>{for(let d=new Date(y,0,1);d.getFullYear()==y;d.setDate(d.getDate()+1)){if([0,6].includes(d.getDay()))continue;const ds=iso(d);if(ds<e.hire)continue;let t=M.get(e.id+ds);if(!t&&ds<=iso(now))t='P';if(t)ent.push({id:uid(),emp:e.id,date:ds,type:t,h:8})}});
 S={emps:E,ent,rules:{...DR}};save()}
function vAz(A){let tot={},rows='';Object.keys(T).forEach(k=>tot[k]={h:0,d:0});
 S.emps.forEach(e=>{const s=stats(e.id);Object.keys(T).forEach(k=>{tot[k].h+=s[k].h;tot[k].d+=s[k].d});
  const ab=['M','MA','L','I','A'].reduce((n,k)=>n+s[k].d,0);
  rows+=`<tr><td>${esc(e.name)}</td><td data-l="Giorni lavorati">${s.P.d}</td><td data-l="Ore lavorate">${fh(s.P.h)}</td><td data-l="Giorni ferie">${s.F.d}</td><td data-l="Giorni permessi">${s.R.d+s.X.d}</td><td data-l="Giorni malattia">${s.M.d}</td><td data-l="Altre assenze">${ab-s.M.d}</td></tr>`});
 A.innerHTML=bkNote()+`<div class="kp"><div><span>Giorni lavorati (tutti)</span><b>${tot.P.d}</b></div><div><span>Ore lavorate</span><b>${fh(tot.P.h)}</b></div><div><span>Giorni di ferie</span><b>${tot.F.d}</b></div><div><span>Giorni malattia</span><b>${tot.M.d}</b></div></div>
 <div class="card"><h2>Riepilogo periodo <span class="nw">${$('pf').value}</span> → <span class="nw">${$('pt').value}</span></h2><div class="tw"><table class="rs"><tr><th>Dipendente</th><th>Giorni lavorati</th><th>Ore lavorate</th><th>Giorni ferie</th><th>Giorni permessi</th><th>Giorni malattia</th><th>Altre assenze</th></tr>${rows}</table></div></div>`}
function vDip(A){if(!S.emps.find(e=>e.id==sel))sel=S.emps[0].id;const e=S.emps.find(x=>x.id==sel),b=balances(e),s=(()=>{const o={};Object.keys(T).forEach(k=>o[k]={h:0,d:0});const f=MM===''?Y+'-01-01':iso(new Date(Y,+MM,1)),t=MM===''?Y+'-12-31':iso(new Date(Y,+MM+1,0));entsIn(e,f,t).forEach(a=>{o[a.type].h+=a.h;o[a.type].d++});return o})();
 const N={F:'Ferie',R:'ROL',X:'Ex Festività'},K=['F','R','X'],g=v=>fh(v/e.hpd);
 const c0={F:0,R:0,X:0};
 const g2=v=>(v/e.hpd).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2}),cg7='<colgroup><col class="c1">'+'<col>'.repeat(6)+'</colgroup>',cg6='<colgroup><col class="c1">'+'<col>'.repeat(5)+'</colgroup>';
 let mat,matM;
 if(MM===''){
 let prev={F:0,R:0,X:0},tot={F:0,R:0,X:0},rows='';const rm={F:'',R:'',X:''};
 MN.forEach((mn,m)=>{const end=new Date(Y,m+1,0,23),a=accr(e,end),cur=Y==now.getFullYear()&&m==now.getMonth(),fut=end>now;
  const cells=K.map(k=>{const mt1=a[k]-prev[k],sd=c0[k]+a[k]-used(e.id,k,iso(end));tot[k]+=mt1;rm[k]+=`<tr class="${cur?'cur':fut?'fut':''}"><td>${mn}</td><td>${g2(mt1)}</td><td class="${cl(sd)}"><b>${g2(sd)}</b></td></tr>`;return `<td class="g${k}">${g2(mt1)}</td><td class="g${k} ge ${cl(sd)}"><b>${g2(sd)}</b></td>`}).join('');
  prev=a;rows+=`<tr class="${cur?'cur':fut?'fut':''}"><td class="mn">${mn}${cur?' · in corso':fut?' · previsione':''}</td>${cells}</tr>`});
 mat=cg7+`<thead><tr><th rowspan="2" class="mn">Mese</th>${K.map(k=>`<th colspan="2" class="g${k} ge">${N[k]} (GG)</th>`).join('')}</tr>
  <tr>${K.map(k=>`<th class="g${k}">Maturato</th><th class="g${k} ge">Rimane</th>`).join('')}</tr></thead>
  <tbody>${rows}
  <tr class="tt"><td class="mn">Totale maturato nell'anno</td>${K.map(k=>`<td class="g${k} ge" colspan="2"><b>${g2(tot[k])}</b></td>`).join('')}</tr></tbody>`;
 matM=K.map(k=>`<section class="mb g${k}"><h3>${N[k]} (GG)</h3><table><colgroup><col class="c1"><col><col></colgroup><thead><tr><th>Mese</th><th>Maturato</th><th>Rimane</th></tr></thead><tbody>${rm[k]}<tr class="tt"><td>Totale anno</td><td><b>${g2(tot[k])}</b></td><td></td></tr></tbody></table></section>`).join('')+'<p class="mu mleg">Riga evidenziata: mese in corso · righe grigie: previsione.</p>';
 }else{
 const m=+MM,ref=new Date(Y,m+1,0,23),a=accr(e,ref),pv=m?accr(e,new Date(Y,m,0,23)):{F:0,R:0,X:0},pj=accr(e,new Date(Y,11,31,23));
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
  <p class="mu mleg">Somma di maturato e goduto per ogni anno dell'intervallo scelto (senza residui). L'anno in corso è calcolato fino ad oggi.</p></div>`}
 A.innerHTML=`<div class="card row"><label>Dipendente<select id="ds">${S.emps.map(x=>`<option value="${x.id}" ${x.id==sel?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><span class="mu">Assunto il ${e.hire} · ${e.hpd} h/giorno${hasC(e.cost)?' · '+eur(e.cost)+'/h':''}</span></div>
 <div class="kp"><div><span>Giorni di presenza</span><b>${s.P.d}</b></div><div><span>Ore lavorate</span><b>${fh(s.P.h)}</b></div><div><span>Ferie godute</span><b>${s.F.d} gg</b></div><div><span>Malattia</span><b>${s.M.d} gg</b></div></div>
 <div class="card"><div class="row mh"><h2>Maturazione ${Y}</h2><label>Mese<select id="mm"><option value="">Tutti i mesi</option>${MN.map((m,i)=>`<option value="${i}" ${MM!==''&&+MM===i?'selected':''}>${m}</option>`).join('')}</select></label></div><div class="tw mtw desk"><table class="mt${MM===''?'':' md'}">${mat}</table></div><div class="mtm">${matM}</div></div>
 ${multi}
 <div class="card"><h2>Dettaglio periodo</h2><div class="tw"><table><tr><th>Tipo</th><th>Giorni</th><th>Ore</th></tr>${Object.keys(T).map(k=>`<tr><td>${T[k]}</td><td>${s[k].d}</td><td>${fh(s[k].h)}</td></tr>`).join('')}</table></div></div>
 <div class="card dl"><div class="dlc"><label>Mese da scaricare<select id="pm"><option value="" ${PM===''?'selected':''}>Tutto l'anno ${Y}</option>${MN.map((m,i)=>`<option value="${i}" ${PM!==''&&i==PM?'selected':''}>${m} ${Y}</option>`).join('')}</select></label><button class="btn" id="pdf">Scarica PDF maturazione</button></div><div class="dlc"><label>Mese da scaricare<select id="xm"><option value="" ${XM===''?'selected':''}>Tutto l'anno ${Y}</option>${MN.map((m,i)=>`<option value="${i}" ${XM!==''&&+XM===i?'selected':''}>${m} ${Y}</option>`).join('')}</select></label><button class="btn xl" id="xl">Scarica Excel maturazione</button></div></div>
 <div class="card"><h2>Quadro annuale ${Y}</h2>${legend()}<div class="tw gdesk"><table class="gr"><tr><th>Mese</th>${dh()}</tr>${MN.map((m,i)=>`<tr><td>${m}</td>${grid(e.id,i)}</tr>`).join('')}</table></div><div class="gmob"><div class="tw"><table class="gr gt"><tr><th></th>${MN.map(m=>`<th>${m.slice(0,3)}</th>`).join('')}</tr>${gridT(e.id)}</table></div></div></div>`;
 if($('my1')){$('my1').onchange=ev=>{MY1=+ev.target.value;render()};$('my2').onchange=ev=>{MY2=+ev.target.value;render()}}$('pm').onchange=ev=>{PM=ev.target.value===''?'':+ev.target.value;saveUI()};$('mm').onchange=ev=>{MM=ev.target.value;render()};$('xm').onchange=ev=>{XM=ev.target.value;saveUI()};$('xl').onclick=()=>exportExcel(XM,e.id);$('pdf').onclick=()=>report(e.id,$('pm').value);
 $('ds').onchange=ev=>{sel=ev.target.value;render()}}
function vReg(A){const e0=S.emps.find(e=>e.id==sel)||S.emps[0];sel=e0.id;
 const list=S.ent.filter(a=>a.emp==sel&&a.date.startsWith(Y)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,60);
 A.innerHTML=`<div class="card"><h2>Registra presenze / assenze</h2><div class="row">
 <label>Dipendente<select id="re">${S.emps.map(x=>`<option value="${x.id}" ${x.id==sel?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
 <label>Tipo<select id="rt">${Object.keys(T).map(k=>`<option value="${k}">${T[k]}</option>`).join('')}</select></label>
 <label>Dal<input type="date" id="rf" value="${iso(now)}"></label><label>Al<input type="date" id="rz" value="${iso(now)}"></label>
 <label>Ore/giorno<input type="number" id="rh" step="0.25" min="0.25" max="24" inputmode="decimal" value="${e0.hpd}" style="width:90px"></label><button class="btn" id="ra">Aggiungi</button></div></div>
 <div class="card"><h2>Ultime voci ${Y}</h2><div class="tw"><table class="lv"><tr><th>Data</th><th>Tipo</th><th>Ore</th><th></th></tr>${list.map(a=>`<tr><td>${a.date}</td><td>${T[a.type]}</td><td>${fh(a.h)}</td><td><button class="btn g" data-d="${a.id}">✕</button></td></tr>`).join('')}</table></div></div>`;
 $('re').onchange=ev=>{sel=ev.target.value;render()};
 $('rh').oninput=ev=>limH(ev.target);
 $('ra').onclick=()=>{const f=$('rf').value,z=$('rz').value,h=+$('rh').value;if(!f||!z||z<f)return alert('Controlla le date');if(!okH(h))return toast('Le ore devono essere maggiori di 0 e al massimo 24 al giorno','err');
  for(let d=new Date(f);iso(d)<=z;d.setDate(d.getDate()+1)){if([0,6].includes(d.getDay()))continue;const ds=iso(d);
   S.ent=S.ent.filter(a=>!(a.emp==sel&&a.date==ds));S.ent.push({id:uid(),emp:sel,date:ds,type:$('rt').value,h})}
  save();render()};
 A.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{S.ent=S.ent.filter(a=>a.id!=b.dataset.d);save();render()})}
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
 <label>Costo orario (€/h)<input type="number" id="ak" min="0" step="0.01" placeholder="es. 15,50" value="${ed&&hasC(ed.cost)?ed.cost:''}"></label>
 <label>Residuo ferie (GG)<input type="number" id="cf" value="${+c.F||0}"></label><label>Residuo ROL (GG)<input type="number" id="cr" value="${+c.R||0}"></label><label>Residuo Ex Fest (GG)<input type="number" id="cx" value="${+c.X||0}"></label>
 <button class="btn" id="aa">${ed?'Salva modifiche':'Aggiungi'}</button>${ed?'<button class="btn g" id="ae">Annulla</button>':''}</div></div>
 <div class="card"><h2>Dipendenti</h2><div class="tw"><table class="rs"><tr><th>Nome e cognome</th><th>Codice fiscale</th><th>Sesso</th><th>Assunzione</th><th>Ore/gg</th><th>Costo orario</th><th></th></tr>${S.emps.map(e=>`<tr><td>${esc(e.name)}</td><td data-l="Codice fiscale">${esc(e.cf||'—')}</td><td data-l="Sesso">${e.sex||'—'}</td><td data-l="Assunzione">${e.hire}</td><td data-l="Ore/gg">${e.hpd}</td><td data-l="Costo orario">${hasC(e.cost)?eur(e.cost):'—'}</td><td class="ac"><button class="btn g" data-e="${e.id}">Modifica</button> <button class="btn g" data-x="${e.id}">Elimina</button></td></tr>`).join('')}</table></div></div></div>`;
 $('ap').oninput=ev=>limH(ev.target);
 $('aa').onclick=()=>{const n1=$('an').value.trim(),n2=$('ac').value.trim(),h=$('ah').value,cf=$('af').value.replace(/\s+/g,'').toUpperCase(),co=$('ak').value;let sx=$('as').value;
  if(!n1||!n2||!h)return alert('Nome, cognome e data assunzione sono obbligatori');
  if(cf){const er=cfCheck(cf,sx);if(er)return alert(er);
   if(S.emps.some(x=>x.cf===cf&&x.id!=EDIT))return alert('Esiste già un dipendente con questo codice fiscale.');if(!sx)sx=cfSex(cf)}
  if(co!==''&&!(+co>=0))return alert('Il costo orario deve essere un numero positivo');
  if(!okH(+$('ap').value))return toast('Le ore giornaliere devono essere maggiori di 0 e al massimo 24','err');
  const rec={name:n1+' '+n2,hire:h,hpd:+$('ap').value,cg:{F:+$('cf').value,R:+$('cr').value,X:+$('cx').value},cf,sex:sx,cost:co===''?'':+co};
  if(ed)Object.assign(ed,rec);else S.emps.push({id:uid(),...rec});
  EDIT=null;save();render()};
 if($('ae'))$('ae').onclick=()=>{EDIT=null;render()};
 A.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{EDIT=b.dataset.e;render();try{scrollTo(0,0)}catch(x){}});
 A.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{if(confirm('Eliminare il dipendente e le sue voci?')){if(EDIT==b.dataset.x)EDIT=null;S.emps=S.emps.filter(e=>e.id!=b.dataset.x);S.ent=S.ent.filter(a=>a.emp!=b.dataset.x);save();render()}})}

// ---- BACKUP ----
const LB='presenze_lastbackup';
function lastBackup(){try{const v=localStorage.getItem(LB);return v?new Date(v):null}catch(e){return null}}
function bkStatus(){const el=$('bs');if(!el)return;const l=lastBackup();
 el.textContent='Dati attuali: '+S.emps.length+' dipendenti, '+S.ent.length+' voci. '+(l?'Ultimo backup esportato: '+l.toLocaleString('it-IT')+'.':'Nessun backup esportato da questo browser.')}
function bkNote(){const l=lastBackup(),old=!l||(Date.now()-l)>7*864e5;
 return old?'<div class="card warn">⚠ '+(l?'L\'ultimo backup risale al '+l.toLocaleDateString('it-IT'):'Non hai ancora esportato nessun backup')+'. Vai in <b>Impostazioni → Backup dei dati</b> ed esportalo per non perdere i dati.</div>':''}
function exportBackup(){const d=new Date(),p=n=>String(n).padStart(2,'0');
 const payload={app:'Digitmode-Presenze',format:1,exportedAt:d.toISOString(),data:{emps:S.emps,ent:S.ent,rules:S.rules}};
 const blob=new Blob([JSON.stringify(payload,null,1)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='Digitmode-backup-'+iso(d)+'_'+p(d.getHours())+p(d.getMinutes())+'.json';document.body.appendChild(a);a.click();
 setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},2000);
 try{localStorage.setItem(LB,d.toISOString())}catch(e){}}
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
  return{id,name,hire:e.hire,hpd:fin(e.hpd)&&okH(+e.hpd)?+e.hpd:8,cg:{F:fin(c.F)?+c.F:0,R:fin(c.R)?+c.R:0,X:fin(c.X)?+c.X:0},cf:cf0,sex:['M','F'].includes(e.sex)?e.sex:'',cost:fin(e.cost)&&+e.cost>=0?+e.cost:''}});
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
  S={emps:D.emps,ent:D.ent,rules:D.rules,rv:8};syncR();
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
 const reg=[['Dipendente','Data','Mese','Tipo','Ore','Ore/giorno','Costo orario (€/h)','Giorni','Costo (€)']];
 ent.forEach(({a,e})=>{const ri=reg.length+1;reg.push([e.name,{d:a.date},MN[+a.date.slice(5,7)-1],T[a.type],{v:a.h,s:'n2'},e.hpd,hasC(e.cost)?{v:+e.cost,s:'eur'}:'',{f:`E${ri}/F${ri}`,v:a.h/e.hpd,s:'n2'},{f:`E${ri}*G${ri}`,v:hasC(e.cost)?a.h*e.cost:0,s:'eur'}])});
 const RL={fa:'Ferie annue (giorni)',f:'Ferie ogni mese (ore)',ra:'ROL annuo (ore)',r3:'ROL ogni mese (ore, dal 3° periodo)',r1:'ROL ore/mese 1° periodo',y1:'Anni fine 1° periodo',r2:'ROL ore/mese 2° periodo',y2:'Anni fine 2° periodo',xa:'Ex Fest annue (ore)',x:'Ex Fest ogni mese (ore)',p1:'ROL spettanti 1ª fascia (%)',p2:'ROL spettanti 2ª fascia (%)'};
 const reg2=[['Parametro','Valore'],...Object.keys(RL).map(k=>[RL[k],{v:+S.rules[k]||0,s:'n2'}]),[''],['Note'],
  ['I valori di maturazione sono in GG (giorni), calcolati sulle ore giornaliere di ciascun dipendente.'],
  ['La maturazione si accredita a fine mese; il mese di assunzione matura solo se l\'assunzione è entro il 15.'],
  ['Saldo a fine mese = Residuo prec. + Maturato da inizio anno − Goduto da inizio anno.'],
  ['Foglio Registro: Giorni = Ore / Ore per giorno; Costo (€) = Ore × Costo orario (formule). Usa il filtro sulla colonna Tipo per isolare le presenze.'],
  ['Generato il '+new Date().toLocaleDateString('it-IT')+' dall\'app Digitmode Presenze, anno '+Y+'.']];
 const blob=buildXlsx([
  {name:'Registro',rows:reg,head:1,filter:1,freeze:1,widths:[24,12,12,16,9,11,15,9,12]},
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
 <p class="mu" style="margin:10px 0 0">Nella 1ª fascia spettano solo le ex festività (nessun ROL); nella 2ª le ex festività più la percentuale indicata dei ROL; dalla 3ª tutte le ore piene.</p>
 <div class="row" style="margin-top:16px"><button class="btn" id="rs">Salva regole</button></div></div>
 <div class="card"><h2>Backup dei dati</h2>
 <p class="mu" style="margin:0 0 10px">I dati sono salvati solo in questo browser. Esporta un backup regolarmente: il file contiene dipendenti, presenze/assenze e regole di maturazione, e si può reimportare anche su un altro computer o browser.</p>
 <div class="row"><button class="btn" id="bx">Esporta backup</button><label>Importa backup (file .json)<input type="file" id="bi" accept=".json,application/json"></label></div>
 <p class="mu" id="bs"></p></div>`;
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
{const st=rd('presenze_v2');if(st)S={...S,...st};else{let raw=null;try{raw=localStorage.getItem('presenze_v2')}catch(e){}if(raw){try{localStorage.setItem('presenze_v2_corrotto',raw)}catch(e){}}demo()}}if(S.rv!==8){S.rules={...DR,...(S.rules||{}),f:DR.f,x:DR.x,r3:DR.r3,fa:DR.fa,ra:DR.ra,xa:DR.xa,y1:DR.y1,y2:DR.y2,p1:DR.p1,p2:DR.p2};S.rv=8;syncR();save()}S.rules={...DR,...S.rules};syncR();view=S.emps.length?'az':'anag';
{const U=rd(UIK)||{},mOk=v=>v===''||(/^\d+$/.test(String(v))&&+v<=11),dOk=v=>typeof v=='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
 const yo=[...$('yr').options].map(o=>+o.value);if(yo.includes(+U.Y)){Y=+U.Y;$('yr').value=Y;mr()}
 if(dOk(U.pf)&&dOk(U.pt)&&U.pf<=U.pt){$('pf').value=U.pf;$('pt').value=U.pt}
 if(S.emps.length){if(['az','dip','reg','anag','imp'].includes(U.view))view=U.view;if(S.emps.some(e=>e.id==U.sel))sel=U.sel}
 if(U.MM!=null&&mOk(U.MM))MM=String(U.MM);if(U.PM!=null&&mOk(U.PM))PM=U.PM===''?'':+U.PM;if(U.XM!=null&&mOk(U.XM))XM=String(U.XM);
 if(Number.isInteger(U.MY1))MY1=U.MY1;if(Number.isInteger(U.MY2))MY2=U.MY2}
ready=true;render();
