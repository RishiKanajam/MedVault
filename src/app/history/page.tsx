
// src/app/(protected)/history/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, PlusCircle, Upload, Download, Loader2, User, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/providers/AuthProvider'; // Import useAuth
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// TODO: Replace with Firestore data fetching using React Query based on clinicId from profile
// clinics/{profile.clinicId}/patients
const mockPatients = [
  { id: 'pat1', name: 'Alice Johnson', dob: '1985-03-12', lastVisit: '2024-07-20' },
  { id: 'pat2', name: 'Bob Williams', dob: '1972-11-05', lastVisit: '2024-06-15' },
  { id: 'pat3', name: 'Charlie Brown', dob: '1998-01-30', lastVisit: '2024-08-01' },
];

// TODO: Replace with Firestore data fetching using React Query
// clinics/{profile.clinicId}/patients/{patientId}/records
const mockRecords = {
  pat1: [
    { id: 'rec1a', date: '2024-07-20', type: 'Consultation', summary: 'Routine checkup, prescribed Vitamin D.', files: [{ name: 'ConsultNote_200724.pdf', url: '#' }] },
    { id: 'rec1b', date: '2024-05-10', type: 'Lab Results', summary: 'Blood test results normal.', files: [{ name: 'LabReport_100524.pdf', url: '#' }] },
  ],
  pat2: [
    { id: 'rec2a', date: '2024-06-15', type: 'Follow-up', summary: 'Discussed blood pressure management.', files: [] },
  ],
  pat3: [
    { id: 'rec3a', date: '2024-08-01', type: 'X-Ray Report', summary: 'Chest X-Ray clear.', files: [{ name: 'XRay_010824.jpg', url: '#' }] },
    { id: 'rec3b', date: '2024-07-25', type: 'Initial Visit', summary: 'Presented with cough.', files: [] },
  ],
};

type Patient = typeof mockPatients[0];
type RecordEntry = typeof mockRecords.pat1[0]; // Infer type from mock data structure

