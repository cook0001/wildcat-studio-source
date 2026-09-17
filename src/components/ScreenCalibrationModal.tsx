import React, { useState } from 'react';
import { Crosshair, CreditCard, Ruler, CircleDot, Monitor, RotateCcw, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScreenCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ppi: number;
  onPpiChange: (newPpi: number) => void;
}

type CalibrationStandard = 'card' | 'ruler_inch' | 'ruler_metric' | 'coin';

export const ScreenCalibrationModal: React.FC<ScreenCalibrationModalProps> = ({
  isOpen,
  onClose,
  ppi,
  onPpiChange,
}) => {
  const [standard, setStandard] = useState<CalibrationStandard>('card');

  if (!isOpen) return null;

  const handlePpiUpdate = (newVal: number) => {
    const clamped = Math.max(50, Math.min(400, newVal));
    onPpiChange(clamped);
    localStorage.setItem('wildcat_screen_ppi', clamped.toFixed(1));
  };

  const handleReset = () => {
    // Default to 110 PPI (standard 27" 1440p or CSS retina base)
    handlePpiUpdate(110);
  };

  // Standard Physical Dimensions
  // Credit Card: 3.370" x 2.125" (85.60mm x 53.98mm)
  const cardWidthPx = 3.370 * ppi;
  const cardHeightPx = 2.125 * ppi;

  // 1.000 Inch line
  const oneInchPx = 1.000 * ppi;

  // 50.00 mm line (1.9685 inches)
  const fiftyMmPx = (50 / 25.4) * ppi;

  // US Quarter: 0.955" diameter (24.26mm)
  const quarterDiaPx = 0.955 * ppi;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          background: 'var(--bg-secondary, #0e121a)',
          border: '1px solid var(--border-color, #1e2638)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 240, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-tertiary, #141a26)',
            borderBottom: '1px solid var(--border-color, #1e2638)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crosshair size={18} color="var(--cad-cyan, #00f0ff)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                1:1 True-Scale Physical Display Calibration
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                Calibrate monitor pixels-per-inch (PPI) for 100% life-size physical scaling
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Reference Standard Selector Tabs */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #64748b)', letterSpacing: '0.05em', marginBottom: '8px' }}>
              CALIBRATION TARGET STANDARD
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #1e2638)',
              }}
            >
              <button
                onClick={() => setStandard('card')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: standard === 'card' ? 'var(--cad-cyan, #00f0ff)' : 'transparent',
                  color: standard === 'card' ? '#0a0d13' : 'var(--text-secondary, #94a3b8)',
                  fontWeight: standard === 'card' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <CreditCard size={14} />
                <span>Credit Card</span>
              </button>

              <button
                onClick={() => setStandard('ruler_inch')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: standard === 'ruler_inch' ? 'var(--cad-cyan, #00f0ff)' : 'transparent',
                  color: standard === 'ruler_inch' ? '#0a0d13' : 'var(--text-secondary, #94a3b8)',
                  fontWeight: standard === 'ruler_inch' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Ruler size={14} />
                <span>1.000" Caliper</span>
              </button>

              <button
                onClick={() => setStandard('ruler_metric')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: standard === 'ruler_metric' ? 'var(--cad-cyan, #00f0ff)' : 'transparent',
                  color: standard === 'ruler_metric' ? '#0a0d13' : 'var(--text-secondary, #94a3b8)',
                  fontWeight: standard === 'ruler_metric' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Ruler size={14} />
                <span>50.0 mm Metric</span>
              </button>

              <button
                onClick={() => setStandard('coin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: standard === 'coin' ? 'var(--cad-cyan, #00f0ff)' : 'transparent',
                  color: standard === 'coin' ? '#0a0d13' : 'var(--text-secondary, #94a3b8)',
                  fontWeight: standard === 'coin' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <CircleDot size={14} />
                <span>US Quarter</span>
              </button>
            </div>
          </div>

          {/* Interactive Calibration Visual Arena */}
          <div
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.04) 0%, rgba(10, 14, 22, 0.95) 100%)',
              border: '1px dashed rgba(0, 240, 255, 0.3)',
              borderRadius: '8px',
              minHeight: '220px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              position: 'relative',
              userSelect: 'none',
            }}
          >
            {/* Guide Instructions Text */}
            <div style={{ position: 'absolute', top: '10px', left: '14px', fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
              {standard === 'card' && 'Hold any standard credit card or driver\'s license against your screen to match:'}
              {standard === 'ruler_inch' && 'Hold a physical ruler or dial caliper against your monitor to match 1.000":'}
              {standard === 'ruler_metric' && 'Hold a physical metric rule against your monitor to match exactly 50.00 mm:'}
              {standard === 'coin' && 'Hold a physical US 25¢ Quarter coin directly against the circular target:'}
            </div>

            {/* Standard 1: Credit Card */}
            {standard === 'card' && (
              <div
                style={{
                  width: `${cardWidthPx}px`,
                  height: `${cardHeightPx}px`,
                  borderRadius: `${0.125 * ppi}px`,
                  border: '2px solid var(--cad-cyan, #00f0ff)',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.25), inset 0 0 15px rgba(0, 240, 255, 0.1)',
                  background: 'rgba(0, 240, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  boxSizing: 'border-box',
                  transition: 'width 0.05s, height 0.05s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan, #00f0ff)', letterSpacing: '0.08em' }}>
                    ISO/IEC 7810 ID-1 CARD
                  </div>
                  <div style={{ width: '28px', height: '20px', borderRadius: '3px', background: 'rgba(255, 215, 0, 0.3)', border: '1px solid #ffd700' }} />
                </div>
                <div style={{ textAlign: 'center', color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>
                  3.370" × 2.125" (85.60 × 53.98 mm)
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>ALIGN CARD CORNERS</span>
                  <span>1:1 SCALE</span>
                </div>
              </div>
            )}

            {/* Standard 2: 1.000 Inch Precision Ruler */}
            {standard === 'ruler_inch' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: `${oneInchPx}px`,
                    height: '40px',
                    border: '2px solid var(--cad-cyan, #00f0ff)',
                    borderBottom: 'none',
                    background: 'rgba(0, 240, 255, 0.06)',
                    position: 'relative',
                    boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
                  }}
                >
                  {/* Tick Marks: 0, 1/4, 1/2, 3/4, 1 */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: 'var(--cad-cyan)' }} />
                  <div style={{ position: 'absolute', left: `${0.25 * ppi}px`, top: 0, height: '16px', width: '1px', background: 'var(--cad-cyan)' }} />
                  <div style={{ position: 'absolute', left: `${0.5 * ppi}px`, top: 0, height: '24px', width: '1.5px', background: 'var(--cad-cyan)' }} />
                  <div style={{ position: 'absolute', left: `${0.75 * ppi}px`, top: 0, height: '16px', width: '1px', background: 'var(--cad-cyan)' }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '2px', background: 'var(--cad-cyan)' }} />
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  EXACT 1.000" (25.400 mm)
                </div>
              </div>
            )}

            {/* Standard 3: 50.00 mm Metric Ruler */}
            {standard === 'ruler_metric' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: `${fiftyMmPx}px`,
                    height: '40px',
                    border: '2px solid var(--cad-cyan, #00f0ff)',
                    borderBottom: 'none',
                    background: 'rgba(0, 240, 255, 0.06)',
                    position: 'relative',
                    boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
                  }}
                >
                  {/* 10mm Major Ticks */}
                  {[0, 10, 20, 30, 40, 50].map((mm) => (
                    <div
                      key={mm}
                      style={{
                        position: 'absolute',
                        left: `${(mm / 25.4) * ppi}px`,
                        top: 0,
                        height: mm % 10 === 0 ? '24px' : '14px',
                        width: '1px',
                        background: 'var(--cad-cyan)',
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  EXACT 50.00 mm (1.9685")
                </div>
              </div>
            )}

            {/* Standard 4: US 25¢ Quarter Coin */}
            {standard === 'coin' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: `${quarterDiaPx}px`,
                    height: `${quarterDiaPx}px`,
                    borderRadius: '50%',
                    border: '2px solid var(--cad-cyan, #00f0ff)',
                    background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.02) 70%)',
                    boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircleDot size={24} color="var(--cad-cyan)" />
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  US QUARTER: 0.955" DIA (24.26 mm)
                </div>
              </div>
            )}
          </div>

          {/* Slider & Fine-Tuning Controls */}
          <div
            style={{
              background: 'var(--bg-tertiary, #141a26)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #1e2638)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={16} color="var(--cad-cyan, #00f0ff)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Calibrated Display Density:</span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: 'var(--cad-cyan, #00f0ff)',
                    background: 'rgba(0, 240, 255, 0.1)',
                    padding: '2px 10px',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                  }}
                >
                  {ppi.toFixed(1)} PPI
                </span>
              </div>

              {/* Step Adjustment Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => handlePpiUpdate(ppi - 1)}
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Decrease 1.0 PPI"
                >
                  -1.0
                </button>
                <button
                  onClick={() => handlePpiUpdate(ppi - 0.1)}
                  style={{
                    padding: '5px 8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  title="Decrease 0.1 PPI"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => handlePpiUpdate(ppi + 0.1)}
                  style={{
                    padding: '5px 8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  title="Increase 0.1 PPI"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => handlePpiUpdate(ppi + 1)}
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Increase 1.0 PPI"
                >
                  +1.0
                </button>
              </div>
            </div>

            {/* Slider Bar */}
            <input
              type="range"
              min="65"
              max="240"
              step="0.5"
              value={ppi}
              onChange={(e) => handlePpiUpdate(parseFloat(e.target.value))}
              style={{
                width: '100%',
                cursor: 'pointer',
                accentColor: 'var(--cad-cyan, #00f0ff)',
              }}
            />

            {/* Display Presets Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>PRESETS:</span>
              {[
                { name: '1080p (24")', ppi: 92 },
                { name: '1440p (27")', ppi: 109 },
                { name: '4K (27")', ppi: 163 },
                { name: '4K (32")', ppi: 138 },
                { name: 'MacBook Pro Retina', ppi: 127 },
                { name: 'Studio 5K (27")', ppi: 218 },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePpiUpdate(preset.ppi)}
                  style={{
                    background: Math.abs(ppi - preset.ppi) < 1 ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${Math.abs(ppi - preset.ppi) < 1 ? 'var(--cad-cyan, #00f0ff)' : 'var(--border-color, #1e2638)'}`,
                    color: Math.abs(ppi - preset.ppi) < 1 ? 'var(--cad-cyan, #00f0ff)' : '#e2e8f0',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {preset.name} ({preset.ppi})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-tertiary, #141a26)',
            borderTop: '1px solid var(--border-color, #1e2638)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color, #1e2638)',
              color: 'var(--text-secondary, #94a3b8)',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={14} />
            <span>Reset to Default (110 PPI)</span>
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'var(--cad-cyan, #00f0ff)',
              color: '#0a0d13',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
            }}
          >
            <Check size={16} />
            <span>Apply Calibration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
