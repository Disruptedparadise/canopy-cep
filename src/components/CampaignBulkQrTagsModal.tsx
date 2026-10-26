import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Campaign, TreeRecord } from '../types';
import { TreeQrTag } from './TreeQrTag';
import {
  Printer,
  X,
  QrCode,
  Layers,
  Scissors,
  CheckCircle2,
} from 'lucide-react';

interface CampaignBulkQrTagsModalProps {
  campaign: Campaign;
  trees: TreeRecord[];
  onClose: () => void;
}

export const CampaignBulkQrTagsModal: React.FC<CampaignBulkQrTagsModalProps> = ({
  campaign,
  trees,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState<string>('all');

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

  // Unique species in this campaign
  const uniqueSpecies = useMemo(() => {
    const set = new Set<string>();
    trees.forEach((t) => set.add(t.species));
    return Array.from(set).sort();
  }, [trees]);

  const displayedTrees = useMemo(() => {
    if (selectedSpeciesFilter === 'all') return trees;
    return trees.filter((t) => t.species === selectedSpeciesFilter);
  }, [trees, selectedSpeciesFilter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="printable-tag-container bg-[#FBF8EF] dark:bg-[#152114] text-[#23301E] dark:text-[#EDE8DD] border border-[#C9C2A9] dark:border-[#2D452B] w-full max-w-5xl max-h-[92vh] flex flex-col rounded-sm shadow-2xl relative overflow-hidden animate-fadeIn my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Masthead */}
        <div className="no-print bg-[#2C4B27] text-[#FBF8EF] px-6 py-4 flex items-center justify-between border-b border-[#3F6B37] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E5BA5A] text-[#1E2E1A] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-['Fraunces'] font-bold text-lg text-white leading-tight">
                {t('bulkQrModal.title', 'Bulk Print Field Tags — {{name}}', { name: campaign.name })}
              </h2>
              <p className="text-xs font-mono text-[#D7DFD3]">
                {t('bulkQrModal.activeSpecimens', '{{count}} active planting specimens registered to this cohort', { count: trees.length })}
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

        {/* Toolbar Controls */}
        <div className="no-print p-4 bg-[#F2EEE1] dark:bg-[#1A2618] border-b border-[#C9C2A9] dark:border-[#2D452B] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-[#4B5842] dark:text-[#A7BF9E] flex items-center gap-1.5 font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>{t('bulkQrModal.filterSpecies', 'Filter Species:')}</span>
            </label>
            <select
              value={selectedSpeciesFilter}
              onChange={(e) => setSelectedSpeciesFilter(e.target.value)}
              className="text-xs font-mono px-2.5 py-1.5 bg-white dark:bg-[#121B11] border border-[#C9C2A9] dark:border-[#2D452B] rounded-xs text-[#23301E] dark:text-[#EDE8DD] focus:outline-none focus:ring-1 focus:ring-[#3F6B37]"
            >
              <option value="all">{t('bulkQrModal.allSpecies', 'All Species ({{count}})', { count: trees.length })}</option>
              {uniqueSpecies.map((sp) => (
                <option key={sp} value={sp}>
                  {sp} ({trees.filter((t) => t.species === sp).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#4B5842] dark:text-[#A7BF9E]">
            <span className="hidden sm:flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-[#3F6B37] dark:text-[#E5BA5A]" />
              <span>{t('bulkQrModal.cutLinesNotice', 'Cut lines included for easy laminating')}</span>
            </span>

            <button
              type="button"
              onClick={handlePrint}
              disabled={displayedTrees.length === 0}
              className="px-4 py-2 text-xs font-semibold bg-[#2C4B27] hover:bg-[#1E331B] text-[#FBF8EF] rounded-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{t('bulkQrModal.printSheet', 'Print Sheet ({{count}} Tags)', { count: displayedTrees.length })}</span>
            </button>
          </div>
        </div>

        {/* Printable Grid Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#EBE5D5]/30 dark:bg-[#0E170D]">
          {displayedTrees.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#4B5842] dark:text-[#A7BF9E]">
              {t('bulkQrModal.noMatches', 'No trees match the selected species filter in this campaign.')}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="no-print text-xs text-[#4B5842] dark:text-[#A7BF9E] flex items-center justify-between border-b border-[#C9C2A9]/50 dark:border-[#2D452B] pb-2">
                <span>
                  {t('bulkQrModal.showingTags', 'Showing {{count}} tags formatted in 2-column print-friendly sheets', { count: displayedTrees.length })}
                </span>
                <span className="font-mono text-[11px]">
                  {t('bulkQrModal.standardLayout', 'Standard Letter / A4 layout')}
                </span>
              </div>

              {/* Grid of tags */}
              <div
                id="campaign-bulk-tags-grid"
                className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center"
              >
                {displayedTrees.map((tree) => (
                  <div key={tree.id} className="w-full flex justify-center break-inside-avoid">
                    <TreeQrTag tree={tree} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="no-print p-4 bg-[#F2EEE1] dark:bg-[#1A2618] border-t border-[#C9C2A9] dark:border-[#2D452B] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#4B5842] dark:text-[#A7BF9E] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#3F6B37] dark:text-[#52A046]" />
            <span>{t('bulkQrModal.dossiersNotice', 'All QR codes link directly to public, read-only field verification dossiers.')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium border border-[#C9C2A9] dark:border-[#2D452B] bg-[#FBF8EF] dark:bg-[#162214] hover:bg-[#F2EEE1] dark:hover:bg-[#1E2E1A] text-[#23301E] dark:text-[#EDE8DD] rounded-xs cursor-pointer transition-colors"
            >
              {t('bulkQrModal.close', 'Close')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={displayedTrees.length === 0}
              className="px-4 py-1.5 text-xs font-semibold bg-[#2C4B27] hover:bg-[#1E331B] text-[#FBF8EF] rounded-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{t('bulkQrModal.printCountTags', 'Print {{count}} Tags', { count: displayedTrees.length })}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
