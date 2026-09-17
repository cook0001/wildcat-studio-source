import React, { useState } from 'react';
import { VolumetricResult, CartridgeSpec } from '../types/cartridge';
import { Droplet, Flame, Target, Compass, Zap, Gauge, ChevronUp, ChevronDown } from 'lucide-react';

interface VolumetricHUDProps {
  volumetrics: VolumetricResult;
  cartridge: CartridgeSpec;
}

export const VolumetricHUD: React.FC<VolumetricHUDProps> = ({
  volumetrics,
  cartridge,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('wildcat_hud_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('wildcat_hud_collapsed', String(next));
      return next;
    });
  };

  const pressureBar = cartridge.max_pressure_bar || 4150;
  const pressurePsi = Math.round(pressureBar * 14.5038);

  // Collapsed Minimal Bar
  if (isCollapsed) {
    return (
      <div
        id="volumetric-hud-collapsed"
        style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          padding: '4px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          zIndex: 40,
          height: '28px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Droplet size={13} color="var(--cad-cyan)" />
            <span style={{ color: 'var(--text-muted)' }}>Overflow:</span>
            <span style={{ fontWeight: 700, color: '#fff' }}>{volumetrics.overflow_capacity_grains_h2o} gr H₂O</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Flame size={13} color="var(--cad-brass)" />
            <span style={{ color: 'var(--text-muted)' }}>Usable:</span>
            <span style={{ fontWeight: 700, color: 'var(--cad-brass)' }}>{volumetrics.usable_capacity_grains_h2o} gr H₂O</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Zap size={13} color="#3fb950" />
            <span style={{ color: 'var(--text-muted)' }}>Exp Ratio:</span>
            <span style={{ fontWeight: 700, color: '#3fb950' }}>{volumetrics.expansion_ratio_24in.toFixed(1)}:1</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Gauge size={13} color="#f85149" />
            <span style={{ color: 'var(--text-muted)' }}>Pmax:</span>
            <span style={{ fontWeight: 700, color: '#f85149' }}>{pressureBar.toLocaleString()} bar ({pressurePsi.toLocaleString()} PSI)</span>
          </div>
        </div>

        <button
          onClick={toggleCollapse}
          title="Expand Volumetric Telemetry HUD"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            color: 'var(--cad-cyan)',
            padding: '2px 8px',
            fontSize: '10.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
        >
          <span>Telemetry</span>
          <ChevronUp size={12} />
        </button>
      </div>
    );
  }

  // Expanded HUD Grid
  return (
    <div
      id="volumetric-hud-expanded"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '8px 16px',
        position: 'relative',
        zIndex: 40,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', alignItems: 'center' }}>
        {/* 1. Overflow Capacity */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ color: 'var(--cad-cyan)' }}>
            <Droplet size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>OVERFLOW CAPACITY</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: '#fff' }}>
              {volumetrics.overflow_capacity_grains_h2o} <span style={{ fontSize: '11px', color: 'var(--cad-cyan)' }}>gr H₂O</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {volumetrics.overflow_capacity_cm3} cm³ / ml
            </div>
          </div>
        </div>

        {/* 2. Usable Capacity */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(229, 190, 89, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ color: 'var(--cad-brass)' }}>
            <Flame size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>USABLE POWDER VOL</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: 'var(--cad-brass)' }}>
              {volumetrics.usable_capacity_grains_h2o} <span style={{ fontSize: '11px' }}>gr H₂O</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {volumetrics.usable_capacity_cm3} cm³ (w/ bullet)
            </div>
          </div>
        </div>

        {/* 3. Bullet Displacement */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ color: 'var(--cad-copper)' }}>
            <Target size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>BULLET SEAT DISP</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: 'var(--cad-copper)' }}>
              {volumetrics.bullet_displacement_grains_h2o} <span style={{ fontSize: '11px' }}>gr H₂O</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Depth: {cartridge.seating_depth.toFixed(3)}"
            </div>
          </div>
        </div>

        {/* 4. Sectional Density */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ color: 'var(--cad-blue)' }}>
            <Compass size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>SECTIONAL DENSITY</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: '#fff' }}>
              {volumetrics.sectional_density.toFixed(3)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Est. G1 BC: ~{volumetrics.g1_bc_est.toFixed(3)}
            </div>
          </div>
        </div>

        {/* 5. Expansion Ratio */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ color: '#3fb950' }}>
            <Zap size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>EXPANSION RATIO</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: '#3fb950' }}>
              {volumetrics.expansion_ratio_24in.toFixed(1)}:1
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              24" Standard Barrel
            </div>
          </div>
        </div>

        {/* 6. Pressure Rating & Collapse Toggle */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: '#f85149' }}>
              <Gauge size={18} />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>MAX PRESSURE (PMAX)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: '#f85149' }}>
                {pressureBar.toLocaleString()} <span style={{ fontSize: '11px' }}>bar</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {pressurePsi.toLocaleString()} PSI ({cartridge.standard})
              </div>
            </div>
          </div>

          <button
            onClick={toggleCollapse}
            title="Collapse Volumetric Telemetry HUD"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
