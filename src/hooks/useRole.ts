import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGestor, setIsGestor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setIsGestor(false);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roles = (data || []).map((r: any) => r.role);
      setIsAdmin(roles.includes("admin"));
      setIsGestor(roles.includes("gestor"));
      setLoading(false);
    };

    fetchRoles();
  }, [user, authLoading]);

  return { isAdmin, isGestor, loading: loading || authLoading };
}
