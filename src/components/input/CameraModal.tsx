import React, { useRef, useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Izin kamera ditolak atau tidak tersedia.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCapture(dataUrl);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#0E131F] border border-[#1E2638] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2638] bg-[#090D14]">
          <span className="font-semibold text-white text-sm">Kamera Scanner</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative bg-black aspect-[4/3] flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-gray-400 text-xs max-w-sm">
              <p>{error}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-t border-[#1E2638]">
          <button
            type="button"
            onClick={toggleFacingMode}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#121824] hover:bg-[#1A2234] text-gray-300 border border-[#1E2638]"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Ganti Kamera</span>
          </button>

          <button
            type="button"
            onClick={handleCapture}
            disabled={!!error}
            className="px-5 py-2 rounded-lg bg-white hover:bg-gray-100 text-black font-semibold transition-colors disabled:opacity-50"
          >
            Ambil Foto
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 text-gray-400 hover:text-white"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

