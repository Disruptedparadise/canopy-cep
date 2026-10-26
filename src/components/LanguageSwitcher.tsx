import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check, Globe, ChevronDown } from 'lucide-react';
import { AppLanguage, SUPPORTED_LANGUAGES, setAppLanguage } from '../i18n';
import { useAuth } from '../context/AuthContext';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full' | 'dropdown';
  className?: string;
  onSelect?: (lang: AppLanguage) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = '',
  onSelect,
}) => {
  const { i18n, t } = useTranslation();
  const { user, updateUser } = useAuth();
  const currentLang = (i18n.language?.substring(0, 2) as AppLanguage) || 'en';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (lang: AppLanguage) => {
    setAppLanguage(lang);
    if (user) {
      updateUser({ language: lang });
    }
    if (onSelect) {
      onSelect(lang);
    }
    setDropdownOpen(false);
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  if (variant === 'dropdown') {
    const activeLanguageObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

    return (
      <div ref={dropdownRef} className={`relative inline-block text-left shrink-0 ${className}`}>
        <button
          type="button"
          id="top-language-dropdown-btn"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-[#223826] text-xs font-semibold text-[#EDF3EC] hover:text-white transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7EBC8A]"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          title={`Current language: ${activeLanguageObj.label}. Click to switch language.`}
        >
          <Globe className="w-3.5 h-3.5 text-[#7EBC8A] shrink-0" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">{currentLang}</span>
          <ChevronDown
            className={`w-3 h-3 text-[#9DB69B] transition-transform duration-200 shrink-0 ${
              dropdownOpen ? 'rotate-180 text-[#7EBC8A]' : ''
            }`}
          />
        </button>

        {dropdownOpen && (
          <div
            id="top-language-menu"
            className="absolute right-0 mt-2 w-48 rounded-xl bg-[#142216] border border-[#223826] shadow-2xl p-1.5 z-50 animate-fadeIn space-y-0.5"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#9DB69B] border-b border-[#223826]/70 mb-1">
              Select Language / भाषा
            </div>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  id={`dropdown-lang-${lang.code}`}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#2D5A34] text-white font-semibold'
                      : 'text-[#CBD8C6] hover:bg-white/5 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <div className="truncate">
                    <span className="font-medium">{lang.nativeLabel}</span>
                    <span className="text-[10px] opacity-75 font-mono ml-1.5">({lang.label})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                id={`lang-select-${lang.code}`}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center justify-between p-3.5 rounded border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#3F6B37] dark:border-[#52A046] bg-[#3F6B37]/10 dark:bg-[#52A046]/15 text-[#23301E] dark:text-[#FBF8EF] shadow-xs'
                    : 'border-[#C9C2A9] dark:border-[#3D4F37] bg-[#FBF8EF] dark:bg-[#1f2c1d] text-[#4B5842] dark:text-[#A7BF9E] hover:border-[#3F6B37]/60'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm leading-snug">
                    {lang.nativeLabel}
                  </div>
                  <div className="text-xs text-[#8A5233] dark:text-[#D6A84E] font-light mt-0.5">
                    {lang.label}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#3F6B37] dark:bg-[#52A046] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Compact variant for Sidebar Footer and Mobile Drawer
  return (
    <div
      id="sidebar-language-switcher"
      className={`flex items-center justify-between p-1.5 rounded bg-[#162714]/80 dark:bg-[#070D06]/85 border border-[#2E4A29] dark:border-[#1E301B] ${className}`}
      aria-label="Language selector"
    >
      <div className="flex items-center gap-1.5 px-1.5 text-xs text-[#A7BF9E] dark:text-[#C9C2A9]">
        <Languages className="w-3.5 h-3.5 text-[#E5BA5A]" />
        <span className="text-[11px] font-medium uppercase font-mono tracking-wider">
          {t('nav.language', 'Language')}
        </span>
      </div>

      <div className="inline-flex rounded bg-[#1C321A] dark:bg-[#121E10] p-0.5 border border-[#2E4A29]/60">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = currentLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              id={`quick-lang-${lang.code}`}
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#3F6B37] text-[#FAF7EE] shadow-xs font-semibold'
                  : 'text-[#C9C2A9] hover:text-[#FAF7EE] hover:bg-[#253D20]'
              }`}
              title={lang.label}
            >
              {lang.nativeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};
