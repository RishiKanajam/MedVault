'use server';

/**
 * @fileOverview Summarizes clinical trial details for researchers.
 *
 * - summarizeClinicalTrials - A function to summarize clinical trial details.
 * - SummarizeClinicalTrialsInput - The input type for the summarizeClinicalTrials function.
 * - SummarizeClinicalTrialsOutput - The return type for the summarizeClinicalTrials function.
 */

import {ai} from '@/ai/ai-instance';
import {ClinicalTrial} from '@/services/clinical-trials';
import {z} from 'genkit';

const SummarizeClinicalTrialsInputSchema = z.object({
  clinicalTrial: z
    .object({
      title: z.string(),
      url: z.string(),
      summary: z.string(),
    })
    .describe('The clinical trial to summarize.'),
});
export type SummarizeClinicalTrialsInput = z.infer<typeof SummarizeClinicalTrialsInputSchema>;

const SummarizeClinicalTrialsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the clinical trial details.'),
});
export type SummarizeClinicalTrialsOutput = z.infer<typeof SummarizeClinicalTrialsOutputSchema>;

export async function summarizeClinicalTrials(
  input: SummarizeClinicalTrialsInput
): Promise<SummarizeClinicalTrialsOutput> {
  return summarizeClinicalTrialsFlow(input);
}

const summarizeClinicalTrialsPrompt = ai.definePrompt({
  name: 'summarizeClinicalTrialsPrompt',
  input: {
    schema: z.object({
      clinicalTrial: z
        .object({
          title: z.string(),
          url: z.string(),
          summary: z.string(),
        })
        .describe('The clinical trial to summarize.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A concise summary of the clinical trial details.'),
    }),
  },
  prompt: `You are an expert medical researcher tasked with summarizing clinical trials for other researchers.

  Please provide a concise summary of the following clinical trial:

  Title: {{{clinicalTrial.title}}}
  URL: {{{clinicalTrial.url}}}
  Summary: {{{clinicalTrial.summary}}}
  `,
});

const summarizeClinicalTrialsFlow = ai.defineFlow<
  typeof SummarizeClinicalTrialsInputSchema,
  typeof SummarizeClinicalTrialsOutputSchema
>(
  {
    name: 'summarizeClinicalTrialsFlow',
    inputSchema: SummarizeClinicalTrialsInputSchema,
    outputSchema: SummarizeClinicalTrialsOutputSchema,
  },
  async input => {
    const {output} = await summarizeClinicalTrialsPrompt(input);
    return output!;
  }
);
