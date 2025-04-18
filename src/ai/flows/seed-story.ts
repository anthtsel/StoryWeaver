'use server';
/**
 * @fileOverview Generates an initial story seed based on the selected theme.
 *
 * - seedStory - A function that generates the initial story seed.
 * - SeedStoryInput - The input type for the seedStory function.
 * - SeedStoryOutput - The return type for the seedStory function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SeedStoryInputSchema = z.object({
  theme: z.string().describe('The theme of the story (e.g., space, fantasy, horror).'),
});
export type SeedStoryInput = z.infer<typeof SeedStoryInputSchema>;

const SeedStoryOutputSchema = z.object({
  storySeed: z.string().describe('The initial story seed generated based on the theme.'),
});
export type SeedStoryOutput = z.infer<typeof SeedStoryOutputSchema>;

export async function seedStory(input: SeedStoryInput): Promise<SeedStoryOutput> {
  return seedStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'seedStoryPrompt',
  input: {
    schema: z.object({
      theme: z.string().describe('The theme of the story.'),
    }),
  },
  output: {
    schema: z.object({
      storySeed: z.string().describe('The initial story seed.'),
    }),
  },
  prompt: `You are a creative story writer. Generate an initial story seed based on the following theme: {{{theme}}}. The story seed should be a short paragraph to kick start a choose your own adventure game.`,
});

const seedStoryFlow = ai.defineFlow<
  typeof SeedStoryInputSchema,
  typeof SeedStoryOutputSchema
>({
  name: 'seedStoryFlow',
  inputSchema: SeedStoryInputSchema,
  outputSchema: SeedStoryOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
