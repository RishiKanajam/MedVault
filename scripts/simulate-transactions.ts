import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local if it exists
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
} catch (error) {
  console.warn('Could not load .env.local:', error);
}

// Initialize Firebase Admin
const buildServiceAccountConfig = () => {
  const normalize = (value: string | undefined | null) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'undefined') {
      return undefined;
    }
    return trimmed;
  };

  let projectId = normalize(process.env.FIREBASE_PROJECT_ID);
  let clientEmail = normalize(process.env.FIREBASE_CLIENT_EMAIL);
  let privateKey = normalize(process.env.FIREBASE_PRIVATE_KEY);

  const serviceAccountPath = normalize(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if ((!projectId || !clientEmail || !privateKey) && serviceAccountPath) {
    try {
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf-8');
      const serviceAccount = JSON.parse(serviceAccountContent);
      projectId = projectId ?? normalize(serviceAccount.project_id);
      clientEmail = clientEmail ?? normalize(serviceAccount.client_email);
      privateKey = privateKey ?? normalize(serviceAccount.private_key);
    } catch (error) {
      console.error(`Failed to read service account file at ${serviceAccountPath}:`, error);
      throw new Error(`Unable to read Firebase service account file at ${serviceAccountPath}. Ensure the path is correct and the file contains valid JSON.`);
    }
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin configuration:');
    console.error(`  FIREBASE_PROJECT_ID or service account project_id: ${projectId ? '✓' : '✗'}`);
    console.error(`  FIREBASE_CLIENT_EMAIL or service account client_email: ${clientEmail ? '✓' : '✗'}`);
    console.error(`  FIREBASE_PRIVATE_KEY or service account private_key: ${privateKey ? '✓' : '✗'}`);
    console.error('Tip: set FIREBASE_* environment variables or provide FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS pointing to a JSON service account file.');
    throw new Error('Firebase Admin configuration is incomplete.');
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
};

if (!admin.apps.length) {
  try {
    const credentials = buildServiceAccountConfig();
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey,
      }),
    });
    console.log('✓ Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin:', error.message ?? error);
    throw error;
  }
}

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Transaction types
interface PrescriptionTransaction {
  patientId: string;
  patientName: string;
  age: number;
  weight: number;
  symptoms: string;
  medicationSuggested: string;
  timestamp: Date;
}

interface ShipmentTransaction {
  medicineId: string;
  medicineName: string;
  courier: string;
  trackingNumber: string;
  status: string;
  timestamp: Date;
}

interface TransactionMetrics {
  prescriptionsProcessed: number;
  shipmentsProcessed: number;
  aiApiCalls: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

// Sample data generators
const SYMPTOMS = [
  'headache, fever, body ache',
  'cough, congestion, sore throat',
  'nausea, vomiting, diarrhea',
  'rash, itching, redness',
  'chest pain, shortness of breath',
  'joint pain, stiffness',
  'fatigue, weakness',
  'insomnia, anxiety',
];

const MEDICINE_NAMES = [
  'Paracetamol 500mg',
  'Ibuprofen 400mg',
  'Amoxicillin 250mg',
  'Cephalexin 500mg',
  'Metformin 500mg',
  'Aspirin 81mg',
  'Lisinopril 10mg',
  'Atorvastatin 20mg',
];

const COURIERS = ['FedEx', 'UPS', 'DHL', 'USPS', 'Amazon Logistics'];
const STATUSES = ['Pre-Transit', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed'];

function pickRandom<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('Cannot select a random item from an empty array');
  }
  const randomIndex = Math.floor(Math.random() * items.length);
  const candidate = items[randomIndex];
  if (candidate !== undefined) {
    return candidate;
  }
  const fallback = items[0];
  if (fallback === undefined) {
    throw new Error('Random selection failed because the array is unexpectedly empty.');
  }
  return fallback;
}

// Generate random patient data
function generateRandomPatient(): { name: string; age: number; weight: number; symptoms: string } {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  
  return {
    name: `${pickRandom(firstNames)} ${pickRandom(lastNames)}`,
    age: Math.floor(Math.random() * 70) + 18,
    weight: Math.floor(Math.random() * 50) + 50,
    symptoms: pickRandom(SYMPTOMS),
  };
}

