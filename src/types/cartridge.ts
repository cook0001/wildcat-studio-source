// Complete Encyclopedic Cartridge Database for Wildcat Studio
// 268 SAAMI, CIP, and precision wildcat cartridges across 11 categories.

export type RimType = "rimless" | "rimmed" | "semi_rimmed" | "belted" | "rebated" | "rimfire";
export type DimensionStandard = "SAAMI" | "CIP" | "Wildcat";
export type UnitSystem = "imperial" | "metric";

export interface CartridgeSpec {
  id: string;
  name: string;
  category: string;
  standard: DimensionStandard;
  units: UnitSystem;
  rim_type: RimType;
  rim_diameter: number;            // R1
  rim_thickness: number;           // t_rim (R)
  extractor_diameter: number;      // E1
  extractor_width: number;         // e
  extractor_angle: number;         // beta
  base_diameter: number;           // P1
  shoulder_start_diameter: number; // P2
  body_length: number;             // L1
  shoulder_length: number;         // L2 - L1
  shoulder_angle: number;          // alpha
  neck_diameter_base: number;      // H1
  neck_diameter_mouth: number;     // H2
  case_length: number;             // L3
  web_thickness: number;
  base_wall_thickness: number;
  neck_wall_thickness: number;
  primer_pocket_dia: number;
  primer_pocket_depth: number;
  flash_hole_dia: number;
  bullet_diameter: number;         // G1
  bullet_length: number;
  bullet_weight_grains: number;
  coal: number;                    // L6
  seating_depth: number;
  max_pressure_bar: number;
  belt_diameter?: number;          // Belted cases
  belt_width?: number;             // Belted cases
  designer?: string;               // Wildcat cartridge designer / author
  parent_case?: string;            // Parent donor case
  notes?: string;                  // Engineering notes / design rationale
}

export interface VolumetricResult {
  overflow_capacity_grains_h2o: number;
  overflow_capacity_cm3: number;
  bullet_displacement_grains_h2o: number;
  bullet_displacement_cm3: number;
  usable_capacity_grains_h2o: number;
  usable_capacity_cm3: number;
  sectional_density: number;
  expansion_ratio_24in: number;
  form_factor_est: number;
  g1_bc_est: number;
}

export interface ReamerSpec {
  chamber_rim_dia: number;
  chamber_rim_depth: number;
  chamber_base_dia: number;
  chamber_shoulder_dia: number;
  chamber_neck_dia: number;
  chamber_length: number;
  freebore_dia: number;
  freebore_length: number;
  leade_angle_deg: number;
  pilot_diameter: number;
}

export interface SetbackResult {
  can_rechamber_clean: boolean;
  required_setback_inches: number;
  required_setback_mm: number;
  interference_locations: string[];
}

export type DraftingStandard = "saami" | "cip";
export type ToleranceDisplayMode = "nominal" | "cartridge_max" | "chamber_min" | "clearance" | "dual_envelope";

export interface HeadspaceGaugeSpec {
  type: 'bottleneck' | 'belted' | 'rimmed' | 'straight_wall';
  datum_diameter: number;
  datum_length_nominal: number;
  go_gauge_inches: number;
  nogo_gauge_inches: number;
  field_gauge_inches: number;
  tolerance_inches: number;
}

export interface StabilityResult {
  bullet_mass_grains: number;
  bullet_length_inches: number;
  twist_rate_inches: number;
  velocity_fps: number;
  sg: number;
  status: 'unstable' | 'marginal' | 'stable' | 'over_stabilized';
  optimal_twist_inches: number;
  description: string;
}

export interface CaseFormingResult {
  parent_name: string;
  wildcat_name: string;
  neck_diameter_change: number;
  predicted_neck_wall: number;
  original_neck_wall: number;
  loaded_neck_dia: number;
  chamber_neck_dia: number;
  neck_clearance: number;
  requires_neck_turning: boolean;
  doughnut_risk: 'none' | 'moderate' | 'high';
  doughnut_reason: string;
  trim_length_required: number;
  recommended_steps: string[];
}

export const CARTRIDGE_CATEGORIES = [
  "Military Service & Battle Rifle",
  "Precision Match, PRS & Benchrest",
  "AR-15 & Small Frame Tactical",
  "Standard American & European Hunting",
  "Magnums & Extreme Long Range (ELR)",
  "Dangerous Game & African Express",
  "Modern Straight-Wall, Subsonic & Lever Action",
  "Handgun, Pistol & PDW / Subgun",
  "Classic Wildcats & Ackley Improved",
  "Rimfire Calibers",
  "Classified"
] as const;

// Re-export all cartridge presets from the categorized data layer
export { CARTRIDGE_PRESETS, DEFAULT_CARTRIDGE_ID } from '../data/cartridges';
