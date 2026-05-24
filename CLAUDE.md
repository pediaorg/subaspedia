# Subaspedia — Bitácora de trabajo (CLAUDE.md)

> Este archivo se carga automáticamente al inicio de cada sesión (es el `CLAUDE.md` del repo, antes `SESIONES.md`). Reglas: al **inicio** Claude usa la sección 3 ("Última sesión") para retomar contexto; al **cierre**, Claude actualiza la sección 3 con lo hecho, decisiones y pendientes. Las secciones 1 y 2 se mantienen estables salvo que cambien las reglas del juego.

---

## 1. Resumen del proyecto

**Subaspedia** es el TPO de Desarrollo de Aplicaciones I (UADE, 1C2026). Es una app móvil para una empresa de subastas que actualmente trabaja de forma presencial y quiere permitir participación on-line.

### Dominio (lo esencial de la consigna)
- **Subasta dinámica ascendente**: parte de un precio base, los postores ven las ofertas de los demás y van pujando hacia arriba. Gana el que más ofrece cuando ya nadie sube la oferta.
- **Postores**: deben registrarse en 2 etapas (datos personales + verificación externa de la empresa → asignación de categoría → completar registro y crear clave + cargar al menos un medio de pago).
- **Categorías de usuario y de subasta**: común, especial, plata, oro, platino. Un postor solo puede entrar a subastas de categoría ≤ a la suya.
- **Medios de pago**: cuentas bancarias (locales o del exterior), tarjetas de crédito (locales o del exterior) o cheques certificados. Sin medio de pago verificado solo se puede mirar, no pujar.
- **Catálogo**: público en general, pero el precio base solo lo ven usuarios registrados. Cada ítem tiene n° de pieza, descripción, precio base, dueño actual, ~6 imágenes (y datos extra si es arte/diseño).
- **Reglas de puja**: la puja mínima es la última oferta + 1% del valor base; la máxima es la última oferta + 20% del valor base. Estos límites NO aplican en oro y platino.
- **Tiempo real**: todos los conectados a una subasta deben ver las ofertas al instante y la app debe validar antes de enviar. Un usuario no puede tener otra puja en vuelo hasta que el sistema confirme la anterior. Un usuario no puede estar en más de una subasta a la vez.
- **Moneda**: cada subasta es en pesos o en dólares (no bimonetaria). Las de dólares se cancelan en dólares.
- **Post-subasta**: se registra la venta, se le informa al ganador el total (puja + comisiones + envío). Si no paga → multa del 10% y 72hs para presentar fondos; si no, va a la justicia y queda fuera de la app.
- **Vender por la app**: el usuario puede ofrecer un bien a la empresa (datos + ≥6 fotos + declaración de propiedad + acreditar origen lícito). La empresa lo inspecciona, lo acepta o lo rechaza, y si lo acepta lo incluye en una subasta futura comunicando fecha, lugar, valor base y comisiones. Si hay muchos artículos del mismo dueño se puede armar una "colección". Si nadie puja → la empresa lo compra al valor base.
- **Seguro y depósito**: a cada bien recibido se le contrata un seguro por el valor base. La app debe permitir al dueño ver el depósito donde está la pieza y la póliza, y contactar a la aseguradora para ampliarla.
- **Métricas por usuario**: participaciones, subastas ganadas, importes pujados/pagados, historial de pujas, etc.
- **Streaming**: la empresa provee un servicio de streaming para seguir la subasta en vivo. **No es parte del desarrollo** de la app.

### Entregables del TPO
1. **Primera entrega** (✅ hecha): wireframes en alta + paleta + Figma desplegado + ícono + splash + descripción de endpoints REST (Swagger u otro).
2. **Segunda entrega**: BackEnd y FrontEnd al 50% mínimo, al menos un circuito completo integrado, doc de manejo de errores.
3. **Tercera entrega**: app completamente funcional, BackEnd accesible online, FrontEnd corriendo en dispositivo.

