import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  Layers,
  Shield,
  Crosshair,
  Ruler,
  Wrench,
  Printer,
  Compass,
  Check,
  Copy,
  ChevronRight,
  Sparkles,
  Cpu,
  Flame,
  Droplet,
  ExternalLink,
  ShoppingBag
} from 'lucide-react';
import { openExternalLink } from '../utils/openExternal';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalibration?: () => void;
  onOpenWildcatWizard?: () => void;
  onOpenReamerModal?: () => void;
  onOpenCartridgeModal?: () => void;
  onOpenPrintSheet?: () => void;
}

interface GuideSection {
  id: string;
  title: string;
  shortTitle: string;
  category: 'Fundamentals' | 'CAD Drafting' | 'Engineering & Physics' | 'Tooling & Machining' | 'Reference';
  icon: React.FC<any>;
  summary: string;
  content: React.ReactNode;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenCalibration,
  onOpenWildcatWizard,
  onOpenReamerModal,
  onOpenCartridgeModal,
  onOpenPrintSheet,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections: GuideSection[] = useMemo(() => [
    {
      id: 'getting-started',
      title: '1. Welcome & Interface Architecture',
      shortTitle: 'System Overview',
      category: 'Fundamentals',
      icon: BookOpen,
      summary: 'High-performance cleanroom CAD suite layout, navigation workflows, and UI architecture.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              Welcome to Wildcat Studio (Quick_Design)
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              <strong>Wildcat Studio</strong> is an industrial-grade computer-aided drafting (CAD) and internal ballistics volumetrics suite designed specifically for custom cartridge wildcatters, custom gunsmiths, reamer manufacturers, and ballistics researchers, incorporating modern real-time vector rendering, 1000-slice Simpson integration, and interactive 3D solid lathe modeling.
            </p>
          </div>

          <div style={{
            background: 'rgba(0, 210, 255, 0.04)',
            border: '1px solid rgba(0, 210, 255, 0.2)',
            borderRadius: '6px',
            padding: '16px',
          }}>
            <h4 style={{ fontSize: '13px', color: 'var(--cad-cyan)', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} /> Screen Anatomy & Workspace Layout
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '12px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#fff' }}>1. Top Menu & Quick Actions:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  Desktop-style drop-down menus (File, Edit, View, Tools, Settings) along with instant launchers for Cartridge Database (⌘O), Wildcat Wizard (⌘W), Chamber Reamer, 1:1 Scale Calibration, and Print Sheet (⌘P).
                </p>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#fff' }}>2. Central Blueprint Canvas:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  High-speed 2D vector CAD drafting area supporting smooth pan, zoom, 90° clockwise rotation (R), Fit-to-View (F), interactive dimensional arrows, and direct on-canvas editing popovers.
                </p>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#fff' }}>3. Parametric Engineering Sidebar:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  Collapsible drawer (⌘B) grouping dimensions by mechanical section: Rim & Extractor, Case Body, Shoulder Geometry, Neck & Mouth, Seated Bullet, and Internal Cavity Wall Profiles.
                </p>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#fff' }}>4. Floating Volumetric HUD:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  Real-time telemetry cards displaying overflow water capacity (gr H₂O / cm³), seated bullet shank displacement, net usable capacity, expansion ratio, and bore index.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', color: '#fff', fontWeight: 600, marginBottom: '8px' }}>
              Essential Fast-Start Workflow
            </h4>
            <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7 }}>
              <li><strong>Open a Parent Case:</strong> Press <kbd style={kbdStyle}>⌘O</kbd> or click <em>Open Database...</em> to pick from 408 verified SAAMI/CIP presets (e.g. .308 Winchester, 6.5 PRC, .30-06).</li>
              <li><strong>Draft or Edit Dimensions:</strong> Click directly on any dimension number on the blueprint canvas to launch the numeric popover with instant ±0.001" micro-steppers.</li>
              <li><strong>Form a Wildcat:</strong> Press <kbd style={kbdStyle}>⌘W</kbd> to launch the Wildcatting Engine to neck up/down, blow out shoulders to 40° Ackley angles, or truncate body length.</li>
              <li><strong>Inspect Tolerances & Reamer:</strong> Switch Tolerance Mode to <em>Dual Envelope (MMC vs LMC)</em> to verify chamber clearance, or click <em>Chamber Reamer...</em> to generate direct toolmaker orders for PTG, Manson, JGS, or Clymer.</li>
              <li><strong>Export Technical Output:</strong> Export to AutoCAD vector <kbd style={kbdStyle}>.dxf</kbd>, QuickDESIGN <kbd style={kbdStyle}>.qdf</kbd>, QuickLOAD <kbd style={kbdStyle}>.vol</kbd>, 3D printable <kbd style={kbdStyle}>.stl</kbd>, or print standard engineering drawings (<kbd style={kbdStyle}>⌘P</kbd>).</li>
            </ol>
          </div>

