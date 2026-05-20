'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  TriangleAlert, Pill, ArrowRight, CheckCircle2,
  Thermometer, Heart, User, FileImage, LogIn, ChevronRight,
} from 'lucide-react';

const DEMO_PATIENT = {
  name: 'Anaya Patel',
  age: 36,
  weight: 68,
  bloodPressure: '122/78',
  temperature: 38.3,
  symptoms:
    'Persistent dry cough for 5 days, mild fever (38.3°C), general fatigue and malaise, mild sore throat. ' +
    'No history of asthma, COPD, or chronic respiratory conditions. No known drug allergies. ' +
    'Recent occupational exposure to coworkers with similar symptoms. Fully vaccinated.',
  rashNote: 'Mild erythematous papular rash on bilateral forearms — consistent with viral exanthem',
};

const DEMO_RESULT = {
  drugClass: 'Analgesics / Antipyretics + OTC Antitussives',
  confidence: 87,
  recommendedMedications: [
    {
      name: 'Acetaminophen (Paracetamol)',
      dosage: '500–1000 mg',
      frequency: 'Every 4–6 hours as needed',
      duration: '5–7 days',
    },
    {
      name: 'Dextromethorphan HBr',
      dosage: '15–30 mg',
      frequency: 'Every 6–8 hours as needed',
      duration: '5–7 days',
    },
  ],
  sideEffects: [
    'Acetaminophen: Hepatotoxicity at cumulative doses >4 g/day — avoid co-administration with other acetaminophen-containing products',
    'Dextromethorphan: Drowsiness, mild dizziness, nausea; avoid operating heavy machinery',
    'Both agents: Contraindicated in patients with known hypersensitivity to respective compounds',
  ],
  interactions: [
    'Dextromethorphan + MAOIs: Absolute contraindication — risk of serotonin syndrome',
    'Acetaminophen + Warfarin: Enhanced anticoagulant effect at therapeutic doses; monitor INR if applicable',
    'No clinically significant interactions identified with patient-reported medication history',
  ],
  alternatives: [
    'Ibuprofen 400 mg q6–8h if acetaminophen is contraindicated (administer with food; monitor renal function)',
    'Benzocaine/menthol lozenges for adjunct symptomatic throat relief',
    'Guaifenesin 200–400 mg q4h as expectorant if productive cough develops',
  ],
  followUp:
    'Reassess in 5–7 days. Escalate workup (CBC, CRP, chest X-ray) if: fever >39.5°C persists, dyspnea develops, SpO₂ <95%, or no clinical improvement after 7 days. Consider rapid influenza / COVID-19 antigen testing if epidemiologically indicated.',
  citations: [
    {
      title: 'Management of Acute Upper Respiratory Tract Infections in Adults',
      abstract:
        'Systematic review evaluating evidence-based approaches to managing URTI symptoms — fever, cough, pharyngitis — in otherwise healthy adults with focus on OTC analgesic and antitussive agents.',
    },
    {
      title: 'Dextromethorphan: Safety Profile and Drug Interaction Review',
      abstract:
        'Comprehensive review of dextromethorphan pharmacokinetics and clinically relevant interactions, emphasising serotonergic interactions and CNS effects at therapeutic doses.',
    },
  ],
};

