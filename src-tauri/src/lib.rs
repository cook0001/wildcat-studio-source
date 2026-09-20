pub mod geometry;
pub mod formats;

use geometry::cartridge::{CartridgeSpec, ReamerSpec, SetbackResult, VolumetricResult};
use geometry::volumetrics::calculate_volumetrics;
use geometry::reamer::generate_reamer_spec;
use geometry::setback::analyze_chamber_setback;
use formats::vol_interchange::{export_to_quickload_vol_line, parse_quickload_vol_line};
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

use std::process::Command;
use std::io::Write;

#[tauri::command]
fn check_typst_available() -> bool {
    which::which("typst").is_ok() || std::path::Path::new("/usr/local/bin/typst").exists()
}

#[tauri::command]
fn compile_typst_pdf(typst_source: String) -> Result<Vec<u8>, String> {
    let typst_bin = which::which("typst")
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| {
            if std::path::Path::new("/usr/local/bin/typst").exists() {
                "/usr/local/bin/typst".to_string()
            } else {
                "typst".to_string()
            }
        });

    let mut child = Command::new(&typst_bin)
        .args(["compile", "-", "-"])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn typst binary (not found): {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(typst_source.as_bytes())
            .map_err(|e| format!("Failed to write to typst stdin: {}", e))?;
    }

    let output = child.wait_with_output()
        .map_err(|e| format!("Typst execution failed: {}", e))?;

    if output.status.success() {
        Ok(output.stdout)
    } else {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("Typst compilation error: {}", err_msg))
    }
}

#[tauri::command]
fn trigger_system_print(html_content: String, _title: String) -> Result<String, String> {
    let temp_dir = std::env::temp_dir();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let file_name = format!("wildcat_print_{}.html", timestamp);
    let file_path = temp_dir.join(&file_name);

    // Ensure auto-print script is present so the native system print sheet appears immediately
    let final_html = if !html_content.contains("window.print()") {
        format!(
            "{}\n<script>window.addEventListener('load', function() {{ setTimeout(function() {{ window.focus(); window.print(); }}, 350); }});</script>",
            html_content
        )
    } else {
        html_content
    };

    std::fs::write(&file_path, final_html)
        .map_err(|e| format!("Failed to write temporary print file: {}", e))?;

    let path_str = file_path.to_string_lossy().to_string();

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to launch system print viewer: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &path_str])
            .spawn()
            .map_err(|e| format!("Failed to launch system print viewer: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to launch system print viewer: {}", e))?;
    }

    Ok(path_str)
}

#[tauri::command]
fn trigger_system_pdf_print(pdf_data: Vec<u8>, title: String) -> Result<String, String> {
    let temp_dir = std::env::temp_dir();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let clean_title = title.replace(|c: char| !c.is_alphanumeric() && c != '_' && c != '-', "_");
    let file_name = format!("wildcat_{}_{}.pdf", clean_title, timestamp);
    let file_path = temp_dir.join(&file_name);

    std::fs::write(&file_path, pdf_data)
        .map_err(|e| format!("Failed to write temporary PDF: {}", e))?;

    let path_str = file_path.to_string_lossy().to_string();

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to launch Preview for PDF print: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &path_str])
            .spawn()
            .map_err(|e| format!("Failed to launch PDF viewer: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to launch PDF viewer: {}", e))?;
    }

    Ok(path_str)
}

use tauri::{Emitter, Manager};

#[derive(Clone, serde::Serialize)]
pub struct OpenedFilePayload {
    pub name: String,
    pub path: String,
    pub content: String,
}

pub struct PendingOpenFile(pub std::sync::Mutex<Option<OpenedFilePayload>>);

#[tauri::command]
fn get_pending_open_file(state: tauri::State<'_, PendingOpenFile>) -> Option<OpenedFilePayload> {
    let mut lock = state.0.lock().ok()?;
    lock.take()
}

#[tauri::command]
fn read_cartridge_file(path: String) -> Result<OpenedFilePayload, String> {
    let p = std::path::Path::new(&path);
    let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("Cartridge File").to_string();
    let content = std::fs::read_to_string(p).map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(OpenedFilePayload { name, path, content })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_file = std::env::args().nth(1).and_then(|arg| {
        let p = std::path::Path::new(&arg);
        if p.is_file() {
            let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("Cartridge File").to_string();
            std::fs::read_to_string(p).ok().map(|content| OpenedFilePayload {
                name,
                path: arg,
                content,
            })
        } else {
            None
        }
    });

    let pending_state = PendingOpenFile(std::sync::Mutex::new(initial_file));

    let app = tauri::Builder::default()
        .manage(pending_state)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            calculate_cartridge_volumetrics,
            calculate_chamber_reamer,
            analyze_rechamber_setback,
            export_quickload_vol,
            parse_quickload_vol,
            export_dxf,
            check_typst_available,
            compile_typst_pdf,
            trigger_system_print,
            trigger_system_pdf_print,
            get_pending_open_file,
            read_cartridge_file
        ])
        .build(tauri::generate_context!())
        .expect("error while building Wildcat Studio");

    app.run(|_app_handle, _event| {
        #[cfg(target_os = "macos")]
        if let tauri::RunEvent::Opened { ref urls } = _event {
            for url in urls {
                if let Ok(file_path) = url.to_file_path() {
                    let path_str = file_path.to_string_lossy().to_string();
                    let name = file_path.file_name().and_then(|n| n.to_str()).unwrap_or("Cartridge File").to_string();
                    if let Ok(content) = std::fs::read_to_string(&file_path) {
                        let payload = OpenedFilePayload {
                            name,
                            path: path_str,
                            content,
                        };
                        if let Some(state) = _app_handle.try_state::<PendingOpenFile>() {
                            if let Ok(mut lock) = state.0.lock() {
                                *lock = Some(payload.clone());
                            }
                        }
                        let _ = _app_handle.emit("wildcat://open-file", &payload);
                    }
                }
            }
        }
    });
}
