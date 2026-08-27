import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, Clipboard } from 'lucide-react';
import { SAMPLE_PRESETS, SamplePreset } from '../../lib/sample-data';
import { CameraModal } from './CameraModal';
import { OCRProgress } from '../../lib/local-ocr';

interface DropzoneProps {
  onImageSelected: (dataUrl: string, fileName?: string, fileSize?: number) => void;
  isProcessing: boolean;
  progress?: OCRProgress;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onImageSelected,
  isProcessing,
  progress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global Clipboard Paste Listener (Ctrl + V from anywhere)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                onImageSelected(dataUrl, 'Clipboard_Screenshot.png', blob.size);
              }
            };
            reader.readAsDataURL(blob);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onImageSelected, isProcessing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onImageSelected(dataUrl, file.name, file.size);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          onImageSelected(dataUrl, file.name, file.size);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetClick = async (preset: SamplePreset) => {
    if (isProcessing) return;
    try {
      const dataUrl = await preset.generateDataUrl();
      onImageSelected(dataUrl, `${preset.name}.png`, 120000);
    } catch (err) {
      console.error('Failed to generate preset:', err);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border border-dashed rounded-xl p-10 transition-colors cursor-pointer text-center select-none ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-950/10'
            : 'border-[#1E2638] hover:border-gray-500 bg-[#0E131F]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {isProcessing ? (
          <div className="py-4 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-gray-300">
              {progress?.status || 'Processing...'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
              <ImageIcon className="w-4 h-4 text-gray-400" />
              <span>Choose an image or drop it here</span>
            </div>

            <p className="text-xs text-gray-500">
              Supports receipts, transfer screenshots, tables, and QR codes
            </p>

            <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-[11px] text-gray-300 border border-[#242F44] transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-gray-400" />
                <span>Camera</span>
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#121824] border border-[#1E2638] text-[11px] text-gray-400">
                <Clipboard className="w-3.5 h-3.5 text-gray-500" />
                <span>Paste directly <kbd className="px-1 py-0.2 rounded bg-[#1E2638] text-[10px] font-mono text-gray-300">Ctrl+V</kbd></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Test Buttons */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[11px] font-mono text-gray-500">
          Sample Presets:
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={isProcessing}
              onClick={() => handlePresetClick(preset)}
              className="px-2.5 py-1 rounded bg-[#121824] hover:bg-[#1A2234] border border-[#1E2638] hover:border-gray-600 text-xs text-gray-300 transition-colors disabled:opacity-50"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => onImageSelected(dataUrl, 'Camera_Capture.jpg')}
      />
    </div>
  );
};

