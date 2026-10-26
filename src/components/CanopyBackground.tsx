import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const CanopyBackground: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-colors duration-500"
    >
      {/* 1. Base Archival Paper / Charcoal Wash */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark
            ? 'bg-[#0E1210]'
            : 'bg-[#FAF8F4]'
        }`}
      />

      {/* 2. Very subtle naturalist grid rule texture (1px subtle pattern) */}
      <div
        className={`absolute inset-0 opacity-[0.4] transition-opacity duration-500 ${
          isDark
            ? 'bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)]'
            : 'bg-[radial-gradient(rgba(0,0,0,0.045)_1px,transparent_1px)]'
        }`}
        style={{ backgroundSize: '32px 32px' }}
      />

      {/* 3. Extremely delicate, understated natural warmth at top (no neon blur blobs) */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[360px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-700 ${
          isDark
            ? 'bg-emerald-950/20 opacity-40'
            : 'bg-emerald-900/5 opacity-60'
        }`}
      />
    </div>
  );
};
