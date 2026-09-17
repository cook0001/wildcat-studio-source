use super::cartridge::{CartridgeSpec, VolumetricResult, RimType};
use std::f64::consts::PI;

pub const CU_IN_TO_CM3: f64 = 16.387064;
pub const CM3_TO_GRAINS_H2O: f64 = 15.43235835;
pub const CU_IN_TO_GRAINS_H2O: f64 = CU_IN_TO_CM3 * CM3_TO_GRAINS_H2O; // ~252.891

pub fn get_outer_radius_at(spec: &CartridgeSpec, z: f64) -> f64 {
    let r_rim = spec.rim_diameter / 2.0;
    let t_rim = spec.rim_thickness;
    let w_ext = spec.extractor_width;
    let r_ext = spec.extractor_diameter / 2.0;

    let z_body_start = t_rim + w_ext;
    let r_base = spec.base_diameter / 2.0;

    let z_shoulder_start = spec.body_length;
    let r_shoulder_start = spec.shoulder_start_diameter / 2.0;

    let z_shoulder_end = spec.body_length + spec.shoulder_length;
    let r_neck_base = spec.neck_diameter_base / 2.0;

    let z_mouth = spec.case_length;
    let r_neck_mouth = spec.neck_diameter_mouth / 2.0;

    let is_straight_wall = spec.shoulder_angle <= 0.05
        || spec.shoulder_length <= 0.002
        || spec.body_length >= spec.case_length - 0.005
        || (spec.shoulder_start_diameter - spec.neck_diameter_mouth).abs() < 0.001;

    if z <= t_rim {
        r_rim
    } else if spec.rim_type != RimType::Rimless && spec.rim_type == RimType::Rimmed {
        if is_straight_wall {
            if z <= z_mouth {
                let fraction = (z - t_rim) / (z_mouth - t_rim).max(0.001);
                r_base + (r_neck_mouth - r_base) * fraction.clamp(0.0, 1.0)
            } else {
                r_neck_mouth
            }
        } else if z <= z_shoulder_start {
            let fraction = (z - t_rim) / (z_shoulder_start - t_rim).max(0.001);
            r_base + (r_shoulder_start - r_base) * fraction.clamp(0.0, 1.0)
        } else if z <= z_shoulder_end {
            let fraction = (z - z_shoulder_start) / (z_shoulder_end - z_shoulder_start).max(0.001);
            r_shoulder_start + (r_neck_base - r_shoulder_start) * fraction.clamp(0.0, 1.0)
        } else if z <= z_mouth {
            let fraction = (z - z_shoulder_end) / (z_mouth - z_shoulder_end).max(0.001);
            r_neck_base + (r_neck_mouth - r_neck_base) * fraction.clamp(0.0, 1.0)
        } else {
            r_neck_mouth
        }
    } else if z <= z_body_start {
        // Extractor groove
        r_ext
    } else if spec.rim_type == RimType::Belted
        && spec.belt_diameter.is_some()
        && z <= z_body_start + spec.belt_width.unwrap_or(0.220)
    {
        spec.belt_diameter.unwrap() / 2.0
    } else if is_straight_wall {
        if z <= z_mouth {
            let fraction = (z - z_body_start) / (z_mouth - z_body_start).max(0.001);
            r_base + (r_neck_mouth - r_base) * fraction.clamp(0.0, 1.0)
        } else {
            r_neck_mouth
        }
    } else if z <= z_shoulder_start {
        // Body taper
        let fraction = (z - z_body_start) / (z_shoulder_start - z_body_start).max(0.001);
        r_base + (r_shoulder_start - r_base) * fraction.clamp(0.0, 1.0)
    } else if z <= z_shoulder_end {
        // Shoulder taper
        let fraction = (z - z_shoulder_start) / (z_shoulder_end - z_shoulder_start).max(0.001);
        r_shoulder_start + (r_neck_base - r_shoulder_start) * fraction.clamp(0.0, 1.0)
    } else if z <= z_mouth {
        // Neck taper
        let fraction = (z - z_shoulder_end) / (z_mouth - z_shoulder_end).max(0.001);
        r_neck_base + (r_neck_mouth - r_neck_base) * fraction.clamp(0.0, 1.0)
    } else {
        r_neck_mouth
    }
}

pub fn get_inner_radius_at(spec: &CartridgeSpec, z: f64) -> f64 {
    let z_mouth = spec.case_length;
    let web = spec.web_thickness;

    if z < web {
        return 0.0;
    }

    let r_outer = get_outer_radius_at(spec, z);

    // Wall thickness tapers from base_wall_thickness to neck_wall_thickness
    let frac = ((z - web) / (z_mouth - web).max(0.001)).clamp(0.0, 1.0);
    // Smooth quadratic ease towards the neck
    let wall_t = spec.base_wall_thickness + (spec.neck_wall_thickness - spec.base_wall_thickness) * frac.powf(0.8);

    (r_outer - wall_t).max(0.0)
}

