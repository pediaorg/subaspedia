# Subaspedia — Bitácora de trabajo

> Archivo de contexto entre sesiones. Al inicio de cada sesión leer este MD; al final, actualizarlo.

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

**Fecha:** 2026-05-10
**Branch:** `feat/profile`

### Qué se hizo
- Setup del flujo: se creó `SESIONES.md` como contexto entre sesiones.
- Se confirmó que la **primera entrega está cerrada** y se arrancó la etapa de codeo.
- Se diagnosticó por qué el Fast Refresh no funciona con `pnpm dev`: la combinación `cross-env CI=1` + `expo start --web` + `pnpm -r --parallel` apaga el HMR. Workaround: levantar el mobile en una terminal aparte sin `CI=1`, o usar `pnpm go` (Expo Go).
- Se avanzó la **pantalla de Profile** (`apps/mobile/app/profile/index.tsx`):
  - Estructura: container `flex-1 px-4 gap-6` → header (placeholder) + ProfileCard + lista de menú.
  - ProfileCard con Avatar superpuesto vía `position: absolute` sobre la Card.
  - Datos del usuario (nombre, mail) + Badge "ORO" + tres `StatCard`.
  - Lista de 6 `MenuItem` para Editar Perfil, Mis Productos, Subastas, Multas y Pagos, Métodos de Pago, Configuración.
- Se crearon dos componentes en `apps/mobile/components/profile/`:
  - `menu-item.tsx` — recibe `icon` (LucideIcon), `label` y la ruta. Usa `<Link asChild><Pressable>`.
  - `stat-card.tsx` — recibe `value` y `label`.

### Conceptos que se explicaron en esta sesión (referencia para el alumno)
- **`asChild`** (Slot pattern): permite que un componente padre como `Link` pase su comportamiento a un único hijo en vez de envolverlo. Evita wrappers duplicados y problemas de accesibilidad.
- **Renderizar un componente recibido por prop**: hay que renombrar al desestructurar (`{ icon: Icon }`) porque JSX exige PascalCase. Pasar la **referencia** del componente, no JSX renderizado.
- **Tipos de path en Expo Router**: usar `Href` (no `RelativePathString`) porque cubre rutas absolutas, relativas y forma objeto con params. Recomendación pendiente: activar `experiments.typedRoutes` en `app.json`.
- **Pressable + Link asChild** vs Button: para items de menú que **navegan**, lo correcto es `Link asChild` envolviendo `Pressable`, no `Button` (Button es para acciones).
- **Trampa de autoimport**: importar `Text`/`View` desde `lucide-react-native` en vez de `react-native` renderiza íconos llamados así. Verificar siempre el path.
- **Overlap del Avatar sobre la Card**: preferir `position: absolute` (con wrapper `relative` y padding-top en la Card) sobre margin negativo.
- **SafeArea vs padding lateral**: son cosas distintas. SafeArea (notch / gesture bar) se resuelve **una vez** en el `_layout.tsx` raíz. El padding lateral del contenido va con utility classes (`px-4`, etc.).

### Decisiones / acuerdos
- Componentes específicos de un feature van en `components/<feature>/` (no en `components/ui/`, que es solo para primitives de rnr).
- Naming: archivos kebab-case, componentes PascalCase, exports nombrados (no default).
- Para el form de "Editar Perfil": empezar con `useState` por campo; recién migrar a `react-hook-form` si la validación lo justifica.

### Pendiente / próximos pasos
- **Bugs menores en `app/profile/index.tsx` que quedaron sin tocar**:
  - `mt-15` (línea 40): no existe en la escala de Tailwind. Reemplazar por `mt-16` o `mt-[60px]`.
  - Imports sin usar (`Link`, `Pressable`, `Separator`) que podrían colarse al lint.
  - La prop del `MenuItem` quedó como `link` en el index. Decidir si renombrar a `href` (más consistente con la convención de Expo Router) o dejarla así.
- **Trazabilidad ⚠️**: el wireframe de "Editar Perfil" no incluye la **foto del documento (frente y dorso)** que pide la consigna. Definir si va en otra pantalla (ej. KYC/verificación) o si hay que agregarla.
- **Header del Profile**: hoy es un placeholder con `<Text>header</Text>`. Decidir qué hace el botón hamburguesa.
- **Bottom tab bar**: verificar que esté definido en el `_layout.tsx` raíz (no dentro del stack del profile).
- **Avanzar pantalla `edit.tsx`**: hoy está vacía. Es el primer candidato a maquetar la próxima sesión.
- **Definir el circuito completo** que va a cumplir el requisito de la segunda entrega.
