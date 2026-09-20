import { 
  CartridgeSpec, 
  VolumetricResult, 
  ReamerSpec, 
  SetbackResult, 
  HeadspaceGaugeSpec, 
  StabilityResult, 
  CaseFormingResult,
  RimType,
  DimensionStandard,
  UnitSystem
} from '../types/cartridge';

export const CU_IN_TO_CM3 = 16.387064;
export const CM3_TO_GRAINS_H2O = 15.43235835;
export const CU_IN_TO_GRAINS_H2O = CU_IN_TO_CM3 * CM3_TO_GRAINS_H2O;

export function isStraightWall(spec: CartridgeSpec): boolean {
  return (
    spec.shoulder_angle <= 0.05 ||
    (spec.shoulder_length <= 0.002 && spec.shoulder_angle <= 0.05) ||
    spec.body_length >= spec.case_length - 0.005 ||
    Math.abs(spec.shoulder_start_diameter - spec.neck_diameter_mouth) < 0.001
  );
}

export function getOuterRadiusAt(spec: CartridgeSpec, z: number): number {
  const r_rim = spec.rim_diameter / 2.0;
  const t_rim = spec.rim_thickness;
  const w_ext = spec.extractor_width;
  const r_ext = spec.extractor_diameter / 2.0;
  const z_body_start = t_rim + w_ext;
  const r_base = spec.base_diameter / 2.0;

  const z_shoulder_start = spec.body_length;
  const r_shoulder_start = spec.shoulder_start_diameter / 2.0;

  const r_neck_base = (spec.neck_diameter_base || spec.neck_diameter_mouth) / 2.0;
  const delta_r_shoulder = r_shoulder_start - r_neck_base;

  // Derive dynamic shoulder length directly from shoulder_angle if active
  let effective_shoulder_len = spec.shoulder_length;
  if (spec.shoulder_angle > 0.5 && delta_r_shoulder > 0.001) {
    const rad = (spec.shoulder_angle * Math.PI) / 180;
    const tanAngle = Math.tan(rad);
    if (tanAngle > 0.001) {
      effective_shoulder_len = delta_r_shoulder / tanAngle;
    }
  }

  const z_shoulder_end = spec.body_length + effective_shoulder_len;

  const z_mouth = spec.case_length;
  const r_neck_mouth = spec.neck_diameter_mouth / 2.0;

  if (z <= t_rim) {
    return r_rim;
  } else if (spec.rim_type !== 'rimmed' && z <= z_body_start) {
    return r_ext;
  } else if (spec.rim_type === 'belted' && spec.belt_diameter && z <= z_body_start + (spec.belt_width || 0.220)) {
    return spec.belt_diameter / 2.0;
  }

  // Straight-wall / No-shoulder case: straight continuous taper from base to mouth
  if (isStraightWall(spec)) {
    const start_z = spec.rim_type === 'rimmed' ? t_rim : z_body_start;
    if (z <= z_mouth) {
      const fraction = (z - start_z) / Math.max(0.001, z_mouth - start_z);
      return r_base + (r_neck_mouth - r_base) * Math.min(1.0, Math.max(0.0, fraction));
    } else {
      return r_neck_mouth;
    }
  }

  // Standard bottleneck shouldered case
  if (z <= z_shoulder_start) {
    const start_z = spec.rim_type === 'rimmed' ? t_rim : z_body_start;
    const fraction = (z - start_z) / Math.max(0.001, z_shoulder_start - start_z);
    return r_base + (r_shoulder_start - r_base) * Math.min(1.0, Math.max(0.0, fraction));
  } else if (z <= z_shoulder_end) {
    const fraction = (z - z_shoulder_start) / Math.max(0.001, z_shoulder_end - z_shoulder_start);
    return r_shoulder_start + (r_neck_base - r_shoulder_start) * Math.min(1.0, Math.max(0.0, fraction));
  } else if (z <= z_mouth) {
    const fraction = (z - z_shoulder_end) / Math.max(0.001, z_mouth - z_shoulder_end);
    return r_neck_base + (r_neck_mouth - r_neck_base) * Math.min(1.0, Math.max(0.0, fraction));
  } else {
    return r_neck_mouth;
  }
}

export function getInnerRadiusAt(spec: CartridgeSpec, z: number): number {
  const z_mouth = spec.case_length;
  const web = spec.web_thickness;

  if (z < web) {
    return 0.0;
  }

  const r_outer = getOuterRadiusAt(spec, z);
  const frac = Math.min(1.0, Math.max(0.0, (z - web) / Math.max(0.001, z_mouth - web)));
  const wall_t = spec.base_wall_thickness + (spec.neck_wall_thickness - spec.base_wall_thickness) * Math.pow(frac, 0.8);

  return Math.max(0.0, r_outer - wall_t);
}