> **Trazabilidad obligatoria**: lo entregado debe coincidir con lo diseñado. No se aprueba si el funcionamiento real difiere del definido en la primera entrega.

### Stack del repo
- Monorepo **pnpm + workspaces**.
- `apps/mobile` — Expo / React Native + NativeWind + react-native-reusables (rnr).
- `apps/api` — Cloudflare Workers + Hono + D1.
- `packages/infra` — SST (Cloudflare).
- Lint/format: Biome. Hooks: lefthook.

---

## 2. Pautas de trabajo

- **Yo (Manuel) codeo, vos asesorás.** No escribís código a menos que te lo pida explícitamente. Tu rol es darme consejo, explicar enfoques, marcar trade-offs, sugerir cómo encarar X.
- **Idioma**: español, todo.
- **Estilo de respuesta**: explicar el método y el "por qué", no tirar el código resuelto. Soy estudiante de UADE, nuevo en RN — me sirve más entender que copiar.
- **Antes de proponer una solución**: si te falta info del estado actual del repo, mirá el código (no inventes).
- **Trazabilidad con la primera entrega**: cualquier funcionalidad nueva tiene que estar alineada con lo que ya quedó diseñado en wireframes/Figma/endpoints. Si algo no se condice, marcalo antes de seguir.
- **Mantenimiento de este MD**:
  - **Inicio de sesión**: leer este archivo para retomar contexto.
  - **Fin de sesión**: actualizar la sección 3 con lo que se hizo, decisiones tomadas y qué queda pendiente.

---

## 3. Última sesión

**Fecha:** 2026-05-24
**Branch:** `feat/profile`

### Qué se hizo

**Setup y revisión inicial**
- Rename `SESIONES.md` → `CLAUDE.md` (con `git mv`) para que se cargue automático al inicio. **⚠️ el rename quedó sin commitear** (ver pendientes).
- Memoria del proyecto guardada: `feedback_advisor_role.md` (Manuel codea, Claude asesora — esta sesión Manuel **sí** pidió explícitamente que codee la parte de productos/propuesta) y `claude_md_location.md`.
- Revisión completa de las pantallas del perfil (sin tocar código) — quedaron identificados los bugs y pendientes de cada archivo.

**Centralización del usuario (paquete completo, sin commitear todavía si bien Manuel dijo "ya comitee" — git status muestra cambios)**
- `packages/types/src/user/index.tsx` (archivo nuevo, ojo: extensión `.tsx` por error, debería ser `.ts`) — Zod schema con `userSchema`, `userCountrySchema`, `User`, `UserCategory` (re-export de `auctionCategory`), `USER_CATEGORIES`, helper `isOnboarded(user)`.
- Subpath `./user` agregado al `packages/types/package.json` y reexport en `src/index.ts`.
- Hook `apps/mobile/hooks/use-current-user.ts` con mock provisorio y dos hooks: `useCurrentUser()` (query) y `useUpdateProfile()` (mutation con `setQueryData` en `onSuccess`). Pendiente `useSignOut()` (no se llegó a agregar). **TODO en el hook**: restaurar `enabled: isAuthed` cuando exista el endpoint real.
- `apps/mobile/lib/constants.ts` nuevo con `DEFAULT_AVATAR_URI` (single source para placeholder de avatar).
- `RankBadge` migrado al enum de la DB (`UserCategory`: common/special/silver/gold/platinum). Prop renombrada `tier` → `category`. Destructuring fixed.
- `profile/index.tsx` consume el hook: nombre con `isOnboarded(user)`, email, avatar, `<RankBadge>` con guard `user?.category && ...`. Sacó el StatCard de "Categoría favorita".
- `profile/edit.tsx` reestructurado en **componente padre (guard) + hijo (form con `useState` inicial seguro)** — patrón anti-race-condition cuando el async data alimenta initial values. Mutation enchufada, `router.back()` al success, botón con `isPending`.

