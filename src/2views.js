/* ================= NAVEGACIÓN Y RENDER ================= */
const ROUTES = [
  ['inicio','Inicio','<i data-i=home></i>'],['lista','Lista','<i data-i=list></i>'],['inventario','Despensa','<i data-i=pantry></i>'],['precios','Precios','<i data-i=tag></i>'],
  ['compras','Compras','<i data-i=receipt></i>'],['reportes','Reportes','<i data-i=chart></i>'],['ajustes','Ajustes','<i data-i=settings></i>']
];
const UI = {route:'inicio', invFilter:'todos', invQ:'', priceQ:'', repMonth:monthOf(todayStr()), shopMode:false, purMonth:'todos'};
function route(){ const h = (location.hash||'').replace('#',''); return ROUTES.some(r=>r[0]===h) || h==='mas' ? h : 'inicio'; }
function go(r){ if(location.hash!=='#'+r) location.hash = r; else render(); window.scrollTo(0,0); }
window.addEventListener('hashchange', ()=>{ UI.prevRoute = UI.route; render(); window.scrollTo(0,0); });
const MAIN_TABS = {inicio:'Inicio', lista:'Lista', inventario:'Despensa', mas:'Más'};
function backTarget(){ const p = UI.prevRoute; return (p && MAIN_TABS[p] && p!==UI.route) ? p : 'mas'; }
function pageHead(title, right){ const t = backTarget(); return `<button class="backbtn" data-a="back" data-r="${t}">${I('chevron-left')}${MAIN_TABS[t]}</button><div class="hdr"><h1>${title}</h1>${right||''}</div>`; }
let renderPending = false;
function scheduleRender(){ if(renderPending) return; renderPending = true; requestAnimationFrame(()=>{ renderPending=false; const a = document.activeElement; if(a && $('#main').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)){ RT.deferred = true; return; } render(); }); }
document.addEventListener('focusout', e=>{ if(RT.deferred && $('#main').contains(e.target)){ RT.deferred=false; setTimeout(render, 50); } });

function navHTML(cur){
  const mob = [['inicio','Inicio','<i data-i=home></i>'],['lista','Lista','<i data-i=list></i>'],['plus','',''],['inventario','Despensa','<i data-i=pantry></i>'],['mas','Más','<i data-i=more></i>']];
  const nList = Object.values(S.list).filter(i=>i.status!=='carrito').length;
  $('#bottom').innerHTML = mob.map(([id,n,ic])=> id==='plus' ? `<button class="plus" data-a="quickActions" aria-label="Acciones rápidas"><span class="pc"><i data-i=plus></i></span><span class="lb">Registrar</span></button>` :
    `<button data-a="go" data-r="${id}" class="${(cur===id || (id==='mas' && ['precios','compras','reportes','ajustes','mas'].includes(cur)))?'on':''}"><span class="ic" style="position:relative"><span class="em">${ic}</span>${id==='lista'&&nList?`<span class="badge">${nList}</span>`:''}</span>${n}</button>`).join('');
  $('#side').innerHTML = `<div class="brand brandbar">${LOGO_MARK(30)}<span style="color:var(--ink)">${LOGO_WORD(20)}</span></div><button class="sideadd" data-a="quickActions">${I('plus')}Registrar</button>` + ROUTES.map(([id,n,ic])=>`<button data-a="go" data-r="${id}" class="${cur===id?'on':''}">${ic}${n}</button>`).join('') + `<div style="flex:1"></div><div style="padding:8px 12px">${statusHTML()}</div>`;
}
function statusHTML(short){
  if(short){ const m = RT.mode==='local'?(RT.standalone?['ok','En este equipo']:['warn','Solo aquí']):RT.mode==='cargando'?['','Conectando']:(RT.mode==='sin acceso'||RT.stale)?['warn','Sin conexión']:['ok','Al día']; return `<span class="status"><span class="dot ${m[0]}"></span>${m[1]}</span>`; }
  if(RT.mode==='local') return RT.standalone ? `<span class="status"><span class="dot ok"></span>Guardado en este dispositivo</span>` : `<span class="status"><span class="dot warn"></span>Guardado solo en este navegador</span>`;
  if(RT.mode==='cargando') return `<span class="status"><span class="spin" style="width:10px;height:10px;border-width:2px"></span>Conectando…</span>`;
  if(RT.mode==='sin acceso') return `<span class="status"><span class="dot warn"></span>Sin acceso a los datos</span>`;
  if(RT.stale) return `<span class="status"><span class="dot warn"></span>Sin conexión: puede estar desactualizado</span>`;
  return `<span class="status"><span class="dot ok"></span>Sincronizado en la nube</span>`;
}
function render(){
  const r = route(); UI.route = r; navHTML(r);
  const ready = RT.mode!=='cargando' && (RT.mode==='local' || COLLS.every(c=>RT.loaded[c]) || RT.stale);
  if(!ready){ $('#main').innerHTML = `<div class="empty"><div class="spin"></div><div style="margin-top:10px">Cargando sus datos…</div></div>`; return; }
  const fn = VIEWS[r] || VIEWS.inicio;
  $('#main').innerHTML = fn();
}

