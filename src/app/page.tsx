'use client';

import { useState, useEffect, useRef } from 'react';
import {seedStory} from '@/ai/flows/seed-story';
import {generateStorySnippet} from '@/ai/flows/generate-story-snippet';
import {Button} from '@/components/ui/button';
import { Moon, Sun, Loader2, RefreshCw } from 'lucide-react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Progress} from '@/components/ui/progress';

const themes = ['space', 'fantasy', 'horror'];
const arcTypes = ['hero-journey', 'mystery', 'quest', 'revenge', 'romance'];

// Define story phases and their progression percentages
const storyPhases = [
  { name: 'setup', maxProgress: 15 },
  { name: 'rising action', maxProgress: 40 },
  { name: 'confrontation', maxProgress: 65 },
  { name: 'climax', maxProgress: 85 },
  { name: 'resolution', maxProgress: 100 }
];

// Define progression points - how many choices to advance each phase
const choicesPerPhase = {
  'setup': 5, // 5 choices to complete setup
  'rising action': 10, // 10 more choices for rising action
  'confrontation': 10, // 10 more choices for confrontation
  'climax': 5, // 5 more choices for climax
  'resolution': 5 // 5 final choices to reach conclusion
};

// Total choices for a complete story
const totalStoryChoices = Object.values(choicesPerPhase).reduce((sum, val) => sum + val, 0);

