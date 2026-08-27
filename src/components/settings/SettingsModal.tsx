import React, { useState } from 'react';
import { AppSettings } from '../../types/extractor';
import { X, ExternalLink } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AppSettings>({ ...settings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    toast('Settings saved', 'success');
    onClose();
  };

  if (!isOpen) return null;

  const hasAiConfigured = Boolean(formData.geminiApiKey || formData.groqApiKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#0E131F] border border-[#1E2638] rounded-xl w-full max-w-md overflow-hidden shadow-xl text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2638] bg-[#090D14]">
          <div>
            <span className="font-semibold text-white text-sm block">Settings & AI Keys</span>
            <span className="text-[11px] text-gray-500">Auto-escalation intelligence</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-4 space-y-4">
          {/* Architecture info */}
          <div className="p-3 rounded-lg bg-[#090D14] border border-[#1E2638] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white">Extraction Strategy</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                hasAiConfigured 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}>
                {hasAiConfigured ? 'Local 95% + AI Escalation' : '100% Offline Local'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              SnapExtract processes ~95% of standard screenshots and QR codes instantly inside your browser (zero cost & private). If text is blurry or structure is ambiguous, it automatically escalates to AI Vision.
            </p>
          </div>

          {/* Gemini Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-300 font-medium">Google Gemini API Key (Free Tier):</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white flex items-center gap-0.5"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={formData.geminiApiKey}
              onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-[#090D14] border border-[#1E2638] rounded text-white font-mono text-xs focus:outline-none focus:border-gray-500"
            />
            <p className="text-[10px] text-gray-500">
              Free tier via Google AI Studio (no credit card needed).
            </p>
          </div>

          {/* Groq Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-300 font-medium">Groq Vision API Key (Optional):</span>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white flex items-center gap-0.5"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="gsk_..."
              value={formData.groqApiKey}
              onChange={(e) => setFormData({ ...formData, groqApiKey: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-[#090D14] border border-[#1E2638] rounded text-white font-mono text-xs focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2638]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded bg-white hover:bg-gray-100 text-black font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

