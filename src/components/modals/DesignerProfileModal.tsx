import { useState } from 'react';
import { User, X, Save, Check } from 'lucide-react';

interface DesignerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (profile: { designerName: string; shopName: string; gunsmithName: string }) => void;
}

export function DesignerProfileModal({ isOpen, onClose, onSave }: DesignerProfileModalProps) {
  const [designerName, setDesignerName] = useState<string>(() => {
    return localStorage.getItem('wildcat_designer_name') || 'Custom Wildcatting Dept.';
  });
  const [shopName, setShopName] = useState<string>(() => {
    return localStorage.getItem('wildcat_shop_name') || 'Precision Ballistics & Tooling';
  });
  const [gunsmithName, setGunsmithName] = useState<string>(() => {
    return localStorage.getItem('wildcat_gunsmith_name') || '';
  });
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('wildcat_designer_name', designerName.trim());
    localStorage.setItem('wildcat_shop_name', shopName.trim());
    localStorage.setItem('wildcat_gunsmith_name', gunsmithName.trim());
    setSaved(true);
    if (onSave) {
      onSave({
        designerName: designerName.trim(),
        shopName: shopName.trim(),
        gunsmithName: gunsmithName.trim(),
      });
    }
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

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
        WebkitBackdropFilter: 'blur(10px)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
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
            <User size={20} color="#38bdf8" />
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                Designer & Shop Profile
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Applied to CAD engineering prints, reamer requisitions & ecosystem exports
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
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
              CARTRIDGE DESIGNER / ENGINEER NAME
            </label>
            <input
              type="text"
              value={designerName}
              onChange={(e) => setDesignerName(e.target.value)}
              placeholder="e.g. John Doe, Custom Wildcatting Dept."
              style={{
                width: '100%',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
              GUNSMITH / FACILITY / SHOP NAME
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Precision Ballistics & Tooling LLC"
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              GUNSMITH / PRIMARY CONTACT (OPTIONAL)
            </label>
            <input
              type="text"
              value={gunsmithName}
              onChange={(e) => setGunsmithName(e.target.value)}
              placeholder="e.g. Lead Gunsmith / Machinist"
              style={{
                width: '100%',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #1e293b',
            backgroundColor: '#0c1322',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 14px',
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
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '7px 16px',
              backgroundColor: saved ? '#10b981' : '#0284c7',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s ease',
            }}
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            <span>{saved ? 'Saved!' : 'Save Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
