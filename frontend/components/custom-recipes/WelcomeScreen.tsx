// C:\Users\satta\eCo-op\frontend\components\custom-recipes\WelcomeScreen.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  // Add other user properties as needed
}

interface WelcomeScreenProps {
  currentUser: User | null;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ currentUser }) => {
  return (
    <Card className="h-[700px] flex items-center justify-center">
      <CardContent>
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold mb-2">Upload a PDF to get started</h3>
          <p className="text-gray-600 max-w-md mb-4">
            Upload a recipe PDF and follow the new workflow:
          </p>
          <div className="text-sm text-left bg-gray-50 p-4 rounded max-w-sm mx-auto">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">1</span>
                <span>Upload & Parse PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">2</span>
                <span>Edit recipe data if needed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-500 text-white rounded-full text-xs flex items-center justify-center">3</span>
                <span>Price recipe with &ldquo;Price Recipe&rdquo; button</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center">4</span>
                <span>Save to Firestore</span>
              </div>
            </div>
          </div>
          {!currentUser && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-blue-800 font-medium">🔒 Please log in first</div>
              <div className="text-blue-600 text-sm">Authentication is required to process recipes</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeScreen;