import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PatientService, Patient } from '@/lib/firestore';
import { useAuth } from '@/providers/AuthProvider';

export function usePatients() {
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useQuery({
    queryKey: ['patients', clinicId],
    queryFn: () => PatientService.getPatients(clinicId!),
    enabled: !!clinicId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePatient(patientId: string) {
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useQuery({
    queryKey: ['patient', clinicId, patientId],
    queryFn: () => PatientService.getPatient(clinicId!, patientId),
    enabled: !!clinicId && !!patientId,
  });
}

export function useAddPatient() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useMutation({
    mutationFn: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) =>
      PatientService.addPatient(clinicId!, patient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', clinicId] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Patient>) =>
      PatientService.updatePatient(clinicId!, id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['patient', clinicId, variables.id] });
    },
  });
}
