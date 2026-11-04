/* ================= GRÁFICOS =================
   Colores categóricos validados (claro/oscuro) con el validador de dataviz:
   --chart-1 (Mercado) azul · --chart-2 (Servicios) naranja. Una serie sola usa pine. */
const fmtShort = n => { const a = Math.abs(n); if(a>=1e6) return '$'+fnum(Math.round(n/1e5)/10)+'M'; if(a>=1e3) return '$'+fnum(Math.round(n/100)/10)+'k'; return '$'+fnum(Math.round(n)); };
const monthShort = k => MONTHS[+k.slice(5)-1].slice(0,3);
function niceMax(v){ if(v<=0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v/p; return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p; }
let CHART_ID = 0;
/* Barras verticales (apiladas si hay varias series). opts: {labels, series:[{name, color, values}], fmt, unit, height, table:true} */
function barChart(o){
  // recorta meses iniciales vacíos (deja al menos 6)
  if(o.trim!==false){ let k = 0; while(k < o.labels.length-6 && o.series.every(s=>!(s.values[k]>0))) k++; if(k){ o = Object.assign({}, o, {labels:o.labels.slice(k), series:o.series.map(s=>Object.assign({}, s, {values:s.values.slice(k)}))}); } }
  const id = 'ch'+(++CHART_ID); const W = 360, H = Math.round((o.height||200)*0.62), padL = 40, padR = 4, padT = 8, padB = 18;
  const n = o.labels.length; const totals = o.labels.map((_,i)=>sum(o.series.map(s=>s.values[i]||0)));
  const max = niceMax(Math.max(...totals, 0)); const fmt = o.fmt || fmtShort;
  const plotW = W-padL-padR, plotH = H-padT-padB, bw = Math.min(26, plotW/n*0.64), step = plotW/n;
  const y = v => padT + plotH - (v/max)*plotH;
  let g = '';
  [0, .5, 1].forEach(f=>{ const v = max*f, yy = y(v); g += `<line x1="${padL}" x2="${W-padR}" y1="${yy}" y2="${yy}" class="grid"/><text x="${padL-6}" y="${yy+4}" class="ax" text-anchor="end">${esc(fmt(v))}</text>`; });
  o.labels.forEach((l,i)=>{
    const x = padL + step*i + (step-bw)/2; let acc = 0; const parts = [];
    o.series.forEach((s,si)=>{ const v = s.values[i]||0; if(v<=0) return; const y0 = y(acc), y1 = y(acc+v); const h = Math.max(1, y0-y1-(acc>0?2:0)); const top = si===o.series.length-1 || o.series.slice(si+1).every(t=>!(t.values[i]>0));
      g += top ? `<path d="${roundTop(x, y0-(acc>0?2:0)-h, bw, h)}" fill="${s.color}"/>` : `<rect x="${x}" y="${y0-(acc>0?2:0)-h}" width="${bw}" height="${h}" fill="${s.color}"/>`;
      acc += v; parts.push(`${s.name}: ${o.valFmt?o.valFmt(v):cop(v)}`); });
    const tip = `${o.tipLabel?o.tipLabel(l):l} · ${o.series.length>1?'Total '+(o.valFmt?o.valFmt(totals[i]):cop(totals[i]))+' · ':''}${parts.join(' · ')||'sin datos'}`;
    g += `<rect x="${padL+step*i}" y="${padT}" width="${step}" height="${plotH}" class="hit" data-tip="${esc(tip)}"/>`;
    g += `<text x="${padL+step*i+step/2}" y="${H-4}" class="ax" text-anchor="middle">${esc(o.short?o.short(l):l)}</text>`;
  });
  g += `<line x1="${padL}" x2="${W-padR}" y1="${y(0)}" y2="${y(0)}" class="base"/>`;
  const legend = o.series.length>1 ? `<div class="legend">${o.series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  const table = `<details class="ctable"><summary>Ver tabla</summary><table class="t"><tr><th></th>${o.series.map(s=>`<th class="n">${esc(s.name)}</th>`).join('')}${o.series.length>1?'<th class="n">Total</th>':''}</tr>${o.labels.map((l,i)=>`<tr><td>${esc(o.tipLabel?o.tipLabel(l):l)}</td>${o.series.map(s=>`<td class="n">${s.values[i]?(o.valFmt?o.valFmt(s.values[i]):cop(s.values[i])):'—'}</td>`).join('')}${o.series.length>1?`<td class="n">${cop(totals[i])}</td>`:''}</tr>`).join('')}</table></details>`;
  return `${legend}<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title||'Gráfico')}">${g}</svg>${table}`;
}
function roundTop(x, y, w, h){ const r = Math.min(4, w/2, h); return `M${x},${y+h} V${y+r} Q${x},${y} ${x+r},${y} H${x+w-r} Q${x+w},${y} ${x+w},${y+r} V${y+h} Z`; }
/* Línea de una serie con puntos. opts: {points:[{x:date string, y, label}], fmt, valFmt, height} */
function lineChart(o){
  const pts = o.points.filter(p=>p.y!=null); if(pts.length<2) return '';
  const W = 360, H = Math.round((o.height||180)*0.62), padL = 44, padR = 8, padT = 8, padB = 18;
  const xs = pts.map(p=>new Date(p.x).getTime()); const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0+1;
  const ys = pts.map(p=>p.y); let lo = Math.min(...ys), hi = Math.max(...ys); const pad = (hi-lo)*0.15 || hi*0.1 || 1; lo = Math.max(0, lo-pad); hi = hi+pad;
  const fmt = o.fmt || fmtShort; const px = t => padL + (x1===x0?0.5:(t-x0)/(x1-x0))*(W-padL-padR); const py = v => padT + (H-padT-padB) * (1-(v-lo)/(hi-lo));
  let g = ''; [0, .5, 1].forEach(f=>{ const v = lo+(hi-lo)*f, yy = py(v); g += `<line x1="${padL}" x2="${W-padR}" y1="${yy}" y2="${yy}" class="grid"/><text x="${padL-6}" y="${yy+4}" class="ax" text-anchor="end">${esc(fmt(v))}</text>`; });
  g += `<path d="${pts.map((p,i)=>`${i?'L':'M'}${px(xs[i]).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--pine)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  pts.forEach((p,i)=>{ g += `<circle cx="${px(xs[i])}" cy="${py(p.y)}" r="3.5" fill="${p.alt?'var(--amber)':'var(--pine)'}" stroke="var(--surface-raised)" stroke-width="1.5"/><circle cx="${px(xs[i])}" cy="${py(p.y)}" r="10" class="hit" data-tip="${esc(p.label || fmtDate(p.x)+' · '+(o.valFmt?o.valFmt(p.y):cop(p.y)))}"/>`; });
  g += `<text x="${padL}" y="${H-4}" class="ax">${fmtDate(pts[0].x)}</text><text x="${W-padR}" y="${H-4}" class="ax" text-anchor="end">${fmtDate(pts[pts.length-1].x)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title||'Evolución')}">${g}</svg>`;
}
// Tooltip compartido para todos los gráficos (toque o hover)
(()=>{ let tip = null;
  const show = (el, x, y)=>{ if(!tip){ tip = document.createElement('div'); tip.className = 'charttip'; document.body.appendChild(tip); } tip.textContent = el.getAttribute('data-tip'); tip.style.display = 'block';
    const r = tip.getBoundingClientRect(); tip.style.left = Math.max(8, Math.min(innerWidth - r.width - 8, x - r.width/2)) + 'px'; tip.style.top = Math.max(8, y - r.height - 14) + 'px';
    document.querySelectorAll('.hit.on').forEach(h=>h.classList.remove('on')); el.classList.add('on'); };
  const hide = ()=>{ if(tip) tip.style.display='none'; document.querySelectorAll('.hit.on').forEach(h=>h.classList.remove('on')); };
  document.addEventListener('pointermove', e=>{ const h = e.target.closest && e.target.closest('.hit'); if(h && e.pointerType==='mouse') show(h, e.clientX, e.clientY); else if(e.pointerType==='mouse') hide(); });
  document.addEventListener('pointerdown', e=>{ const h = e.target.closest && e.target.closest('.hit'); if(h) show(h, e.clientX, e.clientY); else hide(); });
  window.addEventListener('scroll', hide, {passive:true});
})();
const CHART_C1 = 'var(--chart-1)', CHART_C2 = 'var(--chart-2)';
function last12(){ const cur = monthOf(todayStr()); const a = []; for(let i=11;i>=0;i--) a.push(monthShift(cur,-i)); return a; }

