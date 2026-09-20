import { useState, useMemo, useEffect } from 'react';
import { CartridgeSpec, CARTRIDGE_PRESETS, VolumetricResult, DraftingStandard, ToleranceDisplayMode } from './types/cartridge';
import { 
  calculateVolumetricsFrontend, 
  exportQuickLoadQDF,
  exportWildcatSpec,
  exportLoadBenchRecipe,
  exportRangeStudioBallistics,
  parseWildcatSpec
} from './utils/volumetrics';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { loadCustomCartridges, saveCustomCartridge, deleteCustomCartridge } from './utils/customCartridges';
import { useHistory } from './utils/useHistory';
import { saveExportFile } from './utils/fileExport';
import { ToastProvider, useToast } from './components/common/Toast';
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
import { FormingModal } from './components/modals/FormingModal';
import { UpdateModal } from './components/modals/UpdateModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function AppContent() {
  const { showSuccess, showError } = useToast();
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
  const [isFormingModalOpen, setIsFormingModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [updateVersion, setUpdateVersion] = useState<string>('');
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

  // Handle cold-start and runtime file opens via macOS File Associations and Drag-Drop
  useEffect(() => {
    // 1. Check for pending file on startup (cold start via Finder or CLI)
    invoke<{ name: string; path: string; content: string } | null>('get_pending_open_file')
      .then((pending) => {
        if (pending && pending.content) {
          const parsed = parseWildcatSpec(pending.content);
          if (parsed) {
            setCartridge(parsed, true);
            showSuccess('Cartridge Opened', `Loaded ${parsed.name} from ${pending.name}`);
          }
        }
      })
      .catch(() => {
        // Not in Tauri or no pending file
      });

    // 2. Listen for live file-open events from Tauri event loop (runtime Finder "Open With" / double-click)
    let unlistenFn: (() => void) | null = null;
    listen<{ name: string; path: string; content: string }>('wildcat://open-file', (event) => {
      if (event.payload && event.payload.content) {
        const parsed = parseWildcatSpec(event.payload.content);
        if (parsed) {
          setCartridge(parsed, true);
          showSuccess('Cartridge Opened', `Loaded ${parsed.name} from ${event.payload.name}`);
        }
      }
    })
      .then((unlisten) => {
        unlistenFn = unlisten;
      })
      .catch(() => {});

    // 3. Window Drag-and-Drop Handler (drag .wildcat file onto CAD window)
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) {
          const parsed = parseWildcatSpec(text);
          if (parsed) {
            setCartridge(parsed, true);
            showSuccess('Cartridge Imported', `Loaded ${parsed.name} (${file.name})`);
          } else {
            showError('Import Error', `Could not parse ${file.name} as a valid cartridge specification.`);
          }
        }
      };
      reader.readAsText(file);
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      if (unlistenFn) unlistenFn();
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [setCartridge, showSuccess, showError]);

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

  const handleExportWildcat = async () => {
    const jsonText = exportWildcatSpec(cartridge);
    const res = await saveExportFile({
      defaultFileName: `${cartridge.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.wildcat`,
      filters: [{ name: 'Wildcat Cartridge Spec', extensions: ['wildcat', 'wcs', 'json'] }],
      content: jsonText,
      mimeType: 'application/vnd.wildcatstudio.cartridge+json;charset=utf-8',
      title: 'Export Wildcat Cartridge Specification'
    });
    if (res.success && res.path) {
      showSuccess('Wildcat Spec Exported', `Saved to ${res.path}`);
    } else if (res.error) {
      showError('Export Failed', res.error);
    }
  };

  const handleExportLoadBench = async () => {
    const jsonText = exportLoadBenchRecipe(cartridge);
    const res = await saveExportFile({
      defaultFileName: `${cartridge.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.loadbench`,
      filters: [{ name: 'LoadBench Project Recipe', extensions: ['loadbench', 'json'] }],
      content: jsonText,
      mimeType: 'application/vnd.loadbench.recipe+json;charset=utf-8',
      title: 'Export to LoadBench Project Recipe'
    });
    if (res.success && res.path) {
      showSuccess('LoadBench Recipe Exported', `Saved to ${res.path}`);
    } else if (res.error) {
      showError('Export Failed', res.error);
    }
  };

  const handleExportQuickload = async () => {
    const volContent = `${cartridge.name}\n${volumetrics.overflow_capacity_grains_h2o.toFixed(2)}\n${cartridge.bullet_diameter.toFixed(4)}\n${cartridge.case_length.toFixed(4)}\n${cartridge.coal.toFixed(4)}`;
    const res = await saveExportFile({
      defaultFileName: `${cartridge.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.vol`,
      filters: [{ name: 'QuickLOAD Volumetric Data', extensions: ['vol', 'txt'] }],
      content: volContent,
      mimeType: 'text/plain;charset=utf-8',
      title: 'Export QuickLOAD Volumetric Data'
    });
    if (res.success && res.path) {
      showSuccess('QuickLOAD Data Exported', `Saved to ${res.path}`);
    } else if (res.error) {
      showError('Export Failed', res.error);
    }
  };

  const handleExportQuickLoadQdf = async () => {
    const qdfText = exportQuickLoadQDF(cartridge);
    const res = await saveExportFile({
      defaultFileName: `${cartridge.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.qdf`,
      filters: [{ name: 'QuickLOAD QDF Data', extensions: ['qdf', 'dat', 'txt'] }],
      content: qdfText,
      mimeType: 'text/plain;charset=utf-8',
      title: 'Export QuickLOAD QDF File'
    });
    if (res.success && res.path) {
      showSuccess('QuickLOAD QDF Exported', `Saved to ${res.path}`);
    } else if (res.error) {
      showError('Export Failed', res.error);
    }
  };

  // RangeStudio Ballistics Profile Export
  const handleExportRangeStudio = async () => {
    const rsbJson = exportRangeStudioBallistics(cartridge);
    const res = await saveExportFile({
      defaultFileName: `${cartridge.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.rsb`,
      filters: [{ name: 'RangeStudio Ballistics Profile', extensions: ['rsb', 'json'] }],
      content: rsbJson,
      mimeType: 'application/vnd.rangestudio.ballistics+json;charset=utf-8',
      title: 'Export RangeStudio Ballistics Profile'
    });
    if (res.success && res.path) {
      showSuccess('RangeStudio Profile Exported', `Saved to ${res.path}`);
    } else if (res.error) {
      showError('Export Failed', res.error);
    }
  };

  // AutoCAD DXF Export
  const handleExportDxf = async () => {
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

    const res = await saveExportFile({
      defaultFileName: `${cartridge.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.dxf`,
      filters: [{ name: 'AutoCAD DXF Drawing', extensions: ['dxf'] }],
      content: out,
      mimeType: 'application/dxf',
      title: 'Export AutoCAD DXF Drawing'
    });
    if (res.success && res.path) {
      showSuccess('AutoCAD DXF Exported', `Saved to ${res.path}`);
    } else if (res.error) {
      showError('Export Failed', res.error);
    }
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
        onExportRangeStudio={handleExportRangeStudio}
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
        onOpenFormingModal={() => setIsFormingModalOpen(true)}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
        updateAvailable={isUpdateAvailable}
        updateVersion={updateVersion}
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
        onOpenHeadspaceModal={() => {
          setIsUserGuideOpen(false);
          setIsHeadspaceModalOpen(true);
        }}
        onOpenTwistModal={() => {
          setIsUserGuideOpen(false);
          setIsTwistModalOpen(true);
        }}
        onOpenFormingModal={() => {
          setIsUserGuideOpen(false);
          setIsFormingModalOpen(true);
        }}
      />

      {/* Case Forming, Fire-Forming & Donut Diagnostic Solver */}
      <FormingModal
        isOpen={isFormingModalOpen}
        onClose={() => setIsFormingModalOpen(false)}
        activeCartridge={cartridge}
        allPresets={allPresets}
        customCartridges={customCartridges}
        isMetric={isMetric}
      />

      {/* In-App Auto-Updater Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdateAvailableChange={(available, ver) => {
          setIsUpdateAvailable(available);
          if (ver) setUpdateVersion(ver);
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
