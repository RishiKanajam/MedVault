import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RecordService, RecordEntry } from '@/lib/firestore';
import { useAuth } from '@/providers/AuthProvider';

export function useRecords(patientId: string) {
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useQuery({
    queryKey: ['records', clinicId, patientId],
    queryFn: () => RecordService.getRecords(clinicId!, patientId),
    enabled: !!clinicId && !!patientId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAddRecord() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useMutation({
    mutationFn: ({ patientId, record }: { patientId: string; record: Omit<RecordEntry, 'id' | 'createdAt' | 'updatedAt'> }) =>
      RecordService.addRecord(clinicId!, patientId, record),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['records', clinicId, variables.patientId] });
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useMutation({
    mutationFn: ({ patientId, recordId, updates }: { patientId: string; recordId: string; updates: Partial<RecordEntry> }) =>
      RecordService.updateRecord(clinicId!, patientId, recordId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['records', clinicId, variables.patientId] });
    },
  });
}

