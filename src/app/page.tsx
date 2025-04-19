'use client';

import { useState, useEffect, useRef } from 'react';
import {seedStory} from '@/ai/flows/seed-story';
import {generateStorySnippet} from '@/ai/flows/generate-story-snippet';
import {Button} from '@/components/ui/button';
import { Moon, Sun, Loader2 } from 'lucide-react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';

const themes = ['space', 'fantasy', 'horror'];

export default function Home() {
  const [theme, setTheme] = useState(themes[0]);
  const [displayedSnippets, setDisplayedSnippets] = useState<string[]>([]);
  const [storySnippets, setStorySnippets] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // useRef to track if the story has been initialized
  const storyInitialized = useRef(false);

  // Check system preference for dark mode on initial load
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
  }, []);

  // Apply dark mode class when isDarkMode changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Initialize story based on selected theme
  useEffect(() => {
    const initializeStory = async () => {
      // Only initialize the story if it hasn't been initialized yet
      if (storyInitialized.current) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const initialStory = await seedStory({theme});
        
        // Use AI-generated choices from seedStory if available, otherwise use fallback choices
        const initialChoices = initialStory.initialChoices || ['Explore the surroundings', 'Continue forward', 'Go back'];
        
        setStorySnippets([initialStory.storySeed]);
        setDisplayedSnippets([initialStory.storySeed]);
        setChoices(initialChoices);
        
        // Set the ref to true after successful initialization
        storyInitialized.current = true;
        
        console.log('Story initialized:', {
          snippet: initialStory.storySeed,
          choices: initialChoices
        });
      } catch (e: any) {
        setError(e.message || 'Failed to seed story.');
        console.error('Failed to seed story:', e);
      } finally {
        setLoading(false);
      }
    };

    // Call initializeStory only if it hasn't been initialized yet
    if (!storyInitialized.current) {
      initializeStory();
    }
  }, [theme]);

  // Modified typewriter effect to handle updates more reliably
  useEffect(() => {
    if (storySnippets.length > 0 && 
       (displayedSnippets.length === 0 || storySnippets.length > displayedSnippets.length)) {
      
      // Get the latest snippet that needs to be displayed
      const lastSnippetIndex = storySnippets.length - 1;
      const newSnippet = storySnippets[lastSnippetIndex];
      
      // Create a temporary array that matches the current state but with placeholders for new content
      let updatedSnippets = [...storySnippets.slice(0, lastSnippetIndex)];
      
      // Start with empty string for the new snippet
      updatedSnippets.push('');
      setDisplayedSnippets(updatedSnippets);
      
      // Animate the text
      let currentText = '';
      let index = 0;
      const timer = setInterval(() => {
        if (index < newSnippet.length) {
          currentText = newSnippet.substring(0, index + 1);
          updatedSnippets = [...storySnippets.slice(0, lastSnippetIndex), currentText];
          setDisplayedSnippets(updatedSnippets);
          index++;
        } else {
          clearInterval(timer);
          setDisplayedSnippets([...storySnippets]);
          console.log('Typewriter effect completed for snippet:', lastSnippetIndex);
        }
      }, 20); // Slightly faster typing for better UX
      
      return () => clearInterval(timer);
    }
  }, [storySnippets]);

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [displayedSnippets]);

  const handleChoice = async (choice: string) => {
    if(loading) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('User selected choice:', choice);
    
    // Add the user choice to the story right away
    const choiceText = `You chose: ${choice}`;
    setStorySnippets([...storySnippets, choiceText]);
    
    try {
      const newSnippet = await generateStorySnippet({
        theme,
        previousSnippets: storySnippets,
        currentChoice: choice,
      });
      
      console.log('Generated new snippet:', {
        snippetLength: newSnippet.nextSnippet.length,
        choices: newSnippet.nextChoices
      });
      
      // Only add the new snippet after the choice was displayed
      setStorySnippets(prevSnippets => [...prevSnippets, newSnippet.nextSnippet]);
      
      // Set new choices, ensuring we always have an array
      if (newSnippet.nextChoices && Array.isArray(newSnippet.nextChoices) && newSnippet.nextChoices.length > 0) {
        setChoices(newSnippet.nextChoices);
      } else {
        // Fallback choices if API doesn't return any
        setChoices(['Explore further', 'Talk to someone nearby', 'Change direction']);
        console.warn('No choices returned from API, using fallback choices');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate next snippet.');
      console.error('Failed to generate next snippet:', e);
      
      // Add an error message to the story
      setStorySnippets(prevSnippets => [
        ...prevSnippets, 
        "There was a problem continuing your adventure. Please try again."
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    storyInitialized.current = false;
    setTheme(newTheme);
    setStorySnippets([]);
    setDisplayedSnippets([]);
    setChoices([]);
  };

  return (
    <div key={isDarkMode} className="flex flex-col items-center justify-center min-h-screen py-2 bg-background">
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4">
        <Button
          onClick={toggleDarkMode}
          variant="ghost"
          className="w-9 p-0"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span className="sr-only">Toggle Dark Mode</span>
        </Button>
      </div>
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
              <Select value={theme} onValueChange={handleThemeChange} disabled={loading}>
                <SelectTrigger className="w-[180px]" id="theme">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <ScrollArea className="h-[300px] rounded-md border p-4" ref={scrollAreaRef}>
              {displayedSnippets.map((snippet, index) => (
                <div key={index} className="mb-4 text-sm">
                  <p>{snippet}</p>
                </div>
              ))}
              {loading && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm italic">Generating story...</span>
                </div>
              )}
            </ScrollArea>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {choices.length > 0 ? (
                choices.map((choice) => (
                  <Button 
                    key={choice} 
                    onClick={() => handleChoice(choice)} 
                    disabled={loading}
                    className="m-1"
                  >
                    {choice}
                  </Button>
                ))
              ) : (
                !loading && storyInitialized.current && (
                  <div className="text-center text-muted-foreground italic">
                    The story has reached its conclusion.
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
