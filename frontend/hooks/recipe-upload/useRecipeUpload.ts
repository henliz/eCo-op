// hooks/useRecipeUpload.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRecipeDto, ParseResponse, UploadStep } from '@/types';
import { detectFileType, debugLog } from '@/utils/recipe-upload/fileUtils';

export const useRecipeUpload = () => {
  const { currentUser, makeAPICall } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<UserRecipeDto | null>(null);
  const [editedRecipe, setEditedRecipe] = useState<UserRecipeDto | null>(null);

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

  const resetToStart = () => {
    debugLog('Resetting to start');
    setSelectedFile(null);
    setParsedRecipe(null);
    setEditedRecipe(null);
    setError(null);
    setCurrentStep('upload');
  };

  return {
    // State
    currentStep,
    selectedFile,
    isProcessing,
    isSaving,
    error,
    parsedRecipe,
    editedRecipe,
    setEditedRecipe,
    setCurrentStep,
    setError,
    
    // Actions
    handleFileSelect,
    parseRecipe,
    saveRecipe,
    resetToStart
  };
};