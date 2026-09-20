import React, { useState, useMemo } from 'react';
import { CartridgeSpec, CARTRIDGE_PRESETS } from '../types/cartridge';
import { 
  STANDARD_CALIBERS, 
  ACTION_PRESETS, 
  CaliberOption, 
  transformNeckCaliber, 
  transformAckleyFireform, 
  transformActionTruncation,
  WildcatTransformResult 
} from '../utils/wildcatting';
import { calculateVolumetrics, analyzeCaseForming } from '../utils/volumetrics';
import { CALIBER_PRESETS } from '../data/bullets';
import { 
  Wand2, 
  X, 
  Flame, 
  Droplet, 
  AlertTriangle, 
  Compass, 
  ShieldCheck, 
  Scissors, 
  Sparkles,
  BookmarkPlus
} from 'lucide-react';

interface WildcatWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCartridge: CartridgeSpec;
  customCartridges: Record<string, CartridgeSpec>;
  onApplyWildcat: (newCartridge: CartridgeSpec) => void;
  onSaveWildcatDirectly?: (newCartridge: CartridgeSpec) => void;
  isMetric: boolean;
}

type WizardMode = 'neck' | 'ackley' | 'action';

export const WildcatWizardModal: React.FC<WildcatWizardModalProps> = ({
  isOpen,
  onClose,
  activeCartridge,
  customCartridges,
  onApplyWildcat,
  onSaveWildcatDirectly,
  isMetric
}) => {
  const allCartridges = useMemo(() => {
    return { ...CARTRIDGE_PRESETS, ...customCartridges };
  }, [customCartridges]);

  const [selectedParentId, setSelectedParentId] = useState<string>(activeCartridge.id);
  const [wizardMode, setWizardMode] = useState<WizardMode>('neck');
  
  // Mode 1: Necking
  const [selectedCaliber, setSelectedCaliber] = useState<CaliberOption>(() => {
    // Default to a different caliber than the parent
    const currentDia = activeCartridge.bullet_diameter;
    const nextCal = STANDARD_CALIBERS.find(c => Math.abs(c.inches - currentDia) > 0.015);
    return nextCal || STANDARD_CALIBERS[5]; // default 6.5mm
  });
  const [selectedCaliberFilter, setSelectedCaliberFilter] = useState<string>('All');

  // Mode 2: Ackley
  const [ackleyAngle, setAckleyAngle] = useState<number>(40.0);
  const [blowoutInches, setBlowoutInches] = useState<number>(0.012);

  // Mode 3: Action Truncation
  const [selectedActionId, setSelectedActionId] = useState<string>('ar15');

  // Custom Wildcat Name
  const [customWildcatName, setCustomWildcatName] = useState<string>('');

  const parent = allCartridges[selectedParentId] || activeCartridge;

  // Compute Transformation Result
  const transformResult: WildcatTransformResult = useMemo(() => {
    if (wizardMode === 'neck') {
      return transformNeckCaliber(parent, selectedCaliber, customWildcatName || undefined);
    } else if (wizardMode === 'ackley') {
      return transformAckleyFireform(parent, ackleyAngle, blowoutInches, customWildcatName || undefined);
    } else {
      const action = ACTION_PRESETS.find(a => a.id === selectedActionId) || ACTION_PRESETS[0];
      const truncated = transformActionTruncation(parent, action);
      const parentVol = calculateVolumetrics(parent);
      const newVol = calculateVolumetrics(truncated);
      const capDelta = Math.round(((newVol.overflow_capacity_grains_h2o - parentVol.overflow_capacity_grains_h2o) / parentVol.overflow_capacity_grains_h2o) * 100);

      return {
        cartridge: customWildcatName ? { ...truncated, name: customWildcatName } : truncated,
        neckThicknessDeltaPercent: 0,
        requiresNeckTurning: false,
        requiresIntermediateDies: false,
        formingSteps: [
          {
            stepNumber: 1,
            title: 'Case Truncation & Trim',
            description: `Trim parent case length from ${parent.case_length.toFixed(3)}" to ${truncated.case_length.toFixed(3)}" to cycle in ${action.name} magazine (${action.maxCoal}").`,
            tooling: 'Case Trimmer / Power Trimmer'
          },
          {
            stepNumber: 2,
            title: 'Inside & Outside Chamfer',
            description: 'Deburr and chamfer case mouth after cutting.',
            tooling: 'Chamfer & Deburr Tool'
          }
        ],
        estimatedCapacityDeltaPercent: capDelta
      };
    }
  }, [parent, wizardMode, selectedCaliber, ackleyAngle, blowoutInches, selectedActionId, customWildcatName]);

  const newCartridge = transformResult.cartridge;
  const parentVol = useMemo(() => calculateVolumetrics(parent), [parent]);
  const newVol = useMemo(() => calculateVolumetrics(newCartridge), [newCartridge]);
  const caseForming = useMemo(() => analyzeCaseForming(parent, newCartridge), [parent, newCartridge]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyWildcat(newCartridge);
    onClose();
  };

  const handleSaveDirect = () => {
    if (onSaveWildcatDirectly) {
      onSaveWildcatDirectly(newCartridge);
    } else {
      onApplyWildcat(newCartridge);
    }
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(5, 8, 14, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '1080px',
          maxWidth: '96vw',
          height: '740px',
          maxHeight: '92vh',
          background: 'rgba(15, 20, 31, 0.98)',
          border: '1.5px solid var(--cad-cyan)',
          borderRadius: '10px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 210, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(0, 210, 255, 0.15)',
              padding: '7px',
              borderRadius: '6px',
              color: 'var(--cad-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wand2 size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Parent Case Wildcatting Wizard
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'rgba(240, 136, 62, 0.2)', color: 'var(--cad-copper)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  DESIGN ENGINE
                </span>
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                Derive precision wildcats from proven parent cases with automated neck dilation, fireforming blowout, and forming steps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 20px'
        }}>
          <button
            onClick={() => setWizardMode('neck')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: wizardMode === 'neck' ? '2px solid var(--cad-cyan)' : '2px solid transparent',
              color: wizardMode === 'neck' ? 'var(--cad-cyan)' : 'var(--text-secondary)',
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Compass size={14} />
            <span>1. Neck Up / Neck Down</span>
          </button>

          <button
            onClick={() => setWizardMode('ackley')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: wizardMode === 'ackley' ? '2px solid var(--cad-cyan)' : '2px solid transparent',
              color: wizardMode === 'ackley' ? 'var(--cad-cyan)' : 'var(--text-secondary)',
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Flame size={14} />
            <span>2. Ackley 40° Fireform (Blowout)</span>
          </button>

          <button
            onClick={() => setWizardMode('action')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: wizardMode === 'action' ? '2px solid var(--cad-cyan)' : '2px solid transparent',
              color: wizardMode === 'action' ? 'var(--cad-cyan)' : 'var(--text-secondary)',
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Scissors size={14} />
            <span>3. Action / Magazine Truncation</span>
          </button>
        </div>

        {/* Content Body: Dual Column */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
          
          {/* LEFT: Controls & Parent Selection */}
          <div style={{
            padding: '20px',
            overflowY: 'auto',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Step A: Select Parent Case */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan)', display: 'block', marginBottom: '6px' }}>
                PARENT BASELINE CARTRIDGE
              </label>
              <select
                id="select-wizard-parent"
                value={selectedParentId}
                onChange={(e) => {
                  setSelectedParentId(e.target.value);
                  setCustomWildcatName('');
                }}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '8px 10px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {Object.entries(allCartridges).map(([id, item]) => (
                  <option key={id} value={id}>
                    {item.name} ({item.standard})
                  </option>
                ))}
              </select>
            </div>

            {/* Step B: Mode-Specific Parameter Configuration */}
            {wizardMode === 'neck' && (() => {
              const filteredCalibers = selectedCaliberFilter === 'All'
                ? STANDARD_CALIBERS
                : STANDARD_CALIBERS.filter(cal => {
                    const found = CALIBER_PRESETS.find(p => p.inches === cal.inches);
                    return found && found.category === selectedCaliberFilter;
                  });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan)', display: 'block' }}>
                      TARGET BULLET CALIBER ({STANDARD_CALIBERS.length} STANDARD PRESETS)
                    </label>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Current: {selectedCaliber.designation}
                    </span>
                  </div>

                  {/* Caliber Category Tabs */}
                  <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                    {[
                      { label: 'All', cat: 'All' },
                      { label: 'Varmint', cat: 'Sub-Caliber & Varmint' },
                      { label: 'Match/Rifle', cat: 'Match & Service Rifle (6mm - .30 Cal)' },
                      { label: 'Medium/Euro', cat: 'Medium Bore & European (8mm - 9.3mm)' },
                      { label: 'African / DG', cat: 'African Express & Dangerous Game' },
                      { label: 'Handgun', cat: 'Handgun, Pistol & PDW' },
                      { label: 'ELR', cat: 'Anti-Materiel & Extreme Long Range (ELR)' }
                    ].map(item => {
                      const isActive = selectedCaliberFilter === item.cat;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setSelectedCaliberFilter(item.cat)}
                          style={{
                            background: isActive ? 'var(--cad-cyan)' : 'var(--bg-card)',
                            color: isActive ? '#000' : 'var(--text-secondary)',
                            border: `1px solid ${isActive ? 'var(--cad-cyan)' : 'var(--border-color)'}`,
                            borderRadius: '4px',
                            padding: '3px 7px',
                            fontSize: '9px',
                            fontWeight: isActive ? 700 : 500,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.12s'
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Caliber Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', maxHeight: '185px', overflowY: 'auto', paddingRight: '2px' }}>
                    {filteredCalibers.map((cal) => {
                      const isSelected = selectedCaliber.inches === cal.inches;
                      const isParentCal = Math.abs(parent.bullet_diameter - cal.inches) < 0.005;
                      return (
                        <button
                          key={cal.inches}
                          onClick={() => setSelectedCaliber(cal)}
                          style={{
                            background: isSelected ? 'var(--cad-cyan)' : isParentCal ? 'rgba(240, 136, 62, 0.15)' : 'var(--bg-card)',
                            color: isSelected ? '#000' : isParentCal ? 'var(--cad-copper)' : '#fff',
                            border: `1px solid ${isSelected ? 'var(--cad-cyan)' : isParentCal ? 'var(--cad-copper)' : 'var(--border-color)'}`,
                            borderRadius: '6px',
                            padding: '6px 4px',
                            fontSize: '10px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            transition: 'all 0.12s'
                          }}
                        >
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{cal.inches.toFixed(3)}"</span>
                          <span style={{ fontSize: '8.5px', opacity: 0.85 }}>{cal.mm}mm</span>
                          <span style={{ fontSize: '7.5px', opacity: 0.7 }}>{cal.typicalWeightGrains}gr</span>
                          {isParentCal && <span style={{ fontSize: '7.5px', color: 'var(--cad-copper)', fontWeight: 700 }}>(Parent)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {wizardMode === 'ackley' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan)', display: 'block', marginBottom: '6px' }}>
                    SHOULDER ANGLE (α)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[30, 35, 40].map((angle) => (
                      <button
                        key={angle}
                        onClick={() => setAckleyAngle(angle)}
                        style={{
                          background: ackleyAngle === angle ? 'var(--cad-cyan)' : 'var(--bg-card)',
                          color: ackleyAngle === angle ? '#000' : '#fff',
                          border: `1px solid ${ackleyAngle === angle ? 'var(--cad-cyan)' : 'var(--border-color)'}`,
                          borderRadius: '6px',
                          padding: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {angle}° {angle === 40 ? '(Ackley Standard)' : angle === 35 ? '(Custom PRS)' : '(Mild Flow)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan)' }}>
                      BODY BLOWOUT EXPANSION (P₂)
                    </label>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cad-cyan)' }}>
                      +{blowoutInches.toFixed(3)}" ({(blowoutInches * 25.4).toFixed(2)}mm)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.005"
                    max="0.025"
                    step="0.001"
                    value={blowoutInches}
                    onChange={(e) => setBlowoutInches(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Straightens body taper to maximize usable propellant volume while preserving extraction reliability.
                  </div>
                </div>
              </div>
            )}

            {wizardMode === 'action' && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan)', display: 'block', marginBottom: '8px' }}>
                  TARGET RIFLE ACTION / MAGAZINE LENGTH
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ACTION_PRESETS.map((act) => {
                    const isSelected = selectedActionId === act.id;
                    return (
                      <div
                        key={act.id}
                        onClick={() => setSelectedActionId(act.id)}
                        style={{
                          background: isSelected ? 'rgba(0, 210, 255, 0.12)' : 'var(--bg-card)',
                          border: `1px solid ${isSelected ? 'var(--cad-cyan)' : 'var(--border-color)'}`,
                          borderRadius: '6px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? 'var(--cad-cyan)' : '#fff' }}>
                            {act.name}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                            {act.description}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--cad-cyan)' }}>
                          Max {act.maxCoal.toFixed(3)}"
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Wildcat Name Override */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                WILDCAT DESIGNATION NAME (OPTIONAL)
              </label>
              <input
                id="input-wizard-custom-name"
                type="text"
                placeholder={newCartridge.name}
                value={customWildcatName}
                onChange={(e) => setCustomWildcatName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '8px 10px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Case Forming & Doughnut Risk Engine */}
            <div
              style={{
                background:
                  caseForming.doughnut_risk === 'high'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : caseForming.doughnut_risk === 'moderate'
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${
                  caseForming.doughnut_risk === 'high'
                    ? '#ef4444'
                    : caseForming.doughnut_risk === 'moderate'
                    ? '#f59e0b'
                    : 'rgba(16, 185, 129, 0.3)'
                }`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color:
                      caseForming.doughnut_risk === 'high'
                        ? '#f87171'
                        : caseForming.doughnut_risk === 'moderate'
                        ? '#fbbf24'
                        : '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <AlertTriangle size={13} />
                  BRASS FLOW & DOUGHNUT RISK: {caseForming.doughnut_risk.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: caseForming.requires_neck_turning ? '#f87171' : '#34d399',
                    fontWeight: 600,
                  }}
                >
                  {caseForming.requires_neck_turning ? 'NECK TURNING REQ' : 'NO-TURN OK'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9.5px' }}>NEW NECK WALL</span>
                  <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {caseForming.predicted_neck_wall.toFixed(4)}"
                  </span>
                  <span style={{ fontSize: '9.5px', color: caseForming.predicted_neck_wall >= caseForming.original_neck_wall ? '#f59e0b' : '#34d399', marginLeft: '4px' }}>
                    ({caseForming.predicted_neck_wall >= caseForming.original_neck_wall ? '+' : ''}
                    {(((caseForming.predicted_neck_wall - caseForming.original_neck_wall) / Math.max(0.001, caseForming.original_neck_wall)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9.5px' }}>CHAMBER CLR</span>
                  <span style={{ fontWeight: 700, color: caseForming.neck_clearance < 0.002 ? '#f87171' : '#34d399', fontFamily: 'var(--font-mono)' }}>
                    +{caseForming.neck_clearance.toFixed(4)}"
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9.5px' }}>TRIM REQ</span>
                  <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {caseForming.trim_length_required.toFixed(3)}"
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: 1.35 }}>
                {caseForming.doughnut_reason}
              </div>
            </div>

            {/* Forming Tooling Advice & Instructions */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <ShieldCheck size={14} />
                <span>CASE FORMING PLAN & STEPS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transformResult.formingSteps.map((step) => (
                  <div
                    key={step.stepNumber}
                    style={{
                      background: step.isCaution ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)',
                      border: `1px solid ${step.isCaution ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
                      borderRadius: '6px',
                      padding: '8px 10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: step.isCaution ? '#f87171' : 'var(--cad-cyan)' }}>
                        Step {step.stepNumber}: {step.title}
                      </span>
                      <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: '3px', color: 'var(--text-muted)' }}>
                        {step.tooling}
                      </span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {step.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Live CAD Silhouette & Telemetry Comparison */}
          <div style={{
            padding: '20px',
            background: 'var(--bg-primary)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Live Visual Silhouette Comparison SVG */}
            <div style={{
              background: '#0a0e17',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              height: '240px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--cad-cyan)', letterSpacing: '0.5px' }}>
                  CAD CONTOUR COMPARISON (SUPERIMPOSED)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                    <span style={{ width: '10px', height: '3px', background: '#64748b', display: 'inline-block' }} />
                    Parent ({parent.name.split(' ')[0]})
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--cad-copper)' }}>
                    <span style={{ width: '10px', height: '3px', background: 'var(--cad-copper)', display: 'inline-block' }} />
                    New Wildcat
                  </span>
                </div>
              </div>

              {/* Vector Silhouette */}
              <svg viewBox="0 0 460 160" style={{ width: '100%', height: '180px' }}>
                {/* SVG Blueprint Grid */}
                <defs>
                  <pattern id="wizardGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="20" y2="0" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#wizardGrid)" />

                {/* Centerline */}
                <line x1="20" y1="80" x2="440" y2="80" stroke="#334155" strokeWidth="1" strokeDasharray="6,4,2,4" />

                {/* Parent Profile (Muted Gray) */}
                {(() => {
                  const maxCoal = Math.max(parent.coal, newCartridge.coal, 1.5);
                  const scale = 360 / maxCoal;
                  const ox = 30;
                  const cy = 80;

                  // Render simple parent body
                  const pHead = ox;
                  const pBody = ox + parent.body_length * scale;
                  const pShoulder = ox + (parent.body_length + parent.shoulder_length) * scale;
                  const pMouth = ox + parent.case_length * scale;
                  const pTip = ox + parent.coal * scale;

                  const pr1 = (parent.rim_diameter / 2) * scale * 0.9;
                  const pp1 = (parent.base_diameter / 2) * scale * 0.9;
                  const pp2 = (parent.shoulder_start_diameter / 2) * scale * 0.9;
                  const ph2 = (parent.neck_diameter_mouth / 2) * scale * 0.9;

                  const parentPath = `
                    M ${pHead} ${cy - pr1}
                    L ${pHead + 4} ${cy - pr1}
                    L ${pHead + 4} ${cy - pp1}
                    L ${pBody} ${cy - pp2}
                    L ${pShoulder} ${cy - ph2}
                    L ${pMouth} ${cy - ph2}
                    L ${pTip} ${cy}
                    L ${pMouth} ${cy + ph2}
                    L ${pShoulder} ${cy + ph2}
                    L ${pBody} ${cy + pp2}
                    L ${pHead + 4} ${cy + pp1}
                    L ${pHead + 4} ${cy + pr1}
                    L ${pHead} ${cy + pr1}
                    Z
                  `;

                  // Render Wildcat Profile (Vibrant Copper/Cyan)
                  const wHead = ox;
                  const wBody = ox + newCartridge.body_length * scale;
                  const wShoulder = ox + (newCartridge.body_length + newCartridge.shoulder_length) * scale;
                  const wMouth = ox + newCartridge.case_length * scale;
                  const wTip = ox + newCartridge.coal * scale;

                  const wr1 = (newCartridge.rim_diameter / 2) * scale * 0.9;
                  const wp1 = (newCartridge.base_diameter / 2) * scale * 0.9;
                  const wp2 = (newCartridge.shoulder_start_diameter / 2) * scale * 0.9;
                  const wh2 = (newCartridge.neck_diameter_mouth / 2) * scale * 0.9;

                  const wildcatPath = `
                    M ${wHead} ${cy - wr1}
                    L ${wHead + 4} ${cy - wr1}
                    L ${wHead + 4} ${cy - wp1}
                    L ${wBody} ${cy - wp2}
                    L ${wShoulder} ${cy - wh2}
                    L ${wMouth} ${cy - wh2}
                    L ${wTip} ${cy}
                    L ${wMouth} ${cy + wh2}
                    L ${wShoulder} ${cy + wh2}
                    L ${wBody} ${cy + wp2}
                    L ${wHead + 4} ${cy + wp1}
                    L ${wHead + 4} ${cy + wr1}
                    L ${wHead} ${cy + wr1}
                    Z
                  `;

                  return (
                    <g>
                      {/* Parent Outline */}
                      <path d={parentPath} fill="rgba(100, 116, 139, 0.15)" stroke="#64748b" strokeWidth="1.2" strokeDasharray="4,3" />
                      {/* Wildcat Outline */}
                      <path d={wildcatPath} fill="rgba(240, 136, 62, 0.2)" stroke="var(--cad-copper)" strokeWidth="1.8" />
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Delta Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              
              {/* Capacity Metric */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <Droplet size={14} color="var(--cad-cyan)" />
                  <span>OVERFLOW CAPACITY</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                    {newVol.overflow_capacity_grains_h2o} <span style={{ fontSize: '12px', color: 'var(--cad-cyan)' }}>gr H₂O</span>
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: transformResult.estimatedCapacityDeltaPercent >= 0 ? '#4ade80' : '#f87171'
                  }}>
                    {transformResult.estimatedCapacityDeltaPercent >= 0 ? '+' : ''}{transformResult.estimatedCapacityDeltaPercent}%
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Parent: {parentVol.overflow_capacity_grains_h2o} gr H₂O ({parentVol.overflow_capacity_cm3} cm³)
                </div>
              </div>

              {/* Neck & Caliber Metric */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <Compass size={14} color="var(--cad-copper)" />
                  <span>BULLET & NECK</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cad-copper)' }}>
                    {newCartridge.bullet_diameter.toFixed(3)}"
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    ({(newCartridge.bullet_diameter * 25.4).toFixed(2)}mm)
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Wall: {newCartridge.neck_wall_thickness.toFixed(4)}" ({transformResult.neckThicknessDeltaPercent >= 0 ? '+' : ''}{transformResult.neckThicknessDeltaPercent}%)
                </div>
              </div>

            </div>

            {/* Dimensional Specification Comparison Table */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontSize: '10px', fontWeight: 700, color: 'var(--cad-cyan)' }}>
                DIMENSIONAL SPECIFICATIONS (PARENT VS WILDCAT)
              </div>
              <div style={{ fontSize: '11px' }}>
                {[
                  { label: 'Case Length (L₃)', parentVal: parent.case_length, newVal: newCartridge.case_length },
                  { label: 'Overall Length (COAL L₆)', parentVal: parent.coal, newVal: newCartridge.coal },
                  { label: 'Base Diameter (P₁)', parentVal: parent.base_diameter, newVal: newCartridge.base_diameter },
                  { label: 'Shoulder Start (P₂)', parentVal: parent.shoulder_start_diameter, newVal: newCartridge.shoulder_start_diameter },
                  { label: 'Shoulder Angle (α)', parentVal: parent.shoulder_angle, newVal: newCartridge.shoulder_angle, isAngle: true },
                  { label: 'Neck Mouth (H₂)', parentVal: parent.neck_diameter_mouth, newVal: newCartridge.neck_diameter_mouth },
                ].map((row, idx) => {
                  const diff = row.newVal - row.parentVal;
                  const isModified = Math.abs(diff) > 0.0005;
                  const formatVal = (v: number) => {
                    if (row.isAngle) return `${v.toFixed(1)}°`;
                    return isMetric ? `${(v * 25.4).toFixed(2)}mm` : `${v.toFixed(3)}"`;
                  };
                  const formatDiff = (d: number) => {
                    if (row.isAngle) return d > 0 ? `+${d.toFixed(1)}°` : `${d.toFixed(1)}°`;
                    if (isMetric) return d > 0 ? `+${(d * 25.4).toFixed(2)}mm` : `${(d * 25.4).toFixed(2)}mm`;
                    return d > 0 ? `+${d.toFixed(3)}"` : `${d.toFixed(3)}"`;
                  };
                  return (
                    <div
                      key={row.label}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                        padding: '6px 12px',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                      }}
                    >
                      <span style={{ color: isModified ? 'var(--cad-cyan)' : 'var(--text-secondary)', fontWeight: isModified ? 600 : 400 }}>
                        {row.label}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {formatVal(row.parentVal)}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: isModified ? 'var(--cad-copper)' : '#fff', fontWeight: 700 }}>
                        {formatVal(row.newVal)}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : 'var(--text-muted)' }}>
                        {Math.abs(diff) > 0.0001 ? formatDiff(diff) : '──'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warnings or Cautions */}
            {transformResult.requiresNeckTurning && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '11px',
                color: '#fca5a5'
              }}>
                <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Neck Turning Required:</strong> Brass thickening exceeds 0.015". Fireforming or shooting this wildcat without outside neck turning may cause dangerous chamber neck pinch!
                </span>
              </div>
            )}

          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 20px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Generated Design:</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cad-copper)' }}>
              {newCartridge.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            {onSaveWildcatDirectly && (
              <button
                id="btn-wizard-save-wildcat"
                onClick={handleSaveDirect}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--cad-copper)',
                  color: 'var(--cad-copper)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <BookmarkPlus size={14} />
                <span>Save Directly</span>
              </button>
            )}

            <button
              id="btn-wizard-open-designer"
              onClick={handleApply}
              style={{
                background: 'var(--cad-cyan)',
                border: 'none',
                color: '#080c14',
                borderRadius: '6px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(0, 210, 255, 0.3)'
              }}
            >
              <Sparkles size={14} />
              <span>Open in CAD Designer</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
