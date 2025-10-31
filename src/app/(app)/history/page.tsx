// src/app/history/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, PlusCircle, Upload, Download, Loader2, User, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { usePatients } from '@/hooks/use-patients';
import { useRecords } from '@/hooks/use-records';
import { Patient } from '@/lib/firestore';
import { PageShell, PageHeader } from '@/components/layout/page';

// Types for Patient History module
interface PatientListItem {
  id: string;
  name: string;
  dob: string;
  lastVisit: string;
}

interface RecordEntry {
  id: string;
  date: string;
  type: string;
  summary: string;
  files: { name: string; url: string }[];
}

export default function PatientHistoryPage() {
  const { profile, authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  
  const { toast } = useToast();
  
  // Fetch patients from Firestore
  const { data: patients = [], isLoading: isLoadingPatients } = usePatients();
  
  // Fetch records for selected patient
  const { data: patientRecords = [], isLoading: isLoadingRecords } = useRecords(selectedPatient?.id || '');

  const [isAddRecordSheetOpen, setIsAddRecordSheetOpen] = useState(false);
  const [newRecordData, setNewRecordData] = useState({ date: '', type: '', summary: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform patients to match PatientListItem interface
  // Note: lastVisit will be calculated when records are loaded for each patient
  const patientListItems: PatientListItem[] = patients.map((patient: Patient) => {
    return {
      id: patient.id,
      name: patient.name,
      dob: patient.dateOfBirth,
      lastVisit: patient.dateOfBirth || new Date().toISOString().split('T')[0], // Placeholder until records are loaded
    };
  });

  // Update lastVisit for selected patient if records are available
  const updatedPatientListItems = patientListItems.map(patient => {
    if (patient.id === selectedPatient?.id && patientRecords.length > 0) {
      return {
        ...patient,
        lastVisit: patientRecords[0].date, // Most recent record date
      };
    }
    return patient;
  });

  // Filter patients based on search term
  const filteredPatients = updatedPatientListItems.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPatient = (patient: PatientListItem) => {
    if (authLoading) return;
    setSelectedPatient(patient);
    setError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleAddRecordSubmit = async () => {
    if (!selectedPatient || !profile?.clinicId || !newRecordData.date || !newRecordData.type || !newRecordData.summary) {
      setError('Please ensure clinic, patient, and record details are filled.');
      toast({ title: "Missing Information", description: "Please ensure clinic, patient, and record details are filled.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    setError(null);

    try {
      // TODO: 1. Upload file to Firebase Storage
      // `clinics/${profile.clinicId}/patients/${selectedPatient.id}/records/${selectedFile.name}`
      let fileUrl = '#';
      let fileName = '';
      if (selectedFile) {
        console.log(`Simulating upload of ${selectedFile.name} to clinics/${profile.clinicId}/patients/${selectedPatient.id}/records/`);
        // const storageRef = ref(storage, `clinics/${profile.clinicId}/patients/${selectedPatient.id}/records/${selectedFile.name}`);
        // ... upload logic ...
        // fileUrl = await getDownloadURL(...);
        fileName = selectedFile.name;
        await new Promise(resolve => setTimeout(resolve, 1000));
        fileUrl = `https://example.com/path/to/${fileName}`;
        toast({ title: "File Uploaded", description: `${fileName} uploaded successfully.` });
      }

      // TODO: 2. Add record data to Firestore
      // `clinics/${profile.clinicId}/patients/${selectedPatient.id}/records`
      const newRecord: RecordEntry = {
        id: `rec_${Date.now()}`,
        date: newRecordData.date,
        type: newRecordData.type,
        summary: newRecordData.summary,
        files: selectedFile ? [{ name: fileName, url: fileUrl }] : [],
      };
      console.log(`Adding record to Firestore in clinics/${profile.clinicId}/patients/${selectedPatient.id}/records :`, newRecord);
      // await addDoc(collection(db, `clinics/${profile.clinicId}/patients/${selectedPatient.id}/records`), newRecord);

      setPatientRecords(prev => [...prev, newRecord]);
      toast({ title: "Record Added", description: "Patient record saved successfully." });
      setIsAddRecordSheetOpen(false);
      setNewRecordData({ date: '', type: '', summary: '' });
      setSelectedFile(null);

    } catch (error) {
      console.error("Error adding record:", error);
      setError('Could not save the patient record.');
      toast({ title: "Error", description: "Could not save the patient record.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading) {
    return (
      <PageShell>
        <Skeleton className="h-[70vh] w-full rounded-2xl bg-muted" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Patient History"
        title="Records Workspace"
        description="Browse every patient file, update visit notes, and keep supporting documents in one place."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Patient List Column */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <Card className="panel-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Patients
            </CardTitle>
            <CardDescription>Select a patient to view their history.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search patients..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search patients"
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-250px)]">
              {isLoadingPatients ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-10 w-full bg-muted" />
                  <Skeleton className="h-10 w-full bg-muted" />
                  <Skeleton className="h-10 w-full bg-muted" />
                </div>
              ) : filteredPatients.length > 0 ? (
                <Table>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`cursor-pointer ${selectedPatient?.id === patient.id ? 'bg-muted' : ''}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSelectPatient(patient);
                          }
                        }}
                        aria-selected={selectedPatient?.id === patient.id}
                      >
                        <TableCell>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-xs text-muted-foreground">DOB: {patient.dob}</div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground hidden sm:table-cell">
                          Last Visit: {patient.lastVisit}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-muted-foreground">No patients found.</div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Patient Records Column */}
      <div className="lg:col-span-2">
        <Card className="panel-primary sticky top-[76px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Patient Records
              </CardTitle>
              <CardDescription>
                {selectedPatient ? `History for ${selectedPatient.name}` : 'Select a patient to view records.'}
              </CardDescription>
            </div>
            <Sheet open={isAddRecordSheetOpen} onOpenChange={setIsAddRecordSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  disabled={!selectedPatient || !profile?.clinicId}
                  onClick={() => setIsAddRecordSheetOpen(true)}
                  aria-label="Add new record"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Record
                </Button>
              </SheetTrigger>
              <SheetContent className="panel-primary">
                <SheetHeader>
                  <SheetTitle>Add New Record for {selectedPatient?.name}</SheetTitle>
                  <SheetDescription>Fill in the details and upload any relevant files.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="record-date" className="text-right">Date</Label>
                    <Input
                      id="record-date"
                      type="date"
                      value={newRecordData.date}
                      onChange={(e) => setNewRecordData(prev => ({ ...prev, date: e.target.value }))}
                      className="col-span-3"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="record-type" className="text-right">Type</Label>
                    <Input
                      id="record-type"
                      placeholder="e.g., Consultation, Lab, Imaging"
                      value={newRecordData.type}
                      onChange={(e) => setNewRecordData(prev => ({ ...prev, type: e.target.value }))}
                      className="col-span-3"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="record-summary" className="text-right">Summary</Label>
                    <Textarea
                      id="record-summary"
                      placeholder="Brief summary of the record..."
                      value={newRecordData.summary}
                      onChange={(e) => setNewRecordData(prev => ({ ...prev, summary: e.target.value }))}
                      className="col-span-3 min-h-[100px]"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="record-file" className="text-right">File</Label>
                    <Input
                      id="record-file"
                      type="file"
                      onChange={handleFileChange}
                      className="col-span-3"
                      aria-label="Upload record file"
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground col-span-4 px-4">Selected: {selectedFile.name}</p>
                  )}
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </SheetClose>
                  <Button onClick={handleAddRecordSubmit} disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Save Record
                      </>
                    )}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </CardHeader>
          <CardContent className="min-h-[60vh]">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {isLoadingRecords && (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!isLoadingRecords && selectedPatient && patientRecords.length > 0 && (
              <ScrollArea className="h-[calc(100vh - 200px)]">
                <div className="space-y-4 p-1">
                  {patientRecords
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => {
                      const primaryFile = record.files?.[0];
                      return (
                        <Card key={record.id} className="overflow-hidden panel-secondary">
                          <CardHeader className="p-4 bg-muted/30 border-b flex flex-row justify-between items-center">
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> {record.date}
                              </CardTitle>
                              <CardDescription>{record.type}</CardDescription>
                            </div>
                            {primaryFile && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={primaryFile.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={primaryFile.name}
                                  aria-label={`Download file: ${primaryFile.name}`}
                                >
                                  <Download className="mr-2 h-3 w-3" />
                                  View File
                                </a>
                              </Button>
                            )}
                          </CardHeader>
                          <CardContent className="p-4 text-sm">
                            <p>{record.summary}</p>
                            {primaryFile && (
                              <p className="text-xs text-muted-foreground mt-2">File: {primaryFile.name}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </ScrollArea>
            )}
            {!isLoadingRecords && selectedPatient && patientRecords.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                No records found for this patient. Use 'Add Record' to start.
              </div>
            )}
            {!isLoadingRecords && !selectedPatient && (
              <div className="p-6 text-center text-muted-foreground">
                Select a patient from the list to view their medical history.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </PageShell>
  );
}
