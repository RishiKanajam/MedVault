'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import QRCode from 'qrcode.react';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  batchNo: z.string().min(1, 'Batch number is required'),
  quantity: z.coerce.number().min(0, 'Quantity must be 0 or greater'),
  expiryDate: z.date({
    required_error: 'Expiry date is required',
  }).refine((date) => date > new Date(), {
    message: 'Expiry date must be in the future',
  }),
  coldChain: z.boolean().default(false),
  temperatureRange: z.object({
    min: z.coerce.number().min(-50, 'Minimum temperature must be at least -50°C').max(50, 'Maximum temperature must be at most 50°C'),
    max: z.coerce.number().min(-50, 'Minimum temperature must be at least -50°C').max(50, 'Maximum temperature must be at most 50°C'),
  }).optional().refine(
    (data) => {
      if (!data) return true;
      return data.min < data.max;
    },
    {
      message: 'Minimum temperature must be less than maximum temperature',
    }
  ),
});

type FormValues = z.infer<typeof formSchema>;

export function AddMedicineButton({ onMedicineAdded }: { onMedicineAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      manufacturer: '',
      batchNo: '',
      quantity: 0,
      coldChain: false,
      temperatureRange: {
        min: 0,
        max: 0,
      },
    },
  });

  const watchColdChain = form.watch('coldChain');

  const onSubmit = async (data: FormValues) => {
    if (!user?.uid || !profile?.clinicId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add medicine.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const dbInstance = db;
      if (!dbInstance) {
        throw new Error('Firestore is not initialized');
      }

      const medicineRef = doc(dbInstance, 'clinics', profile.clinicId, 'medicines', data.batchNo);
      const payload: any = {
        ...data,
        expiryDate: format(data.expiryDate, 'yyyy-MM-dd'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (!data.coldChain) {
        delete payload.temperatureRange;
      }
      await setDoc(medicineRef, payload);

      toast({
        title: 'Success',
        description: 'Medicine added successfully.',
      });

      setOpen(false);
      form.reset();
      if (onMedicineAdded) onMedicineAdded();
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast({
        title: 'Error',
        description: 'Failed to add medicine. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Generate QR code value when form data changes
  const generateQRValue = (data: FormValues) => {
    let expiry = '';
    try {
      expiry = data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : '';
    } catch {
      expiry = '';
    }
    return JSON.stringify({
      name: data.name ?? '',
      batchNo: data.batchNo ?? '',
      expiryDate: expiry,
      coldChain: data.coldChain ?? false,
      ...(data.coldChain && data.temperatureRange
        ? { temperatureRange: data.temperatureRange }
        : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Medicine</DialogTitle>
          <DialogDescription>
            Enter the details of the new medicine. All fields marked with * are
            required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Medicine name" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer *</FormLabel>
                  <FormControl>
                    <Input placeholder="Manufacturer name" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batchNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Batch number" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} value={field.value ?? 0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coldChain"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Cold Chain</FormLabel>
                    <FormDescription>
                      Enable if this medicine requires temperature control
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchColdChain && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="temperatureRange.min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Temperature (°C) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value ?? ''} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          placeholder="-20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temperatureRange.max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Temperature (°C) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value ?? ''} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          placeholder="8"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.formState.isValid && (
              <div className="flex justify-center p-4 border rounded-lg">
                <QRCode
                  value={generateQRValue(form.getValues())}
                  size={128}
                  level="M"
                />
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding...' : 'Add Medicine'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
