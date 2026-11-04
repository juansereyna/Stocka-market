/* ================= LECTURA DE FOTOS ================= */
const CAT_IDS = CATS.map(c=>c.id).join('|');
const PROMPT_LABEL = `Eres un lector de etiquetas de precio de góndola de supermercados en Colombia. La imagen es una foto tomada con el celular.
Reglas estrictas:
- Transcribe SOLO lo que se lee en la imagen. Si un valor no es legible o no aparece, usa null. No inventes valores.
- No calcules, ajustes ni redondees precios. En Colombia el punto separa miles: "$12.900" es 12900.
- "PUM" o "precio por unidad de medida" suele decir algo como "Gramo a $4,05" o "Kilo a $12.900": cópialo en pum_texto y separa valor y unidad.
Responde solo con un objeto JSON con esta forma exacta:
{"nombre": string|null, "marca": string|null, "precio": entero|null, "precio_anterior": entero|null, "es_promocion": boolean, "texto_promocion": string|null,
 "contenido_cantidad": número|null, "contenido_unidad": "g"|"kg"|"ml"|"L"|"und"|null, "presentacion": string|null,
 "pum_texto": string|null, "pum_valor": número|null, "pum_unidad": "g"|"kg"|"ml"|"L"|"und"|null,
 "codigo_barras": string|null, "tienda": string|null, "fecha": "AAAA-MM-DD"|null,
 "categoria_sugerida": "${CAT_IDS}", "dimension": "peso"|"volumen"|"conteo",
 "confianza": {"nombre": "alta"|"baja", "precio": "alta"|"baja", "contenido": "alta"|"baja"},
 "es_etiqueta": boolean}
Si la imagen no es una etiqueta de precio, responde {"es_etiqueta": false}.`;
const PROMPT_RECEIPT = `Eres un lector de recibos y tiquetes de compra de supermercados y tiendas en Colombia. La imagen es una foto de un recibo (puede estar en papel térmico, borroso o doblado).
Reglas estrictas:
- Transcribe SOLO lo que se lee. Si un valor no es legible, usa null. No inventes productos ni valores.
- NO ajustes, recalcules ni concilies precios o totales para que la suma cuadre. Si no cuadra, deja los valores como se leen.
- En Colombia el punto separa miles: "12.900" es 12900. Los precios son enteros en pesos.
- Un descuento que aparece como línea aparte va como su propia línea con total_linea NEGATIVO y su texto original.
- Para productos pesados (por ejemplo "0,850 KG X 12.900"), cantidad es el peso en kg (0.85) y unidad "kg".
- "descripcion" es un nombre legible en español del producto (expande abreviaturas evidentes, ej. "LCH ENT ALQ 1100ML" → "Leche entera Alquería 1100 ml"); "texto" es la línea tal como aparece.
Responde solo con un objeto JSON con esta forma exacta:
{"es_recibo": boolean, "tienda": string|null, "nit": string|null, "fecha": "AAAA-MM-DD"|null,
 "lineas": [{"texto": string, "descripcion": string|null, "cantidad": número|null, "unidad": "und"|"kg"|"g"|"lb"|"L"|"ml"|null, "precio_unitario": entero|null, "total_linea": entero|null, "es_pesado": boolean, "categoria_sugerida": "${CAT_IDS}", "confianza": "alta"|"baja"}],
 "subtotal": entero|null, "descuentos_totales": entero|null, "impuestos": entero|null, "total": entero|null, "advertencias": [string]}
No incluyas como productos las líneas de IVA, subtotal, total, cambio, efectivo, tarjeta ni datos del cliente (nombre o cédula: ignóralos).`;
const STORE_ALIASES = [['koba','d1'],['d1 ','d1'],['tiendas d1','d1'],['jeronimo martins','ara'],['tiendas ara','ara'],['isimo','isimo'],['almacenes exito','exito'],['exito','exito'],['carulla','carulla'],['olimpica','olimpica'],['sao','olimpica'],['cencosud','jumbo'],['jumbo','jumbo'],['metro','metro'],['colombiana de comercio','alkosto'],['alkosto','alkosto'],['ktronix','alkosto'],['makro','makro'],['pricesmart','pricesmart']];
function matchStore(text){ if(!text) return ''; const t = ' '+norm(text)+' ';
  for(const s of allStores(true)){ if(!s.builtin && t.includes(' '+norm(s.name)+' ')) return s.id; }
  for(const [a,id] of STORE_ALIASES){ if(t.includes(norm(a)) ) return id; } return ''; }
