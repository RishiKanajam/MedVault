import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
export const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number').optional();

// Medicine validation
export const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required').max(200),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(200),
  batchNo: z.string().min(1, 'Batch number is required').max(50),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  coldChain: z.boolean(),
  temperatureRange: z.object({
    min: z.number().min(-50).max(50),
    max: z.number().min(-50).max(50),
  }).optional(),
});

// Shipment validation
export const shipmentSchema = z.object({
  medicineId: z.string().min(1, 'Medicine ID is required'),
  medicineName: z.string().min(1, 'Medicine name is required'),
  courier: z.string().min(1, 'Courier is required'),
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  status: z.enum(['Pre-Transit', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Exception']),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  estimatedDelivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  actualDelivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  coldChain: z.boolean(),
  minTemp: z.number().min(-50).max(50).optional(),
  maxTemp: z.number().min(-50).max(50).optional(),
  currentLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1),
  }).optional(),
});

// Patient validation
export const patientSchema = z.object({
  name: z.string().min(1, 'Patient name is required').max(200),
  email: emailSchema.optional(),
  phone: phoneSchema,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  medicalHistory: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
});

// Record validation
export const recordSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  type: z.enum(['consultation', 'prescription', 'lab_result', 'imaging', 'other']),
  summary: z.string().min(1, 'Summary is required').max(1000),
  files: z.array(z.object({
    name: z.string().min(1),
    url: z.string().url('Invalid URL'),
  })).default([]),
});

// RxAI validation
export const rxaiSchema = z.object({
  name: z.string().min(1, 'Patient name is required'),
  age: z.number().int().min(0).max(150, 'Invalid age'),
  weight: z.number().min(0).max(500, 'Invalid weight').optional().nullable(),
  bloodPressure: z.string().optional().nullable(),
  temperature: z.number().min(30).max(45, 'Invalid temperature range (30-45°C)').optional().nullable(),
  symptoms: z.string().min(1, 'Symptoms are required').max(2000),
  photoUrl: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().url('Invalid photo URL').optional()
  ),
  rashClassification: z.string().optional().nullable(),
});

// Auth validation
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  clinicId: z.string().min(1, 'Clinic ID is required'),
});

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Validation error formatter
export function formatValidationError(error: z.ZodError): ApiError {
  return {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}
