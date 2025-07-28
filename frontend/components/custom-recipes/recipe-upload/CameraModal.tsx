'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
// import { set } from 'date-fns';

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
  const debugLog = (step: string, data?: unknown) => {
    console.log(`[CameraModal] ${step}:`, data);
  };

  // Start camera
  const startCamera = async () => {
    debugLog('Starting camera', { facingMode, protocol: window.location.protocol });
    setIsLoading(true);
    setError(null);

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Check if we're in a secure context
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || 
                               window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext) {
        throw new Error('Camera requires HTTPS or localhost');
      }

      // Stop any existing stream first
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }

      // Start with simple constraints, then try complex ones
      let constraints: MediaStreamConstraints = { video: true };
      
      try {
        // Try with facingMode if supported
        constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          } as MediaTrackConstraints
        };
      } catch (e) {
        debugLog('Using simple constraints fallback');
      }

      debugLog('Requesting camera with constraints', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      debugLog('Camera stream obtained', { tracks: stream.getTracks().length });
      
      setCameraStream(stream);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;

        // Aggressive video loading approach
        const ensureVideoPlays = () => {
          debugLog('Ensuring video plays', { readyState: video.readyState });
          
          return video.play()
            .then(() => {
              debugLog('Video playback started successfully', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
              });
              setIsLoading(false);
              return true;
            })
            .catch((playError) => {
              debugLog('Video play attempt failed', playError);
              return false;
            });
        };

        // Try multiple approaches simultaneously
        const playPromises = [];

        // Approach 1: Immediate play if ready
        if (video.readyState >= 2) {
          playPromises.push(ensureVideoPlays());
        }

        // Approach 2: Wait for metadata
        const metadataPromise = new Promise<boolean>((resolve) => {
          const handler = () => {
            debugLog('Metadata loaded, attempting play');
            ensureVideoPlays().then(resolve);
          };
          video.addEventListener('loadedmetadata', handler, { once: true });
          
          // Timeout for this approach
          setTimeout(() => resolve(false), 3000);
        });
        playPromises.push(metadataPromise);

        // Approach 3: Force play after delay
        const forcePlayPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            if (isLoading) {
              debugLog('Force playing video after timeout');
              ensureVideoPlays().then(resolve);
            } else {
              resolve(false);
            }
          }, 2000);
        });
        playPromises.push(forcePlayPromise);

        // Use whichever approach succeeds first
        const raceResult = await Promise.race(playPromises);
        
        if (!raceResult) {
          // If all approaches failed, try one more time with basic constraints
          debugLog('All play approaches failed, trying simple stream');
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = simpleStream;
          setCameraStream(simpleStream);
          await ensureVideoPlays();
        }
      }
    } catch (err: unknown) {
      debugLog('Camera error', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown camera error';
      
      // More specific error messages
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (errorMessage.includes('NotFoundError')) {
        setError('No camera found on this device.');
      } else if (errorMessage.includes('NotReadableError')) {
        setError('Camera is already in use by another application.');
      } else if (errorMessage.includes('requires HTTPS')) {
        setError('Camera requires HTTPS or localhost. Please use https:// or run on localhost.');
      } else {
        setError(`Failed to access camera: ${errorMessage}`);
      }
      setIsLoading(false);
    }
  };

  // Stop camera
  const stopCamera = useCallback(()=> {
    debugLog('Stopping camera');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current){
      videoRef.current.srcObject = null;
    }
  }, [cameraStream]);

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

  // Confirm photo
  const confirmPhoto = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
      handleClose();
    }
  }, [capturedFile, onCapture, handleClose]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    setCurrentStep('camera');
  }, [capturedImage]);

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
  }, [stopCamera, capturedImage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera View */}
      {currentStep === 'camera' && (
        <div className="relative w-full h-full flex flex-col">
          {/* Debug Info - Remove after fixing */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-20 left-4 bg-red-500 text-white p-3 text-xs z-20 rounded max-w-sm">
              <div><strong>Debug Info:</strong></div>
              <div>Loading: {isLoading.toString()}</div>
              <div>Error: {error || 'none'}</div>
              <div>Stream: {cameraStream ? 'active' : 'none'}</div>
              <div>Video ready: {videoRef.current?.readyState || 'not ready'}</div>
              <div>Video src: {videoRef.current?.srcObject ? 'set' : 'none'}</div>
              <div>Facing: {facingMode}</div>
              <div>HTTPS: {window.location.protocol}</div>
            </div>
          )}

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
                  {/* Simple constraints fallback button */}
                  <Button 
                    onClick={async () => {
                      try {
                        const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        setCameraStream(simpleStream);
                        if (videoRef.current) {
                          videoRef.current.srcObject = simpleStream;
                          videoRef.current.play();
                          setIsLoading(false);
                          setError(null);
                        }
                      } catch (e) {
                        debugLog('Simple constraints also failed', e);
                      }
                    }}
                    variant="outline" 
                    className="ml-2"
                  >
                    Try Simple Mode
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
              controls={false}
              preload="metadata"
              onError={(e) => {
                debugLog('Video element error', e);
                setError('Video display error occurred');
              }}
              onLoadedMetadata={() => {
                debugLog('Video metadata loaded');
                if (isLoading && videoRef.current) {
                  videoRef.current.play().then(() => {
                    setIsLoading(false);
                  });
                }
              }}
              onCanPlay={() => {
                debugLog('Video can play');
                if (isLoading) setIsLoading(false);
              }}
              onPlaying={() => {
                debugLog('Video is playing');
                setIsLoading(false);
              }}
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