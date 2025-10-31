import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase';

const getDbOrThrow = () => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  return db;
};

// Types for our data models
export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  batchNo: string;
  quantity: number;
  expiryDate: string;
  coldChain: boolean;
  temperatureRange?: {
    min: number;
    max: number;
  };
  lastShipmentId?: string;
  lastShipmentDate?: string;
  shipmentStatus?: 'Pre-Transit' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Delayed' | 'Exception';
  createdAt: Date;
  updatedAt: Date;
}

export interface Shipment {
  id: string;
  medicineId: string;
  medicineName: string;
  courier: string;
  trackingNumber: string;
  status: 'Pre-Transit' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Delayed' | 'Exception';
  pickupDate: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  coldChain: boolean;
  minTemp?: number;
  maxTemp?: number;
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  temperatureLog: Array<{
    timestamp: Date;
    temperature: number;
    location?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  medicalHistory: string[];
  allergies: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordEntry {
  id: string;
  patientId: string;
  date: string;
  type: 'consultation' | 'prescription' | 'lab_result' | 'imaging' | 'other';
  summary: string;
  files: Array<{
    name: string;
    url: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Medicine operations
export class MedicineService {
  static async getMedicines(clinicId: string): Promise<Medicine[]> {
    const dbInstance = getDbOrThrow();
    const medicinesRef = collection(dbInstance, `clinics/${clinicId}/medicines`);
    const snapshot = await getDocs(medicinesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Medicine[];
  }

  static async getMedicine(clinicId: string, medicineId: string): Promise<Medicine | null> {
    const dbInstance = getDbOrThrow();
    const medicineRef = doc(dbInstance, `clinics/${clinicId}/medicines`, medicineId);
    const snapshot = await getDoc(medicineRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.id,
      ...snapshot.data(),
      createdAt: snapshot.data().createdAt?.toDate() || new Date(),
      updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
    } as Medicine;
  }

  static async addMedicine(clinicId: string, medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const dbInstance = getDbOrThrow();
    const medicinesRef = collection(dbInstance, `clinics/${clinicId}/medicines`);
    const docRef = await addDoc(medicinesRef, {
      ...medicine,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  static async updateMedicine(clinicId: string, medicineId: string, updates: Partial<Medicine>): Promise<void> {
    const dbInstance = getDbOrThrow();
    const medicineRef = doc(dbInstance, `clinics/${clinicId}/medicines`, medicineId);
    await updateDoc(medicineRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  static async deleteMedicine(clinicId: string, medicineId: string): Promise<void> {
    const dbInstance = getDbOrThrow();
    const medicineRef = doc(dbInstance, `clinics/${clinicId}/medicines`, medicineId);
    await deleteDoc(medicineRef);
  }

  static subscribeToMedicines(clinicId: string, callback: (medicines: Medicine[]) => void): Unsubscribe {
    const dbInstance = getDbOrThrow();
    const medicinesRef = collection(dbInstance, `clinics/${clinicId}/medicines`);
    return onSnapshot(medicinesRef, (snapshot) => {
      const medicines = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Medicine[];
      callback(medicines);
    });
  }
}

// Shipment operations
export class ShipmentService {
  static async getShipments(clinicId: string): Promise<Shipment[]> {
    const dbInstance = getDbOrThrow();
    const shipmentsRef = collection(dbInstance, `clinics/${clinicId}/shipments`);
    const q = query(shipmentsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Shipment[];
  }

  static async getShipment(clinicId: string, shipmentId: string): Promise<Shipment | null> {
    const dbInstance = getDbOrThrow();
    const shipmentRef = doc(dbInstance, `clinics/${clinicId}/shipments`, shipmentId);
    const snapshot = await getDoc(shipmentRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.id,
      ...snapshot.data(),
      createdAt: snapshot.data().createdAt?.toDate() || new Date(),
      updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
    } as Shipment;
  }

  static async addShipment(clinicId: string, shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const dbInstance = getDbOrThrow();
    const shipmentsRef = collection(dbInstance, `clinics/${clinicId}/shipments`);
    const docRef = await addDoc(shipmentsRef, {
      ...shipment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  static async updateShipment(clinicId: string, shipmentId: string, updates: Partial<Shipment>): Promise<void> {
    const dbInstance = getDbOrThrow();
    const shipmentRef = doc(dbInstance, `clinics/${clinicId}/shipments`, shipmentId);
    await updateDoc(shipmentRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  static subscribeToShipments(clinicId: string, callback: (shipments: Shipment[]) => void): Unsubscribe {
    const dbInstance = getDbOrThrow();
    const shipmentsRef = collection(dbInstance, `clinics/${clinicId}/shipments`);
    const q = query(shipmentsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const shipments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Shipment[];
      callback(shipments);
    });
  }
}

// Patient operations
export class PatientService {
  static async getPatients(clinicId: string): Promise<Patient[]> {
    const dbInstance = getDbOrThrow();
    const patientsRef = collection(dbInstance, `clinics/${clinicId}/patients`);
    const q = query(patientsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Patient[];
  }

  static async getPatient(clinicId: string, patientId: string): Promise<Patient | null> {
    const dbInstance = getDbOrThrow();
    const patientRef = doc(dbInstance, `clinics/${clinicId}/patients`, patientId);
    const snapshot = await getDoc(patientRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.id,
      ...snapshot.data(),
      createdAt: snapshot.data().createdAt?.toDate() || new Date(),
      updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
    } as Patient;
  }

  static async addPatient(clinicId: string, patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const dbInstance = getDbOrThrow();
    const patientsRef = collection(dbInstance, `clinics/${clinicId}/patients`);
    const docRef = await addDoc(patientsRef, {
      ...patient,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  static async updatePatient(clinicId: string, patientId: string, updates: Partial<Patient>): Promise<void> {
    const dbInstance = getDbOrThrow();
    const patientRef = doc(dbInstance, `clinics/${clinicId}/patients`, patientId);
    await updateDoc(patientRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }
}

// Record operations
export class RecordService {
  static async getRecords(clinicId: string, patientId: string): Promise<RecordEntry[]> {
    const dbInstance = getDbOrThrow();
    const recordsRef = collection(dbInstance, `clinics/${clinicId}/patients/${patientId}/records`);
    const q = query(recordsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as RecordEntry[];
  }

  static async addRecord(clinicId: string, patientId: string, record: Omit<RecordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const dbInstance = getDbOrThrow();
    const recordsRef = collection(dbInstance, `clinics/${clinicId}/patients/${patientId}/records`);
    const docRef = await addDoc(recordsRef, {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  static async updateRecord(clinicId: string, patientId: string, recordId: string, updates: Partial<RecordEntry>): Promise<void> {
    const dbInstance = getDbOrThrow();
    const recordRef = doc(dbInstance, `clinics/${clinicId}/patients/${patientId}/records`, recordId);
    await updateDoc(recordRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }
}

// Dashboard metrics
export class DashboardService {
  static async getMetrics(clinicId: string) {
    const [medicines, shipments] = await Promise.all([
      MedicineService.getMedicines(clinicId),
      ShipmentService.getShipments(clinicId)
    ]);

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      totalMeds: medicines.length,
      expiringSoon: medicines.filter(m => new Date(m.expiryDate) <= thirtyDaysFromNow).length,
      expired: medicines.filter(m => new Date(m.expiryDate) < now).length,
      coldChainBreaches: medicines.filter(m => m.coldChain && m.temperatureRange && 
        (m.temperatureRange.min > 25 || m.temperatureRange.max < 2)).length,
      activeShipments: shipments.filter(s => s.status === 'In Transit' || s.status === 'Out for Delivery').length,
    };
  }
}