/* ================= PERFILES Y CLAVE ================= */
const PROFILE_COLORS = ['#2F5D50','#3F5D79','#8A5B0C','#A23E36','#5E4B8B','#2E6E7E'];
function profiles(){ return ((S.config.profiles||{}).list || []).slice(); }
function profileById(id){ return profiles().find(p=>p.id===id) || null; }
function saveProfiles(list){ put('config','profiles', {list}); }
// Quién usa este dispositivo se recuerda (localStorage); el desbloqueo dura solo mientras la app está abierta (sessionStorage).
function sessionGet(){ let pid = null, un = null; try{ pid = localStorage.getItem('stocka_profile'); un = JSON.parse(sessionStorage.getItem('stocka_unlock')||'null'); }catch(e){ return RT.memSession||null; }
  if(!pid) return null; return Object.assign({profileId:pid, unlocked:false}, un && un.profileId===pid ? un : {}); }
function sessionSet(v){ RT.memSession = v; try{ if(!v){ localStorage.removeItem('stocka_profile'); sessionStorage.removeItem('stocka_unlock'); return; } localStorage.setItem('stocka_profile', v.profileId); sessionStorage.setItem('stocka_unlock', JSON.stringify({profileId:v.profileId, unlocked:!!v.unlocked, lastSeen:v.lastSeen||Date.now()})); }catch(e){} }
function currentProfile(){ const s = sessionGet(); return s ? profileById(s.profileId) : null; }
async function hashPin(pin, salt){
  const data = new TextEncoder().encode('stocka:'+salt+':'+pin);
  try{ const h = await crypto.subtle.digest('SHA-256', data); return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
  catch(e){ let h = 2166136261; for(const b of data){ h ^= b; h = Math.imul(h, 16777619); } return 'f'+(h>>>0).toString(16); }
}
const avatar = (p, size=36) => p ? `<span class="avatar" style="width:${size}px;height:${size}px;background:${esc(p.color||PROFILE_COLORS[0])};font-size:${Math.round(size*0.42)}px">${esc((p.name||'?').trim().charAt(0).toUpperCase())}</span>` : `<span class="avatar ghost" style="width:${size}px;height:${size}px">${I('user')}</span>`;
function needsLock(){ return profiles().some(p=>p.pinHash); }
function isUnlocked(){ const s = sessionGet(); if(!s || !profileById(s.profileId)) return false; const p = profileById(s.profileId); if(!p.pinHash) return true;
  const mins = S.settings.autoLockMin ?? 10; if(mins>0 && s.lastSeen && Date.now()-s.lastSeen > mins*60000) return false; return !!s.unlocked; }
function touchSession(){ const s = sessionGet(); if(s && s.unlocked){ s.lastSeen = Date.now(); sessionSet(s); } }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') touchSession(); else if(needsLock() && !isUnlocked()) showLock(); });
document.addEventListener('pointerdown', ()=>{ const s = sessionGet(); if(s && s.unlocked && (!s.lastSeen || Date.now()-s.lastSeen > 30000)) touchSession(); }, {passive:true});
let LOCK = {pid:null, pin:'', tries:0, until:0};
function showLock(){
  if(!needsLock()) return hideLock();
  let el = $('#lock'); if(!el){ el = document.createElement('div'); el.id = 'lock'; document.body.appendChild(el); }
  const ps = profiles(); const s = sessionGet();
  if(!LOCK.pid || !profileById(LOCK.pid)) LOCK.pid = (s && profileById(s.profileId) ? s.profileId : (ps.find(p=>p.pinHash)||ps[0]).id);
  const p = profileById(LOCK.pid); LOCK.pin = '';
  el.innerHTML = `<div class="lockin">
    <div class="brandbar" style="justify-content:center;margin-bottom:28px">${LOGO_MARK(40)}<span style="color:var(--ink)">${LOGO_WORD(24)}</span></div>
    ${ps.length>1?`<div class="lockprofiles">${ps.map(x=>`<button data-lockp="${esc(x.id)}" class="${x.id===LOCK.pid?'on':''}">${avatar(x,48)}<span>${esc(x.name)}</span></button>`).join('')}</div>`:`<div style="text-align:center">${avatar(p,64)}<div style="font-weight:700;font-size:18px;margin-top:10px">${esc(p.name)}</div></div>`}
    <div class="lockmsg" id="lockmsg">${p.pinHash?'Escribe tu clave':'Este perfil no tiene clave'}</div>
    <div class="pindots" id="pindots">${'<i></i>'.repeat(p.pinLen||4)}</div>
    <div class="pinpad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-pin="${n}">${n}</button>`).join('')}<button data-pin="forgot" class="sm">Olvidé</button><button data-pin="0">0</button><button data-pin="del" aria-label="Borrar">${I('backspace')}</button></div>
  </div>`;
  el.style.display = 'flex'; document.body.style.overflow = 'hidden';
  if(!p.pinHash){ unlockAs(p.id); }
}
function hideLock(){ const el = $('#lock'); if(el){ el.style.display = 'none'; el.innerHTML = ''; } if(!sheetIsOpen()) document.body.style.overflow = ''; }
function unlockAs(pid){ sessionSet({profileId:pid, unlocked:true, lastSeen:Date.now()}); RT.me = pid; LOCK.tries = 0; hideLock(); render(); }
async function lockKey(k){
  const p = profileById(LOCK.pid); if(!p) return;
  if(k==='forgot'){ const m = $('#lockmsg'); m.innerHTML = RT.standalone ? 'La clave no se puede recuperar. Otro perfil puede cambiarla desde Ajustes, o puedes <a href="#" id="lockwipe">borrar los datos de este dispositivo</a>.' : 'La clave no se puede recuperar. Pide a otra persona del hogar que la cambie desde Ajustes → Perfiles.'; const w = $('#lockwipe'); if(w) w.onclick = ev=>{ ev.preventDefault(); if(w.dataset.c){ try{ localStorage.removeItem('mec_local_v1'); localStorage.removeItem('stocka_profile'); }catch(e){} location.reload(); } else { w.dataset.c = '1'; w.textContent = 'toca otra vez para borrar todo (no se puede deshacer)'; } }; return; }
  if(Date.now() < LOCK.until){ $('#lockmsg').textContent = `Demasiados intentos. Espera ${Math.ceil((LOCK.until-Date.now())/1000)} s.`; return; }
  if(k==='del') LOCK.pin = LOCK.pin.slice(0,-1); else if(LOCK.pin.length < (p.pinLen||4)) LOCK.pin += k;
  const dots = $('#pindots'); dots.innerHTML = Array.from({length:p.pinLen||4}, (_,i)=>`<i class="${i<LOCK.pin.length?'on':''}"></i>`).join('');
  if(LOCK.pin.length === (p.pinLen||4)){
    const h = await hashPin(LOCK.pin, p.salt);
    if(h === p.pinHash){ buzz(15); unlockAs(p.id); }
    else { LOCK.tries++; LOCK.pin = ''; buzz(60); dots.classList.add('shake'); setTimeout(()=>{ dots.classList.remove('shake'); dots.innerHTML = '<i></i>'.repeat(p.pinLen||4); }, 400);
      if(LOCK.tries >= 5){ LOCK.until = Date.now()+30000; LOCK.tries = 0; $('#lockmsg').textContent = 'Demasiados intentos. Espera 30 s.'; } else $('#lockmsg').textContent = 'Clave incorrecta'; }
  }
}
document.addEventListener('click', e=>{
  const b = e.target.closest && e.target.closest('#lock [data-pin], #lock [data-lockp]'); if(!b) return;
  e.stopPropagation(); if(b.dataset.lockp){ LOCK.pid = b.dataset.lockp; showLock(); return; } lockKey(b.dataset.pin);
}, true);
document.addEventListener('keydown', e=>{ const el = $('#lock'); if(!el || el.style.display!=='flex') return; if(/^[0-9]$/.test(e.key)) lockKey(e.key); else if(e.key==='Backspace') lockKey('del'); });

function profileSheet(id){
  const p = id ? profileById(id) : null; const color0 = p?.color || PROFILE_COLORS[profiles().length % PROFILE_COLORS.length];
  openSheet(p ? 'Editar perfil' : 'Nuevo perfil', `
    <label class="f">Nombre</label><input class="i" id="prName" value="${esc(p?.name||'')}" placeholder="Ej. Juan">
    <label class="f">Color</label><div class="row wrap" id="prColors">${PROFILE_COLORS.map(c=>`<button class="swatch ${c===color0?'on':''}" data-c="${c}" style="background:${c}" aria-label="Color"></button>`).join('')}</div>
    <label class="f">${p&&p.pinHash?'Nueva clave (déjala vacía para no cambiarla)':'Clave de 4 a 6 números'}</label><input class="i" id="prPin" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="••••">
    <label class="f">Repite la clave</label><input class="i" id="prPin2" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="••••">
    <div class="note info">${I('info')} La clave impide que otras personas abran la app en este dispositivo. ${RT.standalone?'Los datos no se cifran: protege también el celular con su propio bloqueo.':'Además, la app ya está protegida por tu cuenta de Claude.'}</div>
    ${p&&p.pinHash?`<button class="btn ghost full" id="prNoPin">Quitar la clave de este perfil</button>`:''}
    <div class="stickybar grid2">${p?`<button class="btn danger" id="prDel">Eliminar perfil</button>`:'<button class="btn ghost" data-a="closeSheet">Cancelar</button>'}<button class="btn" id="prSave">Guardar</button></div>`);
  let color = color0;
  document.querySelectorAll('#prColors .swatch').forEach(b=>b.onclick=()=>{ color = b.dataset.c; document.querySelectorAll('#prColors .swatch').forEach(x=>x.classList.toggle('on', x===b)); });
  $('#prSave').onclick = async ()=>{
    const name = val('prName').trim(); if(!name) return toast('Escribe un nombre');
    const pin = val('prPin').trim(), pin2 = val('prPin2').trim(); const list = profiles();
    let rec = p ? Object.assign({}, p) : {id: uid(), createdAt: nowISO()};
    rec.name = name; rec.color = color;
    if(pin || !p){ if(pin && !/^\d{4,6}$/.test(pin)) return toast('La clave debe tener de 4 a 6 números'); if(pin !== pin2) return toast('Las claves no coinciden');
      if(pin){ rec.salt = uid(); rec.pinHash = await hashPin(pin, rec.salt); rec.pinLen = pin.length; } }
    const idx = list.findIndex(x=>x.id===rec.id); if(idx>=0) list[idx] = rec; else list.push(rec);
    saveProfiles(list); if(!currentProfile()) unlockAs(rec.id); closeSheet(); toast(p?'Perfil actualizado':'Perfil creado'); render();
  };
  const np = $('#prNoPin'); if(np) np.onclick = ()=>{ const list = profiles().map(x=>x.id===p.id ? Object.assign({}, x, {pinHash:null, salt:null, pinLen:null}) : x); saveProfiles(list); closeSheet(); toast('Clave eliminada'); };
  const del = $('#prDel'); if(del) del.onclick = ()=>confirmSheet('¿Eliminar este perfil?', 'Los datos del hogar se conservan; solo se quita el perfil y su clave.', 'Eliminar', ()=>{ saveProfiles(profiles().filter(x=>x.id!==p.id)); const s = sessionGet(); if(s && s.profileId===p.id) sessionSet(null); render(); if(needsLock() && !isUnlocked()) showLock(); }, true);
}
ACT.newProfile = ()=>profileSheet(null);
ACT.editProfile = el=>profileSheet(el.dataset.id);
ACT.lockNow = ()=>{ const s = sessionGet(); if(s) { s.unlocked = false; sessionSet(s); } closeSheet(true); showLock(); };
ACT.profileMenu = ()=>{
  const cp = currentProfile(); const ps = profiles();
  openSheet('Perfil', `${cp?`<div class="row" style="margin-bottom:12px">${avatar(cp,48)}<div><div style="font-weight:700;font-size:18px">${esc(cp.name)}</div><div class="tiny">${cp.pinHash?'Con clave':'Sin clave'}</div></div></div>`:'<p class="sub">Crea un perfil con clave para que solo ustedes puedan abrir la app en este dispositivo.</p>'}
    <div class="list">${ps.map(p=>`<div class="item tap" data-a="editProfile" data-id="${esc(p.id)}">${avatar(p)}<div class="grow"><div class="name">${esc(p.name)}${cp&&cp.id===p.id?' <span class="chip">Activo</span>':''}</div><div class="tiny">${p.pinHash?'Con clave':'Sin clave'}</div></div><span style="color:var(--ink-subtle)">${I('chevron-right')}</span></div>`).join('')}
      <div class="item tap" data-a="newProfile"><span class="tile pine">${I('plus')}</span><div class="grow name">Agregar perfil</div></div></div>
    ${needsLock()?`<button class="btn full" data-a="lockNow">${I('lock')}Bloquear ahora</button>`:''}`);
};

/* ================= SERVICIOS DEL HOGAR ================= */
const SVC_TYPES = {
  agua:{name:'Agua y alcantarillado', ic:'svc-agua', unit:'m³', meter:true},
  luz:{name:'Energía', ic:'svc-luz', unit:'kWh', meter:true},
  gas:{name:'Gas natural', ic:'svc-gas', unit:'m³', meter:true},
  internet:{name:'Internet y hogar', ic:'svc-internet'},
  celular:{name:'Celular / plan', ic:'phone'},
  tv:{name:'Televisión / streaming', ic:'svc-tv'},
  admin:{name:'Administración', ic:'svc-admin'},
  arriendo:{name:'Arriendo / crédito', ic:'svc-arriendo'},
  aseo:{name:'Aseo / basuras', ic:'svc-aseo'},
  otro:{name:'Otro', ic:'svc-otro'},
};
const services = (all) => Object.entries(S.services).map(([id,s])=>Object.assign({id},s)).filter(s=>all || !s.archived).sort((a,b)=>(a.order??99)-(b.order??99) || a.name.localeCompare(b.name,'es'));
const svc = id => S.services[id] ? Object.assign({id}, S.services[id]) : null;
const svcIco = s => I((SVC_TYPES[s?.type]||SVC_TYPES.otro).ic);
const bills = () => Object.entries(S.bills).map(([id,b])=>Object.assign({id},b)).filter(b=>!b.void);
function billsOf(sid){ return bills().filter(b=>b.serviceId===sid).sort((a,b)=>(a.period||'').localeCompare(b.period||'')); }
function billDue(b){ if(b.status==='pagada' || !b.dueDate) return null; return daysBetween(todayStr(), b.dueDate); }
function dueChip(b){ if(b.status==='pagada') return `<span class="chip">${I('check')}Pagada</span>`; const d = billDue(b); if(d==null) return '<span class="chip warn">Pendiente</span>'; if(d<0) return `<span class="chip bad">Vencida hace ${-d} d</span>`; if(d===0) return '<span class="chip bad">Vence hoy</span>'; return `<span class="chip ${d<=5?'warn':'grey'}">Vence en ${d} d</span>`; }
function servicesMonthTotal(mk){ return sum(bills().filter(b=>b.period===mk).map(b=>b.amount||0)); }
function upcomingBills(days=10){ return bills().filter(b=>b.status!=='pagada').filter(b=>{ const d = billDue(b); return d==null || d<=days; }).sort((a,b)=>(a.dueDate||'9').localeCompare(b.dueDate||'9')); }
const unitOf = s => s.unit || (SVC_TYPES[s.type]||{}).unit || '';
const fmtCons = (v, u) => v==null ? '—' : fnum(v)+(u?' '+u:'');

VIEWS.servicios = function(){
  const mk = monthOf(todayStr()); const all = services(); const up = upcomingBills(31);
  const facturado = servicesMonthTotal(mk); const pend = bills().filter(b=>b.period===mk && b.status!=='pagada');
  let h = `${pageHead('Servicios', `<button class="btn sm sec" data-a="newBill">${I('plus')}Factura</button>`)}
    <p class="sub" style="margin-top:-6px">Agua, energía, gas, internet, administración… con su consumo, valor y pago.</p>`;
  if(!all.length) return h + `<div class="card empty"><div class="ic">${I('svc-luz')}</div><b>Aún no hay servicios</b><div class="sub">Agrega los servicios de la casa para llevar el historial de consumo y pagos.</div><div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-a="svcStarter">Elegir servicios</button></div></div>`;
  h += `<div class="grid2"><div class="card"><div class="tiny">Facturado en ${MONTHS[+mk.slice(5)-1]}</div><div class="big money">${cop(facturado)}</div></div><div class="card"><div class="tiny">Por pagar</div><div class="big money" style="color:${pend.length?'var(--amber)':'var(--pine)'}">${cop(sum(pend.map(b=>b.amount||0)))}</div><div class="tiny">${pend.length} factura${pend.length===1?'':'s'}</div></div></div>`;
  if(up.length) h += `<h2>Próximos pagos</h2><div class="list">${up.map(billRow).join('')}</div>`;
  const fixedMissing = all.filter(s=>!SVC_TYPES[s.type]?.meter && s.usualAmount && !bills().some(b=>b.serviceId===s.id && b.period===mk));
  if(fixedMissing.length) h += `<button class="btn sec full" data-a="genFixed" style="margin-bottom:12px">${I('repeat')}Crear facturas fijas de ${MONTHS[+mk.slice(5)-1]} (${fixedMissing.length})</button>`;
  h += `<h2>Mis servicios</h2><div class="list">${all.map(s=>{ const bs = billsOf(s.id); const l = bs[bs.length-1], pv = bs[bs.length-2]; let tr = '';
      if(l && pv && l.amount && pv.amount){ const d = (l.amount-pv.amount)/pv.amount*100; tr = Math.abs(d)<=1 ? '<span class="flat">＝</span>' : d>0 ? `<span class="up">${I('arrow-up')} ${pct(d)}</span>` : `<span class="down">${I('arrow-down')} ${pct(d)}</span>`; }
      return `<div class="item tap" data-a="svcDetail" data-id="${s.id}"><span class="tile pine">${svcIco(s)}</span><div class="grow"><div class="name">${esc(s.name)}</div><div class="tiny">${l?`${esc(monthName(l.period))}${l.consumption!=null?' · '+fmtCons(l.consumption, unitOf(s)):''}`:'Sin facturas'}${s.dueDay?` · paga el ${s.dueDay}`:''}</div></div><div class="right"><div class="money">${l?cop(l.amount):'—'}</div><div class="tiny">${tr}</div></div></div>`; }).join('')}</div>
    <button class="btn ghost full" data-a="newService">${I('plus')}Agregar servicio</button>`;
  const meters = all.filter(s=>SVC_TYPES[s.type]?.meter && billsOf(s.id).some(b=>b.consumption!=null));
  if(meters.length){ h += `<h2>Consumo por mes</h2>`; meters.forEach(s=>{ const ms = last12(); const vals = ms.map(m=>{ const b = billsOf(s.id).find(x=>x.period===m); return b && b.consumption!=null ? b.consumption : 0; });
    h += `<div class="card"><div class="row between"><b>${svcIco(s)} ${esc(s.name)}</b><span class="tiny">${esc(unitOf(s))}</span></div>${barChart({labels:ms, series:[{name:'Consumo', color:'var(--pine)', values:vals}], fmt:v=>fnum(Math.round(v)), valFmt:v=>fmtCons(v, unitOf(s)), short:monthShort, tipLabel:monthName, height:150, title:'Consumo de '+s.name})}</div>`; }); }
  return h;
};
function billRow(b){ const s = svc(b.serviceId); if(!s) return ''; return `<div class="item tap" data-a="editBill" data-id="${b.id}"><span class="tile">${svcIco(s)}</span><div class="grow"><div class="name">${esc(s.name)}</div><div class="tiny">${esc(monthName(b.period))}${b.dueDate?' · vence '+fmtDate(b.dueDate):''}</div><div style="margin-top:4px">${dueChip(b)}</div></div><div class="right"><div class="money">${cop(b.amount)}</div>${b.status!=='pagada'?`<button class="btn sm sec" style="margin-top:6px" data-a="payBill" data-id="${b.id}">Pagar</button>`:''}</div></div>`; }
ACT.svcStarter = ()=>{
  const have = new Set(services(true).map(s=>s.type));
  openSheet('Servicios de la casa', `<p class="sub">Marca los que pagan. Luego puedes poner la empresa y el día de pago.</p><div class="list">${Object.entries(SVC_TYPES).filter(([k])=>k!=='otro').map(([k,t])=>`<label class="item" style="cursor:pointer"><input type="checkbox" data-svc="${k}" ${have.has(k)?'disabled':['agua','luz','gas','internet'].includes(k)?'checked':''} style="width:24px;height:24px"><span class="tile">${I(t.ic)}</span><span class="grow name">${t.name}</span>${have.has(k)?'<span class="tiny">ya está</span>':''}</label>`).join('')}</div>
    <div class="stickybar"><button class="btn full" id="svcStartOk">Agregar seleccionados</button></div>`);
  $('#svcStartOk').onclick = ()=>{ const sel = [...document.querySelectorAll('[data-svc]')].filter(x=>x.checked && !x.disabled).map(x=>x.dataset.svc);
    sel.forEach((k,i)=>put('services', uid(), {type:k, name:SVC_TYPES[k].name, unit:SVC_TYPES[k].unit||null, order:Object.keys(SVC_TYPES).indexOf(k)})); closeSheet(); toast(`${sel.length} servicios agregados`); };
};
function serviceSheet(id){
  const s = id ? svc(id) : null; let type = s?.type || 'agua';
  const body = ()=>`<label class="f">Tipo</label><div class="chips" id="svType" style="flex-wrap:wrap">${Object.entries(SVC_TYPES).map(([k,t])=>`<button data-t="${k}" class="${k===type?'on':''}">${t.name}</button>`).join('')}</div>
    <label class="f">Nombre o empresa</label><input class="i" id="svName" value="${esc(s?.name||SVC_TYPES[type].name)}" placeholder="Ej. EPM energía, Claro hogar">
    <div class="grid2"><div><label class="f">Unidad de consumo</label><input class="i" id="svUnit" value="${esc(s?.unit ?? SVC_TYPES[type].unit ?? '')}" placeholder="kWh, m³… (vacío si no aplica)"></div>
    <div><label class="f">Día de pago</label><input class="i" id="svDue" inputmode="numeric" value="${s?.dueDay||''}" placeholder="Ej. 15"></div></div>
    <div class="grid2"><div><label class="f">Valor habitual (fijo)</label><input class="i" id="svUsual" inputmode="numeric" value="${s?.usualAmount?fnum(s.usualAmount):''}" placeholder="Para internet, arriendo…"></div>
    <div><label class="f">Referencia / contrato</label><input class="i" id="svRef" value="${esc(s?.ref||'')}" placeholder="Opcional"></div></div>
    <div class="stickybar grid2">${s?`<button class="btn danger" id="svArch">${s.archived?'Restaurar':'Archivar'}</button>`:'<button class="btn ghost" data-a="closeSheet">Cancelar</button>'}<button class="btn" id="svSave">Guardar</button></div>`;
  const draw = ()=>{ openSheet(s?'Editar servicio':'Nuevo servicio', body()); wire(); };
  const wire = ()=>{
    document.querySelectorAll('#svType button').forEach(b=>b.onclick=()=>{ const prevName = val('svName'); type = b.dataset.t; draw(); if(s || prevName!==SVC_TYPES[type].name) {} });
    $('#svSave').onclick = ()=>{ const name = val('svName').trim(); if(!name) return toast('Escribe un nombre'); const due = parseInt(val('svDue'),10);
      const f = {type, name, unit:val('svUnit').trim()||null, dueDay:(due>=1&&due<=31)?due:null, usualAmount:parseMoney(val('svUsual')), ref:val('svRef').trim()||null, order:s?.order ?? Object.keys(SVC_TYPES).indexOf(type)};
      if(s) patch('services', s.id, f); else put('services', uid(), f); closeSheet(); toast('Servicio guardado'); };
    const a = $('#svArch'); if(a) a.onclick = ()=>{ patch('services', s.id, {archived:!s.archived}); closeSheet(); toast(s.archived?'Restaurado':'Archivado (el historial se conserva)'); };
  };
  draw();
}
ACT.newService = ()=>serviceSheet(null);
ACT.editService = el=>serviceSheet(el.dataset.id);
ACT.svcDetail = el=>{
  const s = svc(el.dataset.id); if(!s) return; const bs = billsOf(s.id); const u = unitOf(s); const meter = SVC_TYPES[s.type]?.meter;
  const ms = last12(); const amt = ms.map(m=>sum(bs.filter(b=>b.period===m).map(b=>b.amount||0)));
  const withCons = bs.filter(b=>b.consumption>0 && b.amount); const unitCost = withCons.length ? withCons[withCons.length-1].amount/withCons[withCons.length-1].consumption : null;
  const last6 = bs.slice(-6); const avgAmt = last6.length ? sum(last6.map(b=>b.amount||0))/last6.length : null; const avgCons = meter && last6.some(b=>b.consumption!=null) ? sum(last6.map(b=>b.consumption||0))/last6.filter(b=>b.consumption!=null).length : null;
  const l = bs[bs.length-1];
  openSheet(`${svcIco(s)} ${esc(s.name)}`, `
    <div class="grid2"><div class="card"><div class="tiny">Última factura</div><div class="money" style="font-size:20px">${l?cop(l.amount):'—'}</div><div class="tiny">${l?esc(monthName(l.period)):''}</div></div>
    <div class="card"><div class="tiny">Promedio (últimas ${last6.length||0})</div><div class="money" style="font-size:20px">${avgAmt?cop(avgAmt):'—'}</div>${l&&avgAmt?`<div class="tiny">${l.amount>avgAmt*1.15?'<span class="up">Por encima del promedio</span>':l.amount<avgAmt*0.85?'<span class="down">Por debajo del promedio</span>':'En su nivel normal'}</div>`:''}</div>
    ${meter?`<div class="card"><div class="tiny">Último consumo</div><div class="money" style="font-size:20px">${l?fmtCons(l.consumption,u):'—'}</div><div class="tiny">${avgCons?'Promedio '+fmtCons(Math.round(avgCons*10)/10,u):''}</div></div><div class="card"><div class="tiny">Costo por ${esc(u||'unidad')}</div><div class="money" style="font-size:20px">${unitCost?cop(unitCost):'—'}</div><div class="tiny">valor ÷ consumo</div></div>`:''}</div>
    ${bs.length?`<h3>Valor por mes</h3>${barChart({labels:ms, series:[{name:'Valor', color:'var(--chart-2)', values:amt}], short:monthShort, tipLabel:monthName, height:160, title:'Valor de '+s.name})}`:''}
    ${meter && bs.some(b=>b.consumption!=null)?`<h3>Consumo por mes (${esc(u)})</h3>${barChart({labels:ms, series:[{name:'Consumo', color:'var(--pine)', values:ms.map(m=>{ const b = bs.find(x=>x.period===m); return b?.consumption||0; })}], fmt:v=>fnum(Math.round(v)), valFmt:v=>fmtCons(v,u), short:monthShort, tipLabel:monthName, height:150, title:'Consumo de '+s.name})}`:''}
    <h3>Facturas (${bs.length})</h3>${bs.length?`<div class="list">${[...bs].reverse().map(billRow).join('')}</div>`:'<div class="sub">Aún no hay facturas registradas.</div>'}
    <div class="stickybar grid2"><button class="btn ghost" data-a="editService" data-id="${s.id}">${I('pencil')}Editar</button><button class="btn" data-a="newBill" data-sid="${s.id}">${I('plus')}Factura</button></div>`);
};
function billSheet(id, pre){
  const b = id ? Object.assign({id}, S.bills[id]) : null; pre = pre || {};
  const all = services(); if(!all.length){ toast('Primero agrega tus servicios'); return ACT.svcStarter(); }
  let sid = b?.serviceId || pre.serviceId || all[0].id;
  const draw = ()=>{ const s = svc(sid); const u = unitOf(s); const meter = SVC_TYPES[s.type]?.meter; const prev = billsOf(sid).filter(x=>!b || x.id!==b.id).slice(-1)[0];
    const defPeriod = b?.period || pre.period || monthOf(todayStr());
    const defDue = b?.dueDate || pre.dueDate || (s.dueDay ? (()=>{ const [y,m] = defPeriod.split('-').map(Number); const dim = new Date(y, m, 0).getDate(); return defPeriod+'-'+String(Math.min(s.dueDay, dim)).padStart(2,'0'); })() : '');
    openSheet(b ? 'Editar factura' : 'Registrar factura', `
      ${pre.photoUrl?`<img class="photo" src="${pre.photoUrl}" style="margin-bottom:8px">`:''}${pre.warnings&&pre.warnings.length?`<div class="note warn">${pre.warnings.map(esc).join('<br>')}</div>`:''}
      <label class="f">Servicio</label><select class="i" id="blSvc">${all.map(x=>`<option value="${x.id}" ${x.id===sid?'selected':''}>${esc(x.name)}</option>`).join('')}</select>
      <div class="grid2"><div><label class="f">Mes que se cobra</label><input class="i" type="month" id="blPeriod" value="${esc(defPeriod)}"></div>
      <div><label class="f">Valor a pagar</label><input class="i ${pre.flags?.amount?'flag':''}" id="blAmt" inputmode="numeric" value="${(b?.amount ?? pre.amount)!=null?fnum(b?.amount ?? pre.amount):''}" placeholder="$"></div></div>
      ${meter||u?`<label class="f">Consumo${u?' ('+esc(u)+')':''}</label><input class="i ${pre.flags?.consumption?'flag':''}" id="blCons" inputmode="decimal" value="${(b?.consumption ?? pre.consumption)!=null?fnum(b?.consumption ?? pre.consumption):''}" placeholder="${prev&&prev.consumption!=null?'Anterior: '+fnum(prev.consumption):'Ej. 145'}">`:''}
      <div class="grid2"><div><label class="f">Fecha límite</label><input class="i" type="date" id="blDue" value="${esc(defDue)}"></div>
      <div><label class="f">Estado</label><select class="i" id="blStatus"><option value="pendiente" ${(b?.status||pre.status)!=='pagada'?'selected':''}>Pendiente</option><option value="pagada" ${(b?.status||pre.status)==='pagada'?'selected':''}>Pagada</option></select></div></div>
      <div class="grid2" id="blPaidRow"><div><label class="f">Fecha de pago</label><input class="i" type="date" id="blPaid" value="${esc(b?.paidDate||todayStr())}" max="${todayStr()}"></div><div><label class="f">Medio de pago</label><select class="i" id="blMethod"><option value="">—</option>${Object.entries(PAY).map(([k,n])=>`<option value="${k}" ${b?.method===k?'selected':''}>${n}</option>`).join('')}</select></div></div>
      <label class="f">Notas</label><input class="i" id="blNotes" value="${esc(b?.notes||'')}">
      <div class="card" id="blInfo" style="margin-top:10px"></div>
      <div class="stickybar grid2">${b?`<button class="btn danger" id="blDel">Anular</button>`:'<button class="btn ghost" data-a="closeSheet">Cancelar</button>'}<button class="btn" id="blSave">Guardar</button></div>`, ()=>{ if(pre.photoUrl) try{ URL.revokeObjectURL(pre.photoUrl); }catch(e){} });
    const info = ()=>{ const a = parseMoney(val('blAmt')); const c = $('#blCons') ? parseQty(val('blCons')) : null; let h = '';
      if(prev){ h += `<div class="row between"><span class="sub">Factura anterior (${esc(monthName(prev.period))})</span><b class="money">${cop(prev.amount)}</b></div>`; if(a && prev.amount){ const d = (a-prev.amount)/prev.amount*100; h += `<div class="row between"><span class="sub">Variación</span><b class="${d>1?'up':d<-1?'down':'flat'}">${pct(d)}</b></div>`; } }
      if(c && prev && prev.consumption){ const d = (c-prev.consumption)/prev.consumption*100; h += `<div class="row between"><span class="sub">Consumo vs anterior</span><b class="${d>1?'up':d<-1?'down':'flat'}">${pct(d)}</b></div>`; }
      if(a && c) h += `<div class="row between"><span class="sub">Costo por ${esc(u||'unidad')}</span><b class="money">${cop(a/c)}</b></div>`;
      const avg = billsOf(sid).slice(-6); const m = avg.length>=3 ? median(avg.map(x=>x.amount||0)) : null; if(a && m && Math.abs(a-m)/m > 0.4) h += `<div class="note warn">${I('alert')} Este valor se aleja más de 40% de lo usual (${cop(m)}). ¿Es correcto?</div>`;
      $('#blInfo').innerHTML = h || '<span class="sub">Con el valor y el consumo verás la comparación con la factura anterior.</span>'; $('#blInfo').style.display = '';
      $('#blPaidRow').style.display = val('blStatus')==='pagada' ? '' : 'none'; };
    ['blAmt','blCons','blStatus'].forEach(i=>{ const e = document.getElementById(i); if(e) e.oninput = e.onchange = info; }); info();
    $('#blSvc').onchange = ()=>{ sid = val('blSvc'); draw(); };
    $('#blSave').onclick = ()=>{ const amount = parseMoney(val('blAmt')); if(!amount) return toast('Escribe el valor'); const period = val('blPeriod'); if(!/^\d{4}-\d{2}$/.test(period)) return toast('Elige el mes');
      const status = val('blStatus'); const f = {serviceId:sid, period, amount, consumption: $('#blCons') ? parseQty(val('blCons')) : null, dueDate:val('blDue')||null, status, paidDate: status==='pagada' ? (val('blPaid')||todayStr()) : null, method: status==='pagada' ? (val('blMethod')||null) : null, notes:val('blNotes').trim()||null, source: b?.source || pre.source || 'manual'};
      if(pre.raw && !b) f.extraction = pre.raw;
      const dup = !b && billsOf(sid).find(x=>x.period===period); if(dup && !$('#blSave').dataset.c){ $('#blSave').dataset.c = '1'; $('#blSave').textContent = 'Ya hay una de ese mes: guardar igual'; return; }
      if(b) put('bills', b.id, Object.assign({}, S.bills[b.id], f)); else put('bills', uid(), f);
      closeSheet(); toast(status==='pagada' ? 'Factura pagada guardada' : 'Factura guardada'); };
    const del = $('#blDel'); if(del) del.onclick = ()=>confirmSheet('¿Anular esta factura?', 'Sale de los totales y gráficos.', 'Anular', ()=>{ patch('bills', b.id, {void:true}); toast('Factura anulada'); }, true);
  };
  draw();
}
ACT.newBill = el=>billSheet(null, {serviceId: el?.dataset?.sid});
ACT.editBill = el=>billSheet(el.dataset.id);
ACT.payBill = (el,e)=>{ e.stopPropagation(); const b = S.bills[el.dataset.id]; if(!b) return; patch('bills', el.dataset.id, {status:'pagada', paidDate:todayStr()}); buzz(20); toast('Marcada como pagada'); };
ACT.genFixed = ()=>{ const mk = monthOf(todayStr()); let n = 0; services().filter(s=>!SVC_TYPES[s.type]?.meter && s.usualAmount && !bills().some(b=>b.serviceId===s.id && b.period===mk)).forEach(s=>{
  const [y,m] = mk.split('-').map(Number); const dim = new Date(y, m, 0).getDate();
  put('bills', uid(), {serviceId:s.id, period:mk, amount:s.usualAmount, consumption:null, dueDate: s.dueDay ? mk+'-'+String(Math.min(s.dueDay,dim)).padStart(2,'0') : null, status:'pendiente', source:'fijo'}); n++; }); toast(`${n} facturas creadas como pendientes`); };
