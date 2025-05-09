// confirm-dosage-details.ts
'use server';
/**
 * @fileOverview AI flow to confirm the healthcare professional's intent to access dosage details for a drug using Gemini/Gemma.
 *
 * - confirmDosageDetails - A function that handles the confirmation process.
 * - ConfirmDosageDetailsInput - The input type for the confirmDosageDetails function.
 * - ConfirmDosageDetailsOutput - The return type for the confirmDosageDetails function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

const ConfirmDosageDetailsInputSchema = z.object({
  drugName: z.string().describe('The name of the drug.'),
});
export type ConfirmDosageDetailsInput = z.infer<typeof ConfirmDosageDetailsInputSchema>;

// Output now includes a boolean intent and the original confirmation message
const ConfirmDosageDetailsOutputSchema = z.object({
  intentConfirmed: z.boolean().describe('Whether the user confirmed the intent to view details.'),
  confirmationMessage: z.string().describe('The confirmation message generated by the AI.'),
});
export type ConfirmDosageDetailsOutput = z.infer<typeof ConfirmDosageDetailsOutputSchema>;

export async function confirmDosageDetails(
  input: ConfirmDosageDetailsInput
): Promise<ConfirmDosageDetailsOutput> {
  return confirmDosageDetailsFlow(input);
}

// Define the prompt for Gemini/Gemma
// This prompt aims for a simple yes/no style response to gauge intent.
const prompt = ai.definePrompt({
  name: 'confirmDosageDetailsPrompt',
  input: {
    schema: z.object({
      drugName: z.string().describe('The name of the drug.'),
    }),
  },
  output: {
    // Expecting a simple confirmation/denial string
    schema: z.object({
        response: z.string().describe("AI's interpretation of the user's intent (e.g., 'Yes, proceed', 'No, cancel')."),
    }),
  },
  // Use a system message or specific instructions for Gemma/Gemini
  // Adapt the model name if necessary (e.g., 'googleai/gemini-pro')
  model: 'googleai/gemini-pro', // Directly use the model string ID
  prompt: `You are an assistant verifying user intent. The user wants to view sensitive dosage information for the drug "{{drugName}}". Ask a clear question to confirm they wish to proceed, understanding this is for healthcare professionals. Respond with a short confirmation message and determine if the underlying intent is affirmative ('Yes') or negative ('No').`,
   // Adjust temperature for more deterministic yes/no type answers
   config: { temperature: 0.2 },
});

const confirmDosageDetailsFlow = ai.defineFlow<
  typeof ConfirmDosageDetailsInputSchema,
  typeof ConfirmDosageDetailsOutputSchema
>(
  {
    name: 'confirmDosageDetailsFlow',
    inputSchema: ConfirmDosageDetailsInputSchema,
    outputSchema: ConfirmDosageDetailsOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow] confirmDosageDetailsFlow started for: ${input.drugName}`);
    try {
      const { output } = await prompt(input);

      if (!output?.response) {
        throw new Error("AI response was empty or invalid.");
      }

      const aiResponseText = output.response.toLowerCase();
      console.log(`[AI Flow] Raw AI Response: ${aiResponseText}`);

      // Simple keyword check for intent (can be made more robust)
      const isConfirmed = aiResponseText.includes('yes') || aiResponseText.includes('proceed') || aiResponseText.includes('confirm');

      console.log(`[AI Flow] Intent Confirmed: ${isConfirmed}`);

      return {
        intentConfirmed: isConfirmed,
        confirmationMessage: output.response, // Return the AI's full response message
      };
    } catch (error) {
       console.error('[AI Flow] Error in confirmDosageDetailsFlow:', error);
       // Provide a default fallback message on error
       return {
          intentConfirmed: false,
          confirmationMessage: `Error confirming access for ${input.drugName}. Please try again.`,
       };
    }
  }
);
