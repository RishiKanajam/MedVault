import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MedicineService, ShipmentService, PatientService } from '@/lib/firestore';

type FirestoreMock = Record<string, ReturnType<typeof jest.fn>>;

declare global {
  // eslint-disable-next-line no-var
  var __FIRESTORE_MOCK__: FirestoreMock;
}

const firestoreMock = globalThis.__FIRESTORE_MOCK__ as FirestoreMock;

const mockServerTimestamp = firestoreMock.serverTimestamp!;
mockServerTimestamp.mockImplementation(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }));

const mockCollection = firestoreMock.collection!;
const mockDoc = firestoreMock.doc!;
const mockGetDoc = firestoreMock.getDoc!;
const mockGetDocs = firestoreMock.getDocs!;
const mockAddDoc = firestoreMock.addDoc!;
const mockUpdateDoc = firestoreMock.updateDoc!;
const mockDeleteDoc = firestoreMock.deleteDoc!;
const mockQuery = firestoreMock.query!;
const mockOrderBy = firestoreMock.orderBy!;

describe('Firestore Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({}) } as any);
    mockGetDocs.mockResolvedValue({ docs: [] as Array<{ id: string; data: () => any; exists: () => boolean }> } as any);
    mockAddDoc.mockResolvedValue({ id: 'mockId' } as any);
    mockUpdateDoc.mockResolvedValue(undefined as any);
    mockDeleteDoc.mockResolvedValue(undefined as any);
  });

  describe('MedicineService', () => {
    it('should get medicines for a clinic', async () => {
      const mockMedicines = [
        {
          id: 'med1',
          name: 'Paracetamol',
          manufacturer: 'ABC Pharma',
          batchNo: 'BATCH123',
          quantity: 100,
          expiryDate: '2024-12-31',
          coldChain: false,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        },
      ];

      mockCollection.mockReturnValue('medicinesRef');
      mockGetDocs.mockResolvedValue({
        docs: mockMedicines.map(med => ({
          id: med.id,
          data: () => med,
          exists: () => true,
        })),
      } as any);

      const result = await MedicineService.getMedicines('clinic123');
      
      expect(mockCollection).toHaveBeenCalledWith(expect.any(Object), 'clinics/clinic123/medicines');
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Paracetamol');
    });

    it('should add a new medicine', async () => {
      const newMedicine = {
        name: 'Aspirin',
        manufacturer: 'XYZ Pharma',
        batchNo: 'BATCH456',
        quantity: 50,
        expiryDate: '2024-06-30',
        coldChain: false,
      };

      mockCollection.mockReturnValue('medicinesRef');
      mockAddDoc.mockResolvedValue({ id: 'newMedId' });

      const result = await MedicineService.addMedicine('clinic123', newMedicine);
      
      expect(mockAddDoc).toHaveBeenCalledWith('medicinesRef', expect.objectContaining(newMedicine));
      expect(result).toBe('newMedId');
    });

    it('should update a medicine', async () => {
      const updates = { quantity: 75 };
      
      mockDoc.mockReturnValue('medicineRef');
      mockUpdateDoc.mockResolvedValue(undefined);

      await MedicineService.updateMedicine('clinic123', 'med1', updates);
      
      expect(mockDoc).toHaveBeenCalledWith(expect.any(Object), 'clinics/clinic123/medicines', 'med1');
      expect(mockUpdateDoc).toHaveBeenCalledWith('medicineRef', expect.objectContaining(updates));
    });

    it('should delete a medicine', async () => {
      mockDoc.mockReturnValue('medicineRef');
      mockDeleteDoc.mockResolvedValue(undefined);

      await MedicineService.deleteMedicine('clinic123', 'med1');
      
      expect(mockDoc).toHaveBeenCalledWith(expect.any(Object), 'clinics/clinic123/medicines', 'med1');
      expect(mockDeleteDoc).toHaveBeenCalledWith('medicineRef');
    });
  });

  describe('ShipmentService', () => {
    it('should get shipments for a clinic', async () => {
      const mockShipments = [
        {
          id: 'ship1',
          medicineId: 'med1',
          medicineName: 'Paracetamol',
          courier: 'FedEx',
          trackingNumber: 'TRACK123',
          status: 'In Transit',
          pickupDate: '2024-01-01',
          estimatedDelivery: '2024-01-03',
          coldChain: true,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        },
      ];

      mockCollection.mockReturnValue('shipmentsRef');
      mockQuery.mockReturnValue('queryRef');
      mockOrderBy.mockReturnValue('orderByRef');
      mockGetDocs.mockResolvedValue({
        docs: mockShipments.map(ship => ({
          id: ship.id,
          data: () => ship,
          exists: () => true,
        })),
      } as any);

      const result = await ShipmentService.getShipments('clinic123');
      
      expect(mockCollection).toHaveBeenCalledWith(expect.any(Object), 'clinics/clinic123/shipments');
      expect(result).toHaveLength(1);
      expect(result[0]?.medicineName).toBe('Paracetamol');
    });
  });

  describe('PatientService', () => {
    it('should get patients for a clinic', async () => {
      const mockPatients = [
        {
          id: 'patient1',
          name: 'John Doe',
          email: 'john@example.com',
          dateOfBirth: '1990-01-01',
          medicalHistory: [],
          allergies: [],
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        },
      ];

      mockCollection.mockReturnValue('patientsRef');
      mockQuery.mockReturnValue('queryRef');
      mockOrderBy.mockReturnValue('orderByRef');
      mockGetDocs.mockResolvedValue({
        docs: mockPatients.map(patient => ({
          id: patient.id,
          data: () => patient,
          exists: () => true,
        })),
      } as any);

      const result = await PatientService.getPatients('clinic123');
      
      expect(mockCollection).toHaveBeenCalledWith(expect.any(Object), 'clinics/clinic123/patients');
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('John Doe');
    });
  });
});
