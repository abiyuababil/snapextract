import React, { useState } from 'react';
import { WifiData } from '../../types/extractor';
import { Eye, EyeOff, Copy } from 'lucide-react';
import { copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

interface WifiCardProps {
  data: WifiData;
}

export const WifiCard: React.FC<WifiCardProps> = ({ data }) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(true);

  const handleCopy = async (val: string, label: string) => {
    const ok = await copyToClipboard(val);
    if (ok) toast(`${label} copied`, 'success');
  };

  return (
    <div className="space-y-3">
      {/* SSID Header */}
      <div className="p-3.5 rounded-lg bg-[#121824] border border-[#1E2638] flex items-center justify-between">
        <div>
          <span className="text-[11px] text-gray-400">Wi-Fi Network (SSID)</span>
          <div className="text-lg font-bold text-white mt-0.5">
            {data.ssid}
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleCopy(data.ssid, 'SSID')}
          className="p-1.5 rounded bg-[#1A2234] hover:bg-[#242F44] text-gray-300 text-xs transition-colors"
          title="Copy SSID"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Password Row */}
      {data.password ? (
        <div className="p-3.5 rounded-lg bg-[#090D14] border border-[#1E2638] flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Password:</span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-0.5"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="font-mono text-base font-bold text-white mt-1">
              {showPassword ? data.password : '••••••••••••'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(data.password!, 'Password')}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 rounded-lg bg-[#090D14] border border-[#1E2638] text-xs text-gray-400">
          Open Network (No Password)
        </div>
      )}

      {/* Security meta */}
      <div className="rounded-lg border border-[#1E2638] bg-[#090D14] divide-y divide-[#1A2234] text-xs">
        <div className="p-2.5 flex items-center justify-between">
          <span className="text-gray-400">Encryption Type</span>
          <span className="font-mono text-gray-200">{data.encryption || 'WPA/WPA2'}</span>
        </div>
        <div className="p-2.5 flex items-center justify-between">
          <span className="text-gray-400">SSID Visibility</span>
          <span className="text-gray-200">{data.isHidden ? 'Hidden' : 'Visible'}</span>
        </div>
      </div>
    </div>
  );
};

