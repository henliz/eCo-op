'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  quality?: number;
}

type CameraStep = 'camera' | 'preview';

export default function CameraModal({ 
  isOpen, 
  onClose, 
  onCapture, 
  quality = 0.9 
}: CameraModalProps) {
  const [currentStep, setCurrentStep] = useState<CameraStep>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const debugLog = (step: string, data?: unknown) => {
    console.log(`[CameraModal] ${step}:`, data);
  };

  // Stop camera
  const stopCamera = useCallback(() => {
    debugLog('Stopping camera');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
        debugLog('Stopped track:', track.label);
      });
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraStream]);

  // Start camera
  const startCamera = useCallback(async () => {
    debugLog('Starting camera', { facingMode });
    setIsLoading(true);
    setError(null);

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Stop any existing stream first
      stopCamera();

      // Try with exact facingMode first, then fall back to any camera
      let stream: MediaStream | null = null;
      
      try {
        // First attempt with exact facing mode
        const constraints = {
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        debugLog('Requesting camera with exact constraints', constraints);
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (exactError) {
        debugLog('Exact facing mode failed, trying with ideal', exactError);
        // Fall back to ideal facing mode
        const fallbackConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }

      debugLog('Camera stream obtained', { 
        tracks: stream.getTracks().map(t => ({ 
          kind: t.kind, 
          label: t.label, 
          enabled: t.enabled,
          readyState: t.readyState 
        })) 
      });

      setCameraStream(stream);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video loading timeout'));
          }, 5000);

          video.onloadedmetadata = () => {
            debugLog('Video metadata loaded', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState
            });
            clearTimeout(timeout);
            resolve();
          };

          video.onerror = (e) => {
            clearTimeout(timeout);
            reject(new Error('Video loading error'));
          };
        });

        // Play the video
        await video.play();
        debugLog('Video playing successfully');
        setIsLoading(false);
      }
    } catch (err) {
      debugLog('Camera error', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMessage.includes('Permission denied')) {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
        setError('No camera found. Please connect a camera and try again.');
      } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('TrackStartError')) {
        setError('Camera is already in use by another application.');
      } else {
        setError(`Camera error: ${errorMessage}`);
      }
      setIsLoading(false);
    }
  }, [facingMode, stopCamera]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    debugLog('Switching camera', { from: facingMode, to: newFacingMode });
    setFacingMode(newFacingMode);
    // Start camera with new facing mode
    await startCamera();
  }, [facingMode, startCamera]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    debugLog('Capturing photo');
    if (!videoRef.current || !canvasRef.current) {
      debugLog('Missing video or canvas ref');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      debugLog('No canvas context');
      return;
    }

    // Ensure video has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      debugLog('Video has no dimensions', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
      setError('Video not ready. Please try again.');
      return;
    }

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear any previous transforms
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Handle mirrored front camera - flip the canvas context
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        
        setCapturedFile(file);
        setCapturedImage(imageUrl);
        setCurrentStep('preview');
        stopCamera(); // Stop camera when preview is shown
        
        debugLog('Photo captured', { 
          fileSize: file.size, 
          dimensions: `${canvas.width}x${canvas.height}`,
          facingMode: facingMode
        });
      }
    }, 'image/jpeg', quality);
  }, [quality, facingMode, stopCamera]);

  // Handle close
  const handleClose = useCallback(() => {
    debugLog('Closing modal');
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    setCurrentStep('camera');
    setError(null);
    setIsLoading(false);
    onClose();
  }, [stopCamera, capturedImage, onClose]);

  // Confirm photo
  const confirmPhoto = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
      handleClose();
    }
  }, [capturedFile, onCapture, handleClose]);

  // Retake photo
  const retakePhoto = useCallback(async () => {
    debugLog('Retaking photo');
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    setCurrentStep('camera');
    // Restart camera for retake
    await startCamera();
  }, [capturedImage, startCamera]);

  // Effect: Start camera when modal opens
  useEffect(() => {
    if (isOpen && currentStep === 'camera' && !cameraStream) {
      startCamera();
    }
  }, [isOpen, currentStep, cameraStream, startCamera]);

  // Effect: Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, []);

  // Effect: Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera View */}
      {currentStep === 'camera' && (
        <div className="relative w-full h-full flex flex-col">
          {/* Video Container */}
          <div className="flex-1 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="text-white text-center">
                  <div className="text-lg mb-2">Starting camera...</div>
                  <div className="text-sm text-gray-400">Please allow camera access if prompted</div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="text-center text-white p-4 max-w-sm">
                  <div className="text-lg mb-4">{error}</div>
                  <Button 
                    onClick={startCamera} 
                    variant="outline"
                    className="bg-white/10 text-white border-white/30"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              autoPlay
              playsInline
              muted
            />
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls Overlay */}
          {!isLoading && !error && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-auto">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="sm"
                  className="bg-black/50 text-white border-white/30 hover:bg-black/70"
                >
                  ✕ Close
                </Button>
                
                <Button
                  onClick={switchCamera}
                  variant="outline"
                  size="sm"
                  className="bg-black/50 text-white border-white/30 hover:bg-black/70"
                  disabled={isLoading}
                >
                  🔄 Flip
                </Button>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
                <button
                  onClick={capturePhoto}
                  disabled={isLoading || !!error}
                  className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
                >
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-400"></div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview View */}
      {currentStep === 'preview' && capturedImage && (
        <div className="relative w-full h-full flex flex-col">
          {/* Image Container */}
          <div className="flex-1 relative overflow-hidden bg-black">
            <Image
              src={capturedImage}
              alt="Captured photo"
              className="w-full h-full object-contain"
              fill
              sizes="100vw"
            />
          </div>

          {/* Preview Controls */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8">
            <Button
              onClick={retakePhoto}
              variant="outline"
              size="lg"
              className="bg-black/50 text-white border-white/30 hover:bg-black/70 px-8"
            >
              🔄 Retake
            </Button>
            
            <Button
              onClick={confirmPhoto}
              variant="default"
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              ✓ Use Photo
            </Button>
          </div>

          {/* Close button for preview */}
          <div className="absolute top-4 right-4">
            <Button
              onClick={handleClose}
              variant="outline"
              size="sm"
              className="bg-black/50 text-white border-white/30 hover:bg-black/70"
            >
              ✕ Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}