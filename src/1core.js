"use strict";
/* ================= CONSTANTES ================= */
const CATS = [
  {id:'proteinas', name:'Proteínas', ic:'<i data-i=cat-proteinas></i>', volatile:true},
  {id:'frutas', name:'Frutas y verduras', ic:'<i data-i=cat-frutas></i>', volatile:true},
  {id:'lacteos', name:'Lácteos y refrigerados', ic:'<i data-i=cat-lacteos></i>'},
  {id:'despensa', name:'Despensa', ic:'<i data-i=cat-despensa></i>'},
  {id:'panaderia', name:'Panadería y cereales', ic:'<i data-i=cat-panaderia></i>'},
  {id:'bebidas', name:'Bebidas', ic:'<i data-i=cat-bebidas></i>'},
  {id:'aseo', name:'Aseo del hogar', ic:'<i data-i=cat-aseo></i>'},
  {id:'higiene', name:'Higiene personal', ic:'<i data-i=cat-higiene></i>'},
  {id:'mascotas', name:'Mascotas', ic:'<i data-i=cat-mascotas></i>'},
  {id:'otros', name:'Otros', ic:'<i data-i=cat-otros></i>'},
];
const CAT = Object.fromEntries(CATS.map(c=>[c.id,c]));
const DIMS = {peso:{name:'Peso', base:'g', norm:'kg', mult:1000}, volumen:{name:'Volumen', base:'ml', norm:'L', mult:1000}, conteo:{name:'Unidades', base:'und', norm:'und', mult:1}};
const STORE_TYPES = {cadena:'Cadena', discount:'Discount', barrio:'Tienda de barrio', plaza:'Plaza de mercado', fruver:'Fruver', domicilio:'Domicilio / app', otra:'Otra'};
const STORES_DEFAULT = [
  ['d1','D1','discount'],['ara','Ara','discount'],['isimo','Ísimo','discount'],['exito','Éxito','cadena'],['carulla','Carulla','cadena'],
  ['olimpica','Olímpica','cadena'],['jumbo','Jumbo','cadena'],['metro','Metro','cadena'],['alkosto','Alkosto','cadena'],['makro','Makro','cadena'],
  ['pricesmart','PriceSmart','cadena'],['barrio','Tienda de barrio','barrio'],['plaza','Plaza de mercado','plaza'],['fruver','Fruver','fruver'],['domicilio','Domicilio / app','domicilio'],['otra','Otra','otra']
].map(([id,name,type])=>({id,name,type,builtin:true}));
const PAY = {efectivo:'Efectivo', debito:'Débito', credito:'Crédito', nequi:'Nequi / Daviplata', otro:'Otro'};
const LOCS = {nevera:'Nevera', congelador:'Congelador', despensa:'Despensa', bano:'Baño', aseo:'Zona de aseo', otra:'Otra'};
const SRC = {compra:'Compra', manual:'Manual', foto_etiqueta:'Foto etiqueta', foto_recibo:'Foto recibo', importado:'Importado'};
// [nombre, categoría, dimensión, cantidad habitual, unidad]
const STARTER = [
  ['Pechuga de pollo','proteinas','peso',1,'kg'],['Carne molida','proteinas','peso',500,'g'],['Carne de res para asar','proteinas','peso',1,'kg'],['Lomo de cerdo','proteinas','peso',1,'kg'],['Huevos','proteinas','conteo',30,'und'],['Filete de pescado','proteinas','peso',500,'g'],['Salchichas','proteinas','peso',250,'g'],['Jamón','proteinas','peso',250,'g'],
  ['Papa','frutas','peso',1,'kg'],['Tomate','frutas','peso',1,'kg'],['Cebolla cabezona','frutas','peso',1,'kg'],['Cebolla larga','frutas','conteo',1,'und'],['Zanahoria','frutas','peso',500,'g'],['Plátano','frutas','conteo',4,'und'],['Banano','frutas','conteo',6,'und'],['Aguacate','frutas','conteo',2,'und'],['Limón','frutas','peso',500,'g'],['Lechuga','frutas','conteo',1,'und'],['Ajo','frutas','conteo',1,'und'],['Cilantro','frutas','conteo',1,'und'],['Manzana','frutas','conteo',4,'und'],['Mora','frutas','peso',500,'g'],
  ['Leche entera','lacteos','volumen',1100,'ml'],['Queso campesino','lacteos','peso',500,'g'],['Queso tajado','lacteos','peso',250,'g'],['Yogur','lacteos','volumen',1000,'ml'],['Mantequilla','lacteos','peso',250,'g'],['Arepas','lacteos','conteo',10,'und'],
  ['Arroz blanco','despensa','peso',3,'kg'],['Pasta','despensa','peso',500,'g'],['Fríjol','despensa','peso',500,'g'],['Lenteja','despensa','peso',500,'g'],['Aceite','despensa','volumen',1000,'ml'],['Azúcar','despensa','peso',1,'kg'],['Panela','despensa','peso',500,'g'],['Sal','despensa','peso',500,'g'],['Café','despensa','peso',500,'g'],['Chocolate de mesa','despensa','peso',250,'g'],['Harina de maíz (arepa)','despensa','peso',1,'kg'],['Atún en lata','despensa','peso',160,'g'],['Salsa de tomate','despensa','peso',400,'g'],['Mayonesa','despensa','peso',400,'g'],
  ['Pan tajado','panaderia','peso',500,'g'],['Avena','panaderia','peso',500,'g'],['Cereal','panaderia','peso',500,'g'],
  ['Agua','bebidas','volumen',6000,'ml'],['Jugo','bebidas','volumen',1000,'ml'],
  ['Papel higiénico','aseo','conteo',12,'und'],['Detergente en polvo','aseo','peso',1,'kg'],['Lavaloza','aseo','peso',500,'g'],['Suavizante','aseo','volumen',1000,'ml'],['Blanqueador','aseo','volumen',1000,'ml'],['Bolsas de basura','aseo','conteo',10,'und'],['Esponjas','aseo','conteo',3,'und'],['Servilletas','aseo','conteo',1,'und'],
  ['Jabón de baño','higiene','conteo',3,'und'],['Crema dental','higiene','peso',100,'g'],['Champú','higiene','volumen',400,'ml'],['Desodorante','higiene','conteo',1,'und'],
  ['Comida para mascota','mascotas','peso',2,'kg'],
];

