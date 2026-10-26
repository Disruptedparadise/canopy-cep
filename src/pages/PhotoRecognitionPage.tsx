import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Upload,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
  Link2,
  Eye,
  Calendar,
  KeyRound,
  ExternalLink,
  ShieldAlert,
  Leaf,
  Info,
  LogIn,
  Clock,
} from 'lucide-react';
import { SPECIES_DATA } from '../data/speciesData';
import { Species } from '../types';
import { useTranslation } from 'react-i18next';
import { getLocalizedSpeciesName } from '../i18n';
import { useTrees } from '../context/TreeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSupabase } from '../services/supabaseClient';
import { Badge, Button } from '../components/ui';
import { BotanicalCameraViewfinder } from '../components/BotanicalCameraViewfinder';

export interface PlantNetMatch {
  score: number;
  percentage: number;
  scientificName: string;
  scientificNameWithAuthor?: string;
  family?: string;
  genus?: string;
  commonNames: string[];
  matchedSpecies?: Species;
}

export interface PlantNetResponse {
  bestMatch: string | null;
  results: PlantNetMatch[];
  query?: {
    organ: string;
    project: string;
  };
}

export interface PhotoRecognitionPageProps {
  hideHeader?: boolean;
  initialMode?: 'camera' | 'upload';
  onModeChange?: (mode: 'camera' | 'upload') => void;
}

