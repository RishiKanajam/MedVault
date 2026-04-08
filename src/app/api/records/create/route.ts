import { NextRequest } from 'next/server';
import { verifySession, ensureFirebaseAdmin } from '@/lib/auth';
import { ApiHandler } from '@/lib/api-handler';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';

const createRecordSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientAge: z.number().int().min(0).max(150, 'Invalid age'),
  patientEmail: z.string().email().optional().nullable(),
  patientPhone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  drugClass: z.string().min(1, 'Drug class is required'),
  dosage: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  confidence: z.number().min(0).max(100),
  symptoms: z.string().optional().nullable(),
  citations: z.array(z.object({
    title: z.string(),
    abstract: z.string(),
    url: z.string().url(),
  })).optional().default([]),
  photoUrl: z.string().url().optional().nullable(),
});

export async function POST(req: NextRequest) {
  return ApiHandler.handleRequest(req, createRecordSchema, async (data, req) => {
    // Verify authentication and get decoded token
    let decodedToken;
    try {
      decodedToken = await verifySession(req);
    } catch (authError: any) {
      if (authError.message?.includes('session') || authError.message?.includes('cookie') || authError.message?.includes('token')) {
        throw { ...authError, statusCode: 401 };
      }
      throw authError;
    }

    // Get clinicId from user profile
    // verifySession already calls ensureFirebaseAdmin, so Firebase Admin is initialized
    ensureFirebaseAdmin(); // Ensure it's initialized before getFirestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data();
    const clinicId = userData?.clinicId;

    if (!clinicId) {
      throw new Error('Clinic ID not found in user profile');
    }

    // Find or create patient by name (using Admin SDK — safe on the server)
    const patientsRef = db.collection(`clinics/${clinicId}/patients`);
    const patientsSnap = await patientsRef.orderBy('createdAt', 'desc').get();

    let patientId: string;
    const matchedDoc = patientsSnap.docs.find(
      (d) => (d.data().name as string).toLowerCase() === data.patientName.toLowerCase()
    );

    if (matchedDoc) {
      patientId = matchedDoc.id;
    } else {
      const currentYear = new Date().getFullYear();
      const approximateDOB = `${currentYear - data.patientAge}-01-01`;
      const normalizedDateOfBirth =
        data.dateOfBirth && data.dateOfBirth.trim().length > 0
          ? data.dateOfBirth
          : approximateDOB;

      const newPatientData: Record<string, unknown> = {
        name: data.patientName,
        dateOfBirth: normalizedDateOfBirth,
        medicalHistory: [],
        allergies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (data.patientEmail) newPatientData.email = data.patientEmail;
      if (data.patientPhone) newPatientData.phone = data.patientPhone;

      const newPatientRef = await patientsRef.add(newPatientData);
      patientId = newPatientRef.id;
    }

    // Build record summary
    const isoString = new Date().toISOString();
    const today = isoString.split('T')[0] ?? isoString;
    const summary = [
      'AI-Powered Medication Suggestion',
      `Drug Class: ${data.drugClass}`,
      data.dosage ? `Dosage: ${data.dosage}` : '',
      data.duration ? `Duration: ${data.duration}` : '',
      `Confidence: ${data.confidence}%`,
      data.symptoms ? `Symptoms: ${data.symptoms}` : '',
    ].filter(Boolean).join('. ');

    const files: Array<{ name: string; url: string }> = [];
    if (data.photoUrl) files.push({ name: 'Rash Photo', url: data.photoUrl });

    // Write record via Admin SDK
    const recordRef = await db
      .collection(`clinics/${clinicId}/patients/${patientId}/records`)
      .add({
        patientId,
        date: today,
        type: 'prescription',
        summary,
        files,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    const recordId = recordRef.id;

    return {
      recordId,
      patientId,
      message: 'Record saved successfully',
    };
  });
}