          <div style={{
            background: 'rgba(0, 210, 255, 0.04)',
            border: '1px solid rgba(0, 210, 255, 0.2)',
            borderRadius: '6px',
            padding: '14px',
          }}>
            <h4 style={{ fontSize: '13px', color: 'var(--cad-cyan)', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ExternalLink size={14} /> ArmoryVault & Firearms Ecosystem Integration
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6, marginBottom: '10px' }}>
              Wildcat Studio seamlessly complements the wider shooting sports and firearms management ecosystem:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '8px', fontSize: '12px' }}>
              <a
                href="https://armstrader.store"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => { e.preventDefault(); openExternalLink('https://armstrader.store'); }}
                style={ecoCardStyle}
              >
                <div>
                  <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShoppingBag size={13} color="var(--cad-cyan)" /> ArmsTrader Store
                  </strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '2px 0 0 0' }}>armstrader.store marketplace</p>
                </div>
                <ExternalLink size={13} color="var(--cad-cyan)" />
              </a>

              <a
                href="https://cook0001.github.io/ArmoryVault/"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => { e.preventDefault(); openExternalLink('https://cook0001.github.io/ArmoryVault/'); }}
                style={ecoCardStyle}
              >
                <div>
                  <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Shield size={13} color="var(--cad-cyan)" /> ArmoryVault Platform
                  </strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '2px 0 0 0' }}>Firearms, ammo & gear vault</p>
                </div>
                <ExternalLink size={13} color="var(--cad-cyan)" />
              </a>

              <a
                href="https://github.com/cook0001/ArmoryVault-Companion"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => { e.preventDefault(); openExternalLink('https://github.com/cook0001/ArmoryVault-Companion'); }}
                style={ecoCardStyle}
              >
                <div>
                  <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ExternalLink size={13} color="var(--cad-cyan)" /> ArmoryVault Companion
                  </strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '2px 0 0 0' }}>Mobile companion application</p>
                </div>
                <ExternalLink size={13} color="var(--cad-cyan)" />
              </a>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'cartridge-database',
      title: '2. Encyclopedic Cartridge Database (⌘O)',
      shortTitle: 'Cartridge Database',
      category: 'Fundamentals',
      icon: Search,
      summary: 'Browsing 408 authentic cartridges across 11 category modules, filter architecture, and custom database management.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              408 Authentic Cartridges Across 11 Specialized Modules
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              The database contains full parametric engineering definitions matching official SAAMI (Sporting Arms and Ammunition Manufacturers' Institute) and CIP (Permanent International Commission for the Proof of Small Arms) standards, along with historic proprietary and iconic wildcat designs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', fontSize: '12px' }}>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>Standard Rifle & Magnums:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                .22-250, .243 Win, .270 Win, .308 Win, .30-06 Springfield, 7mm Rem Mag, .300 Win Mag, .338 Lapua Mag, .375 Ruger, .416 Rem Mag.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>Modern Precision (PRS / NRL):</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                6mm ARC, 6mm Creedmoor, 6.5 Creedmoor, 6.5 PRC, 7mm PRC, .300 PRC, .224 Valkyrie, 6.8 Western, .277 SIG FURY.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>British & African Dangerous Game:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                .375 H&H Magnum, .404 Jeffery, .416 Rigby, .450 Nitro Express, .470 Nitro Express, .500 Nitro Express, .577 Tyrannosaur, .600 Nitro, .700 Nitro Express.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>Historic Blackpowder & Straight-Wall:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                .45-70 Government, .45-90 Sharps, .50-70 Gov't, .50-110 Winchester, .350 Legend, .400 Legend, .450 Bushmaster.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>Military Small Arms:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                5.56×45mm NATO, 7.62×51mm NATO, 7.62×39mm Soviet, 5.45×39mm, 7.62×54mmR, 8×57mm IS Mauser, 12.7×108mm Russian, .50 BMG (12.7×99mm).
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>Historic Wildcat Legends:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                .22 CHeetah (4000+ fps icon), 6mm PPC, 6mm BR, 6.5-284 Norma, 7mm STW (Shooting Times Westerner), .300 Whisper, .338-06 A-Square.
              </p>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '13px', color: '#fff', fontWeight: 600, marginBottom: '6px' }}>
              Database Search & Filter Navigation
            </h4>
            <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: 1.6 }}>
              <li><strong>Real-time Search:</strong> Instant sub-millisecond keyword matching against cartridge names, designer codes, and caliber designations.</li>
              <li><strong>Caliber Band Chips:</strong> Micro (.172 to .224), Standard (.243 to .308), Magnum (.338 to .375), Ultra-Mag (.416 to .458), and Heavy Bore (.500 to .700).</li>
              <li><strong>My Wildcats Tab:</strong> Dedicated filter showing only user-created custom cartridges stored in your browser's persistent database.</li>
              <li><strong>Reset All Filters:</strong> When a filter combination yields zero matches, an instant reset button is provided to restore the full 408-record view.</li>
            </ul>
          </div>

          {onOpenCartridgeModal && (
            <button
              onClick={() => { onClose(); onOpenCartridgeModal(); }}
              style={actionButtonStyle}
            >
              <Search size={14} /> Open Cartridge Database (⌘O)
            </button>
          )}
        </div>
      )
    },
    {
      id: 'cad-drafting',
      title: '3. 2D Blueprint Canvas & Direct Dimension Editing',
      shortTitle: '2D Drafting & Editing',
      category: 'CAD Drafting',
      icon: Ruler,
      summary: 'Canvas navigation, mouse controls, on-canvas interactive dimension popovers, and visualization modes.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              Direct In-Place CAD Drafting & Dimension Editing
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              Unlike traditional programs that force you into rigid tabular menus, Wildcat Studio allows you to interact directly with the drawing itself.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div style={cardStyle}>
              <strong style={{ color: '#fff' }}>Click to Edit:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Click directly on any dimension callout text or measurement arrow (e.g. <code>.4700"</code> or <code>2.0150"</code>). An interactive editing popover will attach to the dimension line.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: '#fff' }}>Micro-Steppers:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Adjust dimensions in precise increments of <code>±0.001"</code> (or <code>±0.01 mm</code> in Metric mode) using the on-screen stepper buttons or the <kbd style={kbdStyle}>↑</kbd> and <kbd style={kbdStyle}>↓</kbd> arrow keys.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: '#fff' }}>Instant Bounds Enforcement:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Geometry limits are checked in real-time. For example, case length ($L_3$) cannot be shorter than shoulder length ($L_2$), and neck diameter ($G_1$) cannot be smaller than bullet diameter ($G_1$).
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: '#fff' }}>Multi-Level Undo / Redo:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Every dimensional step is pushed onto an undo history stack. Press <kbd style={kbdStyle}>⌘Z</kbd> to undo and <kbd style={kbdStyle}>⌘⇧Z</kbd> to redo any change at any time.
              </p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--cad-cyan)', fontWeight: 600, marginBottom: '8px' }}>
              Visual Drawing Modes
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', fontSize: '12px' }}>
              <div><strong>Exterior Outline:</strong> Official SAAMI/CIP silhouette without internal cut lines.</div>
              <div><strong>CAD Wireframe:</strong> Displays extraction groove, internal powder core, and centerlines.</div>
              <div><strong>Longitudinal Cutaway:</strong> Shows solid brass thickness, web floor, and powder chamber.</div>
              <div><strong>ISO Half-Section:</strong> Industrial standard upper solid exterior with lower internal cutaway.</div>
              <div><strong>Chamber Fit:</strong> Cartridge nested inside the chamber cut with clearance highlighting.</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0, 210, 255, 0.05)', padding: '12px', borderRadius: '6px', fontSize: '12px', borderLeft: '3px solid var(--cad-cyan)' }}>
            <strong>Canvas Navigation Shortcuts:</strong> Pan with <em>Left-click + drag</em> or <em>Middle-click + drag</em>. Zoom smoothly with <em>Mouse Wheel</em> or <em>Trackpad Pinch</em>. Press <kbd style={kbdStyle}>F</kbd> to fit to screen. Press <kbd style={kbdStyle}>R</kbd> to rotate the canvas 90° clockwise.
          </div>
        </div>
      )
    },
    {
      id: 'volumetrics-physics',
      title: '4. Volumetric Physics & 1000-Slice Simpson Integration',
      shortTitle: 'Volumetric Integration',
      category: 'Engineering & Physics',
      icon: Cpu,
      summary: '1000-slice Simpson rule numerical integration, wall thickness profiles, overflow capacity, and expansion ratios.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              The 1000-Slice Simpson Numerical Integration Engine
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              Crude ballistics programs approximate case volume using basic truncated cones (frustums). This introduces significant errors around the solid extractor web, body-shoulder blend fillets, and inside neck walls. Wildcat Studio slices the internal powder cavity into <strong>1,000 distinct axial cross-sections</strong> and integrates them using Simpson's Composite 1/3 Rule:
            </p>
          </div>

          <div style={{
            background: '#070a10',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            borderRadius: '6px',
            padding: '14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--cad-cyan)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>SIMPSON'S COMPOSITE INTEGRAL</span>
              <button
                onClick={() => handleCopy("V = (h/3) * sum(k=0 to n-1)[ A(x_{2k}) + 4*A(x_{2k+1}) + A(x_{2k+2}) ]", 'simpson')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {copiedCode === 'simpson' ? <Check size={12} color="var(--cad-green)" /> : <Copy size={12} />}
              </button>
            </div>
            <code>V = (h / 3) * ∑ [ A(x₂ₖ) + 4·A(x₂ₖ₊₁) + A(x₂ₖ₊₂) ]</code>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '6px' }}>
              where h = (L₃ - Web_Thickness) / 1000, and A(x) = π · [r_internal(x)]² accounting for web taper, shoulder angle, and neck wall thickness.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div style={cardStyle}>
              <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplet size={14} color="var(--cad-cyan)" /> Gross Overflow Capacity:
              </strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Total internal water capacity when filled flush with the case mouth. Calibrated in grains of distilled H₂O at 20°C (1.000 g/cm³) and cubic centimeters (cm³).
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={14} color="var(--cad-copper)" /> Seated Projectile Displacement:
              </strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                The volume of the bullet shank that extends beneath the case mouth. Long heavy high-BC match bullets significantly reduce usable powder space.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="var(--cad-green)" /> Net Usable Powder Capacity:
              </strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Calculated as <code>V_net = V_gross - V_displacement</code>. This is the exact volume available for the burning propellant charge.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={14} color="#ffd700" /> Bore Index & Expansion Ratio:
              </strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Indicates cartridge overbore index (<code>V_overflow / A_bore</code>) to determine powder burning rate requirements and barrel throat erosion propensity.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'bullet-seating',
      title: '5. Projectile Library & Seating Depth Solver',
      shortTitle: 'Bullet Seating Solver',
      category: 'Engineering & Physics',
      icon: Crosshair,
      summary: 'Authentic match bullet catalog, seating depth calculations, COAL adjustment, and donut zone encroachment warnings.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              Authentic Match Projectile Modeling & Seating Optimization
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              Seating depth dictates cartridge overall length (COAL / $L_6$), magazine fit, pressure spikes, and throat leade jump.
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '13px', color: '#fff', fontWeight: 600, marginBottom: '6px' }}>
              Built-In Sierra MatchKing & Precision Projectile Profiles
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6 }}>
              Select from real-world projectile geometry including authentic weights, boat-tail lengths, boat-tail angles, and tangent/secant ogive profiles across all popular calibers (.224, 6mm, 6.5mm, 7mm, .308, .338, .375, .500).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>COAL & Seating Depth Sliders:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Adjust Cartridge Overall Length ($L_6$) directly. As the projectile slides in or out, the shank depth and powder displacement recalculate instantly.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>Neck Bearing Surface Verification:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Ensures the cylindrical bearing surface of the bullet is properly supported by the case neck (ideally at least one caliber of bearing contact).
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: '#ffb700' }}>Powder Column Encroachment:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Visual alert warns you when the bullet boat-tail extends past the neck-shoulder junction ("donut zone") into the main powder combustion chamber.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'wildcatting-engine',
      title: '6. Wildcatting & Case Forming Engine (⌘W)',
      shortTitle: 'Wildcatting Engine',
      category: 'Tooling & Machining',
      icon: Sparkles,
      summary: 'Necking up and down caliber matrix, 40° Ackley fireforming blowout calculations, and action truncation.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              The 4-Step Wildcatting & Fireforming Engine
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              Wildcatting is the art and science of creating custom cartridges from existing factory parent cases. Wildcat Studio's wizard automates the math of die necking, shoulder fireforming, and action length truncation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div style={cardStyle}>
              <strong style={{ color: '#fff' }}>Step 1: Necking Up / Down</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Select any new target caliber from .172 to .50 BMG. The system automatically adjusts neck diameter ($G_1$) while preserving brass thickness and proper neck tension.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: '#fff' }}>Step 2: Ackley 40° Fireforming</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Steepens shallow factory shoulders (e.g. 20°) to P.O. Ackley's legendary 40° angle, straightens case body taper, and preserves SAAMI headspace crush fit at the neck junction so factory ammo can be safely fireformed.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: '#fff' }}>Step 3: Action Truncation</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Shorten long action brass (e.g. .30-06) to fit standard short actions (2.800" max COAL) or AR-15 magazine lengths (2.260" max COAL) with automatic shoulder relocation.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: '#fff' }}>Step 4: Save & Tag Pedigree</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Save directly to your persistent database. The newly created wildcat retains a permanent pedigree record of its parent case for comparative overlay.
              </p>
            </div>
          </div>

          {onOpenWildcatWizard && (
            <button
              onClick={() => { onClose(); onOpenWildcatWizard(); }}
              style={actionButtonStyle}
            >
              <Sparkles size={14} /> Open Wildcatting Wizard (⌘W)
            </button>
          )}
        </div>
      )
    },
    {
      id: 'chamber-reamer',
      title: '7. Chamber Reamer Design & Toolmaker Orders',
      shortTitle: 'Chamber Reamer Orders',
      category: 'Tooling & Machining',
      icon: Wrench,
      summary: 'Reamer geometry, headspace datums, freebore leade tailoring, and manufacturer order requisitions for PTG, Manson, JGS, and Clymer.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              Chamber Reamer Modeling & Manufacturer Direct Requisitions
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              A chamber reamer must cut a cavity slightly larger than the cartridge case to ensure reliable chambering, case extraction under high pressure, and proper bullet release.
            </p>
          </div>

          <div style={{ background: 'rgba(0, 210, 255, 0.04)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--cad-cyan)', fontWeight: 600, marginBottom: '8px' }}>
              Manufacturer Order Formats Supported
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '12px' }}>
              <div style={cardStyle}>
                <strong style={{ color: '#fff' }}>Pacific Tool & Gauge (PTG):</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '3px' }}>
                  Official PTG Order Requisition format, PTG part number generation, 7/16" dual-flat shank with 1/4"-28 tap, and 5-piece bushing kit specs.
                </p>
              </div>
              <div style={cardStyle}>
                <strong style={{ color: '#fff' }}>Dave Manson Precision:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '3px' }}>
                  Manson tooling requisition with removable pilot bushing specifications and fitted neck release options.
                </p>
              </div>
              <div style={cardStyle}>
                <strong style={{ color: '#fff' }}>JGS Precision Tool Mfg:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '3px' }}>
                  JGS standard blueprint format with ±0.0002" diametral and ±0.001" axial tolerance specification blocks.
                </p>
              </div>
              <div style={cardStyle}>
                <strong style={{ color: '#fff' }}>Clymer Precision Tools:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '3px' }}>
                  Standard Clymer chamber reamer tooling layout.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', color: '#fff', fontWeight: 600, marginBottom: '6px' }}>
              Key Reamer Parameters Explained
            </h4>
            <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: 1.6 }}>
              <li><strong>Diametral Clearance ($\Delta$):</strong> Reamer base and shoulder diameters are typically cut <code>+0.0020"</code> to <code>+0.0030"</code> over maximum cartridge dimensions for smooth feeding and extraction.</li>
              <li><strong>Fitted Neck vs No-Turn Neck:</strong> Match chambers can be ordered with tight necks (e.g. <code>+0.0020"</code> clearance) requiring neck turning, or factory release necks (<code>+0.0040"</code> clearance) for no-turn brass.</li>
              <li><strong>Freebore Diameter & Length:</strong> Tailored specifically to your match projectile's bearing surface to minimize unguided bullet jump before engaging rifling lands.</li>
              <li><strong>Throat / Leade Angle:</strong> $1.5^\circ$ standard match angle for smooth progressive bullet engraving, or $2.0^\circ$ to $2.5^\circ$ for military service chambers.</li>
            </ul>
          </div>

          {onOpenReamerModal && (
            <button
              onClick={() => { onClose(); onOpenReamerModal(); }}
              style={actionButtonStyle}
            >
              <Wrench size={14} /> Open Chamber Reamer Suite
            </button>
          )}
        </div>
      )
    },
    {
      id: 'scale-calibration',
      title: '8. 1:1 True Physical Scale & Display Calibration',
      shortTitle: '1:1 Display Calibration',
      category: 'Tooling & Machining',
      icon: Crosshair,
      summary: 'Calibrating physical monitor PPI using credit cards, 1.000" calipers, or metric standards; on-screen engineering rulers.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              Physical Display Calibration & Calibrated On-Screen Rulers
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              Standard operating systems assume an arbitrary 96 DPI for web and graphics rendering. In reality, modern monitors range from 92 PPI (24" 1080p) to 218 PPI (Apple 5K Studio Display). Wildcat Studio features an interactive calibration wizard so <strong>1.000" on the drawing is exactly 1.000" in the physical world</strong>.
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--cad-cyan)', fontWeight: 600, marginBottom: '8px' }}>
              Calibration Reference Standards Available
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
              <div>
                <strong>Credit Card (ISO ID-1):</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Hold any standard credit card or driver's license (3.370" × 2.125" / 85.60 × 53.98 mm) directly against the screen.</p>
              </div>
              <div>
                <strong>1.000" Caliper Mark:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Open your dial or digital caliper to 1.000" and align with the graduated on-screen line.</p>
              </div>
              <div>
                <strong>50.00 mm Metric Scale:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Use an engineering steel rule with millimeter graduations to align the 50 mm mark.</p>
              </div>
              <div>
                <strong>US Quarter Coin:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Hold a standard US 25¢ quarter coin against the calibrated 0.955" circular outline.</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(0, 210, 255, 0.04)', padding: '12px', borderRadius: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            <strong>On-Screen Calibrated Engineering Ruler:</strong> When 1:1 True Physical Scale mode is active in the View menu, a graduated precision engineering ruler renders directly on the blueprint canvas. You can hold physical brass cases, chamber gauges, or reamers right up to the monitor glass to verify dimensions at true physical scale.
          </div>

          {onOpenCalibration && (
            <button
              onClick={() => { onClose(); onOpenCalibration(); }}
              style={actionButtonStyle}
            >
              <Crosshair size={14} /> Open Display Calibration Wizard
            </button>
          )}
        </div>
      )
    },
    {
      id: 'tolerance-envelope',
      title: '9. Dual Tolerance Envelope Overlay (MMC vs LMC)',
      shortTitle: 'Tolerance Envelope',
      category: 'Tooling & Machining',
      icon: Shield,
      summary: 'Maximum Material Cartridge (MMC solid) vs Minimum Material Chamber (LMC dashed) with live clearance callouts (Δ).',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              Dual Tolerance Envelope: MMC Cartridge vs LMC Chamber
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              In firearms manufacturing, the most critical safety verification is ensuring the <strong>Maximum Material Cartridge (MMC)</strong>—the largest possible cartridge allowable within manufacturing tolerances—always chambers safely inside the <strong>Least Material Chamber (LMC)</strong>—the tightest possible chamber cut by a new reamer.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div style={cardStyle}>
              <strong style={{ color: '#fff' }}>Solid White Line:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Maximum Material Cartridge (MMC) exterior boundary representing maximum allowable outer dimensions.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>Dashed Cyan/Gold Line:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Least Material Chamber (LMC) cut boundary representing minimum interior chamber dimensions.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-green)' }}>Clearance Callout Badges [Δ]:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Live numerical clearance delta displayed at the base, shoulder, neck, and freebore (e.g. <code>Δ +0.0025"</code>).
              </p>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 180, 0, 0.06)', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #ffb700', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            <strong>Safety Rule:</strong> Never allow negative clearance (&Delta; &lt; 0). Negative clearance indicates an interference fit where a cartridge would fail to chamber or could cause catastrophic bolt lockup upon firing.
          </div>
        </div>
      )
    },
    {
      id: 'exports-printing',
      title: '10. Technical CAD Exports & Engineering Drawings (⌘P)',
      shortTitle: 'Technical Exports & Sheets',
      category: 'Reference',
      icon: Printer,
      summary: 'AutoCAD DXF vector export, QuickDESIGN QDF, QuickLOAD .vol, STL 3D solid mesh, and ANSI/ISO engineering print sheets.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              Technical CAD Exports & Engineering Documentation
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              Wildcat Studio provides comprehensive technical export pipelines for CNC toolpaths, ballistics simulation suites, 3D printing, and machine shop documentation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>AutoCAD Vector (.dxf):</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Precision DXF files ready for direct import into AutoCAD, SolidWorks, Autodesk Fusion 360, Mastercam, and CNC lathe turning programs.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>QuickDESIGN File (.qdf):</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Cleanroom interchange format compatible with Hartmut Broemel's QuickDESIGN suite.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>QuickLOAD Database (.vol):</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Cartridge geometry and water capacity file directly importable into QuickLOAD interior ballistics software.
              </p>
            </div>
            <div style={cardStyle}>
              <strong style={{ color: 'var(--cad-cyan)' }}>3D Printable Mesh (.stl):</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Watertight triangulated solid model mesh for 3D printing dummy rounds, case gauges, and chamber check plugs.
              </p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '13px', color: '#fff', fontWeight: 600, marginBottom: '6px' }}>
              Print-Ready Engineering Drawing Sheet (⌘P)
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6 }}>
              Generates an official ANSI B (11" × 17") or ISO A3 technical drawing sheet complete with projection view, title block, SAAMI dimensional table, revision block, and gunsmith tolerance notes.
            </p>
          </div>

          {onOpenPrintSheet && (
            <button
              onClick={() => { onClose(); onOpenPrintSheet(); }}
              style={actionButtonStyle}
            >
              <Printer size={14} /> Open Engineering Print Sheet (⌘P)
            </button>
          )}
        </div>
      )
    },
    {
      id: 'shortcuts-reference',
      title: '11. Keyboard Shortcuts & Gestures Reference',
      shortTitle: 'Keyboard Shortcuts',
      category: 'Reference',
      icon: Cpu,
      summary: 'Complete hotkey table for high-speed drafting, navigation, modal toggles, and drawing tools.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px', fontWeight: 700 }}>
              Master Keyboard Shortcuts Cheat Sheet
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>
              Accelerate your workflow with industry-standard CAD hotkeys and navigation shortcuts:
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px 12px', color: 'var(--cad-cyan)' }}>Shortcut</th>
                  <th style={{ padding: '8px 12px', color: '#fff' }}>Action</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Scope</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>⌘O</kbd> / <kbd style={kbdStyle}>Ctrl+O</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Open Cartridge Database</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Global</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>⌘S</kbd> / <kbd style={kbdStyle}>Ctrl+S</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Save Custom Cartridge to Database</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Global</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>⌘W</kbd> / <kbd style={kbdStyle}>Ctrl+W</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Open Wildcatting & Case Forming Wizard</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Global</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>⌘P</kbd> / <kbd style={kbdStyle}>Ctrl+P</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Open Engineering Print Sheet</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Global</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>⌘B</kbd> / <kbd style={kbdStyle}>Ctrl+B</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Toggle Parametric Controls Sidebar</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Global</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>⌘Z</kbd> / <kbd style={kbdStyle}>Ctrl+Z</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Undo Last Dimension Modification</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Global</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>⌘⇧Z</kbd> / <kbd style={kbdStyle}>Ctrl+Y</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Redo Last Dimension Modification</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Global</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>F</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Fit Drawing to Canvas Viewport</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Canvas</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>R</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Rotate Drawing 90° Clockwise</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Canvas</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>F1</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Open User Guide & Technical Manual</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Global</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}><kbd style={kbdStyle}>Escape</kbd></td>
                  <td style={{ padding: '8px 12px', color: '#fff' }}>Close Active Modal / Dismiss Popover</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Global</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    }
  ], [
    onClose,
    onOpenCalibration,
    onOpenWildcatWizard,
    onOpenReamerModal,
    onOpenCartridgeModal,
    onOpenPrintSheet,
    copiedCode
  ]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.shortTitle.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [sections, searchQuery]);

  const activeSection = useMemo(() => {
    return sections.find((s) => s.id === activeSectionId) || sections[0];
  }, [sections, activeSectionId]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid rgba(0, 210, 255, 0.3)',
          borderRadius: '8px',
          width: '1100px',
          maxWidth: '96vw',
          height: '840px',
          maxHeight: '92vh',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 210, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(0, 210, 255, 0.12)',
                border: '1px solid var(--cad-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cad-cyan)',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '0.3px' }}>
                Wildcat Studio User Guide & Technical Manual
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                Complete cleanroom CAD engineering, chamber reamer design, and volumetrics reference
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '4px',
                transition: 'all 0.15s',
              }}
              title="Close User Guide (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* LEFT SIDEBAR: Table of Contents & Search */}
          <div
            style={{
              width: '320px',
              borderRight: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Search Input */}
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  gap: '8px',
                }}
              >
                <Search size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search guide topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    width: '100%',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Chapters List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = sec.id === activeSection.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: isActive ? 'rgba(0, 210, 255, 0.12)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--cad-cyan)' : '3px solid transparent',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} color={isActive ? 'var(--cad-cyan)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {sec.shortTitle}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {sec.category}
                      </div>
                    </div>
                    {isActive && <ChevronRight size={14} color="var(--cad-cyan)" />}
                  </button>
                );
              })}
            </div>

            {/* Bottom Version Footer */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Version 1.0.0</span>
            </div>
          </div>

          {/* RIGHT CONTENT AREA */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '28px 36px',
              background: 'var(--bg-primary)',
            }}
          >
            <div style={{ maxWidth: '820px', margin: '0 auto' }}>
              {/* Category Badge & Section Title */}
              <div style={{ marginBottom: '16px' }}>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: 'var(--cad-cyan)',
                    background: 'rgba(0, 210, 255, 0.1)',
                    border: '1px solid rgba(0, 210, 255, 0.25)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '8px',
                  }}
                >
                  {activeSection.category}
                </span>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                  {activeSection.title}
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                  {activeSection.summary}
                </p>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '20px 0' }} />

              {/* Dynamic Content */}
              {activeSection.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const kbdStyle: React.CSSProperties = {
  background: '#151c28',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 1px 0 rgba(255, 255, 255, 0.1)',
  borderRadius: '3px',
  padding: '2px 6px',
  fontSize: '10.5px',
  fontFamily: 'var(--font-mono)',
  color: 'var(--cad-cyan)',
  display: 'inline-block',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  padding: '12px',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const actionButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  alignSelf: 'flex-start',
  background: 'rgba(0, 210, 255, 0.12)',
  border: '1px solid var(--cad-cyan)',
  color: 'var(--cad-cyan)',
  padding: '8px 16px',
  borderRadius: '5px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  marginTop: '8px',
};

const ecoCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '4px',
  color: '#fff',
  textDecoration: 'none',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  transition: 'all 0.15s ease',
  cursor: 'pointer',
};

