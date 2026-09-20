# Changelog

All notable changes to Wildcat Studio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Proprietary Freeware License & Distribution Alignment (`package.json`, `README.md`, `LICENSE`)**:
  - Formalized proprietary free-to-use licensing model under the Wildcat Studio End User License Agreement.
  - Updated `package.json` to `"license": "SEE LICENSE IN LICENSE"`.
  - Added comprehensive License section to `README.md` and removed raw emojis from documentation headers.
  - Established dedicated public binary release repository at [`cook0001/wildcat-studio`](https://github.com/cook0001/wildcat-studio) for pre-compiled standalone installers, checksums, and release verification.
  - Clarified in documentation that `armstrader.store` is a free digital utilities suite for firearm owners, not a marketplace.
  - Aligned binary release distribution references to `https://armstrader.store/wildcat-studio`.
- **Native Cartridge Specification Interchange (`.wildcat` / `.wcs`)**:
  - Export full engineered wildcat design payload matching schema `https://armstrader.store/schemas/wildcat-cartridge-v1.json` (`application/vnd.wildcatstudio.cartridge+json`).
  - Stores complete CAD dimensional parameters, volumetrics (overflow and usable H2O capacities), internal pressure ratings (bar/psi), reamer tooling geometry, and designer attribution.
- **Direct LoadBench Recipe Export (`.loadbench` / `.ldb`)**:
  - Direct export bridge from Wildcat Studio into LoadBench (`application/vnd.loadbench.recipe+json`).
  - Seamlessly ports donor parent case, case length, usable capacity, bullet geometry, and reamer specifications into handloading ladder workups.
- **Designer Profile & Case Lineage**:
  - Added Designer field in `SaveCartridgeModal` with persistent `localStorage` storage (`wildcat_designer_name`).
  - Added Parent donor case input field and technical engineering notes textarea.
- **Universal Cartridge Interchange**:
  - Added universal interchange engine (`exportUniversalQDF`) replacing proprietary format dependencies.

### Changed
- **Icon Architecture**:
  - Replaced legacy star unicode symbols (`⭐`) with vector `<Sparkles />` SVG icons across open and save dialogs, setback tools, and navigation headers.
- **Trademark Scrubbing**:
  - Fully decoupled and cleansed references to third-party commercial software (QuickDESIGN, QuickLOAD) across toolbars, dialogs, user manual, and Rust Tauri backend services (`vol_interchange.rs`).
- **Rust Backend Optimization**:
  - Renamed `src-tauri/src/formats/quickload.rs` to `src-tauri/src/formats/vol_interchange.rs` while maintaining internal format interchange compatibility.

### Fixed
- Fixed reamer tooling clearance calculations and type properties (`freebore_length`, diametral body/neck clearances).
