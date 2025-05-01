'use server';

/**
 * @fileOverview An AI agent for generating prescription recommendations based on patient symptoms and images, including confidence score and citations.
 *
 * - generatePrescription - A function that generates prescription recommendations.
 * - GeneratePrescriptionInput - The input type for the generatePrescription function.
 * - GeneratePrescriptionOutput - The return type for the generatePrescription function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// --- Input Schema (remains the same) ---
const GeneratePrescriptionInputSchema = z.object({
  name: z.string().describe('Patient name'),
  age: z.number().describe('Patient age'),
  weight: z.number().describe('Patient weight in kg'),
  vitals: z.string().describe('Patient vitals'),
  symptoms: z.string().describe('Patient symptoms (comma-separated string or detailed description)'),
  photoDataUri: z
    .string()
    .describe(
      "Optional: A photo related to the symptoms (e.g., rash), as a data URI (data:<mimetype>;base64,<encoded_data>)."
    )
    .optional(),
  // Optional: Add past medical history or allergies if needed
  // medicalHistory: z.string().optional().describe('Relevant past medical history or known allergies'),
});
export type GeneratePrescriptionInput = z.infer<typeof GeneratePrescriptionInputSchema>;


// --- Output Schema: Added confidence score and citations ---
const GeneratePrescriptionOutputSchema = z.object({
  prescription: z.string().describe('Recommended drug, dosage, and duration.'),
  rationale: z.string().describe('Explanation for the prescription recommendation.'),
  dosageGuidelines: z.string().describe('Specific instructions for administration and monitoring.'),
  citations: z.array(z.object({ // Array for multiple citations
      source: z.string().describe('Source of the citation (e.g., PubMed, DailyMed, Guideline name).'),
      reference: z.string().describe('Specific reference (e.g., PMID, URL, guideline section).'),
    })).describe('List of citations supporting the recommendation and guidelines.'),
  confidenceScore: z.number().min(0).max(100).describe('AI confidence in the recommendation (0-100).'),
  secondOpinionNeeded: z.boolean().optional().describe('Flag indicating if confidence is low and a second opinion step might be beneficial.'),
});
export type GeneratePrescriptionOutput = z.infer<typeof GeneratePrescriptionOutputSchema>;


// --- Exported Function (remains the same) ---
export async function generatePrescription(
  input: GeneratePrescriptionInput
): Promise<GeneratePrescriptionOutput> {
  // TODO: Potentially add a second opinion step here if initial confidence is low
  return generatePrescriptionFlow(input);
}


// --- AI Prompt Definition: Updated for confidence and citations ---
const prompt = ai.definePrompt({
  name: 'generatePrescriptionPrompt',
  // Use a more capable model if needed for complex reasoning & citations
  // model: ai.getModel('googleai/gemini-1.5-pro-latest'), // Or similar powerful model
  model: ai.getModel('googleai/gemini-pro'), // Keep gemini-pro as a baseline

  input: { schema: GeneratePrescriptionInputSchema },
  output: { schema: GeneratePrescriptionOutputSchema },

  // Updated prompt instructions
  prompt: `You are an AI clinical decision support assistant. Analyze the following patient information and provide a prescription recommendation.

  **Patient Information:**
  - Name: {{{name}}}
  - Age: {{{age}}} years
  - Weight: {{{weight}}} kg
  - Vitals: {{{vitals}}}
  - Symptoms: {{{symptoms}}}
  {{#if photoDataUri}}- Symptom Photo: {{media url=photoDataUri}}{{/if}}
  {{#if medicalHistory}}- Medical History/Allergies: {{{medicalHistory}}}{{/if}}

  **Instructions:**
  1.  **Recommend** a specific drug, dosage (consider age/weight), and duration. Be precise.
  2.  Provide a clear **Rationale** explaining why this drug is appropriate, considering the symptoms and patient factors.
  3.  Detail **Dosage Guidelines**, including administration instructions and any necessary monitoring.
  4.  **Cite Sources:** Provide at least 1-2 relevant citations from reputable sources (e.g., clinical guidelines, PubMed, DailyMed) supporting the recommendation AND dosage. Format as an array: [{ source: "Source Name", reference: "Details/Link/PMID" }]. Use placeholder reference like "Guideline Section X.Y" or "PMID: 12345678" if exact link is unavailable.
  5.  Estimate your **Confidence Score** (0-100) for this recommendation based on the provided information clarity and symptom specificity.
  6.  Set **secondOpinionNeeded** to true if confidence is below 70, otherwise false.

  **Output Format (Strict JSON):**
  {
    "prescription": "...",
    "rationale": "...",
    "dosageGuidelines": "...",
    "citations": [ { "source": "...", "reference": "..." } ],
    "confidenceScore": ...,
    "secondOpinionNeeded": ...
  }`,
  // Request JSON output
   config: { responseFormat: "json" }
});


// --- AI Flow Definition ---
const generatePrescriptionFlow = ai.defineFlow<
  typeof GeneratePrescriptionInputSchema,
  typeof GeneratePrescriptionOutputSchema
>(
  {
    name: 'generatePrescriptionFlow',
    inputSchema: GeneratePrescriptionInputSchema,
    outputSchema: GeneratePrescriptionOutputSchema,
  },
  async (input) => {
    console.log("[AI Flow] generatePrescriptionFlow started with input:", input);
    try {
      const { output } = await prompt(input);

      if (!output) {
        console.error("[AI Flow] AI returned no output.");
        throw new Error('AI failed to generate a response.');
      }

       console.log("[AI Flow] Raw AI Output:", output);

       // Basic validation of the output structure (Zod schema handles detailed validation)
       if (typeof output.confidenceScore !== 'number' || !Array.isArray(output.citations)) {
           console.error("[AI Flow] AI output structure is invalid:", output);
           throw new Error('AI returned an invalid output format.');
       }


      // Optionally trigger second opinion flow if needed
      if (output.secondOpinionNeeded && output.confidenceScore < 70) {
         console.log(`[AI Flow] Confidence low (${output.confidenceScore}). Suggesting second opinion.`);
         // TODO: Implement a call to a second, potentially more detailed, AI flow here.
         // For now, we just return the initial result with the flag set.
         // const secondOpinionResult = await getSecondOpinionFlow(input, output);
         // return secondOpinionResult;
      }

      console.log("[AI Flow] generatePrescriptionFlow completed successfully.");
      return output;

    } catch (error) {
       console.error('[AI Flow] Error in generatePrescriptionFlow:', error);
       // Return a structured error or re-throw
       // Example structured error response:
        return {
            prescription: "Error generating prescription.",
            rationale: `An error occurred: ${error instanceof Error ? error.message : 'Unknown AI error.'}`,
            dosageGuidelines: "N/A",
            citations: [],
            confidenceScore: 0,
            secondOpinionNeeded: true, // Assume second opinion needed on error
        };
      // Or re-throw: throw error;
    }
  }
);

// TODO: Define getSecondOpinionFlow if implementing the second opinion logic
/*
const getSecondOpinionFlow = ai.defineFlow(...) { ... }
*/
