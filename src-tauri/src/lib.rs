pub mod geometry;
pub mod formats;

use geometry::cartridge::{CartridgeSpec, ReamerSpec, SetbackResult, VolumetricResult};
use geometry::volumetrics::calculate_volumetrics;
use geometry::reamer::generate_reamer_spec;
use geometry::setback::analyze_chamber_setback;
use formats::quickload::{export_to_quickload_vol_line, parse_quickload_vol_line};
use formats::dxf::generate_dxf_string;

#[tauri::command]
fn calculate_cartridge_volumetrics(spec: CartridgeSpec) -> VolumetricResult {
    calculate_volumetrics(&spec)
}

#[tauri::command]
fn calculate_chamber_reamer(spec: CartridgeSpec) -> ReamerSpec {
    generate_reamer_spec(&spec)
}

#[tauri::command]
fn analyze_rechamber_setback(old_spec: CartridgeSpec, new_spec: CartridgeSpec) -> SetbackResult {
    analyze_chamber_setback(&old_spec, &new_spec)
}

#[tauri::command]
fn export_quickload_vol(spec: CartridgeSpec) -> String {
    export_to_quickload_vol_line(&spec)
}

#[tauri::command]
fn parse_quickload_vol(line: String) -> Option<CartridgeSpec> {
    parse_quickload_vol_line(&line)
}

#[tauri::command]
fn export_dxf(spec: CartridgeSpec) -> String {
    generate_dxf_string(&spec)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            calculate_cartridge_volumetrics,
            calculate_chamber_reamer,
            analyze_rechamber_setback,
            export_quickload_vol,
            parse_quickload_vol,
            export_dxf
        ])
        .run(tauri::generate_context!())
        .expect("error while running Wildcat Studio");
}
