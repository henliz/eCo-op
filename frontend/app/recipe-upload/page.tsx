'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CameraModal from '@/components/custom-recipes/recipe-upload/CameraModal';
import { UploadStep } from '@/components/custom-recipes/recipe-upload/UploadStep';
import { PreviewStep } from '@/components/custom-recipes/recipe-upload/PreviewStep';
import { EditStep } from '@/components/custom-recipes/recipe-upload/EditStep';
import { SuccessStep } from '@/components/custom-recipes/recipe-upload/SuccessStep';
import { useRecipeUpload } from '@/hooks/recipe-upload/useRecipeUpload';
import { debugLog } from '@/utils/recipe-upload/fileUtils';

export default function RecipeUploadPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [dragOver, setDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const {
    currentStep,
    selectedFile,
    isProcessing,
    isSaving,
    error,
    editedRecipe,
    setEditedRecipe,
    handleFileSelect,
    parseRecipe,
    saveRecipe,
    resetToStart
  } = useRecipeUpload();

  // Auth check - redirect if not authenticated
  useEffect(() => {
    debugLog('Auth check', { hasUser: !!currentUser });
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Handle camera capture
  const handleCameraCapture = useCallback((file: File) => {
    debugLog('Camera captured file', { fileName: file.name, size: file.size });
    handleFileSelect(file);
    setShowCamera(false);
  }, [handleFileSelect]);

  // Enhanced reset function that also closes camera
  const handleReset = useCallback(() => {
    resetToStart();
    setShowCamera(false);
  }, [resetToStart]);

  // Don't render if not authenticated
  if (!currentUser) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Recipe</h1>
          <div className="flex items-center gap-2">
            {/* Progress indicators */}
            <Badge variant={currentStep === 'upload' ? 'default' : 'secondary'}>
              1. Upload
            </Badge>
            <Badge variant={currentStep === 'preview' ? 'default' : 'secondary'}>
              2. Preview
            </Badge>
            <Badge variant={currentStep === 'edit' ? 'default' : 'secondary'}>
              3. Edit
            </Badge>
            <Badge variant={currentStep === 'saving' || currentStep === 'success' ? 'default' : 'secondary'}>
              4. Save
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Step Components */}
        {currentStep === 'upload' && (
          <UploadStep
            dragOver={dragOver}
            onFileSelect={handleFileSelect}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onCameraClick={() => setShowCamera(true)}
          />
        )}

        {currentStep === 'preview' && selectedFile && (
          <PreviewStep
            selectedFile={selectedFile}
            isProcessing={isProcessing}
            onReset={handleReset}
            onParse={parseRecipe}
          />
        )}

        {currentStep === 'edit' && editedRecipe && (
          <EditStep
            editedRecipe={editedRecipe}
            setEditedRecipe={setEditedRecipe}
            isSaving={isSaving}
            onReset={handleReset}
            onSave={saveRecipe}
          />
        )}

        {currentStep === 'success' && (
          <SuccessStep
            onReset={handleReset}
            onGoToDashboard={() => router.push('/dashboard')}
          />
        )}

        {/* Camera Modal */}
        <CameraModal
          isOpen={showCamera}
          onClose={() => setShowCamera(false)}
          onCapture={handleCameraCapture}
        />
      </div>
    </div>
  );
}