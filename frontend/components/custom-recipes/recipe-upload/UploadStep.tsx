import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UploadStepProps {
  dragOver: boolean;
  onFileSelect: (file: File | null) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onCameraClick: () => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  dragOver,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  onCameraClick
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
  };

  return (
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
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
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

          <div className="text-center">
            <Button 
              onClick={onCameraClick} 
              className="mb-2 bg-blue-600 hover:bg-blue-700"
            >
              📸 Open Camera
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};