// C:\Users\satta\eCo-op\frontend\app\recipe-processor\page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedRecipeDisplay from '@/components/custom-recipes/EnhancedRecipeDisplay';
import PricingResultModal from '@/components/custom-recipes/PricingResultModal';

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

interface UserRecipe {
  id: string;
  name: string;
  portions: number;
  ingredients: any[];
  currentPrice?: number;
  createdAt: any;
  updatedAt: any;
}

interface Submission {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed' | 'edited' | 'priced';
  hasRecipe: boolean;
  hasPricing: boolean;
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

export default function RecipeProcessorPage() {
  // File and processing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  
  // UI state
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });
  const [dragOver, setDragOver] = useState(false);
  const [showPdfReview, setShowPdfReview] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  
  // Pricing state
  const [isPricing, setIsPricing] = useState(false);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isSavingToFirestore, setIsSavingToFirestore] = useState(false);
  
  // Polling for submission updates
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Data state
  const [userRecipes, setUserRecipes] = useState<UserRecipe[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);

  const { currentUser, accessToken, loading: authLoading } = useAuth();

  // Check auth status on component mount
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
  }, [currentUser, authLoading, accessToken]);

  // Poll for submission updates when processing
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

  // Load user's recipes
  const loadUserRecipes = async () => {
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
        setUserRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  };

  // Load user's submissions
  const loadUserSubmissions = async () => {
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
        setUserSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  // Load submission data
  const loadSubmissionData = async (submissionId: string) => {
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
  };

  // File handling functions
  const handleFileSelect = useCallback((file: File | null) => {
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
    setShowPdfReview(false);
    setPricingResult(null);

    setTimeout(() => {
      uploadFile(file);
    }, 500);
  }, [currentUser, accessToken]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

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

  // Upload function
  const uploadFile = async (file?: File) => {
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
  };

  // Save edited data
  const saveEditedData = async () => {
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
        loadSubmissionData(currentSubmissionId);
        loadUserSubmissions();
      } else {
        setStatus({ type: 'error', message: 'Failed to save changes' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error saving changes' });
    }
  };

  // NEW: Price Recipe function
  const priceRecipe = async () => {
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
        
        // Refresh submission data to get updated pricing info
        await loadSubmissionData(currentSubmissionId);
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
  };

  // NEW: Submit to Firestore function
  const submitToFirestore = async () => {
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
        
        // Refresh data
        await loadSubmissionData(currentSubmissionId);
        loadUserRecipes();
        loadUserSubmissions();
        
        // Close pricing modal if open
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
  };

  // Reset to original data
  const resetToOriginal = () => {
    if (submissionData?.originalRecipe) {
      setEditedData(JSON.parse(JSON.stringify(submissionData.originalRecipe)));
      setStatus({ type: 'success', message: 'Reset to original data' });
    }
  };

  // Start new upload
  const startNewUpload = () => {
    setCurrentSubmissionId(null);
    setSubmissionData(null);
    setEditedData(null);
    setShowPdfReview(false);
    setSelectedFile(null);
    setStatus({ type: 'idle', message: '' });
    setPricingResult(null);
    setShowPricingModal(false);
  };

  // Test connection
  const testConnection = async () => {
    try {
      const response = await fetch(`${backendUrl}/recipe-processing/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus({
          type: 'success',
          message: `✅ Backend connection successful - ${data.message}`
        });
      } else {
        setStatus({
          type: 'error',
          message: '⚠️ Backend health check failed'
        });
      }
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: `❌ Backend not reachable: ${error.message}`
      });
    }
  };

  // Delete recipe
  const deleteRecipe = async (recipeId: string, recipeName: string) => {
    if (!accessToken || !confirm(`Delete "${recipeName}"?`)) return;

    try {
      const response = await fetch(`${backendUrl}/recipe-processing/recipe/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUserRecipes(prev => prev.filter(r => r.id !== recipeId));
        setStatus({
          type: 'success',
          message: `✅ Recipe "${recipeName}" deleted successfully`
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `❌ Error deleting recipe`
      });
    }
  };

  // Load existing submission
  const loadExistingSubmission = (submissionId: string) => {
    setCurrentSubmissionId(submissionId);
    setShowPdfReview(true);
    setStatus({ type: 'idle', message: '' });
  };

  // Utility functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🔄 Processing</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Completed</Badge>;
      case 'edited':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">✏️ Edited</Badge>;
      case 'priced':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">💰 Priced</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">❌ Failed</Badge>;
      default:
        return <Badge variant="secondary">❓ Unknown</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatPrice = (price?: number) => {
    return price ? `$${price.toFixed(2)}` : 'Not priced';
  };

  // Check if recipe can be priced (has recipe data and not currently processing)
  const canPriceRecipe = () => {
    return submissionData?.recipe && 
           submissionData.status !== 'processing' && 
           !isPricing;
  };

  // Check if recipe can be saved to Firestore (has recipe data)
  const canSaveToFirestore = () => {
    return submissionData?.recipe && 
           submissionData.status !== 'processing' && 
           !isSavingToFirestore;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Upload & Settings */}
            <div className="xl:col-span-1 space-y-6">
              {/* Upload Zone */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>📤 Upload Recipe</span>
                    {showPdfReview && (
                      <Button
                        onClick={startNewUpload}
                        variant="outline"
                        size="sm"
                      >
                        New Upload
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`
                      relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
                      ${!currentUser 
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50' 
                        : dragOver 
                          ? 'border-indigo-400 bg-indigo-50 cursor-pointer' 
                          : 'border-indigo-300 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 hover:border-indigo-400 hover:bg-indigo-50/70 cursor-pointer'
                      }
                    `}
                    onDrop={currentUser ? handleDrop : undefined}
                    onDragOver={currentUser ? handleDragOver : undefined}
                    onDragLeave={currentUser ? handleDragLeave : undefined}
                    onClick={currentUser ? () => document.getElementById('fileInput')?.click() : undefined}
                  >
                    <input
                      id="fileInput"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                      disabled={!currentUser}
                    />
                    
                    <div className="space-y-3">
                      <div className="text-4xl">
                        {!currentUser ? '🔒' : '📄'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 mb-1">
                          {!currentUser 
                            ? 'Login required'
                            : 'Drop PDF or click to browse'
                          }
                        </div>
                        <div className="text-sm text-gray-600">
                          {!currentUser 
                            ? 'Please log in to start processing'
                            : 'Upload → Edit → Price → Save to Firestore'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File Info */}
                  {selectedFile && (
                    <div className="mt-4 p-3 bg-gray-50 rounded border">
                      <div className="font-medium text-sm">{selectedFile.name}</div>
                      <div className="text-xs text-gray-600">{formatFileSize(selectedFile.size)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Connection Test */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔗 Connection</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={testConnection}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    Test Backend Connection
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Backend: {backendUrl}
                  </p>
                </CardContent>
              </Card>

              {/* User Info */}
              {currentUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">👤 User Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <div><strong>Email:</strong> {currentUser.email}</div>
                      <div className="text-xs text-gray-600">UID: {currentUser.uid}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* User Lists */}
              {currentUser && (userSubmissions.length > 0 || userRecipes.length > 0) && (
                <div className="space-y-4">
                  {/* Recent Submissions */}
                  {userSubmissions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>📝 Recent ({userSubmissions.length})</span>
                          <Button
                            onClick={() => setShowSubmissions(!showSubmissions)}
                            variant="outline"
                            size="sm"
                          >
                            {showSubmissions ? 'Hide' : 'Show'}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      {showSubmissions && (
                        <CardContent>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {userSubmissions.slice(0, 5).map((submission) => (
                              <div key={submission.id} className="text-xs p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" 
                                   onClick={() => loadExistingSubmission(submission.id)}>
                                <div className="font-medium truncate">{submission.filename}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  {getStatusBadge(submission.status)}
                                  {submission.hasPricing && (
                                    <Badge variant="outline" className="text-xs">💰 Priced</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Saved Recipes */}
                  {userRecipes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>📚 Recipes ({userRecipes.length})</span>
                          <Button
                            onClick={() => setShowRecipes(!showRecipes)}
                            variant="outline"
                            size="sm"
                          >
                            {showRecipes ? 'Hide' : 'Show'}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      {showRecipes && (
                        <CardContent>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {userRecipes.slice(0, 3).map((recipe) => (
                              <div key={recipe.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{recipe.name}</div>
                                  <div className="text-gray-600">{recipe.portions} portions • {formatPrice(recipe.currentPrice)}</div>
                                </div>
                                <Button
                                  onClick={() => deleteRecipe(recipe.id, recipe.name)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - PDF & Data Review */}
            <div className="xl:col-span-2">
              {showPdfReview && submissionData ? (
                <EnhancedRecipeDisplay
                  submissionData={submissionData}
                  selectedFile={selectedFile}
                  currentSubmissionId={currentSubmissionId}
                  authToken={accessToken || ''}
                  backendUrl={backendUrl}
                  onSaveChanges={saveEditedData}
                  onPriceRecipe={priceRecipe}
                  onSubmitToFirestore={submitToFirestore}
                  onReset={resetToOriginal}
                  editedData={editedData}
                  onEditData={setEditedData}
                  isPricing={isPricing}
                  isSavingToFirestore={isSavingToFirestore}
                  canPriceRecipe={canPriceRecipe()}
                  canSaveToFirestore={canSaveToFirestore()}
                />
              ) : (
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
                            <span>Price recipe with "Price Recipe" button</span>
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
              canSaveToFirestore={canSaveToFirestore()}
            />
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}