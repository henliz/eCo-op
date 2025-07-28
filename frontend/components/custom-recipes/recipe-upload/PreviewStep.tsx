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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Preview: {selectedFile.name}</span>
          <div className="flex gap-2">
            <Button onClick={onReset} variant="outline">
              🔄 New Upload
            </Button>
            <Button 
              onClick={onParse} 
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
              <Image
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
                fill
                sizes="100vw"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};