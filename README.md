# Stocka

**Lo que hay, lo que falta y lo que cuesta.** Stocka es una app web para que un hogar colombiano lleve su mercado: lista de compras con modo tienda, despensa, historial de lo que realmente paga en cada tienda (normalizado por kg, litro o unidad) y presupuesto del mes. Antes se llamaba *Mercado en Casa*.

## Funciones

- **Lista de mercado** con prioridades, costo estimado y *modo tienda*: tocas un producto, el último precio pagado viene precargado y la pantalla no se apaga.
- **Compras**: desde la lista, a mano, *compra rápida* (solo el total, para la tienda de barrio) o desde la foto del recibo. Se concilian contra el total del recibo sin alterar ningún precio; las correcciones quedan registradas.
- **Despensa** con tres estados (Hay / Poco / No hay). Al cerrar una compra, lo comprado vuelve a “Hay” solo.
- **Precios**: historial por producto, comparación entre meses con reglas de suficiencia (“información insuficiente”, “basado en 1 registro”), comparación por tienda y aviso de precios atípicos.
- **Presupuesto y reportes** por categoría y tienda, con proyección de fin de mes.
- **Sugerencias** “Te puede hacer falta” con reglas transparentes (sin IA).
- Unidades colombianas configurables (libra de 500 g por defecto, arroba, cubeta).
- Exportación a CSV y JSON e importación de respaldos.
- Tema claro y oscuro, diseño mobile-first y barra lateral en escritorio.

## Dos formas de usarla

| | Web (Netlify, esta carpeta `dist/`) | Artifact de claude.ai (`dist-artifact/`) |
| --- | --- | --- |
| Instalable en el celular y uso sin internet | Sí (PWA con service worker) | No |
| Dónde viven los datos | En el dispositivo (localStorage) | En la nube del artifact |
| Sincronización entre la pareja | No todavía (usar exportar/importar respaldo) | Sí |
| Lectura de fotos de etiquetas y recibos | No (ingreso manual con la foto a la vista) | Sí, con Claude |

La app detecta sola en cuál de los dos entornos corre (`window.claude`).

## Estructura

```
src/            código de la app (HTML + CSS + JS, sin frameworks)
  head.html     estilos y tokens del sistema de diseño
  1core.js      datos, unidades, cálculos, iconos
  2views.js     pantallas
  3sheets.js    hojas (formularios), lista, compras, precios
  4photo.js     lectura de fotos, ajustes, exportar, arranque, PWA
public/         manifest, service worker, iconos
brand/          logo e iconos en SVG (fuente)
design-system/  tokens.json, components.css y guía de marca
scripts/build.mjs  build sin dependencias → dist/ y dist-artifact/
```

## Desarrollo

```bash
npm run build      # genera dist/ y dist-artifact/
npm run serve      # build + servidor local en dist/
```

Requiere Node 18 o superior. No hay dependencias que instalar.

## Despliegue en Netlify

`netlify.toml` ya está configurado: comando `node scripts/build.mjs`, carpeta de publicación `dist`. Al conectar este repositorio en Netlify, cada push a `main` despliega.

## Sistema de diseño

Minimal sereno: neutros cálidos, un solo color de marca (*pine* `#2F5D50`), tipografía Manrope, 49 iconos de línea propios y el logo “la pila”. Ver `design-system/README.md`.

## Privacidad

Los datos de compras son del hogar. En la versión web nunca salen del dispositivo. En la versión de claude.ai, las fotos se envían a Claude solo para leerlas y no se guardan (Ley 1581 de 2012).

## Próximos pasos

- Sincronización entre dispositivos en la versión web (por ejemplo Supabase) y lectura de fotos mediante una función de Netlify con la clave de API del lado del servidor.
- Escáner de códigos de barras, importación del XML de factura electrónica DIAN y referencia de precios SIPSA.