/* ================= INICIO ================= */
const VIEWS = {};
VIEWS.inicio = function(){
  const mk = monthOf(todayStr()); const spent = monthSpend(mk); const bud = S.settings.budget||0;
  const listItems = Object.values(S.list); const pend = listItems.filter(i=>i.status!=='carrito');
  const est = sum(listItems.map(estimateItem).filter(Boolean));
  const sug = suggestions().slice(0,6);
  const last = purchases()[0];
  const exp = products().filter(p=>p.expiry && p.inv!=='nohay' && daysBetween(todayStr(), p.expiry) <= 5).sort((a,b)=>a.expiry.localeCompare(b.expiry));
  const empty = !products().length;
  const lastAct = Object.values(S.products).concat(Object.values(S.purchases)).map(x=>x.updatedAt||'').sort().pop();
  const idle = lastAct && daysBetween(lastAct.slice(0,10), todayStr()) > 10;
  let h = `<div class="hdr" style="margin:6px 0 16px"><div class="brandbar">${LOGO_MARK(36)}<div><div class="greet">${esc(S.settings.householdName)}</div><h1 style="margin:2px 0 0;color:var(--ink);line-height:0">${LOGO_WORD(22)}</h1></div></div><div>${statusHTML(true)}</div></div>`;
  if(RT.mode==='local' && !RT.standalone) h += `<div class="note warn">Estás viendo una vista previa: los datos se guardan solo en este navegador. Abre la app publicada para compartirla con tu pareja.</div>`;
  let hideTip = false; try{ hideTip = localStorage.getItem('mec_tip_home')==='1'; }catch(e){}
  const installed = window.matchMedia && (matchMedia('(display-mode: standalone)').matches || navigator.standalone);
  if(!hideTip && !installed) h += `<div class="card" style="background:var(--green2);padding:12px"><div class="row between"><b>${I('phone')} Instálala como app</b><button class="x" style="width:36px;height:36px;font-size:18px" data-a="hideTip" aria-label="Ocultar">${I('close')}</button></div>
    ${RT.installEvt?`<button class="btn full" data-a="installApp" style="margin-top:8px">${I('download')}Instalar Stocka</button>`:''}
    <details><summary class="sub" style="min-height:36px;cursor:pointer;display:flex;align-items:center">Cómo ponerla en la pantalla de inicio</summary><div class="sub">• <b>iPhone (Safari):</b> Compartir ${I('upload')} → “Agregar a pantalla de inicio”.<br>• <b>Android (Chrome):</b> menú ⋮ → “Instalar app” o “Agregar a pantalla principal”.${RT.standalone?'<br>Así abre a pantalla completa y funciona sin internet.':'<br>Ya está fijada en tu barra lateral de Claude.'}</div></details></div>`;
  if(empty) h += `<div class="card"><h3> Empecemos</h3><p class="sub">Agrega los productos que suelen comprar. Puedes partir de una lista de básicos colombianos y ajustarla.</p><div class="row wrap"><button class="btn" data-a="starter">Elegir productos básicos</button><button class="btn ghost" data-a="newProduct">Crear uno</button></div></div>`;
  h += `<div class="card"><div class="row between"><div><div class="sub">Gastado en ${monthName(mk)}</div><div class="big money">${cop(spent)}</div></div>${bud?`<div class="right"><div class="sub">Disponible</div><div class="money" style="font-size:1.2rem;color:${bud-spent<0?'var(--bad)':'var(--green)'}">${cop(bud-spent)}</div></div>`:`<button class="btn sm sec" data-a="go" data-r="ajustes">Definir presupuesto</button>`}</div>`;
  if(bud){ const p = Math.min(100, spent/bud*100); h += `<div class="bar ${spent>bud?'over':''}" style="margin-top:10px"><div style="width:${p}%"></div></div><div class="tiny" style="margin-top:4px">${Math.round(spent/bud*100)}% de ${cop(bud)}</div>`; }
  h += `</div>`;
  h += `<div class="grid4" style="margin-bottom:12px">
    <button class="action hi" data-a="priceMenu"><span class="ic"><i data-i=tag></i></span>Registrar precio</button>
    <button class="action" data-a="photo" data-k="recibo"><span class="ic"><i data-i=camera></i></span>Foto de recibo</button>
    <button class="action" data-a="quickPurchase"><span class="ic"><i data-i=bolt></i></span>Compra rápida</button>
    <button class="action" data-a="go" data-r="lista"><span class="ic"><i data-i=list></i></span>Lista (${pend.length})</button></div>`;
  if(idle && !empty) h += `<div class="card" style="background:var(--warn2)"><div class="row between"><div><b>¿Revisamos la despensa rápido?</b><div class="sub">Hace más de 10 días no se actualiza. Toma un minuto.</div></div><button class="btn sm" data-a="quickReview">Revisar</button></div></div>`;
  if(sug.length){
    h += `<h2>Te puede hacer falta</h2><div class="list">` + sug.map(s=>`<div class="item">${catTile(s.p.cat)}<div class="grow"><div class="name">${esc(s.p.name)}</div><div class="tiny">${esc(s.why)}</div></div>${s.stale?`<button class="btn sm ghost" data-a="snooze" data-id="${s.p.id}" data-d="60">No</button>`:`<button class="btn sm ghost" data-a="snooze" data-id="${s.p.id}" data-d="7">Luego</button>`}<button class="btn sm" data-a="addToList" data-id="${s.p.id}"><i data-i=plus></i></button></div>`).join('') + `</div>`;
    if(sug.length>1) h += `<button class="btn sec full" data-a="addAllSug" style="margin-bottom:12px">Agregar todas a la lista</button>`;
  }
  if(listItems.length) h += `<div class="card tap" data-a="go" data-r="lista" style="cursor:pointer"><div class="row between"><div><b><i data-i=list></i> Lista de mercado</b><div class="sub">${pend.length} pendientes · ${listItems.length-pend.length} en carrito</div></div><div class="right"><div class="tiny">Estimado</div><div class="money">${est?cop(est):'—'}</div></div></div></div>`;
  if(exp.length) h += `<h2>Próximos a vencer</h2><div class="list">` + exp.map(p=>{ const d = daysBetween(todayStr(), p.expiry); return `<div class="item"><div class="grow"><div class="name">${esc(p.name)}</div><div class="tiny">${fmtDate(p.expiry)}</div></div><span class="chip ${d<0?'bad':'warn'}">${d<0?'Vencido':d===0?'Hoy':'En '+d+' días'}</span></div>`; }).join('') + `</div>`;
  if(last) h += `<h2>Última compra</h2><div class="list"><div class="item tap" data-a="purchase" data-id="${last.id}"><div class="grow"><div class="name">${esc(storeName(last.storeId))}</div><div class="tiny">${fmtDate(last.date)} · ${(last.items||[]).length} productos</div></div><div class="money">${cop(purchaseTotal(last))}</div></div></div>`;
  return h;
};
VIEWS.mas = function(){
  return `<h1>Más</h1><div class="list">${[['precios','Precios','<i data-i=tag></i>','Historial de precios y comparación entre meses'],['compras','Compras','<i data-i=receipt></i>','Historial de todo lo que han comprado'],['reportes','Reportes','<i data-i=chart></i>','Qué va bien y qué va mal cada mes'],['ajustes','Ajustes','<i data-i=settings></i>','Presupuesto, tiendas, catálogo, unidades, exportar']].map(([r,n,ic,d])=>`<div class="item tap" data-a="go" data-r="${r}"><span class="tile">${ic}</span><div class="grow"><div class="name">${n}</div><div class="tiny">${d}</div></div><span style="color:var(--ink-subtle)"><i data-i=chevron-right></i></span></div>`).join('')}</div><div style="margin-top:12px">${statusHTML()}</div>`;
};

