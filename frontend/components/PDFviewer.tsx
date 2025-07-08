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
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [PdfComponents, setPdfComponents] = useState<any>(null);

  // Initialize client-side
  useEffect(() => {
    setIsClient(true);
    
    const loadPdfComponents = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const pdfModule = await import('react-pdf');
        
        // Set up worker
        pdfModule.pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfModule.pdfjs.version}/pdf.worker.min.js`;
        
        setPdfComponents({
          Document: pdfModule.Document,
          Page: pdfModule.Page
        });
      } catch (error) {
        console.error('Failed to load PDF components:', error);
        setPdfError('Failed to initialize PDF viewer');
      }
    };

    loadPdfComponents();
  }, []);

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  // Load PDF from file or server
  useEffect(() => {
    if (!isClient) return;

    setPdfError(null);
    setPdfUrl(null);
    setNumPages(null);
    setPageNumber(1);

    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfUrl(reader.result as string);
        setLoading(false);
      };
      reader.onerror = () => {
        setPdfError('Failed to read PDF file');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } else if (submissionId && authToken) {
      setLoading(true);
      const url = `${backendUrl}/recipe-processing/submission/${submissionId}/pdf`;
      setPdfUrl(url);
      setLoading(false);
    }
  }, [file, submissionId, authToken, backendUrl, isClient]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(null);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setPdfError('Failed to load PDF document');
    setLoading(false);
  };

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
    } else if (submissionId && authToken) {
      try {
        const response = await fetch(`${backendUrl}/recipe-processing/submission/${submissionId}/pdf`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename || 'document.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Failed to download PDF:', error);
      }
    }
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || prev));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const displayFilename = filename || file?.name || 'Document.pdf';
  const displayFileSize = fileSize || file?.size;

  const PdfContent = () => {
    if (!isClient || !PdfComponents) {
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
            {showDownload && (
              <Button
                onClick={downloadPdf}
                variant="outline"
                className="mt-4"
                disabled={!file && !submissionId}
              >
                📥 Download PDF
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (!pdfUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">📄</div>
            <p>No PDF to display</p>
            {showDownload && (file || submissionId) && (
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

    const { Document, Page } = PdfComponents;

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
            {/* Page Navigation */}
            {numPages && numPages > 1 && (
              <>
                <Button onClick={goToPrevPage} disabled={pageNumber <= 1} size="sm" variant="outline">
                  ←
                </Button>
                <span className="text-xs">
                  {pageNumber} / {numPages}
                </span>
                <Button onClick={goToNextPage} disabled={pageNumber >= numPages} size="sm" variant="outline">
                  →
                </Button>
                <div className="w-px h-4 bg-gray-300 mx-2" />
              </>
            )}
            
            {/* Zoom Controls */}
            <Button onClick={zoomOut} disabled={scale <= 0.5} size="sm" variant="outline">
              -
            </Button>
            <span className="text-xs min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button onClick={zoomIn} disabled={scale >= 3.0} size="sm" variant="outline">
              +
            </Button>
            <Button onClick={resetZoom} size="sm" variant="outline">
              Reset
            </Button>
            
            {/* Download Button */}
            {showDownload && (
              <>
                <div className="w-px h-4 bg-gray-300 mx-2" />
                <Button onClick={downloadPdf} size="sm" variant="outline">
                  📥
                </Button>
              </>
            )}
          </div>
        </div>

        {/* PDF Document */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex justify-center">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="text-center p-8">
                  <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading PDF...</p>
                </div>
              }
              error={
                <div className="text-center p-8">
                  <p className="text-red-600">Failed to load PDF</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
          </div> 
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