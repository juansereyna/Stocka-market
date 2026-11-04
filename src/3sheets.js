/* ================= HOJAS (MODALES) ================= */
let SHEET_ON_CLOSE = null;
const NAV_SHEETS = new Set(['quickActions','priceMenu','manualPrice','photoGal','quickPurchase','newPurchase','addItem','quickReview','catalog','editProduct','newProduct','productPrices','purchase','editPurchase','provisionals','assignProv','monthCompare','starter','exportMenu','newStore','pickShopStore','editItem','cartItem','closePurchase']);
const SHEETS = {stack:[], cur:null};
const sheetIsOpen = () => $('#sheetwrap').classList.contains('open');
function openSheet(title, body, onClose){
  const ctx = RT.actCtx; let canBack = false;
  if(ctx && ctx.replay){ SHEETS.cur = {a:ctx.a, ds:ctx.ds}; canBack = SHEETS.stack.length>0; }
  else if(ctx && NAV_SHEETS.has(ctx.a)){
    if(ctx.inSheet && sheetIsOpen() && SHEETS.cur && SHEETS.cur.a!==ctx.a) SHEETS.stack.push(SHEETS.cur);
    else if(!ctx.inSheet) SHEETS.stack = [];
    SHEETS.cur = {a:ctx.a, ds:ctx.ds}; canBack = SHEETS.stack.length>0;
  } else if(ctx && ctx.inSheet && sheetIsOpen()){ canBack = SHEETS.stack.length>0; }
  else { SHEETS.stack = []; SHEETS.cur = null; }
  const wasOpen = sheetIsOpen();
  $('#sheet').innerHTML = `<div class="grab"></div><div class="sheethead">${canBack?`<button class="x" data-a="sheetBack" aria-label="Volver">${I('chevron-left')}</button>`:''}<h2 class="grow">${title}</h2><button class="x" data-a="closeSheet" aria-label="Cerrar">${I('close')}</button></div>${body}`;
  $('#sheetwrap').classList.add('open'); document.body.style.overflow='hidden'; SHEET_ON_CLOSE = onClose||null; $('#sheet').scrollTop = 0;
  if(!wasOpen){ try{ if(!(history.state && history.state.stockaSheet)) history.pushState({stockaSheet:1}, ''); }catch(e){} }
}
function closeSheet(noHistory){
  if(!sheetIsOpen()) return;
  $('#sheetwrap').classList.remove('open'); $('#sheet').innerHTML=''; document.body.style.overflow=''; SHEETS.stack=[]; SHEETS.cur=null;
  const f = SHEET_ON_CLOSE; SHEET_ON_CLOSE=null; if(f) f(); scheduleRender();
  if(noHistory!==true) setTimeout(()=>{ try{ if(!sheetIsOpen() && history.state && history.state.stockaSheet) history.back(); }catch(e){} }, 60);
}
// botón/gesto "atrás" del sistema: primero retrocede entre hojas, luego cierra la hoja
window.addEventListener('popstate', ()=>{ if(!sheetIsOpen()) return; if(SHEETS.stack.length){ ACT.sheetBack(); try{ history.pushState({stockaSheet:1}, ''); }catch(e){} } else closeSheet(true); });
$('#sheetwrap').addEventListener('click', e=>{ if(e.target.id==='sheetwrap') closeSheet(); });
// deslizar hacia abajo desde el encabezado para cerrar
(()=>{ let y0 = null, dy = 0; const sh = $('#sheet');
  sh.addEventListener('touchstart', e=>{ if(e.target.closest('.grab,.sheethead') && !e.target.closest('button')){ y0 = e.touches[0].clientY; dy = 0; } }, {passive:true});
  sh.addEventListener('touchmove', e=>{ if(y0==null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)`; }, {passive:true});
  sh.addEventListener('touchend', ()=>{ if(y0==null) return; sh.style.transform=''; if(dy>90) closeSheet(); y0 = null; });
})();
function buzz(ms){ try{ navigator.vibrate && navigator.vibrate(ms||12); }catch(e){} }
let wakeLock = null;
async function keepAwake(on){ try{ if(on && navigator.wakeLock && !wakeLock){ wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', ()=>{ wakeLock=null; }); } else if(!on && wakeLock){ await wakeLock.release(); wakeLock=null; } }catch(e){} }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible' && UI.shopMode) keepAwake(true); });
function confirmSheet(title, msg, okLabel, onOk, danger){
  openSheet(title, `<p>${msg}</p><div class="grid2"><button class="btn ghost" data-a="closeSheet">Cancelar</button><button class="btn ${danger?'danger':''}" id="cfOk">${okLabel}</button></div>`);
  $('#cfOk').onclick = ()=>{ closeSheet(); onOk(); };
}
const val = id => { const e = document.getElementById(id); return e ? e.value : ''; };

/* ================= SELECTOR DE PRODUCTO ================= */
const PICKERS = {};
function pickerHTML(pid, ph, onPick){ PICKERS[pid] = onPick; return `<div><input class="i" data-pick="${pid}" placeholder="${esc(ph||'Buscar o crear producto…')}" autocomplete="off"><div class="results" id="res-${pid}" hidden></div></div>`; }
function pickerSearch(pid, q){
  const box = document.getElementById('res-'+pid); if(!box) return;
  if(!q.trim()){ box.hidden = true; return; }
  const m = matchProducts(q, 7);
  box.innerHTML = m.map(p=>`<button data-a="pickRes" data-pid="${pid}" data-id="${p.id}"><span>${CAT[p.cat]?.ic||'<i data-i=cat-otros></i>'}</span><span class="grow">${esc(p.name)}</span><span class="tiny">${DIMS[p.dim].name}</span></button>`).join('') +
    `<button class="new" data-a="pickNew" data-pid="${pid}" data-q="${esc(q)}"><i data-i=plus></i> Crear “${esc(q)}”</button>`;
  box.hidden = false;
}
function newProductFormHTML(prefix, name, cat, dim){
  return `<label class="f">Nombre</label><input class="i" id="${prefix}Name" value="${esc(name||'')}">
   <div class="grid2"><div><label class="f">Categoría</label><select class="i" id="${prefix}Cat">${CATS.map(c=>`<option value="${c.id}" ${c.id===(cat||'despensa')?'selected':''}>${c.ic} ${c.name}</option>`).join('')}</select></div>
   <div><label class="f">Se mide por</label><select class="i" id="${prefix}Dim">${Object.entries(DIMS).map(([k,d])=>`<option value="${k}" ${k===(dim||'conteo')?'selected':''}>${d.name} (${d.norm})</option>`).join('')}</select></div></div>`;
}
function createProduct(name, cat, dim, extra){
  name = String(name||'').trim(); if(!name){ toast('Escribe un nombre'); return null; }
  const id = uid(); put('products', id, Object.assign({name, cat:cat||'otros', dim:dim||'conteo', inv:'hay'}, extra||{})); return id;
}

/* ================= PRODUCTOS ================= */
function productSheet(id){
  const p = id ? prod(id) : null;
  openSheet(p ? 'Editar producto' : 'Nuevo producto', `
    ${newProductFormHTML('pp', p?.name, p?.cat, p?.dim)}
    <div id="ppDup"></div>
    <div class="grid2"><div><label class="f">Cantidad habitual</label><input class="i" id="ppQty" inputmode="decimal" value="${p?.usualQty!=null?fnum(p.usualQty):''}"></div>
    <div><label class="f">Unidad</label><select class="i" id="ppUnit"></select></div></div>
    <div class="grid2"><div><label class="f">Ubicación</label><select class="i" id="ppLoc"><option value="">—</option>${Object.entries(LOCS).map(([k,n])=>`<option value="${k}" ${p?.loc===k?'selected':''}>${n}</option>`).join('')}</select></div>
    <div><label class="f">Vence (opcional)</label><input class="i" type="date" id="ppExp" value="${esc(p?.expiry||'')}"></div></div>
    <label class="f">Marca o presentación preferida</label><input class="i" id="ppPref" value="${esc(p?.pref||'')}" placeholder="Ej. Alquería bolsa 1.100 ml">
    <label class="f">Notas</label><input class="i" id="ppNote" value="${esc(p?.note||'')}" placeholder="Ej. comprar solo en promoción">
    <div class="stickybar grid2">${p?`<button class="btn danger" data-a="archiveProduct" data-id="${id}">${p.archived?'Restaurar':'Archivar'}</button>`:'<button class="btn ghost" data-a="closeSheet">Cancelar</button>'}<button class="btn" data-a="saveProduct" data-id="${id||''}">Guardar</button></div>`);
  const fillUnits = ()=>{ const d = val('ppDim'); $('#ppUnit').innerHTML = unitsFor(d).map(([k,n])=>`<option value="${k}" ${(p?.usualUnit||defaultUnit(d))===k?'selected':''}>${n}</option>`).join(''); };
  fillUnits(); $('#ppDim').onchange = fillUnits;
  $('#ppName').oninput = ()=>{ const d = findDuplicate(val('ppName')); $('#ppDup').innerHTML = d && d.id!==id ? `<div class="note warn">Ya existe “${esc(d.name)}”. ¿Es el mismo? Mejor edita ese.</div>` : ''; };
}
const ACT = {};
ACT.sheetBack = ()=>{ const prev = SHEETS.stack.pop(); if(!prev || !ACT[prev.a]) return closeSheet(); const keep = RT.actCtx; RT.actCtx = {a:prev.a, ds:prev.ds, replay:true}; try{ ACT[prev.a]({dataset:prev.ds, tagName:'BUTTON', remove(){}}, {stopPropagation(){}, preventDefault(){}}); } finally { RT.actCtx = keep; } };
ACT.back = el=>go(el.dataset.r);
ACT.newProduct = ()=>productSheet(null);
ACT.editProduct = el=>productSheet(el.dataset.id);
ACT.saveProduct = el=>{
  const id = el.dataset.id; const name = val('ppName').trim(); if(!name) return toast('Escribe un nombre');
  const dup = findDuplicate(name); if(!id && dup) return toast('Ya existe ese producto');
  const f = {name, cat:val('ppCat'), dim:val('ppDim'), usualQty:parseQty(val('ppQty')), usualUnit:val('ppUnit'), loc:val('ppLoc')||null, expiry:val('ppExp')||null, pref:val('ppPref').trim()||null, note:val('ppNote').trim()||null};
  if(id){ patch('products', id, f); } else createProduct(name, f.cat, f.dim, f);
  closeSheet(); toast('Producto guardado');
};
ACT.archiveProduct = el=>{ const p = prod(el.dataset.id); patch('products', p.id, {archived:!p.archived}); closeSheet(); toast(p.archived?'Restaurado':'Archivado (el historial se conserva)'); };
ACT.starter = ()=>{
  const have = new Set(products(true).map(p=>norm(p.name)));
  const opts = STARTER.filter(s=>!have.has(norm(s[0])));
  if(!opts.length) return toast('Ya tienen todos los básicos');
  openSheet('Productos básicos', `<p class="sub">Marca los que suelen comprar. Luego puedes editarlos.</p>
    ${CATS.map(c=>{ const arr = opts.filter(s=>s[1]===c.id); if(!arr.length) return ''; return `<div class="cathead">${c.ic} ${c.name}</div><div class="list">${arr.map(s=>`<label class="item" style="cursor:pointer"><input type="checkbox" data-starter="${esc(s[0])}" checked style="width:24px;height:24px"><span class="grow">${esc(s[0])}</span><span class="tiny">${DIMS[s[2]].name}</span></label>`).join('')}</div>`; }).join('')}
    <div class="stickybar"><button class="btn full" data-a="saveStarter">Agregar seleccionados</button></div>`);
};
ACT.saveStarter = ()=>{
  const sel = [...document.querySelectorAll('[data-starter]')].filter(x=>x.checked).map(x=>x.dataset.starter);
  STARTER.filter(s=>sel.includes(s[0])).forEach(s=>createProduct(s[0], s[1], s[2], {usualQty: s[4]==='kg'?s[3]:s[3], usualUnit:s[4]}));
  closeSheet(); toast(`${sel.length} productos agregados`);
};
ACT.catalog = ()=>{
  const all = products(true);
  openSheet('Catálogo', `<div class="list">${all.map(p=>`<div class="item tap" data-a="editProduct" data-id="${p.id}">${catTile(p.cat)}<div class="grow"><div class="name ${p.archived?'muted':''}">${esc(p.name)}</div><div class="tiny">${esc(CAT[p.cat]?.name||'')} · ${DIMS[p.dim].name}${p.archived?' · archivado':''}${(p.aliases||[]).length?' · '+p.aliases.length+' alias de recibo':''}</div></div><span>›</span></div>`).join('') || '<div class="empty">Sin productos</div>'}</div><button class="btn full" data-a="newProduct"><i data-i=plus></i> Nuevo producto</button>`);
};

/* ================= INVENTARIO ================= */
ACT.setInv = el=>{ const id = el.dataset.id, k = el.dataset.k; const p = prod(id); if(!p) return; buzz();
  patch('products', id, {inv:k, invAt:nowISO()});
  if((k==='poco'||k==='nohay') && !Object.values(S.list).some(i=>i.productId===id)){
    showUndoToast(`${p.name}: ${k==='poco'?'Poco':'No hay'}`, '<i data-i=plus></i> A la lista', ()=>addListItem(id)); }
};
function showUndoToast(msg, label, fn){ const t = document.createElement('div'); t.className='toast row'; t.innerHTML = `<span>${esc(msg)}</span><button class="btn sm" style="background:#fff;color:var(--ink)">${label}</button>`; t.querySelector('button').onclick=()=>{ fn(); t.remove(); toast('Agregado a la lista'); }; document.body.appendChild(t); setTimeout(()=>t.remove(), 4500); }
ACT.invFilter = el=>{ UI.invFilter = el.dataset.k; render(); };
ACT.quickReview = ()=>{
  const ps = products().sort((a,b)=>buyHistory(b.id).length - buyHistory(a.id).length || a.name.localeCompare(b.name,'es'));
  if(!ps.length) return toast('Primero agrega productos');
  let i = 0;
  const step = ()=>{
    if(i>=ps.length){ closeSheet(); toast('Despensa revisada'); return; }
    const p = prod(ps[i].id);
    openSheet('Revisión rápida', `<div class="tiny" style="text-align:center">${i+1} de ${ps.length}</div><div class="qcard">${catTile(p.cat,"pine")}<div class="nm">${esc(p.name)}</div>
      <div class="qbtns"><button style="background:var(--green);color:#fff" data-q="hay">Hay</button><button style="background:var(--warn);color:#fff" data-q="poco">Poco</button><button style="background:var(--bad);color:#fff" data-q="nohay">No hay</button></div></div>
      <div class="grid2" style="margin-top:12px"><button class="btn ghost" id="qrSkip">Saltar</button><button class="btn sec" id="qrEnd">Terminar</button></div>`);
    document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{ patch('products', p.id, {inv:b.dataset.q, invAt:nowISO()}); i++; step(); });
    $('#qrSkip').onclick = ()=>{ i++; step(); }; $('#qrEnd').onclick = ()=>{ closeSheet(); };
  };
  step();
};

/* ================= LISTA ================= */
function addListItem(productId, qty, unit, prio, note){
  const p = prod(productId); if(!p) return;
  const ex = Object.entries(S.list).find(([id,i])=>i.productId===productId);
  if(ex) return ex[0];
  const id = uid(); put('list', id, {productId, qty: qty ?? p.usualQty ?? null, unit: unit || p.usualUnit || defaultUnit(p.dim), prio: prio||'necesario', note: note||null, status:'pendiente'}); return id;
}
ACT.addToList = el=>{ addListItem(el.dataset.id); toast('Agregado a la lista'); };
ACT.addAllSug = ()=>{ const s = suggestions().filter(x=>!x.stale); s.forEach(x=>addListItem(x.p.id)); toast(`${s.length} agregados`); };
ACT.snooze = el=>{ const d = new Date(); d.setDate(d.getDate() + (+el.dataset.d)); const sn = Object.assign({}, S.settings.snooze||{}, {[el.dataset.id]: d.toISOString().slice(0,10)}); saveSettings({snooze:sn}); toast('Listo, no lo sugerimos por ahora'); };
ACT.addMissing = ()=>{ const m = products().filter(p=>(p.inv==='poco'||p.inv==='nohay')); m.forEach(p=>addListItem(p.id, null, null, p.inv==='nohay'?'urgente':'necesario')); toast('Faltantes en la lista'); };
ACT.repeatLast = ()=>{ const l = purchases().find(p=>(p.items||[]).length); if(!l) return toast('No hay compras con productos'); l.items.forEach(i=>{ if(prod(i.productId)) addListItem(i.productId, i.qty, i.unit); }); toast('Productos de la última compra agregados'); };
ACT.addItem = ()=>{
  openSheet('Agregar a la lista', `${pickerHTML('li','Buscar o crear producto…', pid=>{ closeSheet(); listItemSheet(null, pid); })}
    <div class="tiny" style="margin-top:8px">Sugerencias rápidas</div><div class="row wrap" style="margin-top:6px">${suggestions().slice(0,8).map(s=>`<button class="chip" style="border:0;min-height:40px" data-a="quickAdd" data-id="${s.p.id}"><i data-i=plus></i> ${esc(s.p.name)}</button>`).join('') || '<span class="tiny">—</span>'}</div>`);
  setTimeout(()=>{ const i = document.querySelector('[data-pick="li"]'); i && i.focus(); }, 60);
};
ACT.quickAdd = el=>{ addListItem(el.dataset.id); el.remove(); toast('Agregado'); };
function listItemSheet(itemId, productId){
  const it = itemId ? S.list[itemId] : null; const p = prod(productId || it.productId); if(!p) return;
  const lp = lastPaidUnit(p.id);
  openSheet(esc(p.name), `
    ${p.pref?`<div class="note info">Preferida: ${esc(p.pref)}</div>`:''}${p.note?`<div class="note warn">${esc(p.note)}</div>`:''}
    ${lp?`<div class="sub">Último precio: <b>${cop(lp.price)}</b> por ${fmtBase(lp.qtyBase,p.dim)} en ${esc(storeName(lp.storeId))} (${fmtDate(lp.date)})${lp.np?` · ${cop(lp.np)}${normLabel(p.dim)}`:''}</div>`:'<div class="sub">Sin precios registrados todavía.</div>'}
    <div class="grid2"><div><label class="f">Cantidad</label><input class="i" id="liQty" inputmode="decimal" value="${(it?.qty ?? p.usualQty) != null ? fnum(it?.qty ?? p.usualQty) : ''}"></div>
    <div><label class="f">Unidad</label><select class="i" id="liUnit">${unitsFor(p.dim).map(([k,n])=>`<option value="${k}" ${(it?.unit||p.usualUnit||defaultUnit(p.dim))===k?'selected':''}>${n}</option>`).join('')}</select></div></div>
    <label class="f">Prioridad</label><div class="chips" id="liPrio">${['urgente','necesario','opcional'].map(k=>`<button data-prio="${k}" class="${(it?.prio||'necesario')===k?'on':''}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>
    <label class="f">Nota</label><input class="i" id="liNote" value="${esc(it?.note||'')}" placeholder="Ej. la de bolsa, si está en promo">
    <div class="stickybar grid2">${it?`<button class="btn danger" data-a="delItem" data-id="${itemId}">Quitar</button>`:'<button class="btn ghost" data-a="closeSheet">Cancelar</button>'}<button class="btn" id="liSave">${it?'Guardar':'Agregar'}</button></div>`);
  let prio = it?.prio||'necesario';
  document.querySelectorAll('[data-prio]').forEach(b=>b.onclick=()=>{ prio=b.dataset.prio; document.querySelectorAll('[data-prio]').forEach(x=>x.classList.toggle('on', x===b)); });
  $('#liSave').onclick = ()=>{ const f = {qty:parseQty(val('liQty')), unit:val('liUnit'), prio, note:val('liNote').trim()||null};
    if(it) patch('list', itemId, f); else { const ex = Object.entries(S.list).find(([i,x])=>x.productId===p.id); if(ex) patch('list', ex[0], f); else put('list', uid(), Object.assign({productId:p.id, status:'pendiente'}, f)); }
    closeSheet(); toast(it?'Guardado':'Agregado a la lista'); };
}
ACT.editItem = el=>listItemSheet(el.dataset.id);
ACT.delItem = el=>{ remove('list', el.dataset.id); closeSheet(); };
ACT.toggleShop = ()=>{ UI.shopMode = !UI.shopMode; keepAwake(UI.shopMode); if(UI.shopMode && !S.settings.shopStore) ACT.pickShopStore(); render(); };
ACT.pickShopStore = ()=>{
  openSheet('¿Dónde están comprando?', `<div class="list">${allStores().map(s=>`<div class="item tap" data-a="setShopStore" data-id="${s.id}"><div class="grow name">${esc(s.name)}</div>${S.settings.shopStore===s.id?'<i data-i=check></i>':''}</div>`).join('')}</div>`);
};
ACT.setShopStore = el=>{ saveSettings({shopStore:el.dataset.id}); closeSheet(); };
ACT.uncart = (el,e)=>{ e.stopPropagation(); patch('list', el.dataset.id, {status:'pendiente', realTotal:null}); };
ACT.cartItem = (el,e)=>{
  e.stopPropagation(); const id = el.dataset.id; const it = S.list[id]; const p = prod(it.productId); const lp = lastPaidUnit(p.id);
  if(!UI.shopMode){ buzz(); patch('list', id, {status:'carrito'}); return; }
  const unit = it.realUnit || it.unit || defaultUnit(p.dim); const qty = it.realQty ?? it.qty;
  let suggested = null; if(lp && lp.np && qty!=null) suggested = Math.round(lp.np * toBase(qty,unit) / DIMS[p.dim].mult);
  openSheet('<i data-i=cart></i> '+esc(p.name), `
    <div class="grid2"><div><label class="f">Cantidad real</label><input class="i" id="ciQty" inputmode="decimal" value="${qty!=null?fnum(qty):''}"></div>
    <div><label class="f">Unidad</label><select class="i" id="ciUnit">${unitsFor(p.dim).map(([k,n])=>`<option value="${k}" ${unit===k?'selected':''}>${n}</option>`).join('')}</select></div></div>
    <label class="f">Precio pagado por esa cantidad</label><input class="i" id="ciPrice" inputmode="numeric" value="${it.realTotal?fnum(it.realTotal):suggested?fnum(suggested):''}" placeholder="$">
    ${p.dim==='peso'?`<label class="f">…o precio por kg (calcula el total)</label><input class="i" id="ciKg" inputmode="numeric" placeholder="$ por kg">`:''}
    <div class="tiny" id="ciInfo" style="margin-top:6px">${lp?`Última vez: ${cop(lp.price)} por ${fmtBase(lp.qtyBase,p.dim)} (${esc(storeName(lp.storeId))})`:'Sin precio anterior.'}</div>
    <label class="f">Marca (opcional)</label><input class="i" id="ciBrand" value="${esc(it.brand||lp?.brand||'')}">
    <div class="stickybar grid2"><button class="btn ghost" id="ciNF">No lo encontré</button><button class="btn" id="ciOk">Al carrito</button></div>`);
  const kg = $('#ciKg'); if(kg) kg.oninput = ()=>{ const v = parseMoney(kg.value), q = toBase(parseQty(val('ciQty')), val('ciUnit')); if(v && q) $('#ciPrice').value = fnum(Math.round(v*q/1000)); };
  const info = ()=>{ const pr = parseMoney(val('ciPrice')), q = toBase(parseQty(val('ciQty')), val('ciUnit')); const np = normPrice(pr,q,p.dim); if(np) $('#ciInfo').innerHTML = `= ${cop(np)}${normLabel(p.dim)}` + (lp&&lp.np ? ` · antes ${cop(lp.np)}${normLabel(p.dim)} (${pct((np-lp.np)/lp.np*100)})` : ''); };
  $('#ciPrice').oninput = info; $('#ciQty').oninput = info; info();
  $('#ciOk').onclick = ()=>{ buzz(); patch('list', id, {status:'carrito', realQty:parseQty(val('ciQty')), realUnit:val('ciUnit'), realTotal:parseMoney(val('ciPrice')), brand:val('ciBrand').trim()||null, storeId:S.settings.shopStore||null}); closeSheet(); };
  $('#ciNF').onclick = ()=>{ patch('list', id, {note:'No encontrado'+(S.settings.shopStore?' en '+storeName(S.settings.shopStore):''), prio:it.prio}); closeSheet(); toast('Queda pendiente para la próxima'); };
};
ACT.closePurchase = ()=>{
  const cart = Object.entries(S.list).filter(([id,i])=>i.status==='carrito');
  PE = newPE({storeId:S.settings.shopStore||'', source:'compra', fromList:true,
    items: cart.map(([id,i])=>({key:uid(), productId:i.productId, qty:i.realQty ?? i.qty, unit:i.realUnit||i.unit, total:i.realTotal||null, brand:i.brand||null, listItemId:id}))});
  peSheet('Cerrar compra');
};

/* ================= EDITOR DE COMPRA ================= */
function parseContent(t){ const m = String(t||'').replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(kg|kilo|gr|g|ml|lt|l|cc)\b/i); if(!m) return null; const u = normUnitText(m[2].toLowerCase()==='l'?'litro':m[2]); return {qty:parseFloat(m[1]), unit:u}; }
function peFitUnit(it){ const p = prod(it.productId); if(!p) return; if(it.unit && guessDim(it.unit)===p.dim) return;
  const c = parseContent((it.desc||'')+' '+(it.text||'')); if(c && guessDim(c.unit)===p.dim){ if(it.arithQty==null) it.arithQty = it.qty||1; it.qty = c.qty * (it.qty||1); it.unit = c.unit; } else { if(p.dim!=='conteo') it.qty = null; it.unit = p.usualUnit && guessDim(p.usualUnit)===p.dim ? p.usualUnit : defaultUnit(p.dim); } }

let PE = null;
function newPE(o){ return Object.assign({id:null, storeId:'', date:todayStr(), items:[], extras:null, totalPaid:null, method:'', notes:'', source:'manual'}, o); }
function peLineHTML(it){
  const p = prod(it.productId); const dim = p ? p.dim : guessDim(it.unit);
  const flags = peFlags(it); const np = p ? normPrice((it.total||0)-(it.discount||0), toBase(it.qty, it.unit), p.dim) : null;
  const sugg = !p && it.text ? matchProducts(it.desc||it.text, 4) : [];
  return `<div class="line ${flags.length?'flag':''} ${it.skip?'off':''}" data-line="${it.key}">
    ${it.text?`<div class="row between"><span class="tiny">Recibo: <b>${esc(it.text)}</b>${it.conf==='baja'?' · <span style="color:var(--warn)">lectura dudosa</span>':''}</span><label class="tiny row" style="gap:4px"><input type="checkbox" data-pe="skip" data-k="${it.key}" ${it.skip?'checked':''}>Omitir</label></div>`:''}
    ${p ? `<div class="row between"><b>${CAT[p.cat]?.ic||''} ${esc(p.name)}</b><button class="btn sm ghost" data-a="peChange" data-k="${it.key}">Cambiar</button></div>`
        : `<div class="note warn" style="margin:6px 0">Asocia esta línea a un producto del catálogo.</div>${sugg.length?`<div class="row wrap" style="margin-bottom:6px">${sugg.map(s=>`<button class="chip" style="border:0;min-height:38px" data-a="peAssign" data-k="${it.key}" data-id="${s.id}">${esc(s.name)}</button>`).join('')}</div>`:''}${pickerHTML('pe_'+it.key, 'Buscar o crear…', pid=>{ it.productId = pid; peFitUnit(it); peRerender(); })}`}
    <div class="grid2" style="grid-template-columns:1fr 1fr 1.3fr;gap:6px;margin-top:6px">
      <input class="i ${flags.includes('qty')?'flag':''}" inputmode="decimal" placeholder="Cant." data-pe="qty" data-k="${it.key}" value="${it.qty!=null?fnum(it.qty):''}">
      <select class="i" data-pe="unit" data-k="${it.key}">${unitsFor(dim).map(([k,n])=>`<option value="${k}" ${it.unit===k?'selected':''}>${n}</option>`).join('')}</select>
      <input class="i ${flags.includes('total')?'flag':''}" inputmode="numeric" placeholder="Total $" data-pe="total" data-k="${it.key}" value="${it.total!=null?fnum(it.total):''}"></div>
    <div class="row between" style="margin-top:4px"><span class="tiny" id="np_${it.key}">${np?cop(np)+normLabel(dim):''}${it.discount?` · desc. ${cop(it.discount)}`:''}${it.unitPrice?` · p. unit. ${cop(it.unitPrice)}`:''}</span><button class="btn sm ghost" data-a="peDel" data-k="${it.key}">Quitar</button></div>
    ${flags.length?`<div class="tiny" style="color:var(--warn)"><i data-i=alert></i> ${esc(peFlagText(it, flags))}</div>`:''}
  </div>`;
}
function peFlags(it){ const f = []; if(it.skip) return f;
  if(it.qty==null || it.qty<=0) f.push('qty'); if(!it.total) f.push('total');
  const aq = it.arithQty ?? it.qty; if(it.unitPrice && aq && it.total){ const calc = it.unitPrice * aq; if(Math.abs(calc - it.total) > Math.max(100, it.total*0.01)) f.push('arit'); }
  if(it.total && (it.total<50 || it.total>2000000)) f.push('rango');
  const p = prod(it.productId); if(p && it.total && it.qty){ const np = normPrice(it.total-(it.discount||0), toBase(it.qty,it.unit), p.dim); const m = median(obsFor(p.id).map(o=>o.np).filter(Boolean)); if(np && m && Math.abs(np-m)/m>0.4) f.push('outlier'); }
  return f; }
function peFlagText(it, f){ const t = [];
  if(f.includes('qty')) t.push('falta la cantidad'); if(f.includes('total')) t.push('falta el total');
  if(f.includes('arit')) t.push(`cantidad × precio unitario (${cop(it.unitPrice*(it.arithQty ?? it.qty))}) no coincide con el total`);
  if(f.includes('rango')) t.push('precio fuera de lo normal'); if(f.includes('outlier')) t.push('se aleja más de 40% de lo que suelen pagar. ¿Es correcto?');
  return t.join(' · '); }
function peTotals(){
  const items = PE.items.filter(i=>!i.skip);
  const it = sum(items.map(i=>(i.total||0)-(i.discount||0))); const calc = it + (PE.extras||0) - (PE.globalDiscount||0);
  let h = `<div class="row between"><span>Suma de productos</span><b class="money">${cop(it)}</b></div>`;
  if(PE.extras) h += `<div class="row between"><span>Adicionales</span><b class="money">${cop(PE.extras)}</b></div>`;
  if(PE.globalDiscount) h += `<div class="row between"><span>Descuentos generales</span><b class="money">−${cop(PE.globalDiscount)}</b></div>`;
  if(PE.totalPaid!=null){ const d = PE.totalPaid - calc;
    h += `<div class="row between"><span>Total del recibo</span><b class="money">${cop(PE.totalPaid)}</b></div>`;
    if(Math.abs(d) > 1) h += `<div class="note warn">Diferencia de <b>${cop(d)}</b> entre la suma y el total del recibo. No se modifica ningún precio: se guardará como “ajuste / otros”. Revisa si falta algún producto o un descuento.</div>`;
    else h += `<div class="note ok"><i data-i=check></i> La suma cuadra con el total del recibo.</div>`; }
  return h;
}
function peSheet(title){
  PE._title = title || PE._title;
  openSheet(PE._title, `
    ${PE.photoUrl?`<details ${PE.items.length?'':'open'}><summary class="sub" style="min-height:40px;cursor:pointer">Ver foto</summary><img class="photo" src="${PE.photoUrl}"></details>`:''}
    ${PE.warnings&&PE.warnings.length?`<div class="note warn">${PE.warnings.map(esc).join('<br>')}</div>`:''}
    <div class="grid2"><div><label class="f">Tienda</label><select class="i ${PE.storeId?'':'flag'}" data-pe="storeId">${storeOptions(PE.storeId)}</select>${PE.storeText&&!PE.storeId?`<div class="tiny">Recibo dice: ${esc(PE.storeText)}</div>`:''}</div>
    <div><label class="f">Fecha</label><input class="i" type="date" data-pe="date" value="${esc(PE.date)}" max="${todayStr()}"></div></div>
    <h3 style="margin-top:14px">Productos (${PE.items.length})</h3>
    <div id="peLines">${PE.items.map(peLineHTML).join('')}</div>
    ${pickerHTML('peAdd','<i data-i=plus></i> Agregar producto…', pid=>{ const p = prod(pid); PE.items.push({key:uid(), productId:pid, qty:p.usualQty??null, unit:p.usualUnit||defaultUnit(p.dim), total:null}); peRerender(); })}
    <div class="grid2" style="margin-top:10px"><div><label class="f">Adicionales (domicilio, bolsas…)</label><input class="i" inputmode="numeric" data-pe="extras" value="${PE.extras?fnum(PE.extras):''}"></div>
    <div><label class="f">Total pagado (recibo)</label><input class="i" inputmode="numeric" data-pe="totalPaid" value="${PE.totalPaid!=null?fnum(PE.totalPaid):''}" placeholder="Opcional"></div></div>
    <div class="grid2"><div><label class="f">Pago</label><select class="i" data-pe="method"><option value="">—</option>${Object.entries(PAY).map(([k,n])=>`<option value="${k}" ${PE.method===k?'selected':''}>${n}</option>`).join('')}</select></div>
    <div><label class="f">Notas</label><input class="i" data-pe="notes" value="${esc(PE.notes||'')}"></div></div>
    <div class="card" style="margin-top:12px" id="peTotals">${peTotals()}</div>
    <div class="stickybar grid2"><button class="btn ghost" data-a="closeSheet">Cancelar</button><button class="btn acc" data-a="peSave">${PE.id?'Guardar corrección':'Confirmar compra'}</button></div>`,
    ()=>{ if(PE && PE.photoUrl){ try{ URL.revokeObjectURL(PE.photoUrl); }catch(e){} } });
}
function peRerender(){ const sc = $('#sheet').scrollTop; peSheet(); $('#sheet').scrollTop = sc; }
function peInput(el){
  const f = el.dataset.pe, k = el.dataset.k;
  if(k){ const it = PE.items.find(i=>i.key===k); if(!it) return;
    if(f==='qty') it.qty = parseQty(el.value); else if(f==='total') it.total = parseMoney(el.value); else if(f==='unit') it.unit = el.value; else if(f==='skip'){ it.skip = el.checked; return peRerender(); }
    const p = prod(it.productId); const np = p ? normPrice((it.total||0)-(it.discount||0), toBase(it.qty,it.unit), p.dim) : null; const n = document.getElementById('np_'+k); if(n) n.textContent = np ? cop(np)+normLabel(p.dim) : '';
  } else {
    if(f==='extras' || f==='totalPaid') PE[f] = parseMoney(el.value); else PE[f] = el.value;
    if(f==='storeId') el.classList.toggle('flag', !el.value);
  }
  const t = $('#peTotals'); if(t) t.innerHTML = peTotals();
}
ACT.peDel = el=>{ PE.items = PE.items.filter(i=>i.key!==el.dataset.k); peRerender(); };
ACT.peChange = el=>{ const it = PE.items.find(i=>i.key===el.dataset.k); it.productId = null; peRerender(); };
ACT.peAssign = el=>{ const it = PE.items.find(i=>i.key===el.dataset.k); it.productId = el.dataset.id; peFitUnit(it); peRerender(); };
ACT.peSave = ()=>{
  const items = PE.items.filter(i=>!i.skip);
  if(items.some(i=>!i.productId)) return toast('Asocia todas las líneas a un producto (u omítelas)');
  if(!PE.storeId) return toast('Elige la tienda');
  if(!items.length && PE.totalPaid==null) return toast('Agrega productos o el total pagado');
  if(PE.date > todayStr()) return toast('La fecha no puede ser futura');
  finalizePurchase(PE); const was = PE.id; closeSheet(true); try{ if(history.state && history.state.stockaSheet) history.replaceState(null,''); }catch(e){} PE = null; UI.shopMode = false; keepAwake(false); buzz(30);
  toast(was ? 'Compra corregida (queda registro del cambio)' : 'Compra registrada'); go(was?'compras':'inicio');
};
function finalizePurchase(pe){
  const id = pe.id || uid(); const prev = S.purchases[id];
  const items = pe.items.filter(i=>!i.skip).map(i=>({productId:i.productId, qty:i.qty, unit:i.unit, qtyBase:toBase(i.qty, i.unit), total:i.total||0, discount:i.discount||0, brand:i.brand||null, text:i.text||null}));
  const doc = {storeId:pe.storeId, date:pe.date, items, extras:pe.extras||0, totalPaid:pe.totalPaid, method:pe.method||null, notes:pe.notes||null, source:pe.source||'manual', quick:!!pe.quick, history:(prev?.history||[]).slice(-20)};
  if(pe.totalPaid!=null) doc.adjust = pe.totalPaid - (sum(items.map(i=>i.total-i.discount)) + (pe.extras||0));
  if(pe.raw) doc.extraction = pe.raw;
  if(prev){ doc.history.push({at:nowISO(), by:RT.me||null, before:{storeId:prev.storeId, date:prev.date, total:purchaseTotal(prev), items:(prev.items||[]).map(i=>[i.productId,i.qty,i.unit,i.total])}});
    doc.createdAt = prev.createdAt; doc.createdBy = prev.createdBy; if(prev.extraction && !doc.extraction) doc.extraction = prev.extraction;
    Object.entries(S.prices).forEach(([oid,o])=>{ if(o.purchaseId===id && (o.status||'confirmado')==='confirmado') patch('prices', oid, {status:'corregido'}); }); }
  put('purchases', id, doc);
  items.forEach(i=>{
    if(i.total>0) put('prices', uid(), {productId:i.productId, brand:i.brand, qty:i.qty, unit:i.unit, qtyBase:i.qtyBase, priceCop:i.total - i.discount, isPromo:i.discount>0, storeId:pe.storeId, observedAt:pe.date, source: pe.source==='foto_recibo'?'foto_recibo':'compra', purchaseId:id, status:'confirmado'});
    if(!prev){ const p = prod(i.productId); if(p) { const f = {inv:'hay', invAt:nowISO()}; if(i.text){ const al = new Set(p.aliases||[]); al.add(i.text); f.aliases = [...al].slice(-15); } patch('products', p.id, f); } }
  });
  pe.items.forEach(i=>{ if(i.listItemId && S.list[i.listItemId]) remove('list', i.listItemId); });
  return id;
}
ACT.newPurchase = ()=>{ PE = newPE({}); peSheet('Nueva compra'); };
ACT.quickPurchase = ()=>{
  openSheet('<i data-i=bolt></i> Compra rápida', `<p class="sub">Para la tienda de barrio o compras pequeñas sin recibo. Solo el total; los productos son opcionales.</p>
    <label class="f">Tienda</label><select class="i" id="qpStore">${storeOptions('barrio')}</select>
    <label class="f">Total pagado</label><input class="i" id="qpTotal" inputmode="numeric" placeholder="$" style="font-size:1.4rem;font-weight:800">
    <label class="f">¿Qué compraron? (opcional)</label><input class="i" id="qpNote" placeholder="Ej. pan, leche y huevos">
    <div class="grid2"><div><label class="f">Fecha</label><input class="i" type="date" id="qpDate" value="${todayStr()}" max="${todayStr()}"></div><div><label class="f">Pago</label><select class="i" id="qpPay"><option value="efectivo">Efectivo</option>${Object.entries(PAY).filter(([k])=>k!=='efectivo').map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></div></div>
    <div class="stickybar grid2"><button class="btn ghost" id="qpDetail">Con productos…</button><button class="btn acc" id="qpOk">Guardar</button></div>`);
  setTimeout(()=>$('#qpTotal') && $('#qpTotal').focus(), 80);
  $('#qpOk').onclick = ()=>{ const t = parseMoney(val('qpTotal')); if(!t) return toast('Escribe el total'); if(!val('qpStore')) return toast('Elige la tienda');
    put('purchases', uid(), {storeId:val('qpStore'), date:val('qpDate')||todayStr(), items:[], extras:0, totalPaid:t, method:val('qpPay'), notes:val('qpNote').trim()||null, source:'manual', quick:true, history:[]}); closeSheet(); toast('Compra rápida guardada'); };
  $('#qpDetail').onclick = ()=>{ PE = newPE({storeId:val('qpStore'), totalPaid:parseMoney(val('qpTotal')), notes:val('qpNote'), method:val('qpPay'), date:val('qpDate')||todayStr()}); peSheet('Nueva compra'); };
};
ACT.purchase = el=>{
  const id = el.dataset.id; const p = Object.assign({id}, S.purchases[id]); if(!S.purchases[id]) return;
  const it = itemsTotal(p); const diff = p.totalPaid!=null ? p.totalPaid - it - (p.extras||0) : 0;
  openSheet(esc(storeName(p.storeId)), `<div class="sub">${fmtDate(p.date)}${p.method?' · '+esc(PAY[p.method]||''):''} · ${esc(SRC[p.source]||p.source||'')}${p.quick?' · compra rápida':''}</div>
    <div class="big money" style="margin:6px 0">${cop(purchaseTotal(p))}</div>${p.notes?`<div class="note info">${esc(p.notes)}</div>`:''}
    ${(p.items||[]).length?`<table class="t"><tr><th>Producto</th><th class="n">Cant.</th><th class="n">Total</th><th class="n">Por ${''}</th></tr>${p.items.map(i=>{ const pr = prod(i.productId); const np = pr?normPrice(i.total-(i.discount||0), i.qtyBase, pr.dim):null; return `<tr><td>${esc(pr?pr.name:'(producto borrado)')}${i.brand?`<div class="tiny">${esc(i.brand)}</div>`:''}${i.text?`<div class="tiny">${esc(i.text)}</div>`:''}</td><td class="n">${fmtQtyU(i.qty,i.unit)}</td><td class="n">${cop(i.total-(i.discount||0))}</td><td class="n tiny">${np?cop(np)+normLabel(pr.dim):''}</td></tr>`; }).join('')}</table>`:'<div class="sub">Sin detalle de productos.</div>'}
    ${p.extras?`<div class="row between" style="margin-top:8px"><span>Adicionales</span><b>${cop(p.extras)}</b></div>`:''}
    ${Math.abs(diff)>1 && (p.items||[]).length?`<div class="note warn">Ajuste / otros: ${cop(diff)} (diferencia entre la suma y el total del recibo).</div>`:''}
    ${(p.history||[]).length?`<details style="margin-top:10px"><summary class="sub" style="cursor:pointer">Correcciones (${p.history.length})</summary>${p.history.map(h=>`<div class="tiny" style="margin:6px 0">${fmtDate(h.at)} ${h.at.slice(11,16)}${h.by&&RT.names[h.by]?' por '+esc(RT.names[h.by]):''}: antes ${cop(h.before.total)} · ${h.before.items.length} productos · ${esc(storeName(h.before.storeId))}</div>`).join('')}</details>`:''}
    <div class="stickybar grid2"><button class="btn danger" data-a="voidPurchase" data-id="${id}">Anular</button><button class="btn" data-a="editPurchase" data-id="${id}">Corregir</button></div>`);
};
ACT.editPurchase = el=>{ const p = S.purchases[el.dataset.id];
  PE = newPE({id:el.dataset.id, storeId:p.storeId, date:p.date, items:(p.items||[]).map(i=>Object.assign({key:uid()}, i)), extras:p.extras||null, totalPaid:p.totalPaid, method:p.method||'', notes:p.notes||'', source:p.source, quick:p.quick});
  peSheet('Corregir compra'); };
ACT.voidPurchase = el=>{ const id = el.dataset.id; confirmSheet('¿Anular esta compra?', 'Sale del presupuesto, los reportes y el historial de precios. Queda guardada como anulada.', 'Anular', ()=>{
  const p = S.purchases[id]; put('purchases', id, Object.assign({}, p, {void:true, history:[...(p.history||[]), {at:nowISO(), by:RT.me||null, before:{storeId:p.storeId,date:p.date,total:purchaseTotal(p),items:[]}, action:'anulada'}]}));
  Object.entries(S.prices).forEach(([oid,o])=>{ if(o.purchaseId===id) patch('prices', oid, {status:'descartado'}); }); toast('Compra anulada'); }, true); };

/* ================= ACCIONES RÁPIDAS (botón <i data-i=plus></i>) ================= */
ACT.quickActions = ()=>{
  openSheet('¿Qué quieres registrar?', `<div class="qa">
    <button class="hi" data-a="photo" data-k="recibo"><span class="ic"><i data-i=receipt></i></span>Foto de recibo</button>
    <button data-a="photo" data-k="etiqueta"><span class="ic"><i data-i=tag></i></span>Foto de etiqueta</button>
    <button data-a="photoGal"><span class="ic"><i data-i=image></i></span>Foto de galería</button>
    <button data-a="manualPrice"><span class="ic"><i data-i=pencil></i></span>Precio a mano</button>
    <button data-a="quickPurchase"><span class="ic"><i data-i=bolt></i></span>Compra rápida</button>
    <button data-a="newPurchase"><span class="ic"><i data-i=cart></i></span>Compra detallada</button>
    <button data-a="addItem"><span class="ic"><i data-i=list></i></span>Agregar a la lista</button>
    <button data-a="quickReview"><span class="ic"><i data-i=pantry></i></span>Revisar despensa</button>
    <button data-a="go" data-r="reportes"><span class="ic"><i data-i=chart></i></span>Ver reportes</button></div>`);
};
ACT.hideTip = ()=>{ try{ localStorage.setItem('mec_tip_home','1'); }catch(e){} render(); };

/* ================= PRECIOS ================= */
ACT.priceMenu = ()=>{
  const img = RT.imagesOK;
  openSheet('Registrar precio', `<div class="list">
    <div class="item tap" data-a="photo" data-k="etiqueta"><span class="tile pine"><i data-i=camera></i></span><div class="grow"><div class="name">Foto de la etiqueta</div><div class="tiny">Lee precio, contenido y PUM de la góndola</div></div></div>
    <div class="item tap" data-a="photo" data-k="recibo"><span class="tile pine"><i data-i=receipt></i></span><div class="grow"><div class="name">Foto del recibo</div><div class="tiny">Registra la compra completa línea por línea</div></div></div>
    <div class="item tap" data-a="photoGal"><span class="tile pine"><i data-i=image></i></span><div class="grow"><div class="name">Subir foto de la galería</div><div class="tiny">Etiqueta o recibo que ya tengas guardado</div></div></div>
    <div class="item tap" data-a="manualPrice"><span class="tile pine"><i data-i=pencil></i></span><div class="grow"><div class="name">Ingresar a mano</div><div class="tiny">Rápido: producto, precio, cantidad y tienda</div></div></div></div>
    ${img===false?'<div class="note warn">La lectura de fotos no está disponible en esta vista. Puedes ingresar el precio a mano.</div>':''}`);
};
function priceFormSheet(pre){
  pre = pre || {}; let pid = pre.productId || null;
  const body = ()=>{ const p = prod(pid); const lp = p ? lastPaidUnit(p.id) : null;
    return `${pre.photoUrl?`<img class="photo" src="${pre.photoUrl}" style="margin-bottom:8px">`:''}${pre.warnings&&pre.warnings.length?`<div class="note warn">${pre.warnings.map(esc).join('<br>')}</div>`:''}
    ${pre.readName?`<div class="tiny">Etiqueta dice: <b>${esc(pre.readName)}</b>${pre.readBrand?' · '+esc(pre.readBrand):''}</div>`:''}
    <label class="f">Producto</label>${p?`<div class="row between card" style="margin:0;padding:10px"><b>${CAT[p.cat]?.ic||''} ${esc(p.name)}</b><button class="btn sm ghost" id="pfChange">Cambiar</button></div>`:
      `${pre.readName?`<div class="row wrap" style="margin-bottom:6px">${matchProducts(pre.readName,4).map(s=>`<button class="chip" style="border:0;min-height:38px" data-pfpick="${s.id}">${esc(s.name)}</button>`).join('')}</div>`:''}${pickerHTML('pf','Buscar o crear producto…', id=>{ pid=id; redraw(); })}
       ${pre.readName?`<button class="btn sm ghost" style="margin-top:6px" id="pfProv">Guardar como provisional (sin producto)</button>`:''}`}
    <div class="grid2"><div><label class="f">Precio</label><input class="i ${pre.flags?.price?'flag':''}" id="pfPrice" inputmode="numeric" value="${pre.price?fnum(pre.price):''}" placeholder="$"></div>
    <div><label class="f">Tienda</label><select class="i" id="pfStore">${storeOptions(pre.storeId || S.settings.shopStore || lp?.storeId)}</select></div></div>
    <div class="grid2"><div><label class="f">Cantidad / contenido</label><input class="i ${pre.flags?.qty?'flag':''}" id="pfQty" inputmode="decimal" value="${pre.qty!=null?fnum(pre.qty):(p?.usualQty!=null?fnum(p.usualQty):'')}"></div>
    <div><label class="f">Unidad</label><select class="i" id="pfUnit">${unitsFor(p?p.dim:guessDim(pre.unit||'und')).map(([k,n])=>`<option value="${k}" ${(pre.unit||p?.usualUnit||defaultUnit(p?.dim))===k?'selected':''}>${n}</option>`).join('')}</select></div></div>
    <div class="grid2"><div><label class="f">Marca / presentación</label><input class="i" id="pfBrand" value="${esc(pre.brand||'')}"></div><div><label class="f">Fecha</label><input class="i" type="date" id="pfDate" value="${esc(pre.date||todayStr())}" max="${todayStr()}"></div></div>
    <label class="row" style="margin:10px 0;gap:8px"><input type="checkbox" id="pfPromo" ${pre.isPromo?'checked':''} style="width:22px;height:22px"> Es precio de promoción</label>
    ${pre.pum?`<div class="tiny">PUM impreso: ${esc(pre.pumText||'')}</div>`:''}
    <div class="card" id="pfInfo" style="margin-top:8px"></div>
    <div class="stickybar grid2"><button class="btn ghost" data-a="closeSheet">Cancelar</button><button class="btn acc" id="pfSave">Guardar precio</button></div>`; };
  const redraw = ()=>{ openSheet(pre.title||'Precio', body(), ()=>{ if(pre.photoUrl) try{URL.revokeObjectURL(pre.photoUrl);}catch(e){} }); wire(); };
  const wire = ()=>{
    const ch = $('#pfChange'); if(ch) ch.onclick = ()=>{ pid=null; redraw(); };
    document.querySelectorAll('[data-pfpick]').forEach(b=>b.onclick=()=>{ pid=b.dataset.pfpick; redraw(); });
    const prov = $('#pfProv'); if(prov) prov.onclick = ()=>{ const price = parseMoney(val('pfPrice')); if(!price) return toast('Falta el precio');
      put('prices', uid(), {productId:null, provName:pre.readName, brand:val('pfBrand')||null, qty:parseQty(val('pfQty')), unit:val('pfUnit'), qtyBase:toBase(parseQty(val('pfQty')), val('pfUnit')), priceCop:price, isPromo:$('#pfPromo').checked, storeId:val('pfStore')||null, observedAt:val('pfDate')||todayStr(), source:pre.source||'manual', status:'provisional', extraction:pre.raw||null});
      closeSheet(); toast('Guardado como provisional'); };
    const info = ()=>{ const p = prod(pid); const box = $('#pfInfo'); if(!box) return; if(!p){ box.innerHTML = '<span class="sub">Elige el producto para comparar.</span>'; return; }
      const price = parseMoney(val('pfPrice')); const base = toBase(parseQty(val('pfQty')), val('pfUnit')); const np = normPrice(price, base, p.dim);
      const m = median(obsFor(p.id).map(o=>o.np).filter(Boolean)); const l = lastObs(p.id);
      let h = np ? `<div class="row between"><span>Precio normalizado</span><b class="money">${cop(np)}${normLabel(p.dim)}</b></div>` : '<span class="sub">Con precio y cantidad se calcula el precio por '+DIMS[p.dim].norm+'.</span>';
      if(np && l && l.np) h += `<div class="row between"><span>Último registro</span><span>${cop(l.np)}${normLabel(p.dim)} · ${fmtDate(l.observedAt)} <b class="${np>l.np?'up':np<l.np?'down':'flat'}">${pct((np-l.np)/l.np*100)}</b></span></div>`;
      if(np && m && Math.abs(np-m)/m > 0.4) h += `<div class="note warn">Este precio se aleja más de 40% de lo que suelen pagar (${cop(m)}${normLabel(p.dim)}). ¿Es correcto? Revisa cantidad y unidad.</div>`;
      if(np && pre.pum){ const pumNorm = pre.pum; if(Math.abs(np-pumNorm)/pumNorm > 0.02) h += `<div class="note warn">El PUM impreso (${cop(pumNorm)}${normLabel(p.dim)}) no coincide con el calculado. Revisa el contenido.</div>`; else h += `<div class="note ok"><i data-i=check></i> Coincide con el PUM impreso.</div>`; }
      if(LOCAL_UNITS.includes(val('pfUnit'))) h += `<div class="tiny">Equivalencia local: 1 libra = ${libraG()} g (configurable en Ajustes).</div>`;
      box.innerHTML = h; };
    ['pfPrice','pfQty','pfUnit'].forEach(i=>{ const e = document.getElementById(i); if(e) e.oninput = e.onchange = info; }); info();
    $('#pfSave').onclick = ()=>{ const p = prod(pid); if(!p) return toast('Elige el producto'); const price = parseMoney(val('pfPrice')); if(!price) return toast('Escribe el precio');
      const qty = parseQty(val('pfQty')); const d = val('pfDate')||todayStr(); if(d>todayStr()) return toast('La fecha no puede ser futura');
      put('prices', uid(), {productId:p.id, brand:val('pfBrand').trim()||null, qty, unit:val('pfUnit'), qtyBase:toBase(qty, val('pfUnit')), priceCop:price, isPromo:$('#pfPromo').checked, storeId:val('pfStore')||null, observedAt:d, source:pre.source||'manual', status:'confirmado', printedPum:pre.pumText||null, extraction:pre.raw||null});
      if(pre.provId) remove('prices', pre.provId);
      closeSheet(); toast('Precio guardado'); productPricesSheet(p.id); };
  };
  redraw();
}
ACT.manualPrice = ()=>priceFormSheet({title:'Registrar precio'});
ACT.provisionals = ()=>{
  const ps = Object.entries(S.prices).filter(([id,o])=>o.status==='provisional');
  openSheet('Precios provisionales', `<div class="list">${ps.map(([id,o])=>`<div class="item tap" data-a="assignProv" data-id="${id}"><div class="grow"><div class="name">${esc(o.provName||'Sin nombre')}</div><div class="tiny">${cop(o.priceCop)} · ${esc(storeName(o.storeId))} · ${fmtDate(o.observedAt)}</div></div><span>Asignar ›</span></div>`).join('')}</div>`);
};
ACT.assignProv = el=>{ const o = S.prices[el.dataset.id]; priceFormSheet({title:'Asignar precio', provId:el.dataset.id, readName:o.provName, brand:o.brand, price:o.priceCop, qty:o.qty, unit:o.unit, storeId:o.storeId, date:o.observedAt, isPromo:o.isPromo, source:o.source, raw:o.extraction}); };
function sparkSVG(obs, dim){
  const pts = obs.filter(o=>o.np); if(pts.length<3) return '';
  const xs = pts.map(o=>new Date(o.observedAt).getTime()); const ys = pts.map(o=>o.np);
  const x0 = Math.min(...xs), x1 = Math.max(...xs)||x0+1, y0 = Math.min(...ys)*0.95, y1 = Math.max(...ys)*1.05;
  const W=600,H=120,px=x=> 10 + (x1===x0?0.5:(x-x0)/(x1-x0))*(W-20), py=y=> H-14 - (y1===y0?0.5:(y-y0)/(y1-y0))*(H-28);
  const d = pts.map((o,i)=>`${i?'L':'M'}${px(xs[i]).toFixed(1)},${py(ys[i]).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="#5fae8a" stroke-width="3" vector-effect="non-scaling-stroke"/>${pts.map((o,i)=>`<circle cx="${px(xs[i])}" cy="${py(ys[i])}" r="4" fill="${o.isPromo?'#e0703a':'#2f7d5b'}"><title>${fmtDate(o.observedAt)} ${cop(o.np)}</title></circle>`).join('')}</svg><div class="row between tiny"><span>${fmtDate(pts[0].observedAt)}</span><span>${cop(Math.min(...ys))} – ${cop(Math.max(...ys))}${normLabel(dim)}</span><span>${fmtDate(pts[pts.length-1].observedAt)}</span></div>`;
}
function productPricesSheet(id){
  const p = prod(id); if(!p) return; const obs = obsFor(id); const nps = obs.map(o=>o.np).filter(Boolean);
  const months = [...new Set(obs.map(o=>monthOf(o.observedAt)))].sort();
  const m2 = months[months.length-1], m1 = months[months.length-2];
  let cmp = '';
  if(months.length>=2){ const r = compareMonths(id, m1, m2); cmp = `<div class="card"><div class="row between"><b>${monthName(m1)} → ${monthName(m2)}</b>${trendBadge(r)}</div>${r.status!=='insuficiente'?`<div class="sub">${cop(r.p1)} (${r.n1} reg.) → ${cop(r.p2)} (${r.n2} reg.)${normLabel(p.dim)} · ${r.diff>0?'+':''}${cop(r.diff)}</div>${r.notes.length?`<div class="tiny">${esc(r.notes.join(' · '))}</div>`:''}`:`<div class="sub">${esc(r.reason||'')}</div>`}<button class="btn sm ghost" data-a="monthCompare" data-id="${id}" style="margin-top:6px">Comparar otros meses</button></div>`; }
  else if(obs.length) cmp = `<div class="note info">Con registros en dos meses distintos aparece la comparación mensual.</div>`;
  // por tienda (últimos 90 días)
  const recent = obs.filter(o=>o.np && daysBetween(o.observedAt, todayStr())<=90); const bySt = {}; recent.forEach(o=>{ (bySt[o.storeId||'']=bySt[o.storeId||'']||[]).push(o.np); });
  const stRows = Object.entries(bySt).map(([s,a])=>({s, m:median(a), n:a.length})).sort((a,b)=>a.m-b.m);
  const enough = stRows.length>=2 && stRows.every(r=>r.n>=3);
  openSheet(`${CAT[p.cat]?.ic||''} ${esc(p.name)}`, `
    ${nps.length?`<div class="grid2"><div class="card"><div class="tiny">Último</div><div class="money" style="font-size:1.2rem">${cop(nps[nps.length-1])}<span class="tiny">${normLabel(p.dim)}</span></div></div><div class="card"><div class="tiny">Mediana histórica</div><div class="money" style="font-size:1.2rem">${cop(median(nps))}<span class="tiny">${normLabel(p.dim)}</span></div></div>
      <div class="card"><div class="tiny">Mínimo</div><div class="money">${cop(Math.min(...nps))}</div></div><div class="card"><div class="tiny">Máximo</div><div class="money">${cop(Math.max(...nps))}</div></div></div>`:'<div class="note info">Aún no hay precios normalizables (falta cantidad o contenido).</div>'}
    ${sparkSVG(obs, p.dim)}${cmp}
    ${stRows.length?`<h3>Por tienda (últimos 90 días)</h3><div class="card">${stRows.map(r=>`<div class="row between"><span>${esc(storeName(r.s))} <span class="tiny">(${r.n})</span></span><b class="money">${cop(r.m)}${normLabel(p.dim)}</b></div>`).join('')}<div class="tiny" style="margin-top:6px">${enough?`Con los datos disponibles, ${esc(storeName(stRows[0].s))} ha sido la más económica.`:'Se necesitan al menos 3 registros por tienda para decir cuál es más económica.'}</div></div>`:''}
    <h3>Historial (${obs.length})</h3>
    ${[...obs].reverse().map(o=>`<div class="hist"><div class="grow"><b>${esc(storeName(o.storeId))}</b> <span class="tiny">${fmtDate(o.observedAt)}</span><div class="tiny">${esc(SRC[o.source]||o.source)}${o.isPromo?' · promo':''}${o.brand?' · '+esc(o.brand):''} · ${cop(o.priceCop)} por ${fmtBase(o.qtyBase,p.dim)}</div></div><div class="right money">${o.np?cop(o.np)+'<div class="tiny">'+normLabel(p.dim)+'</div>':'—'}</div><button class="x" style="width:40px;height:40px;font-size:.9rem" data-a="delObs" data-id="${o.id}" data-p="${id}" aria-label="Descartar"><i data-i=close></i></button></div>`).join('')}
    <div class="stickybar grid2"><button class="btn sec" data-a="addToList" data-id="${id}"><i data-i=plus></i> A la lista</button><button class="btn acc" id="ppAdd">Registrar precio</button></div>`);
  $('#ppAdd').onclick = ()=>priceFormSheet({title:'Registrar precio', productId:id});
}
ACT.productPrices = el=>productPricesSheet(el.dataset.id);
ACT.delObs = el=>{ confirmSheet('¿Descartar este registro?', 'Deja de contar en el historial y las comparaciones. No se borra la compra.', 'Descartar', ()=>{ patch('prices', el.dataset.id, {status:'descartado'}); productPricesSheet(el.dataset.p); }, true); };
ACT.monthCompare = el=>{
  const cur = monthOf(todayStr()); const allM = [...new Set(Object.values(S.prices).map(o=>monthOf(o.observedAt)).filter(Boolean))].sort().reverse(); if(!allM.includes(cur)) allM.unshift(cur);
  const opt = sel => allM.map(m=>`<option value="${m}" ${m===sel?'selected':''}>${monthName(m)}</option>`).join('');
  const preId = el && el.dataset ? el.dataset.id : null;
  openSheet('Comparar meses', `<div class="grid2"><div><label class="f">Mes A</label><select class="i" id="mcA">${opt(allM[1]||monthShift(cur,-1))}</select></div><div><label class="f">Mes B</label><select class="i" id="mcB">${opt(allM[0])}</select></div></div>
    <label class="row" style="margin:10px 0;gap:8px"><input type="checkbox" id="mcNoPromo" style="width:22px;height:22px"> Excluir precios de promoción</label><div id="mcOut"></div>`);
  const run = ()=>{ const a = val('mcA'), b = val('mcB'), np = $('#mcNoPromo').checked;
    const rows = (preId ? [prod(preId)] : products()).filter(Boolean).map(p=>({p, r:compareMonths(p.id, a, b, {noPromo:np})})).filter(x=>x.r.n1||x.r.n2);
    if(!rows.length){ $('#mcOut').innerHTML = '<div class="note info">Información insuficiente: no hay registros en esos meses.</div>'; return; }
    rows.sort((x,y)=>(y.r.pct??-999)-(x.r.pct??-999));
    $('#mcOut').innerHTML = `<table class="t"><tr><th>Producto</th><th class="n">${esc(MONTHS[+a.slice(5)-1].slice(0,3))}</th><th class="n">${esc(MONTHS[+b.slice(5)-1].slice(0,3))}</th><th class="n">Var.</th></tr>${rows.map(({p,r})=>`<tr><td>${esc(p.name)}${r.notes.length?`<div class="tiny">${esc(r.notes.join(', '))}</div>`:''}</td><td class="n">${r.p1?cop(r.p1):'—'}<div class="tiny">${r.n1} reg.</div></td><td class="n">${r.p2?cop(r.p2):'—'}<div class="tiny">${r.n2} reg.</div></td><td class="n">${r.status==='insuficiente'?'<span class="tiny">insuf.</span>':`<span class="${r.status==='sube'?'up':r.status==='baja'?'down':'flat'}">${pct(r.pct)}</span><div class="tiny">${r.diff>0?'+':''}${cop(r.diff)}${normLabel(p.dim)}</div>`}</td></tr>`).join('')}</table>`; };
  ['mcA','mcB','mcNoPromo'].forEach(i=>$('#'+i).onchange = run); run();
};
