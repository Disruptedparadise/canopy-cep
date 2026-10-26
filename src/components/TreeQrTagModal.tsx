import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TreeRecord } from '../types';
import { TreeQrTag } from './TreeQrTag';
import { useToast } from '../context/ToastContext';
import {
  Printer,
  Copy,
  ExternalLink,
  X,
  QrCode,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface TreeQrTagModalProps {
  tree: TreeRecord;
  onClose: () => void;
}

export const TreeQrTagModal: React.FC<TreeQrTagModalProps> = ({ tree, onClose }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/tree/${tree.id}`
      : `https://rootguard.org/tree/${tree.id}`;

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Link Copied', `Public link for ${tree.species} (${tree.id}) copied to clipboard.`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.info('Link Available', publicUrl);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="printable-tag-container bg-[#FBF8EF] dark:bg-[#162214] text-[#23301E] dark:text-[#EDE8DD] border border-[#C9C2A9] dark:border-[#2D452B] w-full max-w-lg rounded-sm shadow-2xl relative overflow-hidden animate-fadeIn my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="no-print bg-[#2C4B27] text-[#FBF8EF] px-5 py-4 flex items-center justify-between border-b border-[#3F6B37]">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#E5BA5A]" />
            <div>
              <h3 className="font-['Fraunces'] font-bold text-lg text-white leading-tight">
                {t('qrTagModal.title', 'Field QR Specimen Tag')}
              </h3>
              <p className="text-[11px] font-mono text-[#C9C2A9]">
                {tree.species} • ID: {tree.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#C9C2A9] hover:text-white hover:bg-[#3F6B37] rounded transition-colors cursor-pointer"
            aria-label={t('qrTagModal.closeAria', 'Close modal')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Instructions banner */}
          <div className="no-print text-xs text-[#4B5842] dark:text-[#A7BF9E] bg-[#F2EEE1] dark:bg-[#121B11] p-3 rounded-xs border border-[#C9C2A9] dark:border-[#2D452B] flex items-start gap-2 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#3F6B37] dark:text-[#E5BA5A] shrink-0 mt-0.5" />
            <span>
              {t(
                'qrTagModal.instruction',
                "This tag provides a physical link to this tree's public growth dossier. Print on cardstock, laminate for weather-proofing, and attach with a wire or zip-tie through the top punch indicator."
              )}
            </span>
          </div>

          {/* Printable Tag Preview */}
          <div className="flex justify-center p-2 bg-[#EFE9D9]/50 dark:bg-[#0E170D] rounded border border-[#C9C2A9]/50 dark:border-[#2D452B]">
            <TreeQrTag tree={tree} publicUrl={publicUrl} />
          </div>

          {/* Public Link Box */}
          <div className="no-print space-y-1.5">
            <label className="text-[11px] font-semibold text-[#4B5842] dark:text-[#A7BF9E] uppercase tracking-wider font-mono">
              {t('qrTagModal.publicUrlLabel', 'Public Read-Only URL (No Login Required):')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-[#1B2719] border border-[#C9C2A9] dark:border-[#2D452B] rounded-xs text-[#23301E] dark:text-[#EDE8DD] select-all outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 text-xs font-medium bg-[#F2EEE1] dark:bg-[#253322] hover:bg-[#E6DFCD] dark:hover:bg-[#2F402C] text-[#23301E] dark:text-[#EDE8DD] border border-[#C9C2A9] dark:border-[#3D4F37] rounded-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                title={t('qrTagModal.copyTitle', 'Copy public link')}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#3F6B37]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('qrTagModal.copied', 'Copied') : t('qrTagModal.copy', 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#C9C2A9]/60 dark:border-[#2D452B]">
            <a
              href={`/tree/${tree.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3F6B37] dark:text-[#E5BA5A] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('qrTagModal.previewDossier', 'Preview Public Tree Dossier')}</span>
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium border border-[#C9C2A9] dark:border-[#2D452B] bg-[#FBF8EF] dark:bg-[#162214] hover:bg-[#F2EEE1] dark:hover:bg-[#1E2E1A] text-[#23301E] dark:text-[#EDE8DD] rounded-xs cursor-pointer transition-colors"
              >
                {t('qrTagModal.close', 'Close')}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-semibold bg-[#2C4B27] hover:bg-[#1E331B] text-[#FBF8EF] rounded-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>{t('qrTagModal.printTag', 'Print This Tag')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
