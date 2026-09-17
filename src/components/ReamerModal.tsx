import React, { useState } from 'react';
import { CartridgeSpec } from '../types/cartridge';
import { generateReamerSpecFrontend } from '../utils/volumetrics';
import { Check, Copy, Printer, Wrench, Download, Building } from 'lucide-react';

interface ReamerModalProps {
  cartridge: CartridgeSpec;
  isMetric: boolean;
}

export type ManufacturerFormat = 'jgs' | 'ptg' | 'manson' | 'clymer';
export type NeckFitOption = 'factory' | 'fitted' | 'tight';
export type ToolType = 'finisher' | 'rougher' | 'neck_throat';

export const ReamerModal: React.FC<ReamerModalProps> = ({ cartridge, isMetric }) => {
  const [manufacturer, setManufacturer] = useState<ManufacturerFormat>('jgs');
  const [toolType, setToolType] = useState<ToolType>('finisher');
  const [pilotType, setPilotType] = useState<'floating' | 'solid'>('floating');
  const [neckFit, setNeckFit] = useState<NeckFitOption>('fitted');
  const [leadeAngle, setLeadeAngle] = useState<number>(1.5); // 1.5° = 1° 30'
  const [copied, setCopied] = useState(false);

  // Gunsmith / Shop Metadata
  const [shopName, setShopName] = useState<string>('Custom Precision Rifles');
  const [gunsmithName, setGunsmithName] = useState<string>('');
  const [barrelMaker, setBarrelMaker] = useState<string>('Krieger Barrels (Bore: Standard)');
  const [bulletTarget, setBulletTarget] = useState<string>(`${cartridge.bullet_weight_grains}gr Match Target`);
  const [specialNotes, setSpecialNotes] = useState<string>('Please supply with 5-piece floating bushing assortment.');

  const baseReamer = generateReamerSpecFrontend(cartridge);

  // Compute Neck Diameter based on Neck Fit Selection
  const neckClearance = neckFit === 'factory' ? 0.0050 : neckFit === 'fitted' ? 0.0030 : 0.0015;
  const chamberNeckDia = cartridge.neck_diameter_mouth + neckClearance;

  // Rougher offset if rougher selected
  const rougherOffset = toolType === 'rougher' ? -0.015 : 0;
  const chamberBaseDia = baseReamer.chamber_base_dia + rougherOffset;
  const chamberShoulderDia = baseReamer.chamber_shoulder_dia + rougherOffset;
  const chamberLen = baseReamer.chamber_length + (toolType === 'rougher' ? -0.030 : 0);

  // Bushing Range for Floating Pilot
  const nominalBore = baseReamer.pilot_diameter;
  const bushingMin = nominalBore - 0.0006;
  const bushingMax = nominalBore + 0.0006;

  const fmt = (valInches: number, precision = 4) => {
    if (isMetric) return (valInches * 25.4).toFixed(3) + ' mm';
    return valInches.toFixed(precision) + '"';
  };

  const manufacturerNames: Record<ManufacturerFormat, string> = {
    jgs: 'JGS Precision Tool Mfg (Coos Bay, OR)',
    ptg: 'Pacific Tool & Gauge (PTG) (White City, OR)',
    manson: 'Dave Manson Precision Reamers (Grand Blanc, MI)',
    clymer: 'Clymer Precision Tools (Rochester Hills, MI)',
  };

  const generateOrderText = () => {
    const headerPrefix =
      manufacturer === 'ptg'
        ? 'PACIFIC TOOL & GAUGE (PTG) - OFFICIAL CUSTOM CHAMBER REAMER REQUISITION'
        : manufacturer === 'manson'
        ? 'DAVE MANSON PRECISION REAMERS - TOOLING SPECIFICATION ORDER'
        : manufacturer === 'jgs'
        ? 'JGS PRECISION TOOL MFG - CHAMBER REAMER DRAWING & ORDER FORM'
        : 'CLYMER PRECISION TOOLS - CHAMBER REAMER ORDER SPECIFICATION';

    const partNum =
      manufacturer === 'ptg'
        ? `PTG-CR-${cartridge.id.toUpperCase()}-${toolType === 'finisher' ? 'FIN' : 'RGH'}`
        : manufacturer === 'manson'
        ? `DMPR-${cartridge.id.toUpperCase()}-${toolType.toUpperCase()}`
        : manufacturer === 'jgs'
        ? `JGS-${cartridge.id.toUpperCase()}-SPEC`
        : `CLY-${cartridge.id.toUpperCase()}-CR`;

    return `
================================================================================
${headerPrefix}
================================================================================
Target Toolmaker:       ${manufacturerNames[manufacturer]}
Part Number / Code:     ${partNum}
Cartridge Nomenclature: ${cartridge.name}
Dimension Standard:     ${cartridge.standard}
Tool Type:              ${toolType.toUpperCase()} REAMER
Pilot Style:            ${pilotType === 'floating' ? 'Interchangeable Floating Bushing' : 'Solid Ground Pilot'}
Nominal Pilot (Bore):   ${fmt(nominalBore)} (Bushing set: ${fmt(bushingMin)} - ${fmt(bushingMax)})
Neck Style:             ${neckFit.toUpperCase()} (${(neckClearance * 1000).toFixed(1)} thou release clearance)
Drive Shank:            7/16" Round with Dual Drive Flats (1/4"-28 Tap)

--- CRITICAL CUTTING DIMENSIONS (TOLERANCE: +/- 0.0002" DIA, +/- 0.001" LEN) ---
Base Diameter (P1'):     ${chamberBaseDia.toFixed(4)}"  [${(chamberBaseDia * 25.4).toFixed(3)} mm]
Shoulder Diameter (P2'): ${chamberShoulderDia.toFixed(4)}"  [${(chamberShoulderDia * 25.4).toFixed(3)} mm]
Neck Diameter (H2'):     ${chamberNeckDia.toFixed(4)}"  [${(chamberNeckDia * 25.4).toFixed(3)} mm]
Chamber Length (L3'):    ${chamberLen.toFixed(3)}"  [${(chamberLen * 25.4).toFixed(3)} mm]
Throat / Freebore Dia:   ${baseReamer.freebore_dia.toFixed(4)}"  [${(baseReamer.freebore_dia * 25.4).toFixed(3)} mm]
Freebore Length:         ${baseReamer.freebore_length.toFixed(3)}"  [${(baseReamer.freebore_length * 25.4).toFixed(3)} mm]
Leade Angle:             ${leadeAngle.toFixed(1)}° (${leadeAngle === 1.5 ? "1° 30'" : leadeAngle === 1.0 ? "1° 00'" : "0° 30'"})
Cartridge COAL Ref:      ${cartridge.coal.toFixed(3)}"  [${(cartridge.coal * 25.4).toFixed(2)} mm]

--- PROJECT & GUNSMITH DETAILS ---
Shop / Company:         ${shopName || 'N/A'}
Gunsmith / Contact:     ${gunsmithName || 'N/A'}
Barrel Manufacturer:    ${barrelMaker}
Target Projectile:      ${bulletTarget}
Special Instructions:   ${specialNotes}

Generated via Wildcat Studio CAD Suite (QuickDESIGN Compatible Tooling Form)
Date: ${new Date().toLocaleDateString()}
================================================================================
    `.trim();
  };

  const handleCopySpecs = () => {
    navigator.clipboard.writeText(generateOrderText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const text = generateOrderText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reamer_Order_${manufacturer.toUpperCase()}_${cartridge.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-primary, #0a0d14)',
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary, #0e121a)',
          border: '1px solid var(--border-color, #1e2638)',
          borderRadius: '8px',
          padding: '16px 20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={20} color="var(--cad-cyan, #00f0ff)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Chamber Reamer Toolmaker Requisition: <span style={{ color: 'var(--cad-cyan, #00f0ff)' }}>{cartridge.name}</span>
            </h2>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', marginTop: '4px' }}>
            Direct manufacturer order format configured for {manufacturerNames[manufacturer]}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => window.print()}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#e2e8f0',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '6px',
              padding: '8px 14px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Printer size={15} />
            <span>Print Requisition</span>
          </button>

          <button
            onClick={handleDownloadTxt}
            style={{
              background: 'rgba(0, 240, 255, 0.12)',
              color: 'var(--cad-cyan, #00f0ff)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '6px',
              padding: '8px 14px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={15} />
            <span>Download Order (.txt)</span>
          </button>

          <button
            onClick={handleCopySpecs}
            style={{
              background: copied ? '#10b981' : 'var(--cad-cyan, #00f0ff)',
              color: '#0a0d13',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.25)',
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Order Text'}</span>
          </button>
        </div>
      </div>

      {/* Manufacturer Selection Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          background: 'var(--bg-secondary, #0e121a)',
          padding: '6px',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #1e2638)',
        }}
      >
        {[
          { id: 'jgs', label: 'JGS Precision Tool Mfg', sub: 'Coos Bay, Oregon' },
          { id: 'ptg', label: 'Pacific Tool & Gauge (PTG)', sub: 'White City, Oregon' },
          { id: 'manson', label: 'Dave Manson Reamers', sub: 'Grand Blanc, Michigan' },
          { id: 'clymer', label: 'Clymer Precision Tools', sub: 'Rochester Hills, Michigan' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setManufacturer(m.id as ManufacturerFormat)}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: manufacturer === m.id ? '1px solid var(--cad-cyan, #00f0ff)' : '1px solid transparent',
              background: manufacturer === m.id ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
              color: manufacturer === m.id ? '#fff' : 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '2px',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: manufacturer === m.id ? 700 : 500, color: manufacturer === m.id ? 'var(--cad-cyan, #00f0ff)' : '#fff' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>{m.sub}</div>
          </button>
        ))}
      </div>

      {/* Reamer Tool Parameters Configurator Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          background: 'var(--bg-secondary, #0e121a)',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #1e2638)',
        }}
      >
        {/* Reamer Tool Type */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '6px' }}>
            TOOL TYPE
          </label>
          <select
            value={toolType}
            onChange={(e) => setToolType(e.target.value as ToolType)}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary, #141a26)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '6px',
              color: '#fff',
              padding: '6px 8px',
              fontSize: '12px',
            }}
          >
            <option value="finisher">Finisher Reamer (Standard Chamber)</option>
            <option value="rougher">Rougher Reamer (-0.015" Stock)</option>
            <option value="neck_throat">Neck & Throat Separate Reamer</option>
          </select>
        </div>

        {/* Neck Fit / Turning Clearance */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '6px' }}>
            CHAMBER NECK FIT
          </label>
          <select
            value={neckFit}
            onChange={(e) => setNeckFit(e.target.value as NeckFitOption)}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary, #141a26)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '6px',
              color: '#fff',
              padding: '6px 8px',
              fontSize: '12px',
            }}
          >
            <option value="factory">Factory Clearance (+0.005" Release)</option>
            <option value="fitted">No-Turn Fitted Neck (+0.003" Release)</option>
            <option value="tight">Tight-Neck (+0.0015" - Turn Brass)</option>
          </select>
        </div>

        {/* Pilot Type */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '6px' }}>
            PILOT BUSHING STYLE
          </label>
          <select
            value={pilotType}
            onChange={(e) => setPilotType(e.target.value as 'floating' | 'solid')}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary, #141a26)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '6px',
              color: '#fff',
              padding: '6px 8px',
              fontSize: '12px',
            }}
          >
            <option value="floating">Interchangeable Floating Bushing</option>
            <option value="solid">Solid Ground Pilot</option>
          </select>
        </div>

        {/* Leade Forcing Cone Angle */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '6px' }}>
            LEADE FORCING CONE ANGLE
          </label>
          <select
            value={leadeAngle}
            onChange={(e) => setLeadeAngle(parseFloat(e.target.value))}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary, #141a26)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '6px',
              color: '#fff',
              padding: '6px 8px',
              fontSize: '12px',
            }}
          >
            <option value={1.5}>1° 30' (Standard SAAMI Factory)</option>
            <option value={1.0}>1° 00' (Match / VLD Streamlined)</option>
            <option value={0.5}>0° 30' (Ultra Low-Drag Benchrest)</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Visual CAD Schematic & Tooling Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Visual Reamer Tool Profile */}
        <div
          style={{
            background: 'var(--bg-secondary, #0e121a)',
            border: '1px solid var(--border-color, #1e2638)',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cad-cyan, #00f0ff)' }}>
              CUTTING FLUTE PROFILE & REAMER SHANK SCHEMATIC
            </span>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
              {manufacturerNames[manufacturer].split('(')[0]}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#090d14',
              borderRadius: '6px',
              border: '1px solid #1c2638',
            }}
          >
            <svg width="520" height="220" viewBox="0 0 520 220">
              <defs>
                <pattern id="reamerFlutes" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                  <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Centerline */}
              <line x1="20" y1="110" x2="500" y2="110" stroke="#485466" strokeWidth="1" strokeDasharray="10,4,2,4" />

              {/* Reamer Shank */}
              <rect x="30" y="75" width="70" height="70" fill="#1b2434" stroke="#485466" strokeWidth="1.2" />
              <text x="65" y="114" fill="#8b949e" fontSize="9" fontFamily="monospace" textAnchor="middle">
                7/16" SHANK
              </text>

              {/* Reamer Body Profile */}
              <path
                d="
                  M 100 70
                  L 260 74
                  L 285 86
                  L 360 86
                  L 395 96
                  L 440 96
                  L 440 124
                  L 395 124
                  L 360 134
                  L 285 134
                  L 260 146
                  L 100 150
                  Z
                "
                fill="url(#reamerFlutes)"
                stroke="var(--cad-cyan, #00f0ff)"
                strokeWidth="1.8"
              />

              {/* Pilot Bushing */}
              <rect
                x="440"
                y="97"
                width="50"
                height="26"
                fill={pilotType === 'floating' ? '#2d3b52' : '#1e293b'}
                stroke="var(--cad-cyan, #00f0ff)"
                strokeWidth="1.2"
              />
              <text x="465" y="114" fill="var(--cad-cyan, #00f0ff)" fontSize="9" fontFamily="monospace" textAnchor="middle">
                {pilotType === 'floating' ? 'BUSHING' : 'SOLID'}
              </text>

              {/* Dimension Labels */}
              <text x="180" y="60" fill="#fff" fontSize="10" fontFamily="monospace" textAnchor="middle">
                Base P₁': {fmt(chamberBaseDia)}
              </text>
              <text x="320" y="74" fill="#fff" fontSize="10" fontFamily="monospace" textAnchor="middle">
                Neck H₂': {fmt(chamberNeckDia)} ({neckFit})
              </text>
              <text x="400" y="84" fill="#f59e0b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                Leade {leadeAngle.toFixed(1)}°
              </text>
              <text x="465" y="138" fill="var(--cad-cyan, #00f0ff)" fontSize="9" fontFamily="monospace" textAnchor="middle">
                Bore: {fmt(nominalBore)}
              </text>
            </svg>
          </div>

          {/* Bushing Kit Recommendation */}
          {pilotType === 'floating' && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '11px', color: '#e2e8f0' }}>
                <strong>Recommended Bushing Set:</strong> 5 bushings in 0.0002" increments
              </span>
              <span style={{ fontSize: '11px', color: 'var(--cad-cyan, #00f0ff)', fontFamily: 'monospace', fontWeight: 600 }}>
                {fmt(bushingMin)} to {fmt(bushingMax)}
              </span>
            </div>
          )}
        </div>

        {/* Manufacturing Parameters & Order Sheet Data Table */}
        <div
          style={{
            background: 'var(--bg-secondary, #0e121a)',
            border: '1px solid var(--border-color, #1e2638)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cad-cyan, #00f0ff)', marginBottom: '12px' }}>
            CRITICAL CUTTING DIMENSIONS & CLEARANCES
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color, #1e2638)', color: 'var(--text-muted, #64748b)', textAlign: 'left' }}>
                <th style={{ padding: '6px 4px' }}>Parameter</th>
                <th style={{ padding: '6px 4px' }}>Order Size</th>
                <th style={{ padding: '6px 4px' }}>Clearance / Rule</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #1e283b' }}>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Chamber Base (P₁')</td>
                <td style={{ padding: '7px 4px', fontWeight: 700, color: '#fff' }}>{fmt(chamberBaseDia)}</td>
                <td style={{ padding: '7px 4px', color: '#34d399' }}>+0.0020" diametrical</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e283b' }}>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Shoulder Start (P₂')</td>
                <td style={{ padding: '7px 4px', fontWeight: 700, color: '#fff' }}>{fmt(chamberShoulderDia)}</td>
                <td style={{ padding: '7px 4px', color: '#34d399' }}>+0.0020" diametrical</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e283b' }}>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Chamber Neck (H₂')</td>
                <td style={{ padding: '7px 4px', fontWeight: 700, color: '#fff' }}>{fmt(chamberNeckDia)}</td>
                <td style={{ padding: '7px 4px', color: neckFit === 'tight' ? '#f59e0b' : '#34d399' }}>
                  +{(neckClearance * 1000).toFixed(1)} thou ({neckFit})
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e283b' }}>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Chamber Length (L₃')</td>
                <td style={{ padding: '7px 4px', fontWeight: 700, color: '#fff' }}>{fmt(chamberLen, 3)}</td>
                <td style={{ padding: '7px 4px', color: 'var(--cad-cyan, #00f0ff)' }}>+0.0150" trim clearance</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e283b' }}>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Freebore Diameter</td>
                <td style={{ padding: '7px 4px', fontWeight: 700, color: '#f59e0b' }}>{fmt(baseReamer.freebore_dia)}</td>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Bullet + 0.0005"</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e283b' }}>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Freebore Length</td>
                <td style={{ padding: '7px 4px', fontWeight: 700, color: '#f59e0b' }}>{fmt(baseReamer.freebore_length, 3)}</td>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Match throat</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e283b' }}>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Throat Leade Angle</td>
                <td style={{ padding: '7px 4px', fontWeight: 700, color: '#f59e0b' }}>{leadeAngle.toFixed(1)}°</td>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Forcing cone angle</td>
              </tr>
              <tr>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Pilot Bushing (Bore)</td>
                <td style={{ padding: '7px 4px', fontWeight: 700, color: 'var(--cad-cyan, #00f0ff)' }}>{fmt(nominalBore)}</td>
                <td style={{ padding: '7px 4px', color: 'var(--text-secondary, #94a3b8)' }}>Land-to-land slip fit</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Project & Gunsmith Details Section */}
      <div
        style={{
          background: 'var(--bg-secondary, #0e121a)',
          border: '1px solid var(--border-color, #1e2638)',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cad-cyan, #00f0ff)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building size={16} />
          <span>GUNSMITH & PROJECT REQUISITION DETAILS</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '4px' }}>
              Shop / Company Name
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary, #141a26)',
                border: '1px solid var(--border-color, #1e2638)',
                borderRadius: '6px',
                color: '#fff',
                padding: '6px 8px',
                fontSize: '12px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '4px' }}>
              Gunsmith / Contact
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={gunsmithName}
              onChange={(e) => setGunsmithName(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary, #141a26)',
                border: '1px solid var(--border-color, #1e2638)',
                borderRadius: '6px',
                color: '#fff',
                padding: '6px 8px',
                fontSize: '12px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '4px' }}>
              Barrel Maker / Blank
            </label>
            <input
              type="text"
              value={barrelMaker}
              onChange={(e) => setBarrelMaker(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary, #141a26)',
                border: '1px solid var(--border-color, #1e2638)',
                borderRadius: '6px',
                color: '#fff',
                padding: '6px 8px',
                fontSize: '12px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '4px' }}>
              Target Projectile / Bullet
            </label>
            <input
              type="text"
              value={bulletTarget}
              onChange={(e) => setBulletTarget(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary, #141a26)',
                border: '1px solid var(--border-color, #1e2638)',
                borderRadius: '6px',
                color: '#fff',
                padding: '6px 8px',
                fontSize: '12px',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '4px' }}>
            Special Toolmaker Notes & Instructions
          </label>
          <input
            type="text"
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary, #141a26)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '6px',
              color: '#fff',
              padding: '6px 8px',
              fontSize: '12px',
            }}
          />
        </div>
      </div>
    </div>
  );
};
