import React, { useState, useRef, useEffect } from 'react';
import { CartridgeSpec, ToleranceDisplayMode } from '../types/cartridge';
import { 
  Layers, 
  Box, 
  Compass, 
  Maximize2, 
  Crosshair,
  Download, 
  FileText, 
  Share2, 
  Scale,
  RefreshCw,
  Undo2,
  Redo2,
  BookmarkPlus,
  Trash2,
  FolderOpen,
  Settings,
  BookOpen,
  ChevronDown,
  Check,
  Info,
  X,
  Sliders,
  Wand2,
  Printer,
  RotateCw,
  Columns,
  Grid,
  Shield,
  Eye,
  EyeOff,
  Disc,
  SplitSquareVertical,
  ExternalLink,
  Globe,
  User,
  Sparkles
} from 'lucide-react';
import { DrawingMode } from './BlueprintCanvas';
import { openExternalLink } from '../utils/openExternal';
import { AboutModal } from './modals/AboutModal';
import { LicenseModal } from './modals/LicenseModal';
import { DesignerProfileModal } from './modals/DesignerProfileModal';

export type ViewMode = 'blueprint' | 'split' | 'cutaway' | 'three' | 'reamer' | 'setback';

interface NavbarProps {
  cartridge: CartridgeSpec;
  currentPresetId?: string;
  allPresets?: Record<string, CartridgeSpec>;
  customCartridges?: Record<string, CartridgeSpec>;
  onSelectCartridge?: (spec: CartridgeSpec) => void;
  onDeleteCustomCartridge?: (id: string) => void;
  onOpenSaveModal: () => void;
  onOpenCartridgeModal: () => void;
  onOpenWildcatWizard: () => void;
  onOpenCompareModal: () => void;
  onOpenPrintSheet: () => void;
  onRotateCanvas?: () => void;
  canvasRotation?: number;
  ghostCartridge?: CartridgeSpec | null;
  onClearGhost?: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  drawingMode?: DrawingMode;
  onChangeDrawingMode?: (mode: DrawingMode) => void;
  showChamber?: boolean;
  onToggleChamber?: () => void;
  showDimensions?: boolean;
  onToggleDimensions?: () => void;
  showBullet?: boolean;
  onToggleBullet?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  isMetric: boolean;
  onToggleUnits: () => void;
  isOneToOne: boolean;
  onToggleOneToOne: () => void;
  onExportWildcat?: () => void;
  onExportLoadBench?: () => void;
  onExportRangeStudio?: () => void;
  onExportQuickload: () => void;
  onExportDxf: () => void;
  onExportStl: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenHeadspaceModal?: () => void;
  onOpenTwistModal?: () => void;
  onOpenFormingModal?: () => void;
  onOpenUpdateModal?: () => void;
  updateAvailable?: boolean;
  updateVersion?: string;
  onExportQuickLoadQdf?: () => void;
  onOpenCalibration?: () => void;
  toleranceMode?: ToleranceDisplayMode;
  onChangeToleranceMode?: (mode: ToleranceDisplayMode) => void;
  onOpenUserGuide?: () => void;
}

type MenuType = 'file' | 'edit' | 'view' | 'tools' | 'settings' | null;

