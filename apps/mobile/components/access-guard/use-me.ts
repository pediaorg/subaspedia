import { useAuth } from "@/lib/auth";

export type Category = "common" | "special" | "silver" | "gold" | "platinum";

export type Me = {
  category: Category | null;
  hasVerifiedPaymentMethod: boolean;
  loading: boolean;
};

// Placeholder: cuando exista api.auth.me (o se agreguen claims al JWT)
// reemplazar por la fuente real.
export function useMe(): Me {
  const { isAuthed } = useAuth();

  if (!isAuthed) {
    return { category: null, hasVerifiedPaymentMethod: false, loading: false };
  }

  return {
    category: null,
    hasVerifiedPaymentMethod: false,
    loading: false,
  };
}
