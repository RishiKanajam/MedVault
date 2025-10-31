import { NextRequest } from 'next/server';
import { verifySession, ensureFirebaseAdmin } from '@/lib/auth';
import { ApiHandler } from '@/lib/api-handler';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';

const emptySchema = z.object({});

export async function GET(req: NextRequest) {
  return ApiHandler.handleGetRequest(req, emptySchema, async () => {
    // Verify authentication
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
    ensureFirebaseAdmin(); // Ensure Firebase Admin is initialized
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

    // Get all patients for this clinic
    const patientsRef = db.collection(`clinics/${clinicId}/patients`);
    const patientsSnapshot = await patientsRef.get();
    
    // Get recent records from all patients (last 10)
    const allRecords: any[] = [];
    
    for (const patientDoc of patientsSnapshot.docs) {
      const patientId = patientDoc.id;
      const recordsRef = db.collection(`clinics/${clinicId}/patients/${patientId}/records`);
      const recordsSnapshot = await recordsRef.orderBy('date', 'desc').limit(5).get();
      
      recordsSnapshot.forEach(doc => {
        const data = doc.data();
        allRecords.push({
          id: doc.id,
          patientId,
          patientName: patientDoc.data().name,
          date: data.date,
          type: data.type,
          summary: data.summary,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });
    }
    
    // Sort by date descending and limit to 10
    const recentRecords = allRecords
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return { records: recentRecords };
  });
}

