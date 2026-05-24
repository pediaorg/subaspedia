import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { User } from "@subaspedia/types/user";
import { useAuth } from "@/lib/auth";

const CURRENT_USER_QUERY_KEY = ["users", "me"] as const;

const MOCK_USER: User = {
  id: 1,
  email: "casablanca@jamon.dz",
  name: "Juan",
  surname: "Casareski",
  documentId: "40123456",
  address: "Lima 970",
  country: { id: 1, name: "Argentina" },
  category: "gold",
  avatarUrl: null,
  admitted: true,
  createdAt: "2026-05-01T12:00:00.000Z",
};

export function useCurrentUser() {
  const { isAuthed } = useAuth();

  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async (): Promise<User> => {
      // TODO: reemplazar por api.users.me.useQuery() cuando exista el endpoint
      await new Promise(r => setTimeout(r, 200)); // simula latencia
      return MOCK_USER;
    },

    enabled: true, // no se ejecuta si no hay token // TODO: Restaurar enabled a:  isAuthed
    staleTime: 1000 * 60 * 5, // 5 min en caché
  });
}

type UpdateProfileInput = {
  name: string;
  surname: string;
  address: string;
  // TODO: country por ahora lo dejamos como string del form, pero ojo (ver nota abajo)
  country: string;
  email: string;
  avatarUrl: string | null;
};

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput): Promise<User> => {
      // Mock: simula latencia y devuelve un user "fusionado"
      await new Promise(r => setTimeout(r, 300));
      const current = queryClient.getQueryData<User>(CURRENT_USER_QUERY_KEY);
      if (!current) throw new Error("No current user");
      return {
        ...current,
        name: input.name || null,
        surname: input.surname || null,
        address: input.address || null,
        email: input.email,
        avatarUrl: input.avatarUrl,
        // TODO: country como objeto cuando integremos selector de países
      };
    },
    onSuccess: updated => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated);
    },
  });
}
