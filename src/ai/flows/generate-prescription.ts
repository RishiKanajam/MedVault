'use server';

/**
 * @fileOverview An AI agent for generating prescription recommendations based on patient symptoms and images.
 *
 * - generatePrescription - A function that generates prescription recommendations.
 * - GeneratePrescriptionInput - The input type for the generatePrescription function.
 * - GeneratePrescriptionOutput - The return type for the generatePrescription function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GeneratePrescriptionInputSchema = z.object({
  name: z.string().describe('Patient name'),
  age: z.number().describe('Patient age'),
  weight: z.number().describe('Patient weight in kg'),
  vitals: z.string().describe('Patient vitals'),
  symptoms: z.string().describe('Patient symptoms'),
  photoDataUri: z
    .string()
    .describe(
      "A photo related to the symptoms, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
});
export type GeneratePrescriptionInput = z.infer<typeof GeneratePrescriptionInputSchema>;

const GeneratePrescriptionOutputSchema = z.object({
  prescription: z.string().describe('Recommended drug and dosage'),
  rationale: z.string().describe('Rationale for the prescription'),
  dosageGuidelines: z.string().describe('Dosage guidelines and citations'),
});
export type GeneratePrescriptionOutput = z.infer<typeof GeneratePrescriptionOutputSchema>;

export async function generatePrescription(
  input: GeneratePrescriptionInput
): Promise<GeneratePrescriptionOutput> {
  return generatePrescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePrescriptionPrompt',
  input: {
    schema: z.object({
      name: z.string().describe('Patient name'),
      age: z.number().describe('Patient age'),
      weight: z.number().describe('Patient weight in kg'),
      vitals: z.string().describe('Patient vitals'),
      symptoms: z.string().describe('Patient symptoms'),
      photoDataUri: z
        .string()
        .describe(
          "A photo related to the symptoms, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        )
        .optional(),
    }),
  },
  output: {
    schema: z.object({
      prescription: z.string().describe('Recommended drug and dosage'),
      rationale: z.string().describe('Rationale for the prescription'),
      dosageGuidelines: z.string().describe('Dosage guidelines and citations'),
    }),
  },
  prompt: `Given the following patient information, recommend a drug, dosage, duration, and relevant citations. Explain the rationale for the prescription and provide dosage guidelines.

Patient Name: {{{name}}}
Patient Age: {{{age}}}
Patient Weight: {{{weight}}} kg
Patient Vitals: {{{vitals}}}
Patient Symptoms: {{{symptoms}}}
{{~#if photoDataUri}}Photo: {{media url=photoDataUri}}{{/if}}

Response:
Prescription: {{prescription}}
Rationale: {{rationale}}
Dosage Guidelines: {{dosageGuidelines}}`,
});

const generatePrescriptionFlow = ai.defineFlow<
  typeof GeneratePrescriptionInputSchema,
  typeof GeneratePrescriptionOutputSchema
>(
  {
    name: 'generatePrescriptionFlow',
    inputSchema: GeneratePrescriptionInputSchema,
    outputSchema: GeneratePrescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