/* ================= UTILIDADES ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const nowISO = () => new Date().toISOString();
const todayStr = () => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const fmtDate = s => { if(!s) return ''; const [y,m,d] = s.slice(0,10).split('-'); return `${d}/${m}/${y}`; };
const monthOf = s => (s||'').slice(0,7);
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const monthName = k => { if(!k) return ''; const [y,m] = k.split('-'); return MONTHS[+m-1] + ' ' + y; };
const monthShift = (k, n) => { let [y,m] = k.split('-').map(Number); m += n; while(m<1){m+=12;y--;} while(m>12){m-=12;y++;} return y+'-'+String(m).padStart(2,'0'); };
const daysBetween = (a,b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const COPF = new Intl.NumberFormat('es-CO', {style:'currency', currency:'COP', maximumFractionDigits:0});
const cop = n => (n==null || isNaN(n)) ? '—' : COPF.format(Math.round(n));
const numF = new Intl.NumberFormat('es-CO', {maximumFractionDigits:2});
const fnum = n => numF.format(n);
const pct = n => (n>0?'+':'') + numF.format(Math.round(n*100)/100) + '%';
const parseMoney = v => { if(v==null) return null; const s = String(v).replace(/[^\d]/g,''); return s ? parseInt(s,10) : null; };
const parseQty = v => { if(v==null || v==='') return null; const s = String(v).trim().replace(/\s/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.'); const n = parseFloat(s); return isNaN(n) ? null : n; };
const norm = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9ñ ]/g,' ').replace(/\s+/g,' ').trim();
const median = arr => { if(!arr.length) return null; const a = [...arr].sort((x,y)=>x-y); const m = Math.floor(a.length/2); return a.length%2 ? a[m] : (a[m-1]+a[m])/2; };
const sum = arr => arr.reduce((a,b)=>a+(b||0),0);
function toast(msg){ const t = document.createElement('div'); t.className='toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 2600); }


/* ================= ICONOS (sistema Stocka) ================= */
const ICONS = {
  // navegación
  home: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9v10h12V9"/><path d="M10 19v-5h4v5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  pantry: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16"/><path d="M8 6h3M8 12h5M8 18h2"/>',
  tag: '<path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8a1.5 1.5 0 0 1 0 2.1l-6.9 6.9a1.5 1.5 0 0 1-2.1 0z"/><circle cx="8" cy="8" r="1.5"/>',
  receipt: '<path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  chart: '<path d="M4 20h16"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  more: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  // acciones
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m20.5 16-5-5-8.5 8.5"/>',
  pencil: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14 7 3 3"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  cart: '<path d="M3 4h2.5l2 11h10.5l2-8H6.5"/><circle cx="9" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  'chevron-left': '<path d="m14.5 6-6 6 6 6"/>',
  'chevron-right': '<path d="m9.5 6 6 6-6 6"/>',
  trash: '<path d="M4.5 7h15M10 4h4M6.5 7l1 13h9l1-13"/><path d="M10 11v5M14 11v5"/>',
  store: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5V20h13v-8.5"/><path d="M10 20v-4.5h4V20"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h12l-3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H5l3 3"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/>',
  upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M5 19h14"/>',
  share: '<circle cx="17" cy="6" r="2.5"/><circle cx="7" cy="12" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="m9.2 10.8 5.6-3.4M9.2 13.2l5.6 3.4"/>',
  sparkle: '<path d="M12 4c.6 3.9 2.1 5.4 6 6-3.9.6-5.4 2.1-6 6-.6-3.9-2.1-5.4-6-6 3.9-.6 5.4-2.1 6-6z"/>',
  // estado
  'arrow-up': '<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/>',
  'arrow-down': '<path d="M12 5v14M6.5 13.5 12 19l5.5-5.5"/>',
  equal: '<path d="M6 9.5h12M6 14.5h12"/>',
  alert: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><circle cx="12" cy="16.8" r=".6" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 18.5z"/>',
  'cloud-off': '<path d="M9.5 6.3A6 6 0 0 1 17.8 11a3.8 3.8 0 0 1 2.1 6.3M17 18.5H7a4.5 4.5 0 0 1-.9-8.9"/><path d="m3 3 18 18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M16 14.2a4.6 4.6 0 0 1 4.5 4.8"/>',
  shield: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  // servicios del hogar
  'svc-agua': '<path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10z"/><path d="M8.5 14.5c1.2.8 2.3.8 3.5 0s2.3-.8 3.5 0"/>',
  'svc-luz': '<path d="M9 17.5h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2v1.5h5V16c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  'svc-gas': '<path d="M12 21a6 6 0 0 0 6-6c0-4-3-6.5-4-10-2 1.5-3 3.5-3 5.5-1-.5-1.8-1.5-2-2.5C7.6 10 6 12.3 6 15a6 6 0 0 0 6 6z"/><path d="M12 21a2.5 2.5 0 0 0 2.5-2.5c0-1.6-1.3-2.5-2.5-4-1.2 1.5-2.5 2.4-2.5 4A2.5 2.5 0 0 0 12 21z"/>',
  'svc-internet': '<path d="M3 9.5a13 13 0 0 1 18 0"/><path d="M6 13a8.5 8.5 0 0 1 12 0"/><path d="M9 16.5a4 4 0 0 1 6 0"/><circle cx="12" cy="19.5" r=".8" fill="currentColor"/>',
  'svc-tv': '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="m9 3 3 3 3-3M8 21h8"/>',
  'svc-admin': '<path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M15 10h3a1 1 0 0 1 1 1v10M3 21h18"/><path d="M8.5 8h3M8.5 12h3M8.5 16h3"/>',
  'svc-arriendo': '<circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16.5 6.5l2 2M14.5 8.5l2 2"/>',
  'svc-aseo': '<path d="M4.5 7h15M10 4h4M6.5 7l1 13h9l1-13"/><path d="m10 12 2-2 2 2M12 10v6"/>',
  'svc-otro': '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12h8M12 8v8"/>',
  // perfil
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor"/>',
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  logout: '<path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15"/>',
  backspace: '<path d="M8.5 5H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8.5L3 12z"/><path d="m11 9.5 5 5M16 9.5l-5 5"/>',
  wallet: '<path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2 2 2 0 0 1 2-2h11"/><circle cx="16" cy="14" r="1.2" fill="currentColor"/>',
  // categorías
  'cat-proteinas': '<path d="M3 12c2.8-4.2 8.8-6 13-2.2L20 7v10l-4-2.8C11.8 18 5.8 16.2 3 12z"/><circle cx="8" cy="11.2" r=".7" fill="currentColor"/>',
  'cat-frutas': '<path d="M12 8c-4 0-7 2.6-7 6.5S8 21 12 21s7-2.6 7-6.5S16 8 12 8z"/><path d="M12 8V5"/><path d="M12 6c1-2 3-3 5-2.5-.5 2-2.5 3-5 2.5z"/>',
  'cat-lacteos': '<path d="M8 3h8v3l2 3v12H6V9l2-3z"/><path d="M6 9h12"/><path d="M10 14h4"/>',
  'cat-despensa': '<rect x="5.5" y="7.5" width="13" height="13.5" rx="3"/><rect x="7" y="3.5" width="10" height="4" rx="1"/><path d="M5.5 12.5h13"/>',
  'cat-panaderia': '<path d="M4 11.5a4 4 0 0 1 3-6.5h10a4 4 0 0 1 3 6.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9 9v2M12 8.5v2.5M15 9v2"/>',
  'cat-bebidas': '<path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/><path d="M8 13h8"/>',
  'cat-aseo': '<path d="M8 9h6l1 2v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-9z"/><path d="M9 9V5h4l3 2"/><path d="M18 4.5v.01M20 6.5v.01M18 8.5v.01"/>',
  'cat-higiene': '<path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>',
  'cat-mascotas': '<circle cx="7" cy="10" r="1.7"/><circle cx="10.5" cy="6.5" r="1.7"/><circle cx="14.5" cy="6.5" r="1.7"/><circle cx="18" cy="10" r="1.7"/><path d="M12 12c-2.7 0-5 3.1-5 5.2 0 1.6 1.2 2.3 2.6 2.3 1 0 1.6-.5 2.4-.5s1.4.5 2.4.5c1.4 0 2.6-.7 2.6-2.3 0-2.1-2.3-5.2-5-5.2z"/>',
  'cat-otros': '<path d="M4 8 12 4l8 4v8l-8 4-8-4z"/><path d="m4 8 8 4 8-4M12 12v8"/>',
};
function svgIcon(n){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[n]||'')+'</svg>'; }
const I = n => `<i data-i=${n}>${svgIcon(n)}</i>`;
function hydrateIcons(root){ (root||document).querySelectorAll('i[data-i]:empty').forEach(el=>{ el.innerHTML = svgIcon(el.getAttribute('data-i')); }); }
new MutationObserver(()=>hydrateIcons()).observe(document.documentElement, {childList:true, subtree:true});
const LOGO_MARK = (s=32) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="var(--pine)"/><g fill="var(--on-pine)"><rect x="17.5" y="36" width="9" height="9" rx="2.5"/><rect x="27.5" y="36" width="9" height="9" rx="2.5"/><rect x="37.5" y="36" width="9" height="9" rx="2.5"/><rect x="22.5" y="26" width="9" height="9" rx="2.5"/><rect x="32.5" y="26" width="9" height="9" rx="2.5"/><rect x="27.5" y="16" width="9" height="9" rx="2.5"/><rect x="14" y="47" width="36" height="3" rx="1.5"/></g></svg>`;
const LOGO_WORD = (h=22) => `<svg height="${h}" viewBox="-3 4 155 40" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-label="Stocka" role="img"><path d="M18 21.5C16 18.8 13.5 18 10 18 5 18 2 20.5 2 23.8 2 27.5 6 28.6 10 29.2 14 29.8 18 31 18 34.5 18 38 14.8 40 10 40 6.2 40 3.4 38.8 1.5 36.5"/><path d="M30 9v25c0 4 2 6 6 6M24 18h13"/><circle cx="53" cy="29" r="11"/><path d="M88.8 21.2A11 11 0 1 0 88.8 36.8"/><path d="M100 8v32M117 18l-16 13M107 26l11 14"/><circle cx="135" cy="29" r="11"/><path d="M146 18v22"/></svg>`;
const catTile = (c, cls) => `<span class="tile ${cls||''}">${(CAT[c]||CAT.otros).ic}</span>`;

/* ================= UNIDADES ================= */
function libraG(){ return S.settings.libraG || 500; }
function cubetaN(){ return S.settings.cubeta || 30; }
function unitsFor(dim){
  if(dim==='peso') return [['g','g'],['kg','kg'],['lb','libra'],['arroba','arroba']];
  if(dim==='volumen') return [['ml','ml'],['L','litro'],['cc','cc']];
  return [['und','unidad'],['docena','docena'],['cubeta','cubeta']];
}
function unitFactor(u){
  switch(u){ case 'g': case 'ml': case 'cc': case 'und': return 1; case 'kg': case 'L': return 1000;
    case 'lb': return libraG(); case 'arroba': return libraG()*25; case 'docena': return 12; case 'cubeta': return cubetaN(); }
  return 1;
}
const LOCAL_UNITS = ['lb','arroba'];
function toBase(qty, unit){ if(qty==null) return null; return Math.round(qty * unitFactor(unit)); }
function unitLabel(u){ return ({lb:'lb', arroba:'@', docena:'doc', cubeta:'cubeta', und:'und'})[u] || u; }
function fmtBase(base, dim){
  if(base==null) return '—';
  if(dim==='peso') return base>=1000 ? fnum(base/1000)+' kg' : fnum(base)+' g';
  if(dim==='volumen') return base>=1000 ? fnum(base/1000)+' L' : fnum(base)+' ml';
  return fnum(base)+' und';
}
function fmtQtyU(q,u){ return q==null ? '' : fnum(q)+' '+unitLabel(u); }
// precio normalizado: COP por kg / L / unidad
function normPrice(price, base, dim){ if(!price || !base) return null; return price / base * DIMS[dim||'conteo'].mult; }
function normLabel(dim){ return '/'+DIMS[dim||'conteo'].norm; }
function defaultUnit(dim){ return dim==='peso' ? 'g' : dim==='volumen' ? 'ml' : 'und'; }
function guessDim(unit){ if(['g','kg','lb','arroba'].includes(unit)) return 'peso'; if(['ml','L','cc'].includes(unit)) return 'volumen'; return 'conteo'; }
function normUnitText(u){ const s = norm(u); if(!s) return null;
  if(/^(kg|kilo|kilos|kilogramo)/.test(s)) return 'kg'; if(/^(g|gr|grs|gramo)/.test(s)) return 'g'; if(/^(lb|libra)/.test(s)) return 'lb';
  if(/^(l|lt|lts|litro)$/.test(s) || /^litro/.test(s)) return 'L'; if(/^(ml|mililitro)/.test(s)) return 'ml'; if(/^cc/.test(s)) return 'cc';
  if(/^docena/.test(s)) return 'docena'; if(/^cubeta/.test(s)) return 'cubeta'; return 'und'; }

/* ================= ALMACÉN DE DATOS ================= */
const COLLS = ['products','stores','list','purchases','prices','config','services','bills'];
const S = {products:{}, stores:{}, list:{}, purchases:{}, prices:{}, config:{}, services:{}, bills:{}, settings:{}};
const RT = {standalone: typeof window.claude === 'undefined', installEvt:null, db:null, user:null, sample:null, downloads:null, me:null, mode:'cargando', loaded:{}, timer:null, stale:false, canWrite:true, names:{}};
const writeChains = {};
function localKey(){ return 'mec_local_v1'; }
function saveLocal(){ try{ const o={}; COLLS.forEach(c=>o[c]=S[c]); localStorage.setItem(localKey(), JSON.stringify(o)); }catch(e){} }
function loadLocal(){ try{ const o = JSON.parse(localStorage.getItem(localKey())||'{}'); COLLS.forEach(c=>{ S[c] = o[c] || {}; }); }catch(e){} }
function refreshSettings(){ S.settings = Object.assign({householdName:'Nuestro hogar', budget:0, budgetCat:{}, libraG:500, cubeta:30, hiddenStores:[], storeMode:null}, (S.config.main||{})); }

async function initStore(){
  let db = null;
  if(RT.standalone){ RT.mode='local'; loadLocal(); refreshSettings(); { const cp = currentProfile(); if(cp) RT.me = cp.id; } COLLS.forEach(c=>RT.loaded[c]=true); try{ navigator.storage && navigator.storage.persist && navigator.storage.persist(); }catch(e){} render(); return; }
  try { db = await claude.use('db'); } catch(e){ db = null; }
  try { RT.user = await claude.use('user'); } catch(e){}
  try { RT.sample = await claude.use('sample'); } catch(e){}
  try { RT.downloads = await claude.use('downloads'); } catch(e){}
  if(RT.user){ try{ RT.me = await RT.user.id(); }catch(e){} RT.claudeId = RT.me; try{ const c = RT.user.can && await RT.user.can('data.write'); if(c===false) RT.canWrite=false; }catch(e){} }
  if(!db){ RT.mode='local'; loadLocal(); refreshSettings(); COLLS.forEach(c=>RT.loaded[c]=true); if(RT.standalone){ try{ navigator.storage && navigator.storage.persist && navigator.storage.persist(); }catch(e){} } render(); return; }
  RT.db = db; RT.mode='nube';
  RT.timer = setTimeout(()=>{ RT.stale = true; render(); }, 10000);
  COLLS.forEach(c=>{
    db.collection(c).onSnapshot(snap=>{
      const o = {}; snap.docs.forEach(d=>{ o[d.id] = d.data(); });
      S[c] = o; if(!snap.metadata.fromCache){ RT.loaded[c]=true; }
      if(COLLS.every(k=>RT.loaded[k])){ clearTimeout(RT.timer); RT.stale=false; }
      if(c==='config'){ refreshSettings(); const cp = currentProfile(); if(cp) RT.me = cp.id; }
      scheduleRender();
    }, err=>{ console.warn('db', c, err); RT.loaded[c]=true; if(err.code==='revoked'){ RT.mode='sin acceso'; } scheduleRender(); });
  });
}
function put(coll, id, obj){
  const prev = S[coll][id];
  const doc = Object.assign({}, obj, {updatedAt: nowISO()});
  if(!prev){ doc.createdAt = doc.createdAt || nowISO(); if(RT.me) doc.createdBy = doc.createdBy || RT.me; }
  if(RT.me) doc.updatedBy = RT.me;
  Object.keys(doc).forEach(k=>{ if(doc[k]===undefined) delete doc[k]; });
  S[coll] = Object.assign({}, S[coll], {[id]: doc});
  if(coll==='config') refreshSettings();
  if(RT.db){
    const key = coll+'/'+id;
    writeChains[key] = (writeChains[key]||Promise.resolve()).then(()=>RT.db.collection(coll).doc(id).set(doc)).catch(e=>{
      console.warn('write', e); if(e && e.code==='invalid_argument'){ RT.canWrite=false; toast('No tienes permiso para modificar estos datos.'); }
      else if(e && e.code==='quota_exceeded'){ toast('Se llenó el espacio de la app. Borra datos antiguos o de ejemplo.'); }
      else toast('No se pudo guardar en la nube. Revisa tu conexión.');
    });
  } else saveLocal();
  scheduleRender();
  return doc;
}
function patch(coll, id, fields){ const cur = S[coll][id]; if(!cur) return; return put(coll, id, Object.assign({}, cur, fields)); }
function remove(coll, id){
  const o = Object.assign({}, S[coll]); delete o[id]; S[coll] = o;
  if(RT.db){ const key = coll+'/'+id; writeChains[key] = (writeChains[key]||Promise.resolve()).then(()=>RT.db.collection(coll).doc(id).delete()).catch(e=>console.warn(e)); }
  else saveLocal();
  scheduleRender();
}
function saveSettings(fields){ put('config','main', Object.assign({}, S.config.main||{}, fields)); }

/* ================= CONSULTAS ================= */
const products = (all) => Object.entries(S.products).map(([id,p])=>Object.assign({id},p)).filter(p=>all || !p.archived).sort((a,b)=>a.name.localeCompare(b.name,'es'));
const prod = id => id && S.products[id] ? Object.assign({id}, S.products[id]) : null;
function allStores(includeHidden){
  const hidden = S.settings.hiddenStores || [];
  const custom = Object.entries(S.stores).map(([id,s])=>Object.assign({id},s));
  return [...STORES_DEFAULT, ...custom].filter(s=>includeHidden || !hidden.includes(s.id));
}
function storeName(id){ const s = allStores(true).find(x=>x.id===id); return s ? s.name : (id ? 'Tienda' : 'Sin tienda'); }
function storeOptions(sel){ return '<option value="">Elegir tienda…</option>' + allStores().map(s=>`<option value="${esc(s.id)}" ${s.id===sel?'selected':''}>${esc(s.name)}</option>`).join(''); }
const purchases = () => Object.entries(S.purchases).map(([id,p])=>Object.assign({id},p)).filter(p=>!p.void).sort((a,b)=>(b.date||'').localeCompare(a.date||'') || (b.createdAt||'').localeCompare(a.createdAt||''));
function itemsTotal(p){ return sum((p.items||[]).map(i=>(i.total||0) - (i.discount||0))); }
function purchaseTotal(p){ return p.totalPaid!=null ? p.totalPaid : itemsTotal(p) + (p.extras||0); }
// observaciones de precio válidas (con precio normalizado calculado)
function obsFor(productId){
  const p = prod(productId); const dim = p ? p.dim : 'conteo';
  return Object.entries(S.prices).map(([id,o])=>Object.assign({id},o))
    .filter(o=>o.productId===productId && (o.status||'confirmado')==='confirmado')
    .map(o=>Object.assign(o,{np: normPrice(o.priceCop, o.qtyBase, dim)}))
    .sort((a,b)=>(a.observedAt||'').localeCompare(b.observedAt||'') || (a.createdAt||'').localeCompare(b.createdAt||''));
}
function whoName(id){ if(!id) return ''; const p = typeof profileById==='function' ? profileById(id) : null; return (p && p.name) || RT.names[id] || ''; }
function lastObs(productId){ const o = obsFor(productId); return o.length ? o[o.length-1] : null; }
function lastPaidUnit(productId){ // último precio pagado (total de línea) y su cantidad
  const l = lastObs(productId); return l ? {price:l.priceCop, qtyBase:l.qtyBase, qty:l.qty, unit:l.unit, np:l.np, storeId:l.storeId, date:l.observedAt, brand:l.brand} : null;
}
function estimateItem(it){ // costo estimado para un ítem de la lista
  const p = prod(it.productId); if(!p) return null; const l = lastObs(p.id); if(!l || !l.np) return null;
  const base = it.qty!=null ? toBase(it.qty, it.unit||defaultUnit(p.dim)) : l.qtyBase; if(!base) return null;
  return l.np * base / DIMS[p.dim].mult;
}
// historial de compras por producto (fecha, cantidad base)
function buyHistory(productId){
  const r = [];
  purchases().forEach(pu=>(pu.items||[]).forEach(i=>{ if(i.productId===productId) r.push({date:pu.date, qtyBase:i.qtyBase||0}); }));
  return r.sort((a,b)=>a.date.localeCompare(b.date));
}
function monthSpend(mk){ return sum(purchases().filter(p=>monthOf(p.date)===mk).map(purchaseTotal)); }
function spendByCat(mk){
  const r = {}; let detail = 0;
  purchases().filter(p=>monthOf(p.date)===mk).forEach(p=>{
    (p.items||[]).forEach(i=>{ const pr = prod(i.productId); const c = pr ? pr.cat : 'otros'; const v = (i.total||0)-(i.discount||0); r[c]=(r[c]||0)+v; detail+=v; });
    const rest = purchaseTotal(p) - itemsTotal(p); if(rest>0){ r._sin = (r._sin||0) + rest; }
  });
  return r;
}

/* ================= COMPARACIÓN DE PRECIOS (reglas de suficiencia) ================= */
function compareMonths(productId, m1, m2, opts={}){
  const p = prod(productId); if(!p) return null;
  let obs = obsFor(productId).filter(o=>o.np!=null);
  if(opts.noPromo) obs = obs.filter(o=>!o.isPromo);
  const a = obs.filter(o=>monthOf(o.observedAt)===m1), b = obs.filter(o=>monthOf(o.observedAt)===m2);
  const res = {m1, m2, n1:a.length, n2:b.length, p1:median(a.map(o=>o.np)), p2:median(b.map(o=>o.np)), dim:p.dim, notes:[]};
  if(!a.length || !b.length){ res.status='insuficiente'; res.reason = 'No hay registros comparables en '+(!a.length?monthName(m1):monthName(m2))+'.'; return res; }
  res.diff = res.p2 - res.p1; res.pct = res.p1 ? res.diff / res.p1 * 100 : 0;
  res.status = Math.abs(res.pct) <= 1 ? 'igual' : res.diff>0 ? 'sube' : 'baja';
  if(a.length===1 || b.length===1) res.notes.push('basado en 1 registro');
  const brands = new Set([...a,...b].map(o=>norm(o.brand||''))); if(brands.size>1) res.notes.push('mezcla marcas');
  const stores = new Set([...a,...b].map(o=>o.storeId||'')); if(stores.size>1) res.notes.push('mezcla tiendas');
  if([...a,...b].some(o=>o.isPromo)) res.notes.push('incluye promociones');
  if(CAT[p.cat] && CAT[p.cat].volatile && (a.length<3 || b.length<3)) res.notes.push('perecedero: puede variar de una semana a otra; no es tendencia');
  return res;
}
function trendBadge(r){
  if(!r || r.status==='insuficiente') return '<span class="chip grey">Información insuficiente</span>';
  if(r.status==='igual') return '<span class="chip grey">Sin variación</span>';
  if(r.status==='sube') return `<span class="chip bad"><i data-i=arrow-up></i> ${pct(r.pct)}</span>`;
  return `<span class="chip"><i data-i=arrow-down></i> ${pct(r.pct)}</span>`;
}

/* ================= SUGERENCIAS ================= */
function suggestions(){
  const out = []; const listIds = new Set(Object.values(S.list).map(i=>i.productId)); const today = todayStr();
  const snooze = S.settings.snooze || {};
  products().forEach(p=>{
    if(listIds.has(p.id)) return;
    if(snooze[p.id] && snooze[p.id] > today) return;
    if(p.inv==='nohay'){ out.push({p, why:`Marcaste ${p.name.toLowerCase()} como “No hay”.`, prio:0}); return; }
    if(p.inv==='poco'){ out.push({p, why:`Marcaste ${p.name.toLowerCase()} como “Poco”.`, prio:1}); return; }
    const h = buyHistory(p.id);
    if(h.length>=3){
      const iv = []; for(let i=1;i<h.length;i++){ const d = daysBetween(h[i-1].date, h[i].date); if(d>0) iv.push(d); }
      if(iv.length>=2){
        let exp = median(iv); const mq = median(h.map(x=>x.qtyBase).filter(Boolean)); const lq = h[h.length-1].qtyBase;
        if(mq && lq) exp = exp * Math.min(3, Math.max(.5, lq/mq));
        const since = daysBetween(h[h.length-1].date, today);
        const markedRecent = p.invAt && daysBetween(p.invAt.slice(0,10), today) < exp*0.5 && p.inv==='hay';
        if(since > exp*2) out.push({p, why:`Hace ${since} días no lo compras (lo usual es cada ${Math.round(exp)}). ¿Ya no lo compran?`, prio:3, stale:true});
        else if(since >= exp*0.8 && !markedRecent) out.push({p, why:`Lo compran cada ~${Math.round(exp)} días (según ${h.length} compras). La última fue hace ${since}.`, prio:2});
      }
    }
  });
  return out.sort((a,b)=>a.prio-b.prio);
}

/* ================= COINCIDENCIAS DE CATÁLOGO ================= */
function matchProducts(text, limit=6){
  const q = norm(text); if(!q) return [];
  const qt = q.split(' ').filter(t=>t.length>1);
  return products().map(p=>{
    const n = norm(p.name); let s = 0;
    if(n===q) s+=100; if(n.startsWith(q)) s+=40; if(n.includes(q)) s+=25;
    qt.forEach(t=>{ if(n.includes(t)) s+=10; else if(n.split(' ').some(w=>w.startsWith(t.slice(0,3)) && t.length>=3)) s+=4; });
    (p.aliases||[]).forEach(a=>{ if(norm(a)===q) s+=120; });
    return {p,s};
  }).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,limit).map(x=>x.p);
}
function findDuplicate(name){ const n = norm(name); return products(true).find(p=>norm(p.name)===n) || null; }
refreshSettings();
