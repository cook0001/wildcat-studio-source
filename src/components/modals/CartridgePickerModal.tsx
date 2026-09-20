import { useState, useMemo } from 'react';
import { Search, X, Crosshair, Layers, Check } from 'lucide-react';
import { CartridgeSpec, CARTRIDGE_CATEGORIES } from '../../types/cartridge';
import { CARTRIDGE_PRESETS } from '../../data/cartridges';

interface CartridgePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCartridge: (cartridge: CartridgeSpec) => void;
  title?: string;
  currentSelectedId?: string;
  filterCategory?: string;
  customCartridges?: Record<string, CartridgeSpec>;
}

export function CartridgePickerModal({
  isOpen,
  onClose,
  onSelectCartridge,
  title = 'Select Cartridge Database Preset',
  currentSelectedId,
  filterCategory: initialCategory,
  customCartridges = {},
}: CartridgePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ALL');

  const allCartridges = useMemo(() => {
    const list = Object.values({ ...CARTRIDGE_PRESETS, ...customCartridges });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [customCartridges]);

  const filteredCartridges = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allCartridges.filter((c) => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        (selectedCategory === 'CUSTOM' ? customCartridges[c.id] !== undefined : c.category === selectedCategory);

      if (!matchesCategory) return false;

      if (!q) return true;

      const caliberStr = `${c.bullet_diameter.toFixed(3)} ${(c.bullet_diameter * 25.4).toFixed(1)}mm`;
      return (
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.standard.toLowerCase().includes(q) ||
        caliberStr.toLowerCase().includes(q) ||
        (c.parent_case && c.parent_case.toLowerCase().includes(q))
      );
    });
  }, [allCartridges, searchQuery, selectedCategory, customCartridges]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 10, 20, 0.85)',
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: '#e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#131e36',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={20} color="#38bdf8" />
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#f8fafc' }}>
                {title}
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Browse {allCartridges.length} SAAMI, CIP, and precision wildcat cartridges
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar & Filter Pills */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e293b', backgroundColor: '#0c1322' }}>
          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '10px',
            }}
          >
            <Search size={17} color="#64748b" />
            <input
              type="text"
              placeholder="Search by name (e.g. 6.5 Creedmoor, 308, 28 Nosler), caliber, or parent case..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '13px',
                width: '100%',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category Pills Horizontal Scroller */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '16px',
                border: selectedCategory === 'ALL' ? '1px solid #38bdf8' : '1px solid #334155',
                backgroundColor: selectedCategory === 'ALL' ? '#0369a1' : '#1e293b',
                color: selectedCategory === 'ALL' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              All ({allCartridges.length})
            </button>
            {Object.keys(customCartridges).length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('CUSTOM')}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: selectedCategory === 'CUSTOM' ? '1px solid #a855f7' : '1px solid #334155',
                  backgroundColor: selectedCategory === 'CUSTOM' ? '#7e22ce' : '#1e293b',
                  color: selectedCategory === 'CUSTOM' ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                My Custom ({Object.keys(customCartridges).length})
              </button>
            )}
            {CARTRIDGE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                    backgroundColor: isSelected ? '#0369a1' : '#1e293b',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cartridge List Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '10px',
            backgroundColor: '#0a0f1d',
          }}
        >
          {filteredCartridges.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px 20px',
                color: '#64748b',
              }}
            >
              <Crosshair size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>
                No cartridges match "{searchQuery}"
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Try adjusting your search keywords or switching category filters.
              </div>
            </div>
          ) : (
            filteredCartridges.map((cartridge) => {
              const isCurrent = cartridge.id === currentSelectedId;
              const caliberMm = (cartridge.bullet_diameter * 25.4).toFixed(2);

              return (
                <div
                  key={cartridge.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCartridge(cartridge);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: isCurrent ? 'rgba(14, 116, 144, 0.3)' : '#131d32',
                    border: isCurrent ? '1.5px solid #06b6d4' : '1px solid #1e293b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = '#1e293b';
                      e.currentTarget.style.borderColor = '#38bdf8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = '#131d32';
                      e.currentTarget.style.borderColor = '#1e293b';
                    }
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc', lineHeight: 1.3 }}>
                        {cartridge.name}
                      </div>
                      {isCurrent && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10px',
                            color: '#38bdf8',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          <Check size={13} /> Active
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Caliber: <strong style={{ color: '#cbd5e1' }}>.{Math.round(cartridge.bullet_diameter * 1000)}</strong> ({caliberMm}mm) | Length: <strong style={{ color: '#cbd5e1' }}>{cartridge.case_length.toFixed(3)}"</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: '10px',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#1e293b',
                        color: '#38bdf8',
                        fontWeight: 500,
                      }}
                    >
                      {cartridge.standard}
                    </span>
                    <span style={{ color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                      {cartridge.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid #1e293b',
            backgroundColor: '#0c1322',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          <span>Showing {filteredCartridges.length} of {allCartridges.length} entries</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
