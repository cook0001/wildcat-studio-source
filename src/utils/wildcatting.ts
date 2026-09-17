import { CartridgeSpec } from '../types/cartridge';
import { calculateVolumetrics } from './volumetrics';
import { CALIBER_PRESETS } from '../data/bullets';

export interface CaliberOption {
  inches: number;
  mm: number;
  designation: string;
  typicalWeightGrains: number;
  typicalBulletLength: number;
  typicalSeatingDepth: number;
}

export interface FormingStep {
  stepNumber: number;
  title: string;
  description: string;
  tooling: string;
  isCaution?: boolean;
}

export interface WildcatTransformResult {
  cartridge: CartridgeSpec;
  neckThicknessDeltaPercent: number;
  requiresNeckTurning: boolean;
  requiresIntermediateDies: boolean;
  formingSteps: FormingStep[];
  estimatedCapacityDeltaPercent: number;
}

export const STANDARD_CALIBERS: CaliberOption[] = CALIBER_PRESETS.map(p => ({
  inches: p.inches,
  mm: p.mm,
  designation: p.designation,
  typicalWeightGrains: p.typicalWeightGrains,
  typicalBulletLength: p.typicalBulletLength,
  typicalSeatingDepth: p.typicalSeatingDepth,
}));

export interface ActionPreset {
  id: string;
  name: string;
  maxCoal: number;
  description: string;
}

export const ACTION_PRESETS: ActionPreset[] = [
  { id: 'ar15', name: 'AR-15 / Small Frame', maxCoal: 2.260, description: 'Standard STANAG AR-15 / M4 magazine length' },
  { id: 'short', name: 'Short Action (AR-10 / AICS)', maxCoal: 2.820, description: 'Short Action (.308 Win / 6.5 Creedmoor / AICS mag)' },
  { id: 'long', name: 'Standard Long Action', maxCoal: 3.340, description: 'Standard Long Action (.30-06 / .270 Win / .280 Rem)' },
  { id: 'magnum', name: 'Magnum Long Action', maxCoal: 3.600, description: 'Magnum Action (.300 Win Mag / 7mm Rem Mag / .375 H&H)' },
  { id: 'elr', name: 'ELR / Lapua Action', maxCoal: 3.900, description: 'Extreme Long Range (.338 Lapua / .300 Norma Mag)' }
];

/**
 * Transforms a parent case by necking up or down to a new target caliber
 */