**Pantalla "Mis productos" (Manuel pidió que Claude codee directamente)**
- `packages/types/src/product/index.ts` nuevo — Zod schema con `productStatus` enum **en inglés** (`under_review` / `appraised` / `approved` / `rejected` / `auctioned`), `PRODUCT_STATUS_LABELS` con labels en español para UI, `productSchema` con campos opcionales `salePrice`/`saleDate`/`auctionId`/`proposalText`/`proposedBasePrice`/`proposedCommission`.
- Hook `apps/mobile/hooks/use-my-products.ts` con `useMyProducts()` y `useUpdateProductStatus()`. Mock de 5 productos, **uno por status** (incluye datos de propuesta poblados solo en el `appraised`).
- `apps/mobile/app/profile/products.tsx` reescrito — consume el hook, ScrollView, empty state, mapea todos.
- `status-badge.tsx` migrado al enum inglés; labels en español adentro del `BADGE_CONFIG`.
- `product-card.tsx` reescrito — agregó subtítulo `category`, link de acción condicional por status (`Ver subasta` para approved/auctioned, `Ver propuesta` para appraised), muestra precio+fecha cuando auctioned, banner de revisión preservado. Componente helper `ActionElement` para resolver Link real (cuando ruta existe) vs Alert TODO (cuando no).

**Pantalla "Propuesta"**
- `apps/mobile/app/profile/products/[id]/proposal.tsx` nuevo. Layout: título "Propuesta", card con avatar+nombre+categoría+texto de propuesta+caja de precio/comisión, botones "Rechazar" (variant destructive) y "Aceptar" (variant default).
- Flujo: tocar botón → `useUpdateProductStatus` → `router.back()` al success. Estados defensivos: loading, producto no encontrado, status ya cambiado.
- **Bug encontrado y resuelto**: el primer intento incluía un `Alert.alert` de confirmación con buttons. **No funciona en RN Web** porque `Alert.alert` se mapea a `window.alert()` que ignora los buttons → el `onPress` nunca se ejecutaba y "no pasaba nada" al tocar Aceptar/Rechazar. Solución: se sacó la confirmación intermedia; los botones grandes ya son explícitos.
- `product-card.tsx` enchufa el `Link` real solo para la ruta `proposal` (porque existe). Para `/auctions/[id]` sigue siendo Alert TODO.

### Conceptos que se explicaron (referencia para el alumno)
- **React Query como store compartido**: no hace falta un `UserContext` propio cuando ya tenés `QueryClientProvider` en el root. Múltiples componentes que llaman `useCurrentUser()` comparten el mismo cache automáticamente; mutaciones invalidan o usan `setQueryData` para refrescar a todos.
- **Trampa del `useState` con datos async**: si inicializás `useState({ name: user?.name ?? "" })` y `user` viene de un query async, el primer render snapshotea strings vacíos y `useState` no se reinicializa. Solución: split padre/hijo donde el padre tiene el guard `if (!user) return` y el hijo asume `user` garantizado y inicializa el state con datos reales.
- **Rules of hooks vs early return**: los hooks deben llamarse en el mismo orden en cada render. Por eso no se puede hacer `if (!user) return ...` antes de los `useState`/`useQuery` — rompe la regla. El split padre/hijo lo evita naturalmente.
- **`asChild` + `Link`**: cuando se usa `<Link href={...} asChild><Pressable></Pressable></Link>`, Expo Router merge-ea su `onPress` con el child. Si el child tiene `onPress` propio puede haber conflicto — en el `ActionElement` se pasa `onPress: undefined` cuando hay Link y `onPress: Alert.alert` cuando no.
- **`Alert.alert` en RN Web**: solo muestra el mensaje, ignora buttons. Para confirmaciones cross-platform usar `window.confirm` (web) + `Alert.alert` (native) con `Platform.select`, o el componente `AlertDialog` de `@rn-primitives/alert-dialog` (ya está instalado).
- **Zod como source of truth de tipos**: el package `@subaspedia/types` usa el patrón `z.object(...) → z.infer<typeof ...>`. Para enums alineados con la DB: `z.enum([...])` + map `[{ value, label }]` para UI.

