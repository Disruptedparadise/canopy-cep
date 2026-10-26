import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TreeRecord, TreeStatus, TreePhoto } from '../types';
import { useTrees, getEffectiveStatus } from '../context/TreeContext';
import { useToast } from '../context/ToastContext';
import { SPECIES_DATA } from '../data/speciesData';
import {
  X,
  Calendar,
  Activity,
  Plus,
  Camera,
  Upload,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Image as ImageIcon,
  Eye,
  Maximize2,
  Sparkles,
  ShieldAlert,
  Sprout,
  ArrowRight,
  QrCode,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLocalizedSpeciesName } from '../i18n';
import { computeTreeErosionRisk, EROSION_RISK_COLORS } from '../utils/erosionRisk';
import { TreeQrTagModal } from './TreeQrTagModal';

interface CheckinModalProps {
  tree: TreeRecord | null;
  onClose: () => void;
  onGrowthLogAdded?: (treeId: string) => void;
}

export const TreeDetailModal: React.FC<CheckinModalProps> = ({
  tree: propTree,
  onClose,
  onGrowthLogAdded,
}) => {
  const { t } = useTranslation();
  const { trees, addCheckin, addPhoto } = useTrees();
  const { toast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  // Track timestamps for newly added entries to power smooth contextual animations
  const [lastAddedCheckinTimestamp, setLastAddedCheckinTimestamp] = useState<number | null>(null);
  const [lastAddedPhotoTimestamp, setLastAddedPhotoTimestamp] = useState<number | null>(null);

  // Keep live reference from context so new checkins & photos update immediately
  const tree = useMemo(() => {
    if (!propTree) return null;
    return trees.find((t) => t.id === propTree.id) || propTree;
  }, [propTree, trees]);

  // Find species details if available
  const speciesMeta = useMemo(() => {
    if (!tree) return null;
    return SPECIES_DATA.find(
      (s) => s.name.toLowerCase() === tree.species.toLowerCase()
    );
  }, [tree]);

  // Check-in form state
  const [checkinDate, setCheckinDate] = useState<string>(todayStr);
  const [checkinStatus, setCheckinStatus] = useState<TreeStatus>('healthy');
  const [checkinNote, setCheckinNote] = useState<string>('');
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [checkinFeedback, setCheckinFeedback] = useState<string | null>(null);

  // Photo upload state
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [photoDate, setPhotoDate] = useState<string>(todayStr);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoDragActive, setPhotoDragActive] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox enlarged view
  const [lightboxPhoto, setLightboxPhoto] = useState<TreePhoto | null>(null);

  // Field QR tag modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Chronologically sorted photos (earliest to latest for natural growth progression)
  const sortedPhotos = useMemo(() => {
    if (!tree?.photos || tree.photos.length === 0) return [];
    return [...tree.photos].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [tree?.photos]);

  // Site terrain erosion vulnerability assessment
  const erosionRisk = useMemo(() => {
    if (!tree) return null;
    return computeTreeErosionRisk(tree, trees);
  }, [tree, trees]);

  // Keyboard accessibility: Escape closes lightbox or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxPhoto) {
          setLightboxPhoto(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto, onClose]);

  if (!tree) return null;

  const currentStatus = getEffectiveStatus(tree);

  // Status badge helper
  const getStatusBadge = (st: TreeStatus) => {
    switch (st) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3F6B37]/15 text-[#2C4B27] border border-[#3F6B37]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3F6B37]" />
            Healthy
          </span>
        );
      case 'needs-watch':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C79A3F]/25 text-[#8A5233] border border-[#C79A3F]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C79A3F]" />
            Needs Watch
          </span>
        );
      case 'not-surviving':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A6432D]/15 text-[#A6432D] border border-[#A6432D]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A6432D]" />
            Not Surviving
          </span>
        );
    }
  };

  // Check-in submission
  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinNote.trim()) {
      setCheckinFeedback('Please write a short inspection note describing the tree’s condition.');
      return;
    }

    setIsSubmittingCheckin(true);
    addCheckin(tree.id, {
      date: checkinDate || todayStr,
      status: checkinStatus,
      note: checkinNote.trim(),
    });

    setLastAddedCheckinTimestamp(Date.now());
    onGrowthLogAdded?.(tree.id);

    toast.success('Inspection Logged', `Recorded check-in for ${tree.species} (${checkinStatus}).`);
    setCheckinFeedback('Field check-in recorded successfully!');
    setCheckinNote('');
    setIsSubmittingCheckin(false);

    setTimeout(() => {
      setCheckinFeedback(null);
    }, 2500);
  };

  // Process selected or dropped image file
  const handlePhotoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setPhotoFeedback('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setSelectedPhotoFile(file);
    setPhotoFeedback(null);

    // Read and optimize image for responsive rendering & storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 900;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoPreviewUrl(compressed);
        } else {
          setPhotoPreviewUrl(dataUrl);
        }
      };
      img.onerror = () => {
        setPhotoPreviewUrl(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers for growth photo upload
  const handlePhotoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setPhotoDragActive(true);
    } else if (e.type === 'dragleave') {
      setPhotoDragActive(false);
    }
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoFile(e.dataTransfer.files[0]);
    }
  };

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoFile(e.target.files[0]);
    }
  };

  // Clear photo upload staging
  const resetPhotoUpload = () => {
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl(null);
    setPhotoFeedback(null);
    if (photoFileInputRef.current) {
      photoFileInputRef.current.value = '';
    }
  };

  // Submit growth photo
  const handleCommitPhoto = () => {
    if (!photoPreviewUrl) {
      setPhotoFeedback('Please select or drop a photo first.');
      return;
    }

    setIsSubmittingPhoto(true);
    addPhoto(tree.id, {
      url: photoPreviewUrl,
      date: photoDate || todayStr,
    });

    setLastAddedPhotoTimestamp(Date.now());
    onGrowthLogAdded?.(tree.id);

    toast.success('Photo Added', `Added specimen photo to the growth timeline.`);
    setIsSubmittingPhoto(false);
    setPhotoFeedback('Growth photo committed to timeline!');
    resetPhotoUpload();
    setIsAddingPhoto(false);

    setTimeout(() => {
      setPhotoFeedback(null);
    }, 3000);
  };

  // Quick preset sample photo loader for testing convenience
  const loadPresetPhoto = (sampleName: string, sampleUrl: string) => {
    setPhotoPreviewUrl(sampleUrl);
    const mockFile = new File(['sample'], sampleName, { type: 'image/jpeg' });
    setSelectedPhotoFile(mockFile);
    setPhotoFeedback(null);
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#FBF8EF] dark:bg-[#192218] text-[#23301E] dark:text-[#EDE8DD] border-2 border-[#2C4B27] dark:border-[#3D4F37] w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-sm shadow-2xl relative my-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Editorial Top Bar / Masthead */}
        <div className="bg-[#2C4B27] text-[#F2EEE1] p-5 sm:p-6 flex items-start justify-between border-b border-[#3F6B37] sticky top-0 z-20 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-widest text-[#C79A3F]">
              <span>{t('checkinModal.fieldDossier', 'Field Specimen Dossier')}</span>
              <span>•</span>
              <span className="font-bold">{tree.id}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <h2 className="font-['Fraunces'] text-2xl sm:text-3xl font-bold text-[#FBF8EF]">
                {tree.species}
              </h2>
              {speciesMeta?.scientific_name && (
                <span className="font-serif italic text-sm text-[#C9C2A9]">
                  ({speciesMeta.scientific_name})
                </span>
              )}
            </div>
            <div className="text-xs text-[#C9C2A9] mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                Planter: <strong className="text-white">{tree.planter}</strong>
              </span>
              <span>•</span>
              <span>Planted: <strong className="text-white">{tree.date_planted}</strong></span>
              <span>•</span>
              <span>
                Terrain: <strong className="capitalize text-white">{tree.soil_type}</strong> soil,{' '}
                <strong className="capitalize text-white">{tree.slope}</strong> slope
              </span>
              <span>•</span>
              <span className="font-mono text-[#E6DFCD]">
                {tree.lat.toFixed(4)}°N, {tree.lng.toFixed(4)}°E
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              id="generate-qr-tag-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#E5BA5A] hover:bg-[#D4A745] text-[#1E2E1A] rounded transition-colors cursor-pointer shadow-xs"
              title="Generate printable field QR tag for this specimen"
            >
              <QrCode className="w-4 h-4 text-[#1E2E1A]" />
              <span className="hidden sm:inline">Generate QR Tag</span>
              <span className="sm:hidden">QR Tag</span>
            </button>
            <button
              onClick={onClose}
              id="close-tree-detail-modal-btn"
              className="p-1.5 text-[#C9C2A9] hover:text-[#FBF8EF] hover:bg-[#3F6B37] rounded transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-7">
          {/* Current Survival Status & Erosion Risk Banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Survival Status Banner */}
            <div className="flex items-center justify-between gap-3 p-4 bg-[#F2EEE1] border border-[#C9C2A9] rounded-xs shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#3F6B37]/15 border border-[#3F6B37]/30 flex items-center justify-center text-[#2C4B27]">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#4B5842] font-semibold block">
                    Survival Status
                  </span>
                  <span className="text-[11px] text-[#23301E]">
                    Dynamic longitudinal evaluation
                  </span>
                </div>
              </div>
              <div>{getStatusBadge(currentStatus)}</div>
            </div>

            {/* Erosion Risk Assessment Banner */}
            {erosionRisk && (
              <div
                className={`flex items-center justify-between gap-3 p-4 border rounded-xs shadow-2xs ${
                  erosionRisk.level === 'high'
                    ? 'bg-[#A6432D]/10 border-[#A6432D]/40'
                    : erosionRisk.level === 'medium'
                    ? 'bg-[#C79A3F]/15 border-[#8A5233]/40'
                    : 'bg-[#3F6B37]/10 border-[#3F6B37]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${EROSION_RISK_COLORS[erosionRisk.level].fill}20`,
                      borderColor: EROSION_RISK_COLORS[erosionRisk.level].border,
                    }}
                  >
                    <ShieldAlert
                      className="w-5 h-5"
                      style={{ color: EROSION_RISK_COLORS[erosionRisk.level].text }}
                    />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#4B5842] font-semibold block">
                      Terrain Erosion Risk
                    </span>
                    <span className="text-[11px] text-[#23301E]">
                      {tree.slope} slope • {tree.soil_type} • {erosionRisk.nearbyTreeCount} trees in 500m
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-mono font-bold uppercase rounded-xs border ${
                      EROSION_RISK_COLORS[erosionRisk.level].bg
                    } ${EROSION_RISK_COLORS[erosionRisk.level].badgeBorder}`}
                    style={{ color: EROSION_RISK_COLORS[erosionRisk.level].text }}
                  >
                    {erosionRisk.level} ({erosionRisk.score}/9)
                  </span>
                  {erosionRisk.level !== 'low' && (
                    <Link
                      to={`/soil-tips#soil-tip-${erosionRisk.recommendedTips[0]?.id || 'tip-03'}`}
                      className="block text-[10px] text-[#8A5233] underline hover:text-[#2C4B27] mt-1"
                    >
                      Soil Protocol →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Growth Photo Timeline */}
          <section aria-labelledby="photo-timeline-heading" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C9C2A9] pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#3F6B37]" />
                <h3
                  id="photo-timeline-heading"
                  className="font-['Fraunces'] text-lg font-bold text-[#23301E]"
                >
                  Growth Photo Timeline
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 bg-[#E6DFCD] text-[#2C4B27] rounded-xs border border-[#C9C2A9]">
                  {sortedPhotos.length} {sortedPhotos.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>

              <button
                type="button"
                id="toggle-add-growth-photo-btn"
                onClick={() => setIsAddingPhoto(!isAddingPhoto)}
                className="px-3 py-1.5 bg-[#3F6B37] hover:bg-[#2C4B27] text-[#FBF8EF] text-xs font-semibold tracking-wider uppercase rounded-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingPhoto ? 'Close Photo Form' : 'Add Growth Photo'}</span>
              </button>
            </div>

            {photoFeedback && (
              <div className="p-3 bg-[#3F6B37]/15 border border-[#3F6B37] text-xs font-semibold text-[#2C4B27] rounded-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3F6B37]" />
                <span>{photoFeedback}</span>
              </div>
            )}

            {/* Horizontal Timeline Container */}
            {sortedPhotos.length === 0 ? (
              <div className="p-8 text-center bg-[#F2EEE1]/70 border border-dashed border-[#C9C2A9] rounded-xs space-y-2">
                <Camera className="w-8 h-8 text-[#8A5233] mx-auto opacity-70" />
                <p className="font-['Fraunces'] text-base text-[#23301E]">
                  No growth photos attached yet.
                </p>
                <p className="text-xs text-[#4B5842] max-w-sm mx-auto">
                  Documenting seedling development with visual check-ins provides irrefutable evidence of survival and vigor.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Horizontal Scroll Track */}
                <div
                  id="horizontal-photo-timeline"
                  className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin"
                >
                  <AnimatePresence initial={false}>
                    {sortedPhotos.map((photo, index) => {
                      const isFirst = index === 0;
                      const isLast = index === sortedPhotos.length - 1 && sortedPhotos.length > 1;
                      const isNewlyAddedPhoto =
                        isLast &&
                        lastAddedPhotoTimestamp &&
                        Date.now() - lastAddedPhotoTimestamp < 8000;

                      return (
                        <motion.div
                          key={`${photo.date}-${photo.url.slice(-25)}-${index}`}
                          layout
                          initial={{ opacity: 0, scale: 0.85, x: 25 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                          }}
                          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                          className={`shrink-0 w-48 sm:w-56 rounded-xs p-3 flex flex-col justify-between relative shadow-2xs hover:border-[#3F6B37] transition-all group border ${
                            isNewlyAddedPhoto
                              ? 'bg-[#3F6B37]/10 border-[#3F6B37] ring-2 ring-[#3F6B37]/40'
                              : 'bg-[#F2EEE1] border-[#C9C2A9]'
                          }`}
                        >
                          {/* Timeline Step Header */}
                          <div className="flex items-center justify-between gap-1 text-[10px] uppercase font-mono tracking-wider text-[#4B5842] mb-1.5">
                            <span className="font-semibold">
                              {isNewlyAddedPhoto ? (
                                <span className="text-[#3F6B37] font-bold inline-flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                                  New Photo!
                                </span>
                              ) : isFirst ? (
                                <span className="text-[#3F6B37] font-bold">Planting Day</span>
                              ) : isLast ? (
                                <span className="text-[#AD6B44] font-bold">Latest Growth</span>
                              ) : (
                                <span>Stage #{index + 1}</span>
                              )}
                            </span>
                            <span className="text-[10px] text-[#8A5233] font-bold">{photo.date}</span>
                          </div>

                          {/* Thumbnail with overlay view button */}
                          <div
                            className="relative h-32 sm:h-36 w-full rounded-xs overflow-hidden border border-[#C9C2A9] bg-[#E6DFCD] cursor-pointer"
                            onClick={() => setLightboxPhoto(photo)}
                            title={t('checkin.viewFullPhoto', 'Click to view full photograph')}
                          >
                            <img
                              src={photo.url}
                              alt={t('images.photoDateAlt', 'Specimen check-in photograph taken on {{date}}', {
                                date: photo.date,
                              })}
                              title={t('images.photoDateAlt', 'Specimen check-in photograph taken on {{date}}', {
                                date: photo.date,
                              })}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-medium">
                              <Maximize2 className="w-4 h-4" />
                              <span>{t('checkin.enlarge', 'Enlarge')}</span>
                            </div>
                          </div>

                          {/* Step Marker line at card base */}
                          <div className="mt-2.5 pt-2 border-t border-[#C9C2A9]/60 flex items-center justify-between text-[11px] text-[#4B5842]">
                            <span className="font-mono text-[10px] text-[#8A5233]">
                              Visit #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setLightboxPhoto(photo)}
                              className="text-[#3F6B37] hover:text-[#2C4B27] font-medium text-[10px] flex items-center gap-0.5 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{t('checkinModal.inspectBtn', 'Inspect')}</span>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Section 2: "Add Growth Photo" Upload Panel (Reusing Photo Recognition upload UI pattern) */}
            {isAddingPhoto && (
              <div
                id="add-growth-photo-panel"
                className="mt-4 p-5 bg-[#F2EEE1] border border-[#3F6B37] rounded-xs space-y-4 animate-fadeIn"
              >
                <div className="flex items-center justify-between border-b border-[#C9C2A9] pb-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#AD6B44]" />
                    <h4 className="font-['Fraunces'] text-base font-bold text-[#23301E]">
                      Upload New Specimen Growth Photo
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-[#8A5233]">
                    Visual Longitudinal Verification
                  </span>
                </div>

                {/* Upload date input */}
                <div className="max-w-xs">
                  <label
                    htmlFor="growth-photo-date"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5842] mb-1"
                  >
                    Photograph Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="growth-photo-date"
                      value={photoDate}
                      onChange={(e) => setPhotoDate(e.target.value)}
                      className="w-full bg-[#FBF8EF] border border-[#C9C2A9] text-xs px-2.5 py-1.5 text-[#23301E] focus:outline-none focus:border-[#3F6B37]"
                    />
                    <Calendar className="w-3.5 h-3.5 text-[#8A5233] absolute right-2.5 top-2 pointer-events-none" />
                  </div>
                </div>

                {/* Dropzone matching Photo Recognition UI */}
                {!photoPreviewUrl ? (
                  <div className="space-y-3">
                    <div
                      id="growth-photo-dropzone"
                      onDragEnter={handlePhotoDrag}
                      onDragLeave={handlePhotoDrag}
                      onDragOver={handlePhotoDrag}
                      onDrop={handlePhotoDrop}
                      onClick={() => photoFileInputRef.current?.click()}
                      className={`bg-[#FBF8EF] border-2 border-dashed rounded-sm p-6 sm:p-8 text-center cursor-pointer transition-all ${
                        photoDragActive
                          ? 'border-[#3F6B37] bg-[#3F6B37]/5 scale-[1.01]'
                          : 'border-[#C9C2A9] hover:border-[#3F6B37] hover:bg-[#F8F4E8]'
                      }`}
                    >
                      <input
                        ref={photoFileInputRef}
                        type="file"
                        id="growth-photo-file-input"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoInputChange}
                      />

                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#3F6B37]/10 border border-[#3F6B37]/20 flex items-center justify-center mx-auto text-[#3F6B37]">
                          <Upload className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="font-['Fraunces'] text-base font-bold text-[#23301E]">
                            Drop a growth photo here
                          </div>
                          <p className="text-xs text-[#4B5842] mt-0.5 font-light">
                            or click to select from your phone/camera (JPG, PNG, WebP)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Instant testing sample presets */}
                    <div className="bg-[#FBF8EF] border border-[#C9C2A9] p-3 rounded-xs">
                      <span className="text-[11px] font-semibold tracking-wider text-[#23301E] uppercase block mb-2">
                        Or test with sample specimen photos:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <button
                          type="button"
                          id="load-foliage-sample-btn"
                          onClick={() =>
                            loadPresetPhoto(
                              'sapling_foliage_3month.jpg',
                              'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'
                            )
                          }
                          className="p-2 bg-[#F2EEE1] border border-[#C9C2A9] hover:border-[#3F6B37] text-left transition-colors flex items-center gap-2"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#3F6B37] shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-[#23301E] truncate">Foliage Growth</div>
                            <div className="text-[10px] text-[#4B5842]">3-Month Flush</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          id="load-canopy-sample-btn"
                          onClick={() =>
                            loadPresetPhoto(
                              'canopy_thickening_6month.jpg',
                              'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80'
                            )
                          }
                          className="p-2 bg-[#F2EEE1] border border-[#C9C2A9] hover:border-[#3F6B37] text-left transition-colors flex items-center gap-2"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#AD6B44] shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-[#23301E] truncate">Canopy Vigor</div>
                            <div className="text-[10px] text-[#4B5842]">6-Month Branching</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          id="load-bark-sample-btn"
                          onClick={() =>
                            loadPresetPhoto(
                              'trunk_collar_inspection.jpg',
                              'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80'
                            )
                          }
                          className="p-2 bg-[#F2EEE1] border border-[#C9C2A9] hover:border-[#3F6B37] text-left transition-colors flex items-center gap-2"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#2C4B27] shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-[#23301E] truncate">Root Collar</div>
                            <div className="text-[10px] text-[#4B5842]">Mulch Ring</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Staged Photo Preview */
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#FBF8EF] p-4 border border-[#C9C2A9] rounded-xs">
                      <div className="w-36 h-28 sm:w-44 sm:h-32 shrink-0 rounded-xs overflow-hidden border border-[#C9C2A9] bg-[#E6DFCD]">
                        <img
                          src={photoPreviewUrl}
                          alt={t('images.stagingPreviewAlt', 'Growth photo staging preview')}
                          title={t('images.stagingPreviewAlt', 'Growth photo staging preview')}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1.5 text-xs text-[#23301E] flex-1">
                        <div className="font-semibold text-sm text-[#2C4B27]">
                          Specimen Photo Ready to Append
                        </div>
                        <div className="text-[#4B5842]">
                          Target Tree: <strong>{tree.species}</strong> ({tree.id})
                        </div>
                        <div className="text-[#4B5842]">
                          Recorded Date: <strong>{photoDate}</strong>
                        </div>
                        {selectedPhotoFile && (
                          <div className="text-[11px] font-mono text-[#8A5233]">
                            File: {selectedPhotoFile.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        id="confirm-growth-photo-btn"
                        onClick={handleCommitPhoto}
                        disabled={isSubmittingPhoto}
                        className="px-5 py-2 bg-[#3F6B37] hover:bg-[#2C4B27] text-[#FBF8EF] text-xs font-semibold tracking-wider uppercase rounded-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer border border-[#2C4B27]"
                      >
                        <Check className="w-4 h-4" />
                        <span>{t('checkinModal.commitPhoto', 'Commit Photo to Growth Timeline')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={resetPhotoUpload}
                        className="px-4 py-2 border border-[#C9C2A9] text-xs font-medium text-[#23301E] hover:bg-[#FBF8EF] transition-colors cursor-pointer"
                      >
                        Change / Clear Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section 3: Field Check-in Form & Post-Planting Accountability */}
          <section aria-labelledby="checkin-form-heading" className="space-y-3">
            <div className="bg-[#F2EEE1]/70 border border-[#C9C2A9] p-5 rounded-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#C9C2A9] pb-2">
                <h3
                  id="checkin-form-heading"
                  className="font-['Fraunces'] text-base font-bold text-[#2C4B27] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-[#AD6B44]" />
                  Log a Field Check-in
                </h3>
                <span className="text-[11px] font-mono text-[#8A5233]">
                  Post-Planting Accountability
                </span>
              </div>

              {checkinFeedback && (
                <div className="p-2.5 bg-[#3F6B37]/15 border border-[#3F6B37] text-xs font-semibold text-[#2C4B27] rounded-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3F6B37]" />
                  <span>{checkinFeedback}</span>
                </div>
              )}

              <form onSubmit={handleCheckinSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Inspection Date */}
                  <div>
                    <label
                      htmlFor="checkin-date-input"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5842] mb-1"
                    >
                      Inspection Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        id="checkin-date-input"
                        value={checkinDate}
                        onChange={(e) => setCheckinDate(e.target.value)}
                        className="w-full bg-[#FBF8EF] border border-[#C9C2A9] text-xs px-2.5 py-2 text-[#23301E] focus:outline-none focus:border-[#3F6B37]"
                      />
                      <Calendar className="w-3.5 h-3.5 text-[#8A5233] absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Observed Condition */}
                  <div>
                    <label
                      htmlFor="checkin-status-select"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5842] mb-1"
                    >
                      Observed Condition
                    </label>
                    <select
                      id="checkin-status-select"
                      value={checkinStatus}
                      onChange={(e) => setCheckinStatus(e.target.value as TreeStatus)}
                      className="w-full bg-[#FBF8EF] border border-[#C9C2A9] text-xs px-2.5 py-2 text-[#23301E] focus:outline-none focus:border-[#3F6B37] cursor-pointer"
                    >
                      <option value="healthy">Healthy (vigorous foliage & firm stem)</option>
                      <option value="needs-watch">Needs Watch (wilting/pests/wind stress)</option>
                      <option value="not-surviving">Not Surviving (desiccated/root rot failure)</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="checkin-notes-textarea"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5842] mb-1"
                  >
                    Field Inspection Notes & Actions Taken <span className="text-[#A6432D]">*</span>
                  </label>
                  <textarea
                    id="checkin-notes-textarea"
                    rows={2}
                    placeholder="e.g. Cleared competing weeds around collar; applied 5cm leaf mulch; good terminal bud vigor."
                    value={checkinNote}
                    onChange={(e) => setCheckinNote(e.target.value)}
                    className="w-full bg-[#FBF8EF] border border-[#C9C2A9] text-xs p-2.5 text-[#23301E] focus:outline-none focus:border-[#3F6B37] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  id="record-checkin-submit-btn"
                  disabled={isSubmittingCheckin}
                  className="w-full py-2 bg-[#3F6B37] hover:bg-[#2C4B27] text-[#FBF8EF] text-xs font-semibold tracking-wider uppercase border border-[#2C4B27] shadow-xs cursor-pointer transition-colors"
                >
                  Record Check-in Entry
                </button>
              </form>
            </div>
          </section>

          {/* Section 4: Survival Check-in History */}
          <section aria-labelledby="checkin-history-heading" className="space-y-3">
            <h3
              id="checkin-history-heading"
              className="font-['Fraunces'] text-base font-bold text-[#23301E] border-b border-[#C9C2A9] pb-1.5 flex items-center justify-between"
            >
              <span>{t('checkinModal.survivalHistory', 'Survival Check-in History')}</span>
              <span className="text-xs font-normal text-[#4B5842]">
                {tree.checkins?.length || 0} Recorded Visits
              </span>
            </h3>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {!tree.checkins || tree.checkins.length === 0 ? (
                <div className="text-xs text-[#4B5842] italic py-2">No check-ins logged yet.</div>
              ) : (
                <AnimatePresence initial={false} mode="popLayout">
                  {tree.checkins.map((chk, idx) => {
                    const isLatest = idx === 0;
                    const isNewlyAdded =
                      isLatest &&
                      lastAddedCheckinTimestamp &&
                      Date.now() - lastAddedCheckinTimestamp < 8000;

                    return (
                      <motion.div
                        key={chk.id || `${chk.date}-${chk.note.slice(0, 20)}-${idx}`}
                        layout
                        initial={{ opacity: 0, y: -20, scale: 0.96 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                        }}
                        exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                        className={`p-3 border rounded-xs text-xs space-y-1 transition-all duration-500 ${
                          isNewlyAdded
                            ? 'bg-[#3F6B37]/15 border-[#3F6B37] ring-2 ring-[#3F6B37]/40 shadow-sm'
                            : 'bg-[#F2EEE1] border-[#C9C2A9]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-semibold text-[#8A5233] flex items-center gap-1.5">
                            <span>{chk.date}</span>
                            {isNewlyAdded ? (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3F6B37] bg-[#3F6B37]/20 px-2 py-0.5 rounded-full"
                              >
                                <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                                Just Logged!
                              </motion.span>
                            ) : idx === 0 ? (
                              <span className="text-[#3F6B37] font-bold">(Latest Inspection)</span>
                            ) : null}
                          </span>
                          {getStatusBadge(chk.status)}
                        </div>
                        <p className="text-[#23301E] leading-relaxed mt-1">{chk.note}</p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Lightbox Modal for Enlarge View */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-[#FBF8EF] border-2 border-[#2C4B27] max-w-2xl w-full p-4 rounded-xs shadow-2xl relative space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#C9C2A9] pb-2">
              <div>
                <div className="font-['Fraunces'] font-bold text-lg text-[#2C4B27]">
                  {tree.species} Specimen Growth Photograph
                </div>
                <div className="text-xs text-[#8A5233] font-mono">
                  Captured on: {lightboxPhoto.date} • Specimen: {tree.id}
                </div>
              </div>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1 hover:bg-[#E6DFCD] text-[#23301E] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-hidden rounded border border-[#C9C2A9] bg-black/5 flex items-center justify-center">
              <img
                src={lightboxPhoto.url}
                alt={t('images.photoDateAlt', 'Specimen check-in photograph taken on {{date}}', {
                  date: lightboxPhoto.date,
                })}
                title={t('images.photoDateAlt', 'Specimen check-in photograph taken on {{date}}', {
                  date: lightboxPhoto.date,
                })}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[68vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Field QR Tag Modal */}
      {isQrModalOpen && (
        <TreeQrTagModal
          tree={tree}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}
    </div>
  );
};

// Also export as CheckinModal to maintain backward compatibility with all imports
export const CheckinModal = TreeDetailModal;