// Generate tracking number
function generateTrackingNumber(): string {
  return `${Math.random().toString(36).substring(2, 4).toUpperCase()}${Math.floor(Math.random() * 1000000)}`;
}

// Process prescription transaction with AI
async function processPrescriptionTransaction(
  _clinicId: string,
  patient: { name: string; age: number; weight: number; symptoms: string }
): Promise<PrescriptionTransaction> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const prompt = `
    As a medical AI assistant, analyze the following patient information and suggest appropriate medication:
    
    Patient Information:
    - Name: ${patient.name}
    - Age: ${patient.age} years
    - Weight: ${patient.weight} kg
    - Symptoms: ${patient.symptoms}
    
    Provide a brief medication recommendation in JSON format:
    {
      "medication": "medication name",
      "dosage": "dosage instructions"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract medication name from response
    let medication = 'Paracetamol 500mg'; // Default fallback
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        medication = parsed.medication || medication;
      }
    } catch {
      // Use default if parsing fails
    }

    return {
      patientId: `patient_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      patientName: patient.name,
      age: patient.age,
      weight: patient.weight,
      symptoms: patient.symptoms,
      medicationSuggested: medication,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error processing prescription:', error);
    // Return fallback transaction
    return {
      patientId: `patient_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      patientName: patient.name,
      age: patient.age,
      weight: patient.weight,
      symptoms: patient.symptoms,
      medicationSuggested: pickRandom(MEDICINE_NAMES),
      timestamp: new Date(),
    };
  }
}

// Process shipment transaction
function processShipmentTransaction(
  medicineId: string,
  medicineName: string
): ShipmentTransaction {
  return {
    medicineId,
    medicineName,
    courier: pickRandom(COURIERS),
    trackingNumber: generateTrackingNumber(),
    status: pickRandom(STATUSES),
    timestamp: new Date(),
  };
}

// Write prescription transaction to Firestore
async function writePrescriptionTransaction(
  clinicId: string,
  transaction: PrescriptionTransaction
): Promise<void> {
  try {
    // Create or update patient record
    const patientRef = db.collection(`clinics/${clinicId}/patients`).doc(transaction.patientId);
    await patientRef.set({
      name: transaction.patientName,
      dateOfBirth: new Date(Date.now() - transaction.age * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      medicalHistory: [],
      allergies: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Create record entry
    const recordRef = db.collection(`clinics/${clinicId}/patients/${transaction.patientId}/records`);
    await recordRef.add({
      date: transaction.timestamp.toISOString().split('T')[0],
      type: 'prescription',
      summary: `AI-suggested medication: ${transaction.medicationSuggested} for symptoms: ${transaction.symptoms}`,
      files: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error writing prescription transaction:', error);
    throw error;
  }
}

// Write shipment transaction to Firestore
async function writeShipmentTransaction(
  clinicId: string,
  transaction: ShipmentTransaction
): Promise<void> {
  try {
    const shipmentRef = db.collection(`clinics/${clinicId}/shipments`);
    await shipmentRef.add({
      medicineId: transaction.medicineId,
      medicineName: transaction.medicineName,
      courier: transaction.courier,
      trackingNumber: transaction.trackingNumber,
      status: transaction.status,
      pickupDate: transaction.timestamp.toISOString().split('T')[0],
      estimatedDelivery: new Date(transaction.timestamp.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      coldChain: Math.random() > 0.5,
      minTemp: Math.random() > 0.5 ? 2 : undefined,
      maxTemp: Math.random() > 0.5 ? 8 : undefined,
      temperatureLog: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error writing shipment transaction:', error);
    throw error;
  }
}

// Simulate transactions
export async function simulateTransactions(
  clinicId: string,
  options: {
    prescriptionCount?: number;
    shipmentCount?: number;
    batchSize?: number;
    delayMs?: number;
    useAI?: boolean;
  } = {}
): Promise<TransactionMetrics> {
  const {
    prescriptionCount = 600,
    shipmentCount = 400,
    batchSize = 50,
    delayMs = 100,
    useAI = true,
  } = options;

  const metrics: TransactionMetrics = {
    prescriptionsProcessed: 0,
    shipmentsProcessed: 0,
    aiApiCalls: 0,
    errors: 0,
    startTime: new Date(),
  };

  console.log(`\n🚀 Starting transaction simulation...`);
  console.log(`📋 Prescriptions: ${prescriptionCount}, Shipments: ${shipmentCount}`);
  console.log(`⚙️  Batch size: ${batchSize}, Delay: ${delayMs}ms\n`);

  // Process prescriptions in batches
  for (let i = 0; i < prescriptionCount; i += batchSize) {
    const batch = Math.min(batchSize, prescriptionCount - i);
    const promises: Promise<void>[] = [];

    for (let j = 0; j < batch; j++) {
      promises.push(
        (async () => {
          try {
            const patient = generateRandomPatient();
            let transaction: PrescriptionTransaction;

            if (useAI && process.env.GOOGLE_AI_API_KEY) {
              metrics.aiApiCalls++;
              transaction = await processPrescriptionTransaction(clinicId, patient);
            } else {
              transaction = {
                patientId: `patient_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                patientName: patient.name,
                age: patient.age,
                weight: patient.weight,
                symptoms: patient.symptoms,
                medicationSuggested: pickRandom(MEDICINE_NAMES),
                timestamp: new Date(),
              };
            }

            await writePrescriptionTransaction(clinicId, transaction);
            metrics.prescriptionsProcessed++;
          } catch (error) {
            metrics.errors++;
            console.error(`Error processing prescription ${i + j + 1}:`, error);
          }
        })()
      );
    }

    await Promise.all(promises);
    console.log(`✅ Processed ${i + batch} / ${prescriptionCount} prescriptions`);
    
    if (delayMs > 0 && i + batch < prescriptionCount) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Process shipments in batches
  for (let i = 0; i < shipmentCount; i += batchSize) {
    const batch = Math.min(batchSize, shipmentCount - i);
    const promises: Promise<void>[] = [];

    for (let j = 0; j < batch; j++) {
      promises.push(
        (async () => {
          try {
            const medicineName = pickRandom(MEDICINE_NAMES);
            const medicineId = `med_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const transaction = processShipmentTransaction(medicineId, medicineName);
            
            await writeShipmentTransaction(clinicId, transaction);
            metrics.shipmentsProcessed++;
          } catch (error) {
            metrics.errors++;
            console.error(`Error processing shipment ${i + j + 1}:`, error);
          }
        })()
      );
    }

    await Promise.all(promises);
    console.log(`📦 Processed ${i + batch} / ${shipmentCount} shipments`);
    
    if (delayMs > 0 && i + batch < shipmentCount) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  metrics.endTime = new Date();
  metrics.duration = metrics.endTime.getTime() - metrics.startTime.getTime();

  console.log(`\n✨ Simulation complete!`);
  console.log(`📊 Metrics:`);
  console.log(`   - Prescriptions: ${metrics.prescriptionsProcessed}`);
  console.log(`   - Shipments: ${metrics.shipmentsProcessed}`);
  console.log(`   - Total transactions: ${metrics.prescriptionsProcessed + metrics.shipmentsProcessed}`);
  console.log(`   - AI API calls: ${metrics.aiApiCalls}`);
  console.log(`   - Errors: ${metrics.errors}`);
  console.log(`   - Duration: ${(metrics.duration / 1000).toFixed(2)}s`);
  console.log(`   - Rate: ${((metrics.prescriptionsProcessed + metrics.shipmentsProcessed) / (metrics.duration / 1000)).toFixed(2)} transactions/sec\n`);

  return metrics;
}

// CLI interface
if (require.main === module) {
  const clinicId = process.env.CLINIC_ID || 'default-clinic';
  const prescriptionCount = parseInt(process.env.PRESCRIPTION_COUNT || '600', 10);
  const shipmentCount = parseInt(process.env.SHIPMENT_COUNT || '400', 10);
  const batchSize = parseInt(process.env.BATCH_SIZE || '50', 10);
  const delayMs = parseInt(process.env.DELAY_MS || '100', 10);
  const useAI = process.env.USE_AI !== 'false';

  simulateTransactions(clinicId, {
    prescriptionCount,
    shipmentCount,
    batchSize,
    delayMs,
    useAI,
  })
    .then((metrics) => {
      // Save metrics to file
      const metricsPath = path.join(process.cwd(), 'transaction-metrics.json');
      fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
      console.log(`📄 Metrics saved to ${metricsPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Simulation failed:', error);
      process.exit(1);
    });
}
