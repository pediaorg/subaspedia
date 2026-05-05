# subaspedia

Monorepo con la app móvil (Expo), la API (Cloudflare Workers) e infra (SST).

## Estructura

```
apps/
  api/        # Cloudflare Workers + Hono + D1
  mobile/     # Expo / React Native
packages/
  infra/      # SST (Cloudflare)
```

## Setup


```sh
pnpm setup
```
y
```sh
pnpm install
```

## Levantar el proyecto

Levantar **todo** en paralelo (api + mobile):

```sh
pnpm dev
```

O con Expo Go (necesitas correr `pnpm dev` antes):

```sh
pnpm go
```

O si necesitas Expo Go en modo tunel

```sh
pnpm go:tunnel
```

### Mobile

```sh
pnpm ios         # build/run iOS
pnpm android     # build/run Android
pnpm web         # web target
```

## Scripts globales

| Script          | Descripción                          |
| --------------- | ------------------------------------ |
| `pnpm dev`      | Levanta todos los workspaces         |
| `pnpm build`    | Build en todos los workspaces        |
| `pnpm deploy`   | Deploy en todos los workspaces       |
| `pnpm lint`     | Biome lint                           |
| `pnpm format`   | Biome format --write                 |
| `pnpm sst`      | Proxy a SST (`packages/infra`)       |
| `pnpm eas`      | Proxy a EAS (`apps/mobile`)          |
| `pnpm wrangler` | Proxy a Wrangler (`apps/api`)        |
| `pnpm db`       | Scripts de DB (`apps/api`)           |
