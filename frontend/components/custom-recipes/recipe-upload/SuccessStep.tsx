// components/RecipeUpload/SuccessStep.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SuccessStepProps {
  onReset: () => void;
  onGoToDashboard: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
  onReset,
  onGoToDashboard
}) => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Recipe Saved Successfully!</h2>
        <p className="text-gray-600 mb-6">Your recipe has been saved to Firestore.</p>
        <div className="flex justify-center gap-4">
          <Button onClick={onReset} variant="outline">
            Upload Another Recipe
          </Button>
          <Button onClick={onGoToDashboard}>
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};