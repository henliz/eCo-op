// hooks/useRecipeProcessor.ts
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UploadStatus {
  type: 'idle' | 'loading' | 'success' | 'error' | 'auth-required';
  message: string;
}

interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  type?: 'core' | 'optional' | 'garnish' | 'to taste';
}

interface ParsedRecipeDto {
  name: string;
  portions: number;
  ingredients: RecipeIngredient[];
  tags?: string[];
  ownerId: string;
  visibility: 'private' | 'public';
  status: 'draft' | 'validated' | 'needs_investigation' | 'rejected' | 'test_data';
  parsingNotes?: string[];
}

interface SubmissionData {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed' | 'edited' | 'priced';
  recipe?: ParsedRecipeDto;
  originalRecipe?: ParsedRecipeDto;
  pricingData?: any;
  processingSteps?: string[];
  warnings?: string[];
  createdAt: string;
  updatedAt: string;
}

interface PricingResult {
  success: boolean;
  message: string;
  details?: {
    totalIngredients: number;
    successfullyPriced: number;
    failed: number;
    fixed: number;
    regularPrice?: number;
    salePrice?: number;
  };
  pricing?: {
    totalPrice: number;
    pricePerServing: number;
    formattedPrice: string;
    formattedPricePerServing: string;
    breakdown: any[];
    store: string;
    location: string;
    date: string;
    pricedAt: Date;
  };
  recipe?: any;
  missingIngredients?: any[];
  canRetry?: boolean;
}

