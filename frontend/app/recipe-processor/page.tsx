'use client';

import React, { useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipeProcessor } from '@/hooks/useRecipeProcessor';
import UploadZone from '@/components/custom-recipes/recipe-processor/UploadZone';
import WelcomeScreen from '@/components/custom-recipes/recipe-processor/WelcomeScreen';
import EnhancedRecipeDisplay from '@/components/custom-recipes/recipe-processor/EnhancedRecipeDisplay';
import PricingResultModal from '@/components/custom-recipes/recipe-processor/PricingResultModal';
import { Recipe, ParsedRecipeDto } from '@/types';

export default function RecipeProcessorPage() {
  const { currentUser, accessToken, loading: authLoading } = useAuth();
  const {
    selectedFile,
    setSelectedFile,
    submissionData,
    editedData,
    setEditedData,
    status,
    setStatus,
    showPdfReview,
    isPricing,
    pricingResult,
    showPricingModal,
    setShowPricingModal,
    isSavingToFirestore,

    uploadFile,
    saveEditedData,
    priceRecipe,
    submitToFirestore,
    resetToOriginal,
    startNewUpload,
    loadUserRecipes,
    loadUserSubmissions,

    canPriceRecipe,
    canSaveToFirestore
  } = useRecipeProcessor(accessToken);

  // Check auth
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        setStatus({
          type: 'auth-required',
          message: '🔒 Please log in to upload and process recipes'
        });
      } else {
        setStatus({ type: 'idle', message: '' });
        loadUserRecipes();
        loadUserSubmissions();
      }
    }
  }, [currentUser, authLoading, setStatus, loadUserRecipes, loadUserSubmissions]);

  // File handling
  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setStatus({
        type: 'error',
        message: '❌ Please upload a PDF file only'
      });
      return;
    }

    if (!currentUser || !accessToken) {
      setStatus({
        type: 'auth-required',
        message: '🔒 Please log in to upload recipes'
      });
      return;
    }

    setSelectedFile(file);
    setStatus({ type: 'idle', message: '' });

    setTimeout(() => {
      uploadFile(file);
    }, 500);
  };

  // Handler for editing data with proper type conversion
  const handleEditData = (data: Recipe) => {
    const parsedData: ParsedRecipeDto = {
      ...data,
      ownerId: currentUser?.uid || '',
      visibility: 'private',
      status: 'draft'
    };
    setEditedData(parsedData);
  };

  // Convert ParsedRecipeDto to Recipe for the component
  const getRecipeForDisplay = (): Recipe | null => {
    if (!editedData) return null;
    return {
      name: editedData.name,
      portions: editedData.portions,
      ingredients: editedData.ingredients,
      tags: editedData.tags,
      parsingNotes: editedData.parsingNotes
    }
  };

  // Loading screen
  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
              🍳 Recipe Processor
            </h1>
            <p className="text-lg text-gray-600">
              {currentUser
                ? `Welcome ${currentUser.email}! Upload → Edit → Price → Save to Firestore`
                : 'Please log in to upload and process recipes'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Upload Zone */}
            <div className="lg:col-span-1">
              <UploadZone
                currentUser={currentUser}
                selectedFile={selectedFile}
                showPdfReview={showPdfReview}
                onFileSelect={handleFileSelect}
                onStartNewUpload={startNewUpload}
              />
            </div>

            {/* Right Column - PDF & Data Review */}
            <div className="lg:col-span-3">
              {showPdfReview && submissionData ? (
                <EnhancedRecipeDisplay
                  submissionData={submissionData}
                  selectedFile={selectedFile}
                  onSaveChanges={saveEditedData}
                  onPriceRecipe={priceRecipe}
                  onSubmitToFirestore={submitToFirestore}
                  onReset={resetToOriginal}
                  editedData={getRecipeForDisplay()}
                  onEditData={handleEditData}
                  isPricing={isPricing}
                  isSavingToFirestore={isSavingToFirestore}
                  canPriceRecipe={canPriceRecipe ?? undefined}
                  canSaveToFirestore={canSaveToFirestore ?? undefined}
                />
              ) : (
                <WelcomeScreen currentUser={currentUser} />
              )}
            </div>
          </div>

          {/* Status Alert */}
          {status.message && (
            <div className="mt-6">
              <Alert
                className={`
                  ${status.type === 'loading' ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-200' : ''}
                  ${status.type === 'success' ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200' : ''}
                  ${status.type === 'error' ? 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200' : ''}
                  ${status.type === 'auth-required' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200' : ''}
                `}
              >
                <AlertDescription className="flex items-center gap-2">
                  {status.type === 'loading' && (
                    <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span
                    className={`
                      font-medium
                      ${status.type === 'loading' ? 'text-orange-800' : ''}
                      ${status.type === 'success' ? 'text-green-800' : ''}
                      ${status.type === 'error' ? 'text-red-800' : ''}
                      ${status.type === 'auth-required' ? 'text-blue-800' : ''}
                    `}
                  >
                    {status.message}
                  </span>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Pricing Result Modal */}
          {showPricingModal && pricingResult && (
            <PricingResultModal
              isOpen={showPricingModal}
              onClose={() => setShowPricingModal(false)}
              pricingResult={pricingResult}
              onSubmitToFirestore={submitToFirestore}
              isSavingToFirestore={isSavingToFirestore}
              canSaveToFirestore={canSaveToFirestore ?? false}
            />
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}