export default function PatientHistoryPage() {
  const { profile, authLoading } = useAuth(); // Use profile and loading state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientRecords, setPatientRecords] = useState<RecordEntry[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false); // TODO: Replace with React Query isLoading
  const [isLoadingRecords, setIsLoadingRecords] = useState(false); // TODO: Replace with React Query isLoading
  const [isAddRecordSheetOpen, setIsAddRecordSheetOpen] = useState(false);
  const [newRecordData, setNewRecordData] = useState({ date: '', type: '', summary: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();

  // TODO: Implement actual search filtering logic based on Firestore query or client-side filter
  const filteredPatients = mockPatients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPatient = (patient: Patient) => {
    if (authLoading) return; // Prevent selection while auth is loading
    setSelectedPatient(patient);
    setIsLoadingRecords(true);
    // TODO: Fetch records for patient.id from Firestore based on profile.clinicId
    // `clinics/${profile?.clinicId}/patients/${patient.id}/records`
    console.log(`Fetching records for ${patient.name} in clinic ${profile?.clinicId}`);
    setTimeout(() => { // Simulate fetch delay
      setPatientRecords(mockRecords[patient.id as keyof typeof mockRecords] || []);
      setIsLoadingRecords(false);
    }, 500);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleAddRecordSubmit = async () => {
    if (!selectedPatient || !profile?.clinicId || !newRecordData.date || !newRecordData.type || !newRecordData.summary) {
      toast({ title: "Missing Information", description: "Please ensure clinic, patient, and record details are filled.", variant: "destructive" });
      return;
    }
    setIsUploading(true);

    try {
      // TODO: 1. Upload file to Firebase Storage
      // `clinics/${profile.clinicId}/patients/${selectedPatient.id}/records/${selectedFile.name}`
      let fileUrl = '#'; // Placeholder
      let fileName = '';
      if (selectedFile) {
        console.log(`Simulating upload of ${selectedFile.name} to clinics/${profile.clinicId}/patients/${selectedPatient.id}/records/`);
        // const storageRef = ref(storage, `clinics/${profile.clinicId}/patients/${selectedPatient.id}/records/${selectedFile.name}`);
        // ... upload logic ...
        // fileUrl = await getDownloadURL(...);
        fileName = selectedFile.name;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload delay
         fileUrl = `https://example.com/path/to/${fileName}`; // Simulated URL
        toast({ title: "File Uploaded", description: `${fileName} uploaded successfully.` });
      }

      // TODO: 2. Add record data to Firestore
      // `clinics/${profile.clinicId}/patients/${selectedPatient.id}/records`
      const newRecord: RecordEntry = {
        id: `rec_${Date.now()}`, // Replace with Firestore generated ID
        date: newRecordData.date,
        type: newRecordData.type,
        summary: newRecordData.summary,
        files: selectedFile ? [{ name: fileName, url: fileUrl }] : [],
      };
      console.log(`Adding record to Firestore in clinics/${profile.clinicId}/patients/${selectedPatient.id}/records :`, newRecord);
      // await addDoc(collection(db, `clinics/${profile.clinicId}/patients/${selectedPatient.id}/records`), newRecord);

      // Update local state or refetch
      setPatientRecords(prev => [...prev, newRecord]);

      toast({ title: "Record Added", description: "Patient record saved successfully." });
      setIsAddRecordSheetOpen(false);
      setNewRecordData({ date: '', type: '', summary: '' }); // Reset form
      setSelectedFile(null); // Reset file input

    } catch (error) {
      console.error("Error adding record:", error);
      toast({ title: "Error", description: "Could not save the patient record.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Display loading skeletons if auth or data is loading
  if (authLoading) {
     return <div className="p-6"><Skeleton className="h-[70vh] w-full" /></div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
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
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-250px)]">
              {isLoadingPatients ? (
                <div className="p-4 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredPatients.length > 0 ? (
                <Table>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`cursor-pointer ${selectedPatient?.id === patient.id ? 'bg-muted' : ''}`}
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
        <Card className="panel-primary sticky top-[76px]"> {/* Adjust top position */}
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
                <Button size="sm" disabled={!selectedPatient || !profile?.clinicId} onClick={() => setIsAddRecordSheetOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Record
                </Button>
              </SheetTrigger>
              <SheetContent className="overlay-secondary"> {/* Use secondary overlay */}
                <SheetHeader>
                  <SheetTitle>Add New Record for {selectedPatient?.name}</SheetTitle>
                  <SheetDescription>Fill in the details and upload any relevant files.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="record-date" className="text-right">Date</Label>
                    <Input id="record-date" type="date" value={newRecordData.date} onChange={(e) => setNewRecordData(prev => ({ ...prev, date: e.target.value }))} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="record-type" className="text-right">Type</Label>
                    <Input id="record-type" placeholder="e.g., Consultation, Lab, Imaging" value={newRecordData.type} onChange={(e) => setNewRecordData(prev => ({ ...prev, type: e.target.value }))} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="record-summary" className="text-right">Summary</Label>
                    <Textarea id="record-summary" placeholder="Brief summary of the record..." value={newRecordData.summary} onChange={(e) => setNewRecordData(prev => ({ ...prev, summary: e.target.value }))} className="col-span-3 min-h-[100px]" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="record-file" className="text-right">File</Label>
                    <Input id="record-file" type="file" onChange={handleFileChange} className="col-span-3" />
                  </div>
                   {selectedFile && <p className="text-sm text-muted-foreground col-span-4 px-4">Selected: {selectedFile.name}</p>}
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                     <Button variant="outline">Cancel</Button>
                  </SheetClose>
                  <Button onClick={handleAddRecordSubmit} disabled={isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Saving...' : 'Save Record'}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </CardHeader>
          <CardContent className="min-h-[60vh]">
            {isLoadingRecords && (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!isLoadingRecords && selectedPatient && patientRecords.length > 0 && (
              <ScrollArea className="h-[calc(100vh - 200px)]">
                 <div className="space-y-4 p-1">
                    {patientRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => (
                    <Card key={record.id} className="overflow-hidden panel-primary"> {/* Use panel-primary for consistency */}
                        <CardHeader className="p-4 bg-muted/30 border-b flex flex-row justify-between items-center">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> {record.date}</CardTitle>
                                <CardDescription>{record.type}</CardDescription>
                            </div>
                            {record.files && record.files.length > 0 && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={record.files[0].url} target="_blank" rel="noopener noreferrer" download={record.files[0].name}>
                                        <Download className="mr-2 h-3 w-3" />
                                        View File
                                    </a>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-4 text-sm">
                           <p>{record.summary}</p>
                           {record.files && record.files.length > 0 && (
                               <p className="text-xs text-muted-foreground mt-2">File: {record.files[0].name}</p>
                           )}
                        </CardContent>
                    </Card>
                    ))}
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
  );
}
