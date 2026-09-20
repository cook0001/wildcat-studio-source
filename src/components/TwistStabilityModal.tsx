import React, { useState } from 'react';
import { CartridgeSpec } from '../types/cartridge';
import { calculateMillerStability } from '../utils/volumetrics';
import { getBulletsForCaliber, BULLET_OPTIONS } from '../data/bullets';
import { X, Compass, Info, Check, Copy } from 'lucide-react';

interface TwistStabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  isMetric: boolean;
}

export const TwistStabilityModal: React.FC<TwistStabilityModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  isMetric,
}) => {
  // Local state for interactive tuning
  const [bulletWeight, setBulletWeight] = useState<number>(cartridge.bullet_weight_grains || 150);
  const [bulletLength, setBulletLength] = useState<number>(
    cartridge.bullet_length > 0 ? cartridge.bullet_length : Math.round(cartridge.bullet_diameter * 3.4 * 100) / 100
  );
  const [twistRate, setTwistRate] = useState<number>(10.0);
  const [velocity, setVelocity] = useState<number>(2800);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Clone cartridge with current interactive values
  const currentSpec: CartridgeSpec = {
    ...cartridge,
    bullet_weight_grains: bulletWeight,
    bullet_length: bulletLength,
  };

  const result = calculateMillerStability(currentSpec, twistRate, velocity);

  const statusColors = {
    unstable: '#ef4444',
    marginal: '#f59e0b',
    stable: '#10b981',
    over_stabilized: '#3b82f6',
  };

  const statusBg = {
    unstable: 'rgba(239, 68, 68, 0.12)',
    marginal: 'rgba(245, 158, 11, 0.12)',
    stable: 'rgba(16, 185, 129, 0.12)',
    over_stabilized: 'rgba(59, 130, 246, 0.12)',
  };

  const statusLabels = {
    unstable: 'UNSTABLE (Sg < 1.0)',
    marginal: 'MARGINAL (1.0 ≤ Sg < 1.3)',
    stable: 'OPTIMALLY STABLE (1.3 ≤ Sg ≤ 2.0)',
    over_stabilized: 'OVER-STABILIZED (Sg > 2.0)',
  };

  const commonTwists = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0, 11.0, 12.0, 14.0];

  const handleCopy = () => {
    const text = `MILLER GYROSCOPIC STABILITY REPORT: ${cartridge.name}
Caliber: ${cartridge.bullet_diameter.toFixed(3)}"
Bullet: ${bulletWeight} gr, Length: ${bulletLength.toFixed(3)}"
Muzzle Velocity: ${velocity} fps
Barrel Twist: 1:${twistRate.toFixed(1)}"
Gyroscopic Stability Factor (Sg): ${result.sg.toFixed(2)} (${result.status.toUpperCase()})
Optimal Match Twist: 1:${result.optimal_twist_inches.toFixed(1)}" (for Sg = 1.50)
Status: ${result.description}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stability Gauge needle position: clamp Sg between 0.5 and 2.5 mapped to 0% to 100%
  const needlePct = Math.max(0, Math.min(100, ((result.sg - 0.5) / 2.0) * 100));

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
          width: '760px',
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
                background: 'rgba(240, 136, 62, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cad-copper)',
              }}
            >
              <Compass size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Miller Twist Rule & Gyroscopic Stability (Sg)
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Don Miller aerodynamic stability modeling for {cartridge.name}
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

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Sg Status Hero Card */}
          <div
            style={{
              padding: '18px 22px',
              borderRadius: '10px',
              background: statusBg[result.status],
              border: `1.5px solid ${statusColors[result.status]}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: statusColors[result.status], letterSpacing: '0.5px' }}>
                {statusLabels[result.status]}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                Sg = {result.sg.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>
                {result.description}
              </div>
            </div>

            <div
              style={{
                textAlign: 'right',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                paddingLeft: '20px',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                OPTIMAL MATCH TWIST (Sg=1.5)
              </span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                1 : {result.optimal_twist_inches.toFixed(1)}"
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                {isMetric ? `1 in ${(result.optimal_twist_inches * 25.4).toFixed(0)} mm` : 'calibers per turn'}
              </span>
            </div>
          </div>

          {/* Graphical Stability Spectrum Bar */}
          <div style={{ background: 'rgba(15, 20, 31, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>0.5 (Tumble)</span>
              <span style={{ color: '#f59e0b' }}>1.0 (Marginal)</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>1.5 (Match Ideal)</span>
              <span style={{ color: '#3b82f6' }}>2.0 (Overspin)</span>
              <span>2.5+</span>
            </div>

            <div style={{ position: 'relative', height: '14px', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '25%', background: '#ef4444' }} title="Unstable (<1.0)" />
              <div style={{ width: '15%', background: '#f59e0b' }} title="Marginal (1.0 - 1.3)" />
              <div style={{ width: '35%', background: '#10b981' }} title="Optimal (1.3 - 2.0)" />
              <div style={{ width: '25%', background: '#3b82f6' }} title="Over-Stabilized (>2.0)" />
            </div>

            {/* Needle pointer */}
            <div style={{ position: 'relative', height: '14px', marginTop: '4px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: `${needlePct}%`,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'left 0.2s ease',
                }}
              >
                <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '6px solid #fff' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {result.sg.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Match Bullet Preset Picker */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan)', letterSpacing: '0.4px' }}>
                LOAD FACTORY BULLET PRESET ({cartridge.bullet_diameter.toFixed(3)}" Caliber)
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Instantly populate exact factory grain weight and measured bullet length
              </div>
            </div>
            {(() => {
              const activeBullet = BULLET_OPTIONS.find(b => 
                Math.abs(b.caliber_inches - cartridge.bullet_diameter) < 0.003 && 
                b.weight_grains === bulletWeight &&
                Math.abs(b.length_inches - bulletLength) < 0.02
              );

              return (
                <select
                  value={activeBullet ? activeBullet.id : ""}
                  onChange={(e) => {
                    const b = BULLET_OPTIONS.find(item => item.id === e.target.value);
                    if (b) {
                      setBulletWeight(b.weight_grains);
                      setBulletLength(b.length_inches);
                    }
                  }}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: '#fff',
                    border: `1px solid ${activeBullet ? 'rgba(0, 210, 255, 0.6)' : 'rgba(0, 210, 255, 0.35)'}`,
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: '280px',
                    maxWidth: '380px'
                  }}
                >
              <option value="" disabled>Select factory bullet model...</option>
              <optgroup label={`Matches for ${cartridge.bullet_diameter.toFixed(3)}" Caliber`}>
                {getBulletsForCaliber(cartridge.bullet_diameter, 0.008).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.weight_grains} gr (L: {b.length_inches}", BC: {b.g1_bc})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other Calibers">
                {BULLET_OPTIONS.filter(b => Math.abs(b.caliber_inches - cartridge.bullet_diameter) > 0.008).map((b) => (
                  <option key={b.id} value={b.id}>
                    .{b.caliber_inches.toString().split('.')[1]} — {b.name} ({b.weight_grains} gr)
                  </option>
                ))}
              </optgroup>
            </select>
            ); })()}
          </div>

          {/* Interactive Ballistic Tuning Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              padding: '16px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Twist Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>Barrel Twist Rate</label>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cad-cyan)', fontFamily: 'var(--font-mono)' }}>
                  1 : {twistRate.toFixed(1)}"
                </span>
              </div>
              <input
                type="range"
                min="6.0"
                max="16.0"
                step="0.25"
                value={twistRate}
                onChange={(e) => setTwistRate(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--cad-cyan)' }}
              />
              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {commonTwists.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTwistRate(t)}
                    style={{
                      background: twistRate === t ? 'var(--cad-cyan)' : 'rgba(255, 255, 255, 0.06)',
                      color: twistRate === t ? '#090d14' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: twistRate === t ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    1:{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Muzzle Velocity Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>Muzzle Velocity</label>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  {velocity} fps {isMetric ? `(${(velocity * 0.3048).toFixed(0)} m/s)` : ''}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="4200"
                step="25"
                value={velocity}
                onChange={(e) => setVelocity(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#34d399' }}
              />
            </div>

            {/* Bullet Weight */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>Bullet Mass (Grains)</label>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cad-copper)', fontFamily: 'var(--font-mono)' }}>
                  {bulletWeight} gr
                </span>
              </div>
              <input
                type="number"
                min="15"
                max="1000"
                value={bulletWeight}
                onChange={(e) => setBulletWeight(Math.max(1, parseFloat(e.target.value) || 0))}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>

            {/* Bullet Length */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>Total Bullet Length</label>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#e5be59', fontFamily: 'var(--font-mono)' }}>
                  {bulletLength.toFixed(3)}" {isMetric ? `(${(bulletLength * 25.4).toFixed(1)} mm)` : ''}
                </span>
              </div>
              <input
                type="number"
                step="0.010"
                min="0.100"
                max="4.000"
                value={bulletLength}
                onChange={(e) => setBulletLength(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
          </div>

          {/* Miller Twist Reference Matrix */}
          <div style={{ background: 'rgba(15, 20, 31, 0.5)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              BARREL TWIST STABILITY SPECTRUM FOR THIS PROJECTILE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: 'var(--border-color)' }}>
              {[7.0, 8.0, 9.0, 10.0, 12.0].map((testTwist) => {
                const subRes = calculateMillerStability(currentSpec, testTwist, velocity);
                return (
                  <div
                    key={testTwist}
                    onClick={() => setTwistRate(testTwist)}
                    style={{
                      background: twistRate === testTwist ? 'rgba(0, 210, 255, 0.15)' : 'var(--bg-secondary)',
                      padding: '10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>1 : {testTwist}"</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: statusColors[subRes.status], fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                      {subRes.sg.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '9.5px', color: statusColors[subRes.status], textTransform: 'capitalize' }}>
                      {subRes.status.replace('_', ' ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <Info size={13} />
            <span>Don Miller formula corrected for velocity factor √(v / 2800) at sea level STP</span>
          </div>
          <button
            onClick={handleCopy}
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
            {copied ? <Check size={13} color="#090d14" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Stability Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