async function resizeImage(file){
  try{
    const bmp = await createImageBitmap(file, {imageOrientation:'from-image'}).catch(()=>createImageBitmap(file));
    const max = 1600, sc = Math.min(1, max/Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width*sc); c.height = Math.round(bmp.height*sc);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r=>c.toBlob(b=>r(b||file), 'image/jpeg', 0.85));
  }catch(e){ return file; }
}
function photoConsent(then){
  let ok = false; try{ ok = localStorage.getItem('mec_photo_ok')==='1'; }catch(e){}
  if(ok) return then();
  openSheet('Antes de la primera foto', `<p>Para leer etiquetas y recibos, la foto se envía a <b>Claude (Anthropic)</b>, un servicio fuera de Colombia, usando tu cuenta. Se usa solo para extraer los datos.</p>
    <ul class="sub"><li>La app <b>no guarda la foto</b>; solo los datos que tú revises y confirmes.</li><li>Los recibos pueden traer tu nombre o cédula: si quieres, tápalos antes de la foto.</li><li>Siempre podrás corregir todo antes de guardar. La lectura es una ayuda, no la verdad.</li></ul>
    <div class="stickybar grid2"><button class="btn ghost" data-a="closeSheet">Ahora no</button><button class="btn" id="pcOk">Acepto</button></div>`);
  $('#pcOk').onclick = ()=>{ try{ localStorage.setItem('mec_photo_ok','1'); }catch(e){} closeSheet(); then(); };
}
ACT.photo = el=>{ const k = el.dataset.k; photoConsent(()=>{ RT.photoKind = k; const i = $('#photoInput'); i.value=''; i.click(); }); };
ACT.photoGal = ()=>{ photoConsent(()=>{ openSheet('¿Qué foto vas a subir?', `<div class="grid2"><button class="btn" id="pgL"><i data-i=tag></i> Etiqueta</button><button class="btn" id="pgR"><i data-i=receipt></i> Recibo</button></div>`);
  $('#pgL').onclick = ()=>{ RT.photoKind='etiqueta'; const i=$('#photoInputGal'); i.value=''; i.click(); closeSheet(); };
  $('#pgR').onclick = ()=>{ RT.photoKind='recibo'; const i=$('#photoInputGal'); i.value=''; i.click(); closeSheet(); }; }); };
