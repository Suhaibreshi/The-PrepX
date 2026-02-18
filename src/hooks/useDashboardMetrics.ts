import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardMetrics } from "@/types/database";
import { useEffect } from "react";

export function useDashboardMetrics() {
  const queryClient = useQueryClient();

  const query = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_metrics");
      if (error) throw error;
      return data as unknown as DashboardMetrics;
    },
    refetchInterval: 30000, // refresh every 30s
  });

  // Real-time invalidation on key table changes
  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "fees" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "exams" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