export const PhotoRecognitionPage: React.FC<PhotoRecognitionPageProps> = ({
  hideHeader = false,
  initialMode = 'camera',
  onModeChange,
}) => {
  const { t } = useTranslation();
  const { trees, addPhoto } = useTrees();
  const { user } = useAuth();
  const { toast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const [inputMode, setInputMode] = useState<'camera' | 'upload'>(initialMode);

  useEffect(() => {
    if (initialMode && initialMode !== inputMode) {
      setInputMode(initialMode);
    }
  }, [initialMode]);

  const handleModeSwitch = (mode: 'camera' | 'upload') => {
    setInputMode(mode);
    onModeChange?.(mode);
  };

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [organ, setOrgan] = useState<string>('leaf');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<{ message: string; code?: string } | null>(null);
  const [matches, setMatches] = useState<PlantNetMatch[]>([]);
  const [rawResponse, setRawResponse] = useState<PlantNetResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link photo to tree state
  const [selectedTreeId, setSelectedTreeId] = useState<string>('');
  const [linkDate, setLinkDate] = useState<string>(todayStr);
  const [linkSuccess, setLinkSuccess] = useState<{
    treeId: string;
    species: string;
    planter: string;
    date: string;
  } | null>(null);
  const [showAllTrees, setShowAllTrees] = useState<boolean>(false);

  // Helper to correlate Pl@ntNet species with our 20 RootGuard curated species
  const findRootGuardSpecies = (scientificName: string, commonNames: string[] = []): Species | undefined => {
    const sciClean = scientificName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    return SPECIES_DATA.find((sp) => {
      const spSci = sp.scientific_name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const spName = sp.name.toLowerCase();

      // Check scientific name exact or substring
      if (sciClean.includes(spSci) || spSci.includes(sciClean)) return true;

      // Check common names
      for (const cn of commonNames) {
        const cnClean = cn.toLowerCase();
        if (cnClean.includes(spName) || spName.includes(cnClean)) return true;
      }

      // Check genus match
      const firstSci = sciClean.split(' ')[0];
      const firstSpSci = spSci.split(' ')[0];
      if (firstSci && firstSpSci && firstSci.length > 3 && firstSci === firstSpSci) {
        if (commonNames.some((c) => c.toLowerCase().includes(spName))) {
          return true;
        }
      }

      return false;
    });
  };

  const processImage = async (file: File, overrideOrgan?: string) => {
    const activeOrgan = overrideOrgan || organ;
    if (overrideOrgan && overrideOrgan !== organ) {
      setOrgan(overrideOrgan);
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsAnalyzing(true);
    setApiError(null);
    setMatches([]);
    setRawResponse(null);
    setLinkSuccess(null);

    const formData = new FormData();
    formData.append('images', file, file.name || 'plant.jpg');
    formData.append('image', file, file.name || 'plant.jpg');
    formData.append('organ', activeOrgan);
    formData.append('organs', activeOrgan);
    formData.append('project', 'all');

    // Retrieve active Supabase session token or authenticated user token
    let token = '';
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }
      } catch (e) {
        console.warn('Could not read Supabase session token:', e);
      }
    }

    if (!token && user?.id) {
      token = `session-${user.id}-${Date.now()}`;
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('/api/identify-plant', {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'Flora server responded with non-JSON format');
      }

      if (!response.ok) {
        setApiError({
          message: data.message || data.error || 'Failed to communicate with the Pl@ntNet identification API.',
          code: data.code || (response.status === 401 ? 'AUTH_REQUIRED' : response.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'API_ERROR'),
        });
        setIsAnalyzing(false);
        return;
      }

      if (!data.results || data.results.length === 0) {
        setApiError({
          message: 'No botanical species matches found in the Pl@ntNet global flora database for this image.',
          code: 'NO_MATCHES',
        });
        setIsAnalyzing(false);
        return;
      }

      // Map top 3 matches and cross-reference with RootGuard recommended species
      const top3: PlantNetMatch[] = (data.results || []).slice(0, 3).map((item: any) => {
        const matchedSpecies = findRootGuardSpecies(item.scientificName, item.commonNames || []);
        return {
          ...item,
          matchedSpecies,
        };
      });

      setMatches(top3);
      setRawResponse(data);
    } catch (err: any) {
      console.error('Pl@ntNet identification error:', err);
      setApiError({
        message:
          err?.message || 'Network error occurred while calling the Pl@ntNet plant identification service.',
        code: 'NETWORK_ERROR',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsAnalyzing(false);
    setMatches([]);
    setRawResponse(null);
    setApiError(null);
    setSelectedTreeId('');
    setLinkSuccess(null);
    setShowAllTrees(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // The top match is the primary result
  const topMatch = matches[0] || null;
  const isLowConfidence = topMatch ? topMatch.percentage < 40 : false;

  // Filter existing trees in ledger that match the top identified species or RootGuard recommended species
  const matchingTrees = useMemo(() => {
    if (!topMatch) return [];
    if (showAllTrees) return trees;

    const targetSpeciesName =
      topMatch.matchedSpecies?.name.toLowerCase() ||
      topMatch.commonNames[0]?.toLowerCase() ||
      topMatch.scientificName.toLowerCase();

    return trees.filter((t) => {
      const tName = t.species.toLowerCase();
      return (
        tName === targetSpeciesName ||
        tName.includes(targetSpeciesName) ||
        targetSpeciesName.includes(tName)
      );
    });
  }, [trees, topMatch, showAllTrees]);

  // Pre-select if there is only 1 matching tree
  useEffect(() => {
    if (matchingTrees.length === 1 && !selectedTreeId) {
      setSelectedTreeId(matchingTrees[0].id);
    }
  }, [matchingTrees, selectedTreeId]);

  // Link recognized photo to the selected tree's growth timeline
  const handleLinkPhotoToTree = async () => {
    if (!selectedTreeId || !previewUrl) return;

    const targetTree = trees.find((t) => t.id === selectedTreeId);
    if (!targetTree) return;

    try {
      await addPhoto(selectedTreeId, {
        url: previewUrl,
        date: linkDate || todayStr,
      });

      toast.success(
        'Photo Linked to Specimen',
        `Attached field identification photo to ${targetTree.species} (${targetTree.id}).`
      );

      setLinkSuccess({
        treeId: targetTree.id,
        species: targetTree.species,
        planter: targetTree.planter,
        date: linkDate || todayStr,
      });
    } catch (err: any) {
      toast.error('Linking Failed', err?.message || 'Could not link photo to tree record.');
    }
  };

  // Test specimen helpers
  const testWithSample = async (name: string, imageUrl: string) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
      processImage(file);
    } catch {
      // Fallback
      toast.error('Sample Load Error', 'Could not load remote specimen photo.');
    }
  };

  return (
    <div
      className={`space-y-10 animate-fadeIn ${
        !hideHeader ? 'w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8 pb-16' : ''
      }`}
    >
      {/* Editorial Masthead */}
      {!hideHeader && (
        <header className="border-b border-[#C9C2A9] dark:border-[#3D4F37] pb-8">
          <div className="flex items-center gap-2 text-[#AD6B44] dark:text-[#C47F53] text-xs font-semibold tracking-wider uppercase font-mono mb-2">
            <Camera className="w-4 h-4 text-[#3F6B37]" />
            <span>{t('photoRecognition.badge', 'Real-time Flora Identification • Pl@ntNet Vision API')}</span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-4xl sm:text-5xl font-['Fraunces'] font-bold text-[#23301E] dark:text-[#EDE8DD] tracking-tight leading-[1.08]">
              {t('photoRecognition.heading', 'Photo Recognition')}
            </h1>
            <span className="text-xs font-mono text-[#3F6B37] dark:text-[#E5BA5A] bg-[#3F6B37]/10 dark:bg-[#20371C]/50 border border-[#3F6B37]/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#3F6B37] animate-pulse" />
              <span>{t('photoRecognition.poweredBy', 'Powered by Pl@ntNet API')}</span>
            </span>
          </div>
          <p className="mt-3 text-base sm:text-lg text-[#4B5842] dark:text-[#A7BF9E] leading-relaxed max-w-3xl font-light">
            {t('photoRecognition.subheading', 'Upload a high-resolution field photograph of leaves, bark, or flowers. RootGuard sends the specimen directly to the Pl@ntNet taxonomic identification API, calculates diagnostic confidence scores, and cross-references results with our 20 curated soil-protection species.')}
          </p>
        </header>
      )}

      {/* Main Upload / Camera Area (when not viewing a completed result) */}
      {matches.length === 0 && !isAnalyzing && !apiError && (
        <div className="space-y-6">
          {/* Mode Selector Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F2EEE1] dark:bg-[#0E170D] p-3 rounded-lg border border-[#C9C2A9] dark:border-[#2D452B]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#23301E] dark:text-[#EDE8DD] font-mono">
                {t('photoRecognition.captureMethod', 'Input Mode:')}
              </span>
              <div className="inline-flex rounded-full border border-[#C9C2A9] dark:border-[#2D452B] bg-[#FBF8EF] dark:bg-[#152114] p-0.5 shadow-2xs">
                <button
                  type="button"
                  id="mode-camera-btn"
                  onClick={() => handleModeSwitch('camera')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'camera'
                      ? 'bg-[#3F6B37] text-white shadow-2xs font-semibold'
                      : 'text-[#4B5842] dark:text-[#A7BF9E] hover:text-[#23301E] dark:hover:text-[#EDE8DD]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{t('photoRecognition.liveCamera', 'Live Field Camera')}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7EBC8A] animate-pulse ml-0.5" />
                </button>
                <button
                  type="button"
                  id="mode-upload-btn"
                  onClick={() => handleModeSwitch('upload')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'upload'
                      ? 'bg-[#3F6B37] text-white shadow-2xs font-semibold'
                      : 'text-[#4B5842] dark:text-[#A7BF9E] hover:text-[#23301E] dark:hover:text-[#EDE8DD]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t('photoRecognition.fileUpload', 'Upload Photo')}</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-[#4B5842] dark:text-[#A7BF9E] font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C79A3F]" />
              <span>{t('photoRecognition.poweredByPlantNet', 'Taxonomic AI Model • Pl@ntNet')}</span>
            </div>
          </div>

          {/* Conditional Input Interface: Live Camera Viewfinder vs. File Upload */}
          {inputMode === 'camera' ? (
            <div className="space-y-4">
              <BotanicalCameraViewfinder
                defaultOrgan={organ}
                onCapture={(file, capturedOrgan) => {
                  processImage(file, capturedOrgan);
                }}
                onFallbackToUpload={() => handleModeSwitch('upload')}
              />

              {/* Field Guidance Callout */}
              <div className="bg-[#FBF8EF] dark:bg-[#152114] border border-[#C9C2A9] dark:border-[#2D452B] p-4 rounded-lg flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-[#3F6B37]/15 text-[#3F6B37] flex items-center justify-center shrink-0">
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-[#23301E] dark:text-[#EDE8DD]">
                    {t('photoRecognition.fieldTipTitle', 'Botanical Field Guidance')}
                  </div>
                  <p className="text-[#4B5842] dark:text-[#A7BF9E] leading-relaxed">
                    {t(
                      'photoRecognition.fieldTipDesc',
                      'Hold your lens 15–30 cm from the specimen. Frame leaf venation, blossom petals, or bark texture within the reticle. Press the shutter to capture a native high-resolution frame for instant botanical diagnosis.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Organ Selection Selector */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-[#23301E] dark:text-[#EDE8DD] uppercase tracking-wider font-mono">
                  {t('photoRecognition.specimenOrgan', 'Specimen Organ:')}
                </span>
                {['leaf', 'flower', 'fruit', 'bark', 'auto'].map((org) => (
                  <button
                    key={org}
                    type="button"
                    onClick={() => setOrgan(org)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize border transition-colors cursor-pointer ${
                      organ === org
                        ? 'bg-[#3F6B37] text-white border-[#2C4B27]'
                        : 'bg-[#F2EEE1] dark:bg-[#0E170D] text-[#4B5842] dark:text-[#A7BF9E] border-[#C9C2A9] dark:border-[#2D452B] hover:bg-[#EAE5D6]'
                    }`}
                  >
                    {t(`photoRecognition.organs.${org}`, org)}
                  </button>
                ))}
              </div>

              {/* File Upload Dropzone */}
              <div
                id="photo-upload-dropzone"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-sm overflow-hidden text-center cursor-pointer transition-all duration-300 shadow-[0_4px_24px_-4px_rgba(35,48,30,0.1)] border ${
                  dragActive
                    ? 'border-[#3F6B37] scale-[1.01] shadow-[0_12px_32px_rgba(63,107,55,0.2)]'
                    : 'border-[#C9C2A9] dark:border-[#2D452B] hover:border-[#3F6B37] hover:shadow-lg'
                }`}
              >
                {/* Subtle Macro Botanical Photo Background with Gradient Overlay */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-[#162214]">
                  <img
                    src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1600&q=80"
                    alt={t('images.macroBotanicalAlt', 'Close-up macro leaf venation and cellular bark structure')}
                    title={t('images.macroBotanicalAlt', 'Close-up macro leaf venation and cellular bark structure')}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-25 dark:opacity-20 transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Dark gradient overlay fading toward page and card background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#FBF8EF]/85 via-[#FBF8EF]/92 to-[#FBF8EF]/98 dark:from-[#152114]/85 dark:via-[#152114]/92 dark:to-[#152114]/98" />
                  <div className="absolute inset-0 bg-radial-at-center from-transparent via-transparent to-black/10 dark:to-black/30" />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  id="tree-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="relative z-10 p-8 sm:p-12 max-w-lg mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#3F6B37]/15 dark:bg-[#3F6B37]/30 border border-[#3F6B37]/40 flex items-center justify-center mx-auto text-[#3F6B37] dark:text-[#A7BF9E] shadow-sm">
                    <Upload className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="font-['Fraunces'] text-2xl font-bold text-[#23301E] dark:text-[#EDE8DD]">
                      {t('photoRecognition.dropzoneTitle', 'Drop a specimen photo here')}
                    </h3>
                    <p className="text-sm text-[#4B5842] dark:text-[#A7BF9E] mt-1.5 font-light">
                      {t('photoRecognition.dropzoneSubtitle', 'or click to select from your device (JPG, PNG, WebP)')}
                    </p>
                  </div>

                  {/* Field Camera Quick Launcher Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      id="dropzone-camera-launch-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModeSwitch('camera');
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3F6B37] hover:bg-[#2C4B27] text-white text-xs font-semibold shadow-md transition-all cursor-pointer hover:scale-102"
                    >
                      <Camera className="w-4 h-4 text-[#E5BA5A]" />
                      <span>{t('photoRecognition.openCameraBtn', 'Or Snap Live Photo with Camera')}</span>
                    </button>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#F2EEE1] dark:bg-[#0E170D] border border-[#C9C2A9] dark:border-[#2D452B] text-xs text-[#4B5842] dark:text-[#A7BF9E] rounded font-mono shadow-2xs">
                    <span>{t('photoRecognition.dropzoneNotice', 'Sends directly to Pl@ntNet identification API')}</span>
                  </div>
                </div>
              </div>

              {/* Preset Sample Specimen Buttons */}
              <div className="bg-[#FBF8EF] dark:bg-[#152114] border border-[#C9C2A9] dark:border-[#2D452B] p-5 rounded shadow-xs">
                <span className="text-xs font-semibold tracking-wider text-[#23301E] dark:text-[#EDE8DD] uppercase block mb-3 font-mono">
                  {t('photoRecognition.sampleSpecimensTitle', 'Or test with sample field specimens:')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <button
                    type="button"
                    id="sample-neem-btn"
                    onClick={() =>
                      testWithSample(
                        'neem_leaf_specimen.jpg',
                        'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'
                      )
                    }
                    className="group p-2.5 bg-[#F2EEE1] dark:bg-[#0E170D] border border-[#C9C2A9] dark:border-[#2D452B] hover:border-[#3F6B37] hover:bg-[#EBE5D6] text-left transition-all flex items-center gap-3 cursor-pointer rounded"
                  >
                    <div className="w-12 h-12 rounded overflow-hidden shrink-0 border border-[#C9C2A9]">
                      <img
                        src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=200&q=80"
                        alt={t('images.sampleNeemAlt', 'Neem tree green foliage and compound leaf structure')}
                        title={t('images.sampleNeemAlt', 'Neem tree green foliage and compound leaf structure')}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-[#23301E] dark:text-[#EDE8DD]">
                        {t('photoRecognition.sampleNeem', 'Neem Leaves')}
                      </div>
                      <div className="text-[11px] text-[#4B5842] dark:text-[#A7BF9E]">Azadirachta indica</div>
                      <span className="text-[10px] text-[#3F6B37] dark:text-[#E5BA5A] font-mono">
                        {t('photoRecognition.identifyViaPlantNet', 'Identify via Pl@ntNet →')}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="sample-oak-btn"
                    onClick={() =>
                      testWithSample(
                        'oak_leaf_specimen.jpg',
                        'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80'
                      )
                    }
                    className="group p-2.5 bg-[#F2EEE1] dark:bg-[#0E170D] border border-[#C9C2A9] dark:border-[#2D452B] hover:border-[#3F6B37] hover:bg-[#EBE5D6] text-left transition-all flex items-center gap-3 cursor-pointer rounded"
                  >
                    <div className="w-12 h-12 rounded overflow-hidden shrink-0 border border-[#C9C2A9]">
                      <img
                        src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=200&q=80"
                        alt={t('images.sampleOakAlt', 'Oak lobed leaf specimen with prominent venation')}
                        title={t('images.sampleOakAlt', 'Oak lobed leaf specimen with prominent venation')}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-[#23301E] dark:text-[#EDE8DD]">
                        {t('photoRecognition.sampleOak', 'Oak Leaf')}
                      </div>
                      <div className="text-[11px] text-[#4B5842] dark:text-[#A7BF9E]">Quercus robur</div>
                      <span className="text-[10px] text-[#3F6B37] dark:text-[#E5BA5A] font-mono">
                        {t('photoRecognition.identifyViaPlantNet', 'Identify via Pl@ntNet →')}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="sample-bark-btn"
                    onClick={() =>
                      testWithSample(
                        'bark_specimen.jpg',
                        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80'
                      )
                    }
                    className="group p-2.5 bg-[#F2EEE1] dark:bg-[#0E170D] border border-[#C9C2A9] dark:border-[#2D452B] hover:border-[#3F6B37] hover:bg-[#EBE5D6] text-left transition-all flex items-center gap-3 cursor-pointer rounded"
                  >
                    <div className="w-12 h-12 rounded overflow-hidden shrink-0 border border-[#C9C2A9]">
                      <img
                        src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=200&q=80"
                        alt={t('images.sampleBarkAlt', 'Furrowed mature tree bark with natural protective crevices')}
                        title={t('images.sampleBarkAlt', 'Furrowed mature tree bark with natural protective crevices')}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-[#23301E] dark:text-[#EDE8DD]">
                        {t('photoRecognition.sampleBark', 'Tree Bark')}
                      </div>
                      <div className="text-[11px] text-[#4B5842] dark:text-[#A7BF9E]">Furrowed Trunk</div>
                      <span className="text-[10px] text-[#3F6B37] dark:text-[#E5BA5A] font-mono">
                        {t('photoRecognition.identifyViaPlantNet', 'Identify via Pl@ntNet →')}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Spinner State: Real Pl@ntNet API call in progress */}
      {isAnalyzing && (
        <div
          id="analyzing-spinner-state"
          className="bg-[#FBF8EF] dark:bg-[#152114] border border-[#C9C2A9] dark:border-[#2D452B] p-12 text-center rounded space-y-4 shadow-xs"
        >
          {previewUrl && (
            <div className="w-32 h-32 mx-auto rounded overflow-hidden border border-[#C9C2A9] mb-4 bg-[#E6DFCD]">
              <img
                src={previewUrl}
                alt={t('images.uploadedSpecimenAlt', 'Uploaded field specimen photograph for botanical analysis')}
                title={t('images.uploadedSpecimenAlt', 'Uploaded field specimen photograph for botanical analysis')}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center justify-center gap-3 text-[#3F6B37] dark:text-[#E5BA5A]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-['Fraunces'] text-xl font-bold text-[#2C4B27] dark:text-[#EDE8DD]">
              {t('photoRecognition.consultingNetwork', 'Consulting Pl@ntNet botanical neural network…')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5842] dark:text-[#A7BF9E] max-w-sm mx-auto font-light">
            {t('photoRecognition.transmittingImage', 'Transmitting specimen image to Pl@ntNet API and calculating taxonomic species confidence scores.')}
          </p>
        </div>
      )}

      {/* Error State: Missing Key, Invalid Key, or API Failure */}
      {apiError && (
        <div
          id="plantnet-api-error-card"
          className="bg-[#FBF8EF] dark:bg-[#152114] border border-[#A6432D] p-6 sm:p-8 rounded shadow-xs space-y-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#A6432D]" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#A6432D]/10 text-[#A6432D] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#A6432D]">
                {t('photoRecognition.apiNotice', 'Pl@ntNet API Notice')}
              </div>
              <h3 className="font-['Fraunces'] text-2xl font-bold text-[#23301E] dark:text-[#EDE8DD]">
                {apiError.code === 'MISSING_API_KEY'
                  ? t('photoRecognition.errorKeyRequired', 'Pl@ntNet API Key Required')
                  : apiError.code === 'AUTH_REQUIRED'
                  ? 'Pl@ntNet API Key Required'
                  : apiError.code === 'RATE_LIMIT_EXCEEDED'
                  ? t('photoRecognition.errorRateLimit', 'API Rate Limit Reached')
                  : t('photoRecognition.errorGeneric', 'Botanical Identification Error')}
              </h3>
              <p className="text-sm text-[#4B5842] dark:text-[#A7BF9E] leading-relaxed">
                {apiError.message}
              </p>
            </div>
          </div>

          {apiError.code === 'AUTH_REQUIRED' && (
            <div className="p-4 rounded bg-[#F2EEE1] dark:bg-[#0E170D] border border-[#C9C2A9] dark:border-[#2D452B] text-xs text-[#23301E] dark:text-[#EDE8DD] space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-[#3F6B37] dark:text-[#E5BA5A]">
                <KeyRound className="w-4 h-4" />
                <span>Pl@ntNet API Key Required</span>
              </div>
              <p className="text-[#4B5842] dark:text-[#A7BF9E]">
                Photo identification uses the Pl@ntNet botanical API. To enable it, get a free key at{' '}
                <a href="https://my.plantnet.org/" target="_blank" rel="noopener noreferrer" className="text-[#3F6B37] dark:text-[#E5BA5A] underline">
                  my.plantnet.org
                </a>{' '}
                and add <code className="font-mono bg-white dark:bg-black px-1 py-0.5 rounded">PLANTNET_API_KEY=your_key</code> to your <code className="font-mono bg-white dark:bg-black px-1 py-0.5 rounded">.env</code> file.
              </p>
            </div>
          )}

          {apiError.code === 'RATE_LIMIT_EXCEEDED' && (
            <div className="p-4 rounded bg-[#F2EEE1] dark:bg-[#0E170D] border border-[#C9C2A9] dark:border-[#2D452B] text-xs text-[#23301E] dark:text-[#EDE8DD] space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-[#C79A3F] dark:text-[#E5BA5A]">
                <Clock className="w-4 h-4" />
                <span>{t('photoRecognition.rateLimitActive', 'Rate Limit Active (Max 8 Scans / Minute)')}</span>
              </div>
              <p className="text-[#4B5842] dark:text-[#A7BF9E]">
                {t('photoRecognition.rateLimitDesc', 'Please pause briefly before analyzing additional specimens. Rate limits reset automatically every 60 seconds.')}
              </p>
            </div>
          )}

          {apiError.code === 'MISSING_API_KEY' && (
            <div className="p-4 rounded bg-[#F2EEE1] dark:bg-[#0E170D] border border-[#C9C2A9] dark:border-[#2D452B] text-xs text-[#23301E] dark:text-[#EDE8DD] space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-[#3F6B37] dark:text-[#E5BA5A]">
                <KeyRound className="w-4 h-4" />
                <span>{t('photoRecognition.howToConfigureKey', 'How to configure your Pl@ntNet API Key:')}</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[#4B5842] dark:text-[#A7BF9E]">
                <li>
                  {t('photoRecognition.signUpKey', 'Sign up for a free developer key at')}{' '}
                  <a
                    href="https://my.plantnet.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3F6B37] dark:text-[#E5BA5A] underline inline-flex items-center gap-0.5"
                  >
                    my.plantnet.org <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  Set <code className="font-mono bg-white dark:bg-black px-1.5 py-0.5 rounded">PLANTNET_API_KEY=your_key_here</code> {t('photoRecognition.inEnv', 'in your project environment secrets.')}
                </li>
                <li>{t('photoRecognition.autoForwardNotice', 'The server will automatically forward uploads to Pl@ntNet\'s live botanical database.')}</li>
              </ol>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => {
                handleReset();
                handleModeSwitch('camera');
              }}
              leftIcon={<Camera className="w-4 h-4" />}
            >
              {t('photoRecognition.retryWithCamera', 'Capture with Camera')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleReset();
                handleModeSwitch('upload');
              }}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              {t('photoRecognition.tryAnother', 'Upload File Instead')}
            </Button>
            <Link
              to="/identify?tab=conditions"
              className="text-xs font-semibold text-[#3F6B37] dark:text-[#E5BA5A] hover:underline"
            >
              {t('photoRecognition.browseGuideManually', 'Browse Species Guide Manually →')}
            </Link>
          </div>
        </div>
      )}

      {/* Successful Identification: Top 3 Matches */}
      {matches.length > 0 && !isAnalyzing && (
        <div className="space-y-6">
          {/* Low Confidence Warning (<40%) */}
          {isLowConfidence && (
            <div
              id="low-confidence-warning"
              className="p-4 rounded bg-[#C79A3F]/15 dark:bg-[#C79A3F]/20 border border-[#C79A3F] flex items-start gap-3 text-[#23301E] dark:text-[#EDE8DD] animate-fadeIn"
            >
              <AlertTriangle className="w-5 h-5 text-[#C79A3F] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-[#8A5233] dark:text-[#E5BA5A]">
                  {t('photoRecognition.lowConfidenceTitle', 'Low confidence match ({{percent}}%)', {
                    percent: topMatch?.percentage,
                  })}
                </div>
                <p className="text-xs text-[#4B5842] dark:text-[#A7BF9E] leading-relaxed">
                  {t('photoRecognition.lowConfidenceDesc', 'Low confidence match — please verify manually or try a clearer leaf/bark photo.')}
                </p>
              </div>
            </div>
          )}

          {/* Primary Top Match Card */}
          <article className="bg-[#FBF8EF] dark:bg-[#152114] border border-[#C9C2A9] dark:border-[#2D452B] rounded overflow-hidden shadow-xs">
            <div className="h-1.5 bg-[#3F6B37]" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Top Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C9C2A9]/50 dark:border-[#2D452B] pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#3F6B37] dark:text-[#E5BA5A]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('photoRecognition.topMatchTitle', 'Pl@ntNet Top Taxonomic Match')}</span>
                </div>
                {selectedFile && (
                  <span className="text-xs font-mono text-[#4B5842] dark:text-[#A7BF9E]">
                    {t('photoRecognition.fileLabel', 'File:')} {selectedFile.name}
                  </span>
                )}
              </div>

              {/* Title & RootGuard Recommended Badge */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-['Fraunces'] text-3xl sm:text-4xl font-bold text-[#23301E] dark:text-[#EDE8DD]">
                    {topMatch?.commonNames[0] || topMatch?.scientificName}
                  </h2>

                  {/* Matches RootGuard Recommended Species Badge */}
                  {topMatch?.matchedSpecies && (
                    <Link
                      to={`/identify?tab=conditions&search=${encodeURIComponent(topMatch.matchedSpecies.name)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3F6B37] hover:bg-[#2C4B27] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
                      title={t('photoRecognition.matchesTooltip', 'Click to view full care guide and erosion protection details')}
                    >
                      <Leaf className="w-3.5 h-3.5" />
                      <span>{t('photoRecognition.matchesRootguard', 'Matches RootGuard Recommended Species')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                <div className="font-serif italic text-lg sm:text-xl text-[#4B5842] dark:text-[#A7BF9E]">
                  {topMatch?.scientificName}
                  {topMatch?.family && (
                    <span className="text-xs not-italic font-mono ml-2 text-[#8A5233] dark:text-[#C47F53]">
                      ({t('photoRecognition.familyLabel', 'Family:')} {topMatch.family})
                    </span>
                  )}
                </div>

                {topMatch?.commonNames && topMatch.commonNames.length > 1 && (
                  <div className="text-xs text-[#4B5842] dark:text-[#A7BF9E]">
                    {t('photoRecognition.alsoKnownAs', 'Also known as:')} {topMatch.commonNames.slice(1, 5).join(', ')}
                  </div>
                )}

                {/* Confidence Bar */}
                <div className="space-y-1.5 max-w-md pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#23301E] dark:text-[#EDE8DD]">
                    <span>{t('photoRecognition.confidenceLabel', 'Identification Confidence')}</span>
                    <span className="font-mono text-[#3F6B37] dark:text-[#E5BA5A] font-bold text-sm">
                      {topMatch?.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E6DFCD] dark:bg-[#0E170D] h-3 rounded-full overflow-hidden border border-[#C9C2A9] dark:border-[#2D452B]">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${
                        isLowConfidence ? 'bg-[#C79A3F]' : 'bg-[#3F6B37]'
                      }`}
                      style={{ width: `${topMatch?.percentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Photo Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {previewUrl && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4B5842] dark:text-[#A7BF9E] block font-mono">
                      {t('photoRecognition.uploadedSpecimenLabel', 'Your Uploaded Specimen')}
                    </span>
                    <div className="h-56 rounded overflow-hidden border border-[#C9C2A9] dark:border-[#2D452B] bg-[#E6DFCD] dark:bg-[#0E170D]">
                      <img
                        src={previewUrl}
                        alt={t('images.uploadedSpecimenAlt', 'Uploaded field specimen photograph for botanical analysis')}
                        title={t('images.uploadedSpecimenAlt', 'Uploaded field specimen photograph for botanical analysis')}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {topMatch?.matchedSpecies ? (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3F6B37] dark:text-[#E5BA5A] block font-mono">
                      {t('photoRecognition.catalogRefLabel', 'RootGuard Catalog Reference ({{name}})', {
                        name: getLocalizedSpeciesName(topMatch.matchedSpecies.name, t),
                      })}
                    </span>
                    <div className="h-56 rounded overflow-hidden border border-[#3F6B37]/40 bg-[#E6DFCD] relative">
                      <img
                        src={topMatch.matchedSpecies.image_url}
                        alt={t('images.catalogReferenceAlt', '{{name}} reference photograph from RootGuard botanical index', {
                          name: getLocalizedSpeciesName(topMatch.matchedSpecies.name, t),
                        })}
                        title={t('images.catalogReferenceAlt', '{{name}} reference photograph from RootGuard botanical index', {
                          name: getLocalizedSpeciesName(topMatch.matchedSpecies.name, t),
                        })}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/75 backdrop-blur-xs text-white text-xs rounded">
                        <span className="font-semibold">{getLocalizedSpeciesName(topMatch.matchedSpecies.name, t)}</span> • {t('speciesGuide.card.height', 'Mature Height')}: {topMatch.matchedSpecies.mature_height_m}m
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded bg-[#F2EEE1] dark:bg-[#0E170D] border border-[#C9C2A9] dark:border-[#2D452B] flex flex-col justify-center space-y-2">
                    <div className="text-xs font-semibold text-[#23301E] dark:text-[#EDE8DD] flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-[#3F6B37]" />
                      <span>{t('photoRecognition.nonCatalogedTitle', 'Non-Cataloged Regional Flora')}</span>
                    </div>
                    <p className="text-xs text-[#4B5842] dark:text-[#A7BF9E] leading-relaxed">
                      {t('photoRecognition.nonCatalogedDesc', 'This specimen is recognized by Pl@ntNet as {{sci}}. While not among our 20 core soil erosion stabilization selections, it can still be tracked in your forestry ledger.', {
                        sci: topMatch?.scientificName,
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Care Instructions if matched with RootGuard species */}
              {topMatch?.matchedSpecies && (
                <div className="p-4 rounded bg-[#3F6B37]/10 dark:bg-[#20371C]/40 border border-[#3F6B37]/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2C4B27] dark:text-[#E5BA5A]">
                    <Sparkles className="w-4 h-4 text-[#C79A3F]" />
                    <span>{t('photoRecognition.soilProtectionProtocol', 'Soil Protection & Planting Protocol')}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#23301E] dark:text-[#EDE8DD] leading-relaxed">
                    {topMatch.matchedSpecies.care_instructions}
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-[#4B5842] dark:text-[#A7BF9E]">
                    <span>{t('speciesGuide.filters.waterNeed', 'Water Need')}: <strong className="capitalize">{topMatch.matchedSpecies.water_need}</strong></span>
                    <span>•</span>
                    <span>{t('speciesGuide.card.growth', 'Growth')}: <strong className="capitalize">{topMatch.matchedSpecies.growth_rate}</strong></span>
                    <span>•</span>
                    <span>{t('speciesGuide.card.soil', 'Soil')}: <strong>{topMatch.matchedSpecies.soil_types.join(', ')}</strong></span>
                  </div>
                </div>
              )}

              {/* Top 3 Species Matches Breakdown */}
              <div className="space-y-3 pt-4 border-t border-[#C9C2A9]/50 dark:border-[#2D452B]">
                <h4 className="font-['Fraunces'] text-lg font-bold text-[#23301E] dark:text-[#EDE8DD]">
                  {t('photoRecognition.topCandidatesTitle', 'Top 3 Botanical Candidates (Pl@ntNet Global Ranking)')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {matches.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded border text-xs space-y-2 ${
                        idx === 0
                          ? 'bg-[#3F6B37]/10 dark:bg-[#20371C]/50 border-[#3F6B37]/50'
                          : 'bg-[#F2EEE1] dark:bg-[#0E170D] border-[#C9C2A9] dark:border-[#2D452B]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-[#8A5233] dark:text-[#E5BA5A]">
                          {t('photoRecognition.candidateNum', 'Candidate #{{num}}', { num: idx + 1 })}
                        </span>
                        <Badge variant={idx === 0 ? 'success' : 'default'}>
                          {item.percentage}% {t('photoRecognition.confidence', 'Confidence')}
                        </Badge>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#23301E] dark:text-[#EDE8DD]">
                          {item.commonNames[0] || item.scientificName}
                        </div>
                        <div className="font-serif italic text-xs text-[#4B5842] dark:text-[#A7BF9E]">
                          {item.scientificName}
                        </div>
                      </div>
                      {item.matchedSpecies && (
                        <div className="text-[10px] text-[#3F6B37] dark:text-[#E5BA5A] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t('photoRecognition.rootguardMatch', 'RootGuard Specimen Match')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Link photo to an existing tree in the database */}
              <section className="bg-[#F2EEE1] dark:bg-[#0E170D] border border-[#C9C2A9] dark:border-[#2D452B] p-5 rounded space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C9C2A9]/50 dark:border-[#2D452B] pb-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-[#AD6B44]" />
                    <h4 className="font-['Fraunces'] text-base font-bold text-[#23301E] dark:text-[#EDE8DD]">
                      {t('photoRecognition.linkPhotoTitle', 'Link this photo to a tree in Supabase')}
                    </h4>
                  </div>
                  <span className="text-xs text-[#4B5842] dark:text-[#A7BF9E]">
                    {t('photoRecognition.linkPhotoSubtitle', 'Adds photo to tree\'s longitudinal growth ledger')}
                  </span>
                </div>

                {linkSuccess ? (
                  <div className="p-4 rounded bg-[#3F6B37]/15 border border-[#3F6B37] text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-[#2C4B27] dark:text-[#E5BA5A]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('photoRecognition.linkSuccessTitle', 'Photo Linked to Supabase Specimen!')}</span>
                    </div>
                    <p className="text-[#23301E] dark:text-[#EDE8DD]">
                      {t('photoRecognition.linkSuccessDesc', 'Appended photo to {{species}} ({{treeId}}) planted by {{planter}} on {{date}}.', {
                        species: linkSuccess.species,
                        treeId: linkSuccess.treeId,
                        planter: linkSuccess.planter,
                        date: linkSuccess.date,
                      })}
                    </p>
                    <div className="pt-1 flex gap-3">
                      <Link
                        to={`/tree-tracker?selected=${linkSuccess.treeId}`}
                        className="text-xs font-semibold text-[#3F6B37] dark:text-[#E5BA5A] underline"
                      >
                        {t('photoRecognition.viewInTreeTracker', 'View in Tree Tracker →')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setLinkSuccess(null)}
                        className="text-xs text-[#4B5842] hover:underline cursor-pointer"
                      >
                        {t('photoRecognition.linkAnother', 'Link to another tree')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label
                          htmlFor="link-tree-select"
                          className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5842] dark:text-[#A7BF9E]"
                        >
                          {t('photoRecognition.selectTreeLabel', 'Select Tree from Ledger ({{count}} matching)', { count: matchingTrees.length })}
                        </label>
                        <select
                          id="link-tree-select"
                          value={selectedTreeId}
                          onChange={(e) => setSelectedTreeId(e.target.value)}
                          className="w-full bg-[#FBF8EF] dark:bg-[#152114] border border-[#C9C2A9] dark:border-[#2D452B] text-xs px-2.5 py-2 text-[#23301E] dark:text-[#EDE8DD] rounded focus:outline-none"
                        >
                          <option value="">{t('photoRecognition.chooseTreeOption', '-- Choose a tree from ledger --')}</option>
                          {matchingTrees.map((tr) => (
                            <option key={tr.id} value={tr.id}>
                              {tr.id}: {getLocalizedSpeciesName(tr.species, t)} • {tr.planter} ({tr.date_planted})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="link-photo-date"
                          className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5842] dark:text-[#A7BF9E]"
                        >
                          {t('photoRecognition.checkinDate', 'Check-in Date')}
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            id="link-photo-date"
                            value={linkDate}
                            onChange={(e) => setLinkDate(e.target.value)}
                            className="w-full bg-[#FBF8EF] dark:bg-[#152114] border border-[#C9C2A9] dark:border-[#2D452B] text-xs px-2.5 py-2 text-[#23301E] dark:text-[#EDE8DD] rounded focus:outline-none"
                          />
                          <Calendar className="w-3.5 h-3.5 text-[#8A5233] absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!selectedTreeId}
                        onClick={handleLinkPhotoToTree}
                        leftIcon={<Camera className="w-3.5 h-3.5" />}
                      >
                        {t('photoRecognition.attachPhotoBtn', 'Attach Photo to Tree')}
                      </Button>

                      <button
                        type="button"
                        onClick={() => setShowAllTrees(!showAllTrees)}
                        className="text-xs text-[#8A5233] dark:text-[#E5BA5A] hover:underline cursor-pointer"
                      >
                        {showAllTrees
                          ? t('photoRecognition.filterMatchingOnly', 'Filter to matching species only')
                          : t('photoRecognition.showAllTrees', 'Not found? Show all registered trees ({{count}})', { count: trees.length })}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Action Bar */}
              <div className="pt-4 border-t border-[#C9C2A9]/50 dark:border-[#2D452B] flex flex-wrap items-center justify-between gap-3">
                <Link
                  to="/identify?tab=conditions"
                  className="text-xs font-semibold uppercase tracking-wider text-[#3F6B37] dark:text-[#E5BA5A] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>{t('photoRecognition.exploreSpeciesGuide', 'Explore Species Guide')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleReset();
                      handleModeSwitch('upload');
                    }}
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    {t('photoRecognition.uploadAnother', 'Upload Another Photo')}
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => {
                      handleReset();
                      handleModeSwitch('camera');
                    }}
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    {t('photoRecognition.scanAnotherCamera', 'Capture with Camera')}
                  </Button>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};