export const Navbar: React.FC<NavbarProps> = ({
  cartridge,
  customCartridges = {},
  onOpenCartridgeModal,
  onOpenSaveModal,
  onDeleteCustomCartridge,
  onOpenWildcatWizard,
  onOpenCompareModal,
  onOpenPrintSheet,
  onRotateCanvas,
  canvasRotation = 0,
  ghostCartridge = null,
  onClearGhost,
  viewMode,
  onChangeViewMode,
  drawingMode = 'outline',
  onChangeDrawingMode,
  showChamber = false,
  onToggleChamber,
  showDimensions = true,
  onToggleDimensions,
  showBullet = true,
  onToggleBullet,
  showGrid = true,
  onToggleGrid,
  isMetric,
  onToggleUnits,
  isOneToOne,
  onToggleOneToOne,
  onExportWildcat,
  onExportLoadBench,
  onExportRangeStudio,
  onExportQuickload,
  onExportDxf,
  onExportStl,
  onReset,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isSidebarOpen = true,
  onToggleSidebar,
  onOpenHeadspaceModal,
  onOpenTwistModal,
  onOpenFormingModal,
  onOpenUpdateModal,
  updateAvailable = false,
  updateVersion,
  onExportQuickLoadQdf,
  onOpenCalibration,
  toleranceMode,
  onChangeToleranceMode,
  onOpenUserGuide,
}) => {
  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState<boolean>(false);
  const [isDesignerModalOpen, setIsDesignerModalOpen] = useState<boolean>(false);
  const [checkUpdatesStartup, setCheckUpdatesStartup] = useState<boolean>(() => {
    return localStorage.getItem('wildcat_check_updates_startup') !== 'false';
  });
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
        setIsAboutOpen(false);
        setIsLicenseOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMenuClick = (menu: MenuType) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMenuHover = (menu: MenuType) => {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  };

  const closeMenu = () => {
    setActiveMenu(null);
  };

  return (
    <header style={{
      height: '52px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 14px',
      gap: '12px',
      zIndex: 50,
      userSelect: 'none'
    }}>
      {/* LEFT: Brand & Desktop CAD Menus */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} ref={menuBarRef}>
        {/* Brand Name */}
        <span style={{
          fontWeight: 800,
          fontSize: '15px',
          letterSpacing: '-0.4px',
          color: '#fff',
          whiteSpace: 'nowrap',
          paddingRight: '6px'
        }}>
          Wildcat Studio
        </span>

        {/* Desktop Menu Bar: File | Edit | View | Settings */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
          {/* --- FILE MENU --- */}
          <div style={{ position: 'relative' }}>
            <button
              id="menu-btn-file"
              onClick={() => handleMenuClick('file')}
              onMouseEnter={() => handleMenuHover('file')}
              style={{
                background: activeMenu === 'file' ? 'var(--bg-tertiary)' : 'transparent',
                color: activeMenu === 'file' ? 'var(--cad-cyan)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 9px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.12s'
              }}
            >
              File
              <ChevronDown size={11} opacity={0.6} />
            </button>

            {activeMenu === 'file' && (
              <div style={dropdownContainerStyle}>
                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenCartridgeModal(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderOpen size={14} color="var(--cad-cyan)" />
                    <span>Open Cartridge Database...</span>
                  </div>
                  <kbd style={shortcutBadgeStyle}>⌘O</kbd>
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenSaveModal(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookmarkPlus size={14} color="var(--cad-cyan)" />
                    <span>Save as New Wildcat...</span>
                  </div>
                  <kbd style={shortcutBadgeStyle}>⌘S</kbd>
                </div>

                <div 
                  id="menu-item-wildcat-wizard"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenWildcatWizard(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wand2 size={14} color="var(--cad-copper)" />
                    <span>Parent Case Wildcatting Wizard...</span>
                  </div>
                  <kbd style={shortcutBadgeStyle}>⌘W</kbd>
                </div>

                {customCartridges[cartridge.id] && onDeleteCustomCartridge && (
                  <div 
                    style={{ ...dropdownItemStyle, color: '#f85149' }}
                    onClick={() => { closeMenu(); onDeleteCustomCartridge(cartridge.id); }}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Trash2 size={14} color="#f85149" />
                      <span>Delete Custom Wildcat</span>
                    </div>
                  </div>
                )}

                <div style={dividerStyle} />

                <div 
                  id="menu-item-export-wildcat"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onExportWildcat?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Share2 size={14} color="var(--cad-copper)" />
                    <span>Export Wildcat Studio Spec (.wildcat / .wcs)</span>
                  </div>
                </div>

                <div 
                  id="menu-item-export-loadbench"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onExportLoadBench?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="#3fb950" />
                    <span>Export LoadBench Project Recipe (.loadbench)</span>
                  </div>
                </div>

                <div 
                  id="menu-item-export-rangestudio"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onExportRangeStudio?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="#38bdf8" />
                    <span>Export RangeStudio Ballistics Profile (.rsb)</span>
                  </div>
                </div>

                <div 
                  id="menu-item-export-universal-qdf"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onExportQuickLoadQdf?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="var(--cad-cyan)" />
                    <span>Export Universal Cartridge Data (.qdf / .dat)</span>
                  </div>
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onExportQuickload(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="var(--text-secondary)" />
                    <span>Export Volumetric Capacity (.vol)</span>
                  </div>
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onExportDxf(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download size={14} color="var(--cad-cyan)" />
                    <span>Export AutoCAD Vector (.dxf)</span>
                  </div>
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onExportStl(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Share2 size={14} color="var(--cad-copper)" />
                    <span>Export 3D Printable Mesh (.stl)</span>
                  </div>
                </div>

                <div 
                  id="menu-item-print-sheet"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenPrintSheet(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Printer size={14} color="var(--cad-cyan)" />
                    <span>Print Engineering Drawing Sheet...</span>
                  </div>
                  <kbd style={shortcutBadgeStyle}>⌘P</kbd>
                </div>

                <div style={dividerStyle} />

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onReset(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={14} color="var(--text-muted)" />
                    <span>Reset to Factory Dimensions</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- EDIT MENU --- */}
          <div style={{ position: 'relative' }}>
            <button
              id="menu-btn-edit"
              onClick={() => handleMenuClick('edit')}
              onMouseEnter={() => handleMenuHover('edit')}
              style={{
                background: activeMenu === 'edit' ? 'var(--bg-tertiary)' : 'transparent',
                color: activeMenu === 'edit' ? 'var(--cad-cyan)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 9px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.12s'
              }}
            >
              Edit
              <ChevronDown size={11} opacity={0.6} />
            </button>

            {activeMenu === 'edit' && (
              <div style={dropdownContainerStyle}>
                <div 
                  style={{
                    ...dropdownItemStyle,
                    opacity: canUndo ? 1 : 0.4,
                    cursor: canUndo ? 'pointer' : 'not-allowed'
                  }}
                  onClick={() => { if (canUndo) { closeMenu(); onUndo(); } }}
                  onMouseEnter={canUndo ? handleItemHover : undefined}
                  onMouseLeave={canUndo ? handleItemLeave : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Undo2 size={14} color={canUndo ? "var(--cad-cyan)" : "var(--text-muted)"} />
                    <span>Undo Measurement Change</span>
                  </div>
                  <kbd style={shortcutBadgeStyle}>⌘Z</kbd>
                </div>

                <div 
                  style={{
                    ...dropdownItemStyle,
                    opacity: canRedo ? 1 : 0.4,
                    cursor: canRedo ? 'pointer' : 'not-allowed'
                  }}
                  onClick={() => { if (canRedo) { closeMenu(); onRedo(); } }}
                  onMouseEnter={canRedo ? handleItemHover : undefined}
                  onMouseLeave={canRedo ? handleItemLeave : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Redo2 size={14} color={canRedo ? "var(--cad-cyan)" : "var(--text-muted)"} />
                    <span>Redo Measurement Change</span>
                  </div>
                  <kbd style={shortcutBadgeStyle}>⌘⇧Z</kbd>
                </div>

                <div style={dividerStyle} />

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onReset(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={14} color="var(--text-muted)" />
                    <span>Revert to Factory Specifications</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- VIEW MENU --- */}
          <div style={{ position: 'relative' }}>
            <button
              id="menu-btn-view"
              onClick={() => handleMenuClick('view')}
              onMouseEnter={() => handleMenuHover('view')}
              style={{
                background: activeMenu === 'view' ? 'var(--bg-tertiary)' : 'transparent',
                color: activeMenu === 'view' ? 'var(--cad-cyan)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 9px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.12s'
              }}
            >
              View
              <ChevronDown size={11} opacity={0.6} />
            </button>

            {activeMenu === 'view' && (
              <div style={dropdownContainerStyle}>
                {/* --- Layout Section --- */}
                <div style={{ padding: '4px 10px 2px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Viewport Layout
                </div>
                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onChangeViewMode('blueprint'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Compass size={14} color="var(--cad-cyan)" />
                    <span>2D Vector Blueprint</span>
                  </div>
                  {viewMode === 'blueprint' && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div 
                  id="menu-item-view-split"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onChangeViewMode('split'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Columns size={14} color="var(--cad-cyan)" />
                    <span>Split Viewport (2D + 3D)</span>
                  </div>
                  {viewMode === 'split' && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onChangeViewMode('three'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={14} color="var(--cad-cyan)" />
                    <span>3D Solid Lathe Modeler</span>
                  </div>
                  {viewMode === 'three' && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onChangeViewMode('reamer'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Maximize2 size={14} color="var(--cad-cyan)" />
                    <span>Chamber Reamer Blueprint</span>
                  </div>
                  {viewMode === 'reamer' && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onChangeViewMode('setback'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Scale size={14} color="var(--cad-cyan)" />
                    <span>Chamber Set-Back Analyzer</span>
                  </div>
                  {viewMode === 'setback' && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div style={dividerStyle} />

                {/* --- Cartridge Drawing Formats --- */}
                <div style={{ padding: '4px 10px 2px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cartridge Drawing Formats
                </div>

                {[
                  { id: 'outline', label: 'Outline (SAAMI/CIP Silhouette)', icon: Box },
                  { id: 'wireframe', label: 'Wireframe (CAD Hidden Lines)', icon: Grid },
                  { id: 'cutaway', label: 'Full Cutaway (Powder Column)', icon: SplitSquareVertical },
                  { id: 'half_section', label: 'Half-Section (Top Cut / Bottom Solid)', icon: Disc },
                  { id: 'chamber_fit', label: 'Chamber Fit & Clearance', icon: Shield },
                ].map((item) => {
                  const Icon = item.icon;
                  const isCur = drawingMode === item.id;
                  return (
                    <div
                      key={item.id}
                      style={dropdownItemStyle}
                      onClick={() => {
                        closeMenu();
                        if (onChangeDrawingMode) onChangeDrawingMode(item.id as DrawingMode);
                        if (viewMode !== 'blueprint' && viewMode !== 'split') {
                          onChangeViewMode('blueprint');
                        }
                      }}
                      onMouseEnter={handleItemHover}
                      onMouseLeave={handleItemLeave}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={14} color={isCur ? "var(--cad-cyan)" : "var(--text-muted)"} />
                        <span>{item.label}</span>
                      </div>
                      {isCur && <Check size={14} color="var(--cad-cyan)" />}
                    </div>
                  );
                })}

                <div style={dividerStyle} />

                {/* --- QuickDESIGN View Layers --- */}
                <div style={{ padding: '4px 10px 2px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  View Layers
                </div>

                <div
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onToggleChamber?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={14} color={showChamber ? "#eab308" : "var(--text-muted)"} />
                    <span>Chamber Profile Display</span>
                  </div>
                  {showChamber && <Check size={14} color="#eab308" />}
                </div>

                <div
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onToggleDimensions?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Compass size={14} color={showDimensions ? "var(--cad-cyan)" : "var(--text-muted)"} />
                    <span>Dimension Callouts</span>
                  </div>
                  {showDimensions && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onToggleBullet?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {showBullet ? <Eye size={14} color="var(--cad-copper)" /> : <EyeOff size={14} color="var(--text-muted)" />}
                    <span>Seated Bullet (Loaded vs Brass)</span>
                  </div>
                  {showBullet && <Check size={14} color="var(--cad-copper)" />}
                </div>

                <div
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onToggleGrid?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Grid size={14} color={showGrid ? "#e2e8f0" : "var(--text-muted)"} />
                    <span>CAD Coordinate Grid</span>
                  </div>
                  {showGrid && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div style={dividerStyle} />

                {onToggleSidebar && (
                  <div 
                    id="menu-item-toggle-sidebar"
                    style={dropdownItemStyle}
                    onClick={() => { closeMenu(); onToggleSidebar(); }}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sliders size={14} color="var(--cad-cyan)" />
                      <span>Parameters Sidebar</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isSidebarOpen && <Check size={14} color="var(--cad-cyan)" />}
                      <kbd style={shortcutBadgeStyle}>⌘B</kbd>
                    </div>
                  </div>
                )}

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onToggleOneToOne(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Maximize2 size={14} color={isOneToOne ? "var(--cad-cyan)" : "var(--text-muted)"} />
                    <span>1:1 True Physical Scale Mode</span>
                  </div>
                  {isOneToOne && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                {onOpenCalibration && (
                  <div 
                    id="menu-item-calibrate-display"
                    style={dropdownItemStyle}
                    onClick={() => { closeMenu(); onOpenCalibration(); }}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Crosshair size={14} color="var(--cad-cyan)" />
                      <span>Calibrate Display (PPI Wizard)...</span>
                    </div>
                  </div>
                )}

                <div style={dividerStyle} />

                {onChangeToleranceMode && (
                  <div 
                    id="menu-item-dual-tolerance"
                    style={dropdownItemStyle}
                    onClick={() => {
                      closeMenu();
                      onChangeToleranceMode(toleranceMode === 'dual_envelope' ? 'nominal' : 'dual_envelope');
                    }}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={14} color={toleranceMode === 'dual_envelope' ? "var(--cad-cyan)" : "var(--text-muted)"} />
                      <span>Dual Tolerance Envelope (MMC + LMC)</span>
                    </div>
                    {toleranceMode === 'dual_envelope' && <Check size={14} color="var(--cad-cyan)" />}
                  </div>
                )}

                <div style={dividerStyle} />

                <div 
                  id="menu-item-compare-cartridge"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenCompareModal(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={14} color="#f97316" />
                    <span>Compare Cartridge (Ghost Overlay)...</span>
                  </div>
                  {ghostCartridge && <Check size={14} color="#f97316" />}
                </div>

                {ghostCartridge && onClearGhost && (
                  <div 
                    id="menu-item-clear-ghost"
                    style={{ ...dropdownItemStyle, color: 'var(--text-muted)' }}
                    onClick={() => { closeMenu(); onClearGhost(); }}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <X size={14} color="var(--text-muted)" />
                      <span>Clear Ghost Overlay</span>
                    </div>
                  </div>
                )}

                {onRotateCanvas && (
                  <div 
                    id="menu-item-rotate-cartridge"
                    style={dropdownItemStyle}
                    onClick={() => { closeMenu(); onRotateCanvas(); }}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RotateCw size={14} color="var(--cad-cyan)" />
                      <span>Rotate Cartridge 90° Clockwise {canvasRotation ? `(${canvasRotation}°)` : ''}</span>
                    </div>
                    <kbd style={shortcutBadgeStyle}>R</kbd>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- TOOLS MENU (Wildcat Engineering Suite) --- */}
          <div style={{ position: 'relative' }}>
            <button
              id="menu-btn-tools"
              onClick={() => handleMenuClick('tools')}
              onMouseEnter={() => handleMenuHover('tools')}
              style={{
                background: activeMenu === 'tools' ? 'var(--bg-tertiary)' : 'transparent',
                color: activeMenu === 'tools' ? 'var(--cad-cyan)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 9px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.12s'
              }}
            >
              Tools
              <ChevronDown size={11} opacity={0.6} />
            </button>

            {activeMenu === 'tools' && (
              <div style={dropdownContainerStyle}>
                <div 
                  id="menu-item-headspace-gauges"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenHeadspaceModal?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Disc size={14} color="var(--cad-cyan)" />
                    <span>Headspace Gauges (GO / NO-GO / FIELD)...</span>
                  </div>
                </div>

                <div 
                  id="menu-item-twist-stability"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenTwistModal?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Compass size={14} color="var(--cad-copper)" />
                    <span>Miller Twist & Gyroscopic Stability...</span>
                  </div>
                </div>

                <div 
                  id="menu-item-reamer-order-sheet"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onChangeViewMode('reamer'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Maximize2 size={14} color="#34d399" />
                    <span>Chamber Reamer Order Sheet (JGS/PTG/Manson)...</span>
                  </div>
                </div>

                <div 
                  id="menu-item-case-forming"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenFormingModal?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wand2 size={14} color="#f59e0b" />
                    <span>Case Forming & Donut Diagnostic Solver...</span>
                  </div>
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenWildcatWizard(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wand2 size={14} color="var(--cad-copper)" />
                    <span>Wildcatting & Case Forming Engine...</span>
                  </div>
                  <kbd style={shortcutBadgeStyle}>⌘W</kbd>
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onChangeViewMode('setback'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Scale size={14} color="var(--cad-cyan)" />
                    <span>Chamber Set-Back Analyzer...</span>
                  </div>
                </div>

                <div style={dividerStyle} />

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onExportQuickLoadQdf?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="#3fb950" />
                    <span>Export QuickLOAD Native Interchange (.qdf / .dat)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- SETTINGS MENU --- */}
          <div style={{ position: 'relative' }}>
            <button
              id="menu-btn-settings"
              onClick={() => handleMenuClick('settings')}
              onMouseEnter={() => handleMenuHover('settings')}
              style={{
                background: activeMenu === 'settings' ? 'var(--bg-tertiary)' : 'transparent',
                color: activeMenu === 'settings' ? 'var(--cad-cyan)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 9px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.12s'
              }}
            >
              <Settings size={12} opacity={0.8} />
              Settings
              <ChevronDown size={11} opacity={0.6} />
            </button>

            {activeMenu === 'settings' && (
              <div style={dropdownContainerStyle}>
                <div style={{ padding: '6px 10px 4px 10px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Measurement Units
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { if (isMetric) onToggleUnits(); closeMenu(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Imperial Units (Inches, Grains, PSI)</span>
                  </div>
                  {!isMetric && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { if (!isMetric) onToggleUnits(); closeMenu(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Metric Units (Millimeters, Grams, Bar)</span>
                  </div>
                  {isMetric && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div style={dividerStyle} />

                <div 
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onToggleOneToOne(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Physical Monitor Calibration (110 DPI)</span>
                  </div>
                  {isOneToOne && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div style={dividerStyle} />

                <div 
                  id="menu-item-user-guide"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenUserGuide?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={14} color="var(--cad-cyan)" />
                    <span>User Guide & Technical Manual...</span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>F1</span>
                </div>

                <div 
                  id="menu-item-check-updates"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); onOpenUpdateModal?.(); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={14} color="var(--cad-cyan)" />
                    <span>Check for Updates...</span>
                  </div>
                  {updateAvailable && (
                    <span style={{ fontSize: '9px', fontWeight: 700, background: '#10b981', color: '#0a0d13', borderRadius: '3px', padding: '1px 5px' }}>
                      NEW
                    </span>
                  )}
                </div>

                <div 
                  id="menu-item-designer-profile"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); setIsDesignerModalOpen(true); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} color="var(--cad-cyan)" />
                    <span>Configure Designer & Shop Profile...</span>
                  </div>
                </div>

                <div 
                  id="menu-item-toggle-update-check"
                  style={dropdownItemStyle}
                  onClick={() => {
                    const next = !checkUpdatesStartup;
                    setCheckUpdatesStartup(next);
                    localStorage.setItem('wildcat_check_updates_startup', String(next));
                  }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Check Updates on Startup</span>
                  </div>
                  {checkUpdatesStartup && <Check size={14} color="var(--cad-cyan)" />}
                </div>

                <div style={dividerStyle} />

                <div 
                  id="menu-item-about-wildcat"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); setIsAboutOpen(true); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={14} color="var(--cad-cyan)" />
                    <span>About Wildcat Studio...</span>
                  </div>
                </div>

                <div 
                  id="menu-item-license-legal"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); setIsLicenseOpen(true); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="var(--cad-cyan)" />
                    <span>Software License & Legal Terms...</span>
                  </div>
                </div>

                <div style={dividerStyle} />

                <div style={{ padding: '6px 10px 4px 10px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ArmoryVault Ecosystem
                </div>

                <div 
                  id="menu-item-armstrader"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); openExternalLink('https://armstrader.store'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={14} color="var(--cad-cyan)" />
                    <span>ArmsTrader (armstrader.store)</span>
                  </div>
                  <ExternalLink size={12} opacity={0.6} />
                </div>

                <div 
                  id="menu-item-loadbench-suite"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); openExternalLink('https://armstrader.store/loadbench'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Disc size={14} color="#3fb950" />
                    <span>LoadBench Ballistics Suite</span>
                  </div>
                  <ExternalLink size={12} opacity={0.6} />
                </div>

                <div 
                  id="menu-item-rangestudio-suite"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); openExternalLink('https://armstrader.store/rangestudio'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Crosshair size={14} color="#38bdf8" />
                    <span>RangeStudio Telemetry Suite</span>
                  </div>
                  <ExternalLink size={12} opacity={0.6} />
                </div>

                <div 
                  id="menu-item-armoryvault"
                  style={dropdownItemStyle}
                  onClick={() => { closeMenu(); openExternalLink('https://armstrader.store/armoryvault'); }}
                  onMouseEnter={handleItemHover}
                  onMouseLeave={handleItemLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={14} color="var(--cad-cyan)" />
                    <span>ArmoryVault Platform</span>
                  </div>
                  <ExternalLink size={12} opacity={0.6} />
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* CENTER: Active Cartridge Quick-Launch Badge */}
      <button
        id="btn-active-cartridge-badge"
        onClick={onOpenCartridgeModal}
        title="Open Cartridge Database & Specification (⌘O / Ctrl+O)"
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '4px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-primary)',
          transition: 'all 0.15s',
          outline: 'none',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--cad-cyan)';
          e.currentTarget.style.background = '#141e2e';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.background = 'var(--bg-tertiary)';
        }}
      >
        <FolderOpen size={13} color="var(--cad-cyan)" />
        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#fff',
          maxWidth: '240px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {customCartridges[cartridge.id] && <Sparkles size={11} style={{ color: 'var(--cad-copper)' }} />}
          <span>{cartridge.name}</span>
        </span>
        <span style={{
          fontSize: '9px',
          fontFamily: 'var(--font-mono)',
          padding: '1px 5px',
          borderRadius: '3px',
          background: cartridge.standard === 'Wildcat' ? 'rgba(240, 136, 62, 0.2)' : 'rgba(0, 210, 255, 0.2)',
          color: cartridge.standard === 'Wildcat' ? 'var(--cad-copper)' : 'var(--cad-cyan)',
          fontWeight: 700
        }}>
          {cartridge.standard}
        </span>
        <span style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginLeft: '4px',
          fontFamily: 'var(--font-mono)'
        }}>
          ⌘O
        </span>
      </button>

      {/* RIGHT: View Mode Segmented Switcher & Units Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-primary)',
          borderRadius: '6px',
          padding: '2px',
          border: '1px solid var(--border-color)',
          gap: '2px'
        }}>
          <button
            id="btn-nav-blueprint"
            onClick={() => onChangeViewMode('blueprint')}
            title="2D Vector Blueprint with SAAMI/CIP Dimension Lines"
            style={{
              background: viewMode === 'blueprint' ? 'var(--cad-cyan)' : 'transparent',
              color: viewMode === 'blueprint' ? '#0a0d13' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 0.12s'
            }}
          >
            <Compass size={13} />
            <span>2D Blueprint</span>
          </button>

          <button
            id="btn-nav-split"
            onClick={() => onChangeViewMode('split')}
            title="Split Viewport (2D Vector on Left + 3D Solid Lathe on Right)"
            style={{
              background: viewMode === 'split' ? 'var(--cad-cyan)' : 'transparent',
              color: viewMode === 'split' ? '#0a0d13' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 0.12s'
            }}
          >
            <Columns size={13} />
            <span>Split (2D+3D)</span>
          </button>

          <button
            id="btn-nav-three"
            onClick={() => onChangeViewMode('three')}
            title="3D Solid Lathe Modeler (WebGL & STL 3D Print Export)"
            style={{
              background: viewMode === 'three' ? 'var(--cad-cyan)' : 'transparent',
              color: viewMode === 'three' ? '#0a0d13' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 0.12s'
            }}
          >
            <Box size={13} />
            <span>3D Lathe</span>
          </button>
        </div>

        {/* Units Toggle Badge */}
        <button
          onClick={onToggleUnits}
          title={`Currently using ${isMetric ? 'Metric (mm)' : 'Imperial (inches)'}. Click to switch.`}
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--cad-cyan)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.12s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--cad-cyan)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          {isMetric ? 'MM' : 'IN'}
        </button>

        {/* Update Available Glowing Badge */}
        {updateAvailable && (
          <button
            id="btn-navbar-update-available"
            onClick={onOpenUpdateModal}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(0, 210, 255, 0.25))',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.12s',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
            }}
            title="A software update is available. Click to review release notes and install."
          >
            <Sparkles size={11} color="#34d399" />
            <span>Update {updateVersion || 'Available'}</span>
          </button>
        )}
      </div>

      {/* EXTRACTED ABOUT MODAL */}
      <AboutModal 
        isOpen={isAboutOpen} 
        onClose={() => setIsAboutOpen(false)} 
        onOpenLicense={() => {
          setIsAboutOpen(false);
          setIsLicenseOpen(true);
        }}
      />

      {/* EXTRACTED LICENSE & LEGAL TERMS MODAL */}
      <LicenseModal 
        isOpen={isLicenseOpen} 
        onClose={() => setIsLicenseOpen(false)} 
      />

      {/* DESIGNER & SHOP PROFILE MODAL */}
      <DesignerProfileModal isOpen={isDesignerModalOpen} onClose={() => setIsDesignerModalOpen(false)} />
    </header>
  );
};

// Styling helper objects
const dropdownContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  minWidth: '270px',
  background: 'rgba(15, 23, 42, 0.97)',
  WebkitBackdropFilter: 'blur(16px)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(0, 210, 255, 0.25)',
  borderRadius: '6px',
  padding: '6px',
  zIndex: 100,
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.75), 0 0 15px rgba(0, 210, 255, 0.1)',
  animation: 'fadeIn 0.12s ease-out'
};

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '7px 10px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'background 0.1s, color 0.1s'
};

const shortcutBadgeStyle: React.CSSProperties = {
  fontSize: '10.5px',
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-muted)',
  background: 'rgba(255, 255, 255, 0.06)',
  padding: '1px 5px',
  borderRadius: '3px',
  border: '1px solid rgba(255, 255, 255, 0.08)'
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: 'var(--border-color)',
  margin: '5px 4px'
};

const handleItemHover = (e: React.MouseEvent<HTMLDivElement>) => {
  e.currentTarget.style.background = 'rgba(0, 210, 255, 0.14)';
  e.currentTarget.style.color = '#fff';
};

const handleItemLeave = (e: React.MouseEvent<HTMLDivElement>) => {
  e.currentTarget.style.background = 'transparent';
  e.currentTarget.style.color = 'var(--text-primary)';
};
