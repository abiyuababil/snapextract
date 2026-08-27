import React from 'react';
import { VCardData } from '../../types/extractor';
import { User, Phone, Mail, Building, MapPin, Globe, Download, Copy } from 'lucide-react';
import { exportVCardAsVcf, copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

interface VCardCardProps {
  data: VCardData;
}

export const VCardCard: React.FC<VCardCardProps> = ({ data }) => {
  const { toast } = useToast();

  const handleCopy = async (val: string, label: string) => {
    const ok = await copyToClipboard(val);
    if (ok) toast(`${label} copied`, 'success');
  };

  const handleDownloadVcf = () => {
    exportVCardAsVcf(data.rawPayload, data.fullName);
    toast('Contact .vcf file downloaded', 'success');
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="p-3.5 rounded-lg bg-[#121824] border border-[#1E2638] flex items-center justify-between">
        <div>
          <span className="text-[11px] text-gray-400">Contact Card (vCard)</span>
          <div className="text-base font-bold text-white mt-0.5">
            {data.fullName}
          </div>
          {data.organization && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {data.organization} {data.title && `• ${data.title}`}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleDownloadVcf}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors"
        >
          <Download className="w-3 h-3" />
          <span>Save .VCF</span>
        </button>
      </div>

      {/* Details List */}
      <div className="rounded-lg border border-[#1E2638] bg-[#090D14] divide-y divide-[#1A2234] text-xs">
        {data.phones.map((phone, idx) => (
          <div key={idx} className="p-2.5 flex items-center justify-between">
            <span className="font-mono text-gray-200">{phone}</span>
            <button
              type="button"
              onClick={() => handleCopy(phone, 'Phone Number')}
              className="text-gray-500 hover:text-white p-0.5"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        ))}

        {data.emails.map((email, idx) => (
          <div key={idx} className="p-2.5 flex items-center justify-between">
            <span className="text-gray-200">{email}</span>
            <button
              type="button"
              onClick={() => handleCopy(email, 'Email')}
              className="text-gray-500 hover:text-white p-0.5"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        ))}

        {data.address && (
          <div className="p-2.5 flex items-center justify-between">
            <span className="text-gray-200">{data.address}</span>
            <button
              type="button"
              onClick={() => handleCopy(data.address!, 'Address')}
              className="text-gray-500 hover:text-white p-0.5"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
