# Retro Campus Catalog

Catalogo online y panel interno para Retro Campus. El proyecto combina una experiencia publica mobile first para explorar prendas vintage con un admin privado para gestionar productos, catalogo, stock, canales de venta y calculos de precio.

## Stack

- Next.js 16 con App Router, React 19 y TypeScript.
- Supabase para autenticacion, datos, storage y politicas RLS.
- Vitest + Testing Library para unit tests.
- Playwright para pruebas end-to-end.
- Vercel para deploy productivo.

## Requisitos

- Node.js compatible con Next.js 16.
- pnpm.
- Proyecto Supabase con las migraciones de `supabase/migrations`.
- Variables de entorno locales.

## Variables de Entorno

Crear `.env.local` a partir de `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
SELLER_WHATSAPP_NUMBER=
ADMIN_EMAIL=
```

Notas:

- `NEXT_PUBLIC_SITE_URL` debe apuntar al dominio canonico de produccion, por ejemplo `https://retrocampus.store`.
- `SELLER_WHATSAPP_NUMBER` se usa para enlaces de contacto directo por producto.
- `ADMIN_EMAIL` identifica usuarios con acceso administrativo.

## Desarrollo Local

```bash
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev              # servidor local
pnpm lint             # ESLint
pnpm test:unit        # unit tests
pnpm test:e2e         # pruebas end-to-end
pnpm test:all         # unit + e2e
pnpm build            # build de produccion
pnpm start            # servir build local
```

## Estructura

```text
src/app/                         rutas publicas, admin, metadata, robots y sitemap
src/components/                  componentes presentacionales reutilizables
src/containers/                  componentes con datos, acciones y estado de UI
src/features/                    logica de dominio: productos, inventario, auth, imagenes
src/lib/                         clientes, helpers y adaptadores compartidos
supabase/migrations/             esquema, RLS y cambios de base de datos
tests/unit/                      unit tests y setup de mocks
tests/e2e/                       flujos Playwright
public/                          assets publicos de marca y fondos
```

## Convenciones

- Mantener la UI publica mobile first y optimizada para catalogo.
- Separar componentes visuales de containers con datos o side effects.
- Centralizar queries/actions por dominio dentro de `src/features`.
- No exponer rutas admin antiguas ni nombres de marca anteriores.
- Antes de mergear, correr validaciones locales y revisar el flujo publico en desktop y mobile.

## Testing

Unit tests:

```bash
pnpm test:unit
```

E2E:

```bash
cp .env.test.example .env.test.local
pnpm test:e2e
```

Los E2E deben usar un Supabase de prueba. Ver [tests/README.md](tests/README.md) para credenciales, flags y reglas de limpieza de datos.

## Deploy

El proyecto esta preparado para Vercel.

Checklist de produccion:

- Configurar `NEXT_PUBLIC_SITE_URL=https://retrocampus.store`.
- Configurar `SELLER_WHATSAPP_NUMBER` y `ADMIN_EMAIL`.
- Aplicar migraciones de Supabase antes de publicar cambios de admin o stock.
- Verificar que `retrocampus.store` sea el dominio canonico y que `www` redirija correctamente.
- Correr `pnpm test:unit`, `pnpm lint` y `pnpm build`.

## Pull Requests

Antes de abrir o mergear un PR:

- Confirmar que la rama este actualizada con `main`.
- Resolver conflictos localmente.
- Correr unit tests, lint y build.
- Revisar que no haya referencias visibles a marcas/dominios anteriores.
- Validar manualmente catalogo, detalle de producto, filtros, footer y responsive.
- Documentar cambios relevantes en el cuerpo del PR, incluyendo migraciones o variables nuevas.
