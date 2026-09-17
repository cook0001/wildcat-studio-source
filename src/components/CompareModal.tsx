import React, { useState, useMemo } from 'react';
import { CartridgeSpec, CARTRIDGE_PRESETS } from '../types/cartridge';
import { calculateVolumetrics } from '../utils/volumetrics';
import { Layers, X, Search, ArrowRight } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCartridge: CartridgeSpec;
  customCartridges: Record<string, CartridgeSpec>;
  onSelectCompareCartridge: (cartridge: CartridgeSpec) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  activeCartridge,
  customCartridges,
  onSelectCompareCartridge
}) => {
  const [search, setSearch] = useState('');
  const [filterCaliberOnly, setFilterCaliberOnly] = useState(false);

  const allCartridges = useMemo(() => {
    return Object.values({ ...CARTRIDGE_PRESETS, ...customCartridges });
  }, [customCartridges]);

  const filteredCartridges = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCartridges.filter((c) => {
      if (c.id === activeCartridge.id) return false; // don't compare to self
      if (filterCaliberOnly) {
        const calDiff = Math.abs(c.bullet_diameter - activeCartridge.bullet_diameter);
        if (calDiff > 0.015) return false;
      }
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.standard.toLowerCase().includes(q)
      );
    });
  }, [allCartridges, search, filterCaliberOnly, activeCartridge]);

  if (!isOpen) return null;

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
          width: '640px',
          maxWidth: '94vw',
          maxHeight: '85vh',
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
          padding: '14px 18px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(0, 210, 255, 0.15)', color: 'var(--cad-cyan)', padding: '6px', borderRadius: '6px' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                Select Cartridge for Ghost Comparison
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                Superimpose a secondary blueprint contour over <strong>{activeCartridge.name}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{ padding: '12px 18px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input
              id="input-search-compare"
              type="text"
              autoFocus
              placeholder="Search by caliber name (e.g. 6.5 PRC, .308, Creedmoor)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 10px 6px 30px',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={() => setFilterCaliberOnly(!filterCaliberOnly)}
            style={{
              background: filterCaliberOnly ? 'rgba(0, 210, 255, 0.2)' : 'var(--bg-card)',
              border: `1px solid ${filterCaliberOnly ? 'var(--cad-cyan)' : 'var(--border-color)'}`,
              color: filterCaliberOnly ? 'var(--cad-cyan)' : 'var(--text-secondary)',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Same Caliber ({activeCartridge.bullet_diameter.toFixed(3)}") Only
          </button>
        </div>

        {/* List of Cartridges */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px' }}>
          {filteredCartridges.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No matching cartridges found.
            </div>
          ) : (
            filteredCartridges.map((c) => {
              const vol = calculateVolumetrics(c);

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCompareCartridge(c);
                    onClose();
                  }}
                  style={{
                    padding: '10px 12px',
                    margin: '4px 0',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.12s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--cad-cyan)';
                    e.currentTarget.style.background = '#141e2e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-card)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{c.name}</span>
                      <span style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: c.standard === 'Wildcat' ? 'rgba(240, 136, 62, 0.2)' : 'rgba(0, 210, 255, 0.2)',
                        color: c.standard === 'Wildcat' ? 'var(--cad-copper)' : 'var(--cad-cyan)',
                        fontWeight: 700
                      }}>
                        {c.standard}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
                      <span>Cal: <strong>{c.bullet_diameter.toFixed(3)}"</strong></span>
                      <span>Case L₃: <strong>{c.case_length.toFixed(3)}"</strong></span>
                      <span>COAL: <strong>{c.coal.toFixed(3)}"</strong></span>
                      <span>Vol: <strong>{vol.overflow_capacity_grains_h2o} gr H₂O</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cad-cyan)', fontSize: '11px', fontWeight: 600 }}>
                    <span>Compare</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
