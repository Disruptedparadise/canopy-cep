import React, { useState } from 'react';
import { SPECIES_DATA } from '../../data/speciesData';
import { Campaign } from '../../types';
import { Button } from '../ui';
import { Target, Calendar, User, MapPin, FileText, Trees, Plus, X, Check } from 'lucide-react';

interface CampaignFormProps {
  onSuccess: (created: Campaign) => void;
  onCancel: () => void;
  onSubmitCampaign: (data: Omit<Campaign, 'campaign_id'>) => Campaign;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({
  onSuccess,
  onCancel,
  onSubmitCampaign,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [areaName, setAreaName] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [goalTreeCount, setGoalTreeCount] = useState<number>(25);
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSpecies = (id: string) => {
    setSelectedSpeciesIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a campaign name.');
      return;
    }
    if (!organizer.trim()) {
      setErrorMsg('Please provide an organizing team or steward name.');
      return;
    }
    if (!areaName.trim()) {
      setErrorMsg('Please specify the ecological planting area or slope zone.');
      return;
    }
    if (!startDate) {
      setErrorMsg('Please select an initiative start date.');
      return;
    }
    if (goalTreeCount <= 0) {
      setErrorMsg('Target goal must be at least 1 tree.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = onSubmitCampaign({
        name: name.trim(),
        description: description.trim() || 'Coordinated reforestation initiative.',
        organizer: organizer.trim(),
        area_name: areaName.trim(),
        start_date: startDate,
        end_date: endDate.trim() ? endDate.trim() : undefined,
        goal_tree_count: Number(goalTreeCount),
        focus_species_ids: selectedSpeciesIds.length > 0 ? selectedSpeciesIds : undefined,
      });
      setIsSubmitting(false);
      onSuccess(created);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create campaign.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" id="create-campaign-form">
      {errorMsg && (
        <div className="p-3 bg-[#A6432D]/15 border border-[#A6432D] text-[#A6432D] text-xs rounded-sm">
          {errorMsg}
        </div>
      )}

      {/* Campaign Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="campaign-name-input"
          className="block text-xs font-semibold uppercase tracking-wider text-[#23301E] dark:text-[#EDE8DD]"
        >
          Campaign Name <span className="text-[#A6432D]">*</span>
        </label>
        <div className="relative">
          <Target className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5842] dark:text-[#A7BF9E]" />
          <input
            id="campaign-name-input"
            type="text"
            required
            placeholder="e.g. Ambernath Slope Restoration 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F2EEE1]/80 dark:bg-[#0E170D]/80 border border-[#C9C2A9] dark:border-[#2D452B] rounded text-sm text-[#23301E] dark:text-[#EDE8DD] focus:outline-none focus:ring-2 focus:ring-[#3F6B37]"
          />
        </div>
      </div>

      {/* Organizer & Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="campaign-organizer-input"
            className="block text-xs font-semibold uppercase tracking-wider text-[#23301E] dark:text-[#EDE8DD]"
          >
            Organizer / Community Group <span className="text-[#A6432D]">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5842] dark:text-[#A7BF9E]" />
            <input
              id="campaign-organizer-input"
              type="text"
              required
              placeholder="e.g. Watershed Canopy Trust"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F2EEE1]/80 dark:bg-[#0E170D]/80 border border-[#C9C2A9] dark:border-[#2D452B] rounded text-sm text-[#23301E] dark:text-[#EDE8DD] focus:outline-none focus:ring-2 focus:ring-[#3F6B37]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="campaign-area-input"
            className="block text-xs font-semibold uppercase tracking-wider text-[#23301E] dark:text-[#EDE8DD]"
          >
            Planting Area / Zone <span className="text-[#A6432D]">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5842] dark:text-[#A7BF9E]" />
            <input
              id="campaign-area-input"
              type="text"
              required
              placeholder="e.g. Eastern Ridge Escarpment"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F2EEE1]/80 dark:bg-[#0E170D]/80 border border-[#C9C2A9] dark:border-[#2D452B] rounded text-sm text-[#23301E] dark:text-[#EDE8DD] focus:outline-none focus:ring-2 focus:ring-[#3F6B37]"
            />
          </div>
        </div>
      </div>

      {/* Dates & Goal Count */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="campaign-start-date"
            className="block text-xs font-semibold uppercase tracking-wider text-[#23301E] dark:text-[#EDE8DD]"
          >
            Start Date <span className="text-[#A6432D]">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5842] dark:text-[#A7BF9E]" />
            <input
              id="campaign-start-date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F2EEE1]/80 dark:bg-[#0E170D]/80 border border-[#C9C2A9] dark:border-[#2D452B] rounded text-xs text-[#23301E] dark:text-[#EDE8DD] focus:outline-none focus:ring-2 focus:ring-[#3F6B37]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="campaign-end-date"
            className="block text-xs font-semibold uppercase tracking-wider text-[#23301E] dark:text-[#EDE8DD]"
          >
            End Date <span className="text-xs font-normal text-[#4B5842] dark:text-[#A7BF9E]">(Blank = Ongoing)</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5842] dark:text-[#A7BF9E]" />
            <input
              id="campaign-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F2EEE1]/80 dark:bg-[#0E170D]/80 border border-[#C9C2A9] dark:border-[#2D452B] rounded text-xs text-[#23301E] dark:text-[#EDE8DD] focus:outline-none focus:ring-2 focus:ring-[#3F6B37]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="campaign-goal-count"
            className="block text-xs font-semibold uppercase tracking-wider text-[#23301E] dark:text-[#EDE8DD]"
          >
            Goal Trees <span className="text-[#A6432D]">*</span>
          </label>
          <div className="relative">
            <Trees className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5842] dark:text-[#A7BF9E]" />
            <input
              id="campaign-goal-count"
              type="number"
              min={1}
              required
              value={goalTreeCount}
              onChange={(e) => setGoalTreeCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full pl-9 pr-3 py-2 bg-[#F2EEE1]/80 dark:bg-[#0E170D]/80 border border-[#C9C2A9] dark:border-[#2D452B] rounded text-xs text-[#23301E] dark:text-[#EDE8DD] focus:outline-none focus:ring-2 focus:ring-[#3F6B37]"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="campaign-desc-input"
          className="block text-xs font-semibold uppercase tracking-wider text-[#23301E] dark:text-[#EDE8DD]"
        >
          Initiative Scope & Objectives
        </label>
        <textarea
          id="campaign-desc-input"
          rows={3}
          placeholder="Brief description of ecological objectives, erosion risk mitigation, or communal restoration goals..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2.5 bg-[#F2EEE1]/80 dark:bg-[#0E170D]/80 border border-[#C9C2A9] dark:border-[#2D452B] rounded text-xs text-[#23301E] dark:text-[#EDE8DD] focus:outline-none focus:ring-2 focus:ring-[#3F6B37]"
        />
      </div>

      {/* Focus Species Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#23301E] dark:text-[#EDE8DD]">
          Priority Focus Species <span className="text-xs font-normal text-[#4B5842] dark:text-[#A7BF9E]">(Optional)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-[#F2EEE1]/60 dark:bg-[#0E170D]/60 border border-[#C9C2A9] dark:border-[#2D452B] rounded text-xs">
          {SPECIES_DATA.map((sp) => {
            const isSelected = selectedSpeciesIds.includes(sp.id);
            return (
              <button
                type="button"
                key={sp.id}
                onClick={() => toggleSpecies(sp.id)}
                className={`p-1.5 rounded text-left flex items-center justify-between transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-[#3F6B37] text-white border-[#2C4B27]'
                    : 'bg-[#FBF8EF] dark:bg-[#152114] text-[#23301E] dark:text-[#EDE8DD] border-[#C9C2A9]/60 dark:border-[#2D452B] hover:border-[#3F6B37]'
                }`}
              >
                <span className="truncate">{sp.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-[#E5BA5A]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C9C2A9]/50 dark:border-[#2D452B]">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {isSubmitting ? 'Registering...' : 'Register Campaign'}
        </Button>
      </div>
    </form>
  );
};
