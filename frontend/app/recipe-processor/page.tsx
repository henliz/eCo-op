'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';

// Dynamic import for ReactJson
const ReactJson = React.lazy(() => import('react-json-view'));

interface UploadStatus {
  type: 'idle' | 'loading' | 'success' | 'error' | 'auth-required';
  message: string;
}

interface ProcessingResult {
  message?: string;
  error?: string;
  data?: any;
  details?: string;
  recipe?: any;
  user?: string;
  firestoreRecipeId?: string;
  addedIngredients?: string[];
  submissionId?: string;
  success?: boolean;
}

interface SubmissionData {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed' | 'edited';
  recipe?: any;
  originalRecipe?: any;
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
  createdAt: any;
  updatedAt: any;
}

interface Submission {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed' | 'edited';
  hasRecipe: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function RecipeProcessorPage() {
  // File and processing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  
  // UI state
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');
  const [store, setStore] = useState('Walmart');
  const [location, setLocation] = useState('100 The Boardwalk');
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPdfReview, setShowPdfReview] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  
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
        
        if (data.status === 'processing' || data.status === 'completed') {
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
    setResult(null);
    setShowPdfReview(false);

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
    setResult(null);

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
        setResult(resultData);
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
        if (resultData.error) {
          setResult({ error: resultData.error });
        }
      }
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: `❌ Network error: ${error.message}`
      });
      setResult({
        error: error.message,
        details: 'Check if your backend is running on the correct port'
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
      } else {
        setStatus({ type: 'error', message: 'Failed to save changes' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error saving changes' });
    }
  };

  // Finalize submission
  const finalizeSubmission = async () => {
    if (!currentSubmissionId || !accessToken) return;

    setStatus({ type: 'loading', message: 'Finalizing submission...' });

    try {
      const response = await fetch(`${backendUrl}/recipe-processing/submission/${currentSubmissionId}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Recipe saved to Firestore successfully!' });
        loadUserRecipes();
        loadUserSubmissions();
        
        setCurrentSubmissionId(null);
        setSubmissionData(null);
        setEditedData(null);
        setShowPdfReview(false);
        setSelectedFile(null);
      } else {
        setStatus({ type: 'error', message: 'Failed to finalize submission' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error finalizing submission' });
    }
  };

  // Start new upload
  const startNewUpload = () => {
    setCurrentSubmissionId(null);
    setSubmissionData(null);
    setEditedData(null);
    setShowPdfReview(false);
    setResult(null);
    setSelectedFile(null);
    setStatus({ type: 'idle', message: '' });
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

  // Utility functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🔄 Processing</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Completed</Badge>;
      case 'edited':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">✏️ Edited</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">❌ Failed</Badge>;
      default:
        return <Badge variant="secondary">❓ Unknown</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // JSON Viewer Component
  const JsonViewer = ({ data, onEdit }: { data: any; onEdit: (e: any) => void }) => {
    return (
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-96">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ReactJson
          src={data || {}}
          onEdit={onEdit}
          onAdd={onEdit}
          onDelete={onEdit}
          theme="rjv-default"
          displayDataTypes={false}
          displayObjectSize={false}
          enableClipboard={false}
          style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            fontSize: '12px',
            height: '100%'
          }}
        />
      </React.Suspense>
    );
  };

  // Simple PDF Link Component (shows file info and download link)
  const PdfInfoViewer = ({ file, submissionId }: { file: File | null; submissionId: string | null }) => {
    const downloadPdf = async () => {
      if (!submissionId || !accessToken) return;
      
      try {
        const response = await fetch(`${backendUrl}/recipe-processing/submission/${submissionId}/pdf`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file?.name || 'recipe.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Failed to download PDF:', error);
      }
    };

    return (
      <div className="border rounded bg-white h-full">
        <div className="p-4 bg-gray-50 border-b">
          <span className="font-medium">Original PDF</span>
        </div>
        <div className="p-8 flex flex-col items-center justify-center h-[500px] text-center">
          <div className="text-6xl mb-4">📄</div>
          {file && (
            <>
              <div className="font-medium text-lg mb-2">{file.name}</div>
              <div className="text-sm text-gray-600 mb-4">
                Size: {formatFileSize(file.size)}
              </div>
            </>
          )}
          <div className="text-gray-600 mb-6 max-w-md">
            <p className="mb-2">PDF viewer temporarily disabled due to compatibility issues.</p>
            <p>You can download the PDF to view it separately.</p>
          </div>
          {submissionId && (
            <Button
              onClick={downloadPdf}
              variant="outline"
              className="flex items-center gap-2"
            >
              📥 Download PDF
            </Button>
          )}
        </div>
      </div>
    );
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
                ? `Welcome ${currentUser.email}! Upload a PDF recipe to process and review it.`
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
                            : 'We\'ll extract the recipe data and show it alongside your PDF info'
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

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">⚙️ Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Backend URL</label>
                    <Input
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      placeholder="Backend URL"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Store</label>
                      <Input
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                        placeholder="Store"
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Location</label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={testConnection}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    Test Connection
                  </Button>
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
                            {userSubmissions.slice(0, 3).map((submission) => (
                              <div key={submission.id} className="text-xs p-2 bg-gray-50 rounded">
                                <div className="font-medium truncate">{submission.filename}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  {getStatusBadge(submission.status)}
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
                                  <div className="text-gray-600">{recipe.portions} portions</div>
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
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>📄 Review: {submissionData.filename}</span>
                        {getStatusBadge(submissionData.status)}
                      </div>
                      <div className="flex gap-2">
                        {submissionData.recipe && submissionData.status !== 'processing' && (
                          <Button
                            onClick={finalizeSubmission}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            ✅ Save to Firestore
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="side-by-side" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="side-by-side">📄📋 Side by Side</TabsTrigger>
                        <TabsTrigger value="pdf-only">📄 PDF Info</TabsTrigger>
                        <TabsTrigger value="data-only" disabled={!submissionData.recipe}>
                          📋 Data Only
                        </TabsTrigger>
                      </TabsList>

                      {/* Side by Side View */}
                      <TabsContent value="side-by-side" className="mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
                          {/* PDF Info Viewer */}
                          <PdfInfoViewer file={selectedFile} submissionId={currentSubmissionId} />

                          {/* Data Viewer */}
                          <div className="border rounded overflow-hidden bg-white">
                            <div className="flex items-center justify-between p-2 bg-gray-50 border-b text-sm">
                              <span>Extracted Data</span>
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => setEditedData(JSON.parse(JSON.stringify(submissionData.originalRecipe || submissionData.recipe)))}
                                  variant="outline"
                                  size="sm"
                                  disabled={!submissionData.recipe}
                                >
                                  Reset
                                </Button>
                                <Button
                                  onClick={saveEditedData}
                                  variant="outline"
                                  size="sm"
                                  disabled={!editedData || JSON.stringify(editedData) === JSON.stringify(submissionData.recipe)}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                            <div className="h-[550px] overflow-auto">
                              {submissionData.recipe ? (
                                <JsonViewer
                                  data={editedData}
                                  onEdit={(e) => setEditedData(e.updated_src)}
                                />
                              ) : submissionData.status === 'processing' ? (
                                <div className="flex items-center justify-center h-full">
                                  <div className="text-center">
                                    <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-sm text-gray-600">AI is extracting recipe data...</p>
                                    {submissionData.processingSteps && (
                                      <div className="mt-4 text-xs text-gray-500 max-w-xs">
                                        {submissionData.processingSteps.map((step, index) => (
                                          <div key={index} className="mb-1">{step}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : submissionData.status === 'failed' ? (
                                <div className="flex items-center justify-center h-full">
                                  <div className="text-center text-red-600">
                                    <div className="text-4xl mb-2">❌</div>
                                    <p className="text-sm">Processing failed</p>
                                    {submissionData.warnings && submissionData.warnings.length > 0 && (
                                      <div className="mt-2 text-xs">
                                        {submissionData.warnings.map((warning, index) => (
                                          <div key={index}>{warning}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <div className="text-center text-gray-500">
                                    <div className="text-4xl mb-2">📋</div>
                                    <p className="text-sm">No data extracted yet</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* PDF Only View */}
                      <TabsContent value="pdf-only" className="mt-4">
                        <div className="h-[600px]">
                          <PdfInfoViewer file={selectedFile} submissionId={currentSubmissionId} />
                        </div>
                      </TabsContent>

                      {/* Data Only View */}
                      <TabsContent value="data-only" className="mt-4">
                        <div className="border rounded overflow-hidden bg-white h-[600px]">
                          <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                            <span className="font-medium">Extracted Recipe Data</span>
                            <div className="flex gap-2">
                              {submissionData.warnings && submissionData.warnings.length > 0 && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  ⚠️ {submissionData.warnings.length} Warning(s)
                                </Badge>
                              )}
                              <Button
                                onClick={() => setEditedData(JSON.parse(JSON.stringify(submissionData.originalRecipe || submissionData.recipe)))}
                                variant="outline"
                                size="sm"
                                disabled={!submissionData.recipe}
                              >
                                Reset to Original
                              </Button>
                              <Button
                                onClick={saveEditedData}
                                variant="outline"
                                size="sm"
                                disabled={!editedData || JSON.stringify(editedData) === JSON.stringify(submissionData.recipe)}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                          
                          {/* Warnings */}
                          {submissionData.warnings && submissionData.warnings.length > 0 && (
                            <div className="p-3 bg-yellow-50 border-b border-yellow-200">
                              <div className="text-sm font-medium text-yellow-800 mb-1">⚠️ Processing Warnings:</div>
                              {submissionData.warnings.map((warning, index) => (
                                <div key={index} className="text-xs text-yellow-700">• {warning}</div>
                              ))}
                            </div>
                          )}
                          
                          <div className="h-[500px] overflow-auto">
                            {submissionData.recipe ? (
                              <JsonViewer
                                data={editedData}
                                onEdit={(e) => setEditedData(e.updated_src)}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <div className="text-center text-gray-500">
                                  <div className="text-6xl mb-4">📋</div>
                                  <p>No recipe data available</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-[600px] flex items-center justify-center">
                  <CardContent>
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">📄</div>
                      <h3 className="text-xl font-semibold mb-2">Upload a PDF to get started</h3>
                      <p className="text-gray-600 max-w-md">
                        Once you upload a PDF, we'll extract the recipe data and show it here alongside the PDF information.
                      </p>
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

          {/* Debug Result (Optional - can be removed in production) */}
          {result && result.error && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-red-600">🐛 Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-48">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}