export function transformNeckCaliber(
  parent: CartridgeSpec,
  targetCaliber: CaliberOption,
  customName?: string
): WildcatTransformResult {
  const oldDia = parent.bullet_diameter;
  const newDia = targetCaliber.inches;
  const ratio = oldDia / newDia;

  // Neck wall thickness changes inversely with diameter due to metal volume conservation
  const rawNewThickness = parent.neck_wall_thickness * Math.sqrt(ratio);
  const newNeckThickness = Math.round(Math.max(0.009, Math.min(0.024, rawNewThickness)) * 10000) / 10000;
  const thicknessDeltaPercent = Math.round(((newNeckThickness - parent.neck_wall_thickness) / parent.neck_wall_thickness) * 100);

  // New neck mouth diameter H2 = bullet_dia + 2 * neck_wall_thickness
  const newNeckMouth = Math.round((newDia + 2 * newNeckThickness) * 1000) / 1000;
  
  // Preserve neck taper or adjust base
  const neckTaper = Math.max(0, parent.neck_diameter_base - parent.neck_diameter_mouth);
  const newNeckBase = Math.round((newNeckMouth + neckTaper) * 1000) / 1000;

  // Ensure shoulder start diameter P2 is safely larger than new neck base
  const newShoulderStart = Math.max(parent.shoulder_start_diameter, newNeckBase + 0.025);

  const newSeatingDepth = targetCaliber.typicalSeatingDepth;
  const newCoal = Math.round((parent.case_length + targetCaliber.typicalBulletLength - newSeatingDepth) * 1000) / 1000;

  const generatedName = customName || `${parent.name.replace(/\s*\(.*\)/, '')}-${targetCaliber.designation.split(' ')[0]} Wildcat`;

  const newCartridge: CartridgeSpec = {
    ...parent,
    id: `wildcat_${parent.id}_to_${targetCaliber.inches.toString().replace('.', '')}`,
    name: generatedName,
    standard: 'Wildcat',
    bullet_diameter: newDia,
    bullet_length: targetCaliber.typicalBulletLength,
    bullet_weight_grains: targetCaliber.typicalWeightGrains,
    neck_wall_thickness: newNeckThickness,
    neck_diameter_mouth: newNeckMouth,
    neck_diameter_base: newNeckBase,
    shoulder_start_diameter: newShoulderStart,
    seating_depth: newSeatingDepth,
    coal: newCoal
  };

  // Check forming requirements
  const diaReduction = oldDia - newDia;
  const requiresIntermediateDies = diaReduction > 0.035;
  const requiresNeckTurning = newNeckThickness > 0.0155;

  const formingSteps: FormingStep[] = [];
  let stepNum = 1;

  if (diaReduction > 0) {
    // Necking Down
    if (requiresIntermediateDies) {
      const midCal = STANDARD_CALIBERS.filter(c => c.inches < oldDia && c.inches > newDia);
      const intermediateCal = midCal.length > 0 ? midCal[Math.floor(midCal.length / 2)].designation : 'intermediate size';
      formingSteps.push({
        stepNumber: stepNum++,
        title: 'Intermediate Neck Reduction',
        description: `Diameter reduction of ${(diaReduction * 25.4).toFixed(2)}mm (${diaReduction.toFixed(3)}") is too steep for a single die. Pass parent brass through a ${intermediateCal} sizing die first to prevent shoulder buckling.`,
        tooling: 'Intermediate Full-Length or Bushing Die'
      });
    }

    formingSteps.push({
      stepNumber: stepNum++,
      title: 'Final Neck Sizing',
      description: `Run brass into final ${newDia}" wildcat sizing die with appropriate neck bushing (${(newNeckMouth - 0.002).toFixed(3)}" bushing for 0.002" neck tension).`,
      tooling: 'Custom Wildcat Sizer Die'
    });

    if (requiresNeckTurning) {
      formingSteps.push({
        stepNumber: stepNum++,
        title: 'Outside Neck Turning Required',
        description: `Necking down compressed brass thickness to ${newNeckThickness}". Outside neck turn brass down to 0.012" - 0.013" to prevent chamber neck pinch and dangerous overpressure.`,
        tooling: 'Precision Case Neck Turning Tool',
        isCaution: true
      });
    }

    formingSteps.push({
      stepNumber: stepNum++,
      title: 'Case Mouth Chamfer & Deburr',
      description: 'Deburr and VLD-chamfer case mouth at 22° for smooth bullet seating without shaving copper jacket.',
      tooling: 'VLD Chamfer / Deburring Tool'
    });
  } else {
    // Necking Up
    formingSteps.push({
      stepNumber: stepNum++,
      title: 'Expander Mandrel Neck Expansion',
      description: `Expand neck from ${oldDia}" to ${newDia}" using carbide tapered expander mandrel with quality case neck lubricant.`,
      tooling: 'Tapered Carbide Expander Mandrel'
    });

    formingSteps.push({
      stepNumber: stepNum++,
      title: 'Neck Annealing Recommended',
      description: 'Necking up induces tensile work-hardening. Anneal case necks to prevent split necks during fireforming.',
      tooling: 'Flame or Induction Annealer'
    });
  }

  // Calculate capacity change
  const parentVol = calculateVolumetrics(parent);
  const newVol = calculateVolumetrics(newCartridge);
  const capacityDelta = Math.round(((newVol.overflow_capacity_grains_h2o - parentVol.overflow_capacity_grains_h2o) / parentVol.overflow_capacity_grains_h2o) * 100);

  return {
    cartridge: newCartridge,
    neckThicknessDeltaPercent: thicknessDeltaPercent,
    requiresNeckTurning,
    requiresIntermediateDies,
    formingSteps,
    estimatedCapacityDeltaPercent: capacityDelta
  };
}

/**
 * Transforms a parent case by blowing out body taper and sharpening shoulder angle (Ackley Improved fireforming)
 */