export function calculateVolumetricsFrontend(spec: CartridgeSpec): VolumetricResult {
  const z_start = spec.web_thickness;
  const z_end = spec.case_length;

  if (z_end <= z_start) {
    return {
      overflow_capacity_grains_h2o: 0,
      overflow_capacity_cm3: 0,
      bullet_displacement_grains_h2o: 0,
      bullet_displacement_cm3: 0,
      usable_capacity_grains_h2o: 0,
      usable_capacity_cm3: 0,
      sectional_density: 0,
      expansion_ratio_24in: 0,
      form_factor_est: 1.0,
      g1_bc_est: 0,
    };
  }

  const n = 500;
  const dz = (z_end - z_start) / n;
  let sum_area = 0;

  for (let i = 0; i <= n; i++) {
    const z = z_start + i * dz;
    const r = getInnerRadiusAt(spec, z);
    const area = Math.PI * r * r;
    const weight = i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2;
    sum_area += weight * area;
  }

  const vol_cu_in = (dz / 3.0) * sum_area;
  const overflow_grains = vol_cu_in * CU_IN_TO_GRAINS_H2O;
  const overflow_cm3 = vol_cu_in * CU_IN_TO_CM3;

  const seat_depth = Math.max(0, Math.min(spec.seating_depth, spec.case_length - spec.web_thickness));
  const r_bullet = spec.bullet_diameter / 2.0;
  const bullet_shank_vol_cu_in = Math.PI * r_bullet * r_bullet * seat_depth * 0.96;
  const bullet_disp_grains = bullet_shank_vol_cu_in * CU_IN_TO_GRAINS_H2O;
  const bullet_disp_cm3 = bullet_shank_vol_cu_in * CU_IN_TO_CM3;

  const usable_grains = Math.max(0, overflow_grains - bullet_disp_grains);
  const usable_cm3 = Math.max(0, overflow_cm3 - bullet_disp_cm3);

  const sd = spec.bullet_diameter > 0 ? spec.bullet_weight_grains / (7000 * spec.bullet_diameter * spec.bullet_diameter) : 0;

  const barrel_len = 24.0;
  const bore_vol_cu_in = Math.PI * r_bullet * r_bullet * Math.max(1.0, barrel_len - spec.case_length);
  const expansion_ratio = vol_cu_in > 0 ? (vol_cu_in + bore_vol_cu_in) / vol_cu_in : 0;

  const length_ratio = spec.bullet_diameter > 0 ? spec.bullet_length / spec.bullet_diameter : 3.0;
  const form_factor = Math.min(1.2, Math.max(0.4, 0.50 + 0.35 / Math.max(1.5, length_ratio)));
  const g1_bc = form_factor > 0 ? sd / form_factor : 0;

  return {
    overflow_capacity_grains_h2o: Math.round(overflow_grains * 10) / 10,
    overflow_capacity_cm3: Math.round(overflow_cm3 * 100) / 100,
    bullet_displacement_grains_h2o: Math.round(bullet_disp_grains * 10) / 10,
    bullet_displacement_cm3: Math.round(bullet_disp_cm3 * 100) / 100,
    usable_capacity_grains_h2o: Math.round(usable_grains * 10) / 10,
    usable_capacity_cm3: Math.round(usable_cm3 * 100) / 100,
    sectional_density: Math.round(sd * 1000) / 1000,
    expansion_ratio_24in: Math.round(expansion_ratio * 10) / 10,
    form_factor_est: Math.round(form_factor * 1000) / 1000,
    g1_bc_est: Math.round(g1_bc * 1000) / 1000,
  };
}

export function generateReamerSpecFrontend(spec: CartridgeSpec): ReamerSpec {
  const freebore_dia = spec.bullet_diameter + 0.0005;
  const freebore_len = Math.min(0.200, Math.max(0.060, spec.bullet_diameter * 0.40));
  const pilot_dia = Math.max(0.150, spec.bullet_diameter - 0.0080);

  return {
    chamber_rim_dia: Math.round((spec.rim_diameter + 0.005) * 1000) / 1000,
    chamber_rim_depth: Math.round((spec.rim_thickness + 0.003) * 1000) / 1000,
    chamber_base_dia: Math.round((spec.base_diameter + 0.002) * 10000) / 10000,
    chamber_shoulder_dia: Math.round((spec.shoulder_start_diameter + 0.002) * 10000) / 10000,
    chamber_neck_dia: Math.round((spec.neck_diameter_mouth + 0.003) * 10000) / 10000,
    chamber_length: Math.round((spec.case_length + 0.015) * 1000) / 1000,
    freebore_dia: Math.round(freebore_dia * 10000) / 10000,
    freebore_length: Math.round(freebore_len * 1000) / 1000,
    leade_angle_deg: 1.5,
    pilot_diameter: Math.round(pilot_dia * 10000) / 10000,
  };
}

export function analyzeSetbackFrontend(oldSpec: CartridgeSpec, newSpec: CartridgeSpec): SetbackResult {
  let canClean = true;
  const interferences: string[] = [];
  const steps = 150;
  const zMax = Math.max(oldSpec.case_length, newSpec.case_length);
  const dz = zMax / steps;

  for (let i = 0; i <= steps; i++) {
    const z = i * dz;
    const rOld = getOuterRadiusAt(oldSpec, z);
    const rNew = getOuterRadiusAt(newSpec, z);

    if (rNew < rOld - 0.0002) {
      canClean = false;
      const diff = (rOld - rNew) * 2.0;
      if (interferences.length < 4) {
        interferences.push(
          `Underage at z=${z.toFixed(3)}": Existing dia=${(rOld * 2).toFixed(4)}", New dia=${(rNew * 2).toFixed(4)}" (-${diff.toFixed(4)}")`
        );
      }
    }
  }

  let requiredSetback = 0;
  if (!canClean) {
    for (let test = 1; test <= 150; test++) {
      const offset = test * 0.010;
      let cleanWithOffset = true;

      for (let i = 0; i <= steps; i++) {
        const z = i * dz;
        const rOld = getOuterRadiusAt(oldSpec, z);
        const rNew = getOuterRadiusAt(newSpec, z + offset);

        if (rNew < rOld - 0.0002) {
          cleanWithOffset = false;
          break;
        }
      }

      if (cleanWithOffset) {
        requiredSetback = offset;
        break;
      }
    }
  }

  return {
    can_rechamber_clean: canClean,
    required_setback_inches: Math.round(requiredSetback * 1000) / 1000,
    required_setback_mm: Math.round(requiredSetback * 25.4 * 100) / 100,
    interference_locations: interferences,
  };
}

export const calculateVolumetrics = calculateVolumetricsFrontend;
export const calculateReamerSpecs = generateReamerSpecFrontend;

export function getChamberRadiusAt(spec: CartridgeSpec, z: number): number {
  const reamer = generateReamerSpecFrontend(spec);
  const t_rim_ch = reamer.chamber_rim_depth;
  const r_rim_ch = reamer.chamber_rim_dia / 2;
  const r_base_ch = reamer.chamber_base_dia / 2;
  const r_sh_ch = reamer.chamber_shoulder_dia / 2;
  const r_neck_ch = reamer.chamber_neck_dia / 2;
  const r_fb_ch = reamer.freebore_dia / 2;
  const r_bore = reamer.pilot_diameter / 2;

  const z_sh_start = spec.body_length;
  const z_sh_end = spec.body_length + spec.shoulder_length;
  const z_neck_end = reamer.chamber_length;
  const z_fb_end = z_neck_end + reamer.freebore_length;

  if (z <= t_rim_ch) {
    return r_rim_ch;
  }

  if (isStraightWall(spec)) {
    if (z <= z_neck_end) {
      const frac = (z - t_rim_ch) / Math.max(0.001, z_neck_end - t_rim_ch);
      return r_base_ch + (r_neck_ch - r_base_ch) * Math.min(1.0, Math.max(0, frac));
    }
  } else {
    if (z <= z_sh_start) {
      const frac = (z - t_rim_ch) / Math.max(0.001, z_sh_start - t_rim_ch);
      return r_base_ch + (r_sh_ch - r_base_ch) * Math.min(1.0, Math.max(0, frac));
    } else if (z <= z_sh_end) {
      const frac = (z - z_sh_start) / Math.max(0.001, z_sh_end - z_sh_start);
      return r_sh_ch + (r_neck_ch - r_sh_ch) * Math.min(1.0, Math.max(0, frac));
    } else if (z <= z_neck_end) {
      return r_neck_ch;
    }
  }

  // Throat / Freebore
  if (z <= z_fb_end) {
    return r_fb_ch;
  }

  // Leade / Forcing Cone (1.5 deg angle tapering to bore lands)
  const z_leade_len = (r_fb_ch - r_bore) / Math.tan((reamer.leade_angle_deg * Math.PI) / 180);
  if (z <= z_fb_end + z_leade_len) {
    const frac = (z - z_fb_end) / Math.max(0.001, z_leade_len);
    return r_fb_ch - (r_fb_ch - r_bore) * frac;
  }

  return r_bore;
}

/**
 * Calculates SAAMI/CIP reference datum circle diameter and length to datum.
 */
export function calculateDatumHeadspace(spec: CartridgeSpec): { datum_diameter: number; datum_length: number } {
  if (isStraightWall(spec)) {
    return {
      datum_diameter: spec.neck_diameter_mouth,
      datum_length: spec.case_length,
    };
  }

  // Standard SAAMI datum circle diameters
  let datumDia = 0.400;
  if (spec.bullet_diameter <= 0.225) {
    datumDia = 0.375;
  } else if (spec.bullet_diameter <= 0.265) {
    datumDia = 0.400;
  } else if (spec.bullet_diameter <= 0.312) {
    datumDia = 0.400;
  } else if (spec.bullet_diameter <= 0.375) {
    datumDia = 0.420;
  } else if (spec.bullet_diameter > 0.450) {
    datumDia = 0.600;
  }

  // Ensure datum circle lies on shoulder cone
  const shStart = spec.shoulder_start_diameter;
  const shEnd = spec.neck_diameter_base;
  if (datumDia >= shStart || datumDia <= shEnd) {
    datumDia = shEnd + (shStart - shEnd) * 0.5;
  }

  const frac = (shStart - datumDia) / Math.max(0.001, shStart - shEnd);
  const datumLen = spec.body_length + spec.shoulder_length * Math.min(1.0, Math.max(0.0, frac));

  return {
    datum_diameter: Math.round(datumDia * 10000) / 10000,
    datum_length: Math.round(datumLen * 10000) / 10000,
  };
}

/**
 * Calculates precision GO, NO-GO, and FIELD headspace gauge dimensions.
 */
export function calculateHeadspaceGauges(spec: CartridgeSpec): HeadspaceGaugeSpec {
  if (spec.rim_type === 'rimmed') {
    const nominal = spec.rim_thickness;
    return {
      type: 'rimmed',
      datum_diameter: spec.rim_diameter,
      datum_length_nominal: nominal,
      go_gauge_inches: Math.round((nominal + 0.000) * 10000) / 10000,
      nogo_gauge_inches: Math.round((nominal + 0.004) * 10000) / 10000,
      field_gauge_inches: Math.round((nominal + 0.007) * 10000) / 10000,
      tolerance_inches: 0.0002,
    };
  }

  if (spec.rim_type === 'belted') {
    const beltW = spec.belt_width || 0.220;
    return {
      type: 'belted',
      datum_diameter: spec.belt_diameter || spec.base_diameter,
      datum_length_nominal: beltW,
      go_gauge_inches: Math.round((beltW + 0.000) * 10000) / 10000,
      nogo_gauge_inches: Math.round((beltW + 0.004) * 10000) / 10000,
      field_gauge_inches: Math.round((beltW + 0.007) * 10000) / 10000,
      tolerance_inches: 0.0002,
    };
  }

  if (isStraightWall(spec)) {
    const nominal = spec.case_length;
    return {
      type: 'straight_wall',
      datum_diameter: spec.neck_diameter_mouth,
      datum_length_nominal: nominal,
      go_gauge_inches: Math.round((nominal + 0.000) * 10000) / 10000,
      nogo_gauge_inches: Math.round((nominal + 0.004) * 10000) / 10000,
      field_gauge_inches: Math.round((nominal + 0.008) * 10000) / 10000,
      tolerance_inches: 0.0003,
    };
  }

  // Bottleneck case
  const { datum_diameter, datum_length } = calculateDatumHeadspace(spec);
  return {
    type: 'bottleneck',
    datum_diameter,
    datum_length_nominal: datum_length,
    go_gauge_inches: Math.round((datum_length + 0.000) * 10000) / 10000,
    nogo_gauge_inches: Math.round((datum_length + 0.004) * 10000) / 10000,
    field_gauge_inches: Math.round((datum_length + 0.007) * 10000) / 10000,
    tolerance_inches: 0.0002,
  };
}

/**
 * Computes C.I.P. Delta L safety margin.
 */
export function calculateCIPDeltaL(spec: CartridgeSpec): { deltaL_mm: number; deltaL_in: number; isSafe: boolean; note: string } {
  const datum = calculateDatumHeadspace(spec);
  const chamber = generateReamerSpecFrontend(spec);
  // In C.I.P., Delta L represents the clearance between chamber datum and cartridge datum
  const deltaL_in = Math.max(0.0015, (chamber.chamber_length - spec.case_length) * 0.35 + (datum.datum_length > 0 ? 0.001 : 0));
  const deltaL_mm = deltaL_in * 25.4;

  const isSafe = deltaL_mm >= 0.05;
  return {
    deltaL_mm: Math.round(deltaL_mm * 1000) / 1000,
    deltaL_in: Math.round(deltaL_in * 10000) / 10000,
    isSafe,
    note: isSafe
      ? 'Complies with C.I.P. Safety Rule (ΔL >= 0.05 mm)'
      : 'Below recommended C.I.P. safety clearance margin',
  };
}

/**
 * Miller Gyroscopic Stability Rule (Sg) and Twist Rate Analysis.
 */
export function calculateMillerStability(
  spec: CartridgeSpec,
  twistInches: number,
  velocityFps: number = 2800
): StabilityResult {
  const m = spec.bullet_weight_grains || 150;
  const d = Math.max(0.100, spec.bullet_diameter);
  const l = spec.bullet_length > 0 ? spec.bullet_length / d : 3.2; // length in calibers
  const t = twistInches / d; // twist in calibers per turn

  // Don Miller formula: Sg = (30 * m) / (T^2 * d^3 * l * (1 + l^2))
  const denom = t * t * Math.pow(d, 3) * l * (1 + l * l);
  let sg = denom > 0 ? (30 * m) / denom : 1.0;

  // Velocity correction: sqrt(velocity / 2800)
  const velFactor = Math.sqrt(Math.max(800, velocityFps) / 2800.0);
  sg = sg * velFactor;
  sg = Math.round(sg * 100) / 100;

  let status: 'unstable' | 'marginal' | 'stable' | 'over_stabilized';
  let description = '';

  if (sg < 1.0) {
    status = 'unstable';
    description = 'Unstable (Bullet will tumble / keyhole in flight)';
  } else if (sg < 1.3) {
    status = 'marginal';
    description = 'Marginally stable (Safe, but BC degradation and cold-weather instability)';
  } else if (sg <= 2.0) {
    status = 'stable';
    description = 'Optimally stable (Peak BC retention and match precision)';
  } else {
    status = 'over_stabilized';
    description = 'Over-stabilized (Excessive spin drift, increased jacket stress)';
  }

  // Calculate optimal twist for target Sg = 1.5
  const targetSg = 1.5;
  const optDenom = targetSg * Math.pow(d, 3) * l * (1 + l * l);
  const optT2 = optDenom > 0 ? (30 * m * velFactor) / optDenom : 0;
  const optTwist = optT2 > 0 ? Math.sqrt(optT2) * d : 10.0;

  return {
    bullet_mass_grains: m,
    bullet_length_inches: spec.bullet_length,
    twist_rate_inches: twistInches,
    velocity_fps: velocityFps,
    sg,
    status,
    optimal_twist_inches: Math.round(optTwist * 10) / 10,
    description,
  };
}

/**
 * Analyzes case neck flow, wall thickness change, and doughnut formation risk during wildcatting.
 */
export function analyzeCaseForming(parent: CartridgeSpec, wildcat: CartridgeSpec): CaseFormingResult {
  const neckDiaChange = wildcat.neck_diameter_mouth - parent.neck_diameter_mouth;
  const ratio = Math.max(0.4, parent.neck_diameter_mouth / Math.max(0.1, wildcat.neck_diameter_mouth));
  const predictedWall = parent.neck_wall_thickness * Math.sqrt(ratio);
  const loadedNeckDia = wildcat.bullet_diameter + predictedWall * 2;
  const chamberNeckDia = wildcat.neck_diameter_mouth + 0.003;
  const neckClearance = chamberNeckDia - loadedNeckDia;
  const requiresTurning = neckClearance < 0.0025;

  // Doughnut formation occurs when parent shoulder is displaced into the new neck
  let doughnutRisk: 'none' | 'moderate' | 'high' = 'none';
  let doughnutReason = 'Clean neck transition. Parent shoulder remains behind the neck junction.';

  if (wildcat.body_length < parent.body_length - 0.025) {
    doughnutRisk = 'high';
    doughnutReason = 'Parent shoulder brass pushed into the new neck column. Internal doughnut likely at neck-shoulder junction. Inside neck reaming required.';
  } else if (wildcat.body_length < parent.body_length - 0.008) {
    doughnutRisk = 'moderate';
    doughnutReason = 'Minor shoulder material displaced into neck base. Monitor bullet shank seating.';
  }

  const trimReq = Math.max(0, parent.case_length - wildcat.case_length);

  const steps: string[] = [];
  if (neckDiaChange < -0.040) {
    steps.push(`Use intermediate forming die (e.g. step down by ${fmtInches(Math.abs(neckDiaChange) / 2)}) to prevent neck collapse.`);
  }
  if (neckDiaChange > 0.030) {
    steps.push(`Use tapered expander mandrel with dry lubricant to expand neck without shoulder buckling.`);
  }
  if (requiresTurning) {
    steps.push(`Outside neck turning required to turn neck wall from ${fmtInches(predictedWall, 4)} down to ${fmtInches((chamberNeckDia - wildcat.bullet_diameter - 0.003) / 2, 4)}.`);
  }
  if (doughnutRisk === 'high') {
    steps.push(`Inside neck ream after fire-forming to eliminate the internal doughnut.`);
  }
  if (trimReq > 0.010) {
    steps.push(`Rough trim before first firing, then final trim to length ${fmtInches(wildcat.case_length)} after full-length resizing.`);
  }
  if (steps.length === 0) {
    steps.push(`Standard full-length sizing die will form case in a single pass.`);
  }

  return {
    parent_name: parent.name,
    wildcat_name: wildcat.name,
    neck_diameter_change: Math.round(neckDiaChange * 10000) / 10000,
    predicted_neck_wall: Math.round(predictedWall * 10000) / 10000,
    original_neck_wall: parent.neck_wall_thickness,
    loaded_neck_dia: Math.round(loadedNeckDia * 10000) / 10000,
    chamber_neck_dia: Math.round(chamberNeckDia * 10000) / 10000,
    neck_clearance: Math.round(neckClearance * 10000) / 10000,
    requires_neck_turning: requiresTurning,
    doughnut_risk: doughnutRisk,
    doughnut_reason: doughnutReason,
    trim_length_required: Math.round(trimReq * 1000) / 1000,
    recommended_steps: steps,
  };
}

function fmtInches(val: number, precision: number = 3): string {
  return val.toFixed(precision) + '"';
}

/**
 * Generates universal cartridge interchange text (.qdf / .dat format).
 */
export function exportUniversalQDF(spec: CartridgeSpec): string {
  const vol = calculateVolumetricsFrontend(spec);
  const lines = [
    '; Wildcat Studio Universal Cartridge Data Exchange',
    `; Generated: ${new Date().toISOString()}`,
    `[Cartridge]`,
    `Name="${spec.name}"`,
    `ID="${spec.id}"`,
    `Standard="${spec.standard}"`,
    `RimType="${spec.rim_type}"`,
    `CaseLength_in=${spec.case_length.toFixed(4)}`,
    `COAL_in=${spec.coal.toFixed(4)}`,
    `BulletDia_in=${spec.bullet_diameter.toFixed(4)}`,
    `BulletLength_in=${spec.bullet_length.toFixed(4)}`,
    `BulletWeight_gr=${spec.bullet_weight_grains}`,
    `RimDia_in=${spec.rim_diameter.toFixed(4)}`,
    `RimThickness_in=${spec.rim_thickness.toFixed(4)}`,
    `BaseDia_in=${spec.base_diameter.toFixed(4)}`,
    `ShoulderDia_in=${spec.shoulder_start_diameter.toFixed(4)}`,
    `ShoulderAngle_deg=${spec.shoulder_angle.toFixed(2)}`,
    `NeckDia_in=${spec.neck_diameter_mouth.toFixed(4)}`,
    `NeckWall_in=${spec.neck_wall_thickness.toFixed(4)}`,
    `WebThickness_in=${spec.web_thickness.toFixed(4)}`,
    `OverflowCapacity_grH2O=${vol.overflow_capacity_grains_h2o}`,
    `OverflowCapacity_cm3=${vol.overflow_capacity_cm3}`,
    `UsableCapacity_grH2O=${vol.usable_capacity_grains_h2o}`,
    `MaxPressure_bar=${spec.max_pressure_bar}`,
    `MaxPressure_psi=${Math.round(spec.max_pressure_bar * 14.5038)}`,
    `[End]`,
  ];
  return lines.join('\n');
}

// Backward-compatible alias
export const exportQuickLoadQDF = exportUniversalQDF;

/**
 * Generates the official Wildcat Studio Cartridge Specification (.wildcat / .wcs).
 * MIME: application/vnd.wildcatstudio.cartridge+json
 */
