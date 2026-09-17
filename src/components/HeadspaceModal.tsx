import React, { useState } from 'react';
import { CartridgeSpec } from '../types/cartridge';
import { calculateHeadspaceGauges, calculateDatumHeadspace } from '../utils/volumetrics';
import { X, Shield, AlertTriangle, CheckCircle, Copy, Check, Printer, Info, Disc } from 'lucide-react';

interface HeadspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  isMetric: boolean;
}

export const HeadspaceModal: React.FC<HeadspaceModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  isMetric,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedGauge, setSelectedGauge] = useState<'go' | 'nogo' | 'field'>('go');

  if (!isOpen) return null;

  const gauges = calculateHeadspaceGauges(cartridge);
  const datumInfo = calculateDatumHeadspace(cartridge);

  const fmt = (valInches: number, precision = 4): string => {
    if (isMetric) {
      return (valInches * 25.4).toFixed(precision === 4 ? 3 : 2) + ' mm';
    }
    return valInches.toFixed(precision) + '"';
  };

  const handleCopy = () => {
    const text = `HEADSPACE GAUGE SPECIFICATIONS: ${cartridge.name}
Type: ${gauges.type.toUpperCase()}
Datum Circle Diameter: ${fmt(gauges.datum_diameter)}
Shoulder Cone Angle: ${cartridge.shoulder_angle.toFixed(1)}°

GO Gauge Length: ${fmt(gauges.go_gauge_inches)} (+0.0000" min chamber headspace)
NO-GO Gauge Length: ${fmt(gauges.nogo_gauge_inches)} (+0.0040" max new chamber headspace)
FIELD Gauge Length: ${fmt(gauges.field_gauge_inches)} (+0.0070" max service wear limit)
Grinding Tolerance: +0.0002" / -0.0000"
Recommended Hardness: 60-64 HRC Ground Tool Steel`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gaugeConfigs = [
    {
      id: 'go' as const,
      label: 'GO GAUGE',
      dimension: gauges.go_gauge_inches,
      offset: '+0.0000"',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.4)',
      rule: 'Bolt MUST close completely without resistance. Verifies chamber is at least minimum allowable headspace.',
      status: 'Minimum Safe Headspace',
      icon: CheckCircle,
    },
    {
      id: 'nogo' as const,
      label: 'NO-GO GAUGE',
      dimension: gauges.nogo_gauge_inches,
      offset: '+0.0040" (+0.102 mm)',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.4)',
      rule: 'Bolt MUST NOT close on a new firearm or newly chambered barrel. If bolt closes, the chamber was cut too deep.',
      status: 'Maximum New Chamber Limit',
      icon: AlertTriangle,
    },
    {
      id: 'field' as const,
      label: 'FIELD GAUGE',
      dimension: gauges.field_gauge_inches,
      offset: '+0.0070" (+0.178 mm)',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.4)',
      rule: 'Bolt MUST NOT close on any serviceable firearm. If bolt closes, the gun is UNSAFE to fire (risk of case head separation).',
      status: 'Absolute Service Safety Limit',
      icon: Shield,
    },
  ];

  const activeG = gaugeConfigs.find((g) => g.id === selectedGauge) || gaugeConfigs[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 8, 15, 0.82)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          width: '740px',
          maxWidth: '94vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(0, 210, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cad-cyan)',
              }}
            >
              <Disc size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Headspace Gauge Suite (GO / NO-GO / FIELD)
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Toolroom grinding & chamber verification specs for {cartridge.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
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

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cartridge Datum Info Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              padding: '14px',
              background: 'rgba(15, 20, 31, 0.6)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>HEADSPACE TYPE</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cad-cyan)', textTransform: 'capitalize' }}>
                {gauges.type}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>DATUM CIRCLE Ø</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {fmt(gauges.datum_diameter)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>SHOULDER CONE α</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5be59', fontFamily: 'var(--font-mono)' }}>
                {cartridge.shoulder_angle.toFixed(1)}°
              </span>
            </div>
            <div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>GRIND TOLERANCE</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                +{fmt(gauges.tolerance_inches, 4)} / -0
              </span>
            </div>
          </div>

          {/* Interactive Gauge Selection Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {gaugeConfigs.map((g) => {
              const isSelected = selectedGauge === g.id;
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGauge(g.id)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: isSelected ? g.bg : 'var(--bg-tertiary)',
                    border: `1.5px solid ${isSelected ? g.color : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: g.color }}>{g.label}</span>
                    <Icon size={14} color={g.color} />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {fmt(g.dimension)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Offset: {g.offset}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Gauge Technical Blueprint Schematic */}
          <div
            style={{
              background: '#090d14',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              padding: '18px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Precision Toolroom Grinding Profile • {activeG.label}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: activeG.color,
                  background: activeG.bg,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${activeG.border}`,
                }}
              >
                {activeG.status}
              </span>
            </div>

            {/* SVG Precision Gauge Schematic */}
            <svg viewBox="0 0 640 140" style={{ width: '100%', height: '140px' }}>
              <defs>
                <linearGradient id="steelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="50%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                <marker id="gaugeArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="var(--cad-cyan)" />
                </marker>
              </defs>

              {/* Grid Background */}
              <line x1="20" y1="70" x2="620" y2="70" stroke="#1e293b" strokeDasharray="4,4" strokeWidth="1" />

              {/* Gauge Body (Solid Hardened Tool Steel) */}
              <path
                d="M 60 40 L 140 40 L 140 50 L 360 50 L 440 62 L 480 62 L 480 78 L 440 78 L 360 90 L 140 90 L 140 100 L 60 100 Z"
                fill="url(#steelGrad)"
                stroke="#e2e8f0"
                strokeWidth="1.5"
              />

              {/* Knurled Handle Section */}
              <rect x="60" y="42" width="70" height="56" fill="rgba(30, 41, 59, 0.45)" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2,2" />
              <text x="95" y="74" fill="#0f172a" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)" textAnchor="middle">
                KNURL
              </text>

              {/* Engraving on Gauge Body */}
              <text x="250" y="74" fill="#0f172a" fontSize="11" fontWeight="800" fontFamily="var(--font-mono)" textAnchor="middle">
                {cartridge.name} • {activeG.label} • {fmt(activeG.dimension)}
              </text>

              {/* Datum Headspace Reference Ring Line */}
              <line x1="410" y1="30" x2="410" y2="110" stroke={activeG.color} strokeWidth="1.5" strokeDasharray="3,2" />
              <circle cx="410" cy="57" r="3.5" fill={activeG.color} stroke="#fff" strokeWidth="1" />
              <circle cx="410" cy="83" r="3.5" fill={activeG.color} stroke="#fff" strokeWidth="1" />

              {/* Dimension Leader to Datum */}
              <line x1="60" y1="20" x2="410" y2="20" stroke="var(--cad-cyan)" strokeWidth="1.2" markerStart="url(#gaugeArrow)" markerEnd="url(#gaugeArrow)" />
              <line x1="60" y1="16" x2="60" y2="38" stroke="#485466" strokeWidth="0.8" />
              <line x1="410" y1="16" x2="410" y2="30" stroke="#485466" strokeWidth="0.8" />
              <text x="235" y="16" fill="var(--cad-cyan)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)" textAnchor="middle">
                L_datum: {fmt(activeG.dimension)}
              </text>

              {/* Datum Diameter Indicator */}
              <line x1="410" y1="57" x2="520" y2="57" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2,2" />
              <line x1="410" y1="83" x2="520" y2="83" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2,2" />
              <line x1="510" y1="57" x2="510" y2="83" stroke="#e5be59" strokeWidth="1" markerStart="url(#gaugeArrow)" markerEnd="url(#gaugeArrow)" />
              <text x="565" y="74" fill="#e5be59" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)" textAnchor="middle">
                Ø {fmt(gauges.datum_diameter)}
              </text>
            </svg>

            {/* Armorer / Gunsmith Testing Rule */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(15, 20, 31, 0.7)',
                borderLeft: `3px solid ${activeG.color}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <Info size={15} color={activeG.color} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ fontSize: '11.5px', color: '#e2e8f0', lineHeight: 1.4 }}>
                <strong>Gunsmith Rule:</strong> {activeG.rule}
              </span>
            </div>
          </div>

          {/* Tolerance Stackup & Safety Note */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertTriangle size={16} color="#eab308" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.45 }}>
              <strong>Headspace Stackup Rules:</strong> In bolt-action rifles, headspace is measured with the extractor and ejector removed from the bolt face to prevent false resistance. When testing with NO-GO or FIELD gauges, never force the bolt down; moderate finger pressure on the bolt handle is sufficient.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Datum Headspace Length: {fmt(datumInfo.datum_length)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#e2e8f0',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Specs'}</span>
            </button>
            <button
              onClick={() => window.print()}
              style={{
                background: 'var(--cad-cyan)',
                border: 'none',
                borderRadius: '6px',
                color: '#090d14',
                padding: '6px 14px',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Printer size={13} />
              <span>Print Gauges</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
