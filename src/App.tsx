import { useState, useMemo, useEffect } from 'react';
import { CartridgeSpec, CARTRIDGE_PRESETS, VolumetricResult, DraftingStandard, ToleranceDisplayMode } from './types/cartridge';
import { 
  calculateVolumetricsFrontend, 
  exportQuickLoadQDF,
  exportWildcatSpec,
  exportLoadBenchRecipe
} from './utils/volumetrics';
import { loadCustomCartridges, saveCustomCartridge, deleteCustomCartridge } from './utils/customCartridges';
import { useHistory } from './utils/useHistory';
import { Navbar, ViewMode } from './components/Navbar';
import { VolumetricHUD } from './components/VolumetricHUD';
import { ParametricControls } from './components/ParametricControls';
import { BlueprintCanvas, DrawingMode } from './components/BlueprintCanvas';
import { ThreeViewport } from './components/ThreeViewport';
import { ReamerModal } from './components/ReamerModal';
import { SetbackModal } from './components/SetbackModal';
import { SaveCartridgeModal } from './components/SaveCartridgeModal';
import { OpenCartridgeModal } from './components/OpenCartridgeModal';
import { WildcatWizardModal } from './components/WildcatWizardModal';
import { CompareModal } from './components/CompareModal';
import { PrintableSheet } from './components/PrintableSheet';
import { HeadspaceModal } from './components/HeadspaceModal';
import { TwistStabilityModal } from './components/TwistStabilityModal';
import { ScreenCalibrationModal } from './components/ScreenCalibrationModal';
import { UserGuideModal } from './components/UserGuideModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function App() {
  const {
    state: cartridge,
    set: setCartridge,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<CartridgeSpec>(CARTRIDGE_PRESETS['308_win']);

  const [customCartridges, setCustomCartridges] = useState<Record<string, CartridgeSpec>>(() => {
    return loadCustomCartridges();
  });
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isOpenCartridgeModalOpen, setIsOpenCartridgeModalOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState<boolean>(false);
  const [isHeadspaceModalOpen, setIsHeadspaceModalOpen] = useState<boolean>(false);
  const [isTwistModalOpen, setIsTwistModalOpen] = useState<boolean>(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);
  const [draftingStandard, setDraftingStandard] = useState<DraftingStandard>('saami');
  const [toleranceMode, setToleranceMode] = useState<ToleranceDisplayMode>('nominal');
  const [ghostCartridge, setGhostCartridge] = useState<CartridgeSpec | null>(null);
  const [ghostAlign, setGhostAlign] = useState<'head' | 'mouth' | 'shoulder'>('head');
  const [canvasRotation, setCanvasRotation] = useState<number>(0);

  const allPresets = useMemo(() => {
    return { ...CARTRIDGE_PRESETS, ...customCartridges };
  }, [customCartridges]);

  const [viewMode, setViewMode] = useState<ViewMode>('blueprint');
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('outline');
  const [showChamber, setShowChamber] = useState<boolean>(false);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showBullet, setShowBullet] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isMetric, setIsMetric] = useState<boolean>(false);
  const [isOneToOne, setIsOneToOne] = useState<boolean>(false);
  const [ppi, setPpi] = useState<number>(() => {
    const saved = localStorage.getItem('wildcat_screen_ppi');
    return saved ? parseFloat(saved) : 110;
  });
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('wildcat_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('wildcat_sidebar_open', String(next));
      return next;
    });
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    localStorage.setItem('wildcat_sidebar_open', 'false');
  };

  // Global Keyboard Shortcuts: Cmd+B (Sidebar), Cmd+O (Open Cartridge), Cmd+S (Save), Cmd+W (Wildcat Wizard), Cmd+P (Print)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsOpenCartridgeModalOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsSaveModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setIsWizardOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintSheetOpen((prev) => !prev);
      }
      if (e.key === 'F1') {
        e.preventDefault();
        setIsUserGuideOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // High-speed real-time volumetric calculation
  const volumetrics: VolumetricResult = useMemo(() => {
    return calculateVolumetricsFrontend(cartridge);
  }, [cartridge]);

  const handleReset = () => {
    const base = allPresets[cartridge.id] || CARTRIDGE_PRESETS['308_win'];
    setCartridge({ ...base }, true);
  };

  const handleSaveCustom = (saved: CartridgeSpec) => {
    saveCustomCartridge(saved);
    setCustomCartridges(loadCustomCartridges());
    setCartridge({ ...saved }, true);
  };

  const handleApplyWildcat = (newCartridge: CartridgeSpec) => {
    setCartridge(newCartridge, false);
    setIsWizardOpen(false);
  };

  const handleSaveWildcatDirectly = (newCartridge: CartridgeSpec) => {
    handleSaveCustom(newCartridge);
    setIsWizardOpen(false);
  };

  const handleRotateCanvas = () => {
    setCanvasRotation((prev) => (prev + 90) % 360);
  };

  const handleClearGhost = () => {
    setGhostCartridge(null);
  };

  const handleDeleteCustom = (id: string) => {
    deleteCustomCartridge(id);
    const updated = loadCustomCartridges();
    setCustomCartridges(updated);
    if (cartridge.id === id) {
      setCartridge({ ...CARTRIDGE_PRESETS['308_win'] }, true);
    }
  };

  const handleExportWildcat = () => {
    const jsonText = exportWildcatSpec(cartridge);
    const blob = new Blob([jsonText], { type: 'application/vnd.wildcatstudio.cartridge+json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cartridge.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.wildcat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportLoadBench = () => {
    const jsonText = exportLoadBenchRecipe(cartridge);
    const blob = new Blob([jsonText], { type: 'application/vnd.loadbench.recipe+json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cartridge.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.loadbench`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportQuickload = () => {
    const volContent = `${cartridge.name}\n${volumetrics.overflow_capacity_grains_h2o.toFixed(2)}\n${cartridge.bullet_diameter.toFixed(4)}\n${cartridge.case_length.toFixed(4)}\n${cartridge.coal.toFixed(4)}`;
    const blob = new Blob([volContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cartridge.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.vol`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportQuickLoadQdf = () => {
    const qdfText = exportQuickLoadQDF(cartridge);
    const blob = new Blob([qdfText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cartridge.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.qdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // AutoCAD DXF Export
  const handleExportDxf = () => {
    let out = "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n";
    out += "0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n3\n";
    out += "0\nLAYER\n2\nCARTRIDGE\n70\n0\n62\n2\n6\nCONTINUOUS\n";
    out += "0\nLAYER\n2\nBULLET\n70\n0\n62\n1\n6\nCONTINUOUS\n";
    out += "0\nLAYER\n2\nCENTERLINE\n70\n0\n62\n8\n6\nCONTINUOUS\n";
    out += "0\nENDTAB\n0\nENDSEC\n";
    out += "0\nSECTION\n2\nENTITIES\n";

    // Centerline
    out += `0\nLINE\n8\nCENTERLINE\n10\n-0.1\n20\n0.0\n30\n0.0\n11\n${(cartridge.coal + 0.1).toFixed(4)}\n21\n0.0\n31\n0.0\n`;

    // Case Head & Mouth
    const rRim = cartridge.rim_diameter / 2;
    out += `0\nLINE\n8\nCARTRIDGE\n10\n0.0\n20\n${(-rRim).toFixed(4)}\n30\n0.0\n11\n0.0\n21\n${rRim.toFixed(4)}\n31\n0.0\n`;

    out += "0\nENDSEC\n0\nEOF\n";

    const blob = new Blob([out], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cartridge.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Trigger 3D Viewport STL download
  const handleExportStl = () => {
    setViewMode('three');
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      {/* Top Navbar */}
      <Navbar
        cartridge={cartridge}
        customCartridges={customCartridges}
        onOpenCartridgeModal={() => setIsOpenCartridgeModalOpen(true)}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
        onDeleteCustomCartridge={handleDeleteCustom}
        onOpenWildcatWizard={() => setIsWizardOpen(true)}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
        onOpenPrintSheet={() => setIsPrintSheetOpen(true)}
        onRotateCanvas={handleRotateCanvas}
        canvasRotation={canvasRotation}
        ghostCartridge={ghostCartridge}
        onClearGhost={handleClearGhost}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        drawingMode={drawingMode}
        onChangeDrawingMode={setDrawingMode}
        showChamber={showChamber}
        onToggleChamber={() => setShowChamber(!showChamber)}
        showDimensions={showDimensions}
        onToggleDimensions={() => setShowDimensions(!showDimensions)}
        showBullet={showBullet}
        onToggleBullet={() => setShowBullet(!showBullet)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        isMetric={isMetric}
        onToggleUnits={() => setIsMetric(!isMetric)}
        isOneToOne={isOneToOne}
        onToggleOneToOne={() => setIsOneToOne(!isOneToOne)}
        onExportWildcat={handleExportWildcat}
        onExportLoadBench={handleExportLoadBench}
        onExportQuickload={handleExportQuickload}
        onExportQuickLoadQdf={handleExportQuickLoadQdf}
        onExportDxf={handleExportDxf}
        onExportStl={handleExportStl}
        onReset={handleReset}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onOpenHeadspaceModal={() => setIsHeadspaceModalOpen(true)}
        onOpenTwistModal={() => setIsTwistModalOpen(true)}
        onOpenCalibration={() => setIsCalibrationModalOpen(true)}
        toleranceMode={toleranceMode}
        onChangeToleranceMode={setToleranceMode}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
      />

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left Parametric Controls Drawer */}
        <ParametricControls
          cartridge={cartridge}
          onChange={setCartridge}
          isMetric={isMetric}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />

        {/* Pop-Out Arrow Toggle Tab */}
        <button
          id="btn-sidebar-popout-arrow"
          onClick={toggleSidebar}
          title={isSidebarOpen ? "Hide Parameters Sidebar (⌘B / Ctrl+B)" : "Pop Out Parameters Sidebar (⌘B / Ctrl+B)"}
          style={{
            position: 'absolute',
            left: isSidebarOpen ? '340px' : '0px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 45,
            width: '18px',
            height: '64px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderLeft: isSidebarOpen ? 'none' : '1px solid var(--border-color)',
            borderRadius: '0 8px 8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--cad-cyan)',
            boxShadow: '3px 0 10px rgba(0, 0, 0, 0.4)',
            transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s, color 0.15s, border-color 0.15s',
            outline: 'none',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#162235';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'var(--cad-cyan)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 210, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--cad-cyan)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = '3px 0 10px rgba(0, 0, 0, 0.4)';
          }}
        >
          {isSidebarOpen ? (
            <ChevronLeft size={16} strokeWidth={2.5} />
          ) : (
            <ChevronRight size={16} strokeWidth={2.5} />
          )}
        </button>

        {/* Center Viewport */}
        <main style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
          {viewMode === 'blueprint' && (
            <BlueprintCanvas
              cartridge={cartridge}
              mode="blueprint"
              drawingMode={drawingMode}
              onDrawingModeChange={setDrawingMode}
              draftingStandard={draftingStandard}
              onDraftingStandardChange={setDraftingStandard}
              toleranceMode={toleranceMode}
              onToleranceModeChange={setToleranceMode}
              showChamber={showChamber}
              onToggleChamber={() => setShowChamber(!showChamber)}
              showDimensions={showDimensions}
              onToggleDimensions={() => setShowDimensions(!showDimensions)}
              showBullet={showBullet}
              onToggleBullet={() => setShowBullet(!showBullet)}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid(!showGrid)}
              isMetric={isMetric}
              isOneToOne={isOneToOne}
              ppi={ppi}
              onPpiChange={setPpi}
              onUpdateCartridge={setCartridge}
              rotation={canvasRotation}
              onRotationChange={setCanvasRotation}
              ghostCartridge={ghostCartridge}
              ghostAlign={ghostAlign}
              onChangeGhostAlign={setGhostAlign}
              onCloseGhost={handleClearGhost}
              onOpenCompare={() => setIsCompareModalOpen(true)}
              onOpenCalibration={() => setIsCalibrationModalOpen(true)}
            />
          )}

          {viewMode === 'split' && (
            <div style={{ display: 'flex', width: '100%', height: '100%' }}>
              <div style={{ flex: 1, height: '100%', borderRight: '1px solid var(--border-color)', position: 'relative' }}>
                <BlueprintCanvas
                  cartridge={cartridge}
                  mode="blueprint"
                  drawingMode={drawingMode}
                  onDrawingModeChange={setDrawingMode}
                  draftingStandard={draftingStandard}
                  onDraftingStandardChange={setDraftingStandard}
                  toleranceMode={toleranceMode}
                  onToleranceModeChange={setToleranceMode}
                  showChamber={showChamber}
                  onToggleChamber={() => setShowChamber(!showChamber)}
                  showDimensions={showDimensions}
                  onToggleDimensions={() => setShowDimensions(!showDimensions)}
                  showBullet={showBullet}
                  onToggleBullet={() => setShowBullet(!showBullet)}
                  showGrid={showGrid}
                  onToggleGrid={() => setShowGrid(!showGrid)}
                  isMetric={isMetric}
                  isOneToOne={isOneToOne}
                  ppi={ppi}
                  onPpiChange={setPpi}
                  onUpdateCartridge={setCartridge}
                  rotation={canvasRotation}
                  onRotationChange={setCanvasRotation}
                  ghostCartridge={ghostCartridge}
                  ghostAlign={ghostAlign}
                  onChangeGhostAlign={setGhostAlign}
                  onCloseGhost={handleClearGhost}
                  onOpenCompare={() => setIsCompareModalOpen(true)}
                  onOpenCalibration={() => setIsCalibrationModalOpen(true)}
                />
              </div>
              <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                <ThreeViewport
                  cartridge={cartridge}
                  rotation={canvasRotation}
                  onUpdateCartridge={setCartridge}
                  onSelectBullet={() => setIsSidebarOpen(true)}
                />
              </div>
            </div>
          )}

          {viewMode === 'cutaway' && (
            <BlueprintCanvas
              cartridge={cartridge}
              mode="cutaway"
              drawingMode="cutaway"
              onDrawingModeChange={setDrawingMode}
              draftingStandard={draftingStandard}
              onDraftingStandardChange={setDraftingStandard}
              toleranceMode={toleranceMode}
              onToleranceModeChange={setToleranceMode}
              showChamber={showChamber}
              onToggleChamber={() => setShowChamber(!showChamber)}
              showDimensions={showDimensions}
              onToggleDimensions={() => setShowDimensions(!showDimensions)}
              showBullet={showBullet}
              onToggleBullet={() => setShowBullet(!showBullet)}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid(!showGrid)}
              isMetric={isMetric}
              isOneToOne={isOneToOne}
              ppi={ppi}
              onPpiChange={setPpi}
              onUpdateCartridge={setCartridge}
              rotation={canvasRotation}
              onRotationChange={setCanvasRotation}
              ghostCartridge={ghostCartridge}
              ghostAlign={ghostAlign}
              onChangeGhostAlign={setGhostAlign}
              onCloseGhost={handleClearGhost}
              onOpenCompare={() => setIsCompareModalOpen(true)}
              onOpenCalibration={() => setIsCalibrationModalOpen(true)}
            />
          )}

          {viewMode === 'three' && (
            <ThreeViewport
              cartridge={cartridge}
              rotation={canvasRotation}
              onUpdateCartridge={setCartridge}
              onSelectBullet={() => setIsSidebarOpen(true)}
            />
          )}

          {viewMode === 'reamer' && (
            <ReamerModal
              cartridge={cartridge}
              isMetric={isMetric}
            />
          )}

          {viewMode === 'setback' && (
            <SetbackModal
              currentCartridge={cartridge}
              isMetric={isMetric}
              allPresets={allPresets}
              customCartridges={customCartridges}
            />
          )}
        </main>
      </div>

      {/* Bottom Live Volumetric Telemetry HUD */}
      <VolumetricHUD
        volumetrics={volumetrics}
        cartridge={cartridge}
      />

      {/* Save Custom Cartridge Modal */}
      <SaveCartridgeModal
        cartridge={cartridge}
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveCustom}
        isMetric={isMetric}
      />

      {/* Encyclopedic Cartridge Database Browser Modal */}
      <OpenCartridgeModal
        isOpen={isOpenCartridgeModalOpen}
        onClose={() => setIsOpenCartridgeModalOpen(false)}
        onSelectCartridge={(spec) => {
          setCartridge({ ...spec }, true);
          setIsOpenCartridgeModalOpen(false);
        }}
        currentCartridgeId={cartridge.id}
        allPresets={allPresets}
        customCartridges={customCartridges}
        onDeleteCustomCartridge={handleDeleteCustom}
        onImportCartridge={handleSaveCustom}
        isMetric={isMetric}
      />

      {/* Parent Case Wildcatting Wizard Modal */}
      <WildcatWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        activeCartridge={cartridge}
        customCartridges={customCartridges}
        onApplyWildcat={handleApplyWildcat}
        onSaveWildcatDirectly={handleSaveWildcatDirectly}
        isMetric={isMetric}
      />

      {/* Dual Cartridge Ghost Comparison Selector Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        activeCartridge={cartridge}
        customCartridges={customCartridges}
        onSelectCompareCartridge={(spec) => {
          setGhostCartridge(spec);
          setIsCompareModalOpen(false);
        }}
      />

      {/* Print-Ready Engineering Drawing Sheet Modal */}
      <PrintableSheet
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        cartridge={cartridge}
        isMetric={isMetric}
      />

      {/* Headspace Gauge Suite (GO/NO-GO/FIELD) */}
      <HeadspaceModal
        isOpen={isHeadspaceModalOpen}
        onClose={() => setIsHeadspaceModalOpen(false)}
        cartridge={cartridge}
        isMetric={isMetric}
      />

      {/* Miller Twist & Bullet Stability Calculator */}
      <TwistStabilityModal
        isOpen={isTwistModalOpen}
        onClose={() => setIsTwistModalOpen(false)}
        cartridge={cartridge}
        isMetric={isMetric}
      />

      {/* 1:1 True-Scale Physical Display Calibration Wizard */}
      <ScreenCalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
        ppi={ppi}
        onPpiChange={setPpi}
      />

      {/* Comprehensive User Guide & Technical Engineering Manual */}
      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
        onOpenCalibration={() => {
          setIsUserGuideOpen(false);
          setIsCalibrationModalOpen(true);
        }}
        onOpenWildcatWizard={() => {
          setIsUserGuideOpen(false);
          setIsWizardOpen(true);
        }}
        onOpenReamerModal={() => {
          setIsUserGuideOpen(false);
          setViewMode('reamer');
        }}
        onOpenCartridgeModal={() => {
          setIsUserGuideOpen(false);
          setIsOpenCartridgeModalOpen(true);
        }}
        onOpenPrintSheet={() => {
          setIsUserGuideOpen(false);
          setIsPrintSheetOpen(true);
        }}
      />
    </div>
  );
}

export default App;
