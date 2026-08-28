import React, { useState } from 'react';
import { Dropzone } from './components/input/Dropzone';
import { ImageWorkbench } from './components/editor/ImageWorkbench';
import { ResultPanel } from './components/results/ResultPanel';
import { HistoryDrawer } from './components/history/HistoryDrawer';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastProvider, useToast } from './components/ui/Toast';
import { processImagePipeline, enhanceResultWithAi } from './lib/process-pipeline';
import { loadSettings, saveSettings } from './lib/storage';
import { ExtractionResult, AppSettings } from './types/extractor';
import { OCRProgress } from './lib/local-ocr';
import { History, SlidersHorizontal } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

interface ImageHistoryEntry {
  imageDataUrl: string;
  result: ExtractionResult;
  fileName?: string;
}

export function SnapExtractApp() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | undefined>(undefined);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Multi-step crop history stack
  const [imageHistory, setImageHistory] = useState<ImageHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const handleSettingsSave = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleProcessImage = async (
    dataUrl: string,
    fileName?: string,
    fileSize?: number,
    isCropAction: boolean = false
  ) => {
    setIsProcessing(true);
    setCurrentImage(dataUrl);
    setProgress({ status: 'Processing image...', progress: 0.1 });

    try {
      const res = await processImagePipeline(dataUrl, settings, fileName, fileSize, (p) => {
        setProgress(p);
      });

      setResult(res);

      if (isCropAction) {
        setImageHistory((prev) => {
          const sliced = prev.slice(0, historyIndex + 1);
          return [...sliced, { imageDataUrl: dataUrl, result: res, fileName }];
        });
        setHistoryIndex((prev) => prev + 1);
      } else {
        setImageHistory([{ imageDataUrl: dataUrl, result: res, fileName }]);
        setHistoryIndex(0);
      }

      toast('Extraction complete', 'success');
    } catch (err: any) {
      console.error('Processing error:', err);
      toast(err.message || 'Failed to process image.', 'error');
    } finally {
      setIsProcessing(false);
      setProgress(undefined);
    }
  };

  const handleEnhanceWithAi = async () => {
    if (!result) return;
    if (!settings.geminiApiKey && !settings.groqApiKey) {
      toast('Add a free Gemini API Key in Settings to enable AI Vision', 'info');
      setIsSettingsOpen(true);
      return;
    }

    setIsEnhancing(true);
    setProgress({ status: 'Enhancing with AI Vision...', progress: 0.2 });

    try {
      const enhanced = await enhanceResultWithAi(result, settings, (p) => {
        setProgress(p);
      });
      setResult(enhanced);
      toast('Enhanced with AI Vision', 'success');
    } catch (err: any) {
      console.error('AI Enhancement error:', err);
      toast(err.message || 'AI Enhancement failed', 'error');
    } finally {
      setIsEnhancing(false);
      setProgress(undefined);
    }
  };

  const handleUndoCrop = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const prev = imageHistory[targetIndex];
      setCurrentImage(prev.imageDataUrl);
      setResult(prev.result);
      setHistoryIndex(targetIndex);
      toast('Restored previous crop state', 'info');
    }
  };

  const handleRedoCrop = () => {
    if (historyIndex < imageHistory.length - 1) {
      const targetIndex = historyIndex + 1;
      const next = imageHistory[targetIndex];
      setCurrentImage(next.imageDataUrl);
      setResult(next.result);
      setHistoryIndex(targetIndex);
      toast('Reapplied cropped state', 'info');
    }
  };

  const handleReset = () => {
    setCurrentImage(null);
    setResult(null);
    setImageHistory([]);
    setHistoryIndex(-1);
  };

  return (
    <div className="min-h-screen bg-[#090D14] text-[#E2E8F0] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#1E2638] px-4 sm:px-6 py-3 bg-[#090D14]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo / Title */}
          <div 
            className="flex items-center gap-2 cursor-pointer select-none" 
            onClick={handleReset}
          >
            <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
              SE
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">
              SnapExtract
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-gray-400 hover:text-gray-200 bg-[#121824] hover:bg-[#1A2234] border border-[#1E2638] transition-colors"
              title="Configure AI Keys & Options"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <span>Settings</span>
              {Boolean(settings.geminiApiKey || settings.groqApiKey) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="AI Escalation Ready" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-gray-400 hover:text-gray-200 bg-[#121824] hover:bg-[#1A2234] border border-[#1E2638] transition-colors"
            >
              <History className="w-3.5 h-3.5 text-gray-400" />
              <span>History</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {!result || !currentImage ? (
          /* Empty / Upload State */
          <div className="max-w-2xl mx-auto w-full space-y-4">
            <Dropzone
              onImageSelected={(url, name, size) => handleProcessImage(url, name, size, false)}
              isProcessing={isProcessing}
              progress={progress}
            />
          </div>
        ) : (
          /* Active Split View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Image Viewer */}
            <div className="lg:col-span-5 flex flex-col h-full min-h-[440px]">
              <ImageWorkbench
                imageDataUrl={currentImage}
                onCropExtract={(cropped) => handleProcessImage(cropped, 'Cropped.png', undefined, true)}
                canUndoCrop={historyIndex > 0}
                canRedoCrop={historyIndex < imageHistory.length - 1}
                onUndoCrop={handleUndoCrop}
                onRedoCrop={handleRedoCrop}
              />
            </div>

            {/* Right: Result Panel */}
            <div className="lg:col-span-7 flex flex-col h-full min-h-[440px]">
              <ResultPanel
                result={result}
                onReset={handleReset}
                onEnhanceWithAi={handleEnhanceWithAi}
                isEnhancing={isEnhancing}
              />
            </div>
          </div>
        )}
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectResult={(selected) => {
          setResult(selected);
          const imgUrl = selected.fullImageDataUrl || selected.imageThumbnail;
          setCurrentImage(imgUrl);
          setImageHistory([{ imageDataUrl: imgUrl, result: selected, fileName: selected.fileName }]);
          setHistoryIndex(0);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSettingsSave}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SnapExtractApp />
      <Analytics />
    </ToastProvider>
  );
}

