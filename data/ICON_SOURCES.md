# Íconos de Lineage II

La web usa un índice de imágenes originales del cliente Interlude de Lineage II, con URLs de recursos públicos del proyecto de referencia:

- Fuente de correspondencias: https://github.com/cuteshaun/lineage2-api
- Licencia del código y datos del repositorio: MIT (consultar LICENSE del proyecto)
- Titular de las imágenes y demás arte del videojuego: NCSoft y/o titulares respectivos.

No se importaron las imágenes en sí al repositorio de Carmine Forge; `data/icons.json` almacena enlaces externos y correspondencias de IDs y nombres. Los íconos se visualizan en el navegador y se usa un ícono vectorial original cuando no hay coincidencia o falla la carga.

La fuente gráfica es **Interlude**, no un catálogo específico del servidor Carmine; antes de tratar un ID o un nombre como correspondencia exacta de LU4, priorizar comprobación con el ítem correspondiente.

## Cobertura verificada del índice
Consultar `data/icons-stats.json` para las cantidades obtenidas por GitHub Actions. Las correspondencias ambiguas se excluyen de la búsqueda por nombre.

## Regenerar
`python scripts/import_item_icons.py`

GitHub Action: `.github/workflows/icons.yml`.
