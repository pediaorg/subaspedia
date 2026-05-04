import type { ProcedureUtils } from "@orpc/tanstack-query";
import {
  type UseInfiniteQueryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

type AnyUtils = ProcedureUtils<Record<never, never>, unknown, unknown, unknown>;

type InputArg<TInput> = undefined extends TInput
  ? [input?: TInput]
  : [input: TInput];

type HookifyProcedure<P> = P extends ProcedureUtils<
  infer _Ctx,
  infer TInput,
  infer TOutput,
  infer TError
>
  ? {
      useQuery: <TSelect = TOutput>(
        ...args: [
          ...InputArg<TInput>,
          opts?: Partial<
            Omit<UseQueryOptions<TOutput, TError, TSelect>, "queryKey" | "queryFn">
          >,
        ]
      ) => ReturnType<typeof useQuery<TOutput, TError, TSelect>>;

      useSuspenseQuery: <TSelect = TOutput>(
        ...args: [
          ...InputArg<TInput>,
          opts?: Partial<
            Omit<
              UseSuspenseQueryOptions<TOutput, TError, TSelect>,
              "queryKey" | "queryFn"
            >
          >,
        ]
      ) => ReturnType<typeof useSuspenseQuery<TOutput, TError, TSelect>>;

      useInfiniteQuery: (
        input: (pageParam: unknown) => TInput,
        opts: Omit<
          UseInfiniteQueryOptions<TOutput, TError>,
          "queryKey" | "queryFn"
        >,
      ) => ReturnType<typeof useInfiniteQuery>;

      useMutation: <TContext = unknown>(
        opts?: Partial<UseMutationOptions<TOutput, TError, TInput, TContext>>,
      ) => ReturnType<typeof useMutation<TOutput, TError, TInput, TContext>>;

      queryKey: P extends { queryKey: infer F } ? F : never;
      queryOptions: P extends { queryOptions: infer F } ? F : never;
      infiniteOptions: P extends { infiniteOptions: infer F } ? F : never;
      mutationOptions: P extends { mutationOptions: infer F } ? F : never;
      call: P extends { call: infer F } ? F : never;
    }
  : { [K in keyof P]: HookifyProcedure<P[K]> };

const HOOKS = new Set([
  "useQuery",
  "useSuspenseQuery",
  "useInfiniteQuery",
  "useMutation",
]);

function makeHook(target: AnyUtils, hook: string) {
  switch (hook) {
    case "useQuery":
      return (input?: unknown, opts?: object) =>
        useQuery({
          ...(target.queryOptions({ input } as never) as object),
          ...opts,
        } as never);
    case "useSuspenseQuery":
      return (input?: unknown, opts?: object) =>
        useSuspenseQuery({
          ...(target.queryOptions({ input } as never) as object),
          ...opts,
        } as never);
    case "useInfiniteQuery":
      return (input: (p: unknown) => unknown, opts: object) =>
        useInfiniteQuery({
          ...(target.infiniteOptions({ input, ...opts } as never) as object),
        } as never);
    case "useMutation":
      return (opts?: object) =>
        useMutation({
          ...(target.mutationOptions() as object),
          ...opts,
        } as never);
  }
}

type UnknownRecord = Record<string, unknown>;

function wrap(target: UnknownRecord): UnknownRecord {
  return new Proxy(target, {
    get(t, key: string) {
      if (HOOKS.has(key)) return makeHook(t as unknown as AnyUtils, key);
      const next = (t as UnknownRecord)[key];
      if (typeof next === "object" && next !== null)
        return wrap(next as UnknownRecord);
      if (typeof next === "function") return next.bind(t);
      return next;
    },
  });
}

export const api = wrap(
  orpc as unknown as UnknownRecord,
) as unknown as HookifyProcedure<typeof orpc>;
