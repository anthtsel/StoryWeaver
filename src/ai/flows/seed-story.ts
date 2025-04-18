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
  initialChoices: z.array(z.string()).optional().describe('Initial choices for the user to select from.'),
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
      initialChoices: z.array(z.string()).describe('Three initial choices for the player.')
    }),
  },
  prompt: `You are a creative story writer. Generate an engaging initial story seed based on the following theme: {{{theme}}}.

The story seed should:
- Be approximately 150-200 words
- Set up an intriguing situation with clear stakes
- Establish a sense of atmosphere appropriate to the theme
- End at a decision point where the player needs to make a choice
- Be written in second person ("you")

After the story seed, provide exactly three interesting initial choices for what the player could do next. Each choice should:
- Be concise (no more than 8 words)
- Lead the story in a different direction
- Be clearly distinct from the other choices

For example, if the theme is "western", choices might be:
- "Enter the saloon"
- "Follow the suspicious stranger"
- "Check on your horse"`,
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
  
  // If the output doesn't include initialChoices, provide fallback choices
  if (!output || !output.initialChoices || !Array.isArray(output.initialChoices) || output.initialChoices.length === 0) {
    return {
      storySeed: output?.storySeed || "Your adventure begins...",
      initialChoices: [
        "Explore the surroundings",
        "Continue forward",
        "Go back"
      ]
    };
  }
  
  return output;
});