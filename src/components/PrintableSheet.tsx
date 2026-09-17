import React, { useRef } from 'react';
import { CartridgeSpec } from '../types/cartridge';
import { calculateVolumetrics, calculateReamerSpecs } from '../utils/volumetrics';
import { Printer, X, FileText } from 'lucide-react';

interface PrintableSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  isMetric: boolean;
}

export const PrintableSheet: React.FC<PrintableSheetProps> = ({
  isOpen,
  onClose,
  cartridge,
  isMetric
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const volumetrics = calculateVolumetrics(cartridge);
  const reamer = calculateReamerSpecs(cartridge);

  const fmt = (valInches: number, precision = 3) => {
    if (isMetric) {
      return (valInches * 25.4).toFixed(precision === 4 ? 3 : 2) + ' mm';
    }
    return valInches.toFixed(precision) + '"';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(5, 8, 14, 0.9)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      {/* Action Toolbar Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '1000px',
          maxWidth: '96vw',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--cad-cyan)" />
          <span style={{ fontSize: '14px', fontWeight: 700 }}>
            Print-Ready Engineering Specification Sheet
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            (ANSI A / ISO A4 Landscape Shop Blueprint)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="btn-print-sheet"
            onClick={handlePrint}
            style={{
              background: 'var(--cad-cyan)',
              border: 'none',
              color: '#080c14',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={15} />
            <span>Print / Save as Vector PDF</span>
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Sheet Container: 11" x 8.5" Aspect Ratio */}
      <div
        ref={printRef}
        onClick={(e) => e.stopPropagation()}
        className="printable-cad-sheet"
        style={{
          width: '1000px',
          maxWidth: '96vw',
          height: '660px',
          background: '#ffffff',
          color: '#0a0d14',
          borderRadius: '4px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
          padding: '24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '2px solid #0a0d14',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Engineering Outer Border with Coordinate Grids */}
        <div style={{
          position: 'absolute',
          inset: '8px',
          border: '1px solid #94a3b8',
          pointerEvents: 'none'
        }} />

        {/* Top Header / Sheet Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #0f172a',
          paddingBottom: '8px'
        }}>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.5px', color: '#0f172a' }}>
              WILDCAT STUDIO
            </span>
            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px', fontWeight: 600 }}>
              PRECISION CARTRIDGE ENGINEERING SPECIFICATION
            </span>
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
            STANDARD: {cartridge.standard.toUpperCase()} • UNITS: {isMetric ? 'METRIC (MM)' : 'IMPERIAL (INCH)'}
          </div>
        </div>

        {/* Main Drawing Zone: Vector Technical Profile */}
        <div style={{
          flex: 1,
          margin: '12px 0',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          background: '#f8fafc',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg viewBox="0 0 900 240" style={{ width: '100%', height: '100%' }}>
            {/* Centerline */}
            <line x1="40" y1="120" x2="860" y2="120" stroke="#64748b" strokeWidth="1" strokeDasharray="10,3,2,3" />

            {/* Render 2D Vector Silhouette */}
            {(() => {
              const totalLen = Math.max(cartridge.coal, cartridge.case_length + 0.6);
              const scale = 680 / totalLen;
              const ox = 70;
              const cy = 120;

              const pxHead = ox;
              const pxBody = ox + cartridge.body_length * scale;
              const pxShoulder = ox + (cartridge.body_length + cartridge.shoulder_length) * scale;
              const pxMouth = ox + cartridge.case_length * scale;
              const pxTip = ox + cartridge.coal * scale;

              const rRim = (cartridge.rim_diameter / 2) * scale;
              const rBase = (cartridge.base_diameter / 2) * scale;
              const rShoulder = (cartridge.shoulder_start_diameter / 2) * scale;
              const rMouth = (cartridge.neck_diameter_mouth / 2) * scale;
              const rBullet = (cartridge.bullet_diameter / 2) * scale;

              const casePath = `
                M ${pxHead} ${cy - rRim}
                L ${pxHead + 6} ${cy - rRim}
                L ${pxHead + 6} ${cy - rBase}
                L ${pxBody} ${cy - rShoulder}
                L ${pxShoulder} ${cy - rMouth}
                L ${pxMouth} ${cy - rMouth}
                L ${pxMouth} ${cy + rMouth}
                L ${pxShoulder} ${cy + rMouth}
                L ${pxBody} ${cy + rShoulder}
                L ${pxHead + 6} ${cy + rBase}
                L ${pxHead + 6} ${cy + rRim}
                L ${pxHead} ${cy + rRim}
                Z
              `;

              const bulletPath = `
                M ${pxMouth} ${cy - rBullet}
                L ${pxTip} ${cy}
                L ${pxMouth} ${cy + rBullet}
                Z
              `;

              return (
                <g>
                  {/* Case Body */}
                  <path d={casePath} fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.8" />
                  {/* Bullet */}
                  <path d={bulletPath} fill="#fdba74" stroke="#c2410c" strokeWidth="1.8" />

                  {/* Leader Lines & Callouts */}
                  {/* Overall Length L6 */}
                  <line x1={pxHead} y1={cy - rRim - 25} x2={pxTip} y2={cy - rRim - 25} stroke="#0f172a" strokeWidth="1" />
                  <line x1={pxHead} y1={cy - rRim - 5} x2={pxHead} y2={cy - rRim - 30} stroke="#64748b" strokeWidth="0.8" />
                  <line x1={pxTip} y1={cy - 5} x2={pxTip} y2={cy - rRim - 30} stroke="#64748b" strokeWidth="0.8" />
                  <text x={(pxHead + pxTip) / 2} y={cy - rRim - 30} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
                    L₆ (COAL): {fmt(cartridge.coal)}
                  </text>

                  {/* Case Length L3 */}
                  <line x1={pxHead} y1={cy + rRim + 25} x2={pxMouth} y2={cy + rRim + 25} stroke="#0f172a" strokeWidth="1" />
                  <line x1={pxHead} y1={cy + rRim + 5} x2={pxHead} y2={cy + rRim + 30} stroke="#64748b" strokeWidth="0.8" />
                  <line x1={pxMouth} y1={cy + rMouth + 5} x2={pxMouth} y2={cy + rRim + 30} stroke="#64748b" strokeWidth="0.8" />
                  <text x={(pxHead + pxMouth) / 2} y={cy + rRim + 38} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
                    L₃ (Case Length): {fmt(cartridge.case_length)}
                  </text>

                  {/* Rim Dia Callout */}
                  <text x={pxHead - 10} y={cy - rRim - 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#0f172a">
                    R₁: {fmt(cartridge.rim_diameter)}
                  </text>

                  {/* Base Dia Callout */}
                  <text x={pxHead + 20} y={cy - rBase - 6} textAnchor="start" fontSize="10" fontWeight="700" fill="#0f172a">
                    P₁: {fmt(cartridge.base_diameter)}
                  </text>

                  {/* Shoulder Callout */}
                  <text x={pxBody} y={cy - rShoulder - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
                    P₂: {fmt(cartridge.shoulder_start_diameter)} (α={cartridge.shoulder_angle}°)
                  </text>

                  {/* Mouth Callout */}
                  <text x={pxMouth} y={cy - rMouth - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
                    H₂: {fmt(cartridge.neck_diameter_mouth)}
                  </text>

                  {/* Bullet Callout */}
                  <text x={pxTip + 10} y={cy + 4} textAnchor="start" fontSize="10" fontWeight="700" fill="#c2410c">
                    G₁: {fmt(cartridge.bullet_diameter)}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Lower Grid: Specifications Table + Title Block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '16px' }}>
          
          {/* Chamber Reamer & Volumetric Specs Table */}
          <div style={{
            border: '1px solid #cbd5e1',
            borderRadius: '3px',
            padding: '8px 12px',
            fontSize: '11px',
            background: '#f8fafc'
          }}>
            <div style={{ fontWeight: 800, fontSize: '11px', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '6px' }}>
              MANUFACTURING & CHAMBER SPECIFICATIONS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px' }}>
              <div>Rim Recess Dia: <strong>{fmt(reamer.chamber_rim_dia)}</strong></div>
              <div>Chamber Base Dia: <strong>{fmt(reamer.chamber_base_dia)}</strong></div>
              <div>Chamber Shoulder: <strong>{fmt(reamer.chamber_shoulder_dia)}</strong></div>
              <div>Chamber Neck: <strong>{fmt(reamer.chamber_neck_dia)}</strong></div>
              <div>Freebore / Throat Dia: <strong>{fmt(reamer.freebore_dia)}</strong></div>
              <div>Freebore Length: <strong>{fmt(reamer.freebore_length)}</strong></div>
              <div>Throat / Leade Angle: <strong>{reamer.leade_angle_deg}°</strong></div>
              <div>Pilot Bushing Dia: <strong>{fmt(reamer.pilot_diameter, 4)}</strong></div>
              <div>Water Capacity: <strong>{volumetrics.overflow_capacity_grains_h2o} gr H₂O</strong></div>
              <div>Max Pressure (MAP): <strong>{cartridge.max_pressure_bar} bar ({Math.round(cartridge.max_pressure_bar * 14.5038)} PSI)</strong></div>
            </div>
          </div>

          {/* Formal Engineering Title Block */}
          <div style={{
            border: '2px solid #0f172a',
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            fontSize: '11px'
          }}>
            <div style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '6px 10px',
              fontWeight: 800,
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>ENGINEERING SPECIFICATION SHEET</span>
              <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>REV A.1</span>
            </div>

            <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>CARTRIDGE / WILDCAT DESIGNATION</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                  {cartridge.name}
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>
                  CATEGORY: {cartridge.category} • RIM: {cartridge.rim_type.toUpperCase()}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '8px', fontSize: '10px' }}>
                <div>DATE: <strong>{new Date().toLocaleDateString()}</strong></div>
                <div>SCALE: <strong>1:1 CAD</strong></div>
                <div>TOLERANCE: <strong>±0.0005"</strong></div>
                <div>APPROVED: <strong>WILDCAT STUDIO</strong></div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