/* ================= LISTA ================= */
VIEWS.lista = function(){
  const items = Object.entries(S.list).map(([id,i])=>Object.assign({id},i)).map(i=>Object.assign(i,{p:prod(i.productId)})).filter(i=>i.p);
  const cart = items.filter(i=>i.status==='carrito'); const pend = items.filter(i=>i.status!=='carrito');
  const est = sum(items.map(estimateItem).filter(Boolean)); const cartTot = sum(cart.map(i=>i.realTotal||0));
  const missing = products().filter(p=>(p.inv==='poco'||p.inv==='nohay') && !items.some(i=>i.productId===p.id));
  let h = `<div class="hdr"><h1>Lista de mercado</h1><button class="btn sm ${UI.shopMode?'acc':'sec'}" data-a="toggleShop">${UI.shopMode?'<i data-i=cart></i> En tienda':'<i data-i=cart></i> Modo tienda'}</button></div>`;
  if(UI.shopMode) h += `<div class="note info">Toca un producto para pasarlo al carrito y anotar el precio. ${S.settings.shopStore?`Comprando en <b>${esc(storeName(S.settings.shopStore))}</b> · <a href="#" data-a="pickShopStore">cambiar</a>`:`<a href="#" data-a="pickShopStore">Elegir tienda</a>`} · <a href="#" data-a="toggleShop">Salir del modo tienda</a></div>`;
  h += `<div class="card"><div class="row between"><div><div class="tiny">Estimado total</div><div class="money" style="font-size:1.3rem">${est?cop(est):'—'}</div>${items.some(i=>estimateItem(i)==null)?'<div class="tiny">Estimado: faltan precios de algunos productos</div>':''}</div>${cart.length?`<div class="right"><div class="tiny">En carrito (${cart.length})</div><div class="money" style="font-size:1.3rem">${cop(cartTot)}</div></div>`:''}</div></div>`;
  h += `<div class="row wrap" style="margin-bottom:8px"><button class="btn" data-a="addItem"><i data-i=plus></i> Agregar</button>${missing.length?`<button class="btn sec" data-a="addMissing">Agregar faltantes (${missing.length})</button>`:''}${purchases().length?`<button class="btn ghost" data-a="repeatLast">Repetir última compra</button>`:''}</div>`;
  if(!items.length) return h + `<div class="card empty"><div class="ic"><i data-i=list></i></div><b>La lista está vacía</b><div class="sub">Agrega productos o marca en la despensa lo que está en “Poco” o “No hay”.</div></div>`;
  const prioOrd = {urgente:0, necesario:1, opcional:2};
  const byCat = {}; pend.forEach(i=>{ (byCat[i.p.cat]=byCat[i.p.cat]||[]).push(i); });
  CATS.forEach(c=>{ const arr = byCat[c.id]; if(!arr) return; arr.sort((a,b)=>(prioOrd[a.prio||'necesario']-prioOrd[b.prio||'necesario']) || a.p.name.localeCompare(b.p.name,'es'));
    h += `<div class="cathead">${c.ic} ${c.name}</div><div class="list">` + arr.map(listRow).join('') + `</div>`; });
  if(cart.length) h += `<div class="cathead"><i data-i=cart></i> En carrito</div><div class="list">` + cart.map(listRow).join('') + `</div>`;
  if(cart.length) h += `<div style="height:64px"></div><button class="btn acc fab" data-a="closePurchase">Cerrar compra (${cart.length}) · ${cop(cartTot)}</button>`;
  return h;
};
function listRow(i){
  const lp = lastPaidUnit(i.productId); const est = estimateItem(i); const inCart = i.status==='carrito';
  const prio = i.prio==='urgente' ? '<span class="chip bad">Urgente</span>' : i.prio==='opcional' ? '<span class="chip grey">Opcional</span>' : '';
  const who = i.createdBy && RT.names[i.createdBy] ? ` · agregó ${esc(RT.names[i.createdBy])}` : '';
  return `<div class="item tap ${inCart?'done':''}" data-a="${UI.shopMode?'cartItem':'editItem'}" data-id="${i.id}">
    <div class="check ${inCart?'on':''}" data-a="${inCart?'uncart':'cartItem'}" data-id="${i.id}">${inCart?'<i data-i=check></i>':''}</div>
    <div class="grow"><div class="name">${esc(i.p.name)} ${prio}</div>
    <div class="tiny">${i.qty!=null?fmtQtyU(i.qty,i.unit):''}${i.note?' · '+esc(i.note):''}${lp?` · último ${cop(lp.price)} (${esc(storeName(lp.storeId))})`:''}${who}</div></div>
    <div class="right money">${inCart && i.realTotal ? cop(i.realTotal) : est ? '<span class="tiny">≈</span>'+cop(est) : ''}</div></div>`;
}

