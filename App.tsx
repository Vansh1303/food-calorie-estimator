
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { CalorieDisplay } from './components/CalorieDisplay';
import { estimateCaloriesFromImage } from './services/geminiService';
import { fileToBase64 } from './utils/imageUtils';
import { FoodIcon } from './components/icons/FoodIcon';
import { CameraIcon as SolidCameraIcon } from './components/icons/CameraIcon';
import { XCircleIcon } from './components/icons/XCircleIcon';
import type { Base64Image } from './types';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<Base64Image | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [calorieResult, setCalorieResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStreamActiveAndReady, setIsStreamActiveAndReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [showNextStepOptions, setShowNextStepOptions] = useState(false);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
      console.warn("API_KEY environment variable is not set. Calorie estimation will not work.");
    }
  }, []);

  const baseClearState = useCallback(() => {
    setPreviewUrl(null);
    setProcessedImage(null);
    setImageFile(null);
    setCalorieResult(null);
    setError(null);
    setIsLoading(false);
  }, []);
  
  const handleResetForNewEstimation = useCallback(() => {
    baseClearState();
    setShowNextStepOptions(false);
    if (isCameraActive) {
        setIsCameraActive(false); // This will trigger useEffect to stop stream & reset isStreamActiveAndReady
    }
    console.log("App: State reset for new estimation.");
  }, [baseClearState, isCameraActive, setIsCameraActive]);


  const stopCameraStream = useCallback(() => {
    if (cameraStreamRef.current) {
      console.log("App: Stopping camera stream.");
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
      if (!videoRef.current.paused) {
        videoRef.current.pause();
      }
      console.log("App: Video source cleared and paused.");
    }
  }, []);

  const startCameraStream = useCallback(async () => {
    console.log("App: Attempting to start camera stream.");
    setIsStreamActiveAndReady(false); 
    if (!videoRef.current) {
      const errMsg = "Camera view is not ready. Please try toggling the camera again.";
      console.error("App: " + errMsg);
      setError(errMsg);
      setIsCameraActive(false); 
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        console.log("App: Requesting user media with constraint { video: true }.");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("App: User media stream obtained.");
        cameraStreamRef.current = stream;
        const videoElement = videoRef.current;
        videoElement.srcObject = stream;
        console.log("App: Stream attached to video element srcObject.");
        
        let playPromise: Promise<void> | undefined;

        videoElement.onloadedmetadata = () => {
          console.log("App: Video metadata loaded.");
          if (videoElement.paused) {
            console.log("App: Video is paused (onloadedmetadata), attempting to play.");
            playPromise = videoElement.play();
            playPromise?.catch(playError => {
              console.error("App: Error attempting to play video stream (onloadedmetadata):", playError);
              setError("Could not play camera stream. Ensure permissions are granted and try again.");
              stopCameraStream(); 
              setIsCameraActive(false);
            });
          }
        };
        
        if (videoElement.paused) {
            console.log("App: Video is paused (direct check), attempting to play.");
            playPromise = videoElement.play();
            await playPromise.catch(playError => {
                 console.warn("App: Direct play attempt failed or was interrupted:", playError);
                 if (playError.name === 'NotAllowedError' || playError.name === 'AbortError') {
                    setError("Camera playback was prevented. Please check browser/OS permissions or try again.");
                    stopCameraStream();
                    setIsCameraActive(false);
                 }
                 throw playError; 
            });
        } else if (videoElement.readyState >= 3) { 
             console.log("App: Video already playing or ready.");
        }

        if(playPromise) await playPromise;

        if (videoElement.paused) {
            console.warn("App: Video is still paused after play attempts.");
        }

        stream.getVideoTracks().forEach(track => {
            track.onended = () => {
                console.warn("App: Video track ended unexpectedly.");
                setError("Camera stream ended. Please try reactivating the camera.");
                stopCameraStream();
                setIsCameraActive(false);
            };
        });
        console.log("App: Camera stream started successfully.");
        setIsStreamActiveAndReady(true); 
        setError(null); // Clear previous errors on successful stream start

      } catch (err: any) {
        console.error("App: Error accessing camera:", err);
        let message = "Could not access camera. Please ensure permissions are granted in your browser AND operating system settings. Also, check that no other app (e.g., Zoom, Skype, Teams) is using the camera. Check console (F12) for more details.";
        if (err.name === "NotAllowedError") {
            message = "Camera access denied by browser or OS. Please grant permission in your browser settings AND check your OS privacy settings for camera access. Then refresh the page. Ensure no other app is using the camera.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            message = "No camera found. Please ensure a camera is connected, enabled, and not being used by another application. If you have multiple cameras, the default one might not be working.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            message = "Camera is already in use by another application or a hardware error occurred. Please close any other app that might be using the camera and try again. Restarting your browser or computer may also help.";
        } else if (err.name === "AbortError") {
            if (!cameraStreamRef.current) { 
                 message = "Camera access was aborted. This can happen if the request took too long or due to a system issue. Please try again.";
            } else {
                console.warn("App: Camera play aborted, likely by subsequent action.");
                return; 
            }
        } else if (err.name === "SecurityError") {
            message = "Camera access denied due to security settings (e.g., page not served over HTTPS, or iframe restrictions). Ensure the page is secure.";
        } else if (err.message && (typeof err.message === 'string' && !err.message.includes("play()"))) { 
            message = `Camera error: ${err.message}. Please check console for details, ensure camera drivers are up to date, and that no other app is using it.`;
        } else if (!cameraStreamRef.current) { 
            message = "Failed to initialize camera. Check permissions and ensure no other app is using it.";
        }
        
        if (!cameraStreamRef.current || (err && typeof err === 'object' && err.name !== 'AbortError' && err.message && !err.message.includes("play()"))) {
            setError(message);
            setIsCameraActive(false); 
            stopCameraStream();
        }
      }
    } else {
      const errMsg = "Camera API (getUserMedia) not available on this browser.";
      console.error("App: " + errMsg);
      setError(errMsg);
      setIsCameraActive(false);
    }
  }, [stopCameraStream, setError, setIsCameraActive, setIsStreamActiveAndReady]);

  useEffect(() => {
    if (isCameraActive) {
      if (!cameraStreamRef.current && videoRef.current) {
        console.log("App: useEffect - isCameraActive is true, starting stream.");
        startCameraStream();
      } else if (!videoRef.current) {
        console.warn("App: useEffect - isCameraActive is true, but videoRef is not yet available.");
      }
    } else {
      if (cameraStreamRef.current) {
        console.log("App: useEffect (isCameraActive:false) - stopping camera stream.");
        stopCameraStream();
      }
      if (isStreamActiveAndReady) {
        setIsStreamActiveAndReady(false);
      }
    }
    
    return () => {
        if (cameraStreamRef.current) { 
            console.log("App: useEffect cleanup (isCameraActive or unmount) - stopping camera stream.");
            stopCameraStream();
        }
        if (isStreamActiveAndReady) { 
            setIsStreamActiveAndReady(false);
        }
    };
  }, [isCameraActive, startCameraStream, stopCameraStream]); 


  const handleImageSelect = useCallback(async (file: File | null) => {
    if (isCameraActive) {
      setIsCameraActive(false); 
    }
    baseClearState(); 
    setShowNextStepOptions(false);
    setImageFile(file); 

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file (e.g., PNG, JPG, WEBP).");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const { base64, mimeType } = await fileToBase64(file);
      setProcessedImage({ base64, mimeType });
    } catch (err) {
      console.error("Image processing error:", err);
      setError("Failed to process image file. Please try another image.");
      setPreviewUrl(null); 
      setProcessedImage(null);
    }
  }, [isCameraActive, setIsCameraActive, baseClearState, setError, setPreviewUrl, setProcessedImage, setImageFile]);

  const handleToggleCamera = useCallback(() => {
    baseClearState(); // Clear data when toggling camera mode
    setShowNextStepOptions(false);

    if (isCameraActive) {
      setIsCameraActive(false); 
    } else {
      setIsStreamActiveAndReady(false); 
      setIsCameraActive(true);  
    }
  }, [isCameraActive, baseClearState, setIsCameraActive, setIsStreamActiveAndReady]);

  const handleCaptureAndProcess = useCallback(async () => {
    if (!videoRef.current || !cameraStreamRef.current || !isStreamActiveAndReady) { 
        setError("Camera not ready or stream inactive for capture.");
        setIsStreamActiveAndReady(false); 
        return;
    }
    
    if (!videoRef.current.videoWidth || !videoRef.current.videoHeight || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        setError("Camera feed not fully loaded or invalid (dimensions are zero). Cannot capture. Please wait or restart camera.");
        setIsStreamActiveAndReady(false); 
        return;
    }
    baseClearState(); // Clear previous data before capturing new
    setShowNextStepOptions(false);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError("Could not process video frame (canvas context).");
      return;
    }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const mimeType = 'image/jpeg'; 
    const dataUrl = canvas.toDataURL(mimeType, 0.9); 
    const base64 = dataUrl.split(',')[1];

    setProcessedImage({ base64, mimeType });
    setPreviewUrl(dataUrl); 
    setImageFile(null); 
    setIsCameraActive(false); 
  }, [setError, baseClearState, setProcessedImage, setPreviewUrl, setImageFile, setIsCameraActive, isStreamActiveAndReady, setIsStreamActiveAndReady]);


  const handleEstimateCalories = async () => {
    if (!processedImage) {
      setError("Please upload or capture an image first.");
      return;
    }
    if (apiKeyMissing) {
      setError("API Key is not configured. Calorie estimation is unavailable.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCalorieResult(null);
    setShowNextStepOptions(false); // Hide next steps while loading

    try {
      const result = await estimateCaloriesFromImage(processedImage.base64, processedImage.mimeType);
      setCalorieResult(result);
      setShowNextStepOptions(true); // Show next steps on success
      setError(null);
    } catch (err: any) {
      console.error("Error estimating calories:", err);
      setError(err.message || "Failed to estimate calories. The AI may be busy or unable to process the image. Please try again later.");
      setShowNextStepOptions(false); // Don't show next steps on error
    } finally {
      setIsLoading(false);
    }
  };

  const clearCapturedImagePreview = () => {
    if (!imageFile) { 
        baseClearState();
        setShowNextStepOptions(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex flex-col items-center justify-center p-4 selection:bg-emerald-700 selection:text-white">
      <div className="bg-white/95 backdrop-blur-lg shadow-2xl rounded-xl p-6 md:p-10 w-full max-w-xl text-slate-800 transform transition-all duration-500 ease-in-out">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <FoodIcon className="h-10 w-10 text-emerald-600" />
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-700">
              CalorieSnap
            </h1>
          </div>
          <p className="text-slate-600 text-sm md:text-base">Upload or capture a food image for an AI-powered calorie estimate.</p>
        </header>

        {apiKeyMissing && (
          <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md text-sm">
            <p><span className="font-bold">Developer Notice:</span> API_KEY is not set. Calorie estimation features will not function.</p>
          </div>
        )}
        
        <CalorieDisplay
            isLoading={isLoading}
            error={error} 
            estimationResult={calorieResult}
        />

        {showNextStepOptions && calorieResult && !isLoading ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-slate-700 font-medium">What would you like to do next?</p>
            <button
              onClick={handleResetForNewEstimation}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
            >
              Estimate Another Food
            </button>
            <button
              onClick={handleResetForNewEstimation} // Same action for "Start Over"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
            >
              Start Over
            </button>
          </div>
        ) : !isLoading && ( // Show uploader/camera if not loading and not showing next steps
          <>
            {isCameraActive ? (
              <div className="mb-6">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-64 bg-slate-800 rounded-lg shadow-lg border-2 border-slate-300 object-cover"
                  aria-label="Live camera feed"
                />
                {error && !isStreamActiveAndReady && !calorieResult && ( 
                    <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
                        <p className="font-bold">Camera Issue</p>
                        <p>{error}</p>
                    </div>
                )}
                <button
                  onClick={handleCaptureAndProcess}
                  disabled={!isStreamActiveAndReady} 
                  className="mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center space-x-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  <SolidCameraIcon className="w-5 h-5" />
                  <span>Capture Food</span>
                </button>
              </div>
            ) : (
              <div className="mb-6">
                <ImageUploader 
                  onImageSelect={handleImageSelect} 
                  previewUrl={imageFile ? previewUrl : null} 
                />
                {previewUrl && !imageFile && !isCameraActive && ( 
                  <div className="mt-4">
                    <p className="text-sm text-slate-600 mb-2 text-center font-medium">Ready to analyze:</p>
                    <div className="relative group">
                      <img 
                        src={previewUrl} 
                        alt="Captured food" 
                        className="w-full h-64 object-cover rounded-lg shadow-lg border-2 border-emerald-400" 
                      />
                      <button
                        onClick={clearCapturedImagePreview}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Clear captured image"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleToggleCamera}
                className={`w-full font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center space-x-2 ${
                  isCameraActive 
                    ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500' 
                    : 'bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-500'
                }`}
              >
                <SolidCameraIcon className="w-5 h-5" />
                <span>{isCameraActive ? 'Close Camera' : 'Use Live Camera'}</span>
              </button>

              {processedImage && !isLoading && ( 
                <button
                  onClick={handleEstimateCalories}
                  disabled={isLoading || apiKeyMissing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
                >
                  {isLoading ? 'Estimating...' : 'Estimate Calories from Displayed Image'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <footer className="text-center mt-8 text-sm text-white/80">
        <p>&copy; {new Date().getFullYear()} CalorieSnap. AI-powered insights.</p>
      </footer>
    </div>
  );
};

export default App;
        