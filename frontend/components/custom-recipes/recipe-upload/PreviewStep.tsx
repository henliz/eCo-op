import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PdfViewer from '@/components/PDFviewer';
import { detectFileType, formatFileSize } from '@/utils/recipe-upload/fileUtils';
import Image from 'next/image';

interface PreviewStepProps {
  selectedFile: File;
  isProcessing: boolean;
  onReset: () => void;
  onParse: () => void;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({
  selectedFile,
  isProcessing,
  onReset,
  onParse
}) => {
  // Debug handlers to ensure clicks are registered
  const handleReset = () => {
    console.log('Reset button clicked');
    onReset();
  };

  const handleParse = () => {
    console.log('Parse button clicked');
    onParse();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Preview: {selectedFile.name}</span>
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline">
              🔄 New Upload
            </Button>
            <Button 
              onClick={handleParse} 
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
        <div className="h-96 border rounded overflow-hidden">
          {detectFileType(selectedFile) === 'pdf' ? (
            <PdfViewer
              file={selectedFile}
              filename={selectedFile.name}
              height="100%"
              showCard={false}
            />
          ) : (
            <div className="h-full w-full relative bg-gray-50 flex items-center justify-center">
              <Image
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};