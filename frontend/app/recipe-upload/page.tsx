'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PdfViewer from '@/components/PDFviewer';

// Types
interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  type?: string;
}

interface UserRecipeDto {
  id?: string;
  name: string;
  instructions: string[];
  description?: string;
  ownerId: string;
  visibility: 'private' | 'public';
  status: 'draft' | 'validated' | 'needs_investigation' | 'rejected' | 'test_data';
  portions: number;
  tags?: string[];
  ingredients: RecipeIngredient[];
  parsingNotes?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface ParseResponse {
  success: boolean;
  data?: any; // We'll ignore this
  userRecipe?: UserRecipeDto;
  message: string;
  error?: string;
}

type UploadStep = 'upload' | 'preview' | 'edit' | 'saving' | 'success';

export default function RecipeUploadPage() {
  const { currentUser, makeAPICall } = useAuth();
  const router = useRouter();
  
  // State management
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<UserRecipeDto | null>(null);
  const [editedRecipe, setEditedRecipe] = useState<UserRecipeDto | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Debug logging
  const debugLog = (step: string, data?: any) => {
    console.log(`[RecipeUpload] ${step}:`, data);
  };

  // Auth check - redirect if not authenticated
  useEffect(() => {
    debugLog('Auth check', { hasUser: !!currentUser });
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // File type detection
  const detectFileType = (file: File): 'pdf' | 'image' | 'unsupported' => {
    debugLog('Detecting file type', { 
      name: file.name, 
      type: file.type, 
      size: file.size 
    });

    // Check by MIME type first
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';

    // Fallback to extension
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(extension || '')) return 'image';

    return 'unsupported';
  };

  // File selection handler
  const handleFileSelect = useCallback((file: File | null) => {
    debugLog('File selected', file);
    setError(null);
    
    if (!file) {
      setSelectedFile(null);
      setCurrentStep('upload');
      return;
    }

    const fileType = detectFileType(file);
    if (fileType === 'unsupported') {
      setError('Unsupported file type. Please upload a PDF or image file.');
      return;
    }

    setSelectedFile(file);
    setCurrentStep('preview');
  }, []);

  // File input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

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

  // Camera functions
  const startCamera = async () => {
    debugLog('Starting camera', { facingMode });
    try {
      setError(null);
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setIsUsingCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      debugLog('Camera error', err);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    debugLog('Stopping camera');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsUsingCamera(false);
  };

  const capturePhoto = () => {
    debugLog('Capturing photo');
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFileSelect(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Restart camera with new facing mode
    if (isUsingCamera) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(newFacingMode);
        startCamera();
      }, 100);
    }
  };

  // Parse recipe from file
  const parseRecipe = async () => {
    if (!selectedFile || !currentUser) return;

    debugLog('Starting parse', { fileName: selectedFile.name });
    setIsProcessing(true);
    setError(null);

    try {
      const fileType = detectFileType(selectedFile);
      const endpoint = fileType === 'pdf' ? '/recipe-parser/parse' : '/recipe-parser/parse-image';
      
      const formData = new FormData();
      if (fileType === 'pdf') {
        formData.append('file', selectedFile);
        formData.append('ownerId', currentUser.uid);
        formData.append('visibility', 'private');
        formData.append('status', 'draft');
        formData.append('portions', '1');
      } else {
        formData.append('image', selectedFile);
        formData.append('ownerId', currentUser.uid);
      }

      debugLog('Sending parse request', { endpoint, fileType });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      const data: ParseResponse = await response.json();
      debugLog('Parse response', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.success && data.userRecipe) {
        setParsedRecipe(data.userRecipe);
        setEditedRecipe({ ...data.userRecipe });
        setCurrentStep('edit');
      } else {
        throw new Error(data.error || 'Failed to parse recipe');
      }

    } catch (err: any) {
      debugLog('Parse error', err);
      setError(err.message || 'Failed to parse recipe');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update edited recipe
  const updateEditedRecipe = (updates: Partial<UserRecipeDto>) => {
    if (!editedRecipe) return;
    
    const updated = { ...editedRecipe, ...updates };
    debugLog('Updating edited recipe', updates);
    setEditedRecipe(updated);
  };

  // Update ingredient
  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    if (!editedRecipe?.ingredients) return;

    const newIngredients = [...editedRecipe.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    };

    updateEditedRecipe({ ingredients: newIngredients });
  };

  // Add ingredient
  const addIngredient = () => {
    if (!editedRecipe) return;

    const newIngredient: RecipeIngredient = {
      name: '',
      quantity: 0,
      unit: '',
      type: 'core'
    };

    updateEditedRecipe({
      ingredients: [...(editedRecipe.ingredients || []), newIngredient]
    });
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    if (!editedRecipe?.ingredients) return;

    const newIngredients = editedRecipe.ingredients.filter((_, i) => i !== index);
    updateEditedRecipe({ ingredients: newIngredients });
  };

  // Update instruction
  const updateInstruction = (index: number, value: string) => {
    if (!editedRecipe?.instructions) return;

    const newInstructions = [...editedRecipe.instructions];
    newInstructions[index] = value;
    updateEditedRecipe({ instructions: newInstructions });
  };

  // Add instruction
  const addInstruction = () => {
    if (!editedRecipe) return;

    updateEditedRecipe({
      instructions: [...(editedRecipe.instructions || []), '']
    });
  };

  // Remove instruction
  const removeInstruction = (index: number) => {
    if (!editedRecipe?.instructions) return;

    const newInstructions = editedRecipe.instructions.filter((_, i) => i !== index);
    updateEditedRecipe({ instructions: newInstructions });
  };

  // Save recipe
  const saveRecipe = async () => {
    if (!editedRecipe || !currentUser) return;

    debugLog('Saving recipe', editedRecipe);
    setIsSaving(true);
    setError(null);

    try {
      const response = await makeAPICall('/recipe-parser/save-recipe', 'POST', {
        ...editedRecipe,
        ownerId: currentUser.uid
      }, true);

      debugLog('Save response', response);

      if (response.success) {
        setCurrentStep('success');
      } else {
        throw new Error(response.error || 'Failed to save recipe');
      }

    } catch (err: any) {
      debugLog('Save error', err);
      setError(err.message || 'Failed to save recipe');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to start
  const resetToStart = () => {
    debugLog('Resetting to start');
    setSelectedFile(null);
    setParsedRecipe(null);
    setEditedRecipe(null);
    setError(null);
    setCurrentStep('upload');
    stopCamera();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

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

        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Recipe Document</CardTitle>
            </CardHeader>
            <CardContent>
              {/* File Drop Zone */}
              <div
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
                  ${dragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                  } cursor-pointer
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                <div className="space-y-4">
                  <div className="text-4xl">📄</div>
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">
                      Drop files here or click to browse
                    </div>
                    <div className="text-sm text-gray-600">
                      Supports PDF and image files
                    </div>
                  </div>
                </div>
              </div>

              {/* Camera Section */}
              <div className="mt-6 border-t pt-6">
                <div className="text-center mb-4">
                  <div className="font-semibold text-gray-800 mb-2">Or use your camera</div>
                </div>

                {!isUsingCamera ? (
                  <div className="text-center">
                    <Button onClick={startCamera} className="mb-2">
                      📸 Start Camera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Camera Controls */}
                    <div className="flex justify-center gap-2">
                      <Button onClick={capturePhoto} variant="default">
                        📸 Capture Photo
                      </Button>
                      <Button onClick={switchCamera} variant="outline">
                        🔄 Switch Camera
                      </Button>
                      <Button onClick={stopCamera} variant="outline">
                        ❌ Stop Camera
                      </Button>
                    </div>

                    {/* Camera Preview */}
                    <div className="relative max-w-md mx-auto">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-lg border"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preview */}
        {currentStep === 'preview' && selectedFile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview: {selectedFile.name}</span>
                <div className="flex gap-2">
                  <Button onClick={resetToStart} variant="outline">
                    🔄 New Upload
                  </Button>
                  <Button 
                    onClick={parseRecipe} 
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      '🔍 Parse Recipe'
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-gray-600">
                File size: {formatFileSize(selectedFile.size)}
              </div>
              
              {/* File Preview */}
              <div className="h-96 border rounded">
                {detectFileType(selectedFile) === 'pdf' ? (
                  <PdfViewer
                    file={selectedFile}
                    filename={selectedFile.name}
                    height="100%"
                    showCard={false}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Edit */}
        {currentStep === 'edit' && editedRecipe && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Edit Recipe Data</span>
                <div className="flex gap-2">
                  <Button onClick={resetToStart} variant="outline">
                    🔄 Start Over
                  </Button>
                  <Button 
                    onClick={saveRecipe} 
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      '💾 Save Recipe'
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Recipe Name</Label>
                    <Input
                      id="name"
                      value={editedRecipe.name}
                      onChange={(e) => updateEditedRecipe({ name: e.target.value })}
                      placeholder="Enter recipe name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="portions">Portions</Label>
                    <Input
                      id="portions"
                      type="number"
                      value={editedRecipe.portions}
                      onChange={(e) => updateEditedRecipe({ portions: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={editedRecipe.description || ''}
                    onChange={(e) => updateEditedRecipe({ description: e.target.value })}
                    placeholder="Brief description of the recipe"
                    rows={2}
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold">Ingredients</Label>
                    <Button onClick={addIngredient} size="sm" variant="outline">
                      ➕ Add Ingredient
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {editedRecipe.ingredients?.map((ingredient, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                        <div className="col-span-6">
                          <Input
                            value={ingredient.name}
                            onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                            placeholder="Ingredient name"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="Qty"
                            className="text-sm"
                            step="0.1"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            value={ingredient.unit}
                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            placeholder="Unit"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            onClick={() => removeIngredient(index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 w-full p-1"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold">Instructions</Label>
                    <Button onClick={addInstruction} size="sm" variant="outline">
                      ➕ Add Step
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {editedRecipe.instructions?.map((instruction, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium mt-1">
                          {index + 1}
                        </div>
                        <Textarea
                          value={instruction}
                          onChange={(e) => updateInstruction(index, e.target.value)}
                          placeholder={`Step ${index + 1} instructions...`}
                          className="flex-1"
                          rows={2}
                        />
                        <Button
                          onClick={() => removeInstruction(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 mt-1"
                        >
                          🗑️
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={editedRecipe.tags?.join(', ') || ''}
                    onChange={(e) => updateEditedRecipe({ 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    placeholder="vegetarian, quick, easy, etc."
                  />
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="visibility">Visibility</Label>
                    <select
                      id="visibility"
                      value={editedRecipe.visibility}
                      onChange={(e) => updateEditedRecipe({ visibility: e.target.value as 'private' | 'public' })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={editedRecipe.status}
                      onChange={(e) => updateEditedRecipe({ status: e.target.value as any })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="validated">Validated</option>
                      <option value="needs_investigation">Needs Investigation</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {currentStep === 'success' && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Recipe Saved Successfully!</h2>
              <p className="text-gray-600 mb-6">Your recipe has been saved to Firestore.</p>
              <div className="flex justify-center gap-4">
                <Button onClick={resetToStart} variant="outline">
                  Upload Another Recipe
                </Button>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}