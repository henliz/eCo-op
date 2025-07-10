// C:\Users\satta\eCo-op\frontend\components\PDFviewer.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PdfViewerProps {
  file?: File | null;
  submissionId?: string | null;
  authToken?: string;
  backendUrl?: string;
  filename?: string;
  fileSize?: number;
  title?: string;
  showCard?: boolean;
  className?: string;
  height?: string | number;
  showDownload?: boolean;
  onDownload?: () => void;
  isLoading?: boolean;
  error?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  file,
  submissionId,
  authToken,
  backendUrl = 'http://localhost:3001',
  filename,
  fileSize,
  title = 'PDF Document',
  showCard = true,
  className = '',
  height = '500px',
  showDownload = true,
  onDownload,
  isLoading = false,
  error,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  // Load PDF from file only (stored in memory)
  useEffect(() => {
    if (!isClient) return;

    setPdfError(null);
    setPdfUrl(null);

    if (file) {
      setLoading(true);
      try {
        const objectUrl = URL.createObjectURL(file);
        setPdfUrl(objectUrl);
        setLoading(false);

        // Cleanup function
        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (err) {
        setPdfError('Failed to load PDF file');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [file, isClient]);

  const downloadPdf = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const displayFilename = filename || file?.name || 'Document.pdf';
  const displayFileSize = fileSize || file?.size;

  const PdfContent = () => {
    if (!isClient) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Loading PDF viewer...</p>
          </div>
        </div>
      );
    }

    if (isLoading || loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      );
    }

    if (error || pdfError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4 text-red-500">❌</div>
            <p className="text-red-600 font-medium mb-2">Error Loading PDF</p>
            <p className="text-sm text-red-500 max-w-md">{error || pdfError}</p>
            {showDownload && file && (
              <Button
                onClick={downloadPdf}
                variant="outline"
                className="mt-4"
              >
                📥 Download PDF
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (!pdfUrl || !file) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">📄</div>
            <p>No PDF to display</p>
            <p className="text-sm text-gray-400 mt-2">Upload a PDF file to view it here</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* PDF Controls */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">{displayFilename}</span>
            {displayFileSize && (
              <span className="text-gray-500">({formatFileSize(displayFileSize)})</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Download Button */}
            {showDownload && file && (
              <Button onClick={downloadPdf} size="sm" variant="outline">
                📥 Download
              </Button>
            )}
          </div>
        </div>

        {/* PDF Display */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="PDF Viewer"
            onError={() => {
              setPdfError('Failed to load PDF. Your browser may not support PDF viewing.');
            }}
          />
        </div>
      </>
    );
  };

  if (!showCard) {
    return (
      <div className={`border rounded bg-white flex flex-col ${className}`} style={{ height }}>
        <PdfContent />
      </div>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`} style={{ height }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <PdfContent />
      </CardContent>
    </Card>
  );
};

export default PdfViewer;