use super::cartridge::{CartridgeSpec, SetbackResult};
use super::volumetrics::get_outer_radius_at;

pub fn analyze_chamber_setback(old_spec: &CartridgeSpec, new_spec: &CartridgeSpec) -> SetbackResult {
    let mut can_clean = true;
    let mut interferences = Vec::new();
    let steps = 200;
    let z_max = old_spec.case_length.max(new_spec.case_length);
    let dz = z_max / (steps as f64);

    let mut max_underage_inches = 0.0;

    for i in 0..=steps {
        let z = (i as f64) * dz;
        let r_old = get_outer_radius_at(old_spec, z);
        let r_new = get_outer_radius_at(new_spec, z);

        // If new reamer profile is smaller than old chamber, it won't clean up
        if r_new < r_old - 0.0002 {
            can_clean = false;
            let diff = (r_old - r_new) * 2.0; // Diametrical difference
            if diff > max_underage_inches {
                max_underage_inches = diff;
            }
            if interferences.len() < 5 {
                interferences.push(format!(
                    "Underage at z={:.3}\": Old dia={:.4}\", New dia={:.4}\" (diff -{:.4}\")",
                    z, r_old * 2.0, r_new * 2.0, diff
                ));
            }
        }
    }

    // If it doesn't clean directly, calculate how much the barrel needs to be set back
    let mut required_setback = 0.0;
    if !can_clean {
        // Test setback distances from 0.05" to 1.5" in steps of 0.01"
        for setback_test in 1..=150 {
            let offset = (setback_test as f64) * 0.010;
            let mut cleans_with_offset = true;

            for i in 0..=steps {
                let z = (i as f64) * dz;
                let r_old = get_outer_radius_at(old_spec, z);
                let z_new = z + offset; // Old chamber moved forward into new reamer
                let r_new = get_outer_radius_at(new_spec, z_new);

                if r_new < r_old - 0.0002 {
                    cleans_with_offset = false;
                    break;
                }
            }

            if cleans_with_offset {
                required_setback = offset;
                break;
            }
        }
    }

    SetbackResult {
        can_rechamber_clean: can_clean,
        required_setback_inches: (required_setback * 1000.0).round() / 1000.0,
        required_setback_mm: ((required_setback * 25.4) * 100.0).round() / 100.0,
        interference_locations: interferences,
    }
}
