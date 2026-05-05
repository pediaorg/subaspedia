# Secrets — pendientes de cargar

Mientras Infisical no esté integrado, los secrets viven en **GitHub → Settings → Secrets and variables → Actions** del repo.

## Repository secrets requeridos

| Nombre | Para qué | De dónde sale |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | SST deploy de Workers, Pages, D1, DO | CF dashboard → My Profile → API Tokens. Permisos: `Account:Workers Scripts:Edit`, `Account:D1:Edit`, `Account:Workers KV Storage:Edit`, `Zone:Workers Routes:Edit` (si se usa CF for SaaS también `Account:SSL and Certificates:Edit`). |
| `CLOUDFLARE_ACCOUNT_ID` | Account scope de SST y wrangler | CF dashboard → cualquier dominio → sidebar "Account ID". |
| `EXPO_TOKEN` | EAS build local en CI (acceso al proyecto Expo) | `expo.dev` → Account Settings → Access Tokens. |
| `JWT_SECRET` | Firma de JWT en la API | Generar con `openssl rand -base64 48`. Distinto por entorno si se quiere; SST lo pushea por stage con `sst secret set`. |

## Cargarlos

Por UI: Settings → Secrets and variables → Actions → New repository secret.

Por CLI:

```sh
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set EXPO_TOKEN
gh secret set JWT_SECRET
```

## Migración futura a Infisical

Cuando entre Infisical, estos seis pasan a vivir ahí (envs `dev`, `preview`, `prod`). En GitHub queda solo `INFISICAL_TOKEN` (machine identity). Los workflows reemplazan el bloque `env:` por un step `infisical run --env=<env> --` que inyecta todo lo demás.

## TODO de infra (no son secrets, pero quedan pendientes)

- **Custom domains reales en Workers/Pages**: Route 53 ya recibe los CNAME desde `modules/dns.ts`, pero para que `api.casareski.com` y `app.casareski.com` realmente sirvan tráfico hace falta o (a) mover la zona a Cloudflare, o (b) configurar **Cloudflare for SaaS** + `cloudflare.CustomHostname`. Hasta entonces los Workers/Pages responden en sus `*.workers.dev` / `*.pages.dev`.
- **Durable Object handler**: `apps/api/src/durable-objects/auction.ts` sigue devolviendo 501. La infra (binding + migration v1) ya está lista.
- **Keystore Android**: APK se buildea sin firmar. Cuando salga a Play Store, sumar keystore (en Infisical) y `EAS_*` keystore vars al perfil `production` de `eas.json`.
