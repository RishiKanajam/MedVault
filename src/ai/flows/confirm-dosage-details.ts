// confirm-dosage-details.ts
'use server';
/**
 * @fileOverview AI flow to confirm the healthcare professional's intent to access dosage details for a drug.
 *
 * - confirmDosageDetails - A function that handles the confirmation process.
 * - ConfirmDosageDetailsInput - The input type for the confirmDosageDetails function.
 * - ConfirmDosageDetailsOutput - The return type for the confirmDosageDetails function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ConfirmDosageDetailsInputSchema = z.object({
  drugName: z.string().describe('The name of the drug.'),
});
export type ConfirmDosageDetailsInput = z.infer<typeof ConfirmDosageDetailsInputSchema>;

const ConfirmDosageDetailsOutputSchema = z.object({
  confirmation: z
    .string()
    .describe(
      'A confirmation message to ensure the user wants to access dosage details for the specified drug.'
    ),
});
export type ConfirmDosageDetailsOutput = z.infer<typeof ConfirmDosageDetailsOutputSchema>;

export async function confirmDosageDetails(
  input: ConfirmDosageDetailsInput
): Promise<ConfirmDosageDetailsOutput> {
  return confirmDosageDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'confirmDosageDetailsPrompt',
  input: {
    schema: z.object({
      drugName: z.string().describe('The name of the drug.'),
    }),
  },
  output: {
    schema: z.object({
      confirmation:
        z.string().describe('Confirmation message that the user wants to view dosage details.'),
    }),
  },
  prompt: `Please confirm that you want to view the dosage details for {{drugName}}. This information should only be accessed by healthcare professionals.  Please respond with a confirmation message.`,
});

const confirmDosageDetailsFlow = ai.defineFlow<
  typeof ConfirmDosageDetailsInputSchema,
  typeof ConfirmDosageDetailsOutputSchema
>({
  name: 'confirmDosageDetailsFlow',
  inputSchema: ConfirmDosageDetailsInputSchema,
  outputSchema: ConfirmDosageDetailsOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