['#photoInput','#photoInputGal'].forEach(s=>$(s).addEventListener('change', e=>{ const f = e.target.files && e.target.files[0]; if(f) processPhoto(f, RT.photoKind||'etiqueta'); }));
async function processPhoto(file, kind){
  const url = URL.createObjectURL(file);
  const manual = (warn)=>{ if(kind==='recibo'){ PE = newPE({source:'foto_recibo', photoUrl:url, warnings:[warn]}); peSheet('Compra desde recibo'); } else priceFormSheet({title:'Precio desde foto', photoUrl:url, source:'foto_etiqueta', warnings:[warn]}); };
  if(!RT.sample || RT.imagesOK===false) return manual('La lectura automática no está disponible aquí. Ingresa los datos mirando la foto.');
  const ctl = new AbortController();
  openSheet(kind==='recibo'?'Leyendo el recibo…':'Leyendo la etiqueta…', `<img class="photo" src="${url}"><div class="row" style="justify-content:center;margin:16px 0"><span class="spin"></span><span class="sub">Esto puede tardar hasta un minuto${kind==='recibo'?' en recibos largos':''}.</span></div><button class="btn ghost full" id="phStop">Cancelar</button>`);
  $('#phStop').onclick = ()=>{ ctl.abort(); closeSheet(); };
  let data;
  try{
    const img = await resizeImage(file);
    data = await RT.sample.json(kind==='recibo' ? PROMPT_RECEIPT : PROMPT_LABEL, {images:[img], signal:ctl.signal, modelTier:'default'});
  }catch(e){
    if(e && e.code==='cancelled') return;
    const msg = {not_granted:'No se dio permiso para usar Claude en esta app.', rate_limited:'Demasiadas lecturas seguidas o se alcanzó el límite de uso. Intenta más tarde.', image_rejected:'La imagen no se pudo procesar. Prueba con otra foto.', invalid_json:'No se pudo interpretar la lectura. Prueba con otra foto más nítida.', images_unavailable:'Esta vista no permite enviar imágenes.', refused:'No se pudo leer esta imagen.'}[e&&e.code] || 'No se pudo leer la foto (problema de conexión).';
    if(e && (e.code==='not_granted' || e.code==='images_unavailable' || e.code==='sampling_disabled')) RT.imagesOK = false;
    return manual(msg + ' Puedes ingresar los datos mirando la foto.');
  }
  if(!data || typeof data!=='object') return manual('La lectura vino vacía. Ingresa los datos mirando la foto.');
  if(kind==='recibo') reviewReceipt(data, url); else reviewLabel(data, url);
}
const int = v => { if(v==null || v==='') return null; const n = typeof v==='number' ? v : parseMoney(v); return Number.isFinite(n) ? Math.round(n) : null; };
const num = v => { if(v==null || v==='') return null; const n = typeof v==='number' ? v : parseQty(v); return Number.isFinite(n) ? n : null; };
function validDate(s){ return typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s)) ? s : null; }
function reviewLabel(d, url){
  const w = []; if(d.es_etiqueta===false) w.push('No parece una etiqueta de precio. Revisa o ingresa los datos a mano.');
  let price = int(d.precio), prev = int(d.precio_anterior); const promo = !!d.es_promocion;
  const unit = ['g','kg','ml','L','und'].includes(d.contenido_unidad) ? d.contenido_unidad : null; const qty = num(d.contenido_cantidad);
  const conf = d.confianza||{};
  if(conf.precio==='baja') w.push('Precio leído con baja confianza: confírmalo.'); if(conf.contenido==='baja') w.push('Contenido leído con baja confianza.');
  if(price!=null && (price<50 || price>3000000)) w.push('El precio leído parece fuera de rango.');
  let pum = null; const pv = num(d.pum_valor);
  if(pv && d.pum_unidad){ pum = ['g','ml'].includes(d.pum_unidad) ? pv*1000 : pv; }
  let fecha = validDate(d.fecha); if(fecha && fecha>todayStr()){ w.push('La fecha leída es futura; se usará hoy.'); fecha = null; }
  const m = d.nombre ? matchProducts([d.nombre, d.marca].filter(Boolean).join(' '), 1)[0] : null;
  priceFormSheet({title:'Revisar precio leído', photoUrl:url, source:'foto_etiqueta', readName:[d.nombre, d.presentacion].filter(Boolean).join(' · ') || null, readBrand:d.marca, brand:[d.marca, d.presentacion].filter(Boolean).join(' ') || '', price, qty, unit, isPromo:promo, date:fecha||todayStr(), storeId:matchStore(d.tienda), pum, pumText:d.pum_texto||null, warnings:w, raw:d,
    flags:{price:conf.precio==='baja'||price==null, qty:conf.contenido==='baja'||qty==null}, productId: null, suggested: m ? m.id : null});
}
function reviewReceipt(d, url){
  const w = []; if(d.es_recibo===false) w.push('No parece un recibo. Revisa o ingresa los datos a mano.');
  if(Array.isArray(d.advertencias)) d.advertencias.slice(0,4).forEach(a=>w.push('Lectura: '+a));
  let fecha = validDate(d.fecha); if(fecha && fecha>todayStr()){ w.push('La fecha leída es futura: revísala.'); fecha = todayStr(); }
  const items = [];
  (Array.isArray(d.lineas)?d.lineas:[]).forEach(l=>{
    const total = int(l.total_linea);
    if(total!=null && total<0 && items.length){ const prevIt = items[items.length-1]; prevIt.discount = (prevIt.discount||0) + Math.abs(total); prevIt.discText = l.texto; w.push(`Descuento “${l.texto}” (${cop(Math.abs(total))}) asociado a “${prevIt.text}”. Revísalo.`); return; }
    let unit = l.unidad ? normUnitText(l.unidad) : 'und'; let qty = num(l.cantidad); if(qty==null && total) { qty = 1; }
    const text = String(l.texto||l.descripcion||'').slice(0,80);
    // 1) alias exacto ya aprendido; 2) sin coincidencia segura → el usuario elige
    const alias = products().find(p=>(p.aliases||[]).some(a=>norm(a)===norm(text)));
    const it = {key:uid(), text, desc:l.descripcion||null, productId:alias?alias.id:null, qty, unit, total, unitPrice:int(l.precio_unitario), conf:l.confianza, catGuess:l.categoria_sugerida};
    if(alias) peFitUnit(it);
    items.push(it);
  });
  const sumLines = sum(items.map(i=>(i.total||0)-(i.discount||0))); const tot = int(d.total);
  if(tot!=null && Math.abs(sumLines - tot) > 1) w.push(`La suma de las líneas leídas (${cop(sumLines)}) no coincide con el total impreso (${cop(tot)}). No se corrigió nada: revisa las líneas marcadas.`);
  if(!items.length) w.push('No se leyeron productos. Puedes agregarlos a mano.');
  PE = newPE({source:'foto_recibo', storeId:matchStore(d.tienda), storeText:d.tienda||null, date:fecha||todayStr(), items, totalPaid:tot, photoUrl:url, warnings:w, raw:d});
  peSheet('Revisar recibo leído');
}
// al crear producto desde una línea de recibo, usar la categoría sugerida
ACT.pickNew = el=>{
  const pid = el.dataset.pid, q = el.dataset.q; const box = document.getElementById('res-'+pid);
  let cat = 'despensa', dim = 'conteo';
  if(pid.startsWith('pe_') && PE){ const it = PE.items.find(i=>'pe_'+i.key===pid); if(it){ if(CAT[it.catGuess]) cat = it.catGuess; dim = guessDim(it.unit); } }
  box.innerHTML = `<div style="padding:10px">${newProductFormHTML('np_'+pid, q.charAt(0).toUpperCase()+q.slice(1), cat, dim)}<button class="btn full" style="margin-top:8px" data-a="pickCreate" data-pid="${pid}">Crear producto</button></div>`;
};
ACT.pickCreate = el=>{ const pid = el.dataset.pid; const pre = 'np_'+pid; const name = val(pre+'Name');
  const dup = findDuplicate(name); const id = dup ? dup.id : createProduct(name, val(pre+'Cat'), val(pre+'Dim')); if(!id) return; if(dup) toast('Ya existía: se usó “'+dup.name+'”'); PICKERS[pid] && PICKERS[pid](id); };