/* ================= INVENTARIO ================= */
VIEWS.inventario = function(){
  let ps = products();
  const counts = {todos:ps.length, poco:ps.filter(p=>p.inv==='poco').length, nohay:ps.filter(p=>p.inv==='nohay').length, vence:ps.filter(p=>p.expiry).length};
  if(UI.invFilter==='poco') ps = ps.filter(p=>p.inv==='poco'); if(UI.invFilter==='nohay') ps = ps.filter(p=>p.inv==='nohay'); if(UI.invFilter==='vence') ps = ps.filter(p=>p.expiry).sort((a,b)=>a.expiry.localeCompare(b.expiry));
  if(UI.invQ) ps = ps.filter(p=>norm(p.name).includes(norm(UI.invQ)));
  let h = `<div class="hdr"><h1>Despensa</h1><button class="btn sm sec" data-a="quickReview">Revisión rápida</button></div>
    <p class="sub" style="margin-top:-6px">Solo marca lo que se está acabando. Al cerrar una compra, lo comprado vuelve a “Hay” solo.</p>
    <div class="chips">${[['todos','Todos'],['poco','Poco'],['nohay','No hay'],['vence','Con vencimiento']].map(([k,n])=>`<button data-a="invFilter" data-k="${k}" class="${UI.invFilter===k?'on':''}">${n} (${counts[k]})</button>`).join('')}</div>
    <input class="i" placeholder="Buscar en la despensa…" enterkeyhint="search" value="${esc(UI.invQ)}" data-in="invQ" style="margin-bottom:8px">`;
  if(!products().length) return h + `<div class="card empty"><div class="ic"><i data-i=pantry></i></div><b>Aún no hay productos</b><div class="sub">Crea tu catálogo para empezar.</div><div class="row" style="justify-content:center;margin-top:10px"><button class="btn" data-a="starter">Elegir básicos</button></div></div>`;
  if(counts.poco+counts.nohay>0) h += `<button class="btn sec full" data-a="addMissing" style="margin-bottom:8px">Pasar “Poco” y “No hay” a la lista</button>`;
  const byCat = {}; ps.forEach(p=>{ (byCat[p.cat]=byCat[p.cat]||[]).push(p); });
  CATS.forEach(c=>{ const arr = byCat[c.id]; if(!arr) return; h += `<div class="cathead">${c.ic} ${c.name}</div><div class="list">` + arr.map(invRow).join('') + `</div>`; });
  if(!ps.length) h += `<div class="empty">Nada por aquí.</div>`;
  h += `<button class="btn ghost full" data-a="newProduct" style="margin-top:8px"><i data-i=plus></i> Nuevo producto</button>`;
  return h;
};
function invRow(p){
  const st = p.inv || 'hay'; const inList = Object.values(S.list).some(i=>i.productId===p.id);
  const d = p.expiry ? daysBetween(todayStr(), p.expiry) : null;
  return `<div class="item inv"><div class="grow tap" data-a="editProduct" data-id="${p.id}" style="cursor:pointer"><div class="name">${esc(p.name)}</div><div class="tiny">${[p.loc?esc(LOCS[p.loc]||p.loc):'', d!=null?(d<0?'<span style="color:var(--bad)">vencido</span>':'vence '+fmtDate(p.expiry)):'', inList?'<span style="color:var(--green)">en la lista</span>':''].filter(Boolean).join(' · ')}</div></div>
   <div class="seg">${[['hay','Hay'],['poco','Poco'],['nohay','No hay']].map(([k,n])=>`<button class="${st===k?'on '+k:''}" data-a="setInv" data-id="${p.id}" data-k="${k}">${n}</button>`).join('')}</div></div>`;
}

