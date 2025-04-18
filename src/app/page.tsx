'use client';

import {useState, useEffect} from 'react';
import {seedStory} from '@/ai/flows/seed-story';
import {generateStorySnippet} from '@/ai/flows/generate-story-snippet';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';

const themes = ['space', 'fantasy', 'horror'];

export default function Home() {
  const [theme, setTheme] = useState(themes[0]);
  const [storySnippets, setStorySnippets] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyInitialized, setStoryInitialized] = useState(false);

  useEffect(() => {
    const initializeStory = async () => {
      setLoading(true);
      setError(null);
      try {
        const initialStory = await seedStory({theme});
        setStorySnippets([initialStory.storySeed]);
        setChoices(['Explore the surroundings', 'Continue forward', 'Go back']); // initial choices
        setStoryInitialized(true);
      } catch (e: any) {
        setError(e.message || 'Failed to seed story.');
        console.error('Failed to seed story:', e);
      } finally {
        setLoading(false);
      }
    };

    if (!storyInitialized) {
      initializeStory();
    }
  }, [theme, storyInitialized]);

  const handleChoice = async (choice: string) => {
    setLoading(true);
    setError(null);
    try {
      const newSnippet = await generateStorySnippet({
        theme,
        previousSnippets: storySnippets,
        currentChoice: choice,
      });
      setStorySnippets([...storySnippets, newSnippet.nextSnippet]);

      // Mock choices, to be improved with LLM
      setChoices(['Explore further', 'Fight', 'Flee']);
    } catch (e: any) {
      setError(e.message || 'Failed to generate next snippet.');
      console.error('Failed to generate next snippet:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setStorySnippets([]); // Clear the existing story
    setChoices([]); // Clear existing choices
    setStoryInitialized(false); // Reset story initialization
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-3xl mx-auto my-10 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">Story Weaver</CardTitle>
            <CardDescription>Create your own adventure with AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="theme" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Select Theme:
              </label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <ScrollArea className="h-[300px] rounded-md border p-4">
              {storySnippets.map((snippet, index) => (
                <p key={index} className="mb-2 text-sm">
                  {snippet}
                </p>
              ))}
              {loading && <p className="text-sm italic">Loading...</p>}
              {error && <p className="text-sm text-red-500">Error: {error}</p>}
            </ScrollArea>

            <div className="flex justify-around mt-4">
              {choices.map((choice) => (
                <Button key={choice} onClick={() => handleChoice(choice)} disabled={loading}>
                  {choice}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