export function transformAckleyFireform(
  parent: CartridgeSpec,
  targetAngle: number = 40.0,
  blowoutInches: number = 0.012,
  customName?: string
): WildcatTransformResult {
  // Straighten body taper: P2 increases toward P1
  const maxP2 = Math.round((parent.base_diameter - 0.005) * 1000) / 1000;
  const newP2 = Math.min(maxP2, Math.round((parent.shoulder_start_diameter + blowoutInches) * 1000) / 1000);

  // Extend body length slightly, sharp shoulder reduces shoulder length
  const bodyExtend = 0.035;
  const newBodyLen = Math.round((parent.body_length + bodyExtend) * 1000) / 1000;
  const newShoulderLen = Math.round(Math.max(0.045, (parent.shoulder_length * 0.5)) * 1000) / 1000;

  // Fireforming length draw: expanding brass into a 40° shoulder draws metal, reducing case length slightly
  const drawShrinkage = 0.008;
  const newCaseLen = Math.round((parent.case_length - drawShrinkage) * 1000) / 1000;

  const generatedName = customName || `${parent.name.replace(/\s*\(.*\)/, '')} AI ${targetAngle}°`;

  const newCartridge: CartridgeSpec = {
    ...parent,
    id: `wildcat_${parent.id}_ai_${targetAngle}`,
    name: generatedName,
    standard: 'Wildcat',
    shoulder_angle: targetAngle,
    shoulder_start_diameter: newP2,
    body_length: newBodyLen,
    shoulder_length: newShoulderLen,
    case_length: newCaseLen,
  };

  const formingSteps: FormingStep[] = [
    {
      stepNumber: 1,
      title: 'Initial Chamber Headspace Verification',
      description: 'Ensure parent factory cartridge headspaces with a slight crush fit against the shoulder-neck junction when chambering in new Ackley chamber.',
      tooling: 'Headspace Go/No-Go Gauges'
    },
    {
      stepNumber: 2,
      title: 'Fireforming Load Assembly',
      description: `Assemble fireforming loads with a mild charge of medium-burn propellant and standard bullet seated 0.015" into rifling lands to hold case firmly against bolt face.`,
      tooling: 'Seating Die set for jammed bullet'
    },
    {
      stepNumber: 3,
      title: 'Discharge & Hydraulic Fireforming',
      description: `Discharge cartridge. Chamber pressure forces brass body outward to fill the ${targetAngle}° chamber walls.`,
      tooling: 'Rifle Barrel Chambered to Ackley Spec'
    },
    {
      stepNumber: 4,
      title: 'Trim to Length & Neck Uniforming',
      description: `Fireforming draws neck metal back into shoulder. Trim square to ${(newCaseLen).toFixed(3)}" and deburr.`,
      tooling: 'Rotary Case Trimmer'
    }
  ];

  const parentVol = calculateVolumetrics(parent);
  const newVol = calculateVolumetrics(newCartridge);
  const capacityDelta = Math.round(((newVol.overflow_capacity_grains_h2o - parentVol.overflow_capacity_grains_h2o) / parentVol.overflow_capacity_grains_h2o) * 100);

  return {
    cartridge: newCartridge,
    neckThicknessDeltaPercent: 0,
    requiresNeckTurning: false,
    requiresIntermediateDies: false,
    formingSteps,
    estimatedCapacityDeltaPercent: capacityDelta
  };
}

/**
 * Truncates or extends case length to match specific rifle action magazine limits
 */
export function transformActionTruncation(
  parent: CartridgeSpec,
  targetAction: ActionPreset
): CartridgeSpec {
  if (parent.coal <= targetAction.maxCoal) {
    return parent; // Already fits
  }

  const excess = parent.coal - targetAction.maxCoal;
  const newCaseLen = Math.round(Math.max(0.800, parent.case_length - excess) * 1000) / 1000;
  const newBodyLen = Math.round(Math.max(0.500, parent.body_length - excess) * 1000) / 1000;

  return {
    ...parent,
    id: `wildcat_${parent.id}_${targetAction.id}`,
    name: `${parent.name.replace(/\s*\(.*\)/, '')} (${targetAction.name})`,
    standard: 'Wildcat',
    case_length: newCaseLen,
    body_length: newBodyLen,
    coal: targetAction.maxCoal
  };
}
