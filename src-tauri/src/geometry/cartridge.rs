use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RimType {
    Rimless,
    Rimmed,
    SemiRimmed,
    Belted,
    Rebated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CartridgeSpec {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub category: Option<String>,
    pub standard: String, // "SAAMI", "CIP", or "Wildcat"
    pub units: String,    // "imperial" (inches) or "metric" (mm)

    // Rim & Extractor Groove
    pub rim_type: RimType,
    pub rim_diameter: f64,       // R1 (CIP) or R (SAAMI) [inches]
    pub rim_thickness: f64,      // R (CIP) or h (SAAMI) [inches]
    pub extractor_diameter: f64, // E1 (CIP) [inches]
    pub extractor_width: f64,    // e (CIP) [inches]
    pub extractor_angle: f64,    // beta (CIP) [degrees, e.g. 45.0 or 60.0]

    // Belt (if Belted)
    pub belt_diameter: Option<f64>,
    pub belt_width: Option<f64>,

    // Case Body & Taper
    pub base_diameter: f64,           // P1 (CIP) [inches]
    pub shoulder_start_diameter: f64, // P2 (CIP) [inches]
    pub body_length: f64,             // L1 (CIP) [inches, base to shoulder start]

    // Shoulder & Neck
    pub shoulder_length: f64,         // L2 - L1 (CIP) [inches]
    pub shoulder_angle: f64,          // alpha (CIP) [degrees]
    pub neck_diameter_base: f64,      // H1 (CIP) [inches]
    pub neck_diameter_mouth: f64,     // H2 (CIP) [inches]
    pub case_length: f64,             // L3 (CIP) [inches, total case length]

    // Internal Construction
    pub web_thickness: f64,      // Solid brass head thickness [inches]
    pub base_wall_thickness: f64,// Wall thickness near web [inches]
    pub neck_wall_thickness: f64,// Wall thickness at neck [inches]
    pub primer_pocket_dia: f64,  // 0.175 (small) or 0.210 (large) [inches]
    pub primer_pocket_depth: f64,// ~0.120 [inches]
    pub flash_hole_dia: f64,     // 0.080 [inches]

    // Projectile & Assembly
    pub bullet_diameter: f64,     // G1 (CIP) [inches]
    pub bullet_length: f64,       // [inches]
    pub bullet_weight_grains: f64,// [grains]
    pub coal: f64,                // L6 (CIP) Cartridge Overall Length [inches]
    pub seating_depth: f64,       // Seated shank length inside case [inches]

    // Optional Max Pressure
    pub max_pressure_bar: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumetricResult {
    pub overflow_capacity_grains_h2o: f64,
    pub overflow_capacity_cm3: f64,
    pub bullet_displacement_grains_h2o: f64,
    pub bullet_displacement_cm3: f64,
    pub usable_capacity_grains_h2o: f64,
    pub usable_capacity_cm3: f64,
    pub sectional_density: f64,
    pub expansion_ratio_24in: f64,
    pub form_factor_est: f64,
    pub g1_bc_est: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReamerSpec {
    pub chamber_rim_dia: f64,
    pub chamber_rim_depth: f64,
    pub chamber_base_dia: f64,
    pub chamber_shoulder_dia: f64,
    pub chamber_neck_dia: f64,
    pub chamber_length: f64,
    pub freebore_dia: f64,
    pub freebore_length: f64,
    pub leade_angle_deg: f64,
    pub pilot_diameter: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetbackResult {
    pub can_rechamber_clean: bool,
    pub required_setback_inches: f64,
    pub required_setback_mm: f64,
    pub interference_locations: Vec<String>,
}
