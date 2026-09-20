import React, { useState, useMemo } from 'react';
import { 
  CartridgeSpec, 
  CaseFormingResult 
} from '../../types/cartridge';
import { 
  analyzeCaseForming, 
  calculateVolumetricsFrontend,
  getOuterRadiusAt 
} from '../../utils/volumetrics';
import { 
  openStandalonePrintWindow, 
  openNativePdfPrint,
  isTypstAvailable, 
  compileTypstToPdf 
} from '../../utils/fileExport';
import { generateFormingTypst } from '../../utils/typstTemplates';
import { CartridgePickerModal } from './CartridgePickerModal';
import { 
  X, 
  Wand2, 
  AlertTriangle, 
  Printer, 
  Layers, 
  Flame, 
  ArrowRight,
  Search
} from 'lucide-react';

interface FormingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCartridge: CartridgeSpec;
  allPresets: Record<string, CartridgeSpec>;
  customCartridges: Record<string, CartridgeSpec>;
  isMetric: boolean;
}

export const FormingModal: React.FC<FormingModalProps> = ({
  isOpen,
  onClose,
  activeCartridge,
  allPresets,
  customCartridges,
  isMetric,
}) => {
  // Candidate donor case selection
  const allAvailable = useMemo(() => {
    return { ...allPresets, ...customCartridges };
  }, [allPresets, customCartridges]);

  // Initial donor: default to parent_case if present, else .308 Win, or first match
  const [selectedDonorId, setSelectedDonorId] = useState<string>(() => {
    if (activeCartridge.parent_case) {
      const match = Object.values(allAvailable).find(
        c => c.name.toLowerCase() === activeCartridge.parent_case?.toLowerCase() ||
             c.id.toLowerCase() === activeCartridge.parent_case?.toLowerCase()
      );
      if (match) return match.id;
    }
    return activeCartridge.id === '308_win' ? '30_06_springfield' : '308_win';
  });

  const [fireformingMethod, setFireformingMethod] = useState<'mild_load' | 'cow_plug'>('mild_load');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

  const donorCartridge = allAvailable[selectedDonorId] || allPresets['308_win'];

  const formingResult: CaseFormingResult = useMemo(() => {
    return analyzeCaseForming(donorCartridge, activeCartridge);
  }, [donorCartridge, activeCartridge]);

  const donorVol = useMemo(() => calculateVolumetricsFrontend(donorCartridge), [donorCartridge]);
  const wildcatVol = useMemo(() => calculateVolumetricsFrontend(activeCartridge), [activeCartridge]);

  const volumeDeltaH2O = wildcatVol.overflow_capacity_grains_h2o - donorVol.overflow_capacity_grains_h2o;
  const volumeDeltaPct = donorVol.overflow_capacity_grains_h2o > 0 
    ? (volumeDeltaH2O / donorVol.overflow_capacity_grains_h2o) * 100 
    : 0;

  const fmt = (valInches: number, precision = 4) => {
    if (isMetric) return (valInches * 25.4).toFixed(3) + ' mm';
    return valInches.toFixed(precision) + '"';
  };

  const handlePrint = async () => {
    const typstOk = await isTypstAvailable();
    if (typstOk) {
      try {
        const typstCode = generateFormingTypst(activeCartridge, donorCartridge, formingResult.recommended_steps);
        const pdfBytes = await compileTypstToPdf(typstCode);
        // Launch directly in Preview.app on macOS for instant toolroom printing!
        await openNativePdfPrint(pdfBytes, `Case_Forming_${activeCartridge.name}`);
        return;
      } catch (err) {
        console.warn('Typst compile error, falling back to vector print window:', err);
      }
    }

    const printHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Case Forming Protocol - ${activeCartridge.name}</title>
    <style>
      @page { size: letter portrait; margin: 0.45in; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 16px;
        color: #0f172a;
        background: #ffffff;
        line-height: 1.5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .header-bar {
        border-bottom: 2px solid #0f172a;
        padding-bottom: 10px;
        margin-bottom: 14px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .header-title { font-size: 19px; font-weight: 800; color: #0f172a; margin: 0; }
      .header-sub { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
      .header-date { font-size: 11px; font-family: monospace; color: #475569; text-align: right; }
      .summary-banner {
        background: #f8fafc;
        border: 1.5px solid #cbd5e1;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .banner-donor { font-size: 13px; color: #334155; }
      .banner-arrow { font-size: 16px; font-weight: 800; color: #0284c7; margin: 0 8px; }
      .section-heading {
        font-size: 12px;
        font-weight: 800;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1.5px solid #e2e8f0;
        padding-bottom: 4px;
        margin: 16px 0 8px 0;
      }
      table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
      th { background: #f1f5f9; font-weight: bold; color: #334155; }
      .step-card {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-left: 3px solid #0284c7;
        border-radius: 4px;
        padding: 8px 12px;
        margin-bottom: 8px;
        font-size: 11.5px;
      }
      .step-num { font-weight: 800; color: #0284c7; margin-right: 6px; }
      .risk-box {
        border-radius: 6px;
        padding: 12px 14px;
        margin-top: 10px;
        font-size: 11.5px;
        background: ${formingResult.requires_neck_turning ? '#fffbeb' : '#f0fdf4'};
        border: 1.5px solid ${formingResult.requires_neck_turning ? '#f59e0b' : '#10b981'};
      }
      .footer {
        margin-top: 24px;
        border-top: 1px solid #cbd5e1;
        padding-top: 8px;
        font-size: 10px;
        color: #94a3b8;
        display: flex;
        justify-content: space-between;
      }
    </style>
  </head>
  <body>
    <div class="header-bar">
      <div>
        <div class="header-sub">Wildcat Studio Case Forming Engine</div>
        <h1 class="header-title">${activeCartridge.name} &bull; Case Forming & Fireforming Protocol</h1>
      </div>
      <div class="header-date">
        DATE: ${new Date().toLocaleDateString()}<br/>
        STANDARD: ${activeCartridge.standard.toUpperCase()}
      </div>
    </div>

    <div class="summary-banner">
      <div class="banner-donor">
        <strong>Parent Donor Brass:</strong> ${donorCartridge.name} (${donorCartridge.category})
        <span class="banner-arrow">&rarr;</span>
        <strong>Target Wildcat:</strong> ${activeCartridge.name} (${activeCartridge.category})
      </div>
      <div style="font-size: 11px; font-family: monospace; font-weight: 700; color: #0284c7;">
        WALL DISPLACEMENT: ${(Math.abs(activeCartridge.bullet_diameter - donorCartridge.bullet_diameter) * 25.4).toFixed(2)} mm
      </div>
    </div>

    <div class="section-heading">Dimensional Comparison & Toolroom Delta</div>
    <table>
      <thead>
        <tr>
          <th>Dimension</th>
          <th>Parent Donor (${donorCartridge.name})</th>
          <th>Target Wildcat (${activeCartridge.name})</th>
          <th>Displacement Delta (&Delta;)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Bullet / Neck Mouth</td>
          <td>${fmt(donorCartridge.neck_diameter_mouth)}</td>
          <td>${fmt(activeCartridge.neck_diameter_mouth)}</td>
          <td><strong>${activeCartridge.neck_diameter_mouth >= donorCartridge.neck_diameter_mouth ? '+' : ''}${fmt(activeCartridge.neck_diameter_mouth - donorCartridge.neck_diameter_mouth)}</strong></td>
        </tr>
        <tr>
          <td>Shoulder Diameter</td>
          <td>${fmt(donorCartridge.shoulder_start_diameter)}</td>
          <td>${fmt(activeCartridge.shoulder_start_diameter)}</td>
          <td><strong>${activeCartridge.shoulder_start_diameter >= donorCartridge.shoulder_start_diameter ? '+' : ''}${fmt(activeCartridge.shoulder_start_diameter - donorCartridge.shoulder_start_diameter)}</strong></td>
        </tr>
        <tr>
          <td>Base Diameter</td>
          <td>${fmt(donorCartridge.base_diameter)}</td>
          <td>${fmt(activeCartridge.base_diameter)}</td>
          <td><strong>${activeCartridge.base_diameter >= donorCartridge.base_diameter ? '+' : ''}${fmt(activeCartridge.base_diameter - donorCartridge.base_diameter)}</strong></td>
        </tr>
        <tr>
          <td>Case Length</td>
          <td>${fmt(donorCartridge.case_length)}</td>
          <td>${fmt(activeCartridge.case_length)}</td>
          <td><strong>${activeCartridge.case_length >= donorCartridge.case_length ? '+' : ''}${fmt(activeCartridge.case_length - donorCartridge.case_length)}</strong></td>
        </tr>
        <tr>
          <td>Shoulder Angle</td>
          <td>${donorCartridge.shoulder_angle.toFixed(1)}&deg;</td>
          <td>${activeCartridge.shoulder_angle.toFixed(1)}&deg;</td>
          <td><strong>${(activeCartridge.shoulder_angle - donorCartridge.shoulder_angle).toFixed(1)}&deg;</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="section-heading">Recommended Forming Steps & Die Progression</div>
    ${formingResult.recommended_steps
      .map(
        (s, i) => `
      <div class="step-card">
        <span class="step-num">Step ${i + 1}:</span> ${s}
      </div>
    `
      )
      .join('')}

    <div class="section-heading">Donut Diagnostic & Neck Wall Thickness Analysis</div>
    <div class="risk-box">
      <div style="font-weight: 800; font-size: 12px; margin-bottom: 4px; color: ${formingResult.requires_neck_turning ? '#b45309' : '#15803d'};">
        INTERNAL DONUT RISK: ${formingResult.doughnut_risk.toUpperCase()} &bull; OUTSIDE NECK TURNING: ${formingResult.requires_neck_turning ? 'REQUIRED' : 'NOT REQUIRED'}
      </div>
      <div>${formingResult.doughnut_reason}</div>
    </div>

    <div class="footer">
      <span>Wildcat Studio CAD &bull; Precision Ballistics Engine</span>
      <span>Forming Sheet ID: FORM-${Date.now().toString(36).toUpperCase()}</span>
    </div>
  </body>
</html>`;
    openStandalonePrintWindow(printHtml, `Case Forming - ${activeCartridge.name}`);
  };

  if (!isOpen) return null;

  // SVG Drawing dimensions for overlay
  const maxLen = Math.max(donorCartridge.case_length, activeCartridge.case_length);
  const maxDia = Math.max(donorCartridge.rim_diameter, activeCartridge.rim_diameter, donorCartridge.base_diameter, activeCartridge.base_diameter);
  const svgWidth = 560;
  const svgHeight = 220;
  const padX = 40;
  const scaleX = (svgWidth - padX * 2) / Math.max(0.1, maxLen);
  const scaleY = (svgHeight - 60) / Math.max(0.1, maxDia);
  const centerY = svgHeight / 2;

  // Generate SVG path for a cartridge outline
  const buildSvgPath = (spec: CartridgeSpec) => {
    const steps = 60;
    const topPts: string[] = [];
    const botPts: string[] = [];

    for (let i = 0; i <= steps; i++) {
      const z = (i / steps) * spec.case_length;
      const r = getOuterRadiusAt(spec, z);
      const px = padX + z * scaleX;
      const pyTop = centerY - r * scaleY;
      const pyBot = centerY + r * scaleY;
      topPts.push(`${px.toFixed(1)},${pyTop.toFixed(1)}`);
      botPts.unshift(`${px.toFixed(1)},${pyBot.toFixed(1)}`);
    }

    return `M ${padX},${centerY} L ${topPts.join(' L ')} L ${padX + spec.case_length * scaleX},${centerY} L ${botPts.join(' L ')} Z`;
  };

  const donorPath = buildSvgPath(donorCartridge);
  const wildcatPath = buildSvgPath(activeCartridge);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 14, 0.82)',
        WebkitBackdropFilter: 'blur(10px)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#0c1018',
          border: '1px solid rgba(0, 210, 255, 0.3)',
          borderRadius: '10px',
          width: '920px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0,0,0,0.85), 0 0 24px rgba(0, 210, 255, 0.12)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-secondary, #101622)',
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
                borderRadius: '6px',
                background: 'rgba(240, 136, 62, 0.15)',
                border: '1px solid rgba(240, 136, 62, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cad-copper, #f0883e)',
              }}
            >
              <Wand2 size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Case Forming, Fire-Forming & Donut Diagnostic Solver
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                Brass displacement mechanics, neck-up/down wall flow, and internal doughnut risk analysis
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, #1e2638)',
                borderRadius: '6px',
                color: 'var(--text-secondary, #94a3b8)',
                padding: '6px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Print Forming Instructions Sheet"
            >
              <Printer size={13} />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Donor & Target Selector Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            {/* Donor Selection Box */}
            <div
              style={{
                background: 'rgba(240, 136, 62, 0.05)',
                border: '1px solid rgba(240, 136, 62, 0.25)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <label style={{ fontSize: '10px', color: 'var(--cad-copper, #f0883e)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Parent Donor Brass
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  onClick={() => setIsPickerOpen(true)}
                  style={{
                    flex: 1,
                    background: '#141a26',
                    border: '1px solid var(--border-color, #1e2638)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {donorCartridge.name} <span style={{ color: '#38bdf8', fontSize: '10px' }}>({donorCartridge.standard})</span>
                  </span>
                  <Search size={14} color="#94a3b8" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '6px',
                    color: '#38bdf8',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Browse...
                </button>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                <span>Length: {fmt(donorCartridge.case_length, 3)}</span>
                <span>Neck: {fmt(donorCartridge.neck_diameter_mouth)}</span>
                <span>Cap: {donorVol.overflow_capacity_grains_h2o.toFixed(1)} gr H₂O</span>
              </div>
            </div>

            {/* Transition Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--cad-cyan, #00f0ff)' }}>
              <ArrowRight size={22} />
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>TRANSFORM</span>
            </div>

            {/* Target Wildcat Box */}
            <div
              style={{
                background: 'rgba(0, 210, 255, 0.05)',
                border: '1px solid rgba(0, 210, 255, 0.25)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <label style={{ fontSize: '10px', color: 'var(--cad-cyan, #00f0ff)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Target Custom Wildcat
              </label>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', padding: '6px 0' }}>
                {activeCartridge.name}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                <span>Length: {fmt(activeCartridge.case_length, 3)}</span>
                <span>Neck: {fmt(activeCartridge.neck_diameter_mouth)}</span>
                <span>Cap: {wildcatVol.overflow_capacity_grains_h2o.toFixed(1)} gr H₂O</span>
              </div>
            </div>
          </div>

          {/* Dual Silhouette Contour Overlay */}
          <div
            style={{
              background: '#070a10',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '8px',
              padding: '14px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dual-Contour Brass Displacement Silhouette Overlay
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--cad-copper, #f0883e)' }}>
                  <span style={{ width: '12px', height: '2px', background: '#f0883e', borderBottom: '1px dashed #f0883e' }} />
                  Parent Donor ({donorCartridge.name})
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--cad-cyan, #00f0ff)' }}>
                  <span style={{ width: '12px', height: '2px', background: '#00f0ff' }} />
                  Target Wildcat ({activeCartridge.name})
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                {/* Centerline */}
                <line x1={20} y1={centerY} x2={svgWidth - 20} y2={centerY} stroke="#27354a" strokeWidth="1" strokeDasharray="8,4" />

                {/* Donor Brass Outline (dashed amber) */}
                <path
                  d={donorPath}
                  fill="rgba(240, 136, 62, 0.08)"
                  stroke="#f0883e"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />

                {/* Target Wildcat Outline (cyan solid) */}
                <path
                  d={wildcatPath}
                  fill="rgba(0, 210, 255, 0.12)"
                  stroke="#00f0ff"
                  strokeWidth="1.8"
                />

                {/* Internal Doughnut Danger Callout Marker */}
                {formingResult.doughnut_risk !== 'none' && (
                  <g>
                    <circle
                      cx={padX + activeCartridge.body_length * scaleX}
                      cy={centerY - (activeCartridge.neck_diameter_mouth / 2) * scaleY}
                      r="7"
                      fill="#ef4444"
                      opacity="0.8"
                    />
                    <text
                      x={padX + activeCartridge.body_length * scaleX + 10}
                      y={centerY - (activeCartridge.neck_diameter_mouth / 2) * scaleY - 6}
                      fill="#f87171"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      DOUGHNUT ZONE
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Telemetry Metrics Grid: 4 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {/* 1: Neck Wall Flow */}
            <div
              style={{
                background: 'var(--bg-secondary, #0e121a)',
                border: '1px solid var(--border-color, #1e2638)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
                Predicted Neck Wall
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                {fmt(formingResult.predicted_neck_wall, 4)}
              </div>
              <div style={{ fontSize: '10px', color: formingResult.predicted_neck_wall > donorCartridge.neck_wall_thickness ? '#f59e0b' : '#34d399', marginTop: '4px' }}>
                {formingResult.predicted_neck_wall > donorCartridge.neck_wall_thickness ? 'Thickens' : 'Thins'} from {fmt(donorCartridge.neck_wall_thickness, 4)}
              </div>
            </div>

            {/* 2: Clearance & Outside Turning */}
            <div
              style={{
                background: 'var(--bg-secondary, #0e121a)',
                border: '1px solid var(--border-color, #1e2638)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
                Chamber Clearance
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: formingResult.requires_neck_turning ? '#ef4444' : '#34d399', marginTop: '4px' }}>
                {fmt(formingResult.neck_clearance, 4)}
              </div>
              <div style={{ fontSize: '10px', color: formingResult.requires_neck_turning ? '#ef4444' : 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                {formingResult.requires_neck_turning ? 'Turning Required (<.0025")' : 'Safe Neck Release'}
              </div>
            </div>

            {/* 3: Internal Doughnut Risk */}
            <div
              style={{
                background: 'var(--bg-secondary, #0e121a)',
                border: '1px solid var(--border-color, #1e2638)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
                Internal Donut Risk
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 800, 
                color: formingResult.doughnut_risk === 'high' ? '#ef4444' : formingResult.doughnut_risk === 'moderate' ? '#f59e0b' : '#34d399', 
                marginTop: '4px',
                textTransform: 'uppercase'
              }}>
                {formingResult.doughnut_risk}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                {formingResult.doughnut_risk === 'none' ? 'Clean shoulder line' : 'Ream junction'}
              </div>
            </div>

            {/* 4: Case Trim Required */}
            <div
              style={{
                background: 'var(--bg-secondary, #0e121a)',
                border: '1px solid var(--border-color, #1e2638)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
                Case Trim Required
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                {fmt(formingResult.trim_length_required, 3)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                Cut length: {fmt(activeCartridge.case_length, 3)}
              </div>
            </div>
          </div>

          {/* Donut Risk Banner if Moderate / High */}
          {formingResult.doughnut_risk !== 'none' && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: formingResult.doughnut_risk === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${formingResult.doughnut_risk === 'high' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <AlertTriangle size={18} color={formingResult.doughnut_risk === 'high' ? '#ef4444' : '#f59e0b'} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '12px', color: formingResult.doughnut_risk === 'high' ? '#f87171' : '#fbbf24' }}>
                  Internal Neck Doughnut Formation Alert:
                </strong>
                <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                  {formingResult.doughnut_reason}
                </p>
              </div>
            </div>
          )}

          {/* Fire-Forming & Expansion Solver */}
          <div
            style={{
              background: 'var(--bg-secondary, #0e121a)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} color="var(--cad-copper, #f0883e)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  Fire-Forming & Volumetric Expansion Solver
                </span>
              </div>
              <div style={{ fontSize: '11px', color: volumeDeltaH2O >= 0 ? '#34d399' : '#f87171', fontFamily: 'monospace', fontWeight: 700 }}>
                {volumeDeltaH2O >= 0 ? '+' : ''}{volumeDeltaH2O.toFixed(1)} gr H₂O ({volumeDeltaPct >= 0 ? '+' : ''}{volumeDeltaPct.toFixed(1)}% volume)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div 
                onClick={() => setFireformingMethod('mild_load')}
                style={{ 
                  background: fireformingMethod === 'mild_load' ? 'rgba(0, 210, 255, 0.08)' : '#121722', 
                  padding: '10px 12px', 
                  borderRadius: '6px', 
                  border: fireformingMethod === 'mild_load' ? '1px solid var(--cad-cyan, #00f0ff)' : '1px solid #1e283b',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan, #00f0ff)', marginBottom: '4px' }}>
                  Method 1: Mild Live Fire-Forming Load {fireformingMethod === 'mild_load' ? '✓' : ''}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
                  Load a lightweight bullet seated hard into the rifling lands (0.015" jam) over a starting charge (~80% of max load). The jam holds the cartridge head firmly against the bolt face while shoulder blows out square.
                </p>
              </div>

              <div 
                onClick={() => setFireformingMethod('cow_plug')}
                style={{ 
                  background: fireformingMethod === 'cow_plug' ? 'rgba(240, 136, 62, 0.08)' : '#121722', 
                  padding: '10px 12px', 
                  borderRadius: '6px', 
                  border: fireformingMethod === 'cow_plug' ? '1px solid var(--cad-copper, #f0883e)' : '1px solid #1e283b',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-copper, #f0883e)', marginBottom: '4px' }}>
                  Method 2: Cream of Wheat (COW) Inert Plug {fireformingMethod === 'cow_plug' ? '✓' : ''}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
                  Use 10–12 gr of fast-burning pistol/shotgun powder (Bullseye or Unique), fill remainder of case to neck with Cream of Wheat or cornmeal, and seal case mouth with candle wax or soap plug. Fire straight up into safe backstop.
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-Step Machine Shop Forming Protocol */}
          <div
            style={{
              background: 'var(--bg-secondary, #0e121a)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cad-cyan, #00f0ff)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} />
              <span>RECOMMENDED STEP-BY-STEP FORMING PROTOCOL</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formingResult.recommended_steps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'rgba(0, 210, 255, 0.15)',
                      color: 'var(--cad-cyan, #00f0ff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--bg-secondary, #101622)',
            borderTop: '1px solid var(--border-color, #1e2638)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'var(--cad-cyan, #00d2ff)',
              color: '#0a0d14',
              border: 'none',
              borderRadius: '5px',
              padding: '7px 20px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>

      <CartridgePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectCartridge={(cartridge) => {
          setSelectedDonorId(cartridge.id);
          setIsPickerOpen(false);
        }}
        currentSelectedId={selectedDonorId}
        customCartridges={customCartridges}
        title="Select Parent Donor Cartridge"
      />
    </div>
  );
};
