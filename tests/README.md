# Testing

Este proyecto queda preparado para dos niveles de pruebas:

- Unitarias e integracion liviana con Vitest + Testing Library.
- End-to-end con Playwright.

## Comandos

```bash
pnpm test:unit
pnpm test:unit:watch
pnpm test:e2e
pnpm test:e2e:headed
pnpm test:e2e:ui
pnpm test:all
```

## Entorno E2E

Los E2E deben correr contra un Supabase de prueba, no contra datos reales.

1. Crear una copia local:

```bash
cp .env.test.example .env.test.local
```

2. Completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADMIN_EMAIL=
E2E_BASE_URL=http://127.0.0.1:3100
E2E_RUN_ADMIN_FLOWS=true
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
E2E_TEST_PRODUCT_PREFIX=TEST-E2E
```

3. Ejecutar:

```bash
pnpm test:e2e
```

## Reglas

- Los tests que escriben datos deben usar prefijo `E2E_TEST_PRODUCT_PREFIX`.
- Todo producto creado por E2E debe eliminarse al final del test.
- No activar `E2E_RUN_ADMIN_FLOWS=true` si las credenciales apuntan a Supabase real.
- Los flujos admin se omiten automaticamente si faltan credenciales de test.

## Cobertura inicial

- Unit: reordenamiento de items por drag/drop.
- Unit: campos y eventos del buscador de productos.
- E2E: carga del catalogo publico.
- E2E: login admin, listado y validacion del buscador cuando el entorno admin de test esta habilitado.
- E2E: crear producto con imagen, buscarlo, editar titulo/talle y eliminarlo.
- E2E: validacion de creacion sin imagenes.
- E2E: quitar imagen seleccionada antes de enviar el formulario.