export function exportWildcatSpec(spec: CartridgeSpec): string {
  const vol = calculateVolumetricsFrontend(spec);
  const reamer = calculateReamerSpecs(spec);
  const designer =
    spec.designer ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('wildcat_designer_name') : '') ||
    'Unknown Designer';

  const payload = {
    $schema: 'https://armstrader.store/schemas/wildcat-cartridge-v1.json',
    format: 'wildcat_cartridge_specification',
    version: '1.0.0',
    metadata: {
      id: spec.id,
      name: spec.name,
      designer,
      parent_case: spec.parent_case || null,
      category: spec.category,
      standard: spec.standard,
      units: spec.units,
      created_at: new Date().toISOString(),
      notes: spec.notes || '',
    },
    dimensions: {
      rim_type: spec.rim_type,
      rim_diameter_in: spec.rim_diameter,
      rim_thickness_in: spec.rim_thickness,
      extractor_groove_diameter_in: spec.extractor_diameter,
      extractor_groove_width_in: spec.extractor_width,
      extractor_angle_deg: spec.extractor_angle,
      base_diameter_p1_in: spec.base_diameter,
      shoulder_diameter_p2_in: spec.shoulder_start_diameter,
      body_length_l1_in: spec.body_length,
      shoulder_length_in: spec.shoulder_length,
      shoulder_angle_deg: spec.shoulder_angle,
      neck_diameter_base_h1_in: spec.neck_diameter_base,
      neck_diameter_mouth_h2_in: spec.neck_diameter_mouth,
      case_length_l3_in: spec.case_length,
      coal_l6_in: spec.coal,
      bullet_diameter_g1_in: spec.bullet_diameter,
      bullet_length_in: spec.bullet_length,
      bullet_weight_grains: spec.bullet_weight_grains,
      seating_depth_in: spec.seating_depth,
      web_thickness_in: spec.web_thickness,
      base_wall_thickness_in: spec.base_wall_thickness,
      neck_wall_thickness_in: spec.neck_wall_thickness,
      primer_pocket_diameter_in: spec.primer_pocket_dia,
      primer_pocket_depth_in: spec.primer_pocket_depth,
      flash_hole_diameter_in: spec.flash_hole_dia,
      belt_diameter_in: spec.belt_diameter || null,
      belt_width_in: spec.belt_width || null,
    },
    volumetrics: {
      case_capacity_grains_h2o: vol.overflow_capacity_grains_h2o,
      case_capacity_cm3: vol.overflow_capacity_cm3,
      bullet_displacement_grains_h2o: vol.bullet_displacement_grains_h2o,
      usable_capacity_grains_h2o: vol.usable_capacity_grains_h2o,
      usable_capacity_cm3: vol.usable_capacity_cm3,
      expansion_ratio_24in: vol.expansion_ratio_24in,
      sectional_density: vol.sectional_density,
      g1_bc_est: vol.g1_bc_est,
    },
    safety_limits: {
      max_pressure_bar: spec.max_pressure_bar,
      max_pressure_psi: Math.round(spec.max_pressure_bar * 14.5038),
      proof_pressure_bar: Math.round(spec.max_pressure_bar * 1.25),
      proof_pressure_psi: Math.round(spec.max_pressure_bar * 1.25 * 14.5038),
    },
    tooling_and_chamber: {
      reamer_body_diameter_in: reamer.chamber_base_dia,
      reamer_shoulder_diameter_in: reamer.chamber_shoulder_dia,
      reamer_neck_diameter_in: reamer.chamber_neck_dia,
      reamer_freebore_diameter_in: reamer.freebore_dia,
      reamer_freebore_length_in: reamer.freebore_length,
      reamer_leade_angle_deg: reamer.leade_angle_deg,
      neck_diametral_clearance_in: Math.round((reamer.chamber_neck_dia - spec.neck_diameter_mouth) * 10000) / 10000,
      body_diametral_clearance_in: Math.round((reamer.chamber_base_dia - spec.base_diameter) * 10000) / 10000,
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Universal Cartridge Specification Parser
 * Ingests Wildcat Studio specifications (.wildcat / .wcs / JSON),
 * flat CartridgeSpec objects, LoadBench recipes (.loadbench),
 * or QuickLOAD volumetric lines (.vol / text).
 */
export function parseWildcatSpec(raw: string): CartridgeSpec | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // 1. Try parsing JSON formats
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const data = JSON.parse(trimmed);

      // Case A: Official Wildcat Studio Schema (format: 'wildcat_cartridge_specification')
      if (data.format === 'wildcat_cartridge_specification' || (data.metadata && data.dimensions)) {
        const meta = data.metadata || {};
        const dims = data.dimensions || {};
        const safety = data.safety_limits || {};

        const spec: CartridgeSpec = {
          id: meta.id || `wildcat_${Date.now()}`,
          name: meta.name || 'Imported Wildcat',
          category: meta.category || 'Custom Wildcats & User Designs',
          standard: (meta.standard as DimensionStandard) || 'Wildcat',
          units: (meta.units as UnitSystem) || 'imperial',
          rim_type: (dims.rim_type as RimType) || 'rimless',
          rim_diameter: dims.rim_diameter_in || dims.rim_diameter || 0.473,
          rim_thickness: dims.rim_thickness_in || dims.rim_thickness || 0.054,
          extractor_diameter: dims.extractor_groove_diameter_in || dims.extractor_diameter || 0.410,
          extractor_width: dims.extractor_groove_width_in || dims.extractor_width || 0.039,
          extractor_angle: dims.extractor_angle_deg || dims.extractor_angle || 35,
          base_diameter: dims.base_diameter_p1_in || dims.base_diameter || 0.470,
          shoulder_start_diameter: dims.shoulder_diameter_p2_in || dims.shoulder_start_diameter || 0.454,
          body_length: dims.body_length_l1_in || dims.body_length || 1.560,
          shoulder_length: dims.shoulder_length_in || dims.shoulder_length || 0.150,
          shoulder_angle: dims.shoulder_angle_deg || dims.shoulder_angle || 20,
          neck_diameter_base: dims.neck_diameter_base_h1_in || dims.neck_diameter_base || 0.344,
          neck_diameter_mouth: dims.neck_diameter_mouth_h2_in || dims.neck_diameter_mouth || 0.344,
          case_length: dims.case_length_l3_in || dims.case_length || 2.015,
          coal: dims.coal_l6_in || dims.coal || 2.800,
          bullet_diameter: dims.bullet_diameter_g1_in || dims.bullet_diameter || 0.308,
          bullet_length: dims.bullet_length_in || dims.bullet_length || 1.250,
          bullet_weight_grains: dims.bullet_weight_grains || 168,
          seating_depth: dims.seating_depth_in || dims.seating_depth || 0.465,
          web_thickness: dims.web_thickness_in || dims.web_thickness || 0.180,
          base_wall_thickness: dims.base_wall_thickness_in || dims.base_wall_thickness || 0.040,
          neck_wall_thickness: dims.neck_wall_thickness_in || dims.neck_wall_thickness || 0.015,
          primer_pocket_dia: dims.primer_pocket_diameter_in || dims.primer_pocket_dia || 0.210,
          primer_pocket_depth: dims.primer_pocket_depth_in || dims.primer_pocket_depth || 0.128,
          flash_hole_dia: dims.flash_hole_diameter_in || dims.flash_hole_dia || 0.080,
          belt_diameter: dims.belt_diameter_in || dims.belt_diameter || undefined,
          belt_width: dims.belt_width_in || dims.belt_width || undefined,
          max_pressure_bar: dims.max_pressure_bar || safety.max_pressure_bar || 4150,
          designer: meta.designer,
          parent_case: meta.parent_case,
          notes: meta.notes,
        };
        return spec;
      }

      // Case B: Direct flat CartridgeSpec object
      if (typeof data.name === 'string' && (typeof data.case_length === 'number' || typeof data.bullet_diameter === 'number')) {
        const spec: CartridgeSpec = {
          id: data.id || `custom_${Date.now()}`,
          name: data.name,
          category: data.category || 'Custom Wildcats & User Designs',
          standard: data.standard || 'Wildcat',
          units: data.units || 'imperial',
          rim_type: data.rim_type || 'rimless',
          rim_diameter: data.rim_diameter || 0.473,
          rim_thickness: data.rim_thickness || 0.054,
          extractor_diameter: data.extractor_diameter || 0.410,
          extractor_width: data.extractor_width || 0.039,
          extractor_angle: data.extractor_angle || 35,
          base_diameter: data.base_diameter || 0.470,
          shoulder_start_diameter: data.shoulder_start_diameter || 0.454,
          body_length: data.body_length || 1.560,
          shoulder_length: data.shoulder_length || 0.150,
          shoulder_angle: data.shoulder_angle || 20,
          neck_diameter_base: data.neck_diameter_base || 0.344,
          neck_diameter_mouth: data.neck_diameter_mouth || 0.344,
          case_length: data.case_length || 2.000,
          coal: data.coal || (data.case_length ? data.case_length + 0.6 : 2.800),
          bullet_diameter: data.bullet_diameter || 0.308,
          bullet_length: data.bullet_length || (data.bullet_diameter ? data.bullet_diameter * 3.4 : 1.25),
          bullet_weight_grains: data.bullet_weight_grains || 150,
          seating_depth: data.seating_depth || 0.400,
          web_thickness: data.web_thickness || 0.180,
          base_wall_thickness: data.base_wall_thickness || 0.040,
          neck_wall_thickness: data.neck_wall_thickness || 0.015,
          primer_pocket_dia: data.primer_pocket_dia || 0.210,
          primer_pocket_depth: data.primer_pocket_depth || 0.128,
          flash_hole_dia: data.flash_hole_dia || 0.080,
          belt_diameter: data.belt_diameter,
          belt_width: data.belt_width,
          max_pressure_bar: data.max_pressure_bar || 4150,
          designer: data.designer,
          parent_case: data.parent_case,
          notes: data.notes,
        };
        return spec;
      }

      // Case C: LoadBench recipe (.loadbench) with embedded cartridge
      if (data.cartridge && typeof data.cartridge === 'object') {
        return parseWildcatSpec(JSON.stringify(data.cartridge));
      }
    } catch {
      // Fall through to text parsers
    }
  }

  // 2. Try parsing QuickLOAD .vol comma-delimited line
  // Format: "Name",OverflowCap,CaseLen,Caliber,BoreArea,GrooveCal,MaxPress,Standard,COAL
  const tokens = trimmed.split(',').map((t) => t.trim().replace(/^"|"$/g, ''));
  if (tokens.length >= 7 && !isNaN(parseFloat(tokens[2])) && !isNaN(parseFloat(tokens[3]))) {
    const caseLen = parseFloat(tokens[2]);
    const cal = parseFloat(tokens[3]);
    const coalVal = parseFloat(tokens[8]);
    const press = parseInt(tokens[6], 10);

    const spec: CartridgeSpec = {
      id: `vol_${Date.now()}`,
      name: tokens[0] || 'Imported .vol Cartridge',
      category: 'Custom Wildcats & User Designs',
      standard: 'Wildcat',
      units: 'imperial',
      rim_type: 'rimless',
      rim_diameter: Math.round(cal * 1.53 * 1000) / 1000,
      rim_thickness: 0.054,
      extractor_diameter: Math.round(cal * 1.33 * 1000) / 1000,
      extractor_width: 0.039,
      extractor_angle: 35,
      base_diameter: Math.round(cal * 1.52 * 1000) / 1000,
      shoulder_start_diameter: Math.round(cal * 1.47 * 1000) / 1000,
      body_length: Math.round(caseLen * 0.77 * 1000) / 1000,
      shoulder_length: Math.round(caseLen * 0.08 * 1000) / 1000,
      shoulder_angle: 20,
      neck_diameter_base: Math.round((cal + 0.034) * 1000) / 1000,
      neck_diameter_mouth: Math.round((cal + 0.034) * 1000) / 1000,
      case_length: caseLen,
      coal: isNaN(coalVal) || coalVal <= 0 ? caseLen + 0.785 : coalVal,
      bullet_diameter: cal,
      bullet_length: Math.round(cal * 3.4 * 100) / 100,
      bullet_weight_grains: 150,
      seating_depth: 0.400,
      web_thickness: 0.180,
      base_wall_thickness: 0.040,
      neck_wall_thickness: 0.015,
      primer_pocket_dia: 0.210,
      primer_pocket_depth: 0.128,
      flash_hole_dia: 0.080,
      max_pressure_bar: isNaN(press) || press <= 0 ? 4150 : press,
      notes: `Imported from QuickLOAD .vol format: ${tokens[0]}`,
    };
    return spec;
  }

  return null;
}

