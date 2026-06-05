"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, HelpCircle, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Question } from '@/lib/types';

// Preset colors for pie slices and bars
const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
];

// Helper to calculate SVG Pie Slice Path
function getPieSlicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  // SVG coordinates use standard screen coordinates (0,0 in top-left)
  // Shift angles by -90 degrees so 0 points up
  const sAngle = (startAngle - 90) * (Math.PI / 180);
  const eAngle = (endAngle - 90) * (Math.PI / 180);

  const x1 = cx + r * Math.cos(sAngle);
  const y1 = cy + r * Math.sin(sAngle);
  const x2 = cx + r * Math.cos(eAngle);
  const y2 = cy + r * Math.sin(eAngle);

  // Large arc flag is 1 if slice is > 180 degrees
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

// Coordinate grid dimensions
const GRID_SIZE = 360;
const GRID_PADDING = 30;
const GRID_INNER = GRID_SIZE - 2 * GRID_PADDING; // 300px
const HALF_GRID_INNER = GRID_INNER / 2;

// Maps graph coordinates (e.g. -10 to 10) to SVG pixel coordinates
function toPixel(val: number, isY: boolean): number {
  if (isY) {
    // Invert Y axis
    return GRID_PADDING + HALF_GRID_INNER - (val * (HALF_GRID_INNER / 10));
  } else {
    return GRID_PADDING + HALF_GRID_INNER + (val * (HALF_GRID_INNER / 10));
  }
}

// Maps SVG pixel coordinates back to graph coordinates (rounded to nearest integer)
function toGraphCoord(pixel: number, isY: boolean): number {
  const rel = pixel - GRID_PADDING - HALF_GRID_INNER;
  const unit = HALF_GRID_INNER / 10;
  const raw = rel / unit;
  const rounded = Math.round(raw);
  const clamped = Math.max(-10, Math.min(10, rounded));
  return isY ? -clamped : clamped;
}

