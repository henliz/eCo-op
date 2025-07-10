// C:\Users\satta\eCo-op\frontend\hooks\useRecipeProcessor.ts
import { useState, useCallback, useEffect } from 'react';

interface UploadStatus {
  type: 'idle' | 'loading' | 'success' | 'error' | 'auth-required';
  message: string;
}

interface SubmissionData {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed' | 'edited' | 'priced';
  recipe?: any;
  originalRecipe?: any;
  pricingData?: any;
  processingSteps?: string[];
  warnings?: string[];
  createdAt: string;
  updatedAt: string;
}

interface PricingResult {
  success: boolean;
  message: string;
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
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });
  const [showPdfReview, setShowPdfReview] = useState(false);
  const [isPricing, setIsPricing] = useState(false);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isSavingToFirestore, setIsSavingToFirestore] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

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

  // Load submission data
  const loadSubmissionData = useCallback(async (submissionId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${backendUrl}/recipe-processing/submission/${submissionId}/data`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissionData(data);
        setEditedData(data.recipe ? JSON.parse(JSON.stringify(data.recipe)) : null);
        
        if (data.status === 'processing' || data.status === 'completed' || data.status === 'priced') {
          setShowPdfReview(true);
        }
      }
    } catch (error) {
      console.error('Failed to load submission data:', error);
    }
  }, [accessToken, backendUrl]);

  // File upload
  const uploadFile = useCallback(async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload || !accessToken) return;

    const formData = new FormData();
    formData.append('file', fileToUpload);

    setStatus({
      type: 'loading',
      message: '🔄 Processing recipe... This may take a moment'
    });

    try {
      const response = await fetch(`${backendUrl}/recipe-processing/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData
      });

      const resultData = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: `✅ ${resultData.message || 'Upload successful'}`
        });
        setCurrentSubmissionId(resultData.submissionId);
        setShowPdfReview(true);
        
        loadUserRecipes();
        loadUserSubmissions();
      } else {
        if (response.status === 401) {
          setStatus({
            type: 'auth-required',
            message: '🔒 Authentication failed. Please log in again.'
          });
        } else {
          setStatus({
            type: 'error',
            message: `❌ ${resultData.message || 'Upload failed'}`
          });
        }
      }
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: `❌ Network error: ${error.message}`
      });
    }
  }, [selectedFile, accessToken, backendUrl, loadUserRecipes, loadUserSubmissions]);

  // Save edited data
  const saveEditedData = useCallback(async () => {
    if (!currentSubmissionId || !accessToken || !editedData) return;

    setStatus({ type: 'loading', message: 'Saving changes...' });

    try {
      const response = await fetch(`${backendUrl}/recipe-processing/submission/${currentSubmissionId}/data`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe: editedData,
          status: 'edited'
        }),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Changes saved successfully' });
        // Trigger reload directly instead of calling function
        if (currentSubmissionId && accessToken) {
          const response = await fetch(`${backendUrl}/recipe-processing/submission/${currentSubmissionId}/data`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            setSubmissionData(data);
            setEditedData(data.recipe ? JSON.parse(JSON.stringify(data.recipe)) : null);
          }
        }
        loadUserSubmissions();
      } else {
        setStatus({ type: 'error', message: 'Failed to save changes' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error saving changes' });
    }
  }, [currentSubmissionId, accessToken, editedData, backendUrl, loadUserSubmissions]);

  // Price recipe
  const priceRecipe = useCallback(async () => {
    if (!currentSubmissionId || !accessToken) return;

    setIsPricing(true);
    setStatus({ type: 'loading', message: '💰 Pricing recipe...' });

    try {
      const response = await fetch(`${backendUrl}/recipe-processing/submission/${currentSubmissionId}/price`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store: 'Default Store',
          location: 'Default Location'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setPricingResult(result);
        setShowPricingModal(true);
        setStatus({ 
          type: 'success', 
          message: `✅ Recipe priced successfully: ${result.pricing.formattedPrice}` 
        });
        
        // Reload submission data directly
        if (currentSubmissionId && accessToken) {
          const dataResponse = await fetch(`${backendUrl}/recipe-processing/submission/${currentSubmissionId}/data`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (dataResponse.ok) {
            const data = await dataResponse.json();
            setSubmissionData(data);
            setEditedData(data.recipe ? JSON.parse(JSON.stringify(data.recipe)) : null);
          }
        }
        loadUserSubmissions();
      } else {
        setPricingResult(result);
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
  }, [currentSubmissionId, accessToken, backendUrl, loadUserSubmissions]);

  // Submit to Firestore
  const submitToFirestore = useCallback(async () => {
    if (!currentSubmissionId || !accessToken) return;

    setIsSavingToFirestore(true);
    setStatus({ type: 'loading', message: '🔥 Saving to Firestore...' });

    try {
      const response = await fetch(`${backendUrl}/recipe-processing/submission/${currentSubmissionId}/submit-to-firestore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus({ 
          type: 'success', 
          message: '✅ Recipe saved to Firestore successfully!' 
        });
        
        // Reload submission data directly
        if (currentSubmissionId && accessToken) {
          const dataResponse = await fetch(`${backendUrl}/recipe-processing/submission/${currentSubmissionId}/data`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (dataResponse.ok) {
            const data = await dataResponse.json();
            setSubmissionData(data);
            setEditedData(data.recipe ? JSON.parse(JSON.stringify(data.recipe)) : null);
          }
        }
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
  }, [currentSubmissionId, accessToken, backendUrl, loadUserRecipes, loadUserSubmissions]);

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
    return submissionData?.recipe && 
           submissionData.status !== 'processing' && 
           !isPricing;
  }, [submissionData, isPricing]);

  const canSaveToFirestore = useCallback(() => {
    return submissionData?.recipe && 
           submissionData.status !== 'processing' && 
           !isSavingToFirestore;
  }, [submissionData, isSavingToFirestore]);

  // Polling effect
  useEffect(() => {
    if (currentSubmissionId && submissionData?.status === 'processing') {
      const interval = setInterval(() => {
        loadSubmissionData(currentSubmissionId);
      }, 3000);
      
      setPollingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [currentSubmissionId, submissionData?.status]);

  // Load submission data when currentSubmissionId changes
  useEffect(() => {
    if (currentSubmissionId && accessToken) {
      loadSubmissionData(currentSubmissionId);
    }
  }, [currentSubmissionId, accessToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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