pub fn calculate_volumetrics(spec: &CartridgeSpec) -> VolumetricResult {
    let z_start = spec.web_thickness;
    let z_end = spec.case_length;

    if z_end <= z_start {
        return VolumetricResult {
            overflow_capacity_grains_h2o: 0.0,
            overflow_capacity_cm3: 0.0,
            bullet_displacement_grains_h2o: 0.0,
            bullet_displacement_cm3: 0.0,
            usable_capacity_grains_h2o: 0.0,
            usable_capacity_cm3: 0.0,
            sectional_density: 0.0,
            expansion_ratio_24in: 0.0,
            form_factor_est: 1.0,
            g1_bc_est: 0.0,
        };
    }

    // 1000-slice Simpson integration for volume of revolution
    let n = 1000;
    let dz = (z_end - z_start) / (n as f64);
    let mut sum_area = 0.0;

    for i in 0..=n {
        let z = z_start + (i as f64) * dz;
        let r = get_inner_radius_at(spec, z);
        let area = PI * r * r;

        let weight = if i == 0 || i == n {
            1.0
        } else if i % 2 == 1 {
            4.0
        } else {
            2.0
        };

        sum_area += weight * area;
    }

    let vol_cu_in = (dz / 3.0) * sum_area;
    let overflow_grains = vol_cu_in * CU_IN_TO_GRAINS_H2O;
    let overflow_cm3 = vol_cu_in * CU_IN_TO_CM3;

    // Bullet displacement inside the case
    let seat_depth = spec.seating_depth.min(spec.case_length - spec.web_thickness).max(0.0);
    let r_bullet = spec.bullet_diameter / 2.0;
    let bullet_shank_vol_cu_in = PI * r_bullet * r_bullet * seat_depth * 0.96; // 0.96 factor accounts for boat tail chamfer
    let bullet_disp_grains = bullet_shank_vol_cu_in * CU_IN_TO_GRAINS_H2O;
    let bullet_disp_cm3 = bullet_shank_vol_cu_in * CU_IN_TO_CM3;

    let usable_grains = (overflow_grains - bullet_disp_grains).max(0.0);
    let usable_cm3 = (overflow_cm3 - bullet_disp_cm3).max(0.0);

    // Sectional density
    let sd = if spec.bullet_diameter > 0.0 {
        spec.bullet_weight_grains / (7000.0 * spec.bullet_diameter * spec.bullet_diameter)
    } else {
        0.0
    };

    // Expansion ratio for 24" barrel
    let barrel_len = 24.0;
    let bore_vol_cu_in = PI * r_bullet * r_bullet * (barrel_len - spec.case_length).max(1.0);
    let expansion_ratio = if vol_cu_in > 0.0 {
        (vol_cu_in + bore_vol_cu_in) / vol_cu_in
    } else {
        0.0
    };

    // Ballistic form factor & G1 BC estimate
    let length_ratio = if spec.bullet_diameter > 0.0 {
        spec.bullet_length / spec.bullet_diameter
    } else {
        3.0
    };
    let form_factor = (0.50 + 0.35 / length_ratio.max(1.5)).clamp(0.40, 1.20);
    let g1_bc = if form_factor > 0.0 { sd / form_factor } else { 0.0 };

    VolumetricResult {
        overflow_capacity_grains_h2o: (overflow_grains * 100.0).round() / 100.0,
        overflow_capacity_cm3: (overflow_cm3 * 1000.0).round() / 1000.0,
        bullet_displacement_grains_h2o: (bullet_disp_grains * 100.0).round() / 100.0,
        bullet_displacement_cm3: (bullet_disp_cm3 * 1000.0).round() / 1000.0,
        usable_capacity_grains_h2o: (usable_grains * 100.0).round() / 100.0,
        usable_capacity_cm3: (usable_cm3 * 1000.0).round() / 1000.0,
        sectional_density: (sd * 1000.0).round() / 1000.0,
        expansion_ratio_24in: (expansion_ratio * 10.0).round() / 10.0,
        form_factor_est: (form_factor * 1000.0).round() / 1000.0,
        g1_bc_est: (g1_bc * 1000.0).round() / 1000.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::cartridge::RimType;

    #[test]
    fn test_308_winchester_volumetrics() {
        let spec = CartridgeSpec {
            id: "308_win".into(),
            name: ".308 Winchester".into(),
            category: Some("Next-Gen Military & Battle Rifle".into()),
            standard: "SAAMI".into(),
            units: "imperial".into(),
            rim_type: RimType::Rimless,
            rim_diameter: 0.473,
            rim_thickness: 0.054,
            extractor_diameter: 0.410,
            extractor_width: 0.039,
            extractor_angle: 45.0,
            belt_diameter: None,
            belt_width: None,
            base_diameter: 0.470,
            shoulder_start_diameter: 0.454,
            body_length: 1.560,
            shoulder_length: 0.152,
            shoulder_angle: 20.0,
            neck_diameter_base: 0.344,
            neck_diameter_mouth: 0.343,
            case_length: 2.015,
            web_thickness: 0.180,
            base_wall_thickness: 0.032,
            neck_wall_thickness: 0.015,
            primer_pocket_dia: 0.210,
            primer_pocket_depth: 0.128,
            flash_hole_dia: 0.080,
            bullet_diameter: 0.308,
            bullet_length: 1.250,
            bullet_weight_grains: 168.0,
            coal: 2.800,
            seating_depth: 0.380,
            max_pressure_bar: Some(4150.0),
        };

        let res = calculate_volumetrics(&spec);
        // SAAMI standard overflow capacity for .308 Win is approx 56 grains of H2O
        assert!(res.overflow_capacity_grains_h2o > 54.0 && res.overflow_capacity_grains_h2o < 58.0,
            "Expected .308 overflow ~56 gr H2O, got {}", res.overflow_capacity_grains_h2o);
        assert!(res.usable_capacity_grains_h2o < res.overflow_capacity_grains_h2o);
        assert!(res.sectional_density > 0.240 && res.sectional_density < 0.260);
    }
}

