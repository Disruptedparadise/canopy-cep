import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Zap,
  ZapOff,
  Sparkles,
  RefreshCw,
  Check,
  RotateCcw,
  Upload,
  AlertTriangle,
  Info,
  X,
  Scan,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface BotanicalCameraViewfinderProps {
  onCapture: (file: File, organ: string) => void;
  onClose?: () => void;
  defaultOrgan?: string;
  onFallbackToUpload?: () => void;
  title?: string;
}

export const BotanicalCameraViewfinder: React.FC<BotanicalCameraViewfinderProps> = ({
  onCapture,
  onClose,
  defaultOrgan = 'leaf',
  onFallbackToUpload,
  title,
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<{
    type: 'permission' | 'not_found' | 'in_use' | 'unsupported';
    message: string;
  } | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [torchAvailable, setTorchAvailable] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [organ, setOrgan] = useState<string>(defaultOrgan);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);
  const [tapCoords, setTapCoords] = useState<{ x: number; y: number } | null>(null);

  // Play synthetic tactile shutter sound using Web Audio API
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // AudioContext may be restricted by autoplay policy; silent fallback is safe
    }
  };

  const stopActiveStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
  };

  const initCamera = async (targetFacing: 'environment' | 'user') => {
    stopActiveStream();
    setIsLoading(true);
    setError(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError({
        type: 'unsupported',
        message: 'Camera capture is not supported in this browser or security context (HTTPS required).',
      });
      setIsLoading(false);
      return;
    }

    try {
      // Check available video devices for flip capability
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        // Device enumeration might fail before permission is granted
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.warn('Video playback notice:', err));
      }

      // Check if torch/flashlight is supported on the primary video track
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
        setTorchAvailable(Boolean(capabilities?.torch));
      }
    } catch (err: any) {
      console.error('Camera stream access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError({
          type: 'permission',
          message:
            'Camera permission was denied. Please allow camera access in your browser address bar or system settings to take photos in the field.',
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError({
          type: 'not_found',
          message: 'No camera hardware detected on this device. You can upload an existing photo from your file gallery instead.',
        });
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError({
          type: 'in_use',
          message: 'Camera is currently locked by another application or browser tab. Please close other camera programs and try again.',
        });
      } else {
        setError({
          type: 'unsupported',
          message: err?.message || 'Unable to establish camera connection. Please check your camera permissions.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initCamera(facingMode);
    return () => {
      stopActiveStream();
    };
  }, [facingMode]);

  // Flip camera between environment (rear) and user (front)
  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  // Toggle hardware flashlight/torch
  const handleToggleTorch = async () => {
    if (!stream || !torchAvailable) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Could not toggle camera torch:', e);
    }
  };

  // Handle tap on viewfinder for manual visual focus cue
  const handleViewfinderTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (capturedImage || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTapCoords({ x, y });
    setTimeout(() => {
      setTapCoords(null);
    }, 1200);
  };

  // Capture high-resolution photo snapshot from video element
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    playShutterSound();
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 150);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if using user/selfie facing camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File(
          [blob],
          `field-specimen-${organ}-${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );
        const previewUrl = URL.createObjectURL(blob);
        setCapturedImage(previewUrl);
        setCapturedFile(file);
      },
      'image/jpeg',
      0.92
    );
  };

  // Retake photo: discard snapshot and resume live stream
  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
  };

  // Confirm photo and dispatch to identification analysis
  const handleConfirmAndAnalyze = () => {
    if (!capturedFile) return;
    stopActiveStream();
    onCapture(capturedFile, organ);
  };

  // Botanical organ instructions
  const organTips: Record<string, string> = {
    leaf: 'Frame a single healthy leaf flat against neutral background or tree trunk.',
    flower: 'Center blossoms, petals, and reproductive organs in clear focus.',
    fruit: 'Isolate fruit or seed pods with distinctive coloration or shape.',
    bark: 'Hold camera 20–30 cm from the tree trunk ridges and furrow pattern.',
    auto: 'Ensure the botanical specimen is well-lit and unobstructed.',
  };

  return (
    <div
      id="botanical-camera-viewfinder"
      className="relative w-full rounded-2xl overflow-hidden bg-[#0D150E] text-[#F8F6F1] shadow-2xl border border-[#2D5A34]/50 flex flex-col"
    >
      {/* Top Controls Bar */}
      <div className="relative z-20 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#2D5A34]/40 border border-[#7EBC8A]/40 flex items-center justify-center text-[#7EBC8A]">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-['Fraunces'] text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{title || t('camera.fieldScanner', 'Live Field Camera Scanner')}</span>
              {!capturedImage && !error && !isLoading && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7EBC8A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7EBC8A]"></span>
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#A7BF9E] font-mono">
              {capturedImage
                ? t('camera.reviewSnapshot', 'Review Field Capture')
                : facingMode === 'environment'
                ? t('camera.rearCamera', 'Environment Lens • Botanical Capture')
                : t('camera.frontCamera', 'Front Lens • Self Capture')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Torch toggle */}
          {torchAvailable && !capturedImage && (
            <button
              type="button"
              id="camera-torch-btn"
              onClick={handleToggleTorch}
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                isTorchOn
                  ? 'bg-[#E5A84B] text-black border-[#E5A84B] shadow-md'
                  : 'bg-black/50 text-white/80 border-white/20 hover:bg-black/80'
              }`}
              title={isTorchOn ? t('camera.turnOffTorch', 'Turn off flashlight') : t('camera.turnOnTorch', 'Turn on flashlight')}
            >
              {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          {/* Flip camera */}
          {hasMultipleCameras && !capturedImage && (
            <button
              type="button"
              id="camera-flip-btn"
              onClick={handleToggleFacingMode}
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 transition-colors cursor-pointer"
              title={t('camera.flipLens', 'Switch camera lens')}
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}

          {/* Fallback to file upload button */}
          {onFallbackToUpload && (
            <button
              type="button"
              id="camera-fallback-upload-btn"
              onClick={() => {
                stopActiveStream();
                onFallbackToUpload();
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-colors cursor-pointer"
              title={t('camera.uploadFromFile', 'Switch to file upload')}
            >
              <Upload className="w-3.5 h-3.5 text-[#7EBC8A]" />
              <span>{t('camera.uploadFile', 'Upload File')}</span>
            </button>
          )}

          {/* Close button */}
          {onClose && (
            <button
              type="button"
              id="camera-close-btn"
              onClick={() => {
                stopActiveStream();
                onClose();
              }}
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 transition-colors cursor-pointer"
              title={t('common.close', 'Close camera')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewfinder Screen */}
      <div
        ref={containerRef}
        onClick={handleViewfinderTap}
        className="relative w-full aspect-4/3 sm:aspect-16/10 md:aspect-16/9 bg-black flex items-center justify-center overflow-hidden select-none cursor-crosshair"
      >
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            capturedImage ? 'hidden' : isLoading || error ? 'opacity-0' : 'opacity-100'
          } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Shutter White Flash Animation */}
        {isShutterFlashing && (
          <div className="absolute inset-0 bg-white z-40 pointer-events-none animate-fadeOut duration-150" />
        )}

        {/* Captured Snapshot Review Mode */}
        {capturedImage && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black">
            <img
              src={capturedImage}
              alt="Captured field specimen preview"
              className="w-full h-full object-contain"
            />
            {/* Review mode indicator watermark */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-[#7EBC8A]/40 text-[#7EBC8A] px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 shadow-md">
              <Check className="w-3.5 h-3.5" />
              <span>Photo Locked • Ready for Analysis</span>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0E170D] text-white p-6 space-y-3 z-10">
            <div className="w-12 h-12 rounded-full border-2 border-[#7EBC8A] border-t-transparent animate-spin" />
            <div className="text-center space-y-1">
              <p className="font-['Fraunces'] text-base font-semibold text-[#F8F6F1]">
                {t('camera.connectingStream', 'Accessing Botanical Camera…')}
              </p>
              <p className="text-xs text-[#A7BF9E] max-w-xs font-light">
                {t('camera.permissionNotice', 'Please grant browser permission if prompted to enable field scanning.')}
              </p>
            </div>
          </div>
        )}

        {/* Error States */}
        {error && !isLoading && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141F16] text-white p-6 text-center space-y-4 z-20">
            <div className="w-14 h-14 rounded-full bg-[#A6432D]/20 border border-[#A6432D]/40 text-[#E57A64] flex items-center justify-center shadow-lg">
              <CameraOff className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-2">
              <h4 className="font-['Fraunces'] text-lg font-bold text-white">
                {error.type === 'permission'
                  ? t('camera.permissionRequired', 'Camera Permission Required')
                  : error.type === 'not_found'
                  ? t('camera.noDevice', 'No Camera Detected')
                  : t('camera.accessFailed', 'Camera Unavailable')}
              </h4>
              <p className="text-xs sm:text-sm text-[#D0DDD0] leading-relaxed font-light">
                {error.message}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => initCamera(facingMode)}
                className="px-4 py-2 rounded-full bg-[#2D5A34] hover:bg-[#3D7446] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('camera.retry', 'Retry Camera Access')}</span>
              </button>

              {onFallbackToUpload && (
                <button
                  type="button"
                  onClick={() => {
                    stopActiveStream();
                    onFallbackToUpload();
                  }}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#7EBC8A]" />
                  <span>{t('camera.uploadFromFile', 'Upload From Device Instead')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botanical Framing Reticle & Grid Overlay (Active stream only) */}
        {!isLoading && !error && !capturedImage && (
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 sm:p-8">
            {/* Reticle Corner Brackets */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Corner brackets frame */}
              <div className="relative w-4/5 max-w-sm aspect-square border border-white/10 rounded-2xl">
                {/* Top-Left */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-[#7EBC8A] rounded-tl-lg" />
                {/* Top-Right */}
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-[#7EBC8A] rounded-tr-lg" />
                {/* Bottom-Left */}
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-[#7EBC8A] rounded-bl-lg" />
                {/* Bottom-Right */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-[#7EBC8A] rounded-br-lg" />

                {/* Central Specimen Target Dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full border border-white/40 bg-white/20 animate-pulse" />
                  <div className="w-12 h-0.5 bg-white/20 absolute" />
                  <div className="h-12 w-0.5 bg-white/20 absolute" />
                </div>
              </div>

              {/* Dynamic Tap Focus Ring */}
              {tapCoords && (
                <div
                  style={{ left: `${tapCoords.x}px`, top: `${tapCoords.y}px` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-[#E5A84B] bg-[#E5A84B]/10 animate-ping pointer-events-none"
                />
              )}
            </div>

            {/* Specimen Targeting Instruction */}
            <div className="mx-auto bg-black/60 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full text-[11px] text-white/90 font-mono text-center shadow-lg flex items-center gap-2">
              <Scan className="w-3.5 h-3.5 text-[#7EBC8A]" />
              <span>{organTips[organ] || organTips.leaf}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar: Organ Chips & Shutter Trigger */}
      <div className="relative z-20 bg-gradient-to-t from-black via-black/90 to-[#0D150E]/90 p-4 sm:p-5 border-t border-white/10 space-y-4">
        {/* Specimen Organ Selector Pill Bar */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-[#A7BF9E] mr-1 uppercase tracking-wider font-semibold">
            {t('photoRecognition.specimenOrgan', 'Organ:')}
          </span>
          {['leaf', 'flower', 'fruit', 'bark', 'auto'].map((org) => (
            <button
              key={org}
              type="button"
              onClick={() => setOrgan(org)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                organ === org
                  ? 'bg-[#2D5A34] text-white font-semibold border border-[#7EBC8A] shadow-md'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-transparent'
              }`}
            >
              {t(`photoRecognition.organs.${org}`, org)}
            </button>
          ))}
        </div>

        {/* Capture Action & Confirmation Controls */}
        <div className="flex items-center justify-center gap-4">
          {capturedImage ? (
            /* Review State Buttons */
            <div className="flex items-center gap-3 w-full max-w-sm justify-between">
              <button
                type="button"
                id="camera-retake-btn"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#E5A84B]" />
                <span>{t('camera.retake', 'Retake Photo')}</span>
              </button>

              <button
                type="button"
                id="camera-confirm-analyze-btn"
                onClick={handleConfirmAndAnalyze}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#2D5A34] hover:bg-[#3D7446] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#7EBC8A] shadow-lg transition-all cursor-pointer hover:scale-102"
              >
                <Sparkles className="w-4 h-4 text-[#7EBC8A]" />
                <span>{t('camera.analyze', 'Analyze Plant')}</span>
              </button>
            </div>
          ) : (
            /* Live Shutter Trigger */
            <div className="flex items-center gap-6">
              {/* Secondary Upload from Device shortcut on mobile */}
              {onFallbackToUpload && (
                <button
                  type="button"
                  onClick={() => {
                    stopActiveStream();
                    onFallbackToUpload();
                  }}
                  className="sm:hidden p-3 rounded-full bg-white/10 text-white/80 hover:text-white border border-white/20"
                  title="Upload from device"
                >
                  <Upload className="w-5 h-5" />
                </button>
              )}

              {/* Shutter Circle Button */}
              <button
                type="button"
                id="camera-shutter-btn"
                disabled={isLoading || Boolean(error)}
                onClick={handleCaptureSnapshot}
                className={`group relative w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isLoading || error
                    ? 'opacity-40 cursor-not-allowed bg-white/10'
                    : 'bg-white hover:scale-105 active:scale-95 shadow-[0_0_24px_rgba(126,188,138,0.4)]'
                }`}
                title={t('camera.takePhoto', 'Capture specimen photo')}
              >
                {/* Outer Ring */}
                <div className="absolute inset-1.5 rounded-full border-2 border-[#162716]" />
                {/* Inner Shutter Icon */}
                <Camera className="w-7 h-7 text-[#162716] group-hover:scale-110 transition-transform" />
              </button>

              {/* Switch camera shortcut on mobile */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="sm:hidden p-3 rounded-full bg-white/10 text-white/80 hover:text-white border border-white/20"
                  title="Flip camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
