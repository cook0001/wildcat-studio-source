import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CartridgeSpec, CARTRIDGE_PRESETS, DraftingStandard, ToleranceDisplayMode } from '../types/cartridge';
import { 
  getOuterRadiusAt, 
  getInnerRadiusAt, 
  getChamberRadiusAt, 
  isStraightWall, 
  calculateVolumetrics, 
  calculateReamerSpecs,
  calculateDatumHeadspace,
  calculateCIPDeltaL
} from '../utils/volumetrics';
import { 
  CALIBER_PRESETS, 
  BULLET_OPTIONS, 
  BulletOption, 
  getBulletsForCaliber 
} from '../data/bullets';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Crosshair, 
  Check, 
  X, 
  Edit3, 
  Undo2, 
  ShieldOff, 
  Maximize2, 
  GripVertical, 
  RotateCw, 
  Layers,
  Eye,
  EyeOff,
  Grid,
  Shield,
  SplitSquareVertical,
  Compass,
  Box,
  Disc,
  Scale,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Droplet,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock
} from 'lucide-react';

export type DrawingMode = 'outline' | 'wireframe' | 'cutaway' | 'half_section' | 'chamber_fit';

interface BlueprintCanvasProps {
  cartridge: CartridgeSpec;
  mode?: 'blueprint' | 'cutaway';
  drawingMode?: DrawingMode;
  onDrawingModeChange?: (mode: DrawingMode) => void;
  draftingStandard?: DraftingStandard;
  onDraftingStandardChange?: (standard: DraftingStandard) => void;
  toleranceMode?: ToleranceDisplayMode;
  onToleranceModeChange?: (mode: ToleranceDisplayMode) => void;
  showChamber?: boolean;
  onToggleChamber?: () => void;
  showDimensions?: boolean;
  onToggleDimensions?: () => void;
  showBullet?: boolean;
  onToggleBullet?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  isMetric: boolean;
  isOneToOne: boolean;
  ppi: number;
  onPpiChange: (newPpi: number) => void;
  onUpdateCartridge?: (updated: CartridgeSpec) => void;
  rotation?: number;
  onRotationChange?: (newRotation: number) => void;
  ghostCartridge?: CartridgeSpec | null;
  ghostAlign?: 'head' | 'mouth' | 'shoulder';
  onCloseGhost?: () => void;
  onChangeGhostAlign?: (align: 'head' | 'mouth' | 'shoulder') => void;
  onOpenCompare?: () => void;
  onOpenCalibration?: () => void;
}

interface EditingDimState {
  key: keyof CartridgeSpec;
  label: string;
  symbol: string;
  initialValInches: number;
  displayVal: number;
  isAngle?: boolean;
  svgX: number;
  svgY: number;
  clientX?: number;
  clientY?: number;
  history: number[]; // Stack of values adjusted in this session for undo
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  cartridge,
  mode = 'blueprint',
  drawingMode: propDrawingMode,
  onDrawingModeChange,
  draftingStandard: propDraftingStandard,
  onDraftingStandardChange,
  toleranceMode: propToleranceMode,
  onToleranceModeChange,
  showChamber: propShowChamber,
  onToggleChamber,
  showDimensions: propShowDimensions,
  onToggleDimensions,
  showBullet: propShowBullet,
  onToggleBullet,
  showGrid: propShowGrid,
  onToggleGrid,
  isMetric,
  isOneToOne,
  ppi,
  onPpiChange,
  onUpdateCartridge,
  rotation: propRotation,
  onRotationChange,
  ghostCartridge = null,
  ghostAlign = 'head',
  onCloseGhost,
  onChangeGhostAlign,
  onOpenCompare,
  onOpenCalibration,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Rotational State (0°, 90°, 180°, 270°)
  const [internalRotation, setInternalRotation] = useState<number>(0);
  const rotation = propRotation !== undefined ? propRotation : internalRotation;

  const handleRotateClockwise = useCallback(() => {
    const nextRot = (rotation + 90) % 360;
    if (onRotationChange) {
      onRotationChange(nextRot);
    } else {
      setInternalRotation(nextRot);
    }
  }, [rotation, onRotationChange]);

  // CAD Drawing Mode & Visibility Layers State
  const [internalDrawingMode, setInternalDrawingMode] = useState<DrawingMode>(mode === 'cutaway' ? 'cutaway' : 'outline');
  const [internalShowChamber, setInternalShowChamber] = useState<boolean>(false);
  const [internalShowDimensions, setInternalShowDimensions] = useState<boolean>(true);
  const [internalShowBullet, setInternalShowBullet] = useState<boolean>(true);
  const [internalShowGrid, setInternalShowGrid] = useState<boolean>(true);

  // Synchronize with external mode changes
  useEffect(() => {
    if (propDrawingMode !== undefined) return;
    if (mode === 'cutaway') {
      setInternalDrawingMode('cutaway');
    } else if (mode === 'blueprint' && internalDrawingMode === 'cutaway') {
      setInternalDrawingMode('outline');
    }
  }, [mode, propDrawingMode]);

  const activeDrawingMode = propDrawingMode !== undefined ? propDrawingMode : internalDrawingMode;
  const activeShowChamber = propShowChamber !== undefined ? propShowChamber : internalShowChamber;
  const activeShowDimensions = propShowDimensions !== undefined ? propShowDimensions : internalShowDimensions;
  const activeShowBullet = propShowBullet !== undefined ? propShowBullet : internalShowBullet;
  const activeShowGrid = propShowGrid !== undefined ? propShowGrid : internalShowGrid;

  // Dual Standard Drafting (SAAMI vs C.I.P.) & Manufacturing Tolerance Mode
  const [internalStandard, setInternalStandard] = useState<DraftingStandard>('saami');
  const [internalTolerance, setInternalTolerance] = useState<ToleranceDisplayMode>('nominal');

  const activeStandard = propDraftingStandard !== undefined ? propDraftingStandard : internalStandard;
  const activeTolerance = propToleranceMode !== undefined ? propToleranceMode : internalTolerance;

  const handleSetStandard = (std: DraftingStandard) => {
    if (onDraftingStandardChange) {
      onDraftingStandardChange(std);
    } else {
      setInternalStandard(std);
    }
  };

  const handleSetTolerance = (mode: ToleranceDisplayMode) => {
    if (onToleranceModeChange) {
      onToleranceModeChange(mode);
    } else {
      setInternalTolerance(mode);
    }
  };

