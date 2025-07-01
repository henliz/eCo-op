'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext'; // Adjust import path as needed

interface UploadStatus {
  type: 'idle' | 'loading' | 'success' | 'error' | 'auth-required';
  message: string;
}

interface ProcessingResult {
  message?: string;
  error?: string;
  data?: unknown;
  details?: string;
  recipe?: unknown;
  user?: string;
  firestoreRecipeId?: string;
  addedIngredients?: string[];
}

interface UserRecipe {
  id: string;
  name: string;
  portions: number;
  ingredients: unknown[];
  createdAt: FirestoreTimestamp | string | Date;
  updatedAt: FirestoreTimestamp | string | Date;
}

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds?: number;
}

export default function RecipeProcessorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');
  const [store, setStore] = useState('Walmart');
  const [location, setLocation] = useState('100 The Boardwalk');
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [userRecipes, setUserRecipes] = useState<UserRecipe[]>([]);
  const [showRecipes, setShowRecipes] = useState(false);

  // Use your existing auth context
  const { currentUser, accessToken, loading: authLoading } = useAuth();

  // Load user's recipes
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
        setUserRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  }, [accessToken, backendUrl]);

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
        // Load user's recipes when authenticated
        loadUserRecipes();
      }
    }
  }, [currentUser, authLoading, accessToken, loadUserRecipes]);

  // Upload function with authentication
  const uploadFile = useCallback(async (file?: File) => {
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
        // Reload user recipes after successful upload
        loadUserRecipes();
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus({
        type: 'error',
        message: `❌ Network error: ${errorMessage}`
      });
      setResult({
        error: errorMessage,
        details: 'Check if your backend is running on the correct port'
      });
    }
  }, [selectedFile, accessToken, backendUrl, loadUserRecipes]);

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

    // Auto-upload after file selection
    setTimeout(() => {
      uploadFile(file);
    }, 500);
  }, [currentUser, accessToken, uploadFile]);

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

  // Test connection with auth
  const testConnection = async () => {
    try {
      const response = await fetch(`${backendUrl}/recipe-processing/health`);
      if (response.ok) {
        setStatus({
          type: 'success',
          message: '✅ Backend connection successful'
        });
      } else {
        setStatus({
          type: 'error',
          message: '⚠️ Backend health check failed'
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus({
        type: 'error',
        message: `❌ Backend not reachable: ${errorMessage}`
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
      } else {
        setStatus({
          type: 'error',
          message: `❌ Failed to delete recipe`
        });
      }
    } catch {
      setStatus({
        type: 'error',
        message: `❌ Error deleting recipe`
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (timestamp: FirestoreTimestamp | string | Date) => {
    if (!timestamp) return 'Unknown';

    // Handle Firestore timestamp
    const date = (timestamp as FirestoreTimestamp).seconds
      ? new Date((timestamp as FirestoreTimestamp).seconds * 1000)
      : new Date(timestamp as string | Date);
    return date.toLocaleDateString();
  };

  // Show loading state while checking auth
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
        <div className="container mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
              🍳 Recipe Processor
            </h1>
            <p className="text-lg text-gray-600">
              {currentUser 
                ? `Welcome ${currentUser.email}! Upload a PDF recipe to process it.`
                : 'Please log in to upload and process recipes'
              }
            </p>
          </div>

          {/* User Recipes Section */}
          {currentUser && userRecipes.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  <h2 className="text-lg font-semibold text-gray-800">
                    My Recipes ({userRecipes.length})
                  </h2>
                </div>
                <Button
                  onClick={() => setShowRecipes(!showRecipes)}
                  variant="outline"
                  size="sm"
                >
                  {showRecipes ? 'Hide' : 'Show'} Recipes
                </Button>
              </div>
              
              {showRecipes && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {userRecipes.map((recipe) => (
                    <div key={recipe.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">{recipe.name}</div>
                        <div className="text-sm text-gray-600">
                          {recipe.portions} portions • {recipe.ingredients.length} ingredients • {formatDate(recipe.createdAt)}
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteRecipe(recipe.id, recipe.name)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Configuration */}
            <div className="space-y-6">
              {/* Configuration Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🔧</span>
                  <h2 className="text-lg font-semibold text-gray-800">Backend Configuration</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="backendUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      Backend URL
                    </label>
                    <Input
                      id="backendUrl"
                      type="text"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      placeholder="Backend URL"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="store" className="block text-sm font-medium text-gray-700 mb-2">
                        Store
                      </label>
                      <Input
                        id="store"
                        type="text"
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                        placeholder="Store"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <Input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={testConnection}
                    variant="outline"
                    className="w-full"
                  >
                    Test Connection
                  </Button>
                </div>
              </div>

              {/* Auth Status */}
              {currentUser && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">👤</span>
                    <h2 className="text-lg font-semibold text-gray-800">User Info</h2>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Email:</strong> {currentUser.email}</p>
                    <p><strong>UID:</strong> {currentUser.uid}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Upload */}
            <div className="space-y-6">
              {/* Upload Zone */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div
                  className={`
                    relative border-3 border-dashed rounded-xl p-12 text-center transition-all duration-300 ease-in-out
                    ${!currentUser 
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50' 
                      : dragOver 
                        ? 'border-indigo-400 bg-indigo-50 scale-102 cursor-pointer' 
                        : 'border-indigo-300 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 hover:border-indigo-400 hover:bg-indigo-50/70 hover:scale-101 cursor-pointer'
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
                  
                  <div className="space-y-4">
                    <div className="text-6xl">
                      {!currentUser ? '🔒' : '📄'}
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-800 mb-2">
                        {!currentUser 
                          ? 'Login required to upload recipes'
                          : 'Drop your recipe PDF here'
                        }
                      </div>
                      <div className="text-gray-600">
                        {!currentUser 
                          ? 'Please log in to start processing recipes'
                          : 'or click to browse files'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Info */}
                {selectedFile && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="font-semibold text-gray-800 mb-1">
                      {selectedFile.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                )}
              </div>
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

          {/* Result Section */}
          {result && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📊</span>
                <h2 className="text-lg font-semibold text-gray-800">Processing Result</h2>
              </div>
              
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96 border-l-4 border-indigo-500">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}