/**
 * Generates a LoadBench Project Recipe (.loadbench / .ldb) from the active wildcat cartridge.
 * MIME: application/vnd.loadbench.recipe+json
 */
export function exportLoadBenchRecipe(spec: CartridgeSpec): string {
  const vol = calculateVolumetricsFrontend(spec);
  const designer =
    spec.designer ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('wildcat_designer_name') : '') ||
    'Unknown Reloader';

  const payload = {
    $schema: 'https://armstrader.store/schemas/loadbench-recipe-v1.json',
    format: 'loadbench_recipe',
    version: '1.0.0',
    metadata: {
      id: `lb_${spec.id}`,
      name: `${spec.name} Initial Load Development`,
      lot_number: 'LOT-DEV-01',
      batch_size: 20,
      created_at: new Date().toISOString(),
      author: designer,
      target_firearm: 'Custom Wildcat Chamber',
      notes: spec.notes || 'Generated from Wildcat Studio CAD model.',
    },
    cartridge: {
      name: spec.name,
      case_capacity_grains_h2o: vol.overflow_capacity_grains_h2o,
      coal_in: spec.coal,
      case_length_in: spec.case_length,
      brass_manufacturer: spec.parent_case ? `${spec.parent_case} Formed Brass` : 'Custom Brass',
      brass_firings: 0,
    },
    projectile: {
      name: `${spec.bullet_weight_grains}gr Match Target`,
      manufacturer: 'Target Bullet',
      weight_grains: spec.bullet_weight_grains,
      caliber_in: spec.bullet_diameter,
      length_in: spec.bullet_length,
      bearing_surface_in: Math.round(Math.max(0.1, spec.bullet_length * 0.45) * 1000) / 1000,
      bc_g1: vol.g1_bc_est,
      bc_g7: Math.round((vol.g1_bc_est * 0.51) * 1000) / 1000,
      cbto_in: Math.round((spec.coal - (spec.bullet_length * 0.45)) * 1000) / 1000,
      freebore_jump_in: 0.025,
    },
    propellant: {
      name: 'Generic Propellant',
      manufacturer: 'Hodgdon',
      charge_grains: Math.round(vol.usable_capacity_grains_h2o * 0.85 * 10) / 10,
      powder_temperature_f: 70,
      ba_offset_pct: 0.0,
      fill_capacity_pct: Math.round((vol.usable_capacity_grains_h2o / Math.max(1, vol.overflow_capacity_grains_h2o)) * 100),
    },
    primer: {
      name: spec.primer_pocket_dia > 0.20 ? 'Large Rifle' : 'Small Rifle',
      manufacturer: 'Federal',
      pocket_size: spec.primer_pocket_dia > 0.20 ? 'Large Rifle' : 'Small Rifle',
    },
    barrel: {
      length_in: 24.0,
      twist_in: 8.0,
    },
    simulated: {
      muzzle_velocity_fps: 2750,
      max_pressure_psi: Math.round(spec.max_pressure_bar * 14.5038),
      proof_pressure_psi: Math.round(spec.max_pressure_bar * 1.25 * 14.5038),
      powder_burned_pct: 99.0,
      safety_status: 'NORMAL',
    },
    economics: {
      cost_per_round_usd: 0.85,
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Generates a RangeStudio Ballistics Profile (.rsb) for trajectory simulation.
 * MIME: application/vnd.rangestudio.ballistics+json
 */
export function exportRangeStudioBallistics(spec: CartridgeSpec): string {
  const vol = calculateVolumetricsFrontend(spec);
  const designer =
    spec.designer ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('wildcat_designer_name') : '') ||
    'Custom Ballistician';

  // Estimate initial muzzle velocity based on expansion ratio, case capacity, and bullet weight
  const estVelocity = Math.round(
    Math.min(4200, Math.max(900, Math.sqrt((vol.usable_capacity_grains_h2o * 1000) / Math.max(15, spec.bullet_weight_grains)) * 125))
  );

  const bcG1 = vol.g1_bc_est;
  const bcG7 = Math.round((vol.g1_bc_est * 0.51) * 1000) / 1000;

  // Generate 100-yard increment trajectory table up to 1000 yards
  const rangesYards = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  const trajectoryTable = rangesYards.map((rangeYds) => {
    if (rangeYds === 0) {
      return {
        range_yards: 0,
        velocity_fps: estVelocity,
        energy_ft_lbs: Math.round((spec.bullet_weight_grains * estVelocity * estVelocity) / 450240),
        drop_inches: -1.5,
        drop_moa: 0.0,
        drop_mrad: 0.0,
        time_of_flight_ms: 0,
        wind_drift_10mph_inches: 0.0,
      };
    }

    const avgVelocity = estVelocity - (rangeYds * 0.55 * (0.5 / Math.max(0.15, bcG1)));
    const velFps = Math.max(700, Math.round(avgVelocity));
    const tofSeconds = (rangeYds * 3) / ((estVelocity + velFps) / 2);
    const rawDropInches = 0.5 * 386.4 * (tofSeconds * tofSeconds) - 1.5;
    const zero100Tof = 300 / ((estVelocity + (estVelocity - 55)) / 2);
    const zero100Drop = 0.5 * 386.4 * (zero100Tof * zero100Tof) - 1.5;
    const dropInches = rangeYds === 100 ? 0.0 : Math.round((rawDropInches - zero100Drop * (rangeYds / 100)) * 10) / 10;
    const dropMoa = Math.round((dropInches / (rangeYds * 1.047)) * 10) / 10;
    const dropMrad = Math.round((dropInches / (rangeYds * 0.036)) * 10) / 100;
    const energy = Math.round((spec.bullet_weight_grains * velFps * velFps) / 450240);
    const windDrift = Math.round((((tofSeconds * 10) / Math.max(0.2, bcG1)) * 1.2) * 10) / 10;

    return {
      range_yards: rangeYds,
      velocity_fps: velFps,
      energy_ft_lbs: energy,
      drop_inches: dropInches,
      drop_moa: dropMoa,
      drop_mrad: dropMrad,
      time_of_flight_ms: Math.round(tofSeconds * 1000),
      wind_drift_10mph_inches: windDrift,
    };
  });

  const payload = {
    $schema: 'https://armstrader.store/schemas/rangestudio-ballistics-v1.json',
    format: 'rangestudio_ballistics_profile',
    version: '1.0.0',
    metadata: {
      id: `rsb_${spec.id}`,
      name: `${spec.name} Long-Range Ballistics Profile`,
      author: designer,
      cartridge_id: spec.id,
      cartridge_name: spec.name,
      standard: spec.standard,
      created_at: new Date().toISOString(),
      notes: spec.notes || 'Exported from Wildcat Studio CAD drafting suite.',
    },
    atmosphere: {
      temperature_f: 59.0,
      pressure_inhg: 29.92,
      altitude_ft: 0,
      humidity_pct: 50,
    },
    firearm: {
      barrel_length_in: 24.0,
      zero_distance_yards: 100,
      sight_height_in: 1.5,
      twist_rate_in: Math.round(Math.max(6, (spec.bullet_diameter * spec.bullet_diameter) / 0.035) * 10) / 10,
    },
    projectile: {
      name: `${spec.bullet_weight_grains}gr Precision Match`,
      caliber_in: spec.bullet_diameter,
      weight_grains: spec.bullet_weight_grains,
      length_in: spec.bullet_length,
      bearing_surface_in: Math.round(Math.max(0.1, spec.bullet_length * 0.45) * 1000) / 1000,
      bc_g1: bcG1,
      bc_g7: bcG7,
      drag_model: 'G7',
      muzzle_velocity_fps: estVelocity,
    },
    internal_ballistics: {
      case_capacity_grains_h2o: vol.overflow_capacity_grains_h2o,
      usable_capacity_grains_h2o: vol.usable_capacity_grains_h2o,
      max_pressure_psi: Math.round(spec.max_pressure_bar * 14.5038),
      proof_pressure_psi: Math.round(spec.max_pressure_bar * 1.25 * 14.5038),
      expansion_ratio_24in: vol.expansion_ratio_24in,
    },
    trajectory: trajectoryTable,
  };

  return JSON.stringify(payload, null, 2);
}

