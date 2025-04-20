'use server';
/**
 * @fileOverview Generates an initial story seed based on the selected theme.
 *
 * - seedStory - A function that generates the initial story seed.
 * - SeedStoryInput - The input type for the seedStory function.
 * - SeedStoryOutput - The return type for the seedStory function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

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
      initialChoices: z.array(z.string()).describe('Three initial choices for the player.'),
    }),
  },
  prompt: `You are a creative story writer crafting the opening to a choose-your-own-adventure.

The theme of the story is: {{{theme}}}

Write a compelling story seed that:
- Is **300-450 words** long (roughly 2000-2800 characters)
- Introduces a strong hook and an immersive setting
- Builds suspense, mystery, or intrigue
- Ends at a **clear decision point** that sets the player up to make a choice
- Uses second-person perspective ("you")

Follow the story seed with exactly **three distinct choices** for what the player could do next. Each choice must:
- Be **concise** (max 8 words)
- Lead to a **significantly different** outcome or direction
- Reflect meaningful and believable decisions given the situation

Example choices for a fantasy story:
- "Open the glowing ancient tome"
- "Sneak out of the library"
- "Call for the headmaster"`,

});

const seedStoryFlow = ai.defineFlow<
  typeof SeedStoryInputSchema,
  typeof SeedStoryOutputSchema
>(
  {
    name: 'seedStoryFlow',
    inputSchema: SeedStoryInputSchema,
    outputSchema: SeedStoryOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);

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
  }
);
