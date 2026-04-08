import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { verifySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication and require admin role.
    // This endpoint writes up to 10,000 records; restricting it prevents quota abuse.
    const decodedToken = await verifySession(req);
    if ((decodedToken as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: admin role required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      prescriptionCount = 100,
      shipmentCount = 100,
      batchSize = 50,
      delayMs = 100,
    } = body;

    // Validate inputs
    if (prescriptionCount < 0 || shipmentCount < 0) {
      return NextResponse.json(
        { error: 'Counts must be non-negative' },
        { status: 400 }
      );
    }

    if (prescriptionCount + shipmentCount > 10000) {
      return NextResponse.json(
        { error: 'Total transactions cannot exceed 10,000 per request' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    
    // Get clinic ID from session token
    const clinicId = (decodedToken as any).clinicId || 'default-clinic';

    const metrics: {
      prescriptionsProcessed: number;
      shipmentsProcessed: number;
      errors: number;
      startTime: string;
      endTime?: string;
    } = {
      prescriptionsProcessed: 0,
      shipmentsProcessed: 0,
      errors: 0,
      startTime: new Date().toISOString(),
    };

    // Sample data
    const SYMPTOMS = [
      'headache, fever, body ache',
      'cough, congestion, sore throat',
      'nausea, vomiting, diarrhea',
      'rash, itching, redness',
    ];

    const MEDICINE_NAMES = [
      'Paracetamol 500mg',
      'Ibuprofen 400mg',
      'Amoxicillin 250mg',
      'Cephalexin 500mg',
    ];

    const COURIERS = ['FedEx', 'UPS', 'DHL', 'USPS'] as const;
    const STATUSES = ['Pre-Transit', 'In Transit', 'Out for Delivery', 'Delivered'] as const;

    const pickRandom = <T,>(items: readonly T[]): T => {
      if (items.length === 0) {
        throw new Error('Cannot pick a random value from an empty array');
      }
      const index = Math.floor(Math.random() * items.length);
      const candidate = items[index];
      if (candidate !== undefined) {
        return candidate;
      }
      const fallback = items[0];
      if (fallback === undefined) {
        throw new Error('Random selection failed because the array is unexpectedly empty.');
      }
      return fallback;
    };

    // Process prescriptions
    for (let i = 0; i < prescriptionCount; i += batchSize) {
      const batch = Math.min(batchSize, prescriptionCount - i);
      const batchWrites: Promise<void>[] = [];

      for (let j = 0; j < batch; j++) {
        batchWrites.push(
          (async () => {
            try {
              const patientId = `patient_${Date.now()}_${Math.random().toString(36).substring(7)}`;
              const patientName = `Patient ${i + j + 1}`;
              const symptoms = pickRandom(SYMPTOMS);
              const medication = pickRandom(MEDICINE_NAMES);

              // Create patient
              await db.collection(`clinics/${clinicId}/patients`).doc(patientId).set({
                name: patientName,
                dateOfBirth: new Date(Date.now() - 35 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                medicalHistory: [],
                allergies: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              }, { merge: true });

              // Create record
              await db.collection(`clinics/${clinicId}/patients/${patientId}/records`).add({
                date: new Date().toISOString().split('T')[0],
                type: 'prescription',
                summary: `AI-suggested medication: ${medication} for symptoms: ${symptoms}`,
                files: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              metrics.prescriptionsProcessed++;
            } catch (error) {
              metrics.errors++;
              console.error(`Error processing prescription ${i + j + 1}:`, error);
            }
          })()
        );
      }

      await Promise.all(batchWrites);
      if (delayMs > 0 && i + batch < prescriptionCount) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Process shipments
    for (let i = 0; i < shipmentCount; i += batchSize) {
      const batch = Math.min(batchSize, shipmentCount - i);
      const batchWrites: Promise<void>[] = [];

      for (let j = 0; j < batch; j++) {
        batchWrites.push(
          (async () => {
            try {
              const medicineId = `med_${Date.now()}_${Math.random().toString(36).substring(7)}`;
              const medicineName = MEDICINE_NAMES[Math.floor(Math.random() * MEDICINE_NAMES.length)];
              const trackingNumber = `${Math.random().toString(36).substring(2, 4).toUpperCase()}${Math.floor(Math.random() * 1000000)}`;

              await db.collection(`clinics/${clinicId}/shipments`).add({
                medicineId,
                medicineName,
                courier: pickRandom(COURIERS),
                trackingNumber,
                status: pickRandom(STATUSES),
                pickupDate: new Date().toISOString().split('T')[0],
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                coldChain: Math.random() > 0.5,
                minTemp: Math.random() > 0.5 ? 2 : undefined,
                maxTemp: Math.random() > 0.5 ? 8 : undefined,
                temperatureLog: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              metrics.shipmentsProcessed++;
            } catch (error) {
              metrics.errors++;
              console.error(`Error processing shipment ${i + j + 1}:`, error);
            }
          })()
        );
      }

      await Promise.all(batchWrites);
      if (delayMs > 0 && i + batch < shipmentCount) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    metrics.endTime = new Date().toISOString();
    const duration = new Date(metrics.endTime).getTime() - new Date(metrics.startTime).getTime();

    return NextResponse.json({
      success: true,
      metrics: {
        ...metrics,
        totalTransactions: metrics.prescriptionsProcessed + metrics.shipmentsProcessed,
        duration: duration,
        rate: (metrics.prescriptionsProcessed + metrics.shipmentsProcessed) / (duration / 1000),
      },
    });
  } catch (error: any) {
    console.error('Error in bulk transaction processing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process bulk transactions' },
      { status: error.statusCode || 500 }
    );
  }
}
