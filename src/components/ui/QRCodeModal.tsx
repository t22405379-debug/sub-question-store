import React, { useState } from 'react';
import { QrCode, Copy, Check, Download, Share2, X } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { showToast } from './Toast';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  url: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  url,
}) => {
  const [copied, setCopied] = useState(false);

  // Encode URL to QR server image URL
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    url
  )}&bgcolor=030712&color=6366f1&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('Link Copied', 'Direct paper link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `Check out ${title} on CSE Question Archive:\n${url}`
    )}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Share via QR Code" maxWidth="sm">
      <div className="text-center space-y-4 py-2">
        {/* Title */}
        <div>
          <h4 className="text-sm font-bold text-white">{title}</h4>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* QR Image Frame */}
        <div className="w-52 h-52 mx-auto rounded-2xl bg-slate-950 p-3 border border-indigo-500/40 shadow-xl shadow-indigo-500/10 flex items-center justify-center relative group">
          <img
            src={qrImageUrl}
            alt="QR Code"
            className="w-full h-full object-contain rounded-xl"
            loading="lazy"
          />
        </div>

        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
          Scan with any mobile phone camera or QR scanner to open this question paper directly.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="primary" size="sm" onClick={handleCopyLink} className="w-full text-xs">
            {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-300" /> : <Copy className="w-4 h-4 mr-1.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Direct Share Link'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleShareWhatsApp}
            className="w-full text-xs hover:border-emerald-500/40 hover:text-emerald-300"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            <span>Share to WhatsApp / Group</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