function PatientInputCard() {
  return (
    <Card className="w-full border-none shadow-lg ring-1 ring-primary/15">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl font-semibold tracking-tight">Sample Patient Input</CardTitle>
          <Badge variant="secondary" className="text-xs">Demo data</Badge>
        </div>
        <CardDescription>Pre-filled patient context submitted to the AI assistant.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <section className="rounded-xl border border-primary/10 bg-primary/5 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Patient Profile</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Name" value={DEMO_PATIENT.name} />
            <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Age" value={`${DEMO_PATIENT.age} yrs`} />
            <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Weight" value={`${DEMO_PATIENT.weight} kg`} />
            <InfoRow icon={<Heart className="h-3.5 w-3.5" />} label="Blood Pressure" value={DEMO_PATIENT.bloodPressure} />
            <InfoRow icon={<Thermometer className="h-3.5 w-3.5" />} label="Temperature" value={`${DEMO_PATIENT.temperature}°C`} />
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Symptom Narrative</h2>
          <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
            <p className="text-sm leading-relaxed text-foreground">{DEMO_PATIENT.symptoms}</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Visual Evidence</h2>
          <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileImage className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">rash-photo-sample.jpg</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                AI classification: <span className="font-medium text-foreground">{DEMO_PATIENT.rashNote}</span>
              </p>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items, variant = 'default' }: { items: string[]; variant?: 'default' | 'warning' | 'danger' }) {
  const iconClass =
    variant === 'danger'
      ? 'text-destructive'
      : variant === 'warning'
      ? 'text-amber-500'
      : 'text-primary';

  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
          <ChevronRight className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function AIResultCard() {
  return (
    <Card className="mx-auto w-full rounded-2xl border border-border/60 bg-background/95 shadow-lg">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-xl font-semibold text-foreground">AI Clinical Analysis</CardTitle>
          <CardDescription>Structured decision-support output — for physician review only.</CardDescription>
        </div>
        <Badge className="min-w-[140px] justify-center rounded-full bg-primary/10 text-primary">
          Confidence {DEMO_RESULT.confidence}%
        </Badge>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-[540px] pr-4">
          <div className="space-y-4">
            <ResultSection title="Recommended Drug Class">
              <p className="text-base font-medium text-foreground">{DEMO_RESULT.drugClass}</p>
            </ResultSection>

            <ResultSection title="Recommended Medications">
              <div className="space-y-3">
                {DEMO_RESULT.recommendedMedications.map((med, i) => (
                  <div key={i} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="font-semibold text-foreground">{med.name}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span><strong>Dose:</strong> {med.dosage}</span>
                      <span><strong>Frequency:</strong> {med.frequency}</span>
                      <span><strong>Duration:</strong> {med.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ResultSection>

            <ResultSection title="Side Effects">
              <BulletList items={DEMO_RESULT.sideEffects} variant="warning" />
            </ResultSection>

            <ResultSection title="Drug Interactions">
              <BulletList items={DEMO_RESULT.interactions} variant="danger" />
            </ResultSection>

            <ResultSection title="Alternatives">
              <BulletList items={DEMO_RESULT.alternatives} />
            </ResultSection>

            <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Follow-Up Guidance</h3>
              <p className="text-sm leading-relaxed text-foreground">{DEMO_RESULT.followUp}</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Supporting Literature</h3>
              {DEMO_RESULT.citations.map((c, i) => (
                <div key={i} className="rounded-xl border border-border/40 bg-background p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-foreground">{c.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{c.abstract}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3 w-3" /> PubMed indexed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Demo banner */}
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center dark:border-amber-800 dark:bg-amber-950">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          This is a <strong>live demo</strong> using sample data — no API call, no login required.{' '}
          <Link href="/auth/signup" className="underline hover:text-amber-900">
            Sign up free
          </Link>{' '}
          to run real queries.
        </p>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">RxAI · Demo</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Clinical Support Assistant
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Feed patient context and symptoms to generate AI-backed treatment options that stay clinically grounded.
            </p>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/login">
                <LogIn className="mr-1.5 h-4 w-4" /> Log In
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/signup">
                Sign Up Free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-800">
          <TriangleAlert className="h-4 w-4 !text-amber-600" />
          <AlertDescription>
            <strong>Clinical decision support only.</strong> AI-generated suggestions are not a substitute for
            professional medical judgment. All recommendations must be reviewed and approved by a licensed physician.
          </AlertDescription>
        </Alert>

        {/* Main two-column layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <PatientInputCard />
          <AIResultCard />
        </div>

        {/* CTA footer */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground">Ready to try with real patient data?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a free account to run live assessments, save to patient history, and access the full MedVault platform.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild>
              <Link href="/auth/signup">
                Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
