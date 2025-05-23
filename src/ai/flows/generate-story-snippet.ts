// This file is generated by Firebase Studio.
'use server';

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateStorySnippetInputSchema = z.object({
  theme: z.string().describe('The theme of the story (e.g., space, fantasy, horror).'),
  arcType: z.string().describe('The desired story arc (e.g., hero-journey, romance).'),
  previousSnippets: z.array(z.string()).describe('An array of previous story snippets.'),
  currentChoice: z.string().describe("The user's current choice that influences the story."),
  currentPhase: z.string().describe('The current phase of the story arc (e.g., setup, rising action).'),
  progress: z.number().describe('The overall progress percentage through the story arc (0-100).'),
  isStoryComplete: z.boolean().optional().describe('Flag indicating if the story should conclude.') // Added optional flag to indicate story completion
});
export type GenerateStorySnippetInput = z.infer<typeof GenerateStorySnippetInputSchema>;

const GenerateStorySnippetOutputSchema = z.object({
  nextSnippet: z.string().describe('The next story snippet generated by the LLM.'),
  nextChoices: z.array(z.string()).describe('The next set of choices for the user to pick from.'),
  isStoryComplete: z.boolean().optional().describe('Whether the AI determines the story has reached a natural conclusion.')
});
export type GenerateStorySnippetOutput = z.infer<typeof GenerateStorySnippetOutputSchema>;

export async function generateStorySnippet(input: GenerateStorySnippetInput): Promise<GenerateStorySnippetOutput> {
  return generateStorySnippetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStorySnippetPrompt',
  input: {
    schema: z.object({
      theme: z.string().describe('The theme of the story.'),
      arcType: z.string().describe('The desired story arc.'),
      previousSnippets: z.array(z.string()).describe('Previous story snippets.'),
      currentChoice: z.string().describe("The user's current choice."),
      currentPhase: z.string().describe('The current phase of the story arc.'),
      progress: z.number().describe('The overall progress percentage (0-100).'),
      isStoryComplete: z.boolean().optional().describe('Whether the story should conclude.')
    }),
  },
  output: {
    schema: z.object({
      nextSnippet: z.string().describe('The next story snippet.'),
      nextChoices: z.array(z.string()).describe('Three possible choices for the user to continue the story.'),
      isStoryComplete: z.boolean().optional().describe('Whether the story has concluded naturally.')
    }),
  },
  prompt: `You are an AI Dungeon Master, weaving a choose-your-own-adventure story.

The theme of the story is: {{{theme}}}
The desired story arc is: {{{arcType}}}
The story is currently in the {{{currentPhase}}} phase ({{progress}}% complete).

Previous story snippets:
{{#each previousSnippets}}
{{{this}}}
{{/each}}

The user has chosen: {{{currentChoice}}}

{{#if isStoryComplete}}
Generate a concluding snippet for the story. This should provide a satisfying resolution based on the arc, theme, and previous choices. Do not provide any further choices. Mark the snippet with "THE END".
{{else}}
Generate the next part of the story based on the user's choice. Your response must include:
1. A story snippet (nextSnippet) that continues the narrative using **300-450 words** (approximately 2000-2800 characters), ensuring it aligns with the {{{arcType}}} and the {{{currentPhase}}} of the story. Advance the plot meaningfully.
2. Exactly three choices (nextChoices) for what the user could do next. These choices should be concise (max 8 words) and propel the story forward along the {{{arcType}}}.
{{/if}}

Make your story engaging and immersive. Use vivid imagery, sensory detail, and write in second person ("you"). Build tension or wonder as appropriate to the theme and arc. If the current phase is 'climax', make the situation very intense. If the phase is 'resolution', begin to wrap up the story threads.
If you feel the story has reached a natural and satisfying conclusion based on the arc and progress, even if not explicitly told to end, you can choose to write a concluding snippet and set isStoryComplete to true in the output.`, // Added conditional prompt for conclusion and guidance on phases
});

const generateStorySnippetFlow = ai.defineFlow<
  typeof GenerateStorySnippetInputSchema,
  typeof GenerateStorySnippetOutputSchema
>(
  {
    name: 'generateStorySnippetFlow',
    inputSchema: GenerateStorySnippetInputSchema,
    outputSchema: GenerateStorySnippetOutputSchema,
  },
  async input => {
    try {
      const { output } = await prompt(input);

      if (!output || !output.nextSnippet || output.nextSnippet.trim() === '') {
        console.error('Error: No valid story snippet returned from AI');
        return {
          nextSnippet: "As you make your choice, the story continues...",
          nextChoices: ['Explore further', 'Talk to someone nearby', 'Change direction']
        };
      }

      // Handle case where story should complete (either by input flag or AI decision)
      if (input.isStoryComplete || output.isStoryComplete) {
        console.log('Story completion triggered.', { inputFlag: input.isStoryComplete, outputFlag: output.isStoryComplete });
        return {
          // Corrected line 99:
          nextSnippet: output.nextSnippet.includes("THE END")
  ? output.nextSnippet
  : `${output.nextSnippet}\n\nTHE END.`,

          nextChoices: [], // No choices on completion
          isStoryComplete: true
        };
      }

      // Validate choices if story is not complete
      if (!output.nextChoices || !Array.isArray(output.nextChoices) || output.nextChoices.length === 0) {
        console.error('Error: No valid choices returned from AI for ongoing story');
        return {
          nextSnippet: output.nextSnippet,
          nextChoices: ['Explore further', 'Talk to someone nearby', 'Change direction']
        };
      }

      // Ensure exactly 3 choices
      const choices = output.nextChoices.slice(0, 3);
      while (choices.length < 3) {
        choices.push(["Explore further", "Look around", "Continue onward"][choices.length]);
      }

      console.log('Story snippet generated successfully:', {
        snippetLength: output.nextSnippet.length,
        choices: choices,
        isStoryComplete: output.isStoryComplete ?? false
      });

      return {
        nextSnippet: output.nextSnippet,
        nextChoices: choices,
        isStoryComplete: output.isStoryComplete ?? false
      };
    } catch (error) {
      console.error('Error in generateStorySnippetFlow:', error);
      return {
        nextSnippet: "There was a glitch in your story. The adventure continues...",
        nextChoices: ['Explore further', 'Talk to someone nearby', 'Change direction']
      };
    }
  }
);
