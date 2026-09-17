use crate::geometry::cartridge::CartridgeSpec;
use crate::geometry::volumetrics::{get_inner_radius_at, get_outer_radius_at};
use crate::geometry::reamer::generate_reamer_spec;

pub fn generate_dxf_string(spec: &CartridgeSpec) -> String {
    let mut out = String::new();

    // DXF Header
    out.push_str("0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n");

    // Tables & Layers
    out.push_str("0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n4\n");
    out.push_str("0\nLAYER\n2\nOUTER_CASE\n70\n0\n62\n2\n6\nCONTINUOUS\n"); // Yellow
    out.push_str("0\nLAYER\n2\nINNER_WALL\n70\n0\n62\n3\n6\nCONTINUOUS\n"); // Green
    out.push_str("0\nLAYER\n2\nBULLET\n70\n0\n62\n1\n6\nCONTINUOUS\n");     // Red
    out.push_str("0\nLAYER\n2\nCENTERLINE\n70\n0\n62\n8\n6\nCONTINUOUS\n"); // Gray
    out.push_str("0\nLAYER\n2\nCHAMBER\n70\n0\n62\n4\n6\nCONTINUOUS\n");    // Cyan
    out.push_str("0\nENDTAB\n0\nENDSEC\n");

    // Entities
    out.push_str("0\nSECTION\n2\nENTITIES\n");

    // Centerline from z = -0.1 to z = COAL + 0.1
    let z_max = spec.coal + 0.1;
    write_line(&mut out, "CENTERLINE", -0.1, 0.0, z_max, 0.0);

    // Outer profile points (top half and bottom half symmetric)
    let steps = 120;
    let dz = spec.case_length / (steps as f64);

    let mut prev_z = 0.0;
    let mut prev_r = get_outer_radius_at(spec, 0.0);

    // Case Head vertical line at z=0
    write_line(&mut out, "OUTER_CASE", 0.0, -prev_r, 0.0, prev_r);

    for i in 1..=steps {
        let z = (i as f64) * dz;
        let r = get_outer_radius_at(spec, z);

        // Top contour
        write_line(&mut out, "OUTER_CASE", prev_z, prev_r, z, r);
        // Bottom contour
        write_line(&mut out, "OUTER_CASE", prev_z, -prev_r, z, -r);

        prev_z = z;
        prev_r = r;
    }

    // Case mouth vertical line
    write_line(&mut out, "OUTER_CASE", spec.case_length, prev_r, spec.case_length, spec.neck_diameter_mouth / 2.0 - spec.neck_wall_thickness);
    write_line(&mut out, "OUTER_CASE", spec.case_length, -prev_r, spec.case_length, -(spec.neck_diameter_mouth / 2.0 - spec.neck_wall_thickness));

    // Inner cavity contour
    let z_web = spec.web_thickness;
    let mut prev_zi = z_web;
    let mut prev_ri = get_inner_radius_at(spec, z_web);

    // Flash hole & primer pocket
    write_line(&mut out, "INNER_WALL", z_web, -prev_ri, z_web, prev_ri);

    let inner_steps = 100;
    let dzi = (spec.case_length - z_web) / (inner_steps as f64);
    for i in 1..=inner_steps {
        let z = z_web + (i as f64) * dzi;
        let r = get_inner_radius_at(spec, z);

        write_line(&mut out, "INNER_WALL", prev_zi, prev_ri, z, r);
        write_line(&mut out, "INNER_WALL", prev_zi, -prev_ri, z, -r);

        prev_zi = z;
        prev_ri = r;
    }

    // Reamer/Chamber contour
    let reamer = generate_reamer_spec(spec);
    write_line(&mut out, "CHAMBER", 0.0, reamer.chamber_base_dia / 2.0, spec.body_length, reamer.chamber_shoulder_dia / 2.0);
    write_line(&mut out, "CHAMBER", spec.body_length, reamer.chamber_shoulder_dia / 2.0, spec.body_length + spec.shoulder_length, reamer.chamber_neck_dia / 2.0);
    write_line(&mut out, "CHAMBER", spec.body_length + spec.shoulder_length, reamer.chamber_neck_dia / 2.0, reamer.chamber_length, reamer.chamber_neck_dia / 2.0);

    // Bullet contour
    let z_bullet_tip = spec.coal;
    let r_bullet = spec.bullet_diameter / 2.0;
    let z_bullet_base = spec.coal - spec.bullet_length;
    write_line(&mut out, "BULLET", z_bullet_base, r_bullet, spec.case_length, r_bullet);
    write_line(&mut out, "BULLET", z_bullet_base, -r_bullet, spec.case_length, -r_bullet);
    write_line(&mut out, "BULLET", spec.case_length, r_bullet, z_bullet_tip, 0.0);
    write_line(&mut out, "BULLET", spec.case_length, -r_bullet, z_bullet_tip, 0.0);

    out.push_str("0\nENDSEC\n0\nEOF\n");
    out
}

fn write_line(out: &mut String, layer: &str, x1: f64, y1: f64, x2: f64, y2: f64) {
    out.push_str("0\nLINE\n");
    out.push_str(&format!("8\n{}\n", layer));
    out.push_str(&format!("10\n{:.6}\n", x1));
    out.push_str(&format!("20\n{:.6}\n", y1));
    out.push_str("30\n0.0\n");
    out.push_str(&format!("11\n{:.6}\n", x2));
    out.push_str(&format!("21\n{:.6}\n", y2));
    out.push_str("31\n0.0\n");
}