/* ================= PRECIOS ================= */
VIEWS.precios = function(){
  let ps = products().map(p=>{ const o = obsFor(p.id); return {p, o, last:o[o.length-1], prev:o[o.length-2]}; }).filter(x=>x.o.length);
  if(UI.priceQ) ps = ps.filter(x=>norm(x.p.name).includes(norm(UI.priceQ)));
  ps.sort((a,b)=>(b.last.observedAt||'').localeCompare(a.last.observedAt||''));
  let h = `${pageHead('Precios')}<p class="sub" style="margin-top:-6px">Lo que realmente pagan o ven, normalizado por kg, litro o unidad.</p>
    <div class="grid2" style="margin-bottom:10px"><button class="btn acc" data-a="priceMenu"><i data-i=tag></i> Registrar precio</button><button class="btn sec" data-a="monthCompare">Comparar meses</button></div>
    <input class="i" placeholder="Buscar producto…" enterkeyhint="search" value="${esc(UI.priceQ)}" data-in="priceQ" style="margin-bottom:8px">`;
  const pendingObs = Object.entries(S.prices).filter(([id,o])=>o.status==='provisional');
  if(pendingObs.length) h += `<div class="note warn">${pendingObs.length} precio(s) provisional(es) sin asignar a un producto. <a href="#" data-a="provisionals">Revisar</a></div>`;
  if(!ps.length) return h + `<div class="card empty"><div class="ic"><i data-i=tag></i></div><b>Aún no hay precios</b><div class="sub">Se llenan solos al cerrar compras, o regístralos a mano o con foto de la etiqueta.</div></div>`;
  h += `<div class="list">` + ps.map(({p,o,last,prev})=>{
    let tr = ''; if(prev && last.np && prev.np){ const d = (last.np-prev.np)/prev.np*100; tr = Math.abs(d)<=1 ? '<span class="flat">＝</span>' : d>0 ? `<span class="up"><i data-i=arrow-up></i> ${pct(d)}</span>` : `<span class="down"><i data-i=arrow-down></i> ${pct(d)}</span>`; }
    return `<div class="item tap" data-a="productPrices" data-id="${p.id}">${catTile(p.cat)}<div class="grow"><div class="name">${esc(p.name)}</div><div class="tiny">${esc(storeName(last.storeId))} · ${fmtDate(last.observedAt)} · ${o.length} registro${o.length>1?'s':''}</div></div><div class="right"><div class="money">${last.np?cop(last.np)+'<span class="tiny">'+normLabel(p.dim)+'</span>':cop(last.priceCop)}</div><div class="tiny">${tr}</div></div></div>`;
  }).join('') + `</div>`;
  return h;
};

