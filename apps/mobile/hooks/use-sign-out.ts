import { authStore } from "../lib/auth";

export function useSignOut() {
  const queryClient = queryClient();
  return () => {
    authStore.set(null);
    queryClient.clear();
  };
}
