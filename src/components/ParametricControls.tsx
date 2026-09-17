import React, { useState } from 'react';
import { CartridgeSpec, RimType, CARTRIDGE_PRESETS } from '../types/cartridge';
import { isStraightWall } from '../utils/volumetrics';
import { BULLET_OPTIONS, getBulletsForCaliber } from '../data/bullets';
import { Sliders, Shield, ShieldOff, Disc, CircleDot, Crosshair, ChevronDown, ChevronRight, PanelLeftClose, Undo2 } from 'lucide-react';

interface ParametricControlsProps {
  cartridge: CartridgeSpec;
  onChange: (updated: CartridgeSpec) => void;
  isMetric: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const ParametricControls: React.FC<ParametricControlsProps> = ({
  cartridge,
  onChange,
  isMetric,
  isOpen = true,
  onClose,
}) => {
  const SECTION_KEYS = ['rim', 'body', 'shoulder', 'bullet', 'web'];
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('wildcat_sidebar_collapsed_sections');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [showShoulderMenu, setShowShoulderMenu] = useState<boolean>(false);

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [section]: !prev[section] };
      localStorage.setItem('wildcat_sidebar_collapsed_sections', JSON.stringify(next));
      return next;
    });
  };

  const allCollapsed = SECTION_KEYS.every((k) => collapsedSections[k]);

  const toggleCollapseAll = () => {
    const nextVal = !allCollapsed;
    const nextObj: Record<string, boolean> = {};
    SECTION_KEYS.forEach((k) => {
      nextObj[k] = nextVal;
    });
    setCollapsedSections(nextObj);
    localStorage.setItem('wildcat_sidebar_collapsed_sections', JSON.stringify(nextObj));
  };

  const handleRemoveShoulder = (option: 'taper_to_mouth' | 'full_cylinder' | 'shoulder_dia' | 'zero_angle') => {
    switch (option) {
      case 'taper_to_mouth':
        onChange({
          ...cartridge,
          body_length: cartridge.case_length,
          shoulder_length: 0.0,
          shoulder_angle: 0.0,
          shoulder_start_diameter: cartridge.neck_diameter_mouth,
          neck_diameter_base: cartridge.neck_diameter_mouth,
        });
        break;

      case 'full_cylinder':
        {
          const baseDia = cartridge.base_diameter;
          const bulletDia = Math.max(0.170, Math.round((baseDia - 2 * cartridge.neck_wall_thickness) * 1000) / 1000);
          onChange({
            ...cartridge,
            body_length: cartridge.case_length,
            shoulder_length: 0.0,
            shoulder_angle: 0.0,
            shoulder_start_diameter: baseDia,
            neck_diameter_base: baseDia,
            neck_diameter_mouth: baseDia,
            bullet_diameter: bulletDia,
          });
        }
        break;

      case 'shoulder_dia':
        {
          const p2 = cartridge.shoulder_start_diameter;
          const bulletDia = Math.max(0.170, Math.round((p2 - 2 * cartridge.neck_wall_thickness) * 1000) / 1000);
          onChange({
            ...cartridge,
            body_length: cartridge.case_length,
            shoulder_length: 0.0,
            shoulder_angle: 0.0,
            neck_diameter_base: p2,
            neck_diameter_mouth: p2,
            bullet_diameter: bulletDia,
          });
        }
        break;

      case 'zero_angle':
        onChange({
          ...cartridge,
          shoulder_length: 0.0,
          shoulder_angle: 0.0,
          shoulder_start_diameter: cartridge.neck_diameter_mouth,
          neck_diameter_base: cartridge.neck_diameter_mouth,
          body_length: cartridge.case_length,
        });
        break;
    }
  };

  const handleAddShoulder = (angleDeg: number) => {
    const l3 = cartridge.case_length;
    const p1 = cartridge.base_diameter;
    const h2 = cartridge.neck_diameter_mouth;
    const bodyLen = Math.max(0.600, Math.round((l3 - 0.380) * 1000) / 1000);
    const shLen = angleDeg >= 35 ? 0.075 : angleDeg >= 25 ? 0.100 : 0.140;
    const p2 = Math.round((p1 * 0.965) * 10000) / 10000;

    onChange({
      ...cartridge,
      body_length: bodyLen,
      shoulder_length: shLen,
      shoulder_angle: angleDeg,
      shoulder_start_diameter: Math.max(p2, h2 + 0.020),
      neck_diameter_base: h2,
    });
  };

  const handleRestoreFactoryShoulder = () => {
    if (!preset) return;
    onChange({
      ...cartridge,
      body_length: preset.body_length,
      shoulder_length: preset.shoulder_length,
      shoulder_angle: preset.shoulder_angle,
      shoulder_start_diameter: preset.shoulder_start_diameter,
      neck_diameter_base: preset.neck_diameter_base,
      neck_diameter_mouth: preset.neck_diameter_mouth,
      bullet_diameter: preset.bullet_diameter,
    });
  };

  const shoulderOptionBtnStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    padding: '6px 8px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    transition: 'all 0.15s'
  };

  const updateParam = <K extends keyof CartridgeSpec>(key: K, value: CartridgeSpec[K]) => {
    let updated: CartridgeSpec = { ...cartridge, [key]: value };

    if (key === 'shoulder_angle') {
      const angle = value as number;
      const neckBase = updated.neck_diameter_base || updated.neck_diameter_mouth;
      const dr = (updated.shoulder_start_diameter - neckBase) / 2.0;
      if (angle > 0.5 && dr > 0.001) {
        const rad = (angle * Math.PI) / 180;
        updated.shoulder_length = +(dr / Math.tan(rad)).toFixed(4);
      } else if (angle <= 0.05) {
        updated.shoulder_length = 0.0;
      }
    } else if (key === 'shoulder_length') {
      const shLen = value as number;
      const neckBase = updated.neck_diameter_base || updated.neck_diameter_mouth;
      const dr = (updated.shoulder_start_diameter - neckBase) / 2.0;
      if (shLen > 0.002 && dr > 0.001) {
        updated.shoulder_angle = +((Math.atan(dr / shLen) * 180) / Math.PI).toFixed(1);
      } else if (shLen <= 0.002) {
        updated.shoulder_angle = 0.0;
      }
    } else if (key === 'shoulder_start_diameter' || key === 'neck_diameter_base' || key === 'neck_diameter_mouth') {
      if (updated.shoulder_angle > 0.5) {
        const neckBase = updated.neck_diameter_base || updated.neck_diameter_mouth;
        const dr = (updated.shoulder_start_diameter - neckBase) / 2.0;
        if (dr > 0.001) {
          const rad = (updated.shoulder_angle * Math.PI) / 180;
          updated.shoulder_length = +(dr / Math.tan(rad)).toFixed(4);
        }
      }
    }

    onChange(updated);
  };

  // Convert for display
  const displayVal = (inches: number) => {
    if (isMetric) return +(inches * 25.4).toFixed(3);
    return +inches.toFixed(4);
  };

  const handleValChange = (key: keyof CartridgeSpec, rawVal: number) => {
    const inches = isMetric ? rawVal / 25.4 : rawVal;
    updateParam(key, inches as any);
  };

  const unitLabel = isMetric ? 'mm' : 'in';
  const preset = CARTRIDGE_PRESETS[cartridge.id];

  const renderSlider = (
    label: string,
    key: keyof CartridgeSpec,
    min: number,
    max: number,
    step: number,
    isRaw = false,
    unit = unitLabel
  ) => {
    const rawVal = cartridge[key] as number;
    const currentVal = isRaw ? rawVal : displayVal(rawVal);
    const presetRaw = preset ? (preset[key] as number) : undefined;
    const defaultVal = presetRaw !== undefined ? (isRaw ? presetRaw : displayVal(presetRaw)) : undefined;

    return (
      <SliderField
        key={String(key)}
        label={label}
        value={currentVal}
        defaultValue={defaultVal}
        min={min}
        max={max}
        step={step}
        unit={unit}
        onChange={(v) => {
          if (isRaw) {
            updateParam(key, v as any);
          } else {
            handleValChange(key, v);
          }
        }}
        onReset={() => {
          if (presetRaw !== undefined) {
            updateParam(key, presetRaw as any);
          }
        }}
      />
    );
  };

  return (
    <aside
      id="sidebar-parametric"
      style={{
        width: isOpen ? '340px' : '0px',
        minWidth: isOpen ? '340px' : '0px',
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRight: isOpen ? '1px solid var(--border-color)' : 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        zIndex: 30,
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        visibility: isOpen ? 'visible' : 'hidden',
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div style={{
        width: '340px',
        minWidth: '340px',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Title / Identity Card */}
        <div style={{ padding: '14px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan)', letterSpacing: '0.5px' }}>
              CARTRIDGE SPECIFICATION
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                padding: '2px 6px',
                borderRadius: '4px',
                background: cartridge.standard === 'Wildcat' ? 'rgba(240, 136, 62, 0.2)' : 'rgba(0, 210, 255, 0.2)',
                color: cartridge.standard === 'Wildcat' ? 'var(--cad-copper)' : 'var(--cad-cyan)',
                fontWeight: 700
              }}>
                {cartridge.standard}
              </span>
              {onClose && (
                <button
                  id="btn-close-sidebar-header"
                  onClick={onClose}
                  title="Hide Parameters Sidebar (⌘B)"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    transition: 'all 0.15s'
                  }}
                >
                  <PanelLeftClose size={13} />
                  <span>Hide</span>
                </button>
              )}
            </div>
          </div>

        <input
          type="text"
          value={cartridge.name}
          onChange={(e) => updateParam('name', e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            padding: '6px 8px',
            outline: 'none',
            marginBottom: '8px'
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Standard</label>
            <select
              value={cartridge.standard}
              onChange={(e) => updateParam('standard', e.target.value as any)}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px',
                fontSize: '11px'
              }}
            >
              <option value="SAAMI">SAAMI (US)</option>
              <option value="CIP">CIP (Europe)</option>
              <option value="Wildcat">Wildcat / Custom</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Rim Architecture</label>
            <select
              value={cartridge.rim_type}
              onChange={(e) => updateParam('rim_type', e.target.value as RimType)}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px',
                fontSize: '11px'
              }}
            >
              <option value="rimless">Rimless</option>
              <option value="rimmed">Rimmed</option>
              <option value="semi_rimmed">Semi-Rimmed</option>
              <option value="belted">Belted Magnum</option>
              <option value="rebated">Rebated Rim</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <div style={{ padding: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px 8px 4px',
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Dimension Groups
          </span>
          <button
            id="btn-toggle-collapse-all-sections"
            onClick={toggleCollapseAll}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--cad-cyan)',
              fontSize: '10.5px',
              cursor: 'pointer',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '3px',
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </button>
        </div>

        {/* SECTION 1: Rim & Extractor */}
        <div style={{ marginBottom: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }}>
          <button
            onClick={() => toggleSection('rim')}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Disc size={14} color="var(--cad-cyan)" /> Rim & Extractor Groove
            </span>
            {collapsedSections['rim'] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          {!collapsedSections['rim'] && (
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-color)' }}>
              {renderSlider("Rim Diameter (R₁)", "rim_diameter", isMetric ? 7.0 : 0.280, isMetric ? 18.0 : 0.700, isMetric ? 0.05 : 0.001)}
              {renderSlider("Rim Thickness (R)", "rim_thickness", isMetric ? 0.8 : 0.030, isMetric ? 3.5 : 0.120, isMetric ? 0.02 : 0.001)}
              {renderSlider("Extractor Dia (E₁)", "extractor_diameter", isMetric ? 6.0 : 0.240, isMetric ? 16.0 : 0.650, isMetric ? 0.05 : 0.001)}
              {renderSlider("Extractor Width (e)", "extractor_width", isMetric ? 0.5 : 0.020, isMetric ? 2.5 : 0.080, isMetric ? 0.02 : 0.001)}
            </div>
          )}
        </div>

        {/* SECTION 2: Body & Taper */}
        <div style={{ marginBottom: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }}>
          <button
            onClick={() => toggleSection('body')}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CircleDot size={14} color="var(--cad-cyan)" /> Case Body & Taper
            </span>
            {collapsedSections['body'] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          {!collapsedSections['body'] && (
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-color)' }}>
              {renderSlider("Base Diameter (P₁)", "base_diameter", isMetric ? 7.0 : 0.280, isMetric ? 18.0 : 0.700, isMetric ? 0.05 : 0.001)}
              {renderSlider("Shoulder Start Dia (P₂)", "shoulder_start_diameter", isMetric ? 6.5 : 0.250, isMetric ? 17.5 : 0.680, isMetric ? 0.05 : 0.001)}
              {renderSlider("Body Length (L₁)", "body_length", isMetric ? 15.0 : 0.600, isMetric ? 80.0 : 3.200, isMetric ? 0.1 : 0.005)}
            </div>
          )}
        </div>

        {/* SECTION 3: Shoulder & Neck */}
        <div style={{ marginBottom: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }}>
          <button
            onClick={() => toggleSection('shoulder')}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} color="var(--cad-brass)" /> Shoulder & Neck
            </span>
            {collapsedSections['shoulder'] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          {!collapsedSections['shoulder'] && (
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-color)' }}>
              {/* Shoulder Architecture Status & Conversion Options */}
              <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showShoulderMenu ? '8px' : '0px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isStraightWall(cartridge) ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(0, 210, 255, 0.15)',
                        color: 'var(--cad-cyan)',
                        border: '1px solid rgba(0, 210, 255, 0.3)'
                      }}>
                        <ShieldOff size={11} /> STRAIGHT-WALL (NO SHOULDER)
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(240, 136, 62, 0.15)',
                        color: 'var(--cad-copper)',
                        border: '1px solid rgba(240, 136, 62, 0.3)'
                      }}>
                        <Shield size={11} /> BOTTLENECK (SHOULDERED)
                      </span>
                    )}
                  </div>

                  <button
                    id="btn-toggle-shoulder-options"
                    onClick={() => setShowShoulderMenu(!showShoulderMenu)}
                    style={{
                      background: showShoulderMenu ? 'var(--cad-cyan)' : 'transparent',
                      color: showShoulderMenu ? '#0a0d13' : 'var(--cad-cyan)',
                      border: '1px solid var(--cad-cyan)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{isStraightWall(cartridge) ? 'Add Shoulder...' : 'Remove Shoulder...'}</span>
                    <ChevronDown size={12} style={{ transform: showShoulderMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>
                </div>

                {/* Dropdown / Drawer for Shoulder Removal / Addition Options */}
                {showShoulderMenu && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {!isStraightWall(cartridge) ? (
                      <>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
                          CHOOSE SHOULDER REMOVAL ARCHITECTURE:
                        </div>
                        <button
                          id="btn-remove-shoulder-taper"
                          onClick={() => {
                            handleRemoveShoulder('taper_to_mouth');
                            setShowShoulderMenu(false);
                          }}
                          style={shoulderOptionBtnStyle}
                        >
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '11px' }}>
                            1. Taper to Mouth (Keep Caliber H₂)
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>
                            Continuous straight taper from Base P₁ to Mouth H₂ (like .350 Legend)
                          </div>
                        </button>

                        <button
                          id="btn-remove-shoulder-cylinder"
                          onClick={() => {
                            handleRemoveShoulder('full_cylinder');
                            setShowShoulderMenu(false);
                          }}
                          style={shoulderOptionBtnStyle}
                        >
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '11px' }}>
                            2. Full Cylinder (Base Diameter P₁)
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>
                            Blow out into straight parallel cylinder matching Base P₁ (like .450 Bushmaster)
                          </div>
                        </button>

                        <button
                          id="btn-remove-shoulder-p2"
                          onClick={() => {
                            handleRemoveShoulder('shoulder_dia');
                            setShowShoulderMenu(false);
                          }}
                          style={shoulderOptionBtnStyle}
                        >
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '11px' }}>
                            3. Straight-Wall at Shoulder Dia (P₂)
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>
                            Retain body taper, eliminate neck step, extend P₂ to case mouth
                          </div>
                        </button>

                        <button
                          id="btn-remove-shoulder-zero"
                          onClick={() => {
                            handleRemoveShoulder('zero_angle');
                            setShowShoulderMenu(false);
                          }}
                          style={shoulderOptionBtnStyle}
                        >
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '11px' }}>
                            4. Zero Angle (α = 0°, L_sh = 0)
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>
                            Zeroes shoulder angle and shoulder length without altering diameters
                          </div>
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
                          RESTORE OR ADD BOTTLENECK SHOULDER:
                        </div>
                        {preset && preset.shoulder_angle > 0 && (
                          <button
                            id="btn-restore-preset-shoulder"
                            onClick={() => {
                              handleRestoreFactoryShoulder();
                              setShowShoulderMenu(false);
                            }}
                            style={{
                              ...shoulderOptionBtnStyle,
                              borderColor: 'var(--cad-cyan)',
                              background: 'rgba(0, 210, 255, 0.08)'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: 'var(--cad-cyan)', fontSize: '11px' }}>
                              ↺ Restore Factory Spec Shoulder ({preset.shoulder_angle}° α)
                            </div>
                            <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>
                              Restores original factory shoulder geometry from preset
                            </div>
                          </button>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                          <button
                            id="btn-add-shoulder-20"
                            onClick={() => {
                              handleAddShoulder(20.0);
                              setShowShoulderMenu(false);
                            }}
                            style={{
                              ...shoulderOptionBtnStyle,
                              textAlign: 'center',
                              padding: '6px 4px'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '11px' }}>+ 20.0°</div>
                            <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Standard</div>
                          </button>

                          <button
                            id="btn-add-shoulder-30"
                            onClick={() => {
                              handleAddShoulder(30.0);
                              setShowShoulderMenu(false);
                            }}
                            style={{
                              ...shoulderOptionBtnStyle,
                              textAlign: 'center',
                              padding: '6px 4px'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '11px' }}>+ 30.0°</div>
                            <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Match PRS</div>
                          </button>

                          <button
                            id="btn-add-shoulder-40"
                            onClick={() => {
                              handleAddShoulder(40.0);
                              setShowShoulderMenu(false);
                            }}
                            style={{
                              ...shoulderOptionBtnStyle,
                              textAlign: 'center',
                              padding: '6px 4px'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '11px' }}>+ 40.0°</div>
                            <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Ackley</div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {renderSlider("Shoulder Angle (α)", "shoulder_angle", 0.0, 50.0, 0.5, true, "°")}
              {renderSlider("Shoulder Length (L₂ - L₁)", "shoulder_length", isMetric ? 0.0 : 0.000, isMetric ? 12.0 : 0.450, isMetric ? 0.05 : 0.002)}
              {renderSlider("Neck Dia Mouth (H₂)", "neck_diameter_mouth", isMetric ? 4.0 : 0.180, isMetric ? 18.0 : 0.720, isMetric ? 0.02 : 0.001)}
              {renderSlider("Total Case Length (L₃)", "case_length", isMetric ? 10.0 : 0.400, isMetric ? 120.0 : 4.500, isMetric ? 0.1 : 0.005)}
            </div>
          )}
        </div>

        {/* SECTION 4: Internal Walls & Construction */}
        <div style={{ marginBottom: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }}>
          <button
            onClick={() => toggleSection('internal')}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={14} color="#3fb950" /> Internal Walls & Web
            </span>
            {collapsedSections['internal'] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          {!collapsedSections['internal'] && (
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-color)' }}>
              {renderSlider("Web Thickness (Head)", "web_thickness", isMetric ? 2.5 : 0.100, isMetric ? 7.5 : 0.300, isMetric ? 0.05 : 0.002)}
              {renderSlider("Base Wall Thickness", "base_wall_thickness", isMetric ? 0.4 : 0.015, isMetric ? 1.6 : 0.060, isMetric ? 0.02 : 0.001)}
              {renderSlider("Neck Wall Thickness", "neck_wall_thickness", isMetric ? 0.2 : 0.008, isMetric ? 0.8 : 0.030, isMetric ? 0.01 : 0.001)}
              {renderSlider("Primer Pocket Dia", "primer_pocket_dia", isMetric ? 4.0 : 0.160, isMetric ? 6.0 : 0.230, isMetric ? 0.05 : 0.002)}
            </div>
          )}
        </div>

        {/* SECTION 5: Bullet & Seating */}
        <div style={{ marginBottom: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }}>
          <button
            onClick={() => toggleSection('bullet')}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Crosshair size={14} color="var(--cad-copper)" /> Bullet & Seating Depth
            </span>
            {collapsedSections['bullet'] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          {!collapsedSections['bullet'] && (
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-color)' }}>
              {/* Quick Caliber Presets */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--cad-copper)', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>STANDARD CALIBER PRESETS</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{cartridge.bullet_diameter.toFixed(3)}" ({(cartridge.bullet_diameter * 25.4).toFixed(2)}mm)</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxHeight: '56px', overflowY: 'auto', paddingRight: '2px' }}>
                  {[0.224, 0.243, 0.257, 0.264, 0.277, 0.284, 0.308, 0.311, 0.323, 0.338, 0.355, 0.357, 0.358, 0.366, 0.375, 0.400, 0.408, 0.416, 0.429, 0.452, 0.458, 0.500, 0.510].map((cal) => {
                    const isActive = Math.abs(cartridge.bullet_diameter - cal) < 0.003;
                    return (
                      <button
                        key={cal}
                        type="button"
                        onClick={() => {
                          const wallT = cartridge.neck_wall_thickness || 0.015;
                          const newMouth = +(cal + 2 * wallT).toFixed(4);
                          onChange({
                            ...cartridge,
                            bullet_diameter: cal,
                            neck_diameter_mouth: newMouth,
                            neck_diameter_base: newMouth,
                          });
                        }}
                        style={{
                          background: isActive ? 'rgba(240, 136, 62, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isActive ? 'var(--cad-copper)' : 'rgba(255, 255, 255, 0.1)'}`,
                          color: isActive ? '#fff' : 'var(--text-secondary)',
                          borderRadius: '3px',
                          padding: '2px 4px',
                          fontSize: '9px',
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        .{cal.toString().split('.')[1]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Factory Bullet Preset Selector */}
              {(() => {
                const activeBullet = BULLET_OPTIONS.find(b =>
                  Math.abs(b.caliber_inches - cartridge.bullet_diameter) < 0.003 &&
                  cartridge.bullet_weight_grains === b.weight_grains
                );

                return (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--cad-cyan)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>FACTORY BULLET MODEL PRESET</span>
                      {activeBullet && (
                        <span style={{ fontSize: '8px', color: '#34d399', fontWeight: 600 }}>✓ LOADED</span>
                      )}
                    </div>
                    <select
                      value={activeBullet ? activeBullet.id : ""}
                      onChange={(e) => {
                        const selected = BULLET_OPTIONS.find(b => b.id === e.target.value);
                        if (selected) {
                          const wallT = cartridge.neck_wall_thickness || 0.015;
                          const newMouth = +(selected.caliber_inches + 2 * wallT).toFixed(4);
                          const seatDepth = selected.recommended_seating_depth || cartridge.seating_depth || 0.300;
                          const newCoal = +(cartridge.case_length + selected.length_inches - seatDepth).toFixed(4);
                          onChange({
                            ...cartridge,
                            bullet_diameter: selected.caliber_inches,
                            bullet_weight_grains: selected.weight_grains,
                            bullet_length: selected.length_inches,
                            seating_depth: seatDepth,
                            coal: newCoal,
                            neck_diameter_mouth: newMouth,
                            neck_diameter_base: newMouth,
                          });
                        }
                      }}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: `1px solid ${activeBullet ? 'rgba(0, 210, 255, 0.5)' : 'rgba(0, 210, 255, 0.3)'}`,
                        color: '#fff',
                        fontSize: '10px',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" disabled>Select factory bullet model...</option>
                      <optgroup label={`Bullets for ${cartridge.bullet_diameter.toFixed(3)}" Caliber`}>
                        {getBulletsForCaliber(cartridge.bullet_diameter, 0.006).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.weight_grains}gr, L: {b.length_inches}", BC: {b.g1_bc})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="All Other Calibers">
                        {BULLET_OPTIONS.filter(b => Math.abs(b.caliber_inches - cartridge.bullet_diameter) > 0.006).map(b => (
                          <option key={b.id} value={b.id}>
                            .{b.caliber_inches.toString().split('.')[1]} - {b.name} ({b.weight_grains}gr)
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    {activeBullet && (
                      <div style={{
                        marginTop: '6px',
                        background: 'rgba(0, 210, 255, 0.08)',
                        border: '1px solid rgba(0, 210, 255, 0.25)',
                        borderRadius: '4px',
                        padding: '5px 7px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#fff' }}>
                            {activeBullet.name}
                          </span>
                          <span style={{ fontSize: '7.5px', color: 'var(--cad-cyan)', background: 'rgba(0, 210, 255, 0.2)', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                            {activeBullet.manufacturer}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-secondary)' }}>
                          <span>Weight: <strong style={{ color: '#fff' }}>{activeBullet.weight_grains} gr</strong></span>
                          <span>Length: <strong style={{ color: '#fff' }}>{activeBullet.length_inches}"</strong></span>
                          <span>G1 BC: <strong style={{ color: '#34d399' }}>{activeBullet.g1_bc}</strong></span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-secondary)' }}>
                          <span>Seat Depth: <strong style={{ color: '#fff' }}>{cartridge.seating_depth}"</strong></span>
                          <span>Active COAL: <strong style={{ color: '#fbbf24' }}>{cartridge.coal.toFixed(3)}"</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {renderSlider("Bullet Diameter (G₁)", "bullet_diameter", isMetric ? 4.0 : 0.172, isMetric ? 13.0 : 0.510, isMetric ? 0.02 : 0.001)}
              {renderSlider("Bullet Length", "bullet_length", isMetric ? 10.0 : 0.400, isMetric ? 60.0 : 2.400, isMetric ? 0.1 : 0.005)}
              {renderSlider("Bullet Weight", "bullet_weight_grains", 30, 450, 1, true, "grains")}
              {renderSlider("Seating Depth (Displacement)", "seating_depth", isMetric ? 2.0 : 0.100, isMetric ? 25.0 : 1.000, isMetric ? 0.1 : 0.005)}
              {renderSlider("Cartridge Overall Length (COAL)", "coal", isMetric ? 30.0 : 1.200, isMetric ? 120.0 : 4.500, isMetric ? 0.1 : 0.005)}
            </div>
          )}
        </div>

      </div>
      </div>
    </aside>
  );
};

interface SliderFieldProps {
  label: string;
  value: number;
  defaultValue?: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
  onReset?: () => void;
}

const SliderField: React.FC<SliderFieldProps> = ({
  label,
  value,
  defaultValue,
  min,
  max,
  step,
  unit,
  onChange,
  onReset,
}) => {
  const isModified = defaultValue !== undefined && Math.abs(value - defaultValue) > (unit === '°' ? 0.05 : 0.0005);

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{
          fontSize: '11px',
          color: isModified ? 'var(--cad-cyan)' : 'var(--text-secondary)',
          fontWeight: isModified ? 600 : 400
        }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isModified && onReset && (
            <button
              onClick={onReset}
              title={`Undo change to ${label} (revert to ${defaultValue}${unit})`}
              style={{
                background: 'rgba(0, 210, 255, 0.12)',
                border: '1px solid rgba(0, 210, 255, 0.4)',
                color: 'var(--cad-cyan)',
                borderRadius: '3px',
                padding: '2px 5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              <Undo2 size={10} />
              <span>Undo</span>
            </button>
          )}
          <input
            type="number"
            value={value}
            step={step}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            style={{ width: '65px', textAlign: 'right' }}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
};
