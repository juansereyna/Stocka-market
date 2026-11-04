# Stocka

**Lo que hay, lo que falta y lo que cuesta.** Stocka es la app con la que un hogar colombiano lleva su mercado: la lista, la despensa, lo que realmente paga en cada tienda (normalizado por kg, litro o unidad) y el presupuesto del mes. Antes se llamaba Mercado en Casa.

## Personalidad

Minimal y sereno. Stocka es la persona ordenada de la casa: no grita, no felicita, no usa signos de exclamación. Muestra la cifra, el cambio y la siguiente acción, y deja todo lo demás en blanco. La calma también es funcional: se usa con una mano, en un pasillo de supermercado, con mala señal.

## Contenido y voz

- Español de Colombia, tuteo cálido: “Toca un producto para pasarlo al carrito”.
- Frases cortas; verbo primero en botones: “Cerrar compra”, “Registrar precio”, “Agregar a la lista”.
- Pesos colombianos sin decimales y con punto de miles: **$ 25.000**. Fechas **DD/MM/AAAA**. Unidades: g, kg, ml, L, und, lb (libra de plaza, configurable).
- Honestidad de datos: si no hay suficiente información se dice “Información insuficiente” o “basado en 1 registro”. Nunca se inventa una tendencia.
- Las lecturas por foto se presentan como ayuda: “Revisa lo leído”, nunca “Listo”.
- Sin emojis en la interfaz: los iconos del set cumplen ese papel.

| Sí | No |
| --- | --- |
| Diferencia de $ 700 frente al recibo. No se modificó ningún precio. | ¡Ups! Algo no cuadra 😅 |
| Te puede hacer falta | ¡No olvides comprar! |
| Información insuficiente | 0% de variación |

## Fundamentos visuales

- **Color:** casi todo es neutro (`surface`, `surface-raised`, `ink`, `ink-muted`). Un solo color de marca, **pine** (#2F5D50), para la acción principal, el estado activo y “Hay”. Los tres estados de la despensa usan `pine`, `amber` y `rose`, siempre acompañados de texto o un punto, nunca solo color. `slate` es para información y lecturas por foto. Hay tema claro y oscuro; el oscuro se activa con la preferencia del sistema.
- **Tipografía:** una sola familia, **Manrope** (Google Fonts), con cifras tabulares. Escala corta: display 30 para montos, title 24, heading 18, body 16, meta 13, overline 12. Los campos nunca bajan de 16px.
- **Forma:** radios de la familia del logo: radius-md 12 en controles, radius-lg 16 en tarjetas y listas, radius-xl 24 en hojas, pill en insignias.
- **Profundidad:** bordes de 1px (`line`), no sombras. La única sombra (`shadow-sheet`) es la de las hojas inferiores.
- **Espacio:** rejilla de 4px; margen lateral de 16px en celular; filas de 64px; objetivos táctiles de 44–48px; acciones principales en la mitad inferior de la pantalla.
- **Movimiento:** breve y funcional (150–200 ms): las hojas suben, los avisos bajan desde arriba. Nada decorativo.

## Iconografía

Set propio de 49 iconos de línea de 24px y trazo 1,75 (ver **Assets → Icons**). Una categoría = un icono dentro de un mosaico `sk-tile`. Iconos con `currentColor`, en ink-muted si acompañan y en pine si están activos.

## Logo

La pila: seis cubos apilados sobre un estante, dentro del mosaico pine. Ver **Assets → Logos** para versiones y reglas.

## Cómo usar este sistema

Los colores son tokens semánticos con tema claro y oscuro (`tokens.json`). Los componentes son clases CSS con prefijo `sk-` en `components/bundle.css`, sin dependencia de React. `components/bundle.js` expone `window.Stocka.icon(nombre)` con el set de iconos. Las fichas de componentes describen cuándo usar cada uno.
