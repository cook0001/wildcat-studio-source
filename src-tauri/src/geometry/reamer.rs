use super::cartridge::{CartridgeSpec, ReamerSpec};

pub fn generate_reamer_spec(spec: &CartridgeSpec) -> ReamerSpec {
    // Diametrical clearances standard to SAAMI min chamber
    let base_clearance = 0.0020;
    let shoulder_clearance = 0.0020;
    let neck_clearance = 0.0030;
    let rim_dia_clearance = 0.0050;
    let rim_depth_clearance = 0.0030;
    let mouth_length_clearance = 0.0150;

    let freebore_dia = spec.bullet_diameter + 0.0005;
    let freebore_len = (spec.bullet_diameter * 0.40).clamp(0.060, 0.200);

    // Approximate bore diameter (land-to-land) = bullet dia - 0.008"
    let pilot_dia = (spec.bullet_diameter - 0.0080).max(0.150);

    ReamerSpec {
        chamber_rim_dia: (spec.rim_diameter + rim_dia_clearance * 1000.0).round() / 1000.0,
        chamber_rim_depth: (spec.rim_thickness + rim_depth_clearance * 1000.0).round() / 1000.0,
        chamber_base_dia: ((spec.base_diameter + base_clearance) * 10000.0).round() / 10000.0,
        chamber_shoulder_dia: ((spec.shoulder_start_diameter + shoulder_clearance) * 10000.0).round() / 10000.0,
        chamber_neck_dia: ((spec.neck_diameter_mouth + neck_clearance) * 10000.0).round() / 10000.0,
        chamber_length: ((spec.case_length + mouth_length_clearance) * 1000.0).round() / 1000.0,
        freebore_dia: (freebore_dia * 10000.0).round() / 10000.0,
        freebore_length: (freebore_len * 1000.0).round() / 1000.0,
        leade_angle_deg: 1.5, // 1° 30'
        pilot_diameter: (pilot_dia * 10000.0).round() / 10000.0,
    }
}
