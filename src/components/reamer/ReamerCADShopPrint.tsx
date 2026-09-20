import React, { useRef } from 'react';
import { CartridgeSpec } from '../../types/cartridge';
import { generateReamerSpecFrontend, calculateHeadspaceGauges } from '../../utils/volumetrics';
import { openStandalonePrintWindow } from '../../utils/fileExport';
import { Printer, Disc, Shield, Sliders } from 'lucide-react';

interface ReamerCADShopPrintProps {
  cartridge: CartridgeSpec;
  isMetric: boolean;
  leadeAngle: number;
  neckFit: 'factory' | 'fitted' | 'tight';
  pilotType: 'floating' | 'solid';
}

export const ReamerCADShopPrint: React.FC<ReamerCADShopPrintProps> = ({
  cartridge,
  isMetric,
  leadeAngle,
  neckFit,
  pilotType,
}) => {
  const blueprintBoxRef = useRef<HTMLDivElement>(null);
  const baseReamer = generateReamerSpecFrontend(cartridge);
  const hsGauges = calculateHeadspaceGauges(cartridge);

  const neckClearance = neckFit === 'factory' ? 0.0050 : neckFit === 'fitted' ? 0.0030 : 0.0015;
  const chamberNeckDia = cartridge.neck_diameter_mouth + neckClearance;
  const chamberBaseDia = baseReamer.chamber_base_dia;
  const chamberShoulderDia = baseReamer.chamber_shoulder_dia;
  const chamberLen = baseReamer.chamber_length;
  const nominalBore = baseReamer.pilot_diameter;

  const fmt = (valInches: number, precision = 4) => {
    if (isMetric) return (valInches * 25.4).toFixed(3) + ' mm';
    return valInches.toFixed(precision) + '"';
  };

  const handlePrint = () => {
    const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${cartridge.name} - Chamber Reamer & Toolroom CAD Blueprint</title>
    <style>
      @page { size: letter landscape; margin: 0.35in; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .sheet {
        width: 100%;
        max-width: 100%;
        border: 2px solid #0f172a;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 8px;
        margin-bottom: 12px;
      }
      .title { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; color: #0f172a; }
      .sub { font-size: 11px; color: #64748b; font-weight: 600; margin-left: 8px; }
      .meta { font-size: 11px; font-family: monospace; font-weight: 700; color: #0f172a; text-align: right; }
      .cad-box {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding: 8px 14px;
        margin-bottom: 12px;
        display: flex;
        justify-content: center;
      }
      .specs-grid {
        display: grid;
        grid-template-columns: 1.4fr 1.6fr;
        gap: 14px;
      }
      .table-box {
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding: 8px 12px;
        background: #f8fafc;
        font-size: 11px;
      }
      .table-title {
        font-size: 11px;
        font-weight: 800;
        color: #0f172a;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 4px;
        margin-bottom: 6px;
        text-transform: uppercase;
      }
      .grid-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 12px;
      }
      .title-block {
        border: 2px solid #0f172a;
        display: grid;
        grid-template-rows: auto 1fr;
        font-size: 11px;
      }
      .title-block-header {
        background: #0f172a;
        color: #ffffff;
        padding: 5px 10px;
        font-weight: 800;
        font-size: 11px;
        display: flex;
        justify-content: space-between;
      }
      .title-block-body {
        padding: 8px 10px;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 8px;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header-bar">
        <div>
          <span class="title">WILDCAT STUDIO</span>
          <span class="sub">HIGH-PRECISION CHAMBER FINISH REAMER CAD BLUEPRINT</span>
        </div>
        <div class="meta">
          STANDARD: ${cartridge.standard.toUpperCase()} &bull; UNITS: ${isMetric ? 'METRIC (MM)' : 'IMPERIAL (INCH)'}
        </div>
      </div>

      <div class="cad-box">
        <svg width="840" height="230" viewBox="0 0 840 230">
          <defs>
            <pattern id="printFlutes" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#94a3b8" strokeWidth="1" />
            </pattern>
          </defs>

          <!-- Centerline -->
          <line x1="20" y1="115" x2="820" y2="115" stroke="#64748b" strokeWidth="1" strokeDasharray="12,4,2,4" />

          <!-- Drive Shank -->
          <rect x="40" y="75" width="110" height="80" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.5" />
          <text x="95" y="119" fill="#0f172a" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            7/16" SHANK
          </text>
          <rect x="65" y="75" width="60" height="8" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1" />
          <text x="95" y="70" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            DRIVE FLAT
          </text>

          <!-- Reamer Profile Body -->
          <path
            d="
              M 150 72
              L 380 78
              L 430 94
              L 540 94
              L 600 104
              L 670 104
              L 670 126
              L 600 126
              L 540 136
              L 430 136
              L 380 152
              L 150 158
              Z
            "
            fill="url(#printFlutes)"
            stroke="#0f172a"
            strokeWidth="1.8"
          />

          <!-- Pilot Bushing -->
          <rect
            x="670"
            y="105"
            width="100"
            height="20"
            fill="#e2e8f0"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          <text x="720" y="119" fill="#0f172a" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            ${pilotType === 'floating' ? 'BUSHING' : 'SOLID PILOT'}
          </text>

          <!-- Dimensions -->
          <!-- P1' Base Dia -->
          <line x1="170" y1="52" x2="170" y2="72" stroke="#64748b" strokeWidth="1" />
          <line x1="170" y1="158" x2="170" y2="178" stroke="#64748b" strokeWidth="1" />
          <line x1="170" y1="56" x2="170" y2="174" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,2" />
          <text x="170" y="46" fill="#0f172a" fontSize="10.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            P₁' ${fmt(chamberBaseDia)}
          </text>

          <!-- P2' Shoulder Dia -->
          <line x1="380" y1="58" x2="380" y2="78" stroke="#64748b" strokeWidth="1" />
          <text x="380" y="52" fill="#0f172a" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            P₂' ${fmt(chamberShoulderDia)}
          </text>

          <!-- H2' Neck Dia -->
          <line x1="490" y1="74" x2="490" y2="94" stroke="#64748b" strokeWidth="1" />
          <text x="490" y="68" fill="#0f172a" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            H₂' ${fmt(chamberNeckDia)}
          </text>

          <!-- Leade Angle -->
          <text x="570" y="86" fill="#c2410c" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            Leade ${leadeAngle.toFixed(1)}°
          </text>

          <!-- Freebore -->
          <text x="635" y="96" fill="#0f766e" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            FB: ${fmt(baseReamer.freebore_length, 3)}
          </text>

          <!-- Pilot Bore -->
          <text x="720" y="142" fill="#0f172a" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            Bore ${fmt(nominalBore)}
          </text>

          <!-- Chamber Length Dimension -->
          <line x1="150" y1="190" x2="540" y2="190" stroke="#0284c7" strokeWidth="1" />
          <line x1="150" y1="185" x2="150" y2="195" stroke="#0284c7" strokeWidth="1" />
          <line x1="540" y1="185" x2="540" y2="195" stroke="#0284c7" strokeWidth="1" />
          <text x="345" y="204" fill="#0284c7" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            L₃' Chamber Cut Depth: ${fmt(chamberLen, 3)}
          </text>
        </svg>
      </div>

      <div class="specs-grid">
        <div class="table-box">
          <div class="table-title">Reamer Tooling & Headspace Specifications</div>
          <div class="grid-2col">
            <div>Chamber Base P₁': <strong>${fmt(chamberBaseDia)}</strong></div>
            <div>Chamber Shoulder P₂': <strong>${fmt(chamberShoulderDia)}</strong></div>
            <div>Chamber Neck H₂': <strong>${fmt(chamberNeckDia)}</strong> (${neckFit.toUpperCase()})</div>
            <div>Neck Clearance: <strong>+${fmt(neckClearance)}</strong></div>
            <div>Freebore / Throat Dia: <strong>${fmt(baseReamer.freebore_dia)}</strong></div>
            <div>Freebore Length: <strong>${fmt(baseReamer.freebore_length)}</strong></div>
            <div>Throat Leade Angle: <strong>${leadeAngle.toFixed(1)}°</strong></div>
            <div>Pilot Bushing Dia: <strong>${fmt(nominalBore)}</strong> (${pilotType.toUpperCase()})</div>
            <div>GO Gauge Length: <strong>${fmt(hsGauges.go_gauge_inches, 4)}</strong></div>
            <div>NO-GO Gauge Length: <strong>${fmt(hsGauges.nogo_gauge_inches, 4)}</strong></div>
          </div>
        </div>

        <div class="title-block">
          <div class="title-block-header">
            <span>TOOLROOM CHAMBER REAMER ORDER SPECIFICATION</span>
            <span style="font-family: monospace;">REV 1.0</span>
          </div>
          <div class="title-block-body">
            <div>
              <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">CARTRIDGE DESIGNATION</div>
              <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-top: 2px;">${cartridge.name}</div>
              <div style="font-size: 10px; color: #475569; margin-top: 3px;">
                NECK FIT: ${neckFit.toUpperCase()} &bull; PILOT: ${pilotType.toUpperCase()}
              </div>
            </div>
            <div style="border-left: 1px solid #cbd5e1; padding-left: 8px; font-size: 10px;">
              <div>DATE: <strong>${new Date().toLocaleDateString()}</strong></div>
              <div>MATERIAL: <strong>M-2 HSS / CARBIDE</strong></div>
              <div>TOLERANCE: <strong>±0.0002" DIA</strong></div>
              <div>APPROVED: <strong>WILDCAT STUDIO</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
    openStandalonePrintWindow(fullHtml, `${cartridge.name} Reamer Blueprint`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Blueprint Drawing Box */}
      <div
        ref={blueprintBoxRef}
        style={{
          background: '#070a10',
          border: '1px solid var(--border-color, #1e2638)',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
              HIGH-PRECISION CHAMBER REAMER CAD BLUEPRINT
            </span>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
              SAAMI / CIP Conforming Cutting Tool Profile (Tolerances: Dia ±0.0002" | Length ±0.001" | Angle ±5')
            </div>
          </div>

          <button
            onClick={handlePrint}
            style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '6px',
              color: 'var(--cad-cyan, #00f0ff)',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Printer size={14} />
            <span>Print Blueprint</span>
          </button>
        </div>

        {/* CAD SVG Canvas */}
        <div style={{ display: 'flex', justifyContent: 'center', background: '#090d14', borderRadius: '6px', padding: '16px', border: '1px solid #161f2e' }}>
          <svg width="780" height="280" viewBox="0 0 780 280">
            <defs>
              <pattern id="reamerFlutesCad" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(0, 240, 255, 0.22)" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Engineering Grid lines */}
            <line x1="20" y1="140" x2="760" y2="140" stroke="#334155" strokeWidth="1" strokeDasharray="12,4,2,4" />

            {/* Drive Shank */}
            <rect x="40" y="90" width="100" height="100" fill="#151d2a" stroke="#475569" strokeWidth="1.2" />
            <text x="90" y="144" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
              7/16" SHANK
            </text>

            {/* Shank Drive Flat */}
            <rect x="65" y="90" width="50" height="10" fill="#243144" stroke="#475569" strokeWidth="1" />
            <text x="90" y="84" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">
              DRIVE FLAT
            </text>

            {/* Reamer Body Profile */}
            <path
              d="
                M 140 85
                L 360 92
                L 400 110
                L 510 110
                L 560 122
                L 630 122
                L 630 158
                L 560 158
                L 510 170
                L 400 170
                L 360 188
                L 140 195
                Z
              "
              fill="url(#reamerFlutesCad)"
              stroke="var(--cad-cyan, #00f0ff)"
              strokeWidth="1.8"
            />

            {/* Pilot Bushing */}
            <rect
              x="630"
              y="124"
              width="90"
              height="32"
              fill={pilotType === 'floating' ? '#1e293b' : '#0f172a'}
              stroke="var(--cad-cyan, #00f0ff)"
              strokeWidth="1.4"
            />
            <text x="675" y="144" fill="var(--cad-cyan, #00f0ff)" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {pilotType === 'floating' ? 'BUSHING' : 'SOLID PILOT'}
            </text>

            {/* Dimension Lines & Labels */}
            {/* Base Diameter */}
            <line x1="160" y1="65" x2="160" y2="85" stroke="#94a3b8" strokeWidth="1" />
            <line x1="160" y1="195" x2="160" y2="215" stroke="#94a3b8" strokeWidth="1" />
            <line x1="160" y1="70" x2="160" y2="210" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2,2" />
            <text x="160" y="58" fill="#fff" fontSize="10.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              P₁' {fmt(chamberBaseDia)}
            </text>

            {/* Shoulder Diameter */}
            <line x1="360" y1="72" x2="360" y2="92" stroke="#94a3b8" strokeWidth="1" />
            <text x="360" y="65" fill="#fff" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              P₂' {fmt(chamberShoulderDia)}
            </text>

            {/* Neck Diameter */}
            <line x1="460" y1="90" x2="460" y2="110" stroke="#94a3b8" strokeWidth="1" />
            <text x="460" y="82" fill="#fff" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              H₂' {fmt(chamberNeckDia)}
            </text>

            {/* Throat Leade */}
            <text x="535" y="100" fill="#f59e0b" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              Leade {leadeAngle.toFixed(1)}°
            </text>

            {/* Freebore */}
            <text x="595" y="112" fill="#34d399" fontSize="9" fontFamily="monospace" textAnchor="middle">
              FB: {fmt(baseReamer.freebore_length, 3)}
            </text>

            {/* Pilot Bore */}
            <text x="675" y="172" fill="var(--cad-cyan, #00f0ff)" fontSize="9.5" fontFamily="monospace" textAnchor="middle">
              Bore {fmt(nominalBore)}
            </text>

            {/* Chamber Total Length Dimension */}
            <line x1="140" y1="230" x2="510" y2="230" stroke="#00f0ff" strokeWidth="1" />
            <line x1="140" y1="225" x2="140" y2="235" stroke="#00f0ff" strokeWidth="1" />
            <line x1="510" y1="225" x2="510" y2="235" stroke="#00f0ff" strokeWidth="1" />
            <text x="325" y="246" fill="var(--cad-cyan, #00f0ff)" fontSize="10" fontFamily="monospace" textAnchor="middle">
              L₃' Chamber Depth: {fmt(chamberLen, 3)}
            </text>
          </svg>
        </div>
      </div>

      {/* Headspace Gauge Engineering Suite (GO / NO-GO / FIELD) */}
      <div
        style={{
          background: 'var(--bg-secondary, #0e121a)',
          border: '1px solid var(--border-color, #1e2638)',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Disc size={18} color="var(--cad-cyan, #00f0ff)" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
              PRECISION HEADSPACE GAUGE SET (GO / NO-GO / FIELD)
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, fontFamily: 'monospace' }}>
            Datum Dia: {fmt(hsGauges.datum_diameter)} ({hsGauges.type.toUpperCase()})
          </span>
        </div>

        {/* 3 Gauge Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* GO GAUGE */}
          <div
            style={{
              background: '#090d14',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', letterSpacing: '0.5px' }}>
                GO GAUGE (MIN CHAMBER)
              </span>
              <Shield size={14} color="#10b981" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
              {fmt(hsGauges.go_gauge_inches, 4)}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              Bolt MUST close completely with light finger pressure. Establishes minimum safe chamber headspace.
            </div>
            <div style={{ fontSize: '10px', color: '#10b981', fontFamily: 'monospace', marginTop: '4px' }}>
              Tolerance: +0.0000" / -0.0002"
            </div>
          </div>

          {/* NO-GO GAUGE */}
          <div
            style={{
              background: '#090d14',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.5px' }}>
                NO-GO GAUGE (MAX CHAMBER)
              </span>
              <Sliders size={14} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
              {fmt(hsGauges.nogo_gauge_inches, 4)}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              Bolt MUST NOT close on a newly chambered match barrel. Maximum recommended headspace for new rifles.
            </div>
            <div style={{ fontSize: '10px', color: '#f59e0b', fontFamily: 'monospace', marginTop: '4px' }}>
              +{((hsGauges.nogo_gauge_inches - hsGauges.go_gauge_inches) * 1000).toFixed(1)} thou over GO
            </div>
          </div>

          {/* FIELD GAUGE */}
          <div
            style={{
              background: '#090d14',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', letterSpacing: '0.5px' }}>
                FIELD GAUGE (SERVICE LIMIT)
              </span>
              <Disc size={14} color="#ef4444" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
              {fmt(hsGauges.field_gauge_inches, 4)}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              Absolute maximum safe firing limit. If bolt closes on FIELD gauge, rifle is UNSAFE (head separation risk).
            </div>
            <div style={{ fontSize: '10px', color: '#ef4444', fontFamily: 'monospace', marginTop: '4px' }}>
              +{((hsGauges.field_gauge_inches - hsGauges.go_gauge_inches) * 1000).toFixed(1)} thou over GO
            </div>
          </div>
        </div>

        {/* Toolmaker Fabrication Specifications */}
        <div
          style={{
            marginTop: '16px',
            padding: '12px 14px',
            background: 'rgba(0, 210, 255, 0.04)',
            border: '1px solid rgba(0, 210, 255, 0.2)',
            borderRadius: '6px',
            fontSize: '11.5px',
            color: '#e2e8f0',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--cad-cyan, #00f0ff)' }}>Toolmaker Fabrication Notes:</strong> Gauges must be manufactured from heat-treated tool steel (O-1, A-2 or M-2), hardened to <strong>Rc 60–64</strong>, cryogenically stabilized, and cylindrical ground with surface finish <strong>8 RMS</strong> or finer. Laser mark gauge nomenclature and datum length on rear face.
        </div>
      </div>
    </div>
  );
};
