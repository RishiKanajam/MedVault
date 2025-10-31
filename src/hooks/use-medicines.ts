import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MedicineService, Medicine } from '@/lib/firestore';
import { useAuth } from '@/providers/AuthProvider';

export function useMedicines() {
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useQuery({
    queryKey: ['medicines', clinicId],
    queryFn: () => MedicineService.getMedicines(clinicId!),
    enabled: !!clinicId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMedicine(medicineId: string) {
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useQuery({
    queryKey: ['medicine', clinicId, medicineId],
    queryFn: () => MedicineService.getMedicine(clinicId!, medicineId),
    enabled: !!clinicId && !!medicineId,
  });
}

export function useAddMedicine() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useMutation({
    mutationFn: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) =>
      MedicineService.addMedicine(clinicId!, medicine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
    },
  });
}

export function useUpdateMedicine() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Medicine>) =>
      MedicineService.updateMedicine(clinicId!, id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['medicine', clinicId, variables.id] });
    },
  });
}

export function useDeleteMedicine() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useMutation({
    mutationFn: (medicineId: string) =>
      MedicineService.deleteMedicine(clinicId!, medicineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
    },
  });
}
