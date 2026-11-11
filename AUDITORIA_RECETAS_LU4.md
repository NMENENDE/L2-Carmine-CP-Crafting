# Auditoría de recetas LU4 — Clan Axure
Fecha: 2026-11-10

## Estado comprobado en Supabase
- 394 registros de receta en la base de la aplicación.
- 296 recetas activas con ingredientes: grado A = 136, grado B = 160.
- 98 registros pendientes/no habilitados: grado C = 90, grado A = 1, grado S = 4, sin grado = 3.
- No se habilitan recetas de grado S para esta fase del servidor.
- Se importaron 296 variantes A/B de un conjunto de datos de LU4 con identificadores originales de receta y material.
- 376 ítems se almacenaron en una tabla privada de auditoría (lu4_recipe_review), incluidos equipos, materiales y subcomponentes.
- Las recetas importadas tienen variantes separadas con su probabilidad (60, 70 o 100 %), cantidades y componentes exactos. La selección en Objetivos es obligatoria antes de confirmar un crafteo.

## Referencias
- Base de LU4 para drops/spoil: https://lu4.click/en/
- Índice de las 995 recetas: https://la2wiki.com/lu4/recipes
- Calculadora LU4: https://la2wiki.com/lu4/craft
- Fuente estructurada de B/A: https://github.com/arvy-dev/lu4-pricelist/blob/main/lu4-recipes.json
- Fichas contrastadas manualmente: https://la2wiki.com/lu4/item/sealed-dark-crystal-robe ; https://la2wiki.com/es/lu4/item/adamantite-earring ; https://la2wiki.com/lu4/item/pata

## Control de calidad realizado
1. Comparación por ID de ítem y de receta, no solo por nombres.
2. Identificación de componentes y sus cantidades; importación solo de variantes con componentes.
3. Revisión de la tabla de origen para detectar cantidades inconsistentes en IDs repetidos.
4. Unificación de recursos duplicados Gemstone A/B y Crystal A/B; los IDs antiguos sin uso se retiraron una vez verificado que no tenían inventarios ni movimientos asociados.
5. Detectada una ficha LU4 anómala: Pata 60 % repite los mismos siete materiales dos veces. Se conservó una sola entrada por material/ID, sin duplicar cantidades.
6. Inventario y objetivos conectados mediante una variante de receta seleccionada explícitamente; las recetas no verificadas no permiten descontar materiales.

## Alcance pendiente: NO ES EL CATÁLOGO COMPLETO
La referencia LU4 publica 995 variantes de todas las categorías y grados. La fuente de B/A disponible para importar contiene 296 variantes B/A; no cubre todo el repertorio C, materiales artesanales, consumibles, y otras categorías. Es incorrecto informar que se verificaron las 995 recetas individualmente.

Pendiente: revisar y cargar las 90 fichas C existentes que no tienen ingredientes verificados y los demás ítems del catálogo LU4 todavía ausentes; contrastar versiones específicas de Carmine cuando haya discrepancias con la wiki. Los objetivos sin receta verificada permanecen bloqueados para descontar stock.

## Nota de funcionamiento
El botón de confirmación solo registra un craft exitoso informado por el jugador y descuenta los componentes de la receta seleccionada en el inventario compartido de la CP, sin importar qué integrante tenga cada material. La app no observa directamente el resultado del juego. Los intentos fallidos requieren un flujo de registro separado para reflejar consumo sin producir el objeto.
