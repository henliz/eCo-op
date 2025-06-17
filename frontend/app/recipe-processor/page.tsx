'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface UploadStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

interface ProcessingResult {
  message?: string;
  error?: string;
  data?: any;
  details?: string;
}

export default function RecipeProcessorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');
  const [store, setStore] = useState('Walmart');
  const [location, setLocation] = useState('100 The Boardwalk');
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

    setSelectedFile(file);
    setStatus({ type: 'idle', message: '' });
    setResult(null);

    // Auto-upload after file selection
    setTimeout(() => {
      uploadFile(file);
    }, 500);
  }, []);

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
    if (!fileToUpload) return;

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
        body: formData
      });

      const resultData = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: `✅ ${resultData.message || 'Upload successful'}`
        });
        setResult(resultData);
      } else {
        setStatus({
          type: 'error',
          message: `❌ ${resultData.message || 'Upload failed'}`
        });
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

  // Test connection
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
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: `❌ Backend not reachable: ${error.message}`
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="container mx-auto max-w-2xl px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
              🍳 Recipe Processor
            </h1>
            <p className="text-lg text-gray-600">
              Upload a PDF recipe to test the backend processing
            </p>
          </div>

          {/* Configuration Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Upload Zone */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6">
            <div
              className={`
                relative border-3 border-dashed rounded-xl p-12 text-center cursor-pointer
                transition-all duration-300 ease-in-out
                ${dragOver 
                  ? 'border-indigo-400 bg-indigo-50 scale-102' 
                  : 'border-indigo-300 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 hover:border-indigo-400 hover:bg-indigo-50/70 hover:scale-101'
                }
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className="text-6xl">📄</div>
                <div>
                  <div className="text-xl font-semibold text-gray-800 mb-2">
                    Drop your recipe PDF here
                  </div>
                  <div className="text-gray-600">
                    or click to browse files
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

          {/* Status Alert */}
          {status.message && (
            <div className="mb-6">
              <Alert 
                className={`
                  ${status.type === 'loading' ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-200' : ''}
                  ${status.type === 'success' ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200' : ''}
                  ${status.type === 'error' ? 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200' : ''}
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
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