use crate::geometry::cartridge::{CartridgeSpec, RimType};
use crate::geometry::volumetrics::calculate_volumetrics;
use std::f64::consts::PI;

pub fn export_to_quickload_vol_line(spec: &CartridgeSpec) -> String {
    let vol = calculate_volumetrics(spec);
    let bore_area = PI * (spec.bullet_diameter / 2.0).powi(2) * 0.992;
    let pressure = spec.max_pressure_bar.unwrap_or(4150.0);
    let standard_str = if spec.standard == "CIP" { "PiezoCIP" } else { "SAAMI" };

    format!(
        "\"{}\",\"{:.1}\",\"{:.3}\",\"{:.3}\",\"{:.4}\",\"{:.3}\",\"{:.0}\",\"{}\",\"{:.3}\",\"\",\"\",\"\",\"\",\"\",\"\"",
        spec.name,
        vol.overflow_capacity_grains_h2o,
        spec.case_length,
        spec.bullet_diameter,
        bore_area,
        spec.bullet_diameter,
        pressure,
        standard_str,
        spec.coal
    )
}

pub fn parse_quickload_vol_line(line: &str) -> Option<CartridgeSpec> {
    let clean = line.trim();
    if clean.is_empty() || clean.starts_with('#') {
        return None;
    }

    let fields: Vec<&str> = clean
        .split("\",\"")
        .map(|f| f.trim_matches('"'))
        .collect();

    if fields.len() < 9 {
        return None;
    }

    let name = fields[0].to_string();
    let _h2o_grains: f64 = fields[1].parse().unwrap_or(50.0);
    let case_length: f64 = fields[2].parse().unwrap_or(2.0);
    let bullet_dia: f64 = fields[3].parse().unwrap_or(0.308);
    let pressure: f64 = fields[6].parse().unwrap_or(4000.0);
    let standard = fields[7].to_string();
    let coal: f64 = fields[8].parse().unwrap_or(case_length + 0.7);

    // Reconstruct proportional parametric case based on standard caliber proportions
    let rim_dia = (bullet_dia * 1.5).max(0.378);
    let base_dia = rim_dia * 0.99;
    let shoulder_start_dia = base_dia * 0.96;
    let body_len = case_length * 0.75;
    let shoulder_len = case_length * 0.08;
    let neck_base = bullet_dia + 0.032;
    let neck_mouth = bullet_dia + 0.030;

    Some(CartridgeSpec {
        id: format!("ql_{}", name.to_lowercase().replace(' ', "_")),
        name,
        category: Some("QuickLoad Import".into()),
        standard: if standard.contains("CIP") { "CIP".into() } else { "SAAMI".into() },
        units: "imperial".into(),
        rim_type: RimType::Rimless,
        rim_diameter: (rim_dia * 1000.0).round() / 1000.0,
        rim_thickness: 0.054,
        extractor_diameter: (rim_dia - 0.070 * 1000.0).round() / 1000.0,
        extractor_width: 0.039,
        extractor_angle: 45.0,
        belt_diameter: None,
        belt_width: None,
        base_diameter: (base_dia * 1000.0).round() / 1000.0,
        shoulder_start_diameter: (shoulder_start_dia * 1000.0).round() / 1000.0,
        body_length: (body_len * 1000.0).round() / 1000.0,
        shoulder_length: (shoulder_len * 1000.0).round() / 1000.0,
        shoulder_angle: 20.0,
        neck_diameter_base: (neck_base * 1000.0).round() / 1000.0,
        neck_diameter_mouth: (neck_mouth * 1000.0).round() / 1000.0,
        case_length: (case_length * 1000.0).round() / 1000.0,
        web_thickness: 0.180,
        base_wall_thickness: 0.032,
        neck_wall_thickness: 0.015,
        primer_pocket_dia: if bullet_dia < 0.25 { 0.175 } else { 0.210 },
        primer_pocket_depth: 0.128,
        flash_hole_dia: 0.080,
        bullet_diameter: (bullet_dia * 1000.0).round() / 1000.0,
        bullet_length: bullet_dia * 3.8,
        bullet_weight_grains: (bullet_dia.powi(3) * 5500.0 * 10.0).round() / 10.0,
        coal: (coal * 1000.0).round() / 1000.0,
        seating_depth: 0.320,
        max_pressure_bar: Some(pressure),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quickload_vol_export() {
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

        let line = export_to_quickload_vol_line(&spec);
        assert!(line.starts_with("\".308 Winchester\""));
        assert!(line.contains("\"2.015\""));
        assert!(line.contains("\"0.308\""));
        assert!(line.contains("\"4150\""));
    }
}

