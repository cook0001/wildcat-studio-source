import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CartridgeSpec, CARTRIDGE_CATEGORIES } from '../types/cartridge';
import { isCustomCartridge } from '../utils/customCartridges';
import { calculateVolumetricsFrontend, isStraightWall, getOuterRadiusAt, parseWildcatSpec } from '../utils/volumetrics';
import { 
  FolderOpen, 
  Search, 
  X, 
  Trash2, 
  Upload, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface OpenCartridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCartridge: (spec: CartridgeSpec) => void;
  currentCartridgeId: string;
  allPresets: Record<string, CartridgeSpec>;
  customCartridges: Record<string, CartridgeSpec>;
  onDeleteCustomCartridge?: (id: string) => void;
  onImportCartridge?: (spec: CartridgeSpec) => void;
  isMetric: boolean;
}

export const OpenCartridgeModal: React.FC<OpenCartridgeModalProps> = ({
  isOpen,
  onClose,
  onSelectCartridge,
  currentCartridgeId,
  allPresets,
  customCartridges,
  onDeleteCustomCartridge,
  onImportCartridge,
  isMetric,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCaliberFilter, setSelectedCaliberFilter] = useState<string>('ALL');
  const [selectedStandard, setSelectedStandard] = useState<string>('ALL');
  const [highlightedId, setHighlightedId] = useState<string>(currentCartridgeId);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync highlighted cartridge with current cartridge when modal opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedId(currentCartridgeId);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, currentCartridgeId]);

  // Flatten and prepare cartridges array
  const cartridgeList = useMemo(() => {
    return Object.values(allPresets);
  }, [allPresets]);

  // Filter cartridges based on search, category, caliber range, and standard
  const filteredCartridges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return cartridgeList.filter((c) => {
      // Search query filter
      if (q) {
        const nameMatch = c.name.toLowerCase().includes(q);
        const idMatch = c.id.toLowerCase().includes(q);
        const catMatch = (c.category || '').toLowerCase().includes(q);
        const caliberMatch = c.bullet_diameter.toFixed(3).includes(q) || (c.bullet_diameter * 25.4).toFixed(1).includes(q);
        if (!nameMatch && !idMatch && !catMatch && !caliberMatch) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'CUSTOM') {
          if (!isCustomCartridge(c.id)) return false;
        } else {
          if (c.category !== selectedCategory) return false;
        }
      }

      // Standard filter
      if (selectedStandard !== 'ALL') {
        if (c.standard !== selectedStandard) return false;
      }

      // Caliber Range filter
      if (selectedCaliberFilter !== 'ALL') {
        const dia = c.bullet_diameter;
        switch (selectedCaliberFilter) {
          case 'SMALL': // .17 - .243 (up to 6mm)
            if (dia > 0.244) return false;
            break;
          case 'MEDIUM_6_65': // 6mm - 6.5mm (.243 - .264)
            if (dia < 0.243 || dia > 0.265) return false;
            break;
          case 'MEDIUM_7_30': // 7mm - .308 (.277 - .308)
            if (dia < 0.270 || dia > 0.312) return false;
            break;
          case 'LARGE_338_375': // .338 - .375
            if (dia < 0.330 || dia > 0.376) return false;
            break;
          case 'BIG_BORE': // .400+
            if (dia < 0.400) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  }, [cartridgeList, searchQuery, selectedCategory, selectedCaliberFilter, selectedStandard]);

  // If highlighted cartridge is no longer in filtered list, pick the first
  useEffect(() => {
    if (filteredCartridges.length > 0) {
      const exists = filteredCartridges.some((c) => c.id === highlightedId);
      if (!exists) {
        setHighlightedId(filteredCartridges[0].id);
      }
    }
  }, [filteredCartridges, highlightedId]);

  const highlightedCartridge = useMemo(() => {
    return allPresets[highlightedId] || filteredCartridges[0] || allPresets['308_win'];
  }, [allPresets, highlightedId, filteredCartridges]);

  const highlightedVolumetrics = useMemo(() => {
    if (!highlightedCartridge) return null;
    return calculateVolumetricsFrontend(highlightedCartridge);
  }, [highlightedCartridge]);

  // Keyboard navigation: Up/Down to browse, Enter to open, Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = filteredCartridges.findIndex((c) => c.id === highlightedId);
        if (idx < filteredCartridges.length - 1) {
          setHighlightedId(filteredCartridges[idx + 1].id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = filteredCartridges.findIndex((c) => c.id === highlightedId);
        if (idx > 0) {
          setHighlightedId(filteredCartridges[idx - 1].id);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedCartridge) {
          onSelectCartridge(highlightedCartridge);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCartridges, highlightedId, highlightedCartridge, onClose, onSelectCartridge]);

  // Handle external file import (.wildcat, .wcs, .vol, .loadbench, .json)
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        const parsed = parseWildcatSpec(content);
        if (parsed) {
          onImportCartridge?.(parsed);
          onSelectCartridge(parsed);
          onClose();
        } else {
          console.warn('Unable to parse cartridge specification format:', file.name);
        }
      } catch (err) {
        console.error('Failed to import cartridge file:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const fmt = (valInches: number, prec = 3) => {
    if (isMetric) return (valInches * 25.4).toFixed(prec) + ' mm';
    return valInches.toFixed(prec) + '"';
  };

  const customCount = Object.keys(customCartridges).length;

  // Mini vector contour profile preview for highlighted cartridge
  const renderSilhouette = (spec: CartridgeSpec) => {
    const width = 280;
    const height = 94;
    const centerY = height / 2;
    const paddingX = 14;

    const totalLen = Math.max(spec.coal, spec.case_length + 0.3, 0.6);
    const maxDia = Math.max(
      spec.rim_diameter,
      spec.base_diameter,
      spec.shoulder_start_diameter || 0,
      spec.belt_diameter || 0,
      spec.bullet_diameter,
      0.25
    );

    const availW = width - paddingX * 2;
    const availH = height - 22;
    const scaleX = availW / totalLen;
    const scaleY = availH / maxDia;

    // Use a balanced scale preserving true geometric profile proportions
    const scale = Math.min(scaleX, scaleY * 0.72);
    const actualWidth = totalLen * scale;
    const startX = Math.max(paddingX, (width - actualWidth) / 2);
    const mouthX = startX + spec.case_length * scale;
    const tipX = startX + spec.coal * scale;
    const rBullet = (spec.bullet_diameter / 2) * scale;

    if (spec.id === 'little_boy_ordnance') {
      const rBody = (spec.base_diameter / 2) * scale;

      return (
        <svg
          width={width}
          height={height}
          style={{
            background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
            borderRadius: '6px',
            border: '1px solid rgba(0, 210, 255, 0.22)',
            boxShadow: 'inset 0 0 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <defs>
            <pattern id="previewGridLB" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(38, 51, 74, 0.35)" strokeWidth="0.75" />
            </pattern>
            <linearGradient id="lbPreviewGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="50%" stopColor="#1f2937" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
          </defs>

          <rect width={width} height={height} fill="url(#previewGridLB)" />

          <line
            x1={Math.max(4, startX - 8)}
            y1={centerY}
            x2={Math.min(width - 4, tipX + 16)}
            y2={centerY}
            stroke="rgba(0, 210, 255, 0.45)"
            strokeDasharray="5,3"
            strokeWidth="1"
          />

          {/* Box fins */}
          <rect x={startX} y={centerY - rBody * 1.35} width="35" height={rBody * 0.5} fill="#1f2937" stroke="#64748b" strokeWidth="1" />
          <rect x={startX} y={centerY + rBody * 0.85} width="35" height={rBody * 0.5} fill="#1f2937" stroke="#64748b" strokeWidth="1" />
          <rect x={startX + 5} y={centerY - rBody * 1.38} width="24" height={rBody * 2.76} fill="none" stroke="#94a3b8" strokeWidth="2" rx="2" />

          {/* Cylindrical casing */}
          <rect
            x={startX + 30}
            y={centerY - rBody}
            width={mouthX - (startX + 30)}
            height={rBody * 2}
            fill="url(#lbPreviewGradient)"
            stroke="#64748b"
            strokeWidth="1.5"
            rx="3"
          />

          {/* Blunt nose cap */}
          <path
            d={`
              M ${mouthX} ${centerY - rBody}
              Q ${tipX} ${centerY - rBody * 0.8}, ${tipX} ${centerY}
              Q ${tipX} ${centerY + rBody * 0.8}, ${mouthX} ${centerY + rBody}
              Z
            `}
            fill="url(#lbPreviewGradient)"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* Antenna probes */}
          <line x1={tipX - 2} y1={centerY - rBody * 0.5} x2={tipX + 12} y2={centerY - rBody * 0.7} stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1={tipX - 2} y1={centerY + rBody * 0.5} x2={tipX + 12} y2={centerY + rBody * 0.7} stroke="#cbd5e1" strokeWidth="1.2" />
        </svg>
      );
    }

    const steps = 50;
    const dz = spec.case_length / steps;
    const ptsBot: { x: number; y: number }[] = [];
    const ptsTop: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const z = i * dz;
      const r = getOuterRadiusAt(spec, z) * scale;
      const px = startX + z * scale;
      ptsBot.push({ x: px, y: centerY + r });
      ptsTop.push({ x: px, y: centerY - r });
    }

    // Completely solid closed polygon for casing (no voids, gaps, or internal breaks)
    let casePath = `M ${ptsBot[0].x.toFixed(1)} ${ptsBot[0].y.toFixed(1)}`;
    for (let i = 1; i <= steps; i++) {
      casePath += ` L ${ptsBot[i].x.toFixed(1)} ${ptsBot[i].y.toFixed(1)}`;
    }
    casePath += ` L ${ptsTop[steps].x.toFixed(1)} ${ptsTop[steps].y.toFixed(1)}`;
    for (let i = steps - 1; i >= 0; i--) {
      casePath += ` L ${ptsTop[i].x.toFixed(1)} ${ptsTop[i].y.toFixed(1)}`;
    }
    casePath += ' Z';

    // Solid bullet ogive
    const bulletPath = `M ${mouthX.toFixed(1)} ${(centerY - rBullet).toFixed(1)} Q ${(mouthX + (tipX - mouthX) * 0.72).toFixed(1)} ${(centerY - rBullet * 0.65).toFixed(1)} ${tipX.toFixed(1)} ${centerY} Q ${(mouthX + (tipX - mouthX) * 0.72).toFixed(1)} ${(centerY + rBullet * 0.65).toFixed(1)} ${mouthX.toFixed(1)} ${(centerY + rBullet).toFixed(1)} Z`;

    return (
      <svg
        width={width}
        height={height}
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          borderRadius: '6px',
          border: '1px solid rgba(0, 210, 255, 0.22)',
          boxShadow: 'inset 0 0 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <defs>
          {/* Engineering Blueprint Grid */}
          <pattern id="previewGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(38, 51, 74, 0.35)" strokeWidth="0.75" />
          </pattern>
          {/* Rich Polished Brass Gradient */}
          <linearGradient id="previewBrassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5d77f" />
            <stop offset="35%" stopColor="#d4af37" />
            <stop offset="70%" stopColor="#b38f24" />
            <stop offset="100%" stopColor="#8a6c14" />
          </linearGradient>
          {/* Rich Copper Jacket Gradient */}
          <linearGradient id="previewCopperGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f9a05f" />
            <stop offset="40%" stopColor="#e2762e" />
            <stop offset="75%" stopColor="#ba5618" />
            <stop offset="100%" stopColor="#8f3a09" />
          </linearGradient>
        </defs>

        {/* Blueprint Grid Background */}
        <rect width={width} height={height} fill="url(#previewGrid)" />

        {/* Centerline */}
        <line
          x1={Math.max(4, startX - 8)}
          y1={centerY}
          x2={Math.min(width - 4, tipX + 12)}
          y2={centerY}
          stroke="rgba(0, 210, 255, 0.45)"
          strokeDasharray="5,3"
          strokeWidth="1"
        />

        {/* Copper Bullet Silhouette */}
        <path
          d={bulletPath}
          fill="url(#previewCopperGradient)"
          stroke="#f0883e"
          strokeWidth="1"
        />

        {/* Solid Brass Casing (Complete Contiguous Closed Polygon) */}
        <path
          d={casePath}
          fill="url(#previewBrassGradient)"
          stroke="#ffe57f"
          strokeWidth="1.2"
        />
      </svg>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1.5px solid var(--border-color)',
          borderRadius: '10px',
          width: '1080px',
          maxWidth: '96vw',
          height: '740px',
          maxHeight: '92vh',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9), 0 0 32px rgba(0, 210, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderOpen size={18} color="var(--cad-cyan)" strokeWidth={2.5} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
                OPEN CARTRIDGE SPECIFICATION
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Select a cartridge data record from the encyclopedic database or load custom wildcat files
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".wildcat,.wcs,.vol,.json,.loadbench,.ldb"
              style={{ display: 'none' }}
            />
            <button
              id="btn-import-cartridge-file"
              onClick={() => fileInputRef.current?.click()}
              title="Import .wildcat, .wcs, .vol, .loadbench, or .json cartridge specification from disk"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '5px 10px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s',
              }}
            >
              <Upload size={12} />
              <span>Import File (.wildcat/.wcs/.vol/.json)</span>
            </button>

            <button
              id="btn-close-open-modal"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            padding: '12px 20px',
            background: '#0d1522',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Main Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={15}
                color="var(--cad-cyan)"
                style={{ position: 'absolute', left: '10px' }}
              />
              <input
                ref={searchInputRef}
                type="text"
                id="input-open-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by cartridge name, caliber, or keyword (e.g., .308, Creedmoor, 6.5, PRC, Mauser, Legend)..."
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '7px 10px 7px 32px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Standard Filter Dropdown */}
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Standards</option>
              <option value="SAAMI">SAAMI Standard (US)</option>
              <option value="CIP">CIP Standard (Europe)</option>
              <option value="Wildcat">Wildcat / Custom</option>
            </select>
          </div>

          {/* Quick-Filter Pills: Caliber & Categories */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
              Bore:
            </span>
            {[
              { id: 'ALL', label: 'All Calibers' },
              { id: 'SMALL', label: '.17 - .243 (Small Bore)' },
              { id: 'MEDIUM_6_65', label: '6mm - 6.5mm' },
              { id: 'MEDIUM_7_30', label: '7mm - .30 cal' },
              { id: 'LARGE_338_375', label: '.338 - .375' },
              { id: 'BIG_BORE', label: '.400+ (Big Bore)' },
            ].map((pill) => {
              const active = selectedCaliberFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setSelectedCaliberFilter(pill.id)}
                  style={{
                    background: active ? 'rgba(0, 210, 255, 0.2)' : 'var(--bg-tertiary)',
                    border: `1px solid ${active ? 'var(--cad-cyan)' : 'var(--border-color)'}`,
                    color: active ? '#fff' : 'var(--text-muted)',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Body: Two Panes (Left: Record Browser, Right: Detailed Inspection) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Pane: Category Filter Sidebar & Records Table */}
          <div
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              overflowX: 'hidden',
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-primary)',
            }}
          >
            {/* Category Filter Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-color)',
                overflowX: 'auto',
                background: 'var(--bg-secondary)',
              }}
            >
              <button
                onClick={() => setSelectedCategory('ALL')}
                style={{
                  background: selectedCategory === 'ALL' ? 'var(--cad-cyan)' : 'var(--bg-card)',
                  color: selectedCategory === 'ALL' ? '#000' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                All Records ({filteredCartridges.length})
              </button>

              {customCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedCategory('CUSTOM');
                    setSearchQuery('');
                    setSelectedStandard('ALL');
                    setSelectedCaliberFilter('ALL');
                  }}
                  style={{
                    background: selectedCategory === 'CUSTOM' ? 'var(--cad-copper)' : 'rgba(240, 136, 62, 0.15)',
                    color: selectedCategory === 'CUSTOM' ? '#000' : 'var(--cad-copper)',
                    border: '1px solid var(--cad-copper)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={11} />
                  <span>My Wildcats ({customCount})</span>
                </button>
              )}

              {CARTRIDGE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: selectedCategory === cat ? 'var(--cad-cyan)' : 'var(--bg-card)',
                    color: selectedCategory === cat ? '#000' : 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: selectedCategory === cat ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                padding: '6px 14px',
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--cad-cyan)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              <span>Cartridge Name</span>
              <span>Caliber (G1)</span>
              <span>Length (L3)</span>
              <span>Architecture</span>
              <span style={{ textAlign: 'right' }}>Standard</span>
            </div>

            {/* Records List Container */}
            <div
              ref={listContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {filteredCartridges.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <p style={{ margin: '0 0 14px 0', color: 'var(--text-secondary)' }}>
                    No cartridge records match your current search and filter criteria.
                  </p>
                  {(searchQuery || selectedStandard !== 'ALL' || selectedCaliberFilter !== 'ALL' || selectedCategory !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStandard('ALL');
                        setSelectedCaliberFilter('ALL');
                        setSelectedCategory('ALL');
                      }}
                      style={{
                        padding: '6px 14px',
                        background: 'rgba(0, 210, 255, 0.12)',
                        border: '1px solid var(--cad-cyan)',
                        borderRadius: '4px',
                        color: 'var(--cad-cyan)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredCartridges.map((c) => {
                  const isHighlighted = c.id === highlightedId;
                  const isActive = c.id === currentCartridgeId;
                  const isCustom = isCustomCartridge(c.id);
                  const isStraight = isStraightWall(c);

                  return (
                    <div
                      key={c.id}
                      onClick={() => setHighlightedId(c.id)}
                      onDoubleClick={() => {
                        onSelectCartridge(c);
                        onClose();
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                        padding: '8px 14px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isHighlighted
                          ? 'rgba(0, 210, 255, 0.15)'
                          : isActive
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'transparent',
                        cursor: 'pointer',
                        fontSize: '11px',
                        alignItems: 'center',
                        transition: 'background 0.1s',
                        borderLeft: isHighlighted ? '3px solid var(--cad-cyan)' : '3px solid transparent',
                      }}
                    >
                      {/* Name & Indicators */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        {isCustom && (
                          <span
                            title="Custom Wildcat saved in your persistent database"
                            style={{ display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Sparkles size={11} style={{ color: 'var(--cad-copper)' }} />
                          </span>
                        )}
                        <span
                          style={{
                            fontWeight: isHighlighted ? 700 : 500,
                            color: isHighlighted ? '#fff' : isActive ? 'var(--cad-cyan)' : 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {c.name}
                        </span>
                        {isActive && (
                          <span
                            style={{
                              fontSize: '9px',
                              background: 'rgba(0, 210, 255, 0.2)',
                              color: 'var(--cad-cyan)',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              fontWeight: 700,
                            }}
                          >
                            LOADED
                          </span>
                        )}
                      </div>

                      {/* Caliber */}
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {fmt(c.bullet_diameter, 3)}
                      </div>

                      {/* Case Length */}
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {fmt(c.case_length, 3)}
                      </div>

                      {/* Architecture */}
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {isStraight ? 'Straight-Wall' : `${c.shoulder_angle.toFixed(1)}° Shoulder`}
                      </div>

                      {/* Standard */}
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontFamily: 'var(--font-mono)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background:
                              c.standard === 'Wildcat'
                                ? 'rgba(240, 136, 62, 0.2)'
                                : 'rgba(255, 255, 255, 0.08)',
                            color:
                              c.standard === 'Wildcat'
                                ? 'var(--cad-copper)'
                                : 'var(--text-muted)',
                            fontWeight: 700,
                          }}
                        >
                          {c.standard}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Keyboard Navigation Hint */}
            <div
              style={{
                padding: '6px 14px',
                background: 'var(--bg-card)',
                borderTop: '1px solid var(--border-color)',
                fontSize: '10px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Showing {filteredCartridges.length} of {cartridgeList.length} total cartridges</span>
              <span><kbd>↑</kbd> <kbd>↓</kbd> navigate &bull; <kbd>Enter</kbd> / Double-Click to open &bull; <kbd>Esc</kbd> cancel</span>
            </div>
          </div>

          {/* Right Pane: Cartridge Specification Sheet & Live Preview */}
          <div
            style={{
              flex: '0 0 380px',
              minWidth: '340px',
              background: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              padding: '16px 20px',
              overflowY: 'auto',
              gap: '14px',
            }}
          >
            {highlightedCartridge ? (
              <>
                {/* Title & Category */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: 'var(--cad-cyan)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {highlightedCartridge.category || 'General Caliber'}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          highlightedCartridge.standard === 'Wildcat'
                            ? 'rgba(240, 136, 62, 0.2)'
                            : 'rgba(0, 210, 255, 0.2)',
                        color:
                          highlightedCartridge.standard === 'Wildcat'
                            ? 'var(--cad-copper)'
                            : 'var(--cad-cyan)',
                        fontWeight: 700,
                      }}
                    >
                      {highlightedCartridge.standard}
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#fff',
                      lineHeight: '1.2',
                    }}
                  >
                    {highlightedCartridge.name}
                  </h3>
                </div>

                {/* Contour Silhouette Silhouette Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    CAD Profile Silhouette
                  </div>
                  {renderSilhouette(highlightedCartridge)}
                </div>

                {/* Technical Specifications Grid */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px 12px',
                    fontSize: '11px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Bullet Caliber (G1)</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--cad-copper)' }}>
                      {fmt(highlightedCartridge.bullet_diameter, 3)}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Case Length (L3)</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>
                      {fmt(highlightedCartridge.case_length, 3)}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Overall Length (COAL L6)</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>
                      {fmt(highlightedCartridge.coal, 3)}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Rim Diameter (R1)</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>
                      {fmt(highlightedCartridge.rim_diameter, 3)} ({highlightedCartridge.rim_type})
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Base Diameter (P1)</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>
                      {fmt(highlightedCartridge.base_diameter, 3)}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Shoulder Diameter (P2)</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>
                      {fmt(highlightedCartridge.shoulder_start_diameter, 3)}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Shoulder Angle (α)</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>
                      {highlightedCartridge.shoulder_angle.toFixed(1)}°
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Max Pressure (MAP)</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
                      {highlightedCartridge.max_pressure_bar || 4150} bar (
                      {Math.round((highlightedCartridge.max_pressure_bar || 4150) * 14.5038).toLocaleString()} PSI)
                    </strong>
                  </div>
                </div>

                {/* Volumetric Telemetry Snapshot */}
                {highlightedVolumetrics && (
                  <div
                    style={{
                      background: 'rgba(0, 210, 255, 0.05)',
                      border: '1px solid rgba(0, 210, 255, 0.2)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px',
                      fontSize: '11px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Overflow Capacity</span>
                      <strong style={{ color: 'var(--cad-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {highlightedVolumetrics.overflow_capacity_grains_h2o.toFixed(1)} gr H₂O
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Internal Volume</span>
                      <strong style={{ color: 'var(--cad-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {highlightedVolumetrics.overflow_capacity_cm3.toFixed(2)} cm³
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Expansion Ratio (24" bbl)</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>
                        {highlightedVolumetrics.expansion_ratio_24in.toFixed(2)}:1
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>Architecture</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>
                        {isStraightWall(highlightedCartridge) ? 'Straight-Wall' : 'Bottleneck'}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
                  <button
                    id="btn-open-selected-cartridge"
                    onClick={() => {
                      onSelectCartridge(highlightedCartridge);
                      onClose();
                    }}
                    style={{
                      background: 'var(--cad-cyan)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 16px',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 0 16px rgba(0, 210, 255, 0.4)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <FolderOpen size={16} strokeWidth={2.5} />
                    <span>Open This Cartridge</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </button>

                  {isCustomCartridge(highlightedCartridge.id) && onDeleteCustomCartridge && (
                    <button
                      id="btn-delete-selected-custom"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${highlightedCartridge.name}" from your database?`)) {
                          onDeleteCustomCartridge(highlightedCartridge.id);
                        }
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontWeight: 600,
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete From Database</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', marginTop: '40%' }}>
                Select a cartridge from the list to preview specifications.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
