import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTrees } from '../../context/TreeContext';
import {
  TrendingUp,
  Target,
  Trees,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
} from 'lucide-react';

export interface CampaignSurvivalD3ChartProps {
  className?: string;
}

type ViewMode = 'cumulative' | 'comparison';

interface CampaignDatum {
  id: string;
  name: string;
  shortName: string;
  organizer: string;
  area: string;
  startDate: string;
  target: number;
  planted: number;
  healthy: number;
  needsWatch: number;
  notSurviving: number;
  surviving: number;
  survivalPct: number;
  targetAttainmentPct: number;
  // Cumulative running values
  cumulativeTarget: number;
  cumulativePlanted: number;
  cumulativeSurviving: number;
  cumulativeSurvivalRate: number;
  cumulativeTargetAttainment: number;
  stepIndex: number;
}

export const CampaignSurvivalD3Chart: React.FC<CampaignSurvivalD3ChartProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { campaigns, trees, getCampaignStats } = useTrees();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('cumulative');
  const [hoveredCampaign, setHoveredCampaign] = useState<CampaignDatum | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 380,
  });

  // Calculate chronological campaign data and cumulative running metrics
  const campaignData: CampaignDatum[] = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];

    // Sort campaigns chronologically by start_date
    const sorted = [...campaigns].sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
      return dateA - dateB;
    });

    let runningTarget = 0;
    let runningPlanted = 0;
    let runningSurviving = 0;

    return sorted.map((campaign, index) => {
      const stats = getCampaignStats(campaign.campaign_id);
      const target = campaign.goal_tree_count || 1;
      const planted = stats.treeCount;
      const healthy = stats.healthyCount;
      const needsWatch = stats.needsWatchCount;
      const notSurviving = stats.notSurvivingCount;
      const surviving = healthy + needsWatch;

      const survivalPct = planted > 0 ? Math.round((surviving / planted) * 100) : 0;
      const targetAttainmentPct = target > 0 ? Math.round((surviving / target) * 100) : 0;

      runningTarget += target;
      runningPlanted += planted;
      runningSurviving += surviving;

      const cumulativeSurvivalRate =
        runningPlanted > 0 ? Math.round((runningSurviving / runningPlanted) * 100) : 0;

      const cumulativeTargetAttainment =
        runningTarget > 0 ? Math.round((runningSurviving / runningTarget) * 100) : 0;

      // Abbreviate long names for the X-axis
      const shortName =
        campaign.name.length > 20 ? `${campaign.name.slice(0, 18)}…` : campaign.name;

      return {
        id: campaign.campaign_id,
        name: campaign.name,
        shortName,
        organizer: campaign.organizer,
        area: campaign.area_name,
        startDate: campaign.start_date || 'Ongoing',
        target,
        planted,
        healthy,
        needsWatch,
        notSurviving,
        surviving,
        survivalPct,
        targetAttainmentPct,
        cumulativeTarget: runningTarget,
        cumulativePlanted: runningPlanted,
        cumulativeSurviving: runningSurviving,
        cumulativeSurvivalRate,
        cumulativeTargetAttainment,
        stepIndex: index + 1,
      };
    });
  }, [campaigns, trees, getCampaignStats]);

  // Overall totals across all campaigns
  const totals = useMemo(() => {
    if (campaignData.length === 0) {
      return {
        totalTarget: 0,
        totalPlanted: 0,
        totalSurviving: 0,
        cumulativeSurvivalRate: 0,
        targetAttainmentRate: 0,
      };
    }
    const last = campaignData[campaignData.length - 1];
    return {
      totalTarget: last.cumulativeTarget,
      totalPlanted: last.cumulativePlanted,
      totalSurviving: last.cumulativeSurviving,
      cumulativeSurvivalRate: last.cumulativeSurvivalRate,
      targetAttainmentRate: last.cumulativeTargetAttainment,
    };
  }, [campaignData]);

  // Observe container dimensions with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          // Keep a healthy aspect ratio bounded between 340px and 440px height
          const height = Math.min(440, Math.max(340, Math.round(width * 0.45)));
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Main D3 Drawing Effect
  useEffect(() => {
    if (!svgRef.current || campaignData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = {
      top: 32,
      right: width < 600 ? 46 : 64,
      bottom: width < 600 ? 55 : 65,
      left: width < 600 ? 42 : 56,
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Gradient for Surviving Area
    const survivingAreaGrad = defs
      .append('linearGradient')
      .attr('id', 'survivingAreaGrad')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    survivingAreaGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2D5A34')
      .attr('stop-opacity', 0.45);
    survivingAreaGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#2D5A34')
      .attr('stop-opacity', 0.02);

    // Gradient for Target Area / Bar
    const targetGrad = defs
      .append('linearGradient')
      .attr('id', 'targetGrad')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    targetGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#D48B38')
      .attr('stop-opacity', 0.25);
    targetGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#D48B38')
      .attr('stop-opacity', 0.05);

    // Drop shadow for points
    const filter = defs.append('filter').attr('id', 'pointGlow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // ==========================================
    // VIEW 1: CUMULATIVE TRAJECTORY CURVE
    // ==========================================
    if (viewMode === 'cumulative') {
      // Scales
      const maxVolume = Math.max(
        d3.max(campaignData, (d) => Math.max(d.cumulativeTarget, d.cumulativePlanted)) || 50,
        totals.totalTarget || 50
      );

      const xScale = d3
        .scalePoint<string>()
        .domain(campaignData.map((d) => d.id))
        .range([0, innerWidth])
        .padding(0.35);

      const yLeft = d3
        .scaleLinear()
        .domain([0, Math.ceil(maxVolume * 1.2)])
        .range([innerHeight, 0])
        .nice();

      const yRight = d3
        .scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);

      // Horizontal background grid lines
      const yTicks = yLeft.ticks(5);
      g.append('g')
        .attr('class', 'grid-lines')
        .selectAll('line')
        .data(yTicks)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', (d) => yLeft(d))
        .attr('y2', (d) => yLeft(d))
        .attr('stroke', 'currentColor')
        .attr('stroke-opacity', 0.08)
        .attr('stroke-dasharray', '3 3');

      // Benchmark 80% survival guideline line on the right scale
      const y80 = yRight(80);
      const benchmarkGroup = g.append('g').attr('class', 'benchmark-guide');
      benchmarkGroup
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', y80)
        .attr('y2', y80)
        .attr('stroke', '#52A046')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 4');

      benchmarkGroup
        .append('text')
        .attr('x', innerWidth - 6)
        .attr('y', y80 - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#7EBC8A')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text('80% Standard Benchmark');

      // Area generator for cumulative surviving trees
      const areaSurviving = d3
        .area<CampaignDatum>()
        .x((d) => xScale(d.id) || 0)
        .y0(innerHeight)
        .y1((d) => yLeft(d.cumulativeSurviving))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(campaignData)
        .attr('fill', 'url(#survivingAreaGrad)')
        .attr('d', areaSurviving);

      // Line generators
      // 1. Cumulative Target Line (Amber Dashed)
      const lineTarget = d3
        .line<CampaignDatum>()
        .x((d) => xScale(d.id) || 0)
        .y((d) => yLeft(d.cumulativeTarget))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(campaignData)
        .attr('fill', 'none')
        .attr('stroke', '#D48B38')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '6 5')
        .attr('d', lineTarget);

      // 2. Cumulative Surviving Line (Deep Forest Green)
      const lineSurviving = d3
        .line<CampaignDatum>()
        .x((d) => xScale(d.id) || 0)
        .y((d) => yLeft(d.cumulativeSurviving))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(campaignData)
        .attr('fill', 'none')
        .attr('stroke', '#2D5A34')
        .attr('stroke-width', 3)
        .attr('d', lineSurviving);

      // 3. Cumulative Survival Rate Line (Vibrant Emerald on right axis)
      const lineRate = d3
        .line<CampaignDatum>()
        .x((d) => xScale(d.id) || 0)
        .y((d) => yRight(d.cumulativeSurvivalRate))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(campaignData)
        .attr('fill', 'none')
        .attr('stroke', '#52A046')
        .attr('stroke-width', 3)
        .attr('filter', 'url(#pointGlow)')
        .attr('d', lineRate);

      // Data Points on Lines
      // Target points (Diamonds or amber circles)
      g.selectAll('.dot-target')
        .data(campaignData)
        .enter()
        .append('circle')
        .attr('class', 'dot-target')
        .attr('cx', (d) => xScale(d.id) || 0)
        .attr('cy', (d) => yLeft(d.cumulativeTarget))
        .attr('r', 4.5)
        .attr('fill', '#D48B38')
        .attr('stroke', '#162716')
        .attr('stroke-width', 1.5);

      // Surviving points (Green circles)
      g.selectAll('.dot-surviving')
        .data(campaignData)
        .enter()
        .append('circle')
        .attr('class', 'dot-surviving')
        .attr('cx', (d) => xScale(d.id) || 0)
        .attr('cy', (d) => yLeft(d.cumulativeSurviving))
        .attr('r', 5)
        .attr('fill', '#2D5A34')
        .attr('stroke', '#EDF3EC')
        .attr('stroke-width', 1.5);

      // Survival Rate % points (Emerald circles with rate label)
      const ratePoints = g
        .selectAll('.dot-rate-group')
        .data(campaignData)
        .enter()
        .append('g')
        .attr('class', 'dot-rate-group');

      ratePoints
        .append('circle')
        .attr('cx', (d) => xScale(d.id) || 0)
        .attr('cy', (d) => yRight(d.cumulativeSurvivalRate))
        .attr('r', 5.5)
        .attr('fill', '#52A046')
        .attr('stroke', '#EDF3EC')
        .attr('stroke-width', 2);

      ratePoints
        .append('text')
        .attr('x', (d) => xScale(d.id) || 0)
        .attr('y', (d) => yRight(d.cumulativeSurvivalRate) - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#52A046')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text((d) => `${d.cumulativeSurvivalRate}%`);

      // Axes
      // Left Y-axis (Tree Volume)
      const yAxisLeft = d3.axisLeft(yLeft).ticks(5);
      const leftAxisGroup = g.append('g').attr('class', 'axis-left').call(yAxisLeft);
      leftAxisGroup.select('.domain').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
      leftAxisGroup.selectAll('.tick line').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
      leftAxisGroup.selectAll('.tick text').attr('fill', 'currentColor').attr('font-size', '11px');

      // Left axis label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -38)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('fill-opacity', 0.7)
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('text-transform', 'uppercase')
        .text('Cumulative Trees (Target vs Living)');

      // Right Y-axis (Survival Rate %)
      const yAxisRight = d3
        .axisRight(yRight)
        .ticks(5)
        .tickFormat((d) => `${d}%`);
      const rightAxisGroup = g
        .append('g')
        .attr('class', 'axis-right')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(yAxisRight);
      rightAxisGroup.select('.domain').attr('stroke', '#52A046').attr('stroke-opacity', 0.3);
      rightAxisGroup.selectAll('.tick line').attr('stroke', '#52A046').attr('stroke-opacity', 0.3);
      rightAxisGroup.selectAll('.tick text').attr('fill', '#52A046').attr('font-size', '11px').attr('font-weight', 'bold');

      // Right axis label
      g.append('text')
        .attr('transform', 'rotate(90)')
        .attr('x', innerHeight / 2)
        .attr('y', -(innerWidth + 46))
        .attr('text-anchor', 'middle')
        .attr('fill', '#52A046')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text('Survival Rate %');

      // X-axis (Campaigns)
      const xAxis = d3
        .axisBottom(xScale)
        .tickFormat((d) => {
          const item = campaignData.find((c) => c.id === d);
          return item ? item.shortName : d;
        });

      const xAxisGroup = g
        .append('g')
        .attr('class', 'axis-bottom')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);

      xAxisGroup.select('.domain').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
      xAxisGroup.selectAll('.tick line').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
      xAxisGroup
        .selectAll('.tick text')
        .attr('fill', 'currentColor')
        .attr('font-size', width < 600 ? '9px' : '11px')
        .attr('dy', '1.2em')
        .attr('transform', width < 500 ? 'rotate(-20)' : 'none')
        .attr('text-anchor', width < 500 ? 'end' : 'middle');

      // Hover overlay columns
      const stepWidth = innerWidth / (campaignData.length || 1);
      const hoverGroup = g.append('g').attr('class', 'hover-zones');

      campaignData.forEach((d) => {
        const xPos = xScale(d.id) || 0;
        const col = hoverGroup
          .append('rect')
          .attr('x', xPos - stepWidth / 2)
          .attr('y', 0)
          .attr('width', stepWidth)
          .attr('height', innerHeight)
          .attr('fill', 'transparent')
          .attr('cursor', 'pointer');

        col.on('mouseenter', (event) => {
          setHoveredCampaign(d);
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: mx, y: my });
        });

        col.on('mousemove', (event) => {
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: mx, y: my });
        });

        col.on('mouseleave', () => {
          setHoveredCampaign(null);
          setTooltipPos(null);
        });
      });
    }

    // ==========================================
    // VIEW 2: CAMPAIGN VS TARGET COMPARISON
    // ==========================================
    if (viewMode === 'comparison') {
      const maxCount = Math.max(
        d3.max(campaignData, (d) => Math.max(d.target, d.planted, d.surviving)) || 30,
        30
      );

      const x0 = d3
        .scaleBand()
        .domain(campaignData.map((d) => d.id))
        .range([0, innerWidth])
        .padding(0.28);

      const yLeft = d3
        .scaleLinear()
        .domain([0, Math.ceil(maxCount * 1.25)])
        .range([innerHeight, 0])
        .nice();

      const yRight = d3
        .scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);

      // Grid
      const yTicks = yLeft.ticks(5);
      g.append('g')
        .attr('class', 'grid-lines')
        .selectAll('line')
        .data(yTicks)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', (d) => yLeft(d))
        .attr('y2', (d) => yLeft(d))
        .attr('stroke', 'currentColor')
        .attr('stroke-opacity', 0.08)
        .attr('stroke-dasharray', '3 3');

      // Sub-groups for Target, Planted, Surviving
      const subMetrics = ['target', 'planted', 'surviving'];
      const x1 = d3.scaleBand().domain(subMetrics).range([0, x0.bandwidth()]).padding(0.12);

      const campaignGroups = g
        .selectAll('.campaign-group')
        .data(campaignData)
        .enter()
        .append('g')
        .attr('class', 'campaign-group')
        .attr('transform', (d) => `translate(${x0(d.id)},0)`);

      // Target Bar (Amber / Bronze outline)
      campaignGroups
        .append('rect')
        .attr('x', x1('target') || 0)
        .attr('y', (d) => yLeft(d.target))
        .attr('width', x1.bandwidth())
        .attr('height', (d) => innerHeight - yLeft(d.target))
        .attr('fill', 'url(#targetGrad)')
        .attr('stroke', '#D48B38')
        .attr('stroke-width', 1.5)
        .attr('rx', 2);

      // Target top value text
      campaignGroups
        .append('text')
        .attr('x', (x1('target') || 0) + x1.bandwidth() / 2)
        .attr('y', (d) => yLeft(d.target) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#D48B38')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text((d) => d.target);

      // Planted Bar (Muted Sage)
      campaignGroups
        .append('rect')
        .attr('x', x1('planted') || 0)
        .attr('y', (d) => yLeft(d.planted))
        .attr('width', x1.bandwidth())
        .attr('height', (d) => innerHeight - yLeft(d.planted))
        .attr('fill', '#6E856D')
        .attr('fill-opacity', 0.5)
        .attr('rx', 2);

      // Surviving Bar (Rich Forest Green)
      campaignGroups
        .append('rect')
        .attr('x', x1('surviving') || 0)
        .attr('y', (d) => yLeft(d.surviving))
        .attr('width', x1.bandwidth())
        .attr('height', (d) => innerHeight - yLeft(d.surviving))
        .attr('fill', '#2D5A34')
        .attr('stroke', '#7EBC8A')
        .attr('stroke-width', 1)
        .attr('rx', 2);

      // Surviving top value text
      campaignGroups
        .append('text')
        .attr('x', (x1('surviving') || 0) + x1.bandwidth() / 2)
        .attr('y', (d) => yLeft(d.surviving) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#7EBC8A')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text((d) => d.surviving);

      // Campaign Individual Survival Rate % line & dots overlay
      const lineRate = d3
        .line<CampaignDatum>()
        .x((d) => (x0(d.id) || 0) + x0.bandwidth() / 2)
        .y((d) => yRight(d.survivalPct))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(campaignData)
        .attr('fill', 'none')
        .attr('stroke', '#52A046')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '4 3')
        .attr('d', lineRate);

      const rateDots = g
        .selectAll('.cmp-rate-group')
        .data(campaignData)
        .enter()
        .append('g')
        .attr('class', 'cmp-rate-group');

      rateDots
        .append('circle')
        .attr('cx', (d) => (x0(d.id) || 0) + x0.bandwidth() / 2)
        .attr('cy', (d) => yRight(d.survivalPct))
        .attr('r', 5)
        .attr('fill', '#52A046')
        .attr('stroke', '#EDF3EC')
        .attr('stroke-width', 1.5);

      rateDots
        .append('text')
        .attr('x', (d) => (x0(d.id) || 0) + x0.bandwidth() / 2)
        .attr('y', (d) => yRight(d.survivalPct) - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', '#52A046')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text((d) => `${d.survivalPct}%`);

      // Left Y-axis
      const yAxisLeft = d3.axisLeft(yLeft).ticks(5);
      const leftAxisGroup = g.append('g').attr('class', 'axis-left').call(yAxisLeft);
      leftAxisGroup.select('.domain').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
      leftAxisGroup.selectAll('.tick line').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
      leftAxisGroup.selectAll('.tick text').attr('fill', 'currentColor').attr('font-size', '11px');

      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -38)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('fill-opacity', 0.7)
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text('Trees (Target vs Living)');

      // Right Y-axis
      const yAxisRight = d3
        .axisRight(yRight)
        .ticks(5)
        .tickFormat((d) => `${d}%`);
      const rightAxisGroup = g
        .append('g')
        .attr('class', 'axis-right')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(yAxisRight);
      rightAxisGroup.select('.domain').attr('stroke', '#52A046').attr('stroke-opacity', 0.3);
      rightAxisGroup.selectAll('.tick line').attr('stroke', '#52A046').attr('stroke-opacity', 0.3);
      rightAxisGroup.selectAll('.tick text').attr('fill', '#52A046').attr('font-size', '11px').attr('font-weight', 'bold');

      // X-axis
      const xAxis = d3
        .axisBottom(x0)
        .tickFormat((d) => {
          const item = campaignData.find((c) => c.id === d);
          return item ? item.shortName : d;
        });

      const xAxisGroup = g
        .append('g')
        .attr('class', 'axis-bottom')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);

      xAxisGroup.select('.domain').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
      xAxisGroup.selectAll('.tick line').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
      xAxisGroup
        .selectAll('.tick text')
        .attr('fill', 'currentColor')
        .attr('font-size', width < 600 ? '9px' : '11px')
        .attr('dy', '1.2em')
        .attr('transform', width < 500 ? 'rotate(-20)' : 'none')
        .attr('text-anchor', width < 500 ? 'end' : 'middle');

      // Hover zone across the band
      campaignGroups
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', x0.bandwidth())
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          setHoveredCampaign(d);
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: mx, y: my });
        })
        .on('mousemove', (event, d) => {
          setHoveredCampaign(d);
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: mx, y: my });
        })
        .on('mouseleave', () => {
          setHoveredCampaign(null);
          setTooltipPos(null);
        });
    }
  }, [dimensions, campaignData, viewMode, totals]);

  return (
    <div
      id="campaign-d3-survival-analysis"
      className={`onearth-card p-5 sm:p-7 space-y-6 shadow-sm border border-[#E2DDD2] dark:border-[#223826] bg-[#FBF8EF] dark:bg-[#101C12] ${className}`}
    >
      {/* Editorial Header & Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DDD2] dark:border-[#223826] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2D5A34] dark:text-[#7EBC8A] font-mono mb-1">
            <TrendingUp className="w-4 h-4 text-[#5EA46C]" />
            <span>{t('dashboard.d3Section.badge', 'D3.js Analytical Engine • Community Cohorts')}</span>
          </div>
          <h2 className="font-['Fraunces'] text-xl sm:text-2xl font-bold text-[#162716] dark:text-[#EDF3EC]">
            {t('dashboard.d3Section.heading', 'Cumulative Survival Rate vs. Initial Planting Targets')}
          </h2>
          <p className="text-xs sm:text-sm text-[#5E725B] dark:text-[#8FA58C] font-light max-w-2xl mt-0.5 leading-relaxed">
            {t(
              'dashboard.d3Section.subheading',
              'Longitudinal comparison showing cumulative verified living saplings against initial planting targets across all community reforestation campaigns.'
            )}
          </p>
        </div>

        {/* View Mode Toggle Button Group */}
        <div className="flex items-center gap-1.5 self-start md:self-auto p-1 rounded-lg bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826]">
          <button
            type="button"
            onClick={() => setViewMode('cumulative')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'cumulative'
                ? 'bg-[#2D5A34] text-white shadow-xs'
                : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-[#EDF3EC]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t('dashboard.d3Section.viewCumulative', 'Cumulative Trajectory')}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('comparison')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'comparison'
                ? 'bg-[#2D5A34] text-white shadow-xs'
                : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-[#EDF3EC]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{t('dashboard.d3Section.viewComparison', 'Campaign vs. Target')}</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Ribbon across all campaigns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Target */}
        <div className="p-3.5 rounded-xl border border-[#E2DDD2] dark:border-[#223826] bg-[#F8F6F1] dark:bg-[#162716]/60 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#D48B38] uppercase">
            <span>{t('dashboard.d3Section.totalTarget', 'Total Targets')}</span>
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-['Fraunces'] font-bold text-[#162716] dark:text-[#EDF3EC]">
            {totals.totalTarget}
          </div>
          <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C]">
            Initial seedling quotas
          </div>
        </div>

        {/* Total Planted */}
        <div className="p-3.5 rounded-xl border border-[#E2DDD2] dark:border-[#223826] bg-[#F8F6F1] dark:bg-[#162716]/60 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#5E725B] dark:text-[#8FA58C] uppercase">
            <span>{t('dashboard.d3Section.totalPlanted', 'Planted to Date')}</span>
            <Trees className="w-3.5 h-3.5 text-[#5EA46C]" />
          </div>
          <div className="text-2xl font-['Fraunces'] font-bold text-[#162716] dark:text-[#EDF3EC]">
            {totals.totalPlanted}
          </div>
          <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C]">
            Registered in campaigns
          </div>
        </div>

        {/* Total Surviving */}
        <div className="p-3.5 rounded-xl border border-[#2D5A34]/40 dark:border-[#2D5A34]/50 bg-[#2D5A34]/10 dark:bg-[#2D5A34]/20 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#2D5A34] dark:text-[#7EBC8A] uppercase font-semibold">
            <span>{t('dashboard.d3Section.totalSurviving', 'Living Trees')}</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-['Fraunces'] font-bold text-[#2D5A34] dark:text-[#7EBC8A]">
            {totals.totalSurviving}
          </div>
          <div className="text-[10px] text-[#2D5A34]/80 dark:text-[#7EBC8A]/80 font-medium">
            Healthy & monitored
          </div>
        </div>

        {/* Cumulative Survival Rate */}
        <div className="p-3.5 rounded-xl border border-[#52A046]/40 dark:border-[#52A046]/50 bg-[#52A046]/10 dark:bg-[#52A046]/20 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#52A046] uppercase font-bold">
            <span>{t('dashboard.d3Section.cumulativeRate', 'Cumulative Survival')}</span>
            <Award className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-['Fraunces'] font-bold text-[#52A046]">
            {totals.cumulativeSurvivalRate}%
          </div>
          <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C]">
            ({totals.totalSurviving}/{totals.totalPlanted} living)
          </div>
        </div>

        {/* Target Attainment */}
        <div className="p-3.5 rounded-xl border border-[#E2DDD2] dark:border-[#223826] bg-[#F8F6F1] dark:bg-[#162716]/60 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#D48B38] uppercase">
            <span>{t('dashboard.d3Section.targetAttainment', 'Target Fulfillment')}</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-['Fraunces'] font-bold text-[#162716] dark:text-[#EDF3EC]">
            {totals.targetAttainmentRate}%
          </div>
          <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C]">
            Net living vs. initial targets
          </div>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#E2DDD2] dark:border-[#223826] pb-3 text-[#5E725B] dark:text-[#8FA58C]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#D48B38]" />
            <span className="font-medium text-[#162716] dark:text-[#EDF3EC]">
              {t('dashboard.d3Section.legendInitialTarget', 'Initial Planting Target')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#2D5A34]" />
            <span className="font-medium text-[#162716] dark:text-[#EDF3EC]">
              {t('dashboard.d3Section.legendSurviving', 'Surviving Trees (Living)')}
            </span>
          </div>

          {viewMode === 'comparison' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#6E856D]/60" />
              <span className="font-medium text-[#162716] dark:text-[#EDF3EC]">
                {t('dashboard.d3Section.legendPlanted', 'Planted Seedlings')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#52A046]" />
            <span className="w-2 h-2 rounded-full bg-[#52A046]" />
            <span className="font-medium text-[#52A046] font-bold">
              {viewMode === 'cumulative'
                ? t('dashboard.d3Section.legendCumulativeRate', 'Cumulative Survival Rate (%)')
                : t('dashboard.d3Section.legendCampaignRate', 'Campaign Survival Rate (%)')}
            </span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#5E725B] dark:text-[#8FA58C] flex items-center gap-1">
          <Info className="w-3 h-3 text-[#5EA46C]" />
          <span>Hover data points to inspect campaign metrics</span>
        </div>
      </div>

      {/* D3 Render Area Container with Relative Sizing & Tooltip */}
      <div
        ref={containerRef}
        className="w-full relative min-h-[340px] select-none text-[#162716] dark:text-[#EDF3EC]"
      >
        <svg ref={svgRef} className="overflow-visible block" role="img" aria-label="D3 Campaign Survival Visualization" />

        {/* Floating Tooltip positioned over the chart */}
        {hoveredCampaign && tooltipPos && (
          <div
            className="absolute z-20 pointer-events-none p-3.5 rounded-xl bg-[#101C12]/95 text-[#EDF3EC] border border-[#2D5A34] shadow-xl backdrop-blur-sm text-xs space-y-2 w-64 max-w-xs transition-all duration-75"
            style={{
              left: Math.min(tooltipPos.x + 16, dimensions.width - 270),
              top: Math.max(10, Math.min(tooltipPos.y - 40, dimensions.height - 180)),
            }}
          >
            <div className="border-b border-white/10 pb-1.5">
              <div className="text-[10px] uppercase font-mono text-[#7EBC8A] font-semibold">
                Cohort #{hoveredCampaign.stepIndex} • {hoveredCampaign.startDate}
              </div>
              <div className="font-['Fraunces'] font-bold text-sm text-white truncate">
                {hoveredCampaign.name}
              </div>
              <div className="text-[10px] text-[#A7BF9E] truncate">
                {hoveredCampaign.organizer}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#8FA58C] block text-[10px]">Initial Target</span>
                <span className="font-mono font-bold text-[#D48B38] text-xs">
                  {hoveredCampaign.target} trees
                </span>
              </div>
              <div>
                <span className="text-[#8FA58C] block text-[10px]">Planted</span>
                <span className="font-mono font-bold text-white text-xs">
                  {hoveredCampaign.planted} trees
                </span>
              </div>
              <div>
                <span className="text-[#8FA58C] block text-[10px]">Living (Healthy+Watch)</span>
                <span className="font-mono font-bold text-[#7EBC8A] text-xs">
                  {hoveredCampaign.surviving} trees
                </span>
              </div>
              <div>
                <span className="text-[#8FA58C] block text-[10px]">Cohort Survival</span>
                <span
                  className={`font-mono font-bold text-xs ${
                    hoveredCampaign.survivalPct >= 80 ? 'text-[#7EBC8A]' : 'text-[#D48B38]'
                  }`}
                >
                  {hoveredCampaign.survivalPct}%
                </span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#8FA58C]">Cumulative Rate:</span>
              <span className="font-bold text-[#52A046] text-xs">
                {hoveredCampaign.cumulativeSurvivalRate}% ({hoveredCampaign.cumulativeSurviving}/
                {hoveredCampaign.cumulativePlanted})
              </span>
            </div>

            <div className="text-[10px] text-[#A7BF9E] italic flex items-center justify-between">
              <span>Target variance:</span>
              <span
                className={
                  hoveredCampaign.surviving >= hoveredCampaign.target
                    ? 'text-[#7EBC8A] font-semibold'
                    : 'text-[#E5BA5A]'
                }
              >
                {hoveredCampaign.surviving >= hoveredCampaign.target
                  ? `+${hoveredCampaign.surviving - hoveredCampaign.target} surplus`
                  : `-${hoveredCampaign.target - hoveredCampaign.surviving} deficit`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Ledger Table Drawer */}
      <div className="pt-2 border-t border-[#E2DDD2] dark:border-[#223826]">
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="flex items-center justify-between w-full text-xs font-semibold text-[#162716] dark:text-[#EDF3EC] hover:text-[#2D5A34] dark:hover:text-[#7EBC8A] transition-colors py-2 cursor-pointer"
        >
          <div className="flex items-center gap-2 font-mono uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#5EA46C]" />
            <span>
              {showTable
                ? 'Hide Community Campaign Cross-Tabulation'
                : `View Campaign Cross-Tabulation (${campaignData.length} Campaigns)`}
            </span>
          </div>
          {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTable && (
          <div className="overflow-x-auto mt-3 border border-[#E2DDD2] dark:border-[#223826] rounded-xl">
            <table className="w-full text-left text-xs text-[#162716] dark:text-[#EDF3EC]">
              <thead className="bg-black/5 dark:bg-white/5 font-mono text-[11px] text-[#5E725B] dark:text-[#8FA58C] border-b border-[#E2DDD2] dark:border-[#223826]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Area</th>
                  <th className="py-2.5 px-3 text-right">Target</th>
                  <th className="py-2.5 px-3 text-right">Planted</th>
                  <th className="py-2.5 px-3 text-right">Living</th>
                  <th className="py-2.5 px-3 text-right">Survival %</th>
                  <th className="py-2.5 px-3 text-right">Cumulative Rate</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD2] dark:divide-[#223826]">
                {campaignData.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono text-[#5E725B] dark:text-[#8FA58C]">
                      {c.stepIndex}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      <div className="truncate max-w-[200px]" title={c.name}>
                        {c.name}
                      </div>
                      <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C] font-normal">
                        {c.organizer}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#5E725B] dark:text-[#8FA58C] truncate max-w-[140px]">
                      {c.area}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#D48B38]">
                      {c.target}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#5E725B] dark:text-[#8FA58C]">
                      {c.planted}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2D5A34] dark:text-[#7EBC8A]">
                      {c.surviving}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-md font-semibold text-[11px] ${
                          c.survivalPct >= 80
                            ? 'bg-[#2D5A34]/15 text-[#2D5A34] dark:text-[#7EBC8A]'
                            : c.survivalPct >= 60
                            ? 'bg-[#D48B38]/15 text-[#D48B38]'
                            : 'bg-[#A6432D]/15 text-[#A6432D]'
                        }`}
                      >
                        {c.survivalPct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#52A046]">
                      {c.cumulativeSurvivalRate}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Link
                        to={`/campaigns/${c.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D5A34] dark:text-[#7EBC8A] hover:underline"
                      >
                        <span>Details</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