ACT.pickRes = el=>{ const f = PICKERS[el.dataset.pid]; f && f(el.dataset.id); };

/* ================= AJUSTES ================= */
ACT.saveSettings = ()=>{ const bc = {}; document.querySelectorAll('[data-bcat]').forEach(i=>{ const v = parseMoney(i.value); if(v) bc[i.dataset.bcat] = v; });
  saveSettings({householdName:val('setName').trim()||'Nuestro hogar', budget:parseMoney(val('setBudget'))||0, budgetCat:bc}); toast('Ajustes guardados'); };
ACT.saveUnits = ()=>{ const l = parseInt(val('setLibra'),10), c = parseInt(val('setCubeta'),10); if(!(l>=400 && l<=600)) return toast('La libra debe estar entre 400 y 600 g'); saveSettings({libraG:l, cubeta:c>0?c:30}); toast('Unidades guardadas'); };
ACT.toggleStore = el=>{ const h = new Set(S.settings.hiddenStores||[]); h.has(el.dataset.id) ? h.delete(el.dataset.id) : h.add(el.dataset.id); saveSettings({hiddenStores:[...h]}); };
ACT.newStore = ()=>{ openSheet('Nueva tienda', `<label class="f">Nombre</label><input class="i" id="nsName" placeholder="Ej. Fruver La 70, D1 Laureles"><div class="grid2"><div><label class="f">Tipo</label><select class="i" id="nsType">${Object.entries(STORE_TYPES).map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></div><div><label class="f">Ciudad / sede</label><input class="i" id="nsCity"></div></div><div class="stickybar"><button class="btn full" id="nsOk">Guardar</button></div>`);
  $('#nsOk').onclick = ()=>{ const n = val('nsName').trim(); if(!n) return toast('Escribe el nombre'); put('stores', uid(), {name:n + (val('nsCity').trim()?' · '+val('nsCity').trim():''), type:val('nsType'), city:val('nsCity').trim()||null}); closeSheet(); toast('Tienda agregada'); }; };