/* ================= COMPRAS ================= */
VIEWS.compras = function(){
  const all = purchases(); const months = [...new Set(all.map(p=>monthOf(p.date)))];
  let h = `${pageHead('Compras')}<div class="grid2" style="margin-bottom:10px"><button class="btn" data-a="newPurchase"><i data-i=plus></i> Nueva compra</button><button class="btn sec" data-a="quickPurchase"><i data-i=bolt></i> Compra rápida</button></div><button class="btn ghost full" data-a="photo" data-k="recibo" style="margin-bottom:10px"><i data-i=camera></i> Desde foto de recibo</button>`;
  if(!all.length) return h + `<div class="card empty"><div class="ic"><i data-i=receipt></i></div><b>Sin compras registradas</b><div class="sub">Cierra una compra desde la lista, regístrala a mano o desde la foto del recibo.</div></div>`;
  months.forEach(m=>{ const ps = all.filter(p=>monthOf(p.date)===m);
    h += `<div class="cathead row between"><span>${monthName(m)}</span><span class="money">${cop(sum(ps.map(purchaseTotal)))}</span></div><div class="list">` + ps.map(p=>{
      const diff = p.totalPaid!=null && (p.items||[]).length ? p.totalPaid - itemsTotal(p) - (p.extras||0) : 0;
      return `<div class="item tap" data-a="purchase" data-id="${p.id}"><div class="grow"><div class="name">${esc(storeName(p.storeId))} ${p.source==='foto_recibo'?'<span class="chip blue"><i data-i=camera></i></span>':''}${p.quick?'<span class="chip grey">rápida</span>':''}</div><div class="tiny">${fmtDate(p.date)} · ${(p.items||[]).length} productos${p.method?' · '+esc(PAY[p.method]||''):''}${Math.abs(diff)>100?' · <span style="color:var(--warn)">diferencia '+cop(diff)+'</span>':''}</div></div><div class="money">${cop(purchaseTotal(p))}</div></div>`; }).join('') + `</div>`; });
  return h;
};

