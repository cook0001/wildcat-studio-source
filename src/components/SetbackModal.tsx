import React, { useState } from 'react';
import { CartridgeSpec, CARTRIDGE_PRESETS, CARTRIDGE_CATEGORIES } from '../types/cartridge';
import { analyzeSetbackFrontend, getOuterRadiusAt } from '../utils/volumetrics';
import { Scale, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SetbackModalProps {
  currentCartridge: CartridgeSpec;
  isMetric: boolean;
  allPresets?: Record<string, CartridgeSpec>;
  customCartridges?: Record<string, CartridgeSpec>;
}

export const SetbackModal: React.FC<SetbackModalProps> = ({ 
  currentCartridge, 
  isMetric,
  allPresets = CARTRIDGE_PRESETS,
  customCartridges = {}
}) => {
  const [parentCaliberKey, setParentCaliberKey] = useState<string>('308_win');
  const oldSpec = allPresets[parentCaliberKey] || allPresets['308_win'] || CARTRIDGE_PRESETS['308_win'];
  const newSpec = currentCartridge;

  const result = analyzeSetbackFrontend(oldSpec, newSpec);

  const fmt = (valInches: number) => {
    if (isMetric) return (valInches * 25.4).toFixed(2) + ' mm';
    return valInches.toFixed(3) + '"';
  };

  // Build dual-contour SVG overlay with dynamic scaling so all cartridges fit in view
  const zMax = Math.max(oldSpec.case_length, newSpec.case_length, 0.5);
  const rMax = Math.max(oldSpec.rim_diameter, newSpec.rim_diameter, oldSpec.base_diameter, newSpec.base_diameter, 0.4) / 2;
  const scaleX = 560 / zMax;
  const scaleY = 90 / rMax;
  const scale = Math.min(220, scaleX, scaleY);
  const originX = 50;
  const centerY = 110;
  const steps = 100;
  const dz = zMax / steps;

  let oldTopPath = `M ${originX} ${centerY}`;
  let newTopPath = `M ${originX} ${centerY}`;

  for (let i = 0; i <= steps; i++) {
    const z = i * dz;
    const rOld = getOuterRadiusAt(oldSpec, z) * scale;
    const rNew = getOuterRadiusAt(newSpec, z) * scale;
    const px = originX + z * scale;

    oldTopPath += ` L ${px} ${centerY - rOld}`;
    newTopPath += ` L ${px} ${centerY - rNew}`;
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--bg-primary)',
      padding: '24px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '16px 20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={20} color="var(--cad-cyan)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              Chamber Re-chambering & Barrel Set-Back Analyzer
            </h2>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Determine whether an existing rifle barrel chamber can be cleaned up by your new wildcat reamer or if the barrel must be set back.
          </div>
        </div>

        {/* Existing Chamber Caliber Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Existing Chamber:</span>
          <select
            value={parentCaliberKey}
            onChange={(e) => setParentCaliberKey(e.target.value)}
            style={{
              background: '#090d14',
              color: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {Object.keys(customCartridges).length > 0 && (
              <optgroup label="── CUSTOM WILDCATS & DESIGNS ──">
                {Object.entries(customCartridges).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            )}

            {CARTRIDGE_CATEGORIES.map((cat) => {
              const items = Object.entries(allPresets).filter(
                ([_, item]) => item.category === cat
              );
              if (items.length === 0) return null;
              return (
                <optgroup key={cat} label={`── ${cat.toUpperCase()} ──`}>
                  {items.map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>
      </div>

      {/* Result Card: Clean vs Setback */}
      <div style={{
        background: result.can_rechamber_clean ? 'rgba(63, 185, 80, 0.12)' : 'rgba(240, 136, 62, 0.12)',
        border: result.can_rechamber_clean ? '1px solid var(--cad-green)' : '1px solid var(--cad-copper)',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {result.can_rechamber_clean ? (
            <CheckCircle2 size={32} color="var(--cad-green)" />
          ) : (
            <AlertTriangle size={32} color="var(--cad-copper)" />
          )}
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: result.can_rechamber_clean ? 'var(--cad-green)' : 'var(--cad-copper)' }}>
              {result.can_rechamber_clean
                ? 'DIRECT CLEAN-UP POSSIBLE (NO SET-BACK REQUIRED)'
                : `BARREL SET-BACK REQUIRED: ${result.required_setback_inches.toFixed(3)}" (${result.required_setback_mm.toFixed(2)} mm)`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {result.can_rechamber_clean
                ? `The new reamer for ${newSpec.name} is larger in all dimensions than ${oldSpec.name}. It will completely clean up the old chamber walls.`
                : `The existing ${oldSpec.name} chamber has sections wider than the new ${newSpec.name} reamer. To clean up completely, the barrel must be faced off by ${result.required_setback_inches.toFixed(3)}" and re-threaded.`}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PROJECTED SET-BACK</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
            {fmt(result.required_setback_inches)}
          </div>
        </div>
      </div>

      {/* Visual Overlay Schematic */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cad-cyan)' }}>
            SUPERIMPOSED CHAMBER OVERLAY SCHEMATIC
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--cad-copper)' }} />
              Existing: {oldSpec.name}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--cad-cyan)' }} />
              New Reamer: {newSpec.name}
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '240px', background: '#090d14', borderRadius: '6px', border: '1px solid #1c2638', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="680" height="220" viewBox="0 0 680 220">
            {/* Centerline */}
            <line x1="20" y1={centerY} x2="660" y2={centerY} stroke="#485466" strokeWidth="1" strokeDasharray="10,4,2,4" />

            {/* Existing Chamber (Orange/Amber) */}
            <path d={oldTopPath} fill="none" stroke="var(--cad-copper)" strokeWidth="2.0" strokeDasharray="5,3" />

            {/* New Reamer (Cyan) */}
            <path d={newTopPath} fill="none" stroke="var(--cad-cyan)" strokeWidth="2.2" />
          </svg>
        </div>
      </div>

      {/* Interference Log */}
      {result.interference_locations.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cad-copper)', marginBottom: '8px' }}>
            UNDERAGE / INTERFERENCE LOCATIONS:
          </div>
          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {result.interference_locations.map((item: string, idx: number) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