export default function Home() {
  const [theme, setTheme] = useState(themes[0]);
  const [arcType, setArcType] = useState(arcTypes[0]);
  const [displayedSnippets, setDisplayedSnippets] = useState<string[]>([]);
  const [storySnippets, setStorySnippets] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyInitialized, setStoryInitialized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [arcProgress, setArcProgress] = useState(0);
  const [storyPhase, setStoryPhase] = useState<string>('setup');
  const [storyComplete, setStoryComplete] = useState(false);
  const [choicesMade, setChoicesMade] = useState(0);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  // Initialize story based on selected theme and arc type
  useEffect(() => {
    const initializeStory = async () => {
      setLoading(true);
      setError(null);
      setArcProgress(0);
      setStoryPhase('setup');
      setStoryComplete(false);
      setChoicesMade(0);
      
      try {
        // Pass arc type to seed story
        const initialStory = await seedStory({theme, arcType});
        
        // Use AI-generated choices from seedStory if available, otherwise use fallback choices
        const initialChoices = initialStory.initialChoices || ['Explore the surroundings', 'Continue forward', 'Go back'];
        
        setStorySnippets([initialStory.storySeed]);
        setDisplayedSnippets([initialStory.storySeed]);
        setChoices(initialChoices);
        setStoryInitialized(true);
        
        console.log('Story initialized:', {
          snippet: initialStory.storySeed,
          choices: initialChoices,
          arcType
        });
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
  }, [theme, arcType, storyInitialized]);

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

  // Update story phase and progress based on choices made
  useEffect(() => {
    if (storyComplete) return;
    
    // Calculate story progress based on choices made
    const progressPercentage = Math.min(Math.floor((choicesMade / totalStoryChoices) * 100), 100);
    
    // Set the current phase based on progress
    let currentPhaseIndex = 0;
    let cumulativeChoices = 0;
    
    for (let i = 0; i < Object.keys(choicesPerPhase).length; i++) {
      const phaseName = Object.keys(choicesPerPhase)[i];
      const phaseChoices = choicesPerPhase[phaseName as keyof typeof choicesPerPhase];
      
      cumulativeChoices += phaseChoices;
      if (choicesMade < cumulativeChoices) {
        currentPhaseIndex = i;
        break;
      }
    }
    
    // If we've gone through all choices, set to the last phase
    if (choicesMade >= totalStoryChoices) {
      currentPhaseIndex = storyPhases.length - 1;
    }
    
    // Set the current phase and progress
    const newPhase = storyPhases[currentPhaseIndex].name;
    setStoryPhase(newPhase);
    setArcProgress(progressPercentage);
    
    // Check if we should end the story
    if (progressPercentage >= 100) {
      console.log('Story progress reached 100%');
    }
    
  }, [choicesMade, storyComplete]);

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
    
    // Increment choices made
    const newChoicesMade = choicesMade + 1;
    setChoicesMade(newChoicesMade);
    
    // Check if we've reached the total story length
    const newProgressPercentage = Math.min(Math.floor((newChoicesMade / totalStoryChoices) * 100), 100);
    const shouldEndStory = newProgressPercentage >= 100;
    
    try {
      const newSnippet = await generateStorySnippet({
        theme,
        arcType,
        previousSnippets: storySnippets,
        currentChoice: choice,
        currentPhase: storyPhase,
        progress: newProgressPercentage,
      });
      
      console.log('Generated new snippet:', {
        snippetLength: newSnippet.nextSnippet.length,
        choices: newSnippet.nextChoices,
        storyPhase,
        progress: newProgressPercentage,
        choicesMade: newChoicesMade,
        totalChoices: totalStoryChoices
      });
      
      // Only add the new snippet after the choice was displayed
      setStorySnippets(prevSnippets => [...prevSnippets, newSnippet.nextSnippet]);
      
      // Check if story is complete (either from AI signal or from our progress calculation)
      if (newSnippet.isStoryComplete || shouldEndStory) {
        handleStoryCompletion();
        return;
      }
      
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

  // Handle story completion
  const handleStoryCompletion = async () => {
    try {
      // Generate a final ending snippet if needed
      if (arcProgress < 100) {
        setArcProgress(100);
      }
      
      // Add a closing message if the story didn't provide one
      setStorySnippets(prevSnippets => {
        const lastSnippet = prevSnippets[prevSnippets.length - 1];
        if (!lastSnippet.includes("THE END") && !lastSnippet.includes("The End")) {
          return [...prevSnippets, "\n\nYour journey has reached its conclusion. THE END."];
        }
        return prevSnippets;
      });
      
      setStoryComplete(true);
      setChoices([]);
      setStoryPhase('complete');
      
    } catch (e) {
      console.error('Error completing story:', e);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    resetStory();
  };

  const handleArcTypeChange = (newArcType: string) => {
    setArcType(newArcType);
    resetStory();
  };

  const resetStory = () => {
    setStorySnippets([]);
    setDisplayedSnippets([]);
    setChoices([]);
    setStoryInitialized(false);
    setArcProgress(0);
    setStoryPhase('setup');
    setStoryComplete(false);
    setChoicesMade(0);
  }

  // Get story phase label
  const getPhaseLabel = (phase: string) => {
    return phase.charAt(0).toUpperCase() + phase.slice(1);
  };

  // Get arc type display name
  const getArcTypeDisplayName = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Calculate estimated remaining choices
  const getRemainingChoices = () => {
    return Math.max(0, totalStoryChoices - choicesMade);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background">
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
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="theme" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Theme:
                </label>
                <Select value={theme} onValueChange={handleThemeChange} disabled={loading}>
                  <SelectTrigger className="w-[120px]" id="theme">
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

              <div className="flex items-center space-x-2">
                <label htmlFor="arcType" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Story Arc:
                </label>
                <Select value={arcType} onValueChange={handleArcTypeChange} disabled={loading}>
                  <SelectTrigger className="w-[140px]" id="arcType">
                    <SelectValue placeholder="Arc Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {arcTypes.map((a) => (
                      <SelectItem key={a} value={a}>
                        {getArcTypeDisplayName(a)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetStory} 
                disabled={loading}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                New Story
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{getPhaseLabel(storyPhase)}</span>
                <span>{arcProgress}% ({getRemainingChoices()} choices remaining)</span>
              </div>
              <Progress value={arcProgress} className="h-2" />
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
              {choices.length > 0 && !storyComplete ? (
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
                storyComplete && (
                  <div className="text-center text-muted-foreground">
                    <p className="italic mb-2">The story has reached its conclusion.</p>
                    <Button 
                      onClick={resetStory} 
                      variant="outline"
                    >
                      Start a New Adventure
                    </Button>
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