/* ================= REPORTES ================= */
VIEWS.reportes = function(){
  const mk = UI.repMonth, pm = monthShift(mk,-1);
  const ps = purchases().filter(p=>monthOf(p.date)===mk); const pps = purchases().filter(p=>monthOf(p.date)===pm);
  const spent = sum(ps.map(purchaseTotal)), pspent = sum(pps.map(purchaseTotal)); const bud = S.settings.budget||0;
  const monthsWithData = new Set(purchases().map(p=>monthOf(p.date))).size;
  let h = `${pageHead('Reportes')}<div class="row between card" style="padding:8px"><button class="x" data-a="repMonth" data-d="-1" aria-label="Mes anterior">${I('chevron-left')}</button><b style="text-transform:capitalize">${monthName(mk)}</b><button class="x" data-a="repMonth" data-d="1" aria-label="Mes siguiente">${I('chevron-right')}</button></div>`;
  if(monthsWithData<2) h += `<div class="note info"><i data-i=chart></i> Su historial está en construcción. Con al menos dos meses de compras aparecen las comparaciones entre meses (llevan ${monthsWithData}).</div>`;
  h += `<div class="grid2"><div class="card"><div class="sub">Gastado</div><div class="big money">${cop(spent)}</div>${pspent?`<div class="tiny">${spent>pspent?'<span class="up"><i data-i=arrow-up></i>':'<span class="down"><i data-i=arrow-down></i>'} ${cop(Math.abs(spent-pspent))}</span> vs ${MONTHS[+pm.slice(5)-1]}</div>`:''}</div>
    <div class="card"><div class="sub">Presupuesto</div><div class="big money">${bud?cop(bud):'—'}</div>${bud?`<div class="tiny">${spent<=bud?'<span class="down">Quedan '+cop(bud-spent)+'</span>':'<span class="up">Excedido '+cop(spent-bud)+'</span>'}</div>`:'<div class="tiny"><a href="#ajustes">Definir</a></div>'}</div></div>`;
  if(mk===monthOf(todayStr()) && new Date().getDate()>=7 && spent){ const d = new Date(); const dim = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); const proj = spent/d.getDate()*dim;
    h += `<div class="note ${bud && proj>bud?'warn':'info'}">Proyección (si siguen al mismo ritmo): <b>${cop(proj)}</b> al final del mes${bud&&proj>bud?' — superaría el presupuesto':''}.</div>`; }
  h += `<div class="card"><div class="row between"><span>Compras</span><b>${ps.length}</b></div><div class="row between"><span>Promedio por compra</span><b class="money">${ps.length?cop(spent/ps.length):'—'}</b></div></div>`;
  // por categoría
  const bc = spendByCat(mk); const bcPrev = spendByCat(pm); const cats = Object.entries(bc).sort((a,b)=>b[1]-a[1]); const mx = Math.max(1,...cats.map(c=>c[1]));
  if(cats.length){ h += `<h2>Por categoría</h2><div class="card">` + cats.map(([c,v])=>{ const name = c==='_sin' ? 'Sin detalle' : (CAT[c]?.name||c); const bcat = (S.settings.budgetCat||{})[c]; const pv = bcPrev[c];
      return `<div class="hbar"><span>${c==='_sin'?'<i data-i=info></i>':CAT[c]?.ic||''} ${esc(name)}</span><div class="t"><div style="width:${v/mx*100}%;${bcat&&v>bcat?'background:var(--bad)':''}"></div></div><span class="money">${cop(v)}</span></div>${bcat?`<div class="tiny" style="margin:-4px 0 6px 118px">Presupuesto ${cop(bcat)}${v>bcat?' · <span class="up">excedido</span>':''}</div>`:''}${pv?`<div class="tiny" style="margin:-4px 0 6px 118px">Mes anterior ${cop(pv)}</div>`:''}`; }).join('') + `<div class="tiny">“Sin detalle”: compras rápidas o diferencias frente al total del recibo.</div></div>`; }
  // por tienda
  const bs = {}; ps.forEach(p=>{ bs[p.storeId||''] = (bs[p.storeId||'']||0) + purchaseTotal(p); }); const st = Object.entries(bs).sort((a,b)=>b[1]-a[1]);
  if(st.length){ const m2 = Math.max(1,...st.map(s=>s[1])); h += `<h2>Por tienda</h2><div class="card">` + st.map(([s,v])=>`<div class="hbar"><span>${esc(storeName(s))}</span><div class="t"><div style="width:${v/m2*100}%"></div></div><span class="money">${cop(v)}</span></div>`).join('') + `</div>`; }
  // productos más comprados
  const freq = {}; ps.forEach(p=>(p.items||[]).forEach(i=>{ freq[i.productId] = freq[i.productId]||{n:0,v:0}; freq[i.productId].n++; freq[i.productId].v += (i.total||0)-(i.discount||0); }));
  const top = Object.entries(freq).filter(([id])=>prod(id)).sort((a,b)=>b[1].v-a[1].v).slice(0,8);
  if(top.length) h += `<h2>Donde más se fue la plata</h2><div class="list">` + top.map(([id,x])=>`<div class="item tap" data-a="productPrices" data-id="${id}"><div class="grow"><div class="name">${esc(prod(id).name)}</div><div class="tiny">${x.n} ${x.n===1?'compra':'compras'}</div></div><div class="money">${cop(x.v)}</div></div>`).join('') + `</div>`;
  // cambios de precio
  const changes = products().map(p=>({p, r:compareMonths(p.id, pm, mk)})).filter(x=>x.r && x.r.status!=='insuficiente');
  h += `<h2>Cambios de precio vs ${monthName(pm)}</h2>`;
  if(!changes.length) h += `<div class="card sub">Información insuficiente: se necesitan precios del mismo producto en ambos meses.</div>`;
  else { changes.sort((a,b)=>b.r.pct-a.r.pct); h += `<div class="list">` + changes.map(({p,r})=>`<div class="item tap" data-a="productPrices" data-id="${p.id}"><div class="grow"><div class="name">${esc(p.name)}</div><div class="tiny">${cop(r.p1)} → ${cop(r.p2)}${normLabel(p.dim)} · ${r.n1}+${r.n2} registros${r.notes.length?' · '+esc(r.notes.join(', ')):''}</div></div>${trendBadge(r)}</div>`).join('') + `</div>`; }
  // dejaron de comprar
  const prevIds = new Set(); pps.forEach(p=>(p.items||[]).forEach(i=>prevIds.add(i.productId))); const curIds = new Set(); ps.forEach(p=>(p.items||[]).forEach(i=>curIds.add(i.productId)));
  const gone = [...prevIds].filter(id=>!curIds.has(id) && prod(id));
  if(gone.length && ps.length && mk<monthOf(todayStr())) h += `<h2>Comprados en ${MONTHS[+pm.slice(5)-1]}, no en este mes</h2><div class="card sub">${gone.map(id=>esc(prod(id).name)).join(' · ')}</div>`;
  h += `<button class="btn ghost full" data-a="exportMenu" style="margin-top:12px">Exportar datos (CSV / JSON)</button>`;
  return h;
};

