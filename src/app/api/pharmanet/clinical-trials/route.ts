import { NextResponse } from 'next/server';
import { auth } from 'firebase-admin';

const CLINICAL_TRIALS_API_URL = 'https://clinicaltrials.gov/api/query/study_fields';

export async function GET(req: Request) {
  try {
    const sessionCookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('__session='));
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth().verifySessionCookie(sessionCookie.split('=')[1]);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch recent clinical trials
    const response = await fetch(
      `${CLINICAL_TRIALS_API_URL}?expr=AREA[OverallStatus]Recruiting&fields=NCTId,BriefTitle,OverallStatus,BriefSummary,StudyFirstPostDate,URL&min_rnk=1&max_rnk=10&fmt=json`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from ClinicalTrials.gov API');
    }

    const data = await response.json();
    
    // Transform the response to match our frontend interface
    const trials = data.StudyFieldsResponse.StudyFields.map((trial: any) => ({
      id: trial.NCTId[0],
      title: trial.BriefTitle[0],
      status: trial.OverallStatus[0],
      summary: trial.BriefSummary?.[0] || 'No summary available',
      url: `https://clinicaltrials.gov/study/${trial.NCTId[0]}`,
      date: trial.StudyFirstPostDate[0],
    }));

    return NextResponse.json(trials);
  } catch (error) {
    console.error('Error in clinical-trials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clinical trials' },
      { status: 500 }
    );
  }
} 