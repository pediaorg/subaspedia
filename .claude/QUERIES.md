# subaspedia

Monorepo (pnpm workspaces).

- `apps/api` — Cloudflare Workers + oRPC + Drizzle (D1 / SQLite).
- `apps/mobile` — Expo / React Native + TanStack Query.
- `packages/infra` — SST infra.

## Data fetching (apps/mobile)

All API calls go through the typed `api` proxy from `@/lib/api`. It exposes
tRPC-style hooks built on top of oRPC + TanStack Query.

```ts
import { api } from "@/lib/api";

// Query
const countries = api.countries.list.useQuery();
// countries.data, countries.isLoading, countries.error
const user = api.users.byId.useQuery({ id: 1 }, { staleTime: 60_000 });

// Suspense
const countries = api.countries.list.useSuspenseQuery();

// Mutation
const createCountry = api.countries.create.useMutation({ onSuccess: () => {} });
createCountry.mutate({ name: "AR", capital: "BA", nationality: "argentina" });

// Infinite
api.items.list.useInfiniteQuery(
  pageParam => ({ cursor: pageParam }),
  { initialPageParam: null, getNextPageParam: last => last.next },
);

// Invalidation / direct call
queryClient.invalidateQueries({ queryKey: api.countries.list.queryKey() });
await api.countries.create.call({ ... });
```

## Session state (apps/mobile)

Auth/session and user-profile hooks return **flat objects** (no `{ data,
isLoading }` wrapper). Consume them as namespaces:

```ts
import { useAuth } from "@/lib/auth";
import { useMe } from "@/components/access-guard/use-me";

const auth = useAuth();
// auth.isAuthed, auth.accessToken, auth.loading

const me = useMe();
// me.category, me.hasVerifiedPaymentMethod, me.loading
```

Use these inside `AccessGuard` and any screen that needs to gate UI by
session/profile state — do not roll your own auth/profile lookups.

### Rules

- Do **not** call `useQuery(orpc.x.y.queryOptions())` directly — use
  `api.x.y.useQuery()`. The `orpc` util is an implementation detail of `api`.
- Do **not** use `fetch` against the API URL. The oRPC client (in
  `apps/mobile/lib/orpc.ts`) handles transport, types, and errors.
- Procedure paths and input/output types come from `@subaspedia/api/rpc`
  (`AppClient`). If a procedure is missing, add it to `apps/api` first and let
  the type flow through — do not hand-write client types.
- Hook opts go as the **last** argument: `useQuery(input, opts)`,
  `useMutation(opts)`.
