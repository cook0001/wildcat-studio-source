import React, { useState, useEffect } from 'react';
import { CartridgeSpec, CARTRIDGE_CATEGORIES } from '../types/cartridge';
import { generateCustomCartridgeId, isCustomCartridge } from '../utils/customCartridges';
import { BookmarkPlus, Check, X, Save } from 'lucide-react';

interface SaveCartridgeModalProps {
  cartridge: CartridgeSpec;
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedCartridge: CartridgeSpec) => void;
  isMetric: boolean;
}

export const SaveCartridgeModal: React.FC<SaveCartridgeModalProps> = ({
  cartridge,
  isOpen,
  onClose,
  onSave,
  isMetric,
}) => {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('⭐ Custom Wildcats & User Designs');

  useEffect(() => {
    if (isOpen) {
      if (isCustomCartridge(cartridge.id)) {
        setName(cartridge.name);
      } else {
        setName(`${cartridge.name} (Custom Wildcat)`);
      }
      setCategory(cartridge.category || '⭐ Custom Wildcats & User Designs');
    }
  }, [isOpen, cartridge.id, cartridge.name, cartridge.category]);

  const isExistingCustom = isCustomCartridge(cartridge.id);

  if (!isOpen) return null;

  const handleSaveAsNew = () => {
    const trimmed = name.trim() || 'Custom Wildcat';
    const newId = generateCustomCartridgeId(trimmed);
    const newCartridge: CartridgeSpec = {
      ...cartridge,
      id: newId,
      name: trimmed,
      category: category,
      standard: 'Wildcat',
    };
    onSave(newCartridge);
    onClose();
  };

  const handleOverwrite = () => {
    const trimmed = name.trim() || cartridge.name;
    const updatedCartridge: CartridgeSpec = {
      ...cartridge,
      name: trimmed,
      category: category,
      standard: 'Wildcat',
    };
    onSave(updatedCartridge);
    onClose();
  };

  const fmt = (val: number, prec = 3) => {
    if (isMetric) return (val * 25.4).toFixed(prec) + ' mm';
    return val.toFixed(prec) + '"';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1.5px solid var(--cad-cyan)',
          borderRadius: '10px',
          width: '520px',
          maxWidth: '100%',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8), 0 0 24px rgba(0, 210, 255, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
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
                background: 'rgba(0, 210, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0, 210, 255, 0.3)',
              }}
            >
              <BookmarkPlus size={18} color="var(--cad-cyan)" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                Save to Cartridge Database
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                Add your custom wildcat design into persistent local library
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
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Cartridge Name Input */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--cad-cyan)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              WILDCAT CARTRIDGE NAME
            </label>
            <input
              id="input-save-cartridge-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. .300 Daniel Express, 6.5-08 Wildcat"
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                padding: '10px 12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category Selector */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              DATABASE CATEGORY
            </label>
            <select
              id="select-save-cartridge-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="⭐ Custom Wildcats & User Designs">⭐ Custom Wildcats & User Designs (Recommended)</option>
              {CARTRIDGE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Live Dimension Snapshot */}
          <div
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              ACTIVE PARAMETRIC SNAPSHOT
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Caliber (G₁):</span>{' '}
                <strong style={{ color: 'var(--cad-copper)' }}>{fmt(cartridge.bullet_diameter)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Case Lg (L₃):</span>{' '}
                <strong style={{ color: 'var(--cad-cyan)' }}>{fmt(cartridge.case_length)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>COAL (L₆):</span>{' '}
                <strong style={{ color: '#f0883e' }}>{fmt(cartridge.coal)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Base (P₁):</span>{' '}
                <strong>{fmt(cartridge.base_diameter, 4)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Shoulder (α):</span>{' '}
                <strong>{cartridge.shoulder_angle > 0.05 ? `${cartridge.shoulder_angle}°` : 'Straight'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Rim Type:</span>{' '}
                <strong style={{ textTransform: 'capitalize' }}>{cartridge.rim_type}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          {isExistingCustom && (
            <button
              id="btn-confirm-overwrite-cartridge"
              onClick={handleOverwrite}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--cad-cyan)',
                color: 'var(--cad-cyan)',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Save size={14} />
              <span>Update Existing</span>
            </button>
          )}

          <button
            id="btn-confirm-save-cartridge"
            onClick={handleSaveAsNew}
            style={{
              background: 'var(--cad-cyan)',
              border: 'none',
              color: '#0a0d13',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 12px rgba(0, 210, 255, 0.4)',
            }}
          >
            <Check size={15} />
            <span>Save as New Cartridge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
