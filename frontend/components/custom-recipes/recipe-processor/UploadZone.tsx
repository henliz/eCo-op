// C:\Users\satta\eCo-op\frontend\components\custom-recipes\UploadZone.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  // Add other user properties as needed
}

interface UploadZoneProps {
  currentUser: User | null;
  selectedFile: File | null;
  showPdfReview: boolean;
  onFileSelect: (file: File | null) => void;
  onStartNewUpload: () => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  currentUser,
  selectedFile,
  showPdfReview,
  onFileSelect,
  onStartNewUpload
}) => {
  const [dragOver, setDragOver] = useState(false);

  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📤 Upload Recipe</span>
          {showPdfReview && (
            <Button
              onClick={onStartNewUpload}
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
  );
};

export default UploadZone;