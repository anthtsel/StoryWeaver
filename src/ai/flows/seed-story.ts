'use server';
/**
 * @fileOverview Generates an initial story seed based on the selected theme and arc type.
 *
 * - seedStory - A function that generates the initial story seed.
 * - SeedStoryInput - The input type for the seedStory function.
 * - SeedStoryOutput - The return type for the seedStory function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

const SeedStoryInputSchema = z.object({
  theme: z.string().describe('The theme of the story (e.g., space, fantasy, horror).'),
  arcType: z.string().describe('The desired story arc (e.g., hero-journey, romance).')
});
export type SeedStoryInput = z.infer<typeof SeedStoryInputSchema>;

const SeedStoryOutputSchema = z.object({
  storySeed: z.string().describe('The initial story seed generated based on the theme and arc type.'),
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
      arcType: z.string().describe('The desired story arc (e.g., hero-journey, romance).')
    }),
  },
  output: {
    schema: z.object({
      storySeed: z.string().describe('The initial story seed.'),
      initialChoices: z.array(z.string()).describe('Three initial choices for the player.'),
    }),
  },
  prompt: `You are a creative story writer crafting the opening scene of a unique, interactive choose-your-own-adventure story.

The **theme** of the story is: {{{theme}}}  
The **narrative arc** follows the structure of: {{{arcType}}}  

Write a highly original **story seed** that meets the following:

- **Length**: 300–450 words (~2000–2800 characters)
- **Hook**: Begin with a vivid, surprising, or emotionally charged event or moment that immediately draws the player into the story world.
- **Worldbuilding**: Establish a unique and immersive setting that clearly reflects the chosen **theme** (e.g., sci-fi, horror, pirate fantasy).
- **Arc Signal**: Introduce an inciting incident or scenario that **naturally aligns with the beginning of the {{{arcType}}} arc** (e.g., call to adventure, moral dilemma, rising tension).
- **Tone & Atmosphere**: Use imagery, sensory language, and mood appropriate to the theme and arc.
- **Perspective**: Write entirely in **second-person** (“you”) to make the player feel like the protagonist.
- **Decision Point**: End the scene at a clear moment where the player must make a pivotal first choice.

After the story seed, provide **exactly three distinct next actions** the player can take. Each choice must:

- Be **concise** (max 8 words)
- Be **meaningfully different** (e.g., risky, cautious, curious)
- Reflect a **believable reaction** in the context of the story
- Propel the narrative forward in a way consistent with the chosen arc

Example (for a fantasy "hero's journey" story):  
- "Open the glowing ancient tome"  
- "Sneak out of the library"  
- "Call for the headmaster"

Make each story seed **feel handcrafted** for the unique combination of {{{theme}}} and {{{arcType}}}.  
Avoid clichés or generic setups — prioritize **novelty, specificity, and immersive tension**.`,
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