export const useRecipeProcessor = (
  accessToken: string | null,
  backendUrl: string = 'http://localhost:3001'
) => {
  const { currentUser } = useAuth();
  
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [editedData, setEditedData] = useState<ParsedRecipeDto | null>(null);
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });
  const [showPdfReview, setShowPdfReview] = useState(false);
  const [isPricing, setIsPricing] = useState(false);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isSavingToFirestore, setIsSavingToFirestore] = useState(false);

  // Load user's recipes (simplified - no state management)
  const loadUserRecipes = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${backendUrl}/recipe-processing/my-recipes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Recipes loaded:', data.recipes?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  }, [accessToken, backendUrl]);

  // Load user's submissions (simplified - no state management)
  const loadUserSubmissions = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${backendUrl}/recipe-processing/my-submissions?limit=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Submissions loaded:', data.submissions?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  }, [accessToken, backendUrl]);

  // NEW: Parse PDF using Claude Recipe Parser Service
  const uploadFile = useCallback(async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload || !accessToken || !currentUser) return;

    setStatus({
      type: 'loading',
      message: '🤖 Parsing recipe with AI... This may take a moment'
    });

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('ownerId', currentUser.uid);

      // Call Recipe Parser Service
      const response = await fetch(`${backendUrl}/recipe-parser/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Create submission data structure
        const submission: SubmissionData = {
          id: `local-${Date.now()}`, // Local ID since we're not saving to backend
          filename: fileToUpload.name,
          status: 'completed',
          recipe: result.data,
          originalRecipe: JSON.parse(JSON.stringify(result.data)),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setSubmissionData(submission);
        setEditedData(result.data);
        setCurrentSubmissionId(submission.id);
        setShowPdfReview(true);
        
        setStatus({
          type: 'success',
          message: '✅ Recipe parsed successfully!'
        });
        
        loadUserRecipes();
        loadUserSubmissions();
      } else {
        setStatus({
          type: 'error',
          message: `❌ ${result.error || 'Failed to parse recipe'}`
        });
      }
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: `❌ Error: ${error.message}`
      });
    }
  }, [selectedFile, accessToken, currentUser, backendUrl, loadUserRecipes, loadUserSubmissions]);

  // Save edited data (local only)
  const saveEditedData = useCallback(async () => {
    if (!editedData || !submissionData) return;

    setStatus({ type: 'loading', message: 'Saving changes...' });

    try {
      // Update local submission data
      const updatedSubmission = {
        ...submissionData,
        recipe: editedData,
        status: 'edited' as const,
        updatedAt: new Date().toISOString()
      };

      setSubmissionData(updatedSubmission);
      setStatus({ type: 'success', message: '✅ Changes saved locally' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to save changes' });
    }
  }, [editedData, submissionData]);

  // NEW: Price recipe using Recipe Price Fixer Service
  const priceRecipe = useCallback(async () => {
    if (!editedData || !accessToken) return;

    setIsPricing(true);
    setStatus({ type: 'loading', message: '💰 Pricing recipe and fixing any issues...' });

    try {
      // Call Recipe Price Fixer Service
      const response = await fetch(`${backendUrl}/api/fix-price`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Convert to pricing result format
        const pricingData: PricingResult = {
          success: true,
          message: result.message,
          details: result.details,
          pricing: result.details ? {
            totalPrice: result.details.regularPrice || 0,
            pricePerServing: (result.details.regularPrice || 0) / (editedData.portions || 1),
            formattedPrice: `$${(result.details.regularPrice || 0).toFixed(2)}`,
            formattedPricePerServing: `$${((result.details.regularPrice || 0) / (editedData.portions || 1)).toFixed(2)}`,
            breakdown: [],
            store: 'Standard Prices',
            location: 'Database',
            date: new Date().toISOString(),
            pricedAt: new Date()
          } : undefined,
          recipe: editedData
        };

        setPricingResult(pricingData);
        setShowPricingModal(true);
        setStatus({ 
          type: 'success', 
          message: result.message
        });
        
        // Update submission data
        if (submissionData) {
          setSubmissionData({
            ...submissionData,
            status: 'priced',
            pricingData: pricingData,
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        setPricingResult({
          success: false,
          message: result.message || 'Failed to price recipe',
          canRetry: true
        });
        setShowPricingModal(true);
        setStatus({ 
          type: 'error', 
          message: result.message || 'Failed to price recipe' 
        });
      }
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: `❌ Pricing error: ${error.message}`
      });
    } finally {
      setIsPricing(false);
    }
  }, [editedData, accessToken, backendUrl, submissionData]);

  // Submit to Firestore
  const submitToFirestore = useCallback(async () => {
    if (!editedData || !accessToken) return;

    setIsSavingToFirestore(true);
    setStatus({ type: 'loading', message: '🔥 Saving to Firestore...' });

    try {
      // Save recipe to your existing Firestore endpoint
      const response = await fetch(`${backendUrl}/recipes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus({ 
          type: 'success', 
          message: '✅ Recipe saved to Firestore successfully!' 
        });
        
        loadUserRecipes();
        loadUserSubmissions();
        setShowPricingModal(false);
      } else {
        setStatus({ 
          type: 'error', 
          message: result.message || 'Failed to save to Firestore' 
        });
      }
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: `❌ Firestore error: ${error.message}`
      });
    } finally {
      setIsSavingToFirestore(false);
    }
  }, [editedData, accessToken, backendUrl, loadUserRecipes, loadUserSubmissions]);

  // Utility functions
  const resetToOriginal = useCallback(() => {
    if (submissionData?.originalRecipe) {
      setEditedData(JSON.parse(JSON.stringify(submissionData.originalRecipe)));
      setStatus({ type: 'success', message: 'Reset to original data' });
    }
  }, [submissionData]);

  const startNewUpload = useCallback(() => {
    setCurrentSubmissionId(null);
    setSubmissionData(null);
    setEditedData(null);
    setShowPdfReview(false);
    setSelectedFile(null);
    setStatus({ type: 'idle', message: '' });
    setPricingResult(null);
    setShowPricingModal(false);
  }, []);

  const canPriceRecipe = useCallback(() => {
    return editedData && !isPricing;
  }, [editedData, isPricing]);

  const canSaveToFirestore = useCallback(() => {
    return editedData && !isSavingToFirestore;
  }, [editedData, isSavingToFirestore]);

  return {
    // State
    selectedFile,
    setSelectedFile,
    currentSubmissionId,
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
    
    // Actions
    uploadFile,
    saveEditedData,
    priceRecipe,
    submitToFirestore,
    resetToOriginal,
    startNewUpload,
    loadUserRecipes,
    loadUserSubmissions,
    
    // Computed
    canPriceRecipe: canPriceRecipe(),
    canSaveToFirestore: canSaveToFirestore()
  };
};