import React from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { TreeRecord, Species } from '../types';
import { SPECIES_DATA } from '../data/speciesData';
import { Sprout, QrCode, Scissors } from 'lucide-react';

interface TreeQrTagProps {
  tree: TreeRecord;
  speciesMeta?: Species | null;
  publicUrl?: string;
  variant?: 'card' | 'compact' | 'sheet';
}

export const TreeQrTag: React.FC<TreeQrTagProps> = ({
  tree,
  speciesMeta,
  publicUrl,
  variant = 'card',
}) => {
  const { t } = useTranslation();
  const resolvedMeta =
    speciesMeta ||
    SPECIES_DATA.find(
      (s) =>
        s.name.toLowerCase() === tree.species.toLowerCase() ||
        (tree.species_id && s.id === tree.species_id)
    );

  const resolvedUrl =
    publicUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/tree/${tree.id}`
      : `https://rootguard.org/tree/${tree.id}`);

  return (
    <div
      className="printable-tag relative bg-white text-[#152114] border-2 border-dashed border-[#4A5D43] p-4 rounded-md shadow-xs flex flex-col justify-between select-none max-w-sm w-full mx-auto"
      style={{
        width: '3.75in',
        minHeight: '2.5in',
        boxSizing: 'border-box',
      }}
    >
      {/* Grommet punch hole indicator for physical wire / laminate tie */}
      <div
        className="absolute top-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
        title="Punch hole here after laminating to attach weather-proof wire tie"
      >
        <div className="w-3 h-3 rounded-full border border-[#7A8A73] border-dashed flex items-center justify-center bg-[#F4F6F2]">
          <div className="w-1 h-1 rounded-full bg-[#4A5D43]" />
        </div>
      </div>

      {/* Top Brand Bar */}
      <div className="flex items-center justify-between border-b border-[#2C4B27]/25 pb-2 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[#2C4B27] text-white flex items-center justify-center">
            <Sprout className="w-3 h-3" />
          </div>
          <div className="leading-tight">
            <span className="font-['Fraunces'] font-black text-xs tracking-wider text-[#2C4B27] uppercase block">
              {t('nav.brandName', 'RootGuard')}
            </span>
            <span className="text-[8px] font-mono tracking-widest text-[#5C6E56] uppercase block">
              {t('qrTag.forestLedger', 'Forest Ledger')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[9px] font-mono text-[#5C6E56]">
          <Scissors className="w-3 h-3 text-[#7A8A73]" />
          <span>{t('qrTag.cutLine', 'Cut Line')}</span>
        </div>
      </div>

      {/* Center Specimen & QR Layout */}
      <div className="grid grid-cols-[100px_1fr] gap-3.5 py-2.5 items-center">
        {/* Crisp QR Code */}
        <div className="flex flex-col items-center justify-center bg-white p-1 rounded border border-[#2C4B27]/20 shadow-2xs">
          <QRCodeSVG
            value={resolvedUrl}
            size={90}
            level="M"
            includeMargin={false}
            fgColor="#152114"
            bgColor="#ffffff"
          />
          <span className="text-[8px] font-mono text-[#5C6E56] mt-1 text-center font-semibold uppercase tracking-wider">
            {t('qrTag.scanTag', 'Scan Tag')}
          </span>
        </div>

        {/* Tree Details */}
        <div className="space-y-1 text-left min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <h3 className="font-['Fraunces'] font-black text-lg text-[#152114] leading-tight truncate">
              {tree.species}
            </h3>
            {resolvedMeta?.scientific_name && (
              <span className="font-serif italic text-[11px] text-[#4A5D43] truncate">
                ({resolvedMeta.scientific_name})
              </span>
            )}
          </div>

          <div className="inline-block bg-[#2C4B27]/10 text-[#2C4B27] font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs border border-[#2C4B27]/25">
            ID: {tree.id}
          </div>

          <div className="text-[9px] text-[#33422E] space-y-0.5 pt-0.5 font-sans leading-tight">
            <div>
              <span className="text-[#64755F]">{t('qrTag.planter', 'Planter')}:</span>{' '}
              <strong className="font-semibold text-[#152114]">{tree.planter}</strong>
            </div>
            <div>
              <span className="text-[#64755F]">{t('qrTag.planted', 'Planted')}:</span>{' '}
              <strong className="font-semibold text-[#152114]">{tree.date_planted}</strong>
            </div>
            <div>
              <span className="text-[#64755F]">{t('qrTag.site', 'Site')}:</span>{' '}
              <span className="capitalize">{tree.slope}</span> {t('qrTag.slope', 'slope')} •{' '}
              <span className="capitalize">{tree.soil_type}</span> {t('qrTag.soil', 'soil')}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer / CTA */}
      <div className="border-t border-[#2C4B27]/20 pt-2 flex items-center justify-between text-[9px] font-mono text-[#3D4F37]">
        <div className="flex items-center gap-1 font-sans text-[10px] font-medium text-[#2C4B27]">
          <QrCode className="w-3 h-3 shrink-0 text-[#3F6B37]" />
          <span>{t('qrTag.scanToSeeStory', "Scan to see this tree's growth story")}</span>
        </div>
        <span className="text-[8px] text-[#7A8A73] tracking-tighter truncate max-w-[120px]">
          /tree/{tree.id}
        </span>
      </div>
    </div>
  );
};
