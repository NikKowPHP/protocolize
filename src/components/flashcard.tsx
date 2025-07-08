'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, FlipHorizontal } from 'lucide-react';

interface FlashcardProps {
  front: string;
  back: string;
  onNext?: () => void;
  onPrev?: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  front,
  back,
  onNext,
  onPrev,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <Card className="w-full max-w-2xl min-h-[400px] relative">
      <CardContent className="flex flex-col items-center justify-center h-full p-8">
        <div
          className={`absolute inset-0 flex items-center justify-center p-8 transition-all duration-300 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}
        >
          <p className="text-2xl text-center">{front}</p>
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center p-8 transition-all duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}
        >
          <p className="text-2xl text-center">{back}</p>
        </div>
      </CardContent>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrev}
          disabled={!onPrev}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => setIsFlipped(!isFlipped)}>
          <FlipHorizontal className="h-4 w-4 mr-2" />
          Flip Card
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={!onNext}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
