'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  quality?: number; // JPEG quality 0-1, default 0.9
}

type CameraStep = 'camera' | 'preview';

export default function CameraModal({ 
  isOpen, 
  onClose, 
  onCapture, 
  quality = 0.9 
}: CameraModalProps) {
  // State
  const [currentStep, setCurrentStep] = useState<CameraStep>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Debug logging
  const debugLog = (step: string, data?: any) => {
    console.log(`[CameraModal] ${step}:`, data);
  };

  // Start camera
  const startCamera = async () => {
    debugLog('Starting camera', { facingMode });
    setIsLoading(true);
    setError(null);

    try {
      // Stop any existing stream first
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;

        const playVideo = () => {
          video.play()
            .then(() => {
              debugLog('Video playback started successfully');
              setIsLoading(false);
            })
            .catch((playError) => {
              debugLog('Video play failed', playError);
              setError('Failed to start video playback');
              setIsLoading(false);
            });
        };

        if (video.readyState >= 1) {
          playVideo();
        } else {
          video.addEventListener('loadedmetadata', playVideo, { once: true });
        }
      }
    } catch (err: any) {
      debugLog('Camera error', err);
      setError('Failed to access camera. Please check permissions.');
      setIsLoading(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    debugLog('Stopping camera');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Switch camera
  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    debugLog('Switching camera', { from: facingMode, to: newFacingMode });
    setFacingMode(newFacingMode);
  };

  // Capture photo
  const capturePhoto = useCallback(() => {
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
        const imageUrl = URL.createObjectURL(blob);
        
        setCapturedFile(file);
        setCapturedImage(imageUrl);
        setCurrentStep('preview');
        
        debugLog('Photo captured', { 
          fileSize: file.size, 
          dimensions: `${canvas.width}x${canvas.height}` 
        });
      }
    }, 'image/jpeg', quality);
  }, [quality]);

  // Confirm photo
  const confirmPhoto = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
      handleClose();
    }
  }, [capturedFile, onCapture]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    setCurrentStep('camera');
  }, [capturedImage]);

  // Handle close
  const handleClose = useCallback(() => {
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    setCurrentStep('camera');
    setError(null);
    onClose();
  }, [stopCamera, capturedImage, onClose]);

  // Effect: Start camera when modal opens
  useEffect(() => {
    if (isOpen && currentStep === 'camera') {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStep]);

  // Effect: Restart camera when facing mode changes
  useEffect(() => {
    if (isOpen && currentStep === 'camera') {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Effect: Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Effect: Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera View */}
      {currentStep === 'camera' && (
        <div className="relative w-full h-full flex flex-col">
          {/* Video Container */}
          <div className="flex-1 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-white text-lg">Starting camera...</div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center text-white p-4">
                  <div className="text-lg mb-4">{error}</div>
                  <Button onClick={startCamera} variant="outline">
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
              onError={() => setError('Video display error occurred')}
            />
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls Overlay */}
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
        </div>
      )}

      {/* Preview View */}
      {currentStep === 'preview' && capturedImage && (
        <div className="relative w-full h-full flex flex-col">
          {/* Image Container */}
          <div className="flex-1 relative overflow-hidden bg-black">
            <img
              src={capturedImage}
              alt="Captured photo"
              className="w-full h-full object-contain"
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