'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Brain,
  BookOpen,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, FlashcardGeneratorData } from './types';

export function FlashcardGenerator({ data, className }: TamboComponentProps<FlashcardGeneratorData>) {
  const { suggestedCards = [] } = data;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  const currentCard = suggestedCards[currentIndex];
  const totalCards = suggestedCards.length;

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const resetStudy = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (suggestedCards.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Flashcards Generated</h3>
            <p className="text-sm text-muted-foreground">
              Ask me to generate flashcards from the meeting content to start learning.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!studyMode) {
    
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generated Flashcards
            <Badge variant="secondary" className="ml-2">
              {totalCards} cards
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              I've generated {totalCards} flashcards from the meeting content to help you learn and retain key information.
            </p>
          </div>

          {/* Card Preview List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {suggestedCards.map((card, index) => (
              <div
                key={card.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  setCurrentIndex(index);
                  setStudyMode(true);
                  setIsFlipped(false);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{card.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {card.difficulty}
                      </Badge>
                      {card.tags?.map((tag) => (
                        <span key={tag} className="text-[10px] text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              className="flex-1" 
              onClick={() => setStudyMode(true)}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Start Studying
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Study Mode - Interactive flashcard
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4 text-primary" />
            Study Mode
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {totalCards}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setStudyMode(false)}>
              Exit
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Flashcard */}
        <div 
          className="relative h-64 cursor-pointer perspective-1000"
          onClick={handleFlip}
        >
          <div className={cn(
            "absolute inset-0 transition-all duration-500 transform-gpu preserve-3d",
            isFlipped ? "rotate-y-180" : ""
          )}>
            {/* Front */}
            <div className={cn(
              "absolute inset-0 backface-hidden rounded-xl border-2 bg-card p-6 flex flex-col",
              isFlipped ? "opacity-0" : "opacity-100"
            )}>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">Question</Badge>
                <span className="text-xs text-muted-foreground">
                  Click to flip
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-lg font-medium text-center">{currentCard?.question}</p>
              </div>
              {currentCard?.tags && (
                <div className="flex gap-1 flex-wrap justify-center">
                  {currentCard.tags.map((tag) => (
                    <span key={tag} className="text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Back */}
            <div className={cn(
              "absolute inset-0 backface-hidden rounded-xl border-2 border-primary bg-primary/5 p-6 flex flex-col rotate-y-180",
              isFlipped ? "opacity-100" : "opacity-0"
            )}>
              <div className="flex items-center justify-between mb-4">
                <Badge>Answer</Badge>
                <span className="text-xs text-muted-foreground">
                  Click to flip back
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-lg text-center">{currentCard?.answer}</p>
              </div>
              {currentCard?.context && (
                <p className="text-xs text-muted-foreground text-center mt-2 italic">
                  Context: {currentCard.context}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetStudy}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Restart
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === totalCards - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