// ==========================================
// 1. TEACHER CONFIGURATOR / CREATOR
// ==========================================
export function GraphQuestionCreator({
  question,
  onChange
}: {
  question: Question;
  onChange: (updates: Partial<Question>) => void;
}) {
  const graphType = question.graphType || 'pie';
  const graphData = question.graphData || getDefaultGraphData(graphType);

  // Ensure graphData matches current graphType
  useEffect(() => {
    if (!question.graphType) {
      onChange({
        graphType: 'pie',
        graphData: getDefaultGraphData('pie'),
        correctAnswer: [40, 30, 30]
      });
    }
  }, [question.graphType, onChange]);

  function getDefaultGraphData(type: string) {
    if (type === 'pie') {
      return {
        categories: [
          { label: 'Kategorie A', color: PRESET_COLORS[0] },
          { label: 'Kategorie B', color: PRESET_COLORS[1] },
          { label: 'Kategorie C', color: PRESET_COLORS[2] },
        ]
      };
    } else if (type === 'bar') {
      return {
        maxY: 10,
        categories: [
          { label: 'Pondělí', color: PRESET_COLORS[0] },
          { label: 'Úterý', color: PRESET_COLORS[1] },
          { label: 'Středa', color: PRESET_COLORS[2] },
          { label: 'Čtvrtek', color: PRESET_COLORS[3] },
        ]
      };
    } else if (type === 'linear') {
      return {
        a: 1, // slope: y = ax + b
        b: 0 // intercept
      };
    } else {
      return {};
    }
  }

  const handleTypeChange = (newType: 'pie' | 'bar' | 'linear') => {
    const defaultData = getDefaultGraphData(newType);
    let defaultAns: any = null;
    if (newType === 'pie') defaultAns = [40, 30, 30];
    else if (newType === 'bar') defaultAns = [4, 8, 6, 5];
    else if (newType === 'linear') defaultAns = { a: 1, b: 0 };

    onChange({
      graphType: newType,
      graphData: defaultData,
      correctAnswer: defaultAns
    });
  };

  // Pie & Bar Chart Config Helpers
  const addCategory = () => {
    if (graphType !== 'pie' && graphType !== 'bar') return;
    const cats = [...(graphData.categories || [])];
    const newIdx = cats.length;
    cats.push({
      label: `Kategorie ${String.fromCharCode(65 + newIdx)}`,
      color: PRESET_COLORS[newIdx % PRESET_COLORS.length]
    });
    
    const newGraphData = { ...graphData, categories: cats };
    const newAns = Array.isArray(question.correctAnswer) ? [...question.correctAnswer, 5] : [5];

    onChange({
      graphData: newGraphData,
      correctAnswer: newAns
    });
  };

  const removeCategory = (index: number) => {
    if (graphType !== 'pie' && graphType !== 'bar') return;
    const cats = [...(graphData.categories || [])];
    if (cats.length <= 1) return;
    cats.splice(index, 1);
    
    const newGraphData = { ...graphData, categories: cats };
    let newAns = Array.isArray(question.correctAnswer) ? [...question.correctAnswer] : [];
    newAns.splice(index, 1);

    onChange({
      graphData: newGraphData,
      correctAnswer: newAns
    });
  };

  const updateCategoryLabel = (index: number, label: string) => {
    if (graphType !== 'pie' && graphType !== 'bar') return;
    const cats = [...(graphData.categories || [])];
    cats[index] = { ...cats[index], label };
    onChange({ graphData: { ...graphData, categories: cats } });
  };

  const updateCategoryValue = (index: number, val: number) => {
    let newAns = Array.isArray(question.correctAnswer) ? [...question.correctAnswer] : [];
    newAns[index] = val;
    onChange({ correctAnswer: newAns });
  };

  // Cartesian Config Helpers
  const updateLinearParams = (a: number, b: number) => {
    onChange({
      graphData: { ...graphData, a, b },
      correctAnswer: { a, b }
    });
  };

  return (
    <div className="space-y-6 mt-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="space-y-2">
        <label className="text-xs font-bold text-primary uppercase tracking-wider block">Typ grafické otázky</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'pie', label: 'Koláčový graf' },
            { id: 'bar', label: 'Sloupcový graf' },
            { id: 'linear', label: 'Lineární funkce' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTypeChange(t.id as any)}
              className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                graphType === t.id
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* PIE CHART CONFIGURATION */}
      {graphType === 'pie' && graphData.categories && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-bold text-gray-700">Položky koláčového grafu (správné odpovědi v %)</h4>
            <Button variant="outline" size="sm" onClick={addCategory} className="rounded-full">
              <Plus className="w-4 h-4 mr-1" /> Přidat výseč
            </Button>
          </div>
          <div className="space-y-3">
            {graphData.categories.map((cat: any, i: number) => {
              const val = (question.correctAnswer as number[])?.[i] ?? 0;
              return (
                <div key={i} className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <Input
                    placeholder="Název položky"
                    value={cat.label}
                    onChange={(e) => updateCategoryLabel(i, e.target.value)}
                    className="flex-1 min-w-[150px] bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-semibold">Správně (%):</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={val}
                      onChange={(e) => updateCategoryValue(i, parseInt(e.target.value) || 0)}
                      className="w-20 text-center font-bold bg-white"
                    />
                  </div>
                  {graphData.categories.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeCategory(i)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-100">
            <span>Součet hodnot: {(question.correctAnswer as number[])?.reduce((a, b) => a + b, 0) ?? 0} %</span>
            <span>💡 Doporučeno rozdělit přesně na 100 %</span>
          </div>
        </div>
      )}

      {/* BAR CHART CONFIGURATION */}
      {graphType === 'bar' && graphData.categories && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-bold text-gray-700">Položky sloupcového grafu (správné výšky sloupců)</h4>
            <Button variant="outline" size="sm" onClick={addCategory} className="rounded-full">
              <Plus className="w-4 h-4 mr-1" /> Přidat sloupec
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-bold uppercase">Maximální hodnota osy Y</label>
              <Input
                type="number"
                min="5"
                max="100"
                value={graphData.maxY || 10}
                onChange={(e) => onChange({ graphData: { ...graphData, maxY: parseInt(e.target.value) || 10 } })}
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-3">
            {graphData.categories.map((cat: any, i: number) => {
              const val = (question.correctAnswer as number[])?.[i] ?? 0;
              return (
                <div key={i} className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <Input
                    placeholder="Název sloupce"
                    value={cat.label}
                    onChange={(e) => updateCategoryLabel(i, e.target.value)}
                    className="flex-1 min-w-[150px] bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-semibold">Správná hodnota:</span>
                    <Input
                      type="number"
                      min="0"
                      max={graphData.maxY || 10}
                      value={val}
                      onChange={(e) => updateCategoryValue(i, Math.min(graphData.maxY || 10, parseInt(e.target.value) || 0))}
                      className="w-20 text-center font-bold bg-white"
                    />
                  </div>
                  {graphData.categories.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeCategory(i)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LINEAR FUNCTION CONFIGURATION */}
      {graphType === 'linear' && (
        <div className="space-y-4">
          <h4 className="font-bold text-gray-700 border-b pb-2">Lineární funkce</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Směrnice a (sklon)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={graphData.a}
                    onChange={(e) => updateLinearParams(parseFloat(e.target.value) || 0, graphData.b)}
                    className="font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Posun b</label>
                  <Input
                    type="number"
                    step="1"
                    value={graphData.b}
                    onChange={(e) => updateLinearParams(graphData.a, parseFloat(e.target.value) || 0)}
                    className="font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border flex flex-col justify-center text-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Předpis funkce</span>
                <span className="text-2xl font-black text-primary mt-1">
                  y = {graphData.a !== 1 ? (graphData.a === -1 ? '-' : graphData.a) : ''}x 
                  {graphData.b > 0 ? ` + ${graphData.b}` : (graphData.b < 0 ? ` - ${Math.abs(graphData.b)}` : '')}
                </span>
              </div>
            </div>

            {/* Live preview grid */}
            <div className="flex justify-center">
              <svg width="240" height="240" viewBox="0 0 360 360" className="border rounded-2xl bg-white shadow-inner">
                <CoordinateGridLines />
                <CoordinateLinePlot a={graphData.a} b={graphData.b} color="#3B82F6" isDashed={false} />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. STUDENT GRAPH SOLVER / INTERACTIVE
// ==========================================
export function GraphQuestionStudent({
  question,
  value,
  onChange,
  disabled = false
}: {
  question: Question;
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
}) {
  const graphType = question.graphType || 'pie';
  const graphData = question.graphData || {};

  // Setup initial student answers
  useEffect(() => {
    if (value === undefined || value === null) {
      if (graphType === 'pie') {
        // Equal division by default
        const count = graphData.categories?.length || 3;
        onChange(Array(count).fill(Math.round(100 / count)));
      } else if (graphType === 'bar') {
        const count = graphData.categories?.length || 3;
        onChange(Array(count).fill(0));
      } else if (graphType === 'linear') {
        onChange([]); // Empty points array
      }
    }
  }, [graphType, graphData, value, onChange]);

  // Render Pie Chart Student View
  if (graphType === 'pie' && graphData.categories) {
    const studentValues = Array.isArray(value) ? value : Array(graphData.categories.length).fill(0);
    const sum = studentValues.reduce((a, b) => a + b, 0);

    // Calculate angles
    let currentAngle = 0;
    const slices = graphData.categories.map((cat: any, i: number) => {
      const val = studentValues[i] ?? 0;
      const angle = sum > 0 ? (val / sum) * 360 : 0;
      const start = currentAngle;
      currentAngle += angle;
      return {
        ...cat,
        value: val,
        startAngle: start,
        endAngle: currentAngle,
        pct: sum > 0 ? Math.round((val / sum) * 100) : 0
      };
    });

    const handleSliderChange = (idx: number, val: number) => {
      if (disabled) return;
      const newVals = [...studentValues];
      newVals[idx] = val;
      onChange(newVals);
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-4 bg-white rounded-2xl border">
        {/* SVG Render */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative w-56 h-56">
            <svg width="220" height="220" viewBox="0 0 300 300" className="transform -rotate-90">
              {sum === 0 ? (
                <circle cx="150" cy="150" r="120" fill="#E5E7EB" />
              ) : (
                slices.map((slice: any, idx: number) => {
                  if (slice.endAngle - slice.startAngle >= 359.99) {
                    return <circle key={idx} cx="150" cy="150" r="120" fill={slice.color} />;
                  }
                  if (slice.endAngle === slice.startAngle) return null;
                  const pathD = getPieSlicePath(150, 150, 120, slice.startAngle, slice.endAngle);
                  return (
                    <path
                      key={idx}
                      d={pathD}
                      fill={slice.color}
                      className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                    />
                  );
                })
              )}
              {/* Inner white circle for donut style */}
              <circle cx="150" cy="150" r="45" fill="#FFFFFF" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-2xl font-black text-slate-800">{sum}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Celkem</span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${sum === 100 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
            {sum === 100 ? '✓ Celkem 100 %' : `⚠ Celkem ${sum} % (upravte na 100 %)`}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          {slices.map((slice: any, i: number) => (
            <div key={i} className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: slice.color }} />
                  {slice.label}
                </span>
                <span className="font-black text-primary text-sm">{slice.value} %</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={disabled}
                value={slice.value}
                onChange={(e) => handleSliderChange(i, parseInt(e.target.value) || 0)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Bar Chart Student View
  if (graphType === 'bar' && graphData.categories) {
    const studentValues = Array.isArray(value) ? value : Array(graphData.categories.length).fill(0);
    const maxY = graphData.maxY || 10;

    const handleSliderChange = (idx: number, val: number) => {
      if (disabled) return;
      const newVals = [...studentValues];
      newVals[idx] = val;
      onChange(newVals);
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-4 bg-white rounded-2xl border">
        {/* SVG Render */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <svg width="280" height="200" viewBox="0 0 300 200" className="border rounded-xl bg-slate-50/30">
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = 20 + ratio * 140;
              const labelVal = Math.round(maxY - ratio * maxY);
              return (
                <g key={i}>
                  <line x1="35" y1={y} x2="280" y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="25" y={y + 4} textAnchor="end" fill="#9CA3AF" fontSize="10" fontWeight="bold">{labelVal}</text>
                </g>
              );
            })}

            {/* Render Bars */}
            {graphData.categories.map((cat: any, i: number) => {
              const val = studentValues[i] ?? 0;
              const barHeight = (val / maxY) * 140;
              const x = 50 + i * (220 / graphData.categories.length);
              const barWidth = Math.min(30, 160 / graphData.categories.length);

              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={160 - barHeight}
                    width={barWidth}
                    height={barHeight}
                    fill={cat.color}
                    rx="4"
                    className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                    onClick={() => {
                      if (!disabled) {
                        // Easy set by clicking on column area
                        handleSliderChange(i, Math.min(maxY, val + 1));
                      }
                    }}
                  />
                  <text
                    x={x + barWidth / 2}
                    y="180"
                    textAnchor="middle"
                    fill="#4B5563"
                    fontSize="9"
                    fontWeight="black"
                    className="truncate max-w-[40px]"
                  >
                    {cat.label.substring(0, 5)}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={152 - barHeight}
                    textAnchor="middle"
                    fill={cat.color}
                    fontSize="10"
                    fontWeight="black"
                  >
                    {val}
                  </text>
                </g>
              );
            })}
            <line x1="35" y1="160" x2="280" y2="160" stroke="#9CA3AF" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          {graphData.categories.map((cat: any, i: number) => {
            const val = studentValues[i] ?? 0;
            return (
              <div key={i} className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                    {cat.label}
                  </span>
                  <span className="font-black text-primary text-sm">{val} / {maxY}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxY}
                  disabled={disabled}
                  value={val}
                  onChange={(e) => handleSliderChange(i, parseInt(e.target.value) || 0)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Coordinate Grid Graph Student View (Linear)
  if (graphType === 'linear') {
    const studentPoints = Array.isArray(value) ? value : [];
    const [hoverPoint, setHoverPoint] = useState<[number, number] | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * GRID_SIZE;
      const py = ((e.clientY - rect.top) / rect.height) * GRID_SIZE;
      
      const x = toGraphCoord(px, false);
      const y = toGraphCoord(py, true);

      setHoverPoint([x, y]);
    };

    const handleMouseLeave = () => {
      setHoverPoint(null);
    };

    const handleGridClick = () => {
      if (disabled || !hoverPoint) return;
      const [hx, hy] = hoverPoint;
      
      // Check if point already exists
      const exists = studentPoints.some(([x, y]) => x === hx && y === hy);
      if (exists) {
        // Remove point
        const filtered = studentPoints.filter(([x, y]) => !(x === hx && y === hy));
        onChange(filtered);
      } else {
        // Add point
        if (studentPoints.length >= 2) {
          // Replace last point for linear (max 2 points define a line)
          onChange([studentPoints[0], [hx, hy]]);
        } else {
          onChange([...studentPoints, [hx, hy]]);
        }
      }
    };

    // Calculate student equations for lines if 2 points are selected
    let studentLine: { a: number, b: number } | null = null;
    if (studentPoints.length === 2) {
      const [p1, p2] = studentPoints;
      if (p1[0] !== p2[0]) {
        const a = (p2[1] - p1[1]) / (p2[0] - p1[0]);
        const b = p1[1] - a * p1[0];
        studentLine = { a, b };
      }
    }

    return (
      <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-white rounded-2xl border justify-center">
        {/* Interactive SVG */}
        <div className="relative">
          <svg
            ref={svgRef}
            width={GRID_SIZE}
            height={GRID_SIZE}
            viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleGridClick}
            className={`border-2 rounded-2xl bg-white shadow-md relative ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
          >
            {/* Draw Gridlines and Axes */}
            <CoordinateGridLines />

            {/* Hover Guide Point */}
            {!disabled && hoverPoint && (
              <>
                <line
                  x1={GRID_PADDING}
                  y1={toPixel(hoverPoint[1], true)}
                  x2={GRID_SIZE - GRID_PADDING}
                  y2={toPixel(hoverPoint[1], true)}
                  stroke="#3B82F6"
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                  opacity="0.6"
                />
                <line
                  x1={toPixel(hoverPoint[0], false)}
                  y1={GRID_PADDING}
                  x2={toPixel(hoverPoint[0], false)}
                  y2={GRID_SIZE - GRID_PADDING}
                  stroke="#3B82F6"
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                  opacity="0.6"
                />
                <circle
                  cx={toPixel(hoverPoint[0], false)}
                  cy={toPixel(hoverPoint[1], true)}
                  r="6"
                  fill="#3B82F6"
                  opacity="0.4"
                />
              </>
            )}

            {/* Render student points */}
            {studentPoints.map(([x, y], idx) => (
              <circle
                key={idx}
                cx={toPixel(x, false)}
                cy={toPixel(y, true)}
                r="7"
                fill="#EF4444"
                stroke="#FFFFFF"
                strokeWidth="2"
                className="shadow-sm transition-all hover:scale-125"
              />
            ))}

            {/* Dynamic line connecting two points */}
            {studentLine && (
              <CoordinateLinePlot a={studentLine.a} b={studentLine.b} color="#EF4444" isDashed={false} />
            )}
          </svg>

          {/* Coordinate overlay tooltip */}
          {!disabled && hoverPoint && (
            <div className="absolute top-2 left-2 bg-slate-800/90 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow pointer-events-none">
              Bod: [{hoverPoint[0]}, {hoverPoint[1]}]
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="flex-1 space-y-4 max-w-sm">
          <div className="space-y-1">
            <h4 className="font-bold text-gray-700">Návod k vyřešení:</h4>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
              <li>Kliknutím do mřížky umístíte bod na celočíselné souřadnice.</li>
              <li>Opětovným kliknutím na existující bod ho odeberete.</li>
              <li>K vytyčení přímky musíte umístit přesně <strong>2 body</strong>.</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase">Vytyčené body:</span>
              <Badge variant="outline" className="font-bold">
                {studentPoints.length} bod{studentPoints.length === 1 ? '' : (studentPoints.length >= 2 && studentPoints.length <= 4 ? 'y' : 'ů')}
              </Badge>
            </div>
            
            {studentPoints.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {studentPoints.map(([x, y], i) => (
                  <Badge key={i} className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 font-bold text-[10px]">
                    [{x}, {y}]
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-xs italic text-gray-400 block">Zatím nebyly zvoleny žádné body.</span>
            )}

            {/* Dynamic Equation feedback */}
            {studentLine && (
              <div className="pt-2 border-t text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Vámi vytyčená funkce</span>
                <span className="text-sm font-black text-red-600">
                  y = {studentLine.a !== 1 ? (studentLine.a === -1 ? '-' : studentLine.a) : ''}x 
                  {studentLine.b > 0 ? ` + ${studentLine.b}` : (studentLine.b < 0 ? ` - ${Math.abs(studentLine.b)}` : '')}
                </span>
              </div>
            )}
          </div>

          {!disabled && studentPoints.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange([])}
              className="w-full text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl border-dashed"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Resetovat body
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ==========================================
// 3. TEACHER / STUDENT GRAPH EVALUATOR
// ==========================================
export function GraphQuestionEvaluation({
  question,
  studentAnswer,
  score,
  maxPoints = 1
}: {
  question: Question;
  studentAnswer: any;
  score?: number;
  maxPoints?: number;
}) {
  const graphType = question.graphType || 'pie';
  const graphData = question.graphData || {};
  const isCorrect = score === maxPoints;

  // Render Pie Evaluation
  if (graphType === 'pie' && graphData.categories) {
    const studentValues = Array.isArray(studentAnswer) ? studentAnswer : Array(graphData.categories.length).fill(0);
    const correctValues = Array.isArray(question.correctAnswer) ? question.correctAnswer : Array(graphData.categories.length).fill(0);

    const sSum = studentValues.reduce((a, b) => a + b, 0);
    const cSum = correctValues.reduce((a, b) => a + b, 0);

    const sSlices = graphData.categories.map((cat: any, i: number) => {
      const val = studentValues[i] ?? 0;
      return { ...cat, val, pct: sSum > 0 ? Math.round((val / sSum) * 100) : 0 };
    });

    const cSlices = graphData.categories.map((cat: any, i: number) => {
      const val = correctValues[i] ?? 0;
      return { ...cat, val, pct: cSum > 0 ? Math.round((val / cSum) * 100) : 0 };
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-2xl border">
          {/* Student chart */}
          <div className="flex flex-col items-center justify-center space-y-2 bg-white p-4 rounded-xl border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Odpověď žáka</span>
            <div className="w-36 h-36 relative">
              <svg width="140" height="140" viewBox="0 0 300 300" className="transform -rotate-90">
                {sSum === 0 ? (
                  <circle cx="150" cy="150" r="120" fill="#E5E7EB" />
                ) : (
                  renderPieSVG(sSlices, sSum)
                )}
                <circle cx="150" cy="150" r="45" fill="#FFFFFF" />
              </svg>
            </div>
            <div className="w-full space-y-1.5 text-xs pt-2">
              {sSlices.map((slice: any, i: number) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: slice.color }} /> {slice.label}</span>
                  <span className="font-black text-gray-800">{slice.val} %</span>
                </div>
              ))}
            </div>
          </div>

          {/* Correct chart */}
          <div className="flex flex-col items-center justify-center space-y-2 bg-white p-4 rounded-xl border">
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Správné řešení</span>
            <div className="w-36 h-36 relative">
              <svg width="140" height="140" viewBox="0 0 300 300" className="transform -rotate-90">
                {cSum === 0 ? (
                  <circle cx="150" cy="150" r="120" fill="#E5E7EB" />
                ) : (
                  renderPieSVG(cSlices, cSum)
                )}
                <circle cx="150" cy="150" r="45" fill="#FFFFFF" />
              </svg>
            </div>
            <div className="w-full space-y-1.5 text-xs pt-2">
              {cSlices.map((slice: any, i: number) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: slice.color }} /> {slice.label}</span>
                  <span className="font-black text-green-700">{slice.val} %</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Bar Evaluation
  if (graphType === 'bar' && graphData.categories) {
    const studentValues = Array.isArray(studentAnswer) ? studentAnswer : Array(graphData.categories.length).fill(0);
    const correctValues = Array.isArray(question.correctAnswer) ? question.correctAnswer : Array(graphData.categories.length).fill(0);
    const maxY = graphData.maxY || 10;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-2xl border">
          {/* Student chart */}
          <div className="flex flex-col items-center justify-center space-y-2 bg-white p-4 rounded-xl border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Odpověď žáka</span>
            <svg width="200" height="120" viewBox="0 0 300 200" className="border rounded-lg bg-slate-50/20">
              {renderBarGrid(maxY)}
              {graphData.categories.map((cat: any, i: number) => {
                const val = studentValues[i] ?? 0;
                const barHeight = (val / maxY) * 140;
                const x = 50 + i * (220 / graphData.categories.length);
                const barWidth = Math.min(30, 160 / graphData.categories.length);
                return (
                  <g key={i}>
                    <rect x={x} y={160 - barHeight} width={barWidth} height={barHeight} fill={cat.color} rx="3" />
                    <text x={x + barWidth / 2} y="180" textAnchor="middle" fill="#4B5563" fontSize="10">{cat.label.substring(0,4)}</text>
                    <text x={x + barWidth / 2} y={152 - barHeight} textAnchor="middle" fill={cat.color} fontSize="11" fontWeight="bold">{val}</text>
                  </g>
                );
              })}
              <line x1="35" y1="160" x2="280" y2="160" stroke="#9CA3AF" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Correct chart */}
          <div className="flex flex-col items-center justify-center space-y-2 bg-white p-4 rounded-xl border">
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Správné řešení</span>
            <svg width="200" height="120" viewBox="0 0 300 200" className="border rounded-lg bg-slate-50/20">
              {renderBarGrid(maxY)}
              {graphData.categories.map((cat: any, i: number) => {
                const val = correctValues[i] ?? 0;
                const barHeight = (val / maxY) * 140;
                const x = 50 + i * (220 / graphData.categories.length);
                const barWidth = Math.min(30, 160 / graphData.categories.length);
                return (
                  <g key={i}>
                    <rect x={x} y={160 - barHeight} width={barWidth} height={barHeight} fill="#10B981" rx="3" />
                    <text x={x + barWidth / 2} y="180" textAnchor="middle" fill="#4B5563" fontSize="10">{cat.label.substring(0,4)}</text>
                    <text x={x + barWidth / 2} y={152 - barHeight} textAnchor="middle" fill="#047857" fontSize="11" fontWeight="bold">{val}</text>
                  </g>
                );
              })}
              <line x1="35" y1="160" x2="280" y2="160" stroke="#9CA3AF" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Render Coordinate Grid Graph Evaluation View (Linear)
  if (graphType === 'linear') {
    const studentPoints = Array.isArray(studentAnswer) ? studentAnswer : [];

    // Calculate student equations for lines if 2 points are selected
    let studentLine: { a: number, b: number } | null = null;
    if (studentPoints.length === 2) {
      const [p1, p2] = studentPoints;
      if (p1[0] !== p2[0]) {
        const a = (p2[1] - p1[1]) / (p2[0] - p1[0]);
        const b = p1[1] - a * p1[0];
        studentLine = { a, b };
      }
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-2xl border justify-center">
        {/* Student graph */}
        <div className="flex flex-col items-center bg-white p-4 rounded-xl border space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Odpověď žáka</span>
          <svg width="220" height="220" viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`} className="border rounded-xl bg-white shadow-sm">
            <CoordinateGridLines />
            {studentPoints.map(([x, y], idx) => (
              <circle key={idx} cx={toPixel(x, false)} cy={toPixel(y, true)} r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
            ))}
            {studentLine && (
              <CoordinateLinePlot a={studentLine.a} b={studentLine.b} color="#EF4444" isDashed={false} />
            )}
          </svg>
          <div className="text-center pt-1 text-[11px] font-semibold text-gray-500">
            Zvolené body: {studentPoints.length > 0 ? studentPoints.map(([x, y]) => `[${x},${y}]`).join(', ') : 'Žádné'}
          </div>
        </div>

        {/* Correct target graph */}
        <div className="flex flex-col items-center bg-white p-4 rounded-xl border space-y-2">
          <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Správné řešení</span>
          <svg width="220" height="220" viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`} className="border rounded-xl bg-white shadow-sm">
            <CoordinateGridLines />
            <CoordinateLinePlot a={graphData.a || 1} b={graphData.b || 0} color="#10B981" isDashed={false} />
          </svg>
          <div className="text-center pt-1 text-xs font-black text-green-700">
            <span>y = {graphData.a !== 1 ? (graphData.a === -1 ? '-' : graphData.a) : ''}x {graphData.b > 0 ? `+ ${graphData.b}` : (graphData.b < 0 ? `- ${Math.abs(graphData.b)}` : '')}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ==========================================
// INTERNAL SUB-COMPONENTS & SVG PLOTTERS
// ==========================================

// Renders the Cartesian Coordinate Grid Axes, tick lines and numbers
function CoordinateGridLines() {
  const ticks = [-10, -8, -6, -4, -2, 2, 4, 6, 8, 10];
  const gridLines = [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <>
      {/* Grid Lines */}
      {gridLines.map((val) => (
        <React.Fragment key={val}>
          {/* Vertical */}
          <line
            x1={toPixel(val, false)}
            y1={GRID_PADDING}
            x2={toPixel(val, false)}
            y2={GRID_SIZE - GRID_PADDING}
            stroke="#F3F4F6"
            strokeWidth="0.8"
          />
          {/* Horizontal */}
          <line
            x1={GRID_PADDING}
            y1={toPixel(val, true)}
            x2={GRID_SIZE - GRID_PADDING}
            y2={toPixel(val, true)}
            stroke="#F3F4F6"
            strokeWidth="0.8"
          />
        </React.Fragment>
      ))}

      {/* Primary Axes */}
      {/* X Axis */}
      <line
        x1={GRID_PADDING - 10}
        y1={toPixel(0, true)}
        x2={GRID_SIZE - GRID_PADDING + 10}
        y2={toPixel(0, true)}
        stroke="#1F2937"
        strokeWidth="1.8"
      />
      {/* Y Axis */}
      <line
        x1={toPixel(0, false)}
        y1={GRID_PADDING - 10}
        x2={toPixel(0, false)}
        y2={GRID_SIZE - GRID_PADDING + 10}
        stroke="#1F2937"
        strokeWidth="1.8"
      />

      {/* Axis Arrows */}
      <polygon points={`${GRID_SIZE - GRID_PADDING + 14},${toPixel(0, true)} ${GRID_SIZE - GRID_PADDING + 8},${toPixel(0, true) - 4} ${GRID_SIZE - GRID_PADDING + 8},${toPixel(0, true) + 4}`} fill="#1F2937" />
      <polygon points={`${toPixel(0, false)},${GRID_PADDING - 14} ${toPixel(0, false) - 4},${GRID_PADDING - 8} ${toPixel(0, false) + 4},${GRID_PADDING - 8}`} fill="#1F2937" />

      {/* Axis Labels */}
      <text x={GRID_SIZE - GRID_PADDING + 15} y={toPixel(0, true) + 12} fontSize="9" fontWeight="black" fill="#1F2937" textAnchor="end">x</text>
      <text x={toPixel(0, false) - 10} y={GRID_PADDING - 8} fontSize="9" fontWeight="black" fill="#1F2937">y</text>

      {/* Origin dot and zero label */}
      <text x={toPixel(0, false) - 10} y={toPixel(0, true) + 14} fontSize="9" fill="#9CA3AF" fontWeight="semibold">0</text>

      {/* Axis Tick Marks and Numbers */}
      {ticks.map((val) => (
        <React.Fragment key={val}>
          {/* X ticks */}
          <line
            x1={toPixel(val, false)}
            y1={toPixel(0, true) - 3}
            x2={toPixel(val, false)}
            y2={toPixel(0, true) + 3}
            stroke="#1F2937"
            strokeWidth="1.5"
          />
          <text
            x={toPixel(val, false)}
            y={toPixel(0, true) + 14}
            fontSize="8"
            fill="#4B5563"
            fontWeight="bold"
            textAnchor="middle"
          >
            {val}
          </text>

          {/* Y ticks */}
          <line
            x1={toPixel(0, false) - 3}
            y1={toPixel(val, true)}
            x2={toPixel(0, false) + 3}
            y2={toPixel(val, true)}
            stroke="#1F2937"
            strokeWidth="1.5"
          />
          <text
            x={toPixel(0, false) - 12}
            y={toPixel(val, true) + 3}
            fontSize="8"
            fill="#4B5563"
            fontWeight="bold"
            textAnchor="end"
          >
            {val}
          </text>
        </React.Fragment>
      ))}
    </>
  );
}

// Plots an infinite line on the coordinate plane from equation parameters: y = ax + b
function CoordinateLinePlot({
  a,
  b,
  color = "#3B82F6",
  isDashed = false
}: {
  a: number;
  b: number;
  color?: string;
  isDashed?: boolean;
}) {
  // We clip the line endpoints inside X in [-10, 10]
  // Y at X = -10 is -10a + b
  // Y at X = 10 is 10a + b
  const yStart = -10 * a + b;
  const yEnd = 10 * a + b;

  // Map to SVG coordinates
  const x1 = toPixel(-10, false);
  const y1 = toPixel(yStart, true);
  const x2 = toPixel(10, false);
  const y2 = toPixel(yEnd, true);

  return (
    <>
      {/* Decorative Glow */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="6"
        opacity="0.15"
        strokeLinecap="round"
      />
      {/* Core line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={isDashed ? "4,4" : undefined}
        strokeLinecap="round"
      />
    </>
  );
}

// Plots a curve representing y = k/x on the coordinate plane
function CoordinateHyperbolaPlot({
  k,
  color = "#3B82F6",
  isDashed = false
}: {
  k: number;
  color?: string;
  isDashed?: boolean;
}) {
  if (k === 0) return null;

  // Samples points for the curve
  // Quadrant 1/4 (x > 0): from x = 0.1 to x = 10
  const pointsQ1: string[] = [];
  const pointsQ3: string[] = [];

  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const xQ1 = 0.2 + (9.8 * i) / steps;
    const yQ1 = k / xQ1;
    if (yQ1 >= -10.5 && yQ1 <= 10.5) {
      pointsQ1.push(`${toPixel(xQ1, false)},${toPixel(yQ1, true)}`);
    }

    const xQ3 = -10 + (9.8 * i) / steps;
    const yQ3 = k / xQ3;
    if (yQ3 >= -10.5 && yQ3 <= 10.5) {
      pointsQ3.push(`${toPixel(xQ3, false)},${toPixel(yQ3, true)}`);
    }
  }

  const dQ1 = pointsQ1.length > 0 ? `M ${pointsQ1.join(' L ')}` : '';
  const dQ3 = pointsQ3.length > 0 ? `M ${pointsQ3.join(' L ')}` : '';

  return (
    <>
      {/* Quadrant 1 / 4 curve */}
      {dQ1 && (
        <>
          <path d={dQ1} fill="none" stroke={color} strokeWidth="5" opacity="0.15" strokeLinecap="round" />
          <path d={dQ1} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray={isDashed ? "4,4" : undefined} strokeLinecap="round" />
        </>
      )}

      {/* Quadrant 3 / 2 curve */}
      {dQ3 && (
        <>
          <path d={dQ3} fill="none" stroke={color} strokeWidth="5" opacity="0.15" strokeLinecap="round" />
          <path d={dQ3} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray={isDashed ? "4,4" : undefined} strokeLinecap="round" />
        </>
      )}
    </>
  );
}

// Local helper to draw SVG pie slices in the evaluation view
function renderPieSVG(slices: any[], sum: number) {
  let currentAngle = 0;
  return slices.map((slice: any, idx: number) => {
    const angle = sum > 0 ? (slice.val / sum) * 360 : 0;
    const start = currentAngle;
    currentAngle += angle;

    if (angle >= 359.99) {
      return <circle key={idx} cx="150" cy="150" r="120" fill={slice.color} />;
    }
    if (angle === 0) return null;
    const pathD = getPieSlicePath(150, 150, 120, start, currentAngle);
    return <path key={idx} d={pathD} fill={slice.color} />;
  });
}

// Local helper to draw grid lines for the evaluation bar chart
function renderBarGrid(maxY: number) {
  return [0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
    const y = 20 + ratio * 140;
    const labelVal = Math.round(maxY - ratio * maxY);
    return (
      <g key={i}>
        <line x1="35" y1={y} x2="280" y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
        <text x="25" y={y + 4} textAnchor="end" fill="#9CA3AF" fontSize="9">{labelVal}</text>
      </g>
    );
  });
}

export function AxisQuestionCreator({
  question,
  onChange
}: {
  question: Question;
  onChange: (updates: Partial<Question>) => void;
}) {
  const correctPoints = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
  const [hoverPoint, setHoverPoint] = useState<[number, number] | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * GRID_SIZE;
    const py = ((e.clientY - rect.top) / rect.height) * GRID_SIZE;
    
    const x = toGraphCoord(px, false);
    const y = toGraphCoord(py, true);

    setHoverPoint([x, y]);
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
  };

  const handleGridClick = () => {
    if (!hoverPoint) return;
    const [hx, hy] = hoverPoint;
    
    const exists = correctPoints.some(([x, y]) => x === hx && y === hy);
    if (exists) {
      const filtered = correctPoints.filter(([x, y]) => !(x === hx && y === hy));
      onChange({ correctAnswer: filtered });
    } else {
      onChange({ correctAnswer: [...correctPoints, [hx, hy]] });
    }
  };

  return (
    <div className="space-y-6 mt-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
        {/* Interactive Grid */}
        <div className="relative">
          <svg
            ref={svgRef}
            width={280}
            height={280}
            viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleGridClick}
            className="border-2 rounded-2xl bg-white shadow-md relative cursor-crosshair"
          >
            <CoordinateGridLines />

            {/* Hover Point */}
            {hoverPoint && (
              <>
                <line x1={GRID_PADDING} y1={toPixel(hoverPoint[1], true)} x2={GRID_SIZE - GRID_PADDING} y2={toPixel(hoverPoint[1], true)} stroke="#10B981" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
                <line x1={toPixel(hoverPoint[0], false)} y1={GRID_PADDING} x2={toPixel(hoverPoint[0], false)} y2={GRID_SIZE - GRID_PADDING} stroke="#10B981" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
                <circle cx={toPixel(hoverPoint[0], false)} cy={toPixel(hoverPoint[1], true)} r="5" fill="#10B981" opacity="0.4" />
              </>
            )}

            {/* Correct Points */}
            {correctPoints.map(([x, y], idx) => (
              <circle
                key={idx}
                cx={toPixel(x, false)}
                cy={toPixel(y, true)}
                r="6"
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth="2"
                className="shadow-sm transition-all hover:scale-125"
              />
            ))}
          </svg>
          
          {hoverPoint && (
            <div className="absolute top-2 left-2 bg-slate-800/90 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow pointer-events-none">
              Bod: [{hoverPoint[0]}, {hoverPoint[1]}]
            </div>
          )}
        </div>

        {/* Panel */}
        <div className="flex-1 space-y-4 max-w-sm">
          <div className="space-y-1">
            <h4 className="font-bold text-gray-700">Nastavení správných bodů:</h4>
            <p className="text-xs text-muted-foreground">Kliknutím do mřížky přidáte nebo odeberete body, které musí žák přesně označit jako správné řešení.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase font-headline">Správné body ({correctPoints.length}):</span>
              {correctPoints.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => onChange({ correctAnswer: [] })} className="h-7 text-xs text-destructive hover:bg-destructive/5 font-bold">
                  Smazat vše
                </Button>
              )}
            </div>
            
            {correctPoints.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {correctPoints.map(([x, y], i) => (
                  <Badge key={i} className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 font-bold text-[10px]">
                    [{x}, {y}]
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-xs italic text-gray-400 block py-1">Klikněte do mřížky pro přidání bodů.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AxisQuestionStudent({
  question,
  value,
  onChange,
  disabled = false
}: {
  question: Question;
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
}) {
  const studentPoints = Array.isArray(value) ? value : [];
  const [hoverPoint, setHoverPoint] = useState<[number, number] | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Initialize value if empty
  useEffect(() => {
    if (value === undefined || value === null) {
      onChange([]);
    }
  }, [value, onChange]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * GRID_SIZE;
    const py = ((e.clientY - rect.top) / rect.height) * GRID_SIZE;
    
    const x = toGraphCoord(px, false);
    const y = toGraphCoord(py, true);

    setHoverPoint([x, y]);
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
  };

  const handleGridClick = () => {
    if (disabled || !hoverPoint) return;
    const [hx, hy] = hoverPoint;
    
    const exists = studentPoints.some(([x, y]) => x === hx && y === hy);
    if (exists) {
      const filtered = studentPoints.filter(([x, y]) => !(x === hx && y === hy));
      onChange(filtered);
    } else {
      onChange([...studentPoints, [hx, hy]]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-white rounded-2xl border justify-center">
      {/* Interactive SVG */}
      <div className="relative">
        <svg
          ref={svgRef}
          width={GRID_SIZE}
          height={GRID_SIZE}
          viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleGridClick}
          className={`border-2 rounded-2xl bg-white shadow-md relative ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
        >
          <CoordinateGridLines />

          {/* Hover Guide Point */}
          {!disabled && hoverPoint && (
            <>
              <line x1={GRID_PADDING} y1={toPixel(hoverPoint[1], true)} x2={GRID_SIZE - GRID_PADDING} y2={toPixel(hoverPoint[1], true)} stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
              <line x1={toPixel(hoverPoint[0], false)} y1={GRID_PADDING} x2={toPixel(hoverPoint[0], false)} y2={GRID_SIZE - GRID_PADDING} stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
              <circle cx={toPixel(hoverPoint[0], false)} cy={toPixel(hoverPoint[1], true)} r="6" fill="#3B82F6" opacity="0.4" />
            </>
          )}

          {/* Student points */}
          {studentPoints.map(([x, y], idx) => (
            <circle
              key={idx}
              cx={toPixel(x, false)}
              cy={toPixel(y, true)}
              r="7"
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth="2"
              className="shadow-sm transition-all hover:scale-125"
            />
          ))}
        </svg>

        {!disabled && hoverPoint && (
          <div className="absolute top-2 left-2 bg-slate-800/90 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow pointer-events-none">
            Bod: [{hoverPoint[0]}, {hoverPoint[1]}]
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="flex-1 space-y-4 max-w-sm">
        <div className="space-y-1">
          <h4 className="font-bold text-gray-700">Zakreslení bodů:</h4>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
            <li>Kliknutím do čtvercové sítě umístíte bod.</li>
            <li>Opětovným kliknutím na existující bod ho odeberete.</li>
            <li>Zakreslete všechny body požadované v zadání.</li>
          </ul>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase">Zaznamenané body:</span>
            <Badge variant="outline" className="font-bold">
              {studentPoints.length} bod{studentPoints.length === 1 ? '' : (studentPoints.length >= 2 && studentPoints.length <= 4 ? 'y' : 'ů')}
            </Badge>
          </div>
          
          {studentPoints.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {studentPoints.map(([x, y], i) => (
                <Badge key={i} className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 font-bold text-[10px]">
                  [{x}, {y}]
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs italic text-gray-400 block">Zatím nebyly zvoleny žádné body.</span>
          )}
        </div>

        {!disabled && studentPoints.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange([])}
            className="w-full text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl border-dashed"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Resetovat body
          </Button>
        )}
      </div>
    </div>
  );
}

export function AxisQuestionEvaluation({
  question,
  studentAnswer,
  score,
  maxPoints = 1
}: {
  question: Question;
  studentAnswer: any;
  score?: number;
  maxPoints?: number;
}) {
  const studentPoints = Array.isArray(studentAnswer) ? studentAnswer : [];
  const correctPoints = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-2xl border justify-center">
      {/* Student Graph */}
      <div className="flex flex-col items-center bg-white p-4 rounded-xl border space-y-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Odpověď žáka</span>
        <svg width="220" height="220" viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`} className="border rounded-xl bg-white shadow-sm">
          <CoordinateGridLines />
          {studentPoints.map(([x, y], idx) => (
            <circle key={idx} cx={toPixel(x, false)} cy={toPixel(y, true)} r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="text-center pt-1 text-[11px] font-semibold text-gray-500 max-h-12 overflow-y-auto w-full">
          Zvolené body: {studentPoints.length > 0 ? studentPoints.map(([x, y]) => `[${x},${y}]`).join(', ') : 'Žádné'}
        </div>
      </div>

      {/* Correct solutions */}
      <div className="flex flex-col items-center bg-white p-4 rounded-xl border space-y-2">
        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Správné řešení</span>
        <svg width="220" height="220" viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`} className="border rounded-xl bg-white shadow-sm">
          <CoordinateGridLines />
          {correctPoints.map(([x, y], idx) => (
            <circle key={idx} cx={toPixel(x, false)} cy={toPixel(y, true)} r="6" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="text-center pt-1 text-[11px] font-bold text-green-700 max-h-12 overflow-y-auto w-full">
          Očekávané body: {correctPoints.length > 0 ? correctPoints.map(([x, y]) => `[${x},${y}]`).join(', ') : 'Žádné'}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. NUMBER LINE (ČÍSELNÁ OSA) HELPERS
// ==========================================

function getX(v: number, min: number, max: number, width = 600): number {
  const paddingLeft = 40;
  const paddingRight = 40;
  const range = max - min;
  if (range <= 0) return paddingLeft;
  return paddingLeft + ((v - min) / range) * (width - paddingLeft - paddingRight);
}

function getClosestTick(svgX: number, min: number, max: number, step: number, width = 600): number {
  const paddingLeft = 40;
  const paddingRight = 40;
  const usableWidth = width - paddingLeft - paddingRight;
  
  // Convert coordinate to value space
  const pct = (svgX - paddingLeft) / usableWidth;
  const rawVal = min + pct * (max - min);
  
  // Find nearest tick index
  const index = Math.round((rawVal - min) / step);
  const clampedIndex = Math.max(0, Math.min(Math.round((max - min) / step), index));
  return min + clampedIndex * step;
}

function formatValue(v: number): string {
  return parseFloat(v.toFixed(2)).toString();
}

// ==========================================
// 5. NUMBER LINE (ČÍSELNÁ OSA) COMPONENTS
// ==========================================

export function NumberLineQuestionCreator({
  question,
  onChange
}: {
  question: Question;
  onChange: (updates: Partial<Question>) => void;
}) {
  const graphData = question.graphData || { min: -10, max: 10, step: 1, labelPeriod: 2 };
  const correctPoints = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
  
  const min = Number(graphData.min ?? -10);
  const max = Number(graphData.max ?? 10);
  const step = Number(graphData.step ?? 1);
  const labelPeriod = Number(graphData.labelPeriod ?? 2);

  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Generate tick marks
  const ticks: number[] = [];
  const range = max - min;
  if (range > 0 && step > 0) {
    const ticksCount = Math.min(200, Math.round(range / step));
    for (let i = 0; i <= ticksCount; i++) {
      ticks.push(min + i * step);
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || range <= 0 || step <= 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 600;
    
    const closest = getClosestTick(px, min, max, step, 600);
    setHoverValue(closest);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const handleGridClick = () => {
    if (hoverValue === null) return;
    
    // Toggle correct point
    const exists = correctPoints.some(v => Math.abs(v - hoverValue) < 0.0001);
    let updated: number[];
    if (exists) {
      updated = correctPoints.filter(v => Math.abs(v - hoverValue) >= 0.0001);
    } else {
      updated = [...correctPoints, hoverValue];
    }
    onChange({ correctAnswer: updated });
  };

  const updateParam = (key: string, value: number) => {
    const newData = { ...graphData, [key]: value };
    const newMin = Number(newData.min ?? -10);
    const newMax = Number(newData.max ?? 10);
    const newStep = Number(newData.step ?? 1);
    
    // Filter existing correct answers that don't match the new ticks
    const alignedPoints = correctPoints.filter(pt => {
      if (pt < newMin || pt > newMax) return false;
      const stepIndex = (pt - newMin) / newStep;
      const roundedIndex = Math.round(stepIndex);
      return Math.abs(stepIndex - roundedIndex) < 0.001;
    });

    onChange({
      graphData: newData,
      correctAnswer: alignedPoints
    });
  };

  return (
    <div className="space-y-6 mt-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Minimum (osa od)</label>
          <Input
            type="number"
            value={min}
            onChange={(e) => updateParam('min', parseFloat(e.target.value) || 0)}
            className="font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Maximum (osa do)</label>
          <Input
            type="number"
            value={max}
            onChange={(e) => updateParam('max', parseFloat(e.target.value) || 0)}
            className="font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Krok (dělení)</label>
          <Input
            type="number"
            min="0.1"
            step="0.1"
            value={step}
            onChange={(e) => updateParam('step', Math.max(0.1, parseFloat(e.target.value) || 1))}
            className="font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Perioda popisků</label>
          <Input
            type="number"
            min="1"
            step="1"
            value={labelPeriod}
            onChange={(e) => updateParam('labelPeriod', Math.max(1, parseInt(e.target.value) || 1))}
            className="font-bold"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 justify-center">
        <div className="relative w-full max-w-2xl bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <svg
            ref={svgRef}
            width="100%"
            height="100"
            viewBox="0 0 600 100"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleGridClick}
            className="cursor-crosshair overflow-visible"
          >
            {/* Main Axis Line */}
            <line x1="20" y1="40" x2="570" y2="40" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="582,40 570,35 570,45" fill="#374151" />

            {/* Render Ticks and Labels */}
            {ticks.map((val, i) => {
              const x = getX(val, min, max);
              const showLabel = i % labelPeriod === 0;
              return (
                <g key={i}>
                  <line x1={x} y1="32" x2={x} y2="48" stroke="#374151" strokeWidth="1.5" />
                  {showLabel && (
                    <text x={x} y="72" fontSize="11" fill="#4B5563" fontWeight="bold" textAnchor="middle">
                      {formatValue(val)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Hover Indicator */}
            {hoverValue !== null && (
              <circle
                cx={getX(hoverValue, min, max)}
                cy="40"
                r="6"
                fill="#10B981"
                opacity="0.5"
              />
            )}

            {/* Selected Correct Points */}
            {correctPoints.map((val, idx) => {
              const x = getX(val, min, max);
              return (
                <g key={idx}>
                  <circle
                    cx={x}
                    cy="40"
                    r="8"
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    className="shadow transition-all hover:scale-125 cursor-pointer"
                  />
                  <text x={x} y="20" fontSize="10" fontWeight="black" fill="#047857" textAnchor="middle">
                    {formatValue(val)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="w-full max-w-2xl bg-slate-50 p-4 rounded-xl border space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase">Správné body ({correctPoints.length}):</span>
            {correctPoints.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => onChange({ correctAnswer: [] })} className="h-7 text-xs text-destructive hover:bg-destructive/5 font-bold">
                Smazat vše
              </Button>
            )}
          </div>
          
          {correctPoints.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {[...correctPoints].sort((a, b) => a - b).map((val, i) => (
                <Badge key={i} className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 font-bold text-[10px]">
                  {formatValue(val)}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs italic text-gray-400 block py-1">Klikněte na osu pro označení správných bodů.</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function NumberLineQuestionStudent({
  question,
  value,
  onChange,
  disabled = false
}: {
  question: Question;
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
}) {
  const graphData = question.graphData || { min: -10, max: 10, step: 1, labelPeriod: 2 };
  const studentPoints = Array.isArray(value) ? value : [];
  
  const min = Number(graphData.min ?? -10);
  const max = Number(graphData.max ?? 10);
  const step = Number(graphData.step ?? 1);
  const labelPeriod = Number(graphData.labelPeriod ?? 2);

  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Initialize value if empty
  useEffect(() => {
    if (value === undefined || value === null) {
      onChange([]);
    }
  }, [value, onChange]);

  // Generate tick marks
  const ticks: number[] = [];
  const range = max - min;
  if (range > 0 && step > 0) {
    const ticksCount = Math.min(200, Math.round(range / step));
    for (let i = 0; i <= ticksCount; i++) {
      ticks.push(min + i * step);
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled || !svgRef.current || range <= 0 || step <= 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 600;
    
    const closest = getClosestTick(px, min, max, step, 600);
    setHoverValue(closest);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const handleGridClick = () => {
    if (disabled || hoverValue === null) return;
    
    // Toggle student point
    const exists = studentPoints.some(v => Math.abs(v - hoverValue) < 0.0001);
    let updated: number[];
    if (exists) {
      updated = studentPoints.filter(v => Math.abs(v - hoverValue) >= 0.0001);
    } else {
      updated = [...studentPoints, hoverValue];
    }
    onChange(updated);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-2xl border justify-center">
      <div className="relative w-full max-w-2xl bg-slate-50/30 p-4 rounded-xl border border-slate-100">
        <svg
          ref={svgRef}
          width="100%"
          height="100"
          viewBox="0 0 600 100"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleGridClick}
          className={`overflow-visible ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
        >
          {/* Main Axis Line */}
          <line x1="20" y1="40" x2="570" y2="40" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="582,40 570,35 570,45" fill="#374151" />

          {/* Render Ticks and Labels */}
          {ticks.map((val, i) => {
            const x = getX(val, min, max);
            const showLabel = i % labelPeriod === 0;
            return (
              <g key={i}>
                <line x1={x} y1="32" x2={x} y2="48" stroke="#374151" strokeWidth="1.5" />
                {showLabel && (
                  <text x={x} y="72" fontSize="11" fill="#4B5563" fontWeight="bold" textAnchor="middle">
                    {formatValue(val)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover Indicator */}
          {!disabled && hoverValue !== null && (
            <circle
              cx={getX(hoverValue, min, max)}
              cy="40"
              r="6"
              fill="#EF4444"
              opacity="0.5"
            />
          )}

          {/* Student Selected Points */}
          {studentPoints.map((val, idx) => {
            const x = getX(val, min, max);
            return (
              <g key={idx}>
                <circle
                  cx={x}
                  cy="40"
                  r="8"
                  fill="#EF4444"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="shadow transition-all hover:scale-125"
                />
                <text x={x} y="20" fontSize="10" fontWeight="black" fill="#B91C1C" textAnchor="middle">
                  {formatValue(val)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info panel */}
      <div className="w-full max-w-2xl bg-slate-50 p-4 rounded-xl border space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-500 uppercase">Zaznamenané body ({studentPoints.length}):</span>
          {!disabled && studentPoints.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange([])}
              className="h-7 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl border-dashed"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Resetovat body
            </Button>
          )}
        </div>
        
        {studentPoints.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {[...studentPoints].sort((a, b) => a - b).map((val, i) => (
              <Badge key={i} className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 font-bold text-[10px]">
                {formatValue(val)}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs italic text-gray-400 block">Zatím nebyly zvoleny žádné body.</span>
        )}
      </div>
    </div>
  );
}

export function NumberLineQuestionEvaluation({
  question,
  studentAnswer,
  score,
  maxPoints = 1
}: {
  question: Question;
  studentAnswer: any;
  score?: number;
  maxPoints?: number;
}) {
  const graphData = question.graphData || { min: -10, max: 10, step: 1, labelPeriod: 2 };
  const studentPoints = Array.isArray(studentAnswer) ? studentAnswer : [];
  const correctPoints = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];

  const min = Number(graphData.min ?? -10);
  const max = Number(graphData.max ?? 10);
  const step = Number(graphData.step ?? 1);
  const labelPeriod = Number(graphData.labelPeriod ?? 2);

  // Generate tick marks
  const ticks: number[] = [];
  const range = max - min;
  if (range > 0 && step > 0) {
    const ticksCount = Math.min(200, Math.round(range / step));
    for (let i = 0; i <= ticksCount; i++) {
      ticks.push(min + i * step);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-2xl border justify-center">
      {/* Student answer view */}
      <div className="flex flex-col items-center bg-white p-4 rounded-xl border space-y-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Odpověď žáka</span>
        <div className="relative w-full overflow-hidden">
          <svg width="100%" height="90" viewBox="0 0 600 90" className="overflow-visible">
            {/* Main Axis Line */}
            <line x1="20" y1="40" x2="570" y2="40" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            <polygon points="580,40 570,36 570,44" fill="#374151" />

            {/* Render Ticks and Labels */}
            {ticks.map((val, i) => {
              const x = getX(val, min, max);
              const showLabel = i % labelPeriod === 0;
              return (
                <g key={i}>
                  <line x1={x} y1="34" x2={x} y2="46" stroke="#4B5563" strokeWidth="1.2" />
                  {showLabel && (
                    <text x={x} y="68" fontSize="10" fill="#6B7280" fontWeight="bold" textAnchor="middle">
                      {formatValue(val)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Student Selected Points */}
            {studentPoints.map((val, idx) => {
              const x = getX(val, min, max);
              return (
                <g key={idx}>
                  <circle cx={x} cy="40" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" className="shadow" />
                  <text x={x} y="22" fontSize="9" fontWeight="black" fill="#B91C1C" textAnchor="middle">{formatValue(val)}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="text-center pt-1 text-[11px] font-semibold text-gray-500 max-h-12 overflow-y-auto w-full">
          Zvolené body: {studentPoints.length > 0 ? [...studentPoints].sort((a, b) => a - b).map(formatValue).join(', ') : 'Žádné'}
        </div>
      </div>

      {/* Correct answer view */}
      <div className="flex flex-col items-center bg-white p-4 rounded-xl border space-y-2">
        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Správné řešení</span>
        <div className="relative w-full overflow-hidden">
          <svg width="100%" height="90" viewBox="0 0 600 90" className="overflow-visible">
            {/* Main Axis Line */}
            <line x1="20" y1="40" x2="570" y2="40" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            <polygon points="580,40 570,36 570,44" fill="#374151" />

            {/* Render Ticks and Labels */}
            {ticks.map((val, i) => {
              const x = getX(val, min, max);
              const showLabel = i % labelPeriod === 0;
              return (
                <g key={i}>
                  <line x1={x} y1="34" x2={x} y2="46" stroke="#4B5563" strokeWidth="1.2" />
                  {showLabel && (
                    <text x={x} y="68" fontSize="10" fill="#6B7280" fontWeight="bold" textAnchor="middle">
                      {formatValue(val)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Correct Points */}
            {correctPoints.map((val, idx) => {
              const x = getX(val, min, max);
              return (
                <g key={idx}>
                  <circle cx={x} cy="40" r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" className="shadow" />
                  <text x={x} y="22" fontSize="9" fontWeight="black" fill="#047857" textAnchor="middle">{formatValue(val)}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="text-center pt-1 text-[11px] font-bold text-green-700 max-h-12 overflow-y-auto w-full">
          Očekávané body: {correctPoints.length > 0 ? [...correctPoints].sort((a, b) => a - b).map(formatValue).join(', ') : 'Žádné'}
        </div>
      </div>
    </div>
  );
}

