import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '@/lib/firestore';
import { useAuth } from '@/providers/AuthProvider';

export function useDashboardMetrics() {
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useQuery({
    queryKey: ['dashboard-metrics', clinicId],
    queryFn: () => DashboardService.getMetrics(clinicId!),
    enabled: !!clinicId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
