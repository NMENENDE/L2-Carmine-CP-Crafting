# Carmine Forge — L2 Carmine CP Crafting Command

Aplicación web de inventario y crafteo compartido para la Constant Party del servidor LU4 Carmine.

## Acceso
Publicación prevista: https://nmenende.github.io/L2-Carmine-CP-Crafting/

La aplicación utiliza el proyecto Supabase existente `carmine-forge` mediante su clave pública de navegador.

## Estado actual
- Diseño responsive oscuro con estética fantasy.
- Inicio de sesión, creación de cuenta y recuperación de contraseña con Supabase Auth.
- Creación de CP e ingreso por código de invitación.
- Visualización de integrantes, inventario, catálogo, sets y recetas verificadas.
- Alta de material mediante la función remota `adjust_material`.

## Pendientes
- Importación autorizada y validación del catálogo real de LU4, recetas e imágenes.
- Carga y administración de ubicaciones de inventario.
- Transferencias, reservas y crafteo multinivel.
- Auditoría de permisos, RLS y pruebas integrales con cuentas reales.
- Arte de Warlord y fondos licenciados u originales.

## GitHub Pages
Abrir **Settings → Pages → Build and deployment**, seleccionar **Deploy from a branch**, rama **main**, carpeta **/(root)** y guardar. Verificar después el URL publicado.

## Seguridad
Este repositorio es público. El frontend solo incluye una **publishable key** de Supabase. No subir claves secretas, contraseñas ni la `service_role` key. Los permisos de la base deben protegerse con RLS.

> Esta es una versión inicial de desarrollo; no constituye la aplicación definitiva.
