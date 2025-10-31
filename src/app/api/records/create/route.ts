import { NextRequest } from 'next/server';
import { verifySession, ensureFirebaseAdmin } from '@/lib/auth';
import { ApiHandler } from '@/lib/api-handler';
import { PatientService, RecordService } from '@/lib/firestore';
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

    // Find or create patient by name
    let patientId: string;
    const patients = await PatientService.getPatients(clinicId);
    const existingPatient = patients.find(p => p.name.toLowerCase() === data.patientName.toLowerCase());

    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      // Create new patient
      // Calculate approximate date of birth from age (using current year)
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - data.patientAge;
      const approximateDOB = `${birthYear}-01-01`; // Approximate DOB

      patientId = await PatientService.addPatient(clinicId, {
        name: data.patientName,
        email: data.patientEmail || undefined,
        phone: data.patientPhone || undefined,
        dateOfBirth: data.dateOfBirth || approximateDOB,
        medicalHistory: [],
        allergies: [],
      });
    }

    // Create record summary
    const today = new Date().toISOString().split('T')[0];
    const summaryParts = [
      `AI-Powered Medication Suggestion`,
      `Drug Class: ${data.drugClass}`,
      data.dosage ? `Dosage: ${data.dosage}` : '',
      data.duration ? `Duration: ${data.duration}` : '',
      `Confidence: ${data.confidence}%`,
      data.symptoms ? `Symptoms: ${data.symptoms}` : '',
    ].filter(Boolean);
    
    const summary = summaryParts.join('. ');

    // Prepare files array
    const files = data.photoUrl ? [{
      name: 'Rash Photo',
      url: data.photoUrl,
    }] : [];

    // Add record
    const recordId = await RecordService.addRecord(clinicId, patientId, {
      patientId,
      date: today,
      type: 'prescription',
      summary,
      files,
    });

    return {
      recordId,
      patientId,
      message: 'Record saved successfully',
    };
  });
}