/* ================= AJUSTES ================= */
VIEWS.ajustes = function(){
  const s = S.settings; const custom = Object.entries(S.stores);
  let h = `${pageHead('Ajustes')}
  <div class="card"><h3>Hogar y presupuesto</h3>
    <label class="f">Nombre del hogar</label><input class="i" id="setName" value="${esc(s.householdName)}">
    <label class="f">Presupuesto mensual (COP)</label><input class="i" id="setBudget" inputmode="numeric" value="${s.budget?fnum(s.budget):''}" placeholder="$ 1.200.000">
    <details style="margin-top:10px"><summary class="sub" style="cursor:pointer;min-height:40px">Presupuesto por categoría (opcional)</summary>
      ${CATS.map(c=>`<div class="row" style="margin:6px 0"><span class="grow">${c.ic} ${c.name}</span><input class="i" style="max-width:150px" inputmode="numeric" data-bcat="${c.id}" value="${(s.budgetCat||{})[c.id]?fnum(s.budgetCat[c.id]):''}"></div>`).join('')}
    </details>
    <button class="btn full" data-a="saveSettings" style="margin-top:12px">Guardar</button></div>
  <div class="card"><h3>Unidades locales</h3><p class="sub">Equivalencias usadas en plaza. Verifíquenlas: no hay una norma única.</p>
    <div class="grid2"><div><label class="f">1 libra = gramos</label><input class="i" id="setLibra" inputmode="numeric" value="${s.libraG}"></div><div><label class="f">1 cubeta = huevos</label><input class="i" id="setCubeta" inputmode="numeric" value="${s.cubeta}"></div></div>
    <div class="tiny" style="margin-top:6px">Arroba = 25 libras (${fnum(s.libraG*25/1000)} kg). Libra internacional = 453,6 g.</div>
    <button class="btn sec full" data-a="saveUnits" style="margin-top:10px">Guardar unidades</button></div>
  <div class="card"><h3>Tiendas</h3><div class="tiny">Toca para ocultar o mostrar en los selectores.</div><div class="row wrap" style="margin:8px 0">${allStores(true).map(st=>{ const hid = (s.hiddenStores||[]).includes(st.id); return `<button class="chip ${hid?'grey':''}" style="border:0;min-height:36px" data-a="toggleStore" data-id="${st.id}">${hid?'<i data-i=close></i> ':''}${esc(st.name)}</button>`; }).join('')}</div>
    <button class="btn sec full" data-a="newStore"><i data-i=plus></i> Agregar tienda (con ciudad o sede)</button></div>
  <div class="card"><h3>Catálogo</h3><p class="sub">${products().length} productos activos · ${products(true).length-products().length} archivados.</p><div class="row wrap"><button class="btn sec" data-a="catalog">Ver y editar catálogo</button><button class="btn ghost" data-a="starter">Agregar básicos</button></div></div>
  <div class="card"><h3>Compartir con mi pareja</h3>${RT.standalone?`<p class="sub">En esta versión los datos se guardan <b>en este dispositivo</b> y funcionan sin internet. Todavía no se sincronizan entre celulares: para pasar datos de uno a otro, usa <b>Exportar → Respaldo completo</b> e <b>Importar respaldo</b> en el otro. Exporta un respaldo de vez en cuando.</p>`:`<p class="sub">Los datos viven en esta app y se sincronizan entre quienes tengan acceso. Para que tu pareja pueda <b>ver y editar</b>, ábrela en claude.ai, toca <b>Compartir</b> e invítala por correo con permiso de edición. Ambos verán la misma lista, despensa, compras y precios.</p>`}<div>${statusHTML()}</div></div>
  <div class="card"><h3>Datos</h3><div class="row wrap"><button class="btn sec" data-a="exportMenu">Exportar</button><button class="btn ghost" data-a="importData">Importar respaldo</button></div>
    <div class="row wrap" style="margin-top:8px"><button class="btn ghost" data-a="loadDemo">Cargar datos de ejemplo</button>${Object.values(S.products).some(p=>p.demo)?'<button class="btn danger" data-a="clearDemo">Borrar datos de ejemplo</button>':''}</div>
    <button class="btn danger full" data-a="wipeAll" style="margin-top:8px">Borrar todos los datos del hogar</button></div>
  <div class="card"><h3>Privacidad y fotos</h3><p class="sub">Las fotos de etiquetas y recibos se envían a Claude (Anthropic) solo para leer los datos, usando la cuenta de quien toma la foto. La app <b>no guarda la imagen</b>: guarda únicamente los datos que ustedes confirman y la lectura original para trazabilidad. Los recibos pueden traer nombre y cédula; si prefieren, recorten esa parte antes de tomar la foto. Pueden exportar o borrar todos los datos cuando quieran (Ley 1581 de 2012).</p></div>
  <div class="tiny" style="text-align:center;margin:16px 0">Stocka · antes Mercado en Casa</div>`;
  return h;
};