/* ================= EXPORTAR / IMPORTAR ================= */
function csvCell(v){ v = v==null ? '' : String(v); return /[",;\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; }
function toCSV(rows){ return '﻿' + rows.map(r=>r.map(csvCell).join(';')).join('\n'); }
function exportData(kind){
  if(kind==='json'){ const o = {app:'stocka', version:1, exportedAt:nowISO()}; COLLS.forEach(c=>o[c]=S[c]); return {filename:`stocka-${todayStr()}.json`, data:JSON.stringify(o, null, 1)}; }
  if(kind==='compras'){ const rows = [['fecha','tienda','producto','categoria','cantidad','unidad','cantidad_base','total_linea','descuento','total_compra','metodo','origen']];
    purchases().forEach(p=>{ if(!(p.items||[]).length) rows.push([p.date, storeName(p.storeId), '(sin detalle)','','','','','','',purchaseTotal(p), PAY[p.method]||'', p.source]);
      (p.items||[]).forEach(i=>{ const pr = prod(i.productId); rows.push([p.date, storeName(p.storeId), pr?pr.name:'', pr?CAT[pr.cat]?.name:'', i.qty, i.unit, i.qtyBase, i.total, i.discount||0, purchaseTotal(p), PAY[p.method]||'', p.source]); }); });
    return {filename:`compras-${todayStr()}.csv`, data:toCSV(rows)}; }
  const rows = [['fecha','producto','marca','tienda','precio','cantidad','unidad','cantidad_base','precio_normalizado','por','promo','origen']];
  products(true).forEach(p=>obsFor(p.id).forEach(o=>rows.push([o.observedAt, p.name, o.brand||'', storeName(o.storeId), o.priceCop, o.qty, o.unit, o.qtyBase, o.np?Math.round(o.np):'', DIMS[p.dim].norm, o.isPromo?'si':'no', SRC[o.source]||o.source])));
  return {filename:`precios-${todayStr()}.csv`, data:toCSV(rows)};
}
ACT.exportMenu = ()=>{ openSheet('Exportar datos', `<p class="sub">Archivos para abrir en Excel o Google Sheets, o un respaldo completo.</p><div class="list">${[['compras','<i data-i=receipt></i> Compras y productos (CSV)'],['precios','<i data-i=tag></i> Historial de precios (CSV)'],['json','<i data-i=download></i> Respaldo completo (JSON)']].map(([k,n])=>`<div class="item"><div class="grow name">${n}</div><button class="btn sm" data-a="doExport" data-k="${k}">${(RT.downloads||RT.standalone)?'Descargar':'Copiar'}</button></div>`).join('')}</div>`); };
ACT.doExport = async el=>{ const f = exportData(el.dataset.k);
  if(RT.downloads){ try{ await RT.downloads.save({filename:f.filename, data:f.data}); toast('Listo'); return; }catch(e){ if(e && e.code==='cancelled') return; } }
  if(RT.standalone){ try{ const blob = new Blob([f.data], {type: f.filename.endsWith('.json')?'application/json':'text/csv;charset=utf-8'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = f.filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast('Archivo descargado'); return; }catch(e){} }
  try{ await navigator.clipboard.writeText(f.data); toast('Copiado al portapapeles'); }catch(e){ openSheet('Copia este texto', `<textarea class="i" style="min-height:300px" readonly>${esc(f.data)}</textarea>`); } };
ACT.importData = ()=>{ const i = $('#importInput'); i.value=''; i.click(); };
$('#importInput').addEventListener('change', async e=>{ const f = e.target.files && e.target.files[0]; if(!f) return;
  let o; try{ o = JSON.parse(await f.text()); }catch(err){ return toast('El archivo no es un respaldo válido'); }
  if(o.app!=='mercado-en-casa' && o.app!=='stocka') return toast('El archivo no es un respaldo de Stocka');
  const n = COLLS.reduce((a,c)=>a+Object.keys(o[c]||{}).length, 0);
  confirmSheet('Importar respaldo', `Se agregarán o reemplazarán ${n} registros (los que tengan el mismo identificador). Lo demás se conserva.`, 'Importar', ()=>{
    COLLS.forEach(c=>Object.entries(o[c]||{}).forEach(([id,d])=>{ if(d && typeof d==='object') put(c, id, d); })); toast('Respaldo importado'); }); });
ACT.wipeAll = ()=>confirmSheet('¿Borrar todo?', 'Se borran todos los productos, listas, compras, precios y ajustes del hogar, para ambos. No se puede deshacer. Te recomendamos exportar un respaldo antes.', 'Borrar todo', ()=>{
  COLLS.forEach(c=>Object.keys(S[c]).forEach(id=>remove(c, id))); toast('Datos borrados'); }, true);

/* ================= DATOS DE EJEMPLO ================= */
ACT.loadDemo = ()=>confirmSheet('Cargar datos de ejemplo', 'Se agregan productos, compras y precios ficticios de los últimos 3 meses, marcados como ejemplo. Puedes borrarlos después en un solo paso.', 'Cargar', ()=>{
  const mk = (name, cat, dim, inv, extra) => { const ex = findDuplicate(name); if(ex) return ex.id; return createProduct(name, cat, dim, Object.assign({inv, demo:true}, extra||{})); };
  const P = {
    pollo: mk('Pechuga de pollo','proteinas','peso','hay',{usualQty:1,usualUnit:'kg'}), carne: mk('Carne molida','proteinas','peso','poco',{usualQty:500,usualUnit:'g'}),
    huevos: mk('Huevos','proteinas','conteo','hay',{usualQty:30,usualUnit:'und'}), arroz: mk('Arroz blanco','despensa','peso','hay',{usualQty:3,usualUnit:'kg'}),
    leche: mk('Leche entera','lacteos','volumen','nohay',{usualQty:1100,usualUnit:'ml'}), aceite: mk('Aceite','despensa','volumen','hay',{usualQty:1000,usualUnit:'ml'}),
    panela: mk('Panela','despensa','peso','hay',{usualQty:500,usualUnit:'g'}), papa: mk('Papa','frutas','peso','poco',{usualQty:2,usualUnit:'lb'}),
    tomate: mk('Tomate','frutas','peso','hay',{usualQty:1,usualUnit:'kg'}), papel: mk('Papel higiénico','aseo','conteo','hay',{usualQty:12,usualUnit:'und'}),
    deter: mk('Detergente en polvo','aseo','peso','hay',{usualQty:1,usualUnit:'kg'}), queso: mk('Queso campesino','lacteos','peso','hay',{usualQty:500,usualUnit:'g', expiry: (()=>{const d=new Date(); d.setDate(d.getDate()+3); return d.toISOString().slice(0,10);})()}),
  };
  const cur = monthOf(todayStr()), m1 = monthShift(cur,-1), m2 = monthShift(cur,-2); const day = (m,d)=>{ const s = m+'-'+String(d).padStart(2,'0'); return s>todayStr()?todayStr():s; };
  const buys = [
    [m2, 4, 'd1', [['arroz',3,'kg',11400],['aceite',1000,'ml',8900],['huevos',30,'und',16500],['leche',1100,'ml',4300],['panela',500,'g',2600]], 'debito'],
    [m2, 12,'plaza',[['papa',4,'lb',4800],['tomate',1,'kg',4200]], 'efectivo'],
    [m2, 20,'exito',[['pollo',1,'kg',17900],['carne',500,'g',11500],['papel',12,'und',19900],['deter',1,'kg',12900],['leche',1100,'ml',4500]], 'credito'],
    [m1, 3, 'd1', [['arroz',3,'kg',11400],['aceite',1000,'ml',9400],['huevos',30,'und',17400],['leche',1100,'ml',4400],['queso',500,'g',9800]], 'debito'],
    [m1, 14,'plaza',[['papa',4,'lb',6600],['tomate',1,'kg',3600]], 'efectivo'],
    [m1, 22,'ara', [['pollo',1,'kg',18500],['carne',500,'g',11900],['leche',2200,'ml',8900],['panela',500,'g',2600]], 'debito'],
    [cur, 2, 'd1', [['arroz',3,'kg',11400],['huevos',30,'und',17900],['leche',1100,'ml',4600],['aceite',1000,'ml',9500]], 'debito'],
  ];
  buys.forEach(([m,d,store,lines,pay])=>{ const id = uid(); const date = day(m,d);
    const items = lines.map(([k,q,u,t])=>({productId:P[k], qty:q, unit:u, qtyBase:toBase(q,u), total:t, discount:0}));
    put('purchases', id, {storeId:store, date, items, extras:0, totalPaid:sum(items.map(i=>i.total)) + (store==='exito'?500:0), method:pay, source:'manual', demo:true, history:[]});
    items.forEach(i=>put('prices', uid(), {productId:i.productId, qty:i.qty, unit:i.unit, qtyBase:i.qtyBase, priceCop:i.total, isPromo:false, storeId:store, observedAt:date, source:'compra', purchaseId:id, status:'confirmado', demo:true})); });
  put('purchases', uid(), {storeId:'barrio', date:day(cur,1), items:[], extras:0, totalPaid:12300, method:'efectivo', notes:'Pan, gaseosa y huevos', source:'manual', quick:true, demo:true, history:[]});
  put('prices', uid(), {productId:P.huevos, qty:30, unit:'und', qtyBase:30, priceCop:16900, isPromo:true, storeId:'ara', observedAt:day(m1,25), source:'manual', status:'confirmado', demo:true});
  put('prices', uid(), {productId:P.aceite, qty:3000, unit:'ml', qtyBase:3000, priceCop:25900, isPromo:false, storeId:'exito', observedAt:day(m1,10), source:'manual', brand:'Presentación 3 L', status:'confirmado', demo:true});
  addListItem(P.leche, 2200, 'ml', 'urgente'); addListItem(P.carne); addListItem(P.papa);
  if(!S.settings.budget) saveSettings({budget:1200000});
  toast('Datos de ejemplo cargados');
});
ACT.clearDemo = ()=>confirmSheet('Borrar datos de ejemplo', 'Se borran solo los productos, compras y precios marcados como ejemplo.', 'Borrar', ()=>{
  const ids = new Set(Object.entries(S.products).filter(([id,p])=>p.demo).map(([id])=>id));
  ['purchases','prices'].forEach(c=>Object.entries(S[c]).forEach(([id,d])=>{ if(d.demo) remove(c,id); }));
  Object.entries(S.list).forEach(([id,i])=>{ if(ids.has(i.productId)) remove('list', id); });
  ids.forEach(id=>remove('products', id)); toast('Ejemplos borrados'); }, true);

/* ================= EVENTOS ================= */
ACT.go = el=>{ if(sheetIsOpen()){ closeSheet(true); try{ if(history.state && history.state.stockaSheet) history.replaceState(null,''); }catch(e){} } go(el.dataset.r); };
ACT.closeSheet = ()=>closeSheet();
ACT.repMonth = el=>{ UI.repMonth = monthShift(UI.repMonth, +el.dataset.d); render(); };
document.addEventListener('click', e=>{
  const el = e.target.closest('[data-a]'); if(!el) return;
  const a = el.dataset.a; if(!ACT[a]) return;
  if(el.tagName==='A') e.preventDefault();
  if(['setInv','addToList','snooze','uncart','cartItem','delObs'].includes(a)) e.stopPropagation();
  if(!RT.canWrite && !['go','back','sheetBack','closeSheet','repMonth','invFilter','productPrices','purchase','exportMenu','doExport','monthCompare','toggleShop','catalog','priceMenu'].includes(a)){ toast('Solo lectura: pide permiso de edición a quien comparte la app.'); return; }
  RT.actCtx = {a, ds:Object.assign({}, el.dataset), inSheet: sheetIsOpen() && $('#sheet').contains(el)};
  try{ ACT[a](el, e); }catch(err){ console.error(err); toast('Algo falló: '+(err.message||err)); } finally { RT.actCtx = null; }
});
document.addEventListener('input', e=>{
  const t = e.target;
  if(t.dataset.pick){ pickerSearch(t.dataset.pick, t.value); return; }
  if(t.dataset.pe){ peInput(t); return; }
  if(t.dataset.in){ UI[t.dataset.in] = t.value; const k = t.dataset.in, pos = t.selectionStart; render(); const n = document.querySelector(`[data-in="${k}"]`); if(n){ n.focus(); try{ n.setSelectionRange(pos,pos); }catch(er){} } }
});
document.addEventListener('change', e=>{ const t = e.target; if(t.dataset.pe && (t.tagName==='SELECT' || t.type==='checkbox' || t.type==='date')) peInput(t); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && $('#sheetwrap').classList.contains('open')) closeSheet(); });

/* ================= NOMBRES DE MIEMBROS ================= */
async function resolveNames(){
  if(!RT.user || !RT.user.profiles) return;
  const ids = new Set(); Object.values(S.list).forEach(i=>i.createdBy && ids.add(i.createdBy)); Object.values(S.purchases).forEach(p=>(p.history||[]).forEach(h=>h.by && ids.add(h.by)));
  const need = [...ids].filter(id=>!(id in RT.names)); if(!need.length) return;
  try{ const ps = await RT.user.profiles(need); need.forEach(id=>{ RT.names[id] = (ps && ps[id] && ps[id].name) || ''; }); scheduleRender(); }catch(e){ need.forEach(id=>RT.names[id]=''); }
}
setInterval(resolveNames, 8000);

/* ================= PWA (solo fuera de claude.ai) ================= */
ACT.installApp = async ()=>{ const e = RT.installEvt; if(!e) return; e.prompt(); try{ await e.userChoice; }catch(er){} RT.installEvt = null; render(); };
if(RT.standalone){
  window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); RT.installEvt = e; scheduleRender(); });
  if('serviceWorker' in navigator && location.protocol==='https:') window.addEventListener('load', ()=>{ navigator.serviceWorker.register('/sw.js').catch(()=>{}); });
}

/* ================= ARRANQUE ================= */
render();
initStore().then(async ()=>{
  if(RT.sample){ try{ const l = await RT.sample.limits(); RT.imagesOK = !!(l && l.images); }catch(e){ RT.imagesOK = false; } } else RT.imagesOK = false;
  resolveNames();
});