### Decisiones / acuerdos (acumulado vigente)
- Componentes específicos de un feature → `components/<feature>/` (no en `components/ui/`).
- Naming: archivos kebab-case, componentes PascalCase, exports nombrados (no default).
- Para forms simples: `useState` por campo; migrar a `react-hook-form` solo si la validación lo justifica.
- **Enums alineados con la DB en inglés** (`common/silver/gold...`, `under_review/appraised/...`), labels en español para UI.
- **Mocks viven en los hooks**, no inline en pantallas. Cuando llegue el endpoint real, solo cambia la implementación del hook.
- **Sin Context propio**: React Query ya hace el rol de store compartido.

### Pendiente / próximos pasos

**Para commitear (importante: hay mucho sin commit)**
- Rename `SESIONES.md → CLAUDE.md` (sigue sin commitear, viene arrastrándose).
- Toda la centralización del usuario (`packages/types/src/user/`, hooks, constants, RankBadge, profile/index, edit).
- Pantalla "Mis productos" reescrita + pantalla "Propuesta" nueva.
- Sugerencia: dos commits separados (`feat(profile): centralize current user via useCurrentUser hook` y `feat(profile): products list + proposal screen`).

**Fixes chicos sin atender**
- `packages/types/src/user/index.tsx` debería ser `.ts` (no tiene JSX). Renombrar y actualizar `package.json` línea del subpath.
- `profile/index.tsx`: `alt="@mrzachnugent"` hardcoded, el bloque `<View>` líneas ~72-80 con shadow sin contenido visible, fallback `"En Revisión"` semánticamente confuso (mejor `"Completá tu perfil"`).
- `profile/edit.tsx`: `alt="@mrzachnugent"` hardcoded, "Cambiar Contraseña" sigue siendo Pressable sin onPress.
- `rank-badge.tsx`: import `USER_CATEGORIES` sin usar (decidir si consumirlo o sacarlo); inconsistencia `textClass: ""` vs `text-black` en gold/platinum.
- `product-card.tsx`: ruta `/auctions/[id]` sigue como Alert TODO — esperando que se cree esa pantalla.

**Pantallas vacías del perfil** (orden sugerido)
1. `payment-methods.tsx` — la más definida en la consigna. Buena candidata para el "circuito completo" de la segunda entrega.
2. `auctions.tsx` — reusa el patrón de products (lista con badge de estado).
3. `infractions.tsx` — multas (regla del 10% + 72hs).
4. `settings.tsx` — notificaciones, idioma, cerrar sesión (acá va `useSignOut()` cuando se cree).

**Trazabilidad y pendientes anteriores que siguen vigentes**
- ⚠️ **Foto del documento (frente y dorso)** que pide la consigna no está modelada en ningún lado. Definir si es pantalla KYC aparte o sección de edit.
- ⚠️ Crear endpoint `users.me` en el back (`apps/api/src/routers/`) — hoy el `users` table es solo `{id, email, passwordHash}`. Decidir si extender `users` con campos personales o respetar la división `users / people / clients` que ya está en el schema (la segunda es más fiel al modelo de consigna).
- `profile/index.tsx`: imports sin usar a verificar; decidir si renombrar prop `link` → `href` en `MenuItem` (ya se hizo en index, falta confirmar consistencia).
- `ProfileHeader`: definir qué hace el botón hamburguesa.
- Bottom tab bar: verificar que esté en el `_layout.tsx` raíz, no dentro del stack del profile.
- **Definir el circuito completo** que cubre el requisito de la segunda entrega.
