import { describe, it, expect } from '@jest/globals';
import {
  medicineSchema,
  shipmentSchema,
  patientSchema,
  recordSchema,
  rxaiSchema,
  loginSchema,
  signupSchema,
} from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('medicineSchema', () => {
    it('should validate correct medicine data', () => {
      const validMedicine = {
        name: 'Paracetamol',
        manufacturer: 'ABC Pharma',
        batchNo: 'BATCH123',
        quantity: 100,
        expiryDate: '2024-12-31',
        coldChain: false,
      };

      const result = medicineSchema.safeParse(validMedicine);
      expect(result.success).toBe(true);
    });

    it('should reject invalid medicine data', () => {
      const invalidMedicine = {
        name: '',
        manufacturer: 'ABC Pharma',
        batchNo: 'BATCH123',
        quantity: -1,
        expiryDate: 'invalid-date',
        coldChain: false,
      };

      const result = medicineSchema.safeParse(invalidMedicine);
      expect(result.success).toBe(false);
    });
  });

  describe('shipmentSchema', () => {
    it('should validate correct shipment data', () => {
      const validShipment = {
        medicineId: 'med123',
        medicineName: 'Paracetamol',
        courier: 'FedEx',
        trackingNumber: 'TRACK123',
        status: 'In Transit',
        pickupDate: '2024-01-01',
        estimatedDelivery: '2024-01-03',
        coldChain: true,
        minTemp: 2,
        maxTemp: 8,
      };

      const result = shipmentSchema.safeParse(validShipment);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidShipment = {
        medicineId: 'med123',
        medicineName: 'Paracetamol',
        courier: 'FedEx',
        trackingNumber: 'TRACK123',
        status: 'Invalid Status',
        pickupDate: '2024-01-01',
        estimatedDelivery: '2024-01-03',
        coldChain: true,
      };

      const result = shipmentSchema.safeParse(invalidShipment);
      expect(result.success).toBe(false);
    });
  });

  describe('patientSchema', () => {
    it('should validate correct patient data', () => {
      const validPatient = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        medicalHistory: ['Diabetes'],
        allergies: ['Penicillin'],
      };

      const result = patientSchema.safeParse(validPatient);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidPatient = {
        name: 'John Doe',
        email: 'invalid-email',
        dateOfBirth: '1990-01-01',
      };

      const result = patientSchema.safeParse(invalidPatient);
      expect(result.success).toBe(false);
    });
  });

  describe('rxaiSchema', () => {
    it('should validate correct RxAI data', () => {
      const validRxAI = {
        name: 'John Doe',
        age: 30,
        weight: 70,
        bloodPressure: '120/80',
        temperature: 36.5,
        symptoms: 'Headache and fever',
      };

      const result = rxaiSchema.safeParse(validRxAI);
      expect(result.success).toBe(true);
    });

    it('should reject invalid age', () => {
      const invalidRxAI = {
        name: 'John Doe',
        age: 200,
        symptoms: 'Headache',
      };

      const result = rxaiSchema.safeParse(invalidRxAI);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const invalidLogin = {
        email: 'user@example.com',
        password: '123',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const validSignup = {
        fullName: 'John Doe',
        email: 'user@example.com',
        password: 'password123',
        clinicId: 'clinic123',
      };

      const result = signupSchema.safeParse(validSignup);
      expect(result.success).toBe(true);
    });

    it('should reject missing clinicId', () => {
      const invalidSignup = {
        fullName: 'John Doe',
        email: 'user@example.com',
        password: 'password123',
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).toBe(false);
    });
  });
});
