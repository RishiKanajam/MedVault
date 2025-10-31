import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShipmentService, Shipment } from '@/lib/firestore';
import { useAuth } from '@/providers/AuthProvider';

export function useShipments() {
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useQuery({
    queryKey: ['shipments', clinicId],
    queryFn: () => ShipmentService.getShipments(clinicId!),
    enabled: !!clinicId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useShipment(shipmentId: string) {
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useQuery({
    queryKey: ['shipment', clinicId, shipmentId],
    queryFn: () => ShipmentService.getShipment(clinicId!, shipmentId),
    enabled: !!clinicId && !!shipmentId,
  });
}

export function useAddShipment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useMutation({
    mutationFn: (shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) =>
      ShipmentService.addShipment(clinicId!, shipment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments', clinicId] });
    },
  });
}

export function useUpdateShipment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const clinicId = profile?.clinicId;

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Shipment>) =>
      ShipmentService.updateShipment(clinicId!, id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['shipment', clinicId, variables.id] });
    },
  });
}