  // Toolbar collapse & dropdown state
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('wildcat_cad_toolbar_collapsed') === 'true';
  });
  const [activeDropdown, setActiveDropdown] = useState<'mode' | 'layers' | 'tolerance' | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const toggleToolbarCollapse = () => {
    setIsToolbarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('wildcat_cad_toolbar_collapsed', String(next));
      if (next) setActiveDropdown(null);
      return next;
    });
  };

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Dismissible measurement badge helper banner state
  const [isHelperDismissed, setIsHelperDismissed] = useState<boolean>(() => {
    return localStorage.getItem('wildcat_helper_dismissed') === 'true';
  });

  const MODE_ITEMS: { id: DrawingMode; label: string; icon: React.FC<any>; desc: string }[] = [
    { id: 'outline', label: 'Outline', icon: Box, desc: 'Exterior SAAMI/CIP Silhouette' },
    { id: 'wireframe', label: 'Wireframe', icon: Grid, desc: 'CAD Wireframe with Internal Lines' },
    { id: 'cutaway', label: 'Cutaway', icon: SplitSquareVertical, desc: 'Full Longitudinal Cross-Section' },
    { id: 'half_section', label: 'Half-Section', icon: Disc, desc: 'ISO Half-Section (Cutaway / Solid)' },
    { id: 'chamber_fit', label: 'Chamber Fit', icon: Shield, desc: 'Cartridge in Reamer Chamber' },
  ];

  const TOL_ITEMS: { id: ToleranceDisplayMode; label: string; short: string; desc: string }[] = [
    { id: 'nominal', label: 'Nominal Spec', short: 'Nom', desc: 'Nominal Blueprint Dimension Spec' },
    { id: 'cartridge_max', label: 'Max Cartridge (MMC)', short: 'Max Cart', desc: 'Maximum Material Condition Boundary' },
    { id: 'chamber_min', label: 'Min Chamber (LMC)', short: 'Min Cham', desc: 'Minimum Material Condition Reamer' },
    { id: 'clearance', label: 'Clearance Fit Band', short: 'Clearance', desc: 'Chamber Min - Cartridge Max Delta' },
    { id: 'dual_envelope', label: 'Dual Envelope (MMC + LMC)', short: 'Dual Envelope', desc: 'Simultaneous Max Cartridge & Min Chamber Tolerance Lines' },
  ];

  // Helper to format dimension badge with active tolerance and drafting standard
  const getBadgeText = (
    _key: keyof CartridgeSpec,
    nominalVal: number,
    cipSymbol: string,
    saamiSymbol: string,
    type: 'diameter' | 'length' | 'angle'
  ): string => {
    const sym = activeStandard === 'cip' ? cipSymbol : saamiSymbol;
    if (type === 'angle') {
      return `${sym}: ${nominalVal.toFixed(1)}°${activeTolerance === 'dual_envelope' ? ' (MMC/LMC)' : ''}`;
    }
    if (activeTolerance === 'nominal') {
      return `${sym}: ${fmt(nominalVal)}`;
    }
    if (activeTolerance === 'cartridge_max') {
      return `${sym} (MMC): ${fmt(nominalVal)}`;
    }
    if (activeTolerance === 'chamber_min') {
      const add = type === 'diameter' ? 0.0025 : 0.0050;
      return `${sym} (LMC): ${fmt(nominalVal + add)}`;
    }
    if (activeTolerance === 'dual_envelope') {
      const add = type === 'diameter' ? 0.0025 : 0.0050;
      return `${sym}: ${fmt(nominalVal)} / Cham ${fmt(nominalVal + add)} [Δ +${fmt(add, 4)}]`;
    }
    // Clearance Δ
    const clr = type === 'diameter' ? 0.0025 : 0.0050;
    return `${sym} (Δ): +${fmt(clr, 4)}`;
  };

  const handleSetDrawingMode = (newMode: DrawingMode) => {
    if (onDrawingModeChange) {
      onDrawingModeChange(newMode);
    } else {
      setInternalDrawingMode(newMode);
    }
  };

  const handleToggleChamber = () => {
    if (onToggleChamber) {
      onToggleChamber();
    } else {
      setInternalShowChamber((prev) => !prev);
    }
  };

  const handleToggleDimensions = () => {
    if (onToggleDimensions) {
      onToggleDimensions();
    } else {
      setInternalShowDimensions((prev) => !prev);
    }
  };

  const handleToggleBullet = () => {
    if (onToggleBullet) {
      onToggleBullet();
    } else {
      setInternalShowBullet((prev) => !prev);
    }
  };

  const handleToggleGrid = () => {
    if (onToggleGrid) {
      onToggleGrid();
    } else {
      setInternalShowGrid((prev) => !prev);
    }
  };

  // Interactive In-Diagram Editing State
  const [editingDim, setEditingDim] = useState<EditingDimState | null>(null);
  const [hoveredDim, setHoveredDim] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingPopover, setIsDraggingPopover] = useState<boolean>(false);
  const popoverDragRef = useRef<{ startMouseX: number; startMouseY: number; startPosX: number; startPosY: number } | null>(null);

  // Dragging handler for the floating measurement popover (viewport-clamped)
  const handlePopoverMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const popoverWidth = 350;
    const maxAvailableHeight = Math.max(300, window.innerHeight - 65);
    const popoverHeight = Math.min(480, maxAvailableHeight);
    const targetX = editingDim?.clientX ?? ((editingDim?.svgX ?? 0) + pan.x);
    const targetY = editingDim?.clientY ?? ((editingDim?.svgY ?? 0) + pan.y);
    const spawnY = targetY > window.innerHeight * 0.5 ? targetY - popoverHeight - 16 : targetY + 20;

    const defaultLeft = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, targetX - popoverWidth / 2));
    const defaultTop = Math.max(48, Math.min(window.innerHeight - popoverHeight - 12, spawnY));
    const currentX = popoverPos ? popoverPos.x : defaultLeft;
    const currentY = popoverPos ? popoverPos.y : defaultTop;

    popoverDragRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: currentX,
      startPosY: currentY,
    };
    setIsDraggingPopover(true);
  };

  useEffect(() => {
    if (!isDraggingPopover) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!popoverDragRef.current) return;
      const deltaX = e.clientX - popoverDragRef.current.startMouseX;
      const deltaY = e.clientY - popoverDragRef.current.startMouseY;

      const popoverWidth = 350;
      const maxAvailableHeight = Math.max(300, window.innerHeight - 65);
      const popoverHeight = Math.min(480, maxAvailableHeight);
      const newX = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, popoverDragRef.current.startPosX + deltaX));
      const newY = Math.max(45, Math.min(window.innerHeight - popoverHeight - 12, popoverDragRef.current.startPosY + deltaY));

      setPopoverPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingPopover(false);
      popoverDragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPopover]);

  // Global keydown listener when editingDim is active (Cmd+Z undo, Esc revert, Enter commit)
  useEffect(() => {
    if (!editingDim) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndoDimStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleRevertAndClose();
      } else if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault();
        handleCommitAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingDim]);

  // Floating Chamber Fit & Telemetry HUD State
  const [chamberHudPos, setChamberHudPos] = useState<{ x: number; y: number } | null>(null);
  const [isChamberHudCollapsed, setIsChamberHudCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('wildcat_chamber_hud_collapsed') === 'true';
  });
  const [isChamberHudDismissed, setIsChamberHudDismissed] = useState<boolean>(false);
  const [isDraggingChamberHud, setIsDraggingChamberHud] = useState<boolean>(false);
  const chamberHudDragRef = useRef<{ startMouseX: number; startMouseY: number; startPosX: number; startPosY: number } | null>(null);

  const handleChamberHudMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = (e.currentTarget as HTMLElement).closest('#chamber-fit-hud')?.getBoundingClientRect();
    const currentX = chamberHudPos ? chamberHudPos.x : (rect ? rect.left : window.innerWidth / 2 - 200);
    const currentY = chamberHudPos ? chamberHudPos.y : (rect ? rect.top : window.innerHeight - 120);

    chamberHudDragRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: currentX,
      startPosY: currentY,
    };
    setIsDraggingChamberHud(true);
  };

  useEffect(() => {
    if (!isDraggingChamberHud) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!chamberHudDragRef.current) return;
      const deltaX = e.clientX - chamberHudDragRef.current.startMouseX;
      const deltaY = e.clientY - chamberHudDragRef.current.startMouseY;

      const newX = Math.max(8, Math.min(window.innerWidth - 300, chamberHudDragRef.current.startPosX + deltaX));
      const newY = Math.max(8, Math.min(window.innerHeight - 60, chamberHudDragRef.current.startPosY + deltaY));

      setChamberHudPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingChamberHud(false);
      chamberHudDragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingChamberHud]);

  // Un-dismiss Chamber Fit HUD whenever user explicitly switches to chamber_fit mode
  useEffect(() => {
    if (activeDrawingMode === 'chamber_fit') {
      setIsChamberHudDismissed(false);
    }
  }, [activeDrawingMode]);

  // Coordinate scaling & anchors
  const originX = 140; // Base z=0 position on canvas
  const centerY = 280; // Centerline position on canvas
  const scale = isOneToOne ? ppi * zoom : 260 * zoom;

  const fmt = (valInches: number, precision = 3): string => {
    if (isMetric) {
      return (valInches * 25.4).toFixed(precision === 4 ? 3 : 2) + 'mm';
    }
    return valInches.toFixed(precision) + '"';
  };

  // Fit Cartridge to Viewport Extents (Auto-Frame)
  const handleFitToView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth <= 0 || clientHeight <= 0) return;

    // Available space accounting for UI paddings and overlays
    const availWidth = Math.max(200, clientWidth - 140);
    const availHeight = Math.max(200, clientHeight - 160);

    const totalLenInches = Math.max(cartridge.coal, cartridge.case_length + 0.6, ghostCartridge ? ghostCartridge.coal : 0, 0.8);
    const isSpecialOrdnance = cartridge.id === 'little_boy_ordnance';
    const maxDiaInches = Math.max(
      cartridge.rim_diameter * (isSpecialOrdnance ? 1.6 : 1.0),
      cartridge.base_diameter * (isSpecialOrdnance ? 1.6 : 1.0),
      cartridge.shoulder_start_diameter,
      cartridge.neck_diameter_mouth,
      cartridge.bullet_diameter,
      ghostCartridge ? ghostCartridge.rim_diameter : 0,
      0.3
    );

    // Full bounding box in pixels at zoom = 1.0 (260px/inch)
    const fullPixelWidth = totalLenInches * 260 + 120; // with left/right leader lines
    const fullPixelHeight = maxDiaInches * 260 + 180; // with top/bottom dimension labels

    // Account for vertical rotation (90° / 270°)
    const isVertical = rotation === 90 || rotation === 270;
    const effectiveWidth = isVertical ? fullPixelHeight : fullPixelWidth;
    const effectiveHeight = isVertical ? fullPixelWidth : fullPixelHeight;

    const zoomX = availWidth / effectiveWidth;
    const zoomY = availHeight / effectiveHeight;
    const optimalZoom = Math.min(zoomX, zoomY);

    // Clamp zoom between 0.02 (2%) and 1.6 (160%)
    const targetZoom = Math.max(0.02, Math.min(optimalZoom, 1.6));

    // Center the cartridge horizontally and vertically in viewport
    const scaledLen = totalLenInches * 260 * targetZoom;
    const modelCenterX = originX + scaledLen / 2;
    const targetPanX = clientWidth / 2 - modelCenterX;
    const targetPanY = clientHeight / 2 - centerY;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  }, [cartridge, ghostCartridge, rotation, originX, centerY]);

  // Automatically fit cartridge when selected or changed (unless 1:1 true scale mode is active)
  useEffect(() => {
    if (!isOneToOne) {
      handleFitToView();
    }
  }, [cartridge.id, isOneToOne, rotation, handleFitToView]);

  // Window resize, global 'F' (fit to screen) and 'R' (rotate 90°) listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;
      if (e.key === 'f' || e.key === 'F') {
        handleFitToView();
      }
      if (e.key === 'r' || e.key === 'R') {
        if (!e.metaKey && !e.ctrlKey) {
          handleRotateClockwise();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFitToView, handleRotateClockwise]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Smooth pointer-centered wheel zooming down to 2% (0.02) up to 800% (8.0)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const oldZoom = zoom;
    const newZoom = Math.min(8.0, Math.max(0.02, oldZoom * factor));

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomRatio = newZoom / oldZoom;
      const newPanX = mouseX - originX - (mouseX - pan.x - originX) * zoomRatio;
      const newPanY = mouseY - centerY - (mouseY - pan.y - centerY) * zoomRatio;
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      setZoom(newZoom);
    }
  };

  const handleZoomIn = () => {
    if (!containerRef.current) {
      setZoom((z) => Math.min(8.0, z * 1.25));
      return;
    }
    const { clientWidth, clientHeight } = containerRef.current;
    const centerScreenX = clientWidth / 2;
    const centerScreenY = clientHeight / 2;
    const oldZoom = zoom;
    const newZoom = Math.min(8.0, oldZoom * 1.25);
    const zoomRatio = newZoom / oldZoom;
    const newPanX = centerScreenX - originX - (centerScreenX - pan.x - originX) * zoomRatio;
    const newPanY = centerScreenY - centerY - (centerScreenY - pan.y - centerY) * zoomRatio;
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleZoomOut = () => {
    if (!containerRef.current) {
      setZoom((z) => Math.max(0.02, z / 1.25));
      return;
    }
    const { clientWidth, clientHeight } = containerRef.current;
    const centerScreenX = clientWidth / 2;
    const centerScreenY = clientHeight / 2;
    const oldZoom = zoom;
    const newZoom = Math.max(0.02, oldZoom / 1.25);
    const zoomRatio = newZoom / oldZoom;
    const newPanX = centerScreenX - originX - (centerScreenX - pan.x - originX) * zoomRatio;
    const newPanY = centerScreenY - centerY - (centerScreenY - pan.y - centerY) * zoomRatio;
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Outer profile path
  const steps = 100;
  const dz = cartridge.case_length / steps;
  let outerTopPath = `M ${originX} ${centerY}`;
  let outerBottomPath = `M ${originX} ${centerY}`;

  const rRim = getOuterRadiusAt(cartridge, 0) * scale;
  outerTopPath += ` L ${originX} ${centerY - rRim}`;
  outerBottomPath += ` L ${originX} ${centerY + rRim}`;

  for (let i = 0; i <= steps; i++) {
    const z = i * dz;
    const r = getOuterRadiusAt(cartridge, z) * scale;
    const px = originX + z * scale;
    outerTopPath += ` L ${px} ${centerY - r}`;
    outerBottomPath += ` L ${px} ${centerY + r}`;
  }

  // Mouth edge
  const zMouth = originX + cartridge.case_length * scale;
  const rMouth = getOuterRadiusAt(cartridge, cartridge.case_length) * scale;
  const rInnerMouth = (cartridge.neck_diameter_mouth / 2 - cartridge.neck_wall_thickness) * scale;

  // Inner cavity path for cutaway, half-section, and wireframe
  let innerTopPath = '';
  let innerBottomPath = '';
  const needsInnerPaths = activeDrawingMode === 'cutaway' || activeDrawingMode === 'half_section' || activeDrawingMode === 'wireframe';
  if (needsInnerPaths) {
    const zWeb = originX + cartridge.web_thickness * scale;
    const rWeb = getInnerRadiusAt(cartridge, cartridge.web_thickness) * scale;

    innerTopPath = `M ${zWeb} ${centerY - rWeb}`;
    innerBottomPath = `M ${zWeb} ${centerY + rWeb}`;

    for (let i = 0; i <= steps; i++) {
      const z = cartridge.web_thickness + (i / steps) * (cartridge.case_length - cartridge.web_thickness);
      const r = getInnerRadiusAt(cartridge, z) * scale;
      const px = originX + z * scale;
      innerTopPath += ` L ${px} ${centerY - r}`;
      innerBottomPath += ` L ${px} ${centerY + r}`;
    }
  }

  // Chamber reamer cut profile (for chamber_fit and chamber overlay)
  const reamer = calculateReamerSpecs(cartridge);
  const zChamberEnd = originX + (reamer.chamber_length + reamer.freebore_length + 0.12) * scale;
  const zChamberMouth = originX + reamer.chamber_length * scale;
  const zChamberFreeboreEnd = originX + (reamer.chamber_length + reamer.freebore_length) * scale;

  let chamberTopPath = '';
  let chamberBottomPath = '';
  const needsChamber = activeShowChamber || activeDrawingMode === 'chamber_fit' || activeTolerance === 'dual_envelope';
  if (needsChamber) {
    const chSteps = 80;
    const chMaxZ = reamer.chamber_length + reamer.freebore_length + 0.12;
    const chDz = chMaxZ / chSteps;
    chamberTopPath = `M ${originX} ${centerY - (reamer.chamber_rim_dia / 2) * scale}`;
    chamberBottomPath = `M ${originX} ${centerY + (reamer.chamber_rim_dia / 2) * scale}`;
    for (let i = 0; i <= chSteps; i++) {
      const z = i * chDz;
      const r = getChamberRadiusAt(cartridge, z) * scale;
      const px = originX + z * scale;
      chamberTopPath += ` L ${px} ${centerY - r}`;
      chamberBottomPath += ` L ${px} ${centerY + r}`;
    }
  }

  // Bullet profile
  const zBulletTip = originX + cartridge.coal * scale;
  const zBulletBase = originX + (cartridge.coal - cartridge.bullet_length) * scale;
  const rBullet = (cartridge.bullet_diameter / 2) * scale;

  // Key coordinate milestones in pixels
  const drShoulder = (cartridge.shoulder_start_diameter - (cartridge.neck_diameter_base || cartridge.neck_diameter_mouth)) / 2.0;
  const effectiveShoulderLen = (cartridge.shoulder_angle > 0.5 && drShoulder > 0.001)
    ? drShoulder / Math.tan((cartridge.shoulder_angle * Math.PI) / 180)
    : cartridge.shoulder_length;
  const pxRim = originX + cartridge.rim_thickness * scale;
  const pxExt = originX + (cartridge.rim_thickness + cartridge.extractor_width) * scale;
  const pxShoulderStart = originX + cartridge.body_length * scale;
  const pxShoulderEnd = originX + (cartridge.body_length + effectiveShoulderLen) * scale;
  const pxMouth = zMouth;
  const pxTip = zBulletTip;

  // Center coordinates for cartridge rotation
  const rotCenterX = originX + (pxTip - originX) / 2;

  // Trigger dimension editing (with rotation coordinate translation)
  const handleDimensionClick = (
    e: React.MouseEvent,
    key: keyof CartridgeSpec,
    label: string,
    symbol: string,
    svgX: number,
    svgY: number,
    isAngle = false
  ) => {
    e.stopPropagation();
    const currentInches = cartridge[key] as number;
    const initialDisplay = isAngle
      ? currentInches
      : isMetric
      ? +(currentInches * 25.4).toFixed(3)
      : +currentInches.toFixed(4);

    // Translate coordinate if cartridge is rotated
    const rad = (rotation * Math.PI) / 180;
    const dx = svgX - rotCenterX;
    const dy = svgY - centerY;
    const rotX = rotCenterX + dx * Math.cos(rad) - dy * Math.sin(rad);
    const rotY = centerY + dx * Math.sin(rad) + dy * Math.cos(rad);

    setPopoverPos(null);
    setEditingDim({
      key,
      label,
      symbol,
      initialValInches: currentInches,
      displayVal: initialDisplay,
      isAngle,
      svgX: rotX,
      svgY: rotY,
      clientX: e.clientX,
      clientY: e.clientY,
      history: [initialDisplay],
    });
  };

  // Ghost Cartridge Geometry (Comparison Overlay)
  let ghostOuterTopPath = '';
  let ghostOuterBottomPath = '';
  let ghostBulletPath = '';
  let ghostZHead = originX;
  let ghostZMouth = originX;
  let ghostZTip = originX;

  if (ghostCartridge) {
    if (ghostAlign === 'head') {
      ghostZHead = originX;
    } else if (ghostAlign === 'mouth') {
      ghostZHead = originX + (cartridge.case_length - ghostCartridge.case_length) * scale;
    } else if (ghostAlign === 'shoulder') {
      ghostZHead = originX + (cartridge.body_length - ghostCartridge.body_length) * scale;
    }

    const gSteps = 100;
    const gDz = ghostCartridge.case_length / gSteps;
    const gRRim = getOuterRadiusAt(ghostCartridge, 0) * scale;

    ghostOuterTopPath = `M ${ghostZHead} ${centerY - gRRim}`;
    ghostOuterBottomPath = `M ${ghostZHead} ${centerY + gRRim}`;

    for (let i = 0; i <= gSteps; i++) {
      const z = i * gDz;
      const r = getOuterRadiusAt(ghostCartridge, z) * scale;
      const px = ghostZHead + z * scale;
      ghostOuterTopPath += ` L ${px} ${centerY - r}`;
      ghostOuterBottomPath += ` L ${px} ${centerY + r}`;
    }

    ghostZMouth = ghostZHead + ghostCartridge.case_length * scale;
    ghostZTip = ghostZHead + ghostCartridge.coal * scale;
    const gRBullet = (ghostCartridge.bullet_diameter / 2) * scale;

    ghostBulletPath = `M ${ghostZMouth} ${centerY - gRBullet} L ${ghostZTip} ${centerY} L ${ghostZMouth} ${centerY + gRBullet} Z`;
  }

  // Wildcat Geometric Coupling Constraints
  const [lockCaseLengthOnBodyChange, setLockCaseLengthOnBodyChange] = useState<boolean>(true);
  const [preserveNeckWallOnBulletChange, setPreserveNeckWallOnBulletChange] = useState<boolean>(true);
  const [selectedCaliberCategoryFilter, setSelectedCaliberCategoryFilter] = useState<string>('All');
  const [bulletSearchQuery, setBulletSearchQuery] = useState<string>('');
  const [applyBulletSeatingDepth, setApplyBulletSeatingDepth] = useState<boolean>(true);
  const [isHoveringBullet, setIsHoveringBullet] = useState<boolean>(false);
  const [appliedBulletNotification, setAppliedBulletNotification] = useState<{
    id: string;
    name: string;
    caliber: number;
    weight: number;
    length: number;
    coal: number;
  } | null>(null);

  const handleApplyBulletPreset = (bullet: BulletOption) => {
    if (!onUpdateCartridge) return;
    const inches = bullet.caliber_inches;
    const seatDepth = (applyBulletSeatingDepth && bullet.recommended_seating_depth)
      ? bullet.recommended_seating_depth
      : (cartridge.seating_depth || 0.300);
    const newCoal = +(cartridge.case_length + bullet.length_inches - seatDepth).toFixed(4);

    let updated: CartridgeSpec = {
      ...cartridge,
      bullet_diameter: inches,
      bullet_weight_grains: bullet.weight_grains,
      bullet_length: bullet.length_inches,
      seating_depth: seatDepth,
      coal: newCoal,
    };
    if (preserveNeckWallOnBulletChange) {
      const wallT = cartridge.neck_wall_thickness || 0.015;
      const newMouth = +(inches + 2 * wallT).toFixed(4);
      updated.neck_diameter_mouth = newMouth;
      updated.neck_diameter_base = newMouth;
    }
    onUpdateCartridge(updated);
    setAppliedBulletNotification({
      id: bullet.id,
      name: bullet.name,
      caliber: bullet.caliber_inches,
      weight: bullet.weight_grains,
      length: bullet.length_inches,
      coal: newCoal,
    });
    if (editingDim) {
      const displayVal = isMetric ? +(inches * 25.4).toFixed(3) : inches;
      setEditingDim(prev => prev ? { ...prev, displayVal } : null);
    }
  };

  // Helper for SAAMI / CIP Manufacturing Tolerances and Stepper Ranges
  const getDimToleranceInfo = (
    key: keyof CartridgeSpec,
    nominalInches: number,
    isAngle = false
  ) => {
    let lowerTolInches = -0.0080;
    let upperTolInches = 0.0000;

    if (isAngle || key === 'shoulder_angle') {
      lowerTolInches = -0.5;
      upperTolInches = 0.5;
    } else if (key === 'base_diameter' || key === 'shoulder_start_diameter') {
      lowerTolInches = -0.0080;
      upperTolInches = 0.0000;
    } else if (key === 'rim_diameter' || key === 'rim_thickness' || key === 'extractor_diameter' || key === 'extractor_width') {
      lowerTolInches = -0.0100;
      upperTolInches = 0.0000;
    } else if (key === 'neck_diameter_mouth' || key === 'neck_diameter_base') {
      lowerTolInches = -0.0060;
      upperTolInches = 0.0000;
    } else if (key === 'bullet_diameter') {
      lowerTolInches = -0.0030;
      upperTolInches = 0.0000;
    } else if (key === 'case_length' || key === 'coal') {
      lowerTolInches = -0.0200;
      upperTolInches = 0.0000;
    } else if (key === 'body_length') {
      lowerTolInches = -0.0150;
      upperTolInches = 0.0000;
    } else if (key === 'web_thickness') {
      lowerTolInches = -0.0050;
      upperTolInches = 0.0050;
    } else if (key === 'neck_wall_thickness' || key === 'base_wall_thickness') {
      lowerTolInches = -0.0015;
      upperTolInches = 0.0015;
    }

    const lowerTol = isAngle ? lowerTolInches : isMetric ? +(lowerTolInches * 25.4).toFixed(2) : lowerTolInches;
    const upperTol = isAngle ? upperTolInches : isMetric ? +(upperTolInches * 25.4).toFixed(2) : upperTolInches;
    const nominal = isAngle ? nominalInches : isMetric ? +(nominalInches * 25.4).toFixed(3) : +nominalInches.toFixed(4);

    const minVal = isAngle ? +(nominal + lowerTol).toFixed(1) : isMetric ? +(nominal + lowerTol).toFixed(3) : +(nominal + lowerTol).toFixed(4);
    const maxVal = isAngle ? +(nominal + upperTol).toFixed(1) : isMetric ? +(nominal + upperTol).toFixed(3) : +(nominal + upperTol).toFixed(4);

    const tolText = isAngle
      ? `±${Math.abs(upperTol).toFixed(1)}°`
      : isMetric
      ? `+${upperTol >= 0 ? '+' : ''}${upperTol.toFixed(2)} / ${lowerTol.toFixed(2)} mm`
      : `+${upperTol >= 0 ? '+' : ''}${upperTol.toFixed(4)}" / ${lowerTol.toFixed(4)}"`;

    let sliderMin = isAngle ? Math.max(0, nominal - 20) : isMetric ? +(nominal * 0.70).toFixed(2) : +(nominal * 0.70).toFixed(4);
    let sliderMax = isAngle ? Math.min(55, nominal + 20) : isMetric ? +(nominal * 1.35).toFixed(2) : +(nominal * 1.35).toFixed(4);
    let sliderStep = isAngle ? 0.25 : isMetric ? 0.02 : 0.001;

    if (key === 'bullet_diameter') {
      sliderMin = isMetric ? 4.0 : 0.170;
      sliderMax = isMetric ? 13.5 : 0.520;
    } else if (key === 'shoulder_angle') {
      sliderMin = 0.0;
      sliderMax = 50.0;
      sliderStep = 0.5;
    }

    return {
      lowerTol,
      upperTol,
      tolText,
      nominal,
      minVal,
      maxVal,
      sliderMin,
      sliderMax,
      sliderStep,
    };
  };

  const handleApplyDimChange = (newDisplayVal: number, recordHistory = true) => {
    if (!editingDim || !onUpdateCartridge) return;
    const inches = editingDim.isAngle
      ? newDisplayVal
      : isMetric
      ? newDisplayVal / 25.4
      : newDisplayVal;

    let updated: CartridgeSpec = {
      ...cartridge,
      [editingDim.key]: inches,
    };

    // Geometric Constraint Coupling (Wildcat Studio CAD Solver)
    if (editingDim.key === 'shoulder_angle') {
      if (inches > 0.5) {
        const neckBase = updated.neck_diameter_base || updated.neck_diameter_mouth;
        const dr = (updated.shoulder_start_diameter - neckBase) / 2.0;
        if (dr > 0.001) {
          const rad = (inches * Math.PI) / 180;
          updated.shoulder_length = +(dr / Math.tan(rad)).toFixed(4);
        }
      } else {
        updated.shoulder_length = 0.0;
      }
    } else if (editingDim.key === 'shoulder_length') {
      if (inches > 0.002) {
        const neckBase = updated.neck_diameter_base || updated.neck_diameter_mouth;
        const dr = (updated.shoulder_start_diameter - neckBase) / 2.0;
        if (dr > 0.001) {
          updated.shoulder_angle = +((Math.atan(dr / inches) * 180) / Math.PI).toFixed(1);
        }
      } else {
        updated.shoulder_angle = 0.0;
      }
    } else if (editingDim.key === 'shoulder_start_diameter' || editingDim.key === 'neck_diameter_base') {
      if (updated.shoulder_angle > 0.5) {
        const neckBase = updated.neck_diameter_base || updated.neck_diameter_mouth;
        const dr = (updated.shoulder_start_diameter - neckBase) / 2.0;
        if (dr > 0.001) {
          const rad = (updated.shoulder_angle * Math.PI) / 180;
          updated.shoulder_length = +(dr / Math.tan(rad)).toFixed(4);
        }
      }
    } else if (editingDim.key === 'body_length') {
      if (!lockCaseLengthOnBodyChange) {
        // Extend case length and COAL with body length to maintain neck length
        const delta = inches - (cartridge.body_length || inches);
        updated.case_length = Math.max(0.600, +(cartridge.case_length + delta).toFixed(4));
        updated.coal = Math.max(updated.case_length + 0.100, +(cartridge.coal + delta).toFixed(4));
      }
    } else if (editingDim.key === 'bullet_diameter') {
      if (preserveNeckWallOnBulletChange) {
        // Automatically sync neck mouth diameter so neck wall remains constant
        const wallT = cartridge.neck_wall_thickness || 0.015;
        const newMouth = +(inches + 2 * wallT).toFixed(4);
        updated.neck_diameter_mouth = newMouth;
        updated.neck_diameter_base = newMouth;
      }
    } else if (editingDim.key === 'case_length') {
      if (updated.coal < inches + 0.100) {
        updated.coal = +(inches + 0.350).toFixed(4);
      }
    }

    onUpdateCartridge(updated);
    setEditingDim((prev) => {
      if (!prev) return null;
      const history = recordHistory ? [...prev.history, newDisplayVal] : prev.history;
      return { ...prev, displayVal: newDisplayVal, history };
    });
  };

  const handleInputWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!editingDim) return;
    const mult = e.shiftKey ? 10 : e.altKey ? 0.5 : 1;
    const baseStep = editingDim.isAngle ? 0.5 : isMetric ? 0.05 : 0.001;
    const step = baseStep * mult;
    const dir = e.deltaY < 0 ? 1 : -1;
    const newVal = +(editingDim.displayVal + dir * step).toFixed(editingDim.isAngle ? 1 : isMetric ? 3 : 4);
    handleApplyDimChange(newVal);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!editingDim) return;
    if (e.key === 'Enter') {
      handleCommitAndClose();
    } else if (e.key === 'Escape') {
      handleRevertAndClose();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      handleUndoDimStep();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const mult = e.shiftKey ? 10 : e.altKey ? 0.5 : 1;
      const baseStep = editingDim.isAngle ? 0.5 : isMetric ? 0.05 : 0.001;
      const step = baseStep * mult;
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      const newVal = +(editingDim.displayVal + dir * step).toFixed(editingDim.isAngle ? 1 : isMetric ? 3 : 4);
      handleApplyDimChange(newVal);
    }
  };

  const handleUndoDimStep = () => {
    if (!editingDim || editingDim.history.length <= 1) return;
    const newHistory = [...editingDim.history];
    newHistory.pop(); // discard current
    const previousVal = newHistory[newHistory.length - 1];
    handleApplyDimChange(previousVal, false);
  };

  const handleUndoToInitial = () => {
    if (!editingDim || !onUpdateCartridge) return;
    const initialDisplay = editingDim.isAngle
      ? editingDim.initialValInches
      : isMetric
      ? +(editingDim.initialValInches * 25.4).toFixed(3)
      : +editingDim.initialValInches.toFixed(4);

    handleApplyDimChange(initialDisplay, true);
  };

  const handleResetToPreset = () => {
    if (!editingDim || !onUpdateCartridge) return;
    const preset = CARTRIDGE_PRESETS[cartridge.id];
    if (!preset) return;
    const presetInches = preset[editingDim.key] as number;
    const presetDisplay = editingDim.isAngle
      ? presetInches
      : isMetric
      ? +(presetInches * 25.4).toFixed(3)
      : +presetInches.toFixed(4);

    handleApplyDimChange(presetDisplay, true);
  };

  const closePopover = () => {
    setEditingDim(null);
    setPopoverPos(null);
  };

  const handleCommitAndClose = () => {
    closePopover();
  };

  const handleRevertAndClose = () => {
    if (editingDim && onUpdateCartridge) {
      onUpdateCartridge({
        ...cartridge,
        [editingDim.key]: editingDim.initialValInches,
      });
    }
    closePopover();
  };

  // Helper to render interactive clickable dimension badge on canvas
  const renderDimensionBadge = (
    svgX: number,
    svgY: number,
    text: string,
    key: keyof CartridgeSpec,
    label: string,
    symbol: string,
    color: string = 'var(--cad-cyan)',
    isAngle = false,
    textAnchor: 'start' | 'middle' | 'end' = 'middle'
  ) => {
    const isHovered = hoveredDim === key;
    const isEditing = editingDim?.key === key;

    const pillWidth = Math.max(68, text.length * 8 + 16);
    const pillX = textAnchor === 'middle' ? svgX - pillWidth / 2 : textAnchor === 'end' ? svgX - pillWidth : svgX;

    return (
      <g
        onClick={(e) => handleDimensionClick(e, key, label, symbol, svgX, svgY, isAngle)}
        onMouseEnter={() => setHoveredDim(key)}
        onMouseLeave={() => setHoveredDim(null)}
        style={{ cursor: 'pointer', pointerEvents: 'all' }}
      >
        <rect
          x={pillX}
          y={svgY - 11}
          width={pillWidth}
          height={20}
          rx={4}
          ry={4}
          fill={isEditing ? 'rgba(0, 210, 255, 0.3)' : isHovered ? 'rgba(22, 31, 48, 0.96)' : 'rgba(9, 13, 20, 0.85)'}
          stroke={isEditing ? 'var(--cad-cyan)' : isHovered ? color : 'rgba(38, 51, 74, 0.7)'}
          strokeWidth={isHovered || isEditing ? 1.5 : 1}
          style={{
            filter: isHovered ? 'drop-shadow(0 0 6px rgba(0, 210, 255, 0.6))' : undefined,
            transition: 'all 0.15s ease',
          }}
        />
        <text
          x={textAnchor === 'middle' ? svgX : textAnchor === 'end' ? svgX - pillWidth / 2 : svgX + pillWidth / 2}
          y={svgY + 3}
          fill={isHovered || isEditing ? '#fff' : color}
          fontSize="11"
          fontWeight={isHovered || isEditing ? 700 : 600}
          fontFamily="var(--font-mono)"
          textAnchor="middle"
        >
          {text}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
          handleFitToView();
        }
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#090d14',
        backgroundImage: `
          linear-gradient(rgba(38, 51, 74, 0.25) 1px, transparent 1px),
          linear-gradient(90deg, rgba(38, 51, 74, 0.25) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* CAD Drawing Mode & Layer Pill Bar (Top-Left, Collapsible with Dropdowns) */}
      {isToolbarCollapsed ? (
        <div
          id="cad-mode-toolbar-collapsed"
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 20,
          }}
        >
          <button
            id="btn-expand-cad-toolbar"
            onClick={toggleToolbarCollapse}
            title="Expand CAD Drafting Tools & Layers"
            style={{
              background: 'rgba(15, 20, 31, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '5px 10px',
              color: 'var(--cad-cyan)',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--cad-cyan)';
              e.currentTarget.style.background = 'rgba(20, 30, 48, 0.95)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.background = 'rgba(15, 20, 31, 0.92)';
            }}
          >
            <Sliders size={13} />
            <span>CAD Tools</span>
            <ChevronRight size={13} color="var(--text-muted)" />
          </button>
        </div>
      ) : (
        <div
          ref={toolbarRef}
          id="cad-mode-toolbar"
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(15, 20, 31, 0.94)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '4px 6px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Collapse Toggle Button */}
          <button
            id="btn-collapse-cad-toolbar"
            onClick={toggleToolbarCollapse}
            title="Collapse CAD Toolbar to Save Canvas Space"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <ChevronLeft size={14} />
          </button>

          {/* Separator */}
          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Mode Dropdown Button */}
          <div style={{ position: 'relative' }}>
            {(() => {
              const currentMode = MODE_ITEMS.find((m) => m.id === activeDrawingMode) || MODE_ITEMS[0];
              const ModeIcon = currentMode.icon;
              return (
                <button
                  id="btn-mode-dropdown"
                  onClick={() => setActiveDropdown(activeDropdown === 'mode' ? null : 'mode')}
                  title="Select 2D Vector CAD Drafting Mode"
                  style={{
                    background: 'rgba(0, 210, 255, 0.12)',
                    border: '1px solid rgba(0, 210, 255, 0.3)',
                    borderRadius: '4px',
                    color: 'var(--cad-cyan)',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  <ModeIcon size={12} strokeWidth={2.4} />
                  <span>{currentMode.label}</span>
                  <ChevronDown
                    size={11}
                    style={{
                      transform: activeDropdown === 'mode' ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s',
                    }}
                  />
                </button>
              );
            })()}

            {/* Mode Dropdown Floating Menu */}
            {activeDropdown === 'mode' && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  background: 'rgba(15, 23, 42, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px',
                  minWidth: '220px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 16px rgba(0, 210, 255, 0.15)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CAD Drafting Mode
                </div>
                {MODE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeDrawingMode === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`btn-mode-select-${item.id}`}
                      onClick={() => {
                        handleSetDrawingMode(item.id);
                        setActiveDropdown(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: isActive ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
                        border: 'none',
                        color: isActive ? 'var(--cad-cyan)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={14} strokeWidth={isActive ? 2.5 : 2} color={isActive ? 'var(--cad-cyan)' : 'var(--text-secondary)'} />
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: isActive ? 700 : 500 }}>{item.label}</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{item.desc}</div>
                        </div>
                      </div>
                      {isActive && <Check size={12} color="var(--cad-cyan)" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Layers Dropdown Button */}
          <div style={{ position: 'relative' }}>
            {(() => {
              const activeCount = [activeShowChamber, activeShowDimensions, activeShowBullet, activeShowGrid].filter(Boolean).length;
              return (
                <button
                  id="btn-layers-dropdown"
                  onClick={() => setActiveDropdown(activeDropdown === 'layers' ? null : 'layers')}
                  title="Toggle Blueprint Layer Overlays"
                  style={{
                    background: activeCount > 0 ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  <Layers size={12} strokeWidth={2} color="var(--cad-cyan)" />
                  <span>Layers</span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(0, 210, 255, 0.18)',
                      color: 'var(--cad-cyan)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontWeight: 700,
                    }}
                  >
                    {activeCount}/4
                  </span>
                  <ChevronDown
                    size={11}
                    style={{
                      transform: activeDropdown === 'layers' ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s',
                    }}
                  />
                </button>
              );
            })()}

            {/* Layers Dropdown Floating Menu */}
            {activeDropdown === 'layers' && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  background: 'rgba(15, 23, 42, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px',
                  minWidth: '210px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 16px rgba(0, 210, 255, 0.15)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Visibility Layers
                </div>

                {/* Chamber Layer */}
                <button
                  id="btn-toggle-chamber"
                  onClick={handleToggleChamber}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: activeShowChamber ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                    border: 'none',
                    color: activeShowChamber ? '#eab308' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: activeShowChamber ? 700 : 500,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!activeShowChamber) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!activeShowChamber) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={13} strokeWidth={2.2} color={activeShowChamber ? '#eab308' : 'var(--text-muted)'} />
                    <span>Chamber Overlay</span>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {activeShowChamber ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Dimensions Layer */}
                <button
                  id="btn-toggle-dimensions"
                  onClick={handleToggleDimensions}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: activeShowDimensions ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
                    border: 'none',
                    color: activeShowDimensions ? 'var(--cad-cyan)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: activeShowDimensions ? 700 : 500,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!activeShowDimensions) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!activeShowDimensions) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Compass size={13} strokeWidth={2.2} color={activeShowDimensions ? 'var(--cad-cyan)' : 'var(--text-muted)'} />
                    <span>Dimension Callouts</span>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {activeShowDimensions ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Bullet Layer */}
                <button
                  id="btn-toggle-bullet"
                  onClick={handleToggleBullet}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: activeShowBullet ? 'rgba(240, 136, 62, 0.15)' : 'transparent',
                    border: 'none',
                    color: activeShowBullet ? 'var(--cad-copper)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: activeShowBullet ? 700 : 500,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!activeShowBullet) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!activeShowBullet) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeShowBullet ? <Eye size={13} strokeWidth={2.2} color="var(--cad-copper)" /> : <EyeOff size={13} strokeWidth={2.2} color="var(--text-muted)" />}
                    <span>Seated Bullet</span>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {activeShowBullet ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Grid Layer */}
                <button
                  id="btn-toggle-grid"
                  onClick={handleToggleGrid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: activeShowGrid ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    border: 'none',
                    color: activeShowGrid ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: activeShowGrid ? 700 : 500,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!activeShowGrid) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!activeShowGrid) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Grid size={13} strokeWidth={2.2} color={activeShowGrid ? '#fff' : 'var(--text-muted)'} />
                    <span>CAD Gridlines</span>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {activeShowGrid ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Dual Standard Pill (SAAMI vs CIP) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              padding: '1px',
            }}
          >
            <button
              id="btn-std-saami"
              onClick={() => handleSetStandard('saami')}
              title="American SAAMI Standard (Datum Headspace Circle, Inches, ANSI Callouts)"
              style={{
                background: activeStandard === 'saami' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                border: 'none',
                borderRadius: '3px',
                color: activeStandard === 'saami' ? '#60a5fa' : 'var(--text-muted)',
                padding: '3px 6px',
                fontSize: '10px',
                fontWeight: activeStandard === 'saami' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
            >
              SAAMI
            </button>
            <button
              id="btn-std-cip"
              onClick={() => handleSetStandard('cip')}
              title="European C.I.P. Standard (L1-L6, P1-P2, H1-H2, Delta L Safety)"
              style={{
                background: activeStandard === 'cip' ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                border: 'none',
                borderRadius: '3px',
                color: activeStandard === 'cip' ? '#c084fc' : 'var(--text-muted)',
                padding: '3px 6px',
                fontSize: '10px',
                fontWeight: activeStandard === 'cip' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
            >
              C.I.P.
            </button>
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Manufacturing Tolerance Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            {(() => {
              const currentTol = TOL_ITEMS.find((t) => t.id === activeTolerance) || TOL_ITEMS[0];
              const isNonNominal = activeTolerance !== 'nominal';
              return (
                <button
                  id="btn-tol-dropdown"
                  onClick={() => setActiveDropdown(activeDropdown === 'tolerance' ? null : 'tolerance')}
                  title="Select Blueprint Tolerance Condition (MMC / LMC / Clearance)"
                  style={{
                    background: isNonNominal ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    border: `1px solid ${isNonNominal ? '#10b981' : 'var(--border-color)'}`,
                    borderRadius: '4px',
                    color: isNonNominal ? '#34d399' : 'var(--text-secondary)',
                    padding: '4px 7px',
                    fontSize: '11px',
                    fontWeight: isNonNominal ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  <Scale size={12} color={isNonNominal ? '#34d399' : 'var(--text-muted)'} />
                  <span>{currentTol.short}</span>
                  <ChevronDown
                    size={11}
                    style={{
                      transform: activeDropdown === 'tolerance' ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s',
                    }}
                  />
                </button>
              );
            })()}

            {/* Tolerance Dropdown Floating Menu */}
            {activeDropdown === 'tolerance' && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: 'rgba(15, 23, 42, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px',
                  minWidth: '230px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 16px rgba(16, 185, 129, 0.15)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Manufacturing Tolerance Matrix
                </div>
                {TOL_ITEMS.map((tol) => {
                  const isActive = activeTolerance === tol.id;
                  return (
                    <button
                      key={tol.id}
                      id={`btn-tol-select-${tol.id}`}
                      onClick={() => {
                        handleSetTolerance(tol.id);
                        setActiveDropdown(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: isActive ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                        border: 'none',
                        color: isActive ? '#34d399' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: isActive ? 700 : 500 }}>{tol.label}</div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{tol.desc}</div>
                      </div>
                      {isActive && <Check size={12} color="#34d399" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CAD Canvas Navigation & Rotate Overlay (Bottom-Right) */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(18, 23, 33, 0.90)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '4px 8px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
      }}>
        <button
          onClick={handleZoomIn}
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          title="Zoom Out (Down to 2%)"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleFitToView}
          style={{ background: 'transparent', border: 'none', color: 'var(--cad-cyan)', cursor: 'pointer' }}
          title="Fit to Screen (Auto-Frame Extents - 'F' Key / Double-Click)"
        >
          <Maximize2 size={15} />
        </button>
        <button
          onClick={handleResetView}
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          title="Reset Zoom to 100%"
        >
          <RotateCcw size={15} />
        </button>
        <span
          onClick={handleFitToView}
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--cad-cyan)',
            marginLeft: '6px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          title="Click to Fit to Screen"
        >
          {(zoom * 100).toFixed(0)}%
        </span>

        {/* Rotate Button */}
        <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px' }} />
        <button
          id="btn-rotate-cartridge"
          onClick={handleRotateClockwise}
          style={{
            background: rotation !== 0 ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
            border: `1px solid ${rotation !== 0 ? 'var(--cad-cyan)' : 'transparent'}`,
            borderRadius: '4px',
            color: rotation !== 0 ? 'var(--cad-cyan)' : '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 5px',
            fontSize: '10.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600
          }}
          title="Rotate Cartridge 90° Clockwise (R)"
        >
          <RotateCw size={13} />
          <span>{rotation}°</span>
        </button>

        {/* Ghost Compare Button */}
        {onOpenCompare && (
          <button
            id="btn-open-compare"
            onClick={onOpenCompare}
            style={{
              background: ghostCartridge ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
              border: `1px solid ${ghostCartridge ? '#f97316' : 'transparent'}`,
              borderRadius: '4px',
              color: ghostCartridge ? '#f97316' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              fontSize: '10.5px',
              fontWeight: 600
            }}
            title={ghostCartridge ? `Comparing with ${ghostCartridge.name}. Click to change.` : "Compare with another cartridge..."}
          >
            <Layers size={13} />
            <span>{ghostCartridge ? 'Comparing' : 'Compare'}</span>
          </button>
        )}
      </div>

      {/* Floating Chamber Clearance & Fit Telemetry HUD */}
      {(activeDrawingMode === 'chamber_fit' || activeShowChamber) && (() => {
        const dNeck = reamer.chamber_neck_dia - cartridge.neck_diameter_mouth;
        const dBase = reamer.chamber_base_dia - cartridge.base_diameter;
        const fbJump = reamer.freebore_length;
        const headspaceClearance = cartridge.rim_type === 'rimmed'
          ? reamer.chamber_rim_depth - cartridge.rim_thickness
          : 0.004;

        if (isChamberHudDismissed) {
          return (
            <button
              id="btn-restore-chamber-hud"
              onClick={() => setIsChamberHudDismissed(false)}
              title="Show Chamber Fit & Clearance Telemetry"
              style={{
                position: 'absolute',
                bottom: '68px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 22,
                background: 'rgba(15, 20, 31, 0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid #eab308',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#eab308',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(234, 179, 8, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 20, 31, 0.92)';
              }}
            >
              <Shield size={12} color="#eab308" />
              <span>Chamber Fit Telemetry</span>
            </button>
          );
        }

        return (
          <div
            id="chamber-fit-hud"
            style={{
              position: 'absolute',
              left: chamberHudPos ? `${chamberHudPos.x}px` : '50%',
              top: chamberHudPos ? `${chamberHudPos.y}px` : 'auto',
              bottom: chamberHudPos ? 'auto' : '68px',
              transform: chamberHudPos ? 'none' : 'translateX(-50%)',
              zIndex: 24,
              background: 'rgba(15, 20, 31, 0.96)',
              backdropFilter: 'blur(14px)',
              border: '1.5px solid #eab308',
              borderRadius: '8px',
              padding: isChamberHudCollapsed ? '4px 10px' : '6px 14px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 16px rgba(234, 179, 8, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: isChamberHudCollapsed ? '8px' : '12px',
              fontSize: '11px',
              color: '#fff',
              userSelect: 'none',
            }}
          >
            {/* Drag Handle */}
            <div
              onMouseDown={handleChamberHudMouseDown}
              onDoubleClick={() => setChamberHudPos(null)}
              title="Drag to reposition Chamber Fit HUD (Double-click to reset position)"
              style={{
                cursor: isDraggingChamberHud ? 'grabbing' : 'grab',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: '2px 0',
              }}
            >
              <GripVertical size={13} />
            </div>

            {/* Title / Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} color="#eab308" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#eab308' }}>Chamber Fit</span>
                {!isChamberHudCollapsed && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>({activeStandard.toUpperCase()})</span>
                )}
              </div>
            </div>

            <div style={{ width: '1px', height: '14px', background: 'rgba(234, 179, 8, 0.3)' }} />

            {/* Telemetry Numbers */}
            {isChamberHudCollapsed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>ΔNeck:</span>
                <span style={{ color: dNeck >= 0.002 ? '#4ade80' : '#f87171', fontWeight: 700 }}>+{fmt(dNeck, 4)}</span>
                <span style={{ color: 'var(--text-muted)' }}>ΔBase:</span>
                <span style={{ color: dBase >= 0.001 ? '#4ade80' : '#f87171', fontWeight: 700 }}>+{fmt(dBase, 4)}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Δ Neck: </span>
                  <span style={{ color: dNeck >= 0.002 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                    +{fmt(dNeck, 4)}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Δ Base: </span>
                  <span style={{ color: dBase >= 0.001 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                    +{fmt(dBase, 4)}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Headspace: </span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>
                    +{fmt(headspaceClearance, 4)}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Freebore: </span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                    {fmt(fbJump, 3)}
                  </span>
                </div>
              </div>
            )}

            <div style={{ width: '1px', height: '14px', background: 'rgba(234, 179, 8, 0.3)' }} />

            {/* Collapse/Expand Toggle */}
            <button
              onClick={() => {
                setIsChamberHudCollapsed((prev) => {
                  const next = !prev;
                  localStorage.setItem('wildcat_chamber_hud_collapsed', String(next));
                  return next;
                });
              }}
              title={isChamberHudCollapsed ? "Expand Telemetry" : "Collapse Telemetry"}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '3px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {isChamberHudCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {/* Reset to Default Position */}
            {chamberHudPos && (
              <button
                type="button"
                onClick={() => setChamberHudPos(null)}
                title="Reset HUD to default position"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '3px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#eab308')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <Crosshair size={12} />
              </button>
            )}

            {/* Dismiss Button */}
            <button
              onClick={() => setIsChamberHudDismissed(true)}
              title="Close Chamber Fit HUD"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '3px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <X size={13} />
            </button>
          </div>
        );
      })()}

      {/* Floating Ghost Comparison Delta HUD */}
      {ghostCartridge && (() => {
        const activeVol = calculateVolumetrics(cartridge);
        const ghostVol = calculateVolumetrics(ghostCartridge);
        const capDiff = activeVol.overflow_capacity_grains_h2o - ghostVol.overflow_capacity_grains_h2o;
        const lenDiff = cartridge.case_length - ghostCartridge.case_length;
        const coalDiff = cartridge.coal - ghostCartridge.coal;
        const isChamberActive = (activeDrawingMode === 'chamber_fit' || activeShowChamber) && !isChamberHudDismissed && !chamberHudPos;

        return (
          <div
            id="ghost-comparison-hud"
            style={{
              position: 'absolute',
              bottom: isChamberActive ? '116px' : '68px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 25,
              background: 'rgba(15, 20, 31, 0.96)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid #f97316',
              borderRadius: '8px',
              padding: '6px 14px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 16px rgba(249, 115, 22, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontSize: '11px',
              color: '#fff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} color="#f97316" />
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  COMPARING TO
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#f97316' }}>
                  {ghostCartridge.name}
                </div>
              </div>
            </div>

            {/* Alignment Selector */}
            {onChangeGhostAlign && (
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: '4px', padding: '2px', border: '1px solid var(--border-color)' }}>
                {(['head', 'shoulder', 'mouth'] as const).map((alignMode) => (
                  <button
                    key={alignMode}
                    onClick={() => onChangeGhostAlign(alignMode)}
                    style={{
                      background: ghostAlign === alignMode ? '#f97316' : 'transparent',
                      color: ghostAlign === alignMode ? '#000' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '2px 7px',
                      fontSize: '10px',
                      fontWeight: ghostAlign === alignMode ? 700 : 500,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {alignMode === 'head' ? 'Bolt (z=0)' : alignMode}
                  </button>
                ))}
              </div>
            )}

            {/* Telemetry Dials */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Δ Cap: </span>
                <span style={{ color: capDiff >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                  {capDiff >= 0 ? `+${capDiff.toFixed(1)}` : capDiff.toFixed(1)} gr
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Δ L₃: </span>
                <span style={{ color: lenDiff >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                  {lenDiff >= 0 ? `+${lenDiff.toFixed(3)}` : lenDiff.toFixed(3)}"
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Δ COAL: </span>
                <span style={{ color: coalDiff >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                  {coalDiff >= 0 ? `+${coalDiff.toFixed(3)}` : coalDiff.toFixed(3)}"
                </span>
              </div>
            </div>

            {/* Dismiss */}
            {onCloseGhost && (
              <button
                id="btn-close-ghost-comparison"
                onClick={onCloseGhost}
                title="Dismiss Ghost Comparison"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={15} />
              </button>
            )}
          </div>
        );
      })()}

      {/* Interactive Helper Banner (Dismissible) */}
      {!isHelperDismissed && (
        <div
          id="canvas-helper-banner"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            background: 'rgba(18, 23, 33, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Edit3 size={12} color="var(--cad-cyan)" />
          <span>Click any <strong style={{ color: 'var(--cad-cyan)' }}>measurement badge</strong> to edit</span>
          <button
            onClick={() => {
              setIsHelperDismissed(true);
              localStorage.setItem('wildcat_helper_dismissed', 'true');
            }}
            title="Dismiss tip"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '1px 3px',
              marginLeft: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 1:1 Scale Physical Engineering Ruler & Calibration Overlay */}
      {isOneToOne && (
        <>
          {/* Calibrated Physical Scale Bar Overlay along bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: '90px',
              left: '16px',
              zIndex: 9,
              pointerEvents: 'none',
              background: 'rgba(10, 14, 22, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              borderRadius: '6px',
              padding: '8px 12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--cad-cyan)', fontWeight: 700, letterSpacing: '0.05em' }}>
                PHYSICAL 1:1 CALIBRATED RULER ({ppi.toFixed(1)} PPI)
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Hold physical cartridge or caliper against screen</span>
            </div>
            <div style={{ position: 'relative', height: '28px', width: `${Math.min(4.0 * ppi, window.innerWidth - 60)}px` }}>
              {/* Inches ruler markings */}
              {Array.from({ length: 4 * 16 + 1 }).map((_, idx) => {
                const x = (idx / 16) * ppi;
                const isInch = idx % 16 === 0;
                const isHalf = idx % 8 === 0 && !isInch;
                const isQuarter = idx % 4 === 0 && !isInch && !isHalf;
                const height = isInch ? 18 : isHalf ? 13 : isQuarter ? 8 : 5;
                const inchNum = idx / 16;
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: 0,
                      width: isInch ? '1.5px' : '1px',
                      height: `${height}px`,
                      background: isInch ? 'var(--cad-cyan)' : 'rgba(0, 240, 255, 0.55)',
                    }}
                  >
                    {isInch && inchNum > 0 && (
                      <span style={{ position: 'absolute', top: '19px', left: '-4px', fontSize: '9.5px', fontFamily: 'monospace', color: '#fff', fontWeight: 700 }}>
                        {inchNum}"
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating 1:1 Scale Control Pill */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 10,
            background: 'rgba(18, 23, 33, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--cad-cyan)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
              <div style={{ color: 'var(--cad-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crosshair size={14} /> 1:1 True-Scale Mode
              </div>
              {onOpenCalibration && (
                <button
                  onClick={onOpenCalibration}
                  style={{
                    background: 'rgba(0, 240, 255, 0.15)',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    color: 'var(--cad-cyan)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Calibrate Display...
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: `${ppi}px`, height: '5px', background: 'var(--cad-cyan)', borderRadius: '3px' }} />
              <input
                type="range"
                min="70"
                max="240"
                value={ppi}
                onChange={(e) => onPpiChange(Number(e.target.value))}
                style={{ width: '100px', cursor: 'pointer', accentColor: 'var(--cad-cyan)' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#fff' }}>{ppi.toFixed(1)} PPI</span>
            </div>
          </div>
        </>
      )}

      {/* FLOATING IN-DIAGRAM PRECISION DIMENSION EDITOR - Wildcat Studio CAD Suite */}
      {editingDim && (() => {
        const tolInfo = getDimToleranceInfo(editingDim.key, editingDim.initialValInches, editingDim.isAngle);
        const preset = CARTRIDGE_PRESETS[cartridge.id];
        const presetInches = preset ? (preset[editingDim.key] as number) : undefined;
        const presetDisplay = presetInches !== undefined ? (
          editingDim.isAngle
            ? presetInches
            : isMetric
            ? +(presetInches * 25.4).toFixed(3)
            : +presetInches.toFixed(4)
        ) : undefined;

        const initialDisplay = editingDim.isAngle
          ? editingDim.initialValInches
          : isMetric
          ? +(editingDim.initialValInches * 25.4).toFixed(3)
          : +editingDim.initialValInches.toFixed(4);
        const isDifferentFromInitial = Math.abs(editingDim.displayVal - initialDisplay) > 0.0001;
        const isDifferentFromPreset = presetDisplay !== undefined && Math.abs(editingDim.displayVal - presetDisplay) > 0.0001;

        // Chamber Reamer & Clearance Telemetry
        const reamer = calculateReamerSpecs(cartridge);
        let chamberClearanceInches: number | null = null;
        let reamerChamberVal: number | null = null;
        let clearanceFeatureLabel = '';

        if (editingDim.key === 'base_diameter') {
          reamerChamberVal = reamer.chamber_base_dia;
          chamberClearanceInches = +(reamer.chamber_base_dia - cartridge.base_diameter).toFixed(4);
          clearanceFeatureLabel = 'P₁ Base Dia Clearance';
        } else if (editingDim.key === 'shoulder_start_diameter') {
          reamerChamberVal = reamer.chamber_shoulder_dia;
          chamberClearanceInches = +(reamer.chamber_shoulder_dia - cartridge.shoulder_start_diameter).toFixed(4);
          clearanceFeatureLabel = 'P₂ Shoulder Dia Clearance';
        } else if (editingDim.key === 'neck_diameter_mouth') {
          reamerChamberVal = reamer.chamber_neck_dia;
          chamberClearanceInches = +(reamer.chamber_neck_dia - cartridge.neck_diameter_mouth).toFixed(4);
          clearanceFeatureLabel = 'H₂ Neck Expansion Clearance';
        } else if (editingDim.key === 'case_length') {
          reamerChamberVal = reamer.chamber_length;
          chamberClearanceInches = +(reamer.chamber_length - cartridge.case_length).toFixed(4);
          clearanceFeatureLabel = 'L₃ Chamber Mouth Clearance';
        } else if (editingDim.key === 'rim_diameter') {
          reamerChamberVal = reamer.chamber_rim_dia;
          chamberClearanceInches = +(reamer.chamber_rim_dia - cartridge.rim_diameter).toFixed(4);
          clearanceFeatureLabel = 'R₁ Rim Recess Clearance';
        } else if (editingDim.key === 'rim_thickness') {
          reamerChamberVal = reamer.chamber_rim_depth;
          chamberClearanceInches = +(reamer.chamber_rim_depth - cartridge.rim_thickness).toFixed(4);
          clearanceFeatureLabel = 'R Rim Depth Headspace Gap';
        } else if (editingDim.key === 'bullet_diameter') {
          reamerChamberVal = reamer.freebore_dia;
          chamberClearanceInches = +(reamer.freebore_dia - cartridge.bullet_diameter).toFixed(4);
          clearanceFeatureLabel = 'Freebore Leade Diametral Clearance';
        }

        // Live Volumetric Telemetry
        const currentVol = calculateVolumetrics(cartridge);
        const initialCartridge = {
          ...cartridge,
          [editingDim.key]: editingDim.initialValInches,
        };
        const initialVol = calculateVolumetrics(initialCartridge);
        const deltaGrains = +(currentVol.overflow_capacity_grains_h2o - initialVol.overflow_capacity_grains_h2o).toFixed(2);
        const deltaPercent = initialVol.overflow_capacity_grains_h2o > 0
          ? +((deltaGrains / initialVol.overflow_capacity_grains_h2o) * 100).toFixed(1)
          : 0;

        const popoverWidth = editingDim.key === 'bullet_diameter' ? 420 : 350;
        const maxAvailableHeight = Math.max(300, window.innerHeight - 65);
        const popoverHeight = Math.min(editingDim.key === 'bullet_diameter' ? 560 : 480, maxAvailableHeight);
        const targetX = editingDim.clientX ?? (editingDim.svgX + pan.x);
        const targetY = editingDim.clientY ?? (editingDim.svgY + pan.y);
        const spawnY = targetY > window.innerHeight * 0.5 ? targetY - popoverHeight - 16 : targetY + 20;
        const defaultLeft = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, targetX - popoverWidth / 2));
        const defaultTop = Math.max(48, Math.min(window.innerHeight - popoverHeight - 12, spawnY));

        return createPortal(
          <div
            id="draggable-dimension-popover"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: popoverPos ? popoverPos.x : defaultLeft,
              top: popoverPos ? popoverPos.y : defaultTop,
              zIndex: 2500,
              background: 'rgba(13, 17, 26, 0.98)',
              backdropFilter: 'blur(16px)',
              border: `1.5px solid ${isDraggingPopover ? '#fff' : 'var(--cad-cyan)'}`,
              borderRadius: '8px',
              padding: '10px 12px',
              boxShadow: isDraggingPopover
                ? '0 16px 48px rgba(0, 0, 0, 0.95), 0 0 28px rgba(0, 210, 255, 0.55)'
                : '0 10px 36px rgba(0, 0, 0, 0.85), 0 0 20px rgba(0, 210, 255, 0.3)',
              width: `${popoverWidth}px`,
              maxHeight: `${maxAvailableHeight}px`,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              userSelect: isDraggingPopover ? 'none' : 'auto',
            }}
          >
            {/* Draggable CAD Header (Pinned) */}
            <div 
              onMouseDown={handlePopoverMouseDown}
              title="Drag to move this dimension editor anywhere on screen"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: isDraggingPopover ? 'grabbing' : 'grab',
                paddingBottom: '6px',
                marginBottom: '6px',
                borderBottom: '1px solid rgba(0, 210, 255, 0.22)',
                userSelect: 'none',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <GripVertical size={14} color="var(--cad-cyan)" style={{ opacity: 0.8, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cad-cyan)', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  EDIT {editingDim.symbol}: {editingDim.label.toUpperCase()}
                </span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'rgba(0, 210, 255, 0.12)',
                  color: 'var(--cad-cyan)',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  flexShrink: 0
                }}>
                  {activeStandard.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                {popoverPos && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPopoverPos(null); }}
                    title="Snap popover back near dimension line"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '3px',
                      fontSize: '10px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cad-cyan)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Crosshair size={12} />
                  </button>
                )}
                <button
                  id="btn-close-measurement-popover"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRevertAndClose(); }}
                  title="Close editor (Esc)"
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--text-muted)', 
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '3px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable Controls Body */}
            <div style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              paddingRight: '2px'
            }}>
              {/* Tolerance Standard & Direct Limit Jumping (LMC / Nominal / MMC) */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '5px',
                padding: '5px 7px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9.5px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>SPEC TOLERANCE:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cad-cyan)', fontWeight: 700 }}>
                    {tolInfo.tolText}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  <button
                    id="btn-tol-min-lmc"
                    type="button"
                    onClick={() => handleApplyDimChange(tolInfo.minVal)}
                    title={`Jump to Minimum Material Condition (LMC) [${tolInfo.minVal}${editingDim.isAngle ? '°' : isMetric ? 'mm' : '"'}]`}
                    style={{
                      background: Math.abs(editingDim.displayVal - tolInfo.minVal) < 0.0001 ? 'rgba(0, 210, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${Math.abs(editingDim.displayVal - tolInfo.minVal) < 0.0001 ? 'var(--cad-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: Math.abs(editingDim.displayVal - tolInfo.minVal) < 0.0001 ? '#fff' : 'var(--text-secondary)',
                      borderRadius: '4px',
                      padding: '3px 2px',
                      fontSize: '9px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Min: {tolInfo.minVal}
                  </button>
                  <button
                    id="btn-tol-nominal"
                    type="button"
                    onClick={() => handleApplyDimChange(tolInfo.nominal)}
                    title={`Jump to Blueprint Nominal Reference Spec [${tolInfo.nominal}${editingDim.isAngle ? '°' : isMetric ? 'mm' : '"'}]`}
                    style={{
                      background: Math.abs(editingDim.displayVal - tolInfo.nominal) < 0.0001 ? 'rgba(0, 210, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${Math.abs(editingDim.displayVal - tolInfo.nominal) < 0.0001 ? 'var(--cad-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: Math.abs(editingDim.displayVal - tolInfo.nominal) < 0.0001 ? '#fff' : 'var(--text-secondary)',
                      borderRadius: '4px',
                      padding: '3px 2px',
                      fontSize: '9px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Nom: {tolInfo.nominal}
                  </button>
                  <button
                    id="btn-tol-max-mmc"
                    type="button"
                    onClick={() => handleApplyDimChange(tolInfo.maxVal)}
                    title={`Jump to Maximum Material Condition (MMC) [${tolInfo.maxVal}${editingDim.isAngle ? '°' : isMetric ? 'mm' : '"'}]`}
                    style={{
                      background: Math.abs(editingDim.displayVal - tolInfo.maxVal) < 0.0001 ? 'rgba(0, 210, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${Math.abs(editingDim.displayVal - tolInfo.maxVal) < 0.0001 ? 'var(--cad-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: Math.abs(editingDim.displayVal - tolInfo.maxVal) < 0.0001 ? '#fff' : 'var(--text-secondary)',
                      borderRadius: '4px',
                      padding: '3px 2px',
                      fontSize: '9px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Max: {tolInfo.maxVal}
                  </button>
                </div>
              </div>

              {/* Primary Digital Display & Scrubber Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const step = editingDim.isAngle ? 0.5 : isMetric ? 0.05 : 0.001;
                        handleApplyDimChange(+(editingDim.displayVal + step).toFixed(editingDim.isAngle ? 1 : isMetric ? 3 : 4));
                      }}
                      title="Nudge Up (Arrow Up)"
                      style={{
                        background: 'rgba(0, 210, 255, 0.1)',
                        border: '1px solid rgba(0, 210, 255, 0.3)',
                        color: 'var(--cad-cyan)',
                        borderRadius: '3px',
                        padding: '1px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const step = editingDim.isAngle ? 0.5 : isMetric ? 0.05 : 0.001;
                        handleApplyDimChange(+(editingDim.displayVal - step).toFixed(editingDim.isAngle ? 1 : isMetric ? 3 : 4));
                      }}
                      title="Nudge Down (Arrow Down)"
                      style={{
                        background: 'rgba(0, 210, 255, 0.1)',
                        border: '1px solid rgba(0, 210, 255, 0.3)',
                        color: 'var(--cad-cyan)',
                        borderRadius: '3px',
                        padding: '1px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>

                  <input
                    id="input-edit-measurement"
                    type="number"
                    autoFocus
                    step={editingDim.isAngle ? 0.5 : isMetric ? 0.05 : 0.001}
                    value={editingDim.displayVal}
                    onChange={(e) => handleApplyDimChange(parseFloat(e.target.value) || 0)}
                    onWheel={handleInputWheel}
                    onKeyDown={handleInputKeyDown}
                    title="Direct number input. Use mouse wheel or Up/Down arrows to nudge (Shift = x10 coarse, Alt = fine)"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: '#070a10',
                      border: '1.5px solid var(--cad-cyan)',
                      borderRadius: '4px',
                      color: '#00f0ff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '15px',
                      fontWeight: 700,
                      padding: '5px 8px',
                      textAlign: 'right',
                      outline: 'none',
                      boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.8)'
                    }}
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', width: '24px', flexShrink: 0, fontWeight: 600 }}>
                    {editingDim.isAngle ? 'deg' : isMetric ? 'mm' : 'in'}
                  </span>

                  {/* Quick Step Undo Button */}
                  <button
                    id="btn-undo-measurement-step"
                    type="button"
                    onClick={handleUndoDimStep}
                    disabled={editingDim.history.length <= 1}
                    title="Undo last change to this measurement (⌘Z / Ctrl+Z)"
                    style={{
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      background: editingDim.history.length > 1 ? 'rgba(0, 210, 255, 0.15)' : 'var(--bg-tertiary)',
                      border: `1px solid ${editingDim.history.length > 1 ? 'var(--cad-cyan)' : 'var(--border-color)'}`,
                      color: editingDim.history.length > 1 ? 'var(--cad-cyan)' : 'var(--text-muted)',
                      borderRadius: '4px',
                      padding: '5px 8px',
                      cursor: editingDim.history.length > 1 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      opacity: editingDim.history.length > 1 ? 1 : 0.35,
                      transition: 'all 0.15s'
                    }}
                  >
                    <Undo2 size={12} />
                    <span>Undo</span>
                  </button>
                </div>

                {/* Continuous Range Scrubber Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: '38px', flexShrink: 0 }}>
                    {tolInfo.sliderMin}
                  </span>
                  <input
                    id="slider-edit-measurement"
                    type="range"
                    min={tolInfo.sliderMin}
                    max={tolInfo.sliderMax}
                    step={tolInfo.sliderStep}
                    value={editingDim.displayVal}
                    onChange={(e) => handleApplyDimChange(parseFloat(e.target.value) || 0)}
                    title="Continuous smooth drag scrubber (drag to dynamically adjust dimension in real time)"
                    style={{
                      flex: 1,
                      accentColor: 'var(--cad-cyan)',
                      cursor: 'ew-resize',
                      height: '5px'
                    }}
                  />
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: '38px', textAlign: 'right', flexShrink: 0 }}>
                    {tolInfo.sliderMax}
                  </span>
                </div>
              </div>

              {/* Precision Multi-Tier Steppers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
                  PRECISION MACHINING STEPPERS:
                </div>
                
                {/* Fine Stepper Tier */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px' }}>
                  {editingDim.isAngle ? (
                    <>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 1.0).toFixed(1))} style={stepperStyle}>-1.0°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.5).toFixed(1))} style={stepperStyle}>-0.5°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.2).toFixed(1))} style={stepperStyle}>-0.2°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.1).toFixed(1))} style={stepperStyle}>-0.1°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.1).toFixed(1))} style={stepperStyle}>+0.1°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.2).toFixed(1))} style={stepperStyle}>+0.2°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.5).toFixed(1))} style={stepperStyle}>+0.5°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 1.0).toFixed(1))} style={stepperStyle}>+1.0°</button>
                    </>
                  ) : isMetric ? (
                    <>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.10).toFixed(2))} style={stepperStyle}>-.10</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.05).toFixed(2))} style={stepperStyle}>-.05</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.02).toFixed(2))} style={stepperStyle}>-.02</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.01).toFixed(2))} style={stepperStyle}>-.01</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.01).toFixed(2))} style={stepperStyle}>+.01</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.02).toFixed(2))} style={stepperStyle}>+.02</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.05).toFixed(2))} style={stepperStyle}>+.05</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.10).toFixed(2))} style={stepperStyle}>+.10</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.005).toFixed(4))} style={stepperStyle}>-.005</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.002).toFixed(4))} style={stepperStyle}>-.002</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.001).toFixed(4))} style={stepperStyle}>-.001</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.0005).toFixed(4))} style={stepperStyle}>-.0005</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.0005).toFixed(4))} style={stepperStyle}>+.0005</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.001).toFixed(4))} style={stepperStyle}>+.001</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.002).toFixed(4))} style={stepperStyle}>+.002</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.005).toFixed(4))} style={stepperStyle}>+.005</button>
                    </>
                  )}
                </div>

                {/* Coarse Stepper Tier */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2px' }}>
                  {editingDim.isAngle ? (
                    <>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 10.0).toFixed(1))} style={stepperStyle}>-10°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 5.0).toFixed(1))} style={stepperStyle}>-5.0°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 2.0).toFixed(1))} style={stepperStyle}>-2.0°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 2.0).toFixed(1))} style={stepperStyle}>+2.0°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 5.0).toFixed(1))} style={stepperStyle}>+5.0°</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 10.0).toFixed(1))} style={stepperStyle}>+10°</button>
                    </>
                  ) : isMetric ? (
                    <>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 1.00).toFixed(2))} style={stepperStyle}>-1.00</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.50).toFixed(2))} style={stepperStyle}>-0.50</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.20).toFixed(2))} style={stepperStyle}>-0.20</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.20).toFixed(2))} style={stepperStyle}>+0.20</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.50).toFixed(2))} style={stepperStyle}>+0.50</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 1.00).toFixed(2))} style={stepperStyle}>+1.00</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.050).toFixed(4))} style={stepperStyle}>-.050</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.025).toFixed(4))} style={stepperStyle}>-.025</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal - 0.010).toFixed(4))} style={stepperStyle}>-.010</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.010).toFixed(4))} style={stepperStyle}>+.010</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.025).toFixed(4))} style={stepperStyle}>+.025</button>
                      <button onClick={() => handleApplyDimChange(+(editingDim.displayVal + 0.050).toFixed(4))} style={stepperStyle}>+.050</button>
                    </>
                  )}
                </div>
              </div>

              {/* Live Engineering Telemetry (Volumetric & Chamber Fit) */}
              <div style={{
                background: 'rgba(0, 210, 255, 0.04)',
                border: '1px solid rgba(0, 210, 255, 0.18)',
                borderRadius: '5px',
                padding: '6px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                {/* Powder Chamber Capacity Telemetry */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Droplet size={11} color="var(--cad-cyan)" />
                    <span style={{ fontSize: '9.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      POWDER CAPACITY:
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#fff', fontWeight: 700 }}>
                      {currentVol.overflow_capacity_grains_h2o.toFixed(1)} gr H₂O
                    </span>
                    <span style={{
                      color: Math.abs(deltaGrains) < 0.05 ? 'var(--text-muted)' : deltaGrains > 0 ? '#3fb950' : '#f85149',
                      fontWeight: 700,
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      background: Math.abs(deltaGrains) < 0.05 ? 'transparent' : deltaGrains > 0 ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.15)'
                    }}>
                      Δ {deltaGrains >= 0 ? '+' : ''}{deltaGrains.toFixed(2)} gr ({deltaPercent >= 0 ? '+' : ''}{deltaPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Chamber Reamer Clearance Telemetry */}
                {chamberClearanceInches !== null && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '4px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {chamberClearanceInches < 0 ? (
                        <AlertTriangle size={11} color="#f85149" />
                      ) : (
                        <CheckCircle2 size={11} color={chamberClearanceInches < 0.0015 ? '#d29922' : '#3fb950'} />
                      )}
                      <span style={{ fontSize: '9.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {clearanceFeatureLabel ? clearanceFeatureLabel.toUpperCase() : 'CHAMBER FIT'}:
                      </span>
                      {reamerChamberVal !== null && (
                        <span style={{ fontSize: '8.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          ({isMetric ? (reamerChamberVal * 25.4).toFixed(2) + 'mm' : reamerChamberVal.toFixed(4) + '"'})
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: '3px',
                      background: chamberClearanceInches < 0 
                        ? 'rgba(248, 81, 73, 0.2)' 
                        : chamberClearanceInches < 0.0015 
                        ? 'rgba(210, 153, 34, 0.2)' 
                        : 'rgba(63, 185, 80, 0.2)',
                      color: chamberClearanceInches < 0 
                        ? '#f85149' 
                        : chamberClearanceInches < 0.0015 
                        ? '#d29922' 
                        : '#3fb950',
                      border: `1px solid ${
                        chamberClearanceInches < 0 
                          ? 'rgba(248, 81, 73, 0.4)' 
                          : chamberClearanceInches < 0.0015 
                          ? 'rgba(210, 153, 34, 0.4)' 
                          : 'rgba(63, 185, 80, 0.4)'
                      }`
                    }}>
                      {chamberClearanceInches < 0 
                        ? `⚠ INTERFERENCE (${chamberClearanceInches >= 0 ? '+' : ''}${isMetric ? (chamberClearanceInches * 25.4).toFixed(3) + 'mm' : chamberClearanceInches.toFixed(4) + '"'})` 
                        : chamberClearanceInches < 0.0015 
                        ? `TIGHT FIT (+${isMetric ? (chamberClearanceInches * 25.4).toFixed(3) + 'mm' : chamberClearanceInches.toFixed(4) + '"'})` 
                        : `SAFE FIT (+${isMetric ? (chamberClearanceInches * 25.4).toFixed(3) + 'mm' : chamberClearanceInches.toFixed(4) + '"'})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Wildcat Geometric Coupling Controls */}
              {editingDim.key === 'body_length' && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '5px',
                  padding: '5px 7px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--cad-cyan)' }}>
                      WILDCAT COUPLING:
                    </span>
                    <button
                      type="button"
                      onClick={() => setLockCaseLengthOnBodyChange((prev) => !prev)}
                      style={{
                        background: lockCaseLengthOnBodyChange ? 'rgba(0, 210, 255, 0.15)' : 'rgba(240, 136, 62, 0.15)',
                        border: `1px solid ${lockCaseLengthOnBodyChange ? 'var(--cad-cyan)' : 'var(--cad-copper)'}`,
                        color: lockCaseLengthOnBodyChange ? 'var(--cad-cyan)' : 'var(--cad-copper)',
                        borderRadius: '3px',
                        padding: '2px 5px',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {lockCaseLengthOnBodyChange ? <Lock size={10} /> : <Unlock size={10} />}
                      <span>{lockCaseLengthOnBodyChange ? 'Lock Case Length (L₃)' : 'Extend L₃ with Body'}</span>
                    </button>
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                    Resulting Neck Length: <strong style={{ color: '#fff' }}>{(cartridge.case_length - cartridge.body_length - cartridge.shoulder_length).toFixed(3)}"</strong>
                    {lockCaseLengthOnBodyChange ? ' (shortens as shoulder moves forward)' : ' (neck length stays fixed)'}
                  </div>
                </div>
              )}

              {editingDim.key === 'bullet_diameter' && (() => {
                const currentDia = isMetric ? editingDim.displayVal / 25.4 : editingDim.displayVal;
                const filteredCalibers = selectedCaliberCategoryFilter === 'All'
                  ? CALIBER_PRESETS
                  : CALIBER_PRESETS.filter(c => c.category === selectedCaliberCategoryFilter);
                
                const q = bulletSearchQuery.trim().toLowerCase();
                const matchingBullets = q
                  ? BULLET_OPTIONS.filter(b => 
                      b.name.toLowerCase().includes(q) ||
                      b.manufacturer.toLowerCase().includes(q) ||
                      b.category.toLowerCase().includes(q) ||
                      b.caliber_designation.toLowerCase().includes(q) ||
                      `${b.weight_grains}gr`.includes(q) ||
                      `${b.weight_grains}` === q
                    )
                  : getBulletsForCaliber(currentDia, 0.008);

                return (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {/* Header & Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--cad-copper)', letterSpacing: '0.4px' }}>
                        STANDARD CALIBER PRESETS ({CALIBER_PRESETS.length})
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={preserveNeckWallOnBulletChange}
                          onChange={(e) => setPreserveNeckWallOnBulletChange(e.target.checked)}
                          style={{ accentColor: 'var(--cad-copper)' }}
                        />
                        <span>Sync Neck (H₂)</span>
                      </label>
                    </div>

                    {/* Category Tabs */}
                    <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '2px' }}>
                      {[
                        { label: 'All', cat: 'All' },
                        { label: 'Varmint', cat: 'Sub-Caliber & Varmint' },
                        { label: 'Match/Rifle', cat: 'Match & Service Rifle (6mm - .30 Cal)' },
                        { label: 'Medium/Euro', cat: 'Medium Bore & European (8mm - 9.3mm)' },
                        { label: 'African / DG', cat: 'African Express & Dangerous Game' },
                        { label: 'Handgun', cat: 'Handgun, Pistol & PDW' },
                        { label: 'ELR', cat: 'Anti-Materiel & Extreme Long Range (ELR)' }
                      ].map(item => {
                        const isCatActive = selectedCaliberCategoryFilter === item.cat;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setSelectedCaliberCategoryFilter(item.cat)}
                            style={{
                              background: isCatActive ? 'rgba(240, 136, 62, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${isCatActive ? 'var(--cad-copper)' : 'rgba(255, 255, 255, 0.08)'}`,
                              color: isCatActive ? '#fff' : 'var(--text-secondary)',
                              borderRadius: '3px',
                              padding: '2px 5px',
                              fontSize: '8px',
                              fontWeight: isCatActive ? 700 : 500,
                              whiteSpace: 'nowrap',
                              cursor: 'pointer'
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Caliber Buttons Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '3px',
                      maxHeight: '90px',
                      overflowY: 'auto',
                      paddingRight: '2px'
                    }}>
                      {filteredCalibers.map((cal) => {
                        const display = isMetric ? +(cal.inches * 25.4).toFixed(2) : cal.inches;
                        const isActive = Math.abs(editingDim.displayVal - display) < 0.003;
                        return (
                          <button
                            key={cal.inches}
                            type="button"
                            title={`${cal.designation} (${cal.commonCartridges})`}
                            onClick={() => handleApplyDimChange(display)}
                            style={{
                              background: isActive ? 'rgba(240, 136, 62, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${isActive ? 'var(--cad-copper)' : 'rgba(255, 255, 255, 0.1)'}`,
                              color: isActive ? '#fff' : 'var(--text-secondary)',
                              borderRadius: '3px',
                              padding: '3px 1px',
                              fontSize: '8px',
                              fontWeight: isActive ? 700 : 500,
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              lineHeight: 1.1
                            }}
                          >
                            <span>{cal.inches.toFixed(3)}"</span>
                            <span style={{ fontSize: '7px', opacity: 0.75 }}>{cal.mm}mm</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* FACTORY BULLET OPTIONS LIBRARY DRAWER */}
                    <div style={{
                      marginTop: '4px',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(240, 136, 62, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--cad-cyan)' }}>
                            BULLET OPTIONS & MATCH PROJECTILES:
                          </span>
                          <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                            ({matchingBullets.length} available)
                          </span>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={applyBulletSeatingDepth}
                            onChange={(e) => setApplyBulletSeatingDepth(e.target.checked)}
                            style={{ accentColor: 'var(--cad-cyan)' }}
                          />
                          <span>Set Seating Depth</span>
                        </label>
                      </div>

                      {/* Bullet Quick Search */}
                      <input
                        type="text"
                        placeholder="Search all bullets (e.g. SMK, ELD-M, 175gr, Barnes, Lapua)..."
                        value={bulletSearchQuery}
                        onChange={(e) => setBulletSearchQuery(e.target.value)}
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '3px',
                          color: '#fff',
                          fontSize: '8.5px',
                          padding: '3px 6px',
                          outline: 'none',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />

                      {/* Active Loaded Bullet Banner */}
                      {(() => {
                        const activeBullet = BULLET_OPTIONS.find(b => 
                          (appliedBulletNotification && b.id === appliedBulletNotification.id) ||
                          (Math.abs(cartridge.bullet_diameter - b.caliber_inches) < 0.003 &&
                           cartridge.bullet_weight_grains === b.weight_grains)
                        );
                        if (!activeBullet) return null;

                        return (
                          <div style={{
                            background: 'rgba(0, 210, 255, 0.12)',
                            border: '1px solid rgba(0, 210, 255, 0.45)',
                            borderRadius: '4px',
                            padding: '4px 6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            boxShadow: '0 0 10px rgba(0, 210, 255, 0.12)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--cad-cyan)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Check size={10} /> LOADED: {activeBullet.name}
                              </span>
                              <span style={{ fontSize: '7.5px', color: '#fbbf24', fontWeight: 700 }}>
                                COAL: {cartridge.coal.toFixed(3)}"
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: 'var(--text-secondary)' }}>
                              <span>{activeBullet.weight_grains}gr (L: {activeBullet.length_inches}")</span>
                              <span>Seat: {cartridge.seating_depth}"</span>
                              <span>BC G1: {activeBullet.g1_bc}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Bullet Cards List */}
                      <div style={{
                        maxHeight: '140px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        paddingRight: '2px'
                      }}>
                        {matchingBullets.length === 0 ? (
                          <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '6px' }}>
                            No factory bullet models found for {currentDia.toFixed(3)}". Search above to view all bullets.
                          </div>
                        ) : (
                          matchingBullets.map((bullet) => {
                            const isCurrentBullet = 
                              Math.abs(cartridge.bullet_diameter - bullet.caliber_inches) < 0.003 &&
                              cartridge.bullet_weight_grains === bullet.weight_grains;

                            return (
                              <div
                                key={bullet.id}
                                onClick={() => handleApplyBulletPreset(bullet)}
                                style={{
                                  background: isCurrentBullet ? 'rgba(0, 210, 255, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                                  border: `1px solid ${isCurrentBullet ? 'var(--cad-cyan)' : 'rgba(255, 255, 255, 0.08)'}`,
                                  borderRadius: '4px',
                                  padding: '4px 6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  transition: 'background 0.1s, border-color 0.1s'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 700, color: isCurrentBullet ? '#fff' : 'var(--text-primary)' }}>
                                    {bullet.name}
                                  </span>
                                  <span style={{
                                    fontSize: '7.5px',
                                    padding: '1px 4px',
                                    borderRadius: '3px',
                                    background: bullet.category.includes('Match') || bullet.category.includes('ELD')
                                      ? 'rgba(0, 210, 255, 0.2)'
                                      : bullet.category.includes('Copper')
                                      ? 'rgba(240, 136, 62, 0.2)'
                                      : 'rgba(255, 255, 255, 0.08)',
                                    color: bullet.category.includes('Match') || bullet.category.includes('ELD')
                                      ? 'var(--cad-cyan)'
                                      : bullet.category.includes('Copper')
                                      ? 'var(--cad-copper)'
                                      : 'var(--text-secondary)'
                                  }}>
                                    {bullet.category.split(' ')[0]}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8px', color: 'var(--text-secondary)' }}>
                                  <span><strong style={{ color: '#fff' }}>{bullet.weight_grains}</strong> gr</span>
                                  <span>L: <strong style={{ color: '#fff' }}>{bullet.length_inches.toFixed(3)}"</strong></span>
                                  <span>G1 BC: <strong style={{ color: '#34d399' }}>{bullet.g1_bc.toFixed(3)}</strong></span>
                                  <span>Seat: <strong>{bullet.recommended_seating_depth.toFixed(3)}"</strong></span>
                                </div>
                                {bullet.profile_notes && (
                                  <div style={{ fontSize: '7.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    {bullet.profile_notes}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {editingDim.key === 'shoulder_angle' && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '5px',
                  padding: '5px 7px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--cad-brass)' }}>
                    STANDARD SHOULDER ANGLES:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '3px' }}>
                    {[
                      { label: '17.5°', val: 17.5 },
                      { label: '20°', val: 20.0 },
                      { label: '25°', val: 25.0 },
                      { label: '30°', val: 30.0 },
                      { label: '35°', val: 35.0 },
                      { label: '40°', val: 40.0 },
                    ].map((ang) => {
                      const isActive = Math.abs(editingDim.displayVal - ang.val) < 0.1;
                      return (
                        <button
                          key={ang.label}
                          type="button"
                          onClick={() => handleApplyDimChange(ang.val)}
                          style={{
                            background: isActive ? 'rgba(218, 165, 32, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                            border: `1px solid ${isActive ? 'var(--cad-brass)' : 'rgba(255, 255, 255, 0.1)'}`,
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            borderRadius: '3px',
                            padding: '3px 1px',
                            fontSize: '9px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {ang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Shoulder Removal / Straight-Wall Actions inside Popover */}
              {(editingDim.key === 'shoulder_angle' || editingDim.key === 'shoulder_start_diameter' || editingDim.key === 'shoulder_length') && (
                <div style={{
                  background: 'rgba(0, 210, 255, 0.05)',
                  border: '1px solid rgba(0, 210, 255, 0.18)',
                  borderRadius: '4px',
                  padding: '5px 7px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--cad-cyan)', letterSpacing: '0.4px' }}>
                    SHOULDER CONVERSION OPTIONS:
                  </div>
                  {!isStraightWall(cartridge) ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      <button
                        id="btn-popover-remove-shoulder-taper"
                        onClick={() => {
                          if (onUpdateCartridge) {
                            onUpdateCartridge({
                              ...cartridge,
                              body_length: cartridge.case_length,
                              shoulder_length: 0.0,
                              shoulder_angle: 0.0,
                              shoulder_start_diameter: cartridge.neck_diameter_mouth,
                              neck_diameter_base: cartridge.neck_diameter_mouth,
                            });
                          }
                          closePopover();
                        }}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--cad-cyan)',
                          color: 'var(--cad-cyan)',
                          borderRadius: '4px',
                          padding: '3px',
                          fontSize: '9px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <ShieldOff size={11} />
                        <span>Taper to Mouth</span>
                      </button>

                      <button
                        id="btn-popover-remove-shoulder-cylinder"
                        onClick={() => {
                          if (onUpdateCartridge) {
                            const baseDia = cartridge.base_diameter;
                            const bulletDia = Math.max(0.170, Math.round((baseDia - 2 * cartridge.neck_wall_thickness) * 1000) / 1000);
                            onUpdateCartridge({
                              ...cartridge,
                              body_length: cartridge.case_length,
                              shoulder_length: 0.0,
                              shoulder_angle: 0.0,
                              shoulder_start_diameter: baseDia,
                              neck_diameter_base: baseDia,
                              neck_diameter_mouth: baseDia,
                              bullet_diameter: bulletDia,
                            });
                          }
                          closePopover();
                        }}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--cad-cyan)',
                          color: 'var(--cad-cyan)',
                          borderRadius: '4px',
                          padding: '3px',
                          fontSize: '9px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <ShieldOff size={11} />
                        <span>Full Cylinder (P₁)</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                      <button
                        id="btn-popover-add-shoulder-20"
                        onClick={() => {
                          if (onUpdateCartridge) {
                            const l3 = cartridge.case_length;
                            const p1 = cartridge.base_diameter;
                            const h2 = cartridge.neck_diameter_mouth;
                            onUpdateCartridge({
                              ...cartridge,
                              body_length: Math.max(0.600, l3 - 0.380),
                              shoulder_length: 0.140,
                              shoulder_angle: 20.0,
                              shoulder_start_diameter: Math.max(p1 * 0.965, h2 + 0.020),
                              neck_diameter_base: h2,
                            });
                          }
                          closePopover();
                        }}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', padding: '3px', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        +20° Standard
                      </button>
                      <button
                        id="btn-popover-add-shoulder-30"
                        onClick={() => {
                          if (onUpdateCartridge) {
                            const l3 = cartridge.case_length;
                            const p1 = cartridge.base_diameter;
                            const h2 = cartridge.neck_diameter_mouth;
                            onUpdateCartridge({
                              ...cartridge,
                              body_length: Math.max(0.600, l3 - 0.350),
                              shoulder_length: 0.100,
                              shoulder_angle: 30.0,
                              shoulder_start_diameter: Math.max(p1 * 0.980, h2 + 0.020),
                              neck_diameter_base: h2,
                            });
                          }
                          closePopover();
                        }}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', padding: '3px', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        +30° Match
                      </button>
                      <button
                        id="btn-popover-add-shoulder-40"
                        onClick={() => {
                          if (onUpdateCartridge) {
                            const l3 = cartridge.case_length;
                            const p1 = cartridge.base_diameter;
                            const h2 = cartridge.neck_diameter_mouth;
                            onUpdateCartridge({
                              ...cartridge,
                              body_length: Math.max(0.600, l3 - 0.320),
                              shoulder_length: 0.075,
                              shoulder_angle: 40.0,
                              shoulder_start_diameter: Math.max(p1 * 0.980, h2 + 0.020),
                              neck_diameter_base: h2,
                            });
                          }
                          closePopover();
                        }}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', padding: '3px', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        +40° Ackley
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pinned Action & Undo Footer - Always inside frame */}
            <div style={{
              flexShrink: 0,
              paddingTop: '8px',
              marginTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {/* Measurement Undo & Revert Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px'
              }}>
                <button
                  id="btn-undo-to-initial"
                  onClick={handleUndoToInitial}
                  disabled={!isDifferentFromInitial}
                  title={`Revert to initial dimension: ${initialDisplay}${editingDim.isAngle ? '°' : isMetric ? 'mm' : '"'}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: isDifferentFromInitial ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                    border: `1px solid ${isDifferentFromInitial ? 'rgba(0, 210, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: isDifferentFromInitial ? 'var(--cad-cyan)' : 'var(--text-muted)',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    fontSize: '9.5px',
                    fontWeight: 600,
                    cursor: isDifferentFromInitial ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    opacity: isDifferentFromInitial ? 1 : 0.35,
                    transition: 'all 0.15s',
                    overflow: 'hidden'
                  }}
                >
                  <RotateCcw size={11} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Revert ({initialDisplay}{editingDim.isAngle ? '°' : isMetric ? 'mm' : '"'})
                  </span>
                </button>

                {presetDisplay !== undefined && (
                  <button
                    id="btn-reset-to-preset"
                    onClick={handleResetToPreset}
                    disabled={!isDifferentFromPreset}
                    title={`Reset to factory SAAMI/CIP spec: ${presetDisplay}${editingDim.isAngle ? '°' : isMetric ? 'mm' : '"'}`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: isDifferentFromPreset ? 'rgba(240, 136, 62, 0.1)' : 'transparent',
                      border: `1px solid ${isDifferentFromPreset ? 'rgba(240, 136, 62, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: isDifferentFromPreset ? 'var(--cad-copper)' : 'var(--text-muted)',
                      borderRadius: '4px',
                      padding: '4px 6px',
                      fontSize: '9.5px',
                      fontWeight: 600,
                      cursor: isDifferentFromPreset ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      opacity: isDifferentFromPreset ? 1 : 0.35,
                      transition: 'all 0.15s',
                      overflow: 'hidden'
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Spec ({presetDisplay}{editingDim.isAngle ? '°' : isMetric ? 'mm' : '"'})
                    </span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  id="btn-cancel-measurement"
                  onClick={handleRevertAndClose}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  id="btn-done-measurement"
                  onClick={handleCommitAndClose}
                  style={{
                    background: 'var(--cad-cyan)',
                    border: 'none',
                    color: '#0a0d13',
                    borderRadius: '4px',
                    padding: '4px 16px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Check size={13} />
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* SVG Canvas */}
      <svg
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.05s ease-out',
        }}
      >
        <defs>
          {/* Arrow Marker */}
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="var(--cad-cyan)" />
          </marker>

          {/* Brass Cutaway Gradient */}
          <linearGradient id="brassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e5be59" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#d4af37" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#997a15" stopOpacity="0.8" />
          </linearGradient>

          {/* Copper Bullet Gradient */}
          <linearGradient id="copperGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0883e" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#b8581e" stopOpacity="0.9" />
          </linearGradient>

          {/* Powder Hatching Pattern */}
          <pattern id="powderHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(229, 190, 89, 0.25)" strokeWidth="1.5" />
          </pattern>

          {/* Chamber Steel Hatching Pattern */}
          <pattern id="chamberHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(234, 179, 8, 0.25)" strokeWidth="1.2" />
          </pattern>

          {/* CAD Background Grid Pattern */}
          <pattern id="cadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(38, 51, 74, 0.35)" strokeWidth="0.8" />
            <path d="M 20 0 L 20 40 M 0 20 L 40 20" fill="none" stroke="rgba(38, 51, 74, 0.15)" strokeWidth="0.5" strokeDasharray="2,2" />
          </pattern>

          {/* Fallout Mini Nuke Olive Gradient */}
          <linearGradient id="nukeOliveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4d5c34" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#3d4a29" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#28321a" stopOpacity="0.95" />
          </linearGradient>

          {/* Fallout Mini Nuke Red Dome Gradient */}
          <linearGradient id="nukeRedDomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
            <stop offset="45%" stopColor="#dc2626" stopOpacity="1" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="1" />
          </linearGradient>

          {/* Fallout Mini Nuke Dark Steel Hardware */}
          <linearGradient id="nukeSteelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" stopOpacity="1" />
            <stop offset="50%" stopColor="#334155" stopOpacity="1" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="1" />
          </linearGradient>

          {/* Glowing Radioactive Core Radial */}
          <radialGradient id="nukeCoreRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86efac" stopOpacity="1" />
            <stop offset="40%" stopColor="#22c55e" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#15803d" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#052e16" stopOpacity="0.7" />
          </radialGradient>

          {/* Little Boy Gunmetal Military Gradient */}
          <linearGradient id="littleBoyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3f4a3c" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#293327" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1a2219" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* CAD Coordinate Grid Layer (Static Drafting Table Canvas) */}
        {activeShowGrid && (
          <rect
            x={-5000}
            y={-5000}
            width={10000}
            height={10000}
            fill="url(#cadGrid)"
            pointerEvents="none"
          />
        )}

        {/* Rotatable Assembly Container */}
        <g
          id="cartridge-rotatable-assembly"
          transform={`rotate(${rotation} ${rotCenterX} ${centerY})`}
        >
          {/* Ghost Cartridge Silhouette Overlay */}
          {ghostCartridge && (
            <g id="ghost-cartridge-overlay">
              <path
                d={`${ghostOuterTopPath} L ${ghostZMouth} ${centerY} ${ghostOuterBottomPath} Z`}
                fill="rgba(249, 115, 22, 0.08)"
                stroke="#f97316"
                strokeWidth="1.8"
                strokeDasharray="6,3"
              />
              <path
                d={ghostBulletPath}
                fill="rgba(251, 146, 60, 0.16)"
                stroke="#fb923c"
                strokeWidth="1.8"
                strokeDasharray="4,2"
              />
            </g>
          )}

        {/* Centerline (Dashed) */}
        <line
          x1={originX - 40}
          y1={centerY}
          x2={pxTip + 60}
          y2={centerY}
          stroke="#485466"
          strokeWidth="1.2"
          strokeDasharray="14,4,3,4"
        />

        {/* ================= CLASSIFIED: LITTLE BOY RENDERING ================= */}
        {cartridge.id === 'little_boy_ordnance' ? (
          <g id="little-boy-cad-model">
            {/* Box Tail-Fin Assembly (4 Fins + Outer Box Shroud) */}
            <g id="little-boy-box-fins">
              {/* Upper & Lower Fin Extensions */}
              <rect
                x={originX}
                y={centerY - rRim * 1.4}
                width={1.8 * scale}
                height={rRim * 0.5}
                fill="#1f2937"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <rect
                x={originX}
                y={centerY + rRim * 0.9}
                width={1.8 * scale}
                height={rRim * 0.5}
                fill="#1f2937"
                stroke="#475569"
                strokeWidth="1.5"
              />
              {/* Iconic Square Box Shroud connecting the 4 tail fins */}
              <rect
                x={originX + 0.2 * scale}
                y={centerY - rRim * 1.42}
                width={1.2 * scale}
                height={rRim * 2.84}
                fill="none"
                stroke="#64748b"
                strokeWidth="3.5"
                rx="2"
              />
              <line
                x1={originX + 0.8 * scale}
                y1={centerY - rRim * 1.42}
                x2={originX + 0.8 * scale}
                y2={centerY + rRim * 1.42}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            </g>

            {/* Long Cylindrical Bomb Body (Military Gunmetal Olive) */}
            <rect
              x={originX + 1.5 * scale}
              y={centerY - rRim}
              width={(cartridge.case_length - 1.5) * scale}
              height={rRim * 2}
              fill="url(#littleBoyGradient)"
              stroke="#64748b"
              strokeWidth="2"
              rx="4"
            />

            {/* Blunt Hemispherical Nose Cap */}
            <path
              d={`
                M ${pxMouth} ${centerY - rRim}
                Q ${pxTip} ${centerY - rRim * 0.85}, ${pxTip} ${centerY}
                Q ${pxTip} ${centerY + rRim * 0.85}, ${pxMouth} ${centerY + rRim}
                Z
              `}
              fill="url(#littleBoyGradient)"
              stroke="#94a3b8"
              strokeWidth="2"
            />

            {/* 4 Radar Proximity Antenna Probes (Yagi Antenna needles extending forward) */}
            <g id="little-boy-antenna-probes" stroke="#cbd5e1" strokeWidth="1.5">
              <line x1={pxTip - 0.1 * scale} y1={centerY - rRim * 0.5} x2={pxTip + 0.5 * scale} y2={centerY - rRim * 0.75} />
              <line x1={pxTip + 0.35 * scale} y1={centerY - rRim * 0.9} x2={pxTip + 0.35 * scale} y2={centerY - rRim * 0.6} />
              <line x1={pxTip - 0.1 * scale} y1={centerY + rRim * 0.5} x2={pxTip + 0.5 * scale} y2={centerY + rRim * 0.75} />
              <line x1={pxTip + 0.35 * scale} y1={centerY + rRim * 0.9} x2={pxTip + 0.35 * scale} y2={centerY + rRim * 0.6} />
            </g>

            {/* Hoist Lug on Top */}
            <rect
              x={originX + (cartridge.case_length / 2) * scale - 0.2 * scale}
              y={centerY - rRim - 0.25 * scale}
              width={0.4 * scale}
              height={0.25 * scale}
              fill="#475569"
              stroke="#94a3b8"
              strokeWidth="1.5"
              rx="3"
            />
            <circle
              cx={originX + (cartridge.case_length / 2) * scale}
              cy={centerY - rRim - 0.12 * scale}
              r={0.06 * scale}
              fill="#0a0d13"
            />

            {/* Stenciled Nomenclature Markings */}
            <text
              x={originX + 2.5 * scale}
              y={centerY - rRim * 0.35}
              fill="#e2e8f0"
              fontSize="12"
              fontFamily="var(--font-mono)"
              fontWeight="bold"
              letterSpacing="1.5"
            >
              ORDNANCE BOMB MK-I (L-11)
            </text>
            <text
              x={originX + 2.5 * scale}
              y={centerY + rRim * 0.45}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              GUN-TYPE URANIUM-235 CRITICAL MASS
            </text>

            {/* Internal Gun-Type Assembly Cutaway */}
            {mode === 'cutaway' && (
              <g id="little-boy-gun-cutaway">
                {/* 3-Inch Naval Gun Barrel Tube */}
                <rect
                  x={originX + 2.0 * scale}
                  y={centerY - 0.35 * scale}
                  width={(cartridge.case_length - 2.8) * scale}
                  height={0.7 * scale}
                  fill="#334155"
                  stroke="#00d2ff"
                  strokeWidth="1.5"
                />

                {/* Breech Cordite Powder Propellant */}
                <rect
                  x={originX + 2.0 * scale}
                  y={centerY - 0.3 * scale}
                  width={1.2 * scale}
                  height={0.6 * scale}
                  fill="url(#powderHatch)"
                  stroke="#ea580c"
                  strokeWidth="1"
                />

                {/* Hollow U-235 Projectile Bullet at Breech */}
                <rect
                  x={originX + 3.2 * scale}
                  y={centerY - 0.28 * scale}
                  width={0.9 * scale}
                  height={0.56 * scale}
                  fill="#10b981"
                  stroke="#34d399"
                  strokeWidth="1.5"
                />

                {/* Target U-235 Cylinder Rings at Muzzle */}
                <rect
                  x={originX + (cartridge.case_length - 1.8) * scale}
                  y={centerY - 0.28 * scale}
                  width={0.9 * scale}
                  height={0.56 * scale}
                  fill="#10b981"
                  stroke="#34d399"
                  strokeWidth="1.5"
                />

                {/* Internal Mechanism Labels */}
                <text
                  x={originX + 2.6 * scale}
                  y={centerY + 0.6 * scale}
                  fill="#f59e0b"
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                  fontWeight="bold"
                >
                  CORDITE CHARGE
                </text>
                <text
                  x={originX + (cartridge.case_length - 2.2) * scale}
                  y={centerY + 0.6 * scale}
                  fill="#10b981"
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                  fontWeight="bold"
                >
                  ☢ U-235 TARGET
                </text>
              </g>
            )}
          </g>
        ) : (
          /* ================= STANDARD CARTRIDGE RENDERING (5 MODES) ================= */
          <>
            {/* ================= CHAMBER OVERLAY & CHAMBER FIT LAYER ================= */}
            {needsChamber && (
              <g id="chamber-fit-layer">
                {/* When in chamber_fit mode, render surrounding receiver/barrel steel hatching */}
                {activeDrawingMode === 'chamber_fit' && (
                  <>
                    <path
                      d={`
                        M ${originX - 20} ${centerY - (reamer.chamber_rim_dia / 2 + 0.4) * scale}
                        L ${zChamberEnd + 40} ${centerY - (reamer.chamber_rim_dia / 2 + 0.4) * scale}
                        L ${zChamberEnd + 40} ${centerY - (reamer.pilot_diameter / 2) * scale}
                        L ${zChamberEnd} ${centerY - (reamer.pilot_diameter / 2) * scale}
                        ${chamberTopPath.split('L').slice(1).reverse().map(pt => 'L' + pt).join(' ')}
                        L ${originX - 20} ${centerY - (reamer.chamber_rim_dia / 2) * scale}
                        Z
                      `}
                      fill="url(#chamberHatch)"
                      opacity="0.85"
                    />
                    <path
                      d={`
                        M ${originX - 20} ${centerY + (reamer.chamber_rim_dia / 2 + 0.4) * scale}
                        L ${zChamberEnd + 40} ${centerY + (reamer.chamber_rim_dia / 2 + 0.4) * scale}
                        L ${zChamberEnd + 40} ${centerY + (reamer.pilot_diameter / 2) * scale}
                        L ${zChamberEnd} ${centerY + (reamer.pilot_diameter / 2) * scale}
                        ${chamberBottomPath.split('L').slice(1).reverse().map(pt => 'L' + pt).join(' ')}
                        L ${originX - 20} ${centerY + (reamer.chamber_rim_dia / 2) * scale}
                        Z
                      `}
                      fill="url(#chamberHatch)"
                      opacity="0.85"
                    />
                  </>
                )}

                {/* Chamber Reamer Profile Outline (Top & Bottom) */}
                <path
                  d={chamberTopPath}
                  fill="none"
                  stroke={activeTolerance === 'dual_envelope' ? 'var(--cad-cyan, #00f0ff)' : '#eab308'}
                  strokeWidth={activeDrawingMode === 'chamber_fit' ? '2' : activeTolerance === 'dual_envelope' ? '2.2' : '1.8'}
                  strokeDasharray={activeDrawingMode === 'chamber_fit' ? 'none' : activeTolerance === 'dual_envelope' ? '5,3' : '6,3'}
                />
                <path
                  d={chamberBottomPath}
                  fill="none"
                  stroke={activeTolerance === 'dual_envelope' ? 'var(--cad-cyan, #00f0ff)' : '#eab308'}
                  strokeWidth={activeDrawingMode === 'chamber_fit' ? '2' : activeTolerance === 'dual_envelope' ? '2.2' : '1.8'}
                  strokeDasharray={activeDrawingMode === 'chamber_fit' ? 'none' : activeTolerance === 'dual_envelope' ? '5,3' : '6,3'}
                />

                {/* Bore & Throat Stopping Milestone Lines */}
                <line
                  x1={zChamberEnd}
                  y1={centerY - (reamer.pilot_diameter / 2) * scale}
                  x2={zChamberEnd}
                  y2={centerY + (reamer.pilot_diameter / 2) * scale}
                  stroke="#eab308"
                  strokeWidth="1.8"
                />
                <line
                  x1={zChamberMouth}
                  y1={centerY - (reamer.chamber_neck_dia / 2) * scale - 12}
                  x2={zChamberMouth}
                  y2={centerY + (reamer.chamber_neck_dia / 2) * scale + 12}
                  stroke="#eab308"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.75"
                />
                <line
                  x1={zChamberFreeboreEnd}
                  y1={centerY - (reamer.freebore_dia / 2) * scale - 8}
                  x2={zChamberFreeboreEnd}
                  y2={centerY + (reamer.freebore_dia / 2) * scale + 8}
                  stroke="#eab308"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.65"
                />
              </g>
            )}

            {/* ================= BULLET DRAWING (INTERACTIVE) ================= */}
            {activeShowBullet && (
              <g
                id="interactive-cad-bullet"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDimensionClick(
                    e,
                    'bullet_diameter',
                    'Bullet Projectile & Factory Bullet Models',
                    'G₁',
                    pxTip + 35,
                    centerY
                  );
                }}
                onMouseEnter={() => setIsHoveringBullet(true)}
                onMouseLeave={() => setIsHoveringBullet(false)}
                opacity={activeDrawingMode === 'cutaway' || activeDrawingMode === 'half_section' ? 0.98 : 0.88}
                filter={isHoveringBullet ? 'drop-shadow(0 0 8px rgba(240, 136, 62, 0.9))' : undefined}
              >
                <title>{`Interactive Bullet: ${cartridge.bullet_diameter.toFixed(3)}" (${cartridge.bullet_weight_grains || 0}gr) • COAL: ${cartridge.coal.toFixed(3)}" — Click to select factory bullet models or configure caliber`}</title>
                {activeDrawingMode === 'wireframe' ? (
                  <>
                    {/* Seated shank hidden inside neck */}
                    <path
                      d={`M ${zBulletBase} ${centerY - rBullet} L ${pxMouth} ${centerY - rBullet} M ${zBulletBase} ${centerY + rBullet} L ${pxMouth} ${centerY + rBullet} M ${zBulletBase} ${centerY - rBullet} L ${zBulletBase} ${centerY + rBullet}`}
                      fill="none"
                      stroke="var(--cad-copper)"
                      strokeWidth="1.4"
                      strokeDasharray="4,2"
                    />
                    {/* Exposed ogive / nose */}
                    <path
                      d={`
                        M ${pxMouth} ${centerY - rBullet}
                        Q ${(pxMouth + pxTip) / 2} ${centerY - rBullet}, ${pxTip} ${centerY}
                        Q ${(pxMouth + pxTip) / 2} ${centerY + rBullet}, ${pxMouth} ${centerY + rBullet}
                      `}
                      fill="none"
                      stroke="var(--cad-copper)"
                      strokeWidth="1.6"
                    />
                  </>
                ) : activeDrawingMode === 'half_section' ? (
                  <>
                    {/* Top half bullet: cutaway solid copper */}
                    <path
                      d={`
                        M ${zBulletBase} ${centerY - rBullet}
                        L ${pxMouth} ${centerY - rBullet}
                        Q ${(pxMouth + pxTip) / 2} ${centerY - rBullet}, ${pxTip} ${centerY}
                        L ${zBulletBase} ${centerY}
                        Z
                      `}
                      fill="url(#copperGradient)"
                      stroke="var(--cad-copper)"
                      strokeWidth="1.6"
                    />
                    {/* Bottom half bullet: exterior copper */}
                    <path
                      d={`
                        M ${zBulletBase} ${centerY}
                        L ${pxTip} ${centerY}
                        Q ${(pxMouth + pxTip) / 2} ${centerY + rBullet}, ${pxMouth} ${centerY + rBullet}
                        L ${zBulletBase} ${centerY + rBullet}
                        Z
                      `}
                      fill="rgba(240, 136, 62, 0.25)"
                      stroke="var(--cad-copper)"
                      strokeWidth="1.6"
                    />
                  </>
                ) : (
                  /* Standard outline / cutaway / chamber_fit bullet */
                  <path
                    d={`
                      M ${zBulletBase} ${centerY - rBullet}
                      L ${pxMouth} ${centerY - rBullet}
                      Q ${(pxMouth + pxTip) / 2} ${centerY - rBullet}, ${pxTip} ${centerY}
                      Q ${(pxMouth + pxTip) / 2} ${centerY + rBullet}, ${pxMouth} ${centerY + rBullet}
                      L ${zBulletBase} ${centerY + rBullet}
                      Z
                    `}
                    fill={activeDrawingMode === 'cutaway' ? 'url(#copperGradient)' : 'rgba(240, 136, 62, 0.2)'}
                    stroke="var(--cad-copper)"
                    strokeWidth="1.6"
                  />
                )}
              </g>
            )}

            {/* Floating hover badge when hovering bullet projectile on CAD model */}
            {activeShowBullet && isHoveringBullet && (
              <g pointerEvents="none">
                <rect
                  x={(pxMouth + pxTip) / 2 - 85}
                  y={centerY - rBullet - 26}
                  width={170}
                  height={18}
                  rx={3}
                  fill="rgba(10, 13, 19, 0.95)"
                  stroke="var(--cad-copper)"
                  strokeWidth="0.9"
                />
                <text
                  x={(pxMouth + pxTip) / 2}
                  y={centerY - rBullet - 14}
                  fill="#fff"
                  fontSize="8.5"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  🎯 Projectile: {cartridge.bullet_diameter.toFixed(3)}" ({cartridge.bullet_weight_grains || 0}gr) • Click
                </text>
              </g>
            )}

            {/* ================= CARTRIDGE CASE DRAWING ================= */}
            {/* 1. CUTAWAY MODE: Full Longitudinal Cross-Section */}
            {activeDrawingMode === 'cutaway' && (
              <>
                {/* Powder Column Cavity */}
                <path
                  d={`
                    M ${originX + cartridge.web_thickness * scale} ${centerY - getInnerRadiusAt(cartridge, cartridge.web_thickness) * scale}
                    ${innerTopPath.substring(innerTopPath.indexOf('L'))}
                    L ${pxMouth} ${centerY + rInnerMouth}
                    ${innerBottomPath.substring(innerBottomPath.indexOf('L'))}
                    Z
                  `}
                  fill="url(#powderHatch)"
                />

                {/* Solid Head / Web Section */}
                <rect
                  x={originX}
                  y={centerY - rRim}
                  width={cartridge.web_thickness * scale}
                  height={rRim * 2}
                  fill="url(#brassGradient)"
                  opacity="0.3"
                />

                {/* Primer Pocket */}
                {cartridge.primer_pocket_dia > 0 && (
                  <rect
                    x={originX}
                    y={centerY - (cartridge.primer_pocket_dia / 2) * scale}
                    width={cartridge.primer_pocket_depth * scale}
                    height={cartridge.primer_pocket_dia * scale}
                    fill="#090d14"
                    stroke="var(--cad-cyan)"
                    strokeWidth="1"
                  />
                )}

                {/* Flash Hole */}
                {cartridge.flash_hole_dia > 0 && (
                  <rect
                    x={originX + cartridge.primer_pocket_depth * scale}
                    y={centerY - (cartridge.flash_hole_dia / 2) * scale}
                    width={Math.max(0, cartridge.web_thickness - cartridge.primer_pocket_depth) * scale}
                    height={cartridge.flash_hole_dia * scale}
                    fill="#090d14"
                    stroke="var(--cad-cyan)"
                    strokeWidth="1"
                  />
                )}

                {/* Outer Casing Outline */}
                <path
                  d={`
                    ${outerTopPath}
                    L ${pxMouth} ${centerY - rInnerMouth}
                    L ${pxMouth} ${centerY + rInnerMouth}
                    ${outerBottomPath}
                    L ${originX} ${centerY}
                    Z
                  `}
                  fill="none"
                  stroke="var(--cad-cyan)"
                  strokeWidth="1.8"
                />

                {/* Inner Walls in Cutaway Mode */}
                <path d={innerTopPath} fill="none" stroke="#e5be59" strokeWidth="1.4" strokeDasharray="5,2" />
                <path d={innerBottomPath} fill="none" stroke="#e5be59" strokeWidth="1.4" strokeDasharray="5,2" />
              </>
            )}

            {/* 2. HALF-SECTION MODE: Top Half Cutaway / Bottom Half Solid Exterior */}
            {activeDrawingMode === 'half_section' && (
              <>
                {/* Top Half: Powder Column Hatch */}
                <path
                  d={`
                    M ${originX + cartridge.web_thickness * scale} ${centerY}
                    L ${originX + cartridge.web_thickness * scale} ${centerY - getInnerRadiusAt(cartridge, cartridge.web_thickness) * scale}
                    ${innerTopPath.substring(innerTopPath.indexOf('L'))}
                    L ${pxMouth} ${centerY}
                    Z
                  `}
                  fill="url(#powderHatch)"
                />

                {/* Top Half: Solid Web Head */}
                <rect
                  x={originX}
                  y={centerY - rRim}
                  width={cartridge.web_thickness * scale}
                  height={rRim}
                  fill="url(#brassGradient)"
                  opacity="0.35"
                />

                {/* Top Half: Primer Pocket */}
                {cartridge.primer_pocket_dia > 0 && (
                  <rect
                    x={originX}
                    y={centerY - (cartridge.primer_pocket_dia / 2) * scale}
                    width={cartridge.primer_pocket_depth * scale}
                    height={(cartridge.primer_pocket_dia / 2) * scale}
                    fill="#090d14"
                    stroke="var(--cad-cyan)"
                    strokeWidth="1"
                  />
                )}

                {/* Top Half: Flash Hole */}
                {cartridge.flash_hole_dia > 0 && (
                  <rect
                    x={originX + cartridge.primer_pocket_depth * scale}
                    y={centerY - (cartridge.flash_hole_dia / 2) * scale}
                    width={Math.max(0, cartridge.web_thickness - cartridge.primer_pocket_depth) * scale}
                    height={(cartridge.flash_hole_dia / 2) * scale}
                    fill="#090d14"
                    stroke="var(--cad-cyan)"
                    strokeWidth="1"
                  />
                )}

                {/* Top Half: Inner Wall */}
                <path d={innerTopPath} fill="none" stroke="#e5be59" strokeWidth="1.4" strokeDasharray="5,2" />

                {/* Bottom Half: Solid Exterior Fill */}
                <path
                  d={`
                    M ${originX} ${centerY}
                    ${outerBottomPath.substring(outerBottomPath.indexOf('L'))}
                    L ${pxMouth} ${centerY}
                    Z
                  `}
                  fill="rgba(0, 210, 255, 0.05)"
                  stroke="none"
                />

                {/* Full Outer Profile Outline */}
                <path
                  d={`
                    ${outerTopPath}
                    L ${pxMouth} ${centerY - rInnerMouth}
                    L ${pxMouth} ${centerY}
                    L ${pxMouth} ${centerY + rMouth}
                    ${outerBottomPath}
                    L ${originX} ${centerY}
                    Z
                  `}
                  fill="none"
                  stroke="var(--cad-cyan)"
                  strokeWidth="1.8"
                />
              </>
            )}

            {/* 3. WIREFRAME MODE: Pure CAD Lines with Hidden Contours */}
            {activeDrawingMode === 'wireframe' && (
              <>
                {/* Outer Profile Wireframe (No Fill) */}
                <path
                  d={`
                    ${outerTopPath}
                    L ${pxMouth} ${centerY - rMouth}
                    L ${pxMouth} ${centerY + rMouth}
                    ${outerBottomPath}
                    L ${originX} ${centerY}
                    Z
                  `}
                  fill="none"
                  stroke="var(--cad-cyan)"
                  strokeWidth="1.6"
                />

                {/* Inner Cavity Dashed Hidden Lines */}
                <path d={innerTopPath} fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4,3" opacity="0.85" />
                <path d={innerBottomPath} fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4,3" opacity="0.85" />

                {/* Web Thickness Boundary Line */}
                <line
                  x1={originX + cartridge.web_thickness * scale}
                  y1={centerY - getInnerRadiusAt(cartridge, cartridge.web_thickness) * scale}
                  x2={originX + cartridge.web_thickness * scale}
                  y2={centerY + getInnerRadiusAt(cartridge, cartridge.web_thickness) * scale}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="4,3"
                  opacity="0.85"
                />

                {/* Primer Pocket Wireframe */}
                {cartridge.primer_pocket_dia > 0 && (
                  <rect
                    x={originX}
                    y={centerY - (cartridge.primer_pocket_dia / 2) * scale}
                    width={cartridge.primer_pocket_depth * scale}
                    height={cartridge.primer_pocket_dia * scale}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="3,2"
                  />
                )}

                {/* Extended Shoulder Construction Lines */}
                {!isStraightWall(cartridge) && (
                  <g opacity="0.4">
                    <line
                      x1={pxShoulderStart - 20}
                      y1={centerY - (cartridge.shoulder_start_diameter / 2) * scale + 5}
                      x2={pxShoulderEnd + 40}
                      y2={centerY - (cartridge.neck_diameter_base / 2) * scale - 10}
                      stroke="var(--cad-brass)"
                      strokeWidth="0.8"
                      strokeDasharray="2,2"
                    />
                    <line
                      x1={pxShoulderStart - 20}
                      y1={centerY + (cartridge.shoulder_start_diameter / 2) * scale - 5}
                      x2={pxShoulderEnd + 40}
                      y2={centerY + (cartridge.neck_diameter_base / 2) * scale + 10}
                      stroke="var(--cad-brass)"
                      strokeWidth="0.8"
                      strokeDasharray="2,2"
                    />
                  </g>
                )}
              </>
            )}

            {/* 4. OUTLINE & CHAMBER_FIT MODES: Crisp Exterior Silhouette */}
            {(activeDrawingMode === 'outline' || activeDrawingMode === 'chamber_fit') && (
              <path
                d={`
                  ${outerTopPath}
                  L ${pxMouth} ${centerY - rMouth}
                  L ${pxMouth} ${centerY + rMouth}
                  ${outerBottomPath}
                  L ${originX} ${centerY}
                  Z
                `}
                fill={activeDrawingMode === 'chamber_fit' ? 'rgba(0, 210, 255, 0.08)' : 'rgba(0, 210, 255, 0.04)'}
                stroke="var(--cad-cyan)"
                strokeWidth="1.8"
              />
            )}
          </>
        )}

        {/* ================= INTERACTIVE SAAMI / CIP DIMENSION CALLOUTS ================= */}
        {/* ================= INTERACTIVE SAAMI / CIP DIMENSION CALLOUTS ================= */}
        {activeShowDimensions && (() => {
          const datumHeadspace = calculateDatumHeadspace(cartridge);
          const cipDeltaL = calculateCIPDeltaL(cartridge);

          return (
            <g id="dimension-callouts-group">
              {/* SAAMI Datum Headspace Line & Circle Overlay */}
              {activeStandard === 'saami' && !isStraightWall(cartridge) && datumHeadspace.datum_length > 0 && (
                <g id="saami-datum-headspace-callout">
                  {/* Horizontal Datum Intersection Lines */}
                  <line
                    x1={originX}
                    y1={centerY - (datumHeadspace.datum_diameter / 2) * scale}
                    x2={originX + datumHeadspace.datum_length * scale}
                    y2={centerY - (datumHeadspace.datum_diameter / 2) * scale}
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.85"
                  />
                  <line
                    x1={originX}
                    y1={centerY + (datumHeadspace.datum_diameter / 2) * scale}
                    x2={originX + datumHeadspace.datum_length * scale}
                    y2={centerY + (datumHeadspace.datum_diameter / 2) * scale}
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.85"
                  />
                  {/* Vertical Datum Plane Line */}
                  <line
                    x1={originX + datumHeadspace.datum_length * scale}
                    y1={centerY - (datumHeadspace.datum_diameter / 2) * scale - 14}
                    x2={originX + datumHeadspace.datum_length * scale}
                    y2={centerY + (datumHeadspace.datum_diameter / 2) * scale + 14}
                    stroke="#3b82f6"
                    strokeWidth="1.2"
                    strokeDasharray="4,2"
                  />
                  {/* Datum Intersection Points */}
                  <circle
                    cx={originX + datumHeadspace.datum_length * scale}
                    cy={centerY - (datumHeadspace.datum_diameter / 2) * scale}
                    r="3.5"
                    fill="#3b82f6"
                    stroke="#fff"
                    strokeWidth="1"
                  />
                  <circle
                    cx={originX + datumHeadspace.datum_length * scale}
                    cy={centerY + (datumHeadspace.datum_diameter / 2) * scale}
                    r="3.5"
                    fill="#3b82f6"
                    stroke="#fff"
                    strokeWidth="1"
                  />
                  {/* Leader line and Datum Headspace badge */}
                  <line
                    x1={originX}
                    y1={centerY - (datumHeadspace.datum_diameter / 2) * scale - 28}
                    x2={originX + datumHeadspace.datum_length * scale}
                    y2={centerY - (datumHeadspace.datum_diameter / 2) * scale - 28}
                    stroke="#3b82f6"
                    strokeWidth="1.2"
                    markerStart="url(#arrow)"
                    markerEnd="url(#arrow)"
                  />
                  <line
                    x1={originX}
                    y1={centerY - (datumHeadspace.datum_diameter / 2) * scale - 8}
                    x2={originX}
                    y2={centerY - (datumHeadspace.datum_diameter / 2) * scale - 32}
                    stroke="#485466"
                    strokeWidth="0.8"
                  />
                  <line
                    x1={originX + datumHeadspace.datum_length * scale}
                    y1={centerY - (datumHeadspace.datum_diameter / 2) * scale - 8}
                    x2={originX + datumHeadspace.datum_length * scale}
                    y2={centerY - (datumHeadspace.datum_diameter / 2) * scale - 32}
                    stroke="#485466"
                    strokeWidth="0.8"
                  />
                  {renderDimensionBadge(
                    originX + (datumHeadspace.datum_length * scale) / 2,
                    centerY - (datumHeadspace.datum_diameter / 2) * scale - 28,
                    `Datum Ø${datumHeadspace.datum_diameter.toFixed(3)}" @ ${fmt(datumHeadspace.datum_length)}`,
                    'case_length',
                    'SAAMI Datum Headspace',
                    'L_datum',
                    '#60a5fa',
                    false,
                    'middle'
                  )}
                </g>
              )}

              {/* C.I.P. Delta L Safety Margin Callout */}
              {activeStandard === 'cip' && (
                <g id="cip-delta-l-badge" transform={`translate(${originX + 15}, ${centerY + rRim + 95})`}>
                  <rect
                    x="0"
                    y="0"
                    width="230"
                    height="24"
                    rx="4"
                    fill="rgba(168, 85, 247, 0.15)"
                    stroke={cipDeltaL.isSafe ? '#a855f7' : '#ef4444'}
                    strokeWidth="1"
                  />
                  <circle
                    cx="14"
                    cy="12"
                    r="4"
                    fill={cipDeltaL.isSafe ? '#10b981' : '#ef4444'}
                  />
                  <text
                    x="26"
                    y="16"
                    fill="#e2e8f0"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                  >
                    C.I.P. ΔL: {cipDeltaL.deltaL_mm.toFixed(3)} mm ({cipDeltaL.isSafe ? 'PASS' : 'WARN'})
                  </text>
                </g>
              )}

              {/* 1. Rim Diameter (R1) */}
              <g>
                <line x1={originX - 25} y1={centerY - rRim} x2={originX} y2={centerY - rRim} stroke="#485466" strokeWidth="0.8" />
                <line x1={originX - 25} y1={centerY + rRim} x2={originX} y2={centerY + rRim} stroke="#485466" strokeWidth="0.8" />
                <line x1={originX - 20} y1={centerY - rRim} x2={originX - 20} y2={centerY + rRim} stroke="var(--cad-cyan)" strokeWidth="1.2" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                {renderDimensionBadge(
                  originX - 60,
                  centerY,
                  getBadgeText('rim_diameter', cartridge.rim_diameter, 'R₁', 'R₁', 'diameter'),
                  'rim_diameter',
                  'Rim Diameter',
                  'R₁',
                  'var(--cad-cyan)',
                  false,
                  'middle'
                )}
              </g>

              {/* 2. Rim Thickness (R) Callout */}
              <g>
                <line x1={originX} y1={centerY + rRim + 10} x2={originX} y2={centerY + rRim + 25} stroke="#485466" strokeWidth="0.8" />
                <line x1={pxRim} y1={centerY + rRim + 10} x2={pxRim} y2={centerY + rRim + 25} stroke="#485466" strokeWidth="0.8" />
                <line x1={originX} y1={centerY + rRim + 20} x2={pxRim} y2={centerY + rRim + 20} stroke="var(--cad-cyan)" strokeWidth="1" />
                {renderDimensionBadge(
                  (originX + pxRim) / 2,
                  centerY + rRim + 18,
                  getBadgeText('rim_thickness', cartridge.rim_thickness, 'R', 'R', 'length'),
                  'rim_thickness',
                  'Rim Thickness',
                  'R',
                  'var(--cad-cyan)',
                  false,
                  'middle'
                )}
              </g>

              {/* 3. Base Diameter (P1) Callout */}
              <g>
                <line x1={pxExt} y1={centerY - (cartridge.base_diameter / 2) * scale} x2={pxExt} y2={centerY - rRim - 15} stroke="#485466" strokeWidth="0.8" />
                <line x1={pxExt} y1={centerY + (cartridge.base_diameter / 2) * scale} x2={pxExt} y2={centerY + rRim + 25} stroke="#485466" strokeWidth="0.8" />
                {renderDimensionBadge(
                  pxExt,
                  centerY - rRim - 25,
                  getBadgeText('base_diameter', cartridge.base_diameter, 'P₁', 'P₁', 'diameter'),
                  'base_diameter',
                  'Base Diameter',
                  'P₁',
                  'var(--cad-cyan)',
                  false,
                  'middle'
                )}
              </g>

              {/* 4. Shoulder Start Diameter (P2) Callout */}
              {!isStraightWall(cartridge) && (
                <g>
                  <line x1={pxShoulderStart} y1={centerY - (cartridge.shoulder_start_diameter / 2) * scale} x2={pxShoulderStart} y2={centerY - rRim - 15} stroke="#485466" strokeWidth="0.8" />
                  {renderDimensionBadge(
                    pxShoulderStart,
                    centerY - rRim - 25,
                    getBadgeText('shoulder_start_diameter', cartridge.shoulder_start_diameter, 'P₂', 'P₂', 'diameter'),
                    'shoulder_start_diameter',
                    'Shoulder Base Diameter',
                    'P₂',
                    'var(--cad-cyan)',
                    false,
                    'middle'
                  )}
                </g>
              )}

              {/* 5. Neck Mouth Diameter (H2) Callout */}
              <g>
                <line x1={pxMouth} y1={centerY - (cartridge.neck_diameter_mouth / 2) * scale} x2={pxMouth} y2={centerY - rRim - 15} stroke="#485466" strokeWidth="0.8" />
                {renderDimensionBadge(
                  pxMouth,
                  centerY - rRim - 25,
                  getBadgeText('neck_diameter_mouth', cartridge.neck_diameter_mouth, 'H₂', 'H₂', 'diameter'),
                  'neck_diameter_mouth',
                  'Neck Mouth Diameter',
                  'H₂',
                  'var(--cad-cyan)',
                  false,
                  'middle'
                )}
              </g>

              {/* 6. Bullet Diameter (G1) Callout */}
              {activeShowBullet && (
                <g>
                  <line x1={pxTip - 15} y1={centerY - rBullet} x2={pxTip + 15} y2={centerY - rBullet} stroke="#485466" strokeWidth="0.8" />
                  <line x1={pxTip - 15} y1={centerY + rBullet} x2={pxTip + 15} y2={centerY + rBullet} stroke="#485466" strokeWidth="0.8" />
                  <line x1={pxTip + 10} y1={centerY - rBullet} x2={pxTip + 10} y2={centerY + rBullet} stroke="var(--cad-copper)" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                  {renderDimensionBadge(
                    pxTip + 48,
                    centerY,
                    getBadgeText('bullet_diameter', cartridge.bullet_diameter, 'G₁', 'G₁', 'diameter'),
                    'bullet_diameter',
                    'Bullet Diameter',
                    'G₁',
                    'var(--cad-copper)',
                    false,
                    'middle'
                  )}
                </g>
              )}

              {/* Body Length (L1) Callout - Primary Shoulder Datum */}
              {!isStraightWall(cartridge) && (
                <g>
                  <line x1={originX} y1={centerY + rRim + 28} x2={originX} y2={centerY + rRim + 50} stroke="#485466" strokeWidth="0.8" />
                  <line x1={pxShoulderStart} y1={centerY + rRim + 28} x2={pxShoulderStart} y2={centerY + rRim + 50} stroke="#485466" strokeWidth="0.8" />
                  <line x1={originX} y1={centerY + rRim + 40} x2={pxShoulderStart} y2={centerY + rRim + 40} stroke="var(--cad-cyan)" strokeWidth="1.1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                  {renderDimensionBadge(
                    (originX + pxShoulderStart) / 2,
                    centerY + rRim + 40,
                    getBadgeText('body_length', cartridge.body_length, 'L₁', 'L₁', 'length'),
                    'body_length',
                    'Body Length',
                    'L₁',
                    'var(--cad-cyan)',
                    false,
                    'middle'
                  )}
                </g>
              )}

              {/* 7. Case Length (L3) Callout */}
              <g>
                <line x1={originX} y1={centerY + rRim + 52} x2={originX} y2={centerY + rRim + 75} stroke="#485466" strokeWidth="0.8" />
                <line x1={pxMouth} y1={centerY + rRim + 52} x2={pxMouth} y2={centerY + rRim + 75} stroke="#485466" strokeWidth="0.8" />
                <line x1={originX} y1={centerY + rRim + 65} x2={pxMouth} y2={centerY + rRim + 65} stroke="var(--cad-cyan)" strokeWidth="1.2" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                {renderDimensionBadge(
                  (originX + pxMouth) / 2,
                  centerY + rRim + 65,
                  getBadgeText('case_length', cartridge.case_length, 'L₃', 'L₃', 'length'),
                  'case_length',
                  'Case Length',
                  'L₃',
                  'var(--cad-cyan)',
                  false,
                  'middle'
                )}
              </g>

              {/* 8. Overall Length (L6 / COAL) Callout */}
              {activeShowBullet && (
                <g>
                  <line x1={originX} y1={centerY + rRim + 76} x2={originX} y2={centerY + rRim + 100} stroke="#485466" strokeWidth="0.8" />
                  <line x1={pxTip} y1={centerY + rRim + 76} x2={pxTip} y2={centerY + rRim + 100} stroke="#485466" strokeWidth="0.8" />
                  <line x1={originX} y1={centerY + rRim + 90} x2={pxTip} y2={centerY + rRim + 90} stroke="var(--cad-cyan)" strokeWidth="1.2" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                  {renderDimensionBadge(
                    (originX + pxTip) / 2,
                    centerY + rRim + 90,
                    getBadgeText('coal', cartridge.coal, 'L₆', 'COAL', 'length'),
                    'coal',
                    'Cartridge Overall Length',
                    'COAL',
                    'var(--cad-cyan)',
                    false,
                    'middle'
                  )}
                </g>
              )}

              {/* 9. Shoulder Angle (α) Callout - Elevated to Tier 2 with leader to avoid P₂ badge overlap */}
              {!isStraightWall(cartridge) && (() => {
                const neckBase = cartridge.neck_diameter_base || cartridge.neck_diameter_mouth;
                const shoulderMidY = centerY - ((cartridge.shoulder_start_diameter + neckBase) / 4) * scale;
                const shoulderMidX = (pxShoulderStart + pxShoulderEnd) / 2;
                const alphaX = Math.max(pxShoulderStart + 36, shoulderMidX);
                const alphaY = centerY - rRim - 56;

                return (
                  <g id="shoulder-angle-callout">
                    {/* CAD Leader Line & Shoulder Reference Dot */}
                    <line
                      x1={shoulderMidX}
                      y1={shoulderMidY}
                      x2={alphaX}
                      y2={alphaY + 11}
                      stroke="var(--cad-brass)"
                      strokeWidth="0.8"
                      strokeDasharray="3,2"
                      opacity="0.85"
                    />
                    <circle
                      cx={shoulderMidX}
                      cy={shoulderMidY}
                      r="2.5"
                      fill="var(--cad-brass)"
                    />
                    {renderDimensionBadge(
                      alphaX,
                      alphaY,
                      getBadgeText('shoulder_angle', cartridge.shoulder_angle, 'α', 'α', 'angle'),
                      'shoulder_angle',
                      'Shoulder Angle',
                      'α',
                      'var(--cad-brass)',
                      true,
                      'middle'
                    )}
                  </g>
                );
              })()}

            {/* 10. Cutaway & Half-Section Specific Dimensions */}
            {(activeDrawingMode === 'cutaway' || activeDrawingMode === 'half_section') && (
              <g id="cutaway-internal-dimensions">
                {/* Web Thickness */}
                {renderDimensionBadge(
                  originX + (cartridge.web_thickness * scale) / 2,
                  centerY - rRim - 10,
                  `Web: ${fmt(cartridge.web_thickness)}`,
                  'web_thickness',
                  'Web Head Thickness',
                  'Web',
                  '#e5be59',
                  false,
                  'middle'
                )}
                {/* Base Wall */}
                {renderDimensionBadge(
                  pxExt + 20,
                  centerY + 18,
                  `Wall: ${fmt(cartridge.base_wall_thickness, 3)}`,
                  'base_wall_thickness',
                  'Base Wall Thickness',
                  'Wall',
                  '#e5be59',
                  false,
                  'middle'
                )}
              </g>
            )}
          </g>
        );
      })()}
        </g>
      </svg>
    </div>
  );
};

const stepperStyle: React.CSSProperties = {
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  color: 'var(--text-secondary)',
  fontSize: '10px',
  fontFamily: 'var(--font-mono)',
  padding: '4px 2px',
  cursor: 'pointer',
  textAlign: 'center',
};
