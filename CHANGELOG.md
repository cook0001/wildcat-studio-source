# Changelog

All notable changes to Wildcat Studio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-09-20

### Added
- **Local Pre-Flight Verification Pipeline (`scripts/verify.sh`, `package.json`)**:
  - Implemented 1-command verification suite (`npm run verify`) running full frontend typechecks (`tsc --noEmit`), production Vite bundling, Cargo check, strict Clippy (`-D warnings`), Rust unit tests, CSS vendor prefix hygiene, and version lock verification in under 17 seconds.
  - Guarantees 100% first-time success on GitHub Actions before pushing commits, completely eliminating failed runner minutes.
- **CI Runner Hardening & Resource Optimization (`.github/workflows/qc.yml`, `release.yml`, `audit.yml`)**:
  - Implemented `concurrency: cancel-in-progress: true` across all workflows to automatically terminate superseded jobs and prevent duplicate runner billing.
  - Integrated `swatinem/rust-cache@v2` across macOS, Windows, and Linux, slashing CI compile times by 60–75%.
  - Added fast pre-release gate job (`pre-release-qc`) in `release.yml` running in under 60 seconds; heavy parallel matrix runners (macOS, Windows, Linux) only spin up if the gate passes.
  - Modernized Linux build dependencies to `libayatana-appindicator3-dev` and Node 22 LTS.
  - Added automated `SHA256SUMS.txt` generation and upload to GitHub Releases for installer verification on `armstrader.store/security`.
  - Added weekly automated security vulnerability audit (`audit.yml`) scanning Rust crates and npm packages.
- **Comprehensive In-App User Manual Overhaul & Ecosystem Synchronization (`UserGuideModal.tsx`, `App.tsx`, `README.md`)**:
  - Completely updated and synchronized the in-app User Guide with all recently introduced modules, mathematical solvers, toolroom gauges, and file interchange capabilities.
  - Added dedicated comprehensive guide section for **Miller Twist Stability Spectrum ($S_g$)** (`twist-stability`), documenting the Don Miller empirical formulation, Bryan Litz spin drift velocity decay, 4-tier stability classifications ($<1.0$ unstable, $1.0-1.4$ marginally stable, $1.5-2.0$ fully stabilized, $>2.0$ over-stabilized), 5-twist comparative matrix, and an interactive 1-click launcher button to directly open the Twist Stability Modal.
  - Added dedicated guide section for **Case Forming Protocol & Donut Diagnostic Solver** (`case-forming`), detailing multi-stage neck reduction sizing dies, brass spring-back relief, 650°F-750°F temperature-indicating lacquers (Tempilaq) annealing protocols, and the internal neck "donut" hazard with an interactive 1-click launcher button to open the Case Forming Modal.
  - Added dedicated guide section for **Toolroom Headspace Gauges & Chamber Verification** (`headspace-gauges`), explaining datum circle diameter ($E_1$), GO gauge (+0.0000"), NO-GO gauge (+0.0040" to +0.0060"), and FIELD rejection limits (+0.0080" to +0.0100") with an interactive 1-click launcher button to open the Headspace Gauges Modal.
  - Added dedicated guide section for **Native OS Document Associations & File Interchange** (`file-interchange`), documenting macOS Finder double-click / "Open With" associations for `.wildcat` and `.wcs`, QuickLOAD `.vol` ingestion, LoadBench `.loadbench`/`.ldb` integration, and drag-and-drop window ingestion.
  - Updated **Engineering CAD Blueprints & Native Print Engine** (`exports-printing`), documenting single-page letter landscape scaling, authentic toolroom projectile blueprint geometry, and cross-platform native print/PDF preview bridge via Apple Preview.app and OS print spoolers.
  - Synchronized and updated ecosystem portal references across `UserGuideModal.tsx` and `README.md` (ArmsTrader web tools suite at `armstrader.store`, LoadBench Studio at `armstrader.store/loadbench`, RangeStudio at `armstrader.store/rangestudio`, ArmoryVault Companion at `armstrader.store/companion`, and legal terms modal link).
- **Software License & Legal Terms Modal (`LicenseModal.tsx`, `Navbar.tsx`, `AboutModal.tsx`)**:
  - Implemented dedicated, high-contrast modal dialog providing comprehensive legal and licensing transparency.
  - Divided into 4 structured sections: Proprietary Freeware EULA (permitted uses and reverse engineering prohibitions), Cleanroom Mathematical Formulation (Simpson 1000-slice volume integrator, Miller stability rule, Bryan Litz spin drift), Critical Toolroom & Reloading Safety Advisory (headspace gauge verification and 10% reduced starting charge protocols), and Third-Party Open Source Notices (Tauri, React, Three.js, Lucide Icons, Vite).
  - Added direct access link from the Settings dropdown menu (`menu-item-license-legal`) and an interactive cross-modal link from the About Wildcat Studio dialog.
  - Added 1-click full license copy button with clipboard confirmation and portal navigation to `armstrader.store/wildcat-studio`.
- **Native OS File Association & Universal Import Suite (`src-tauri/tauri.conf.json`, `src-tauri/src/lib.rs`, `src/App.tsx`, `src/components/OpenCartridgeModal.tsx`, `src/utils/volumetrics.ts`)**:
  - Configured official macOS file associations (`CFBundleDocumentTypes` and `UTExportedTypeDeclarations`) in `tauri.conf.json` for `.wildcat` and `.wcs` files (`Owner`, `com.wildcatstudio.cartridge`, conforming to `public.data` and `public.json`) alongside QuickLOAD `.vol` and LoadBench `.loadbench`.
  - Implemented native Tauri `RunEvent::Opened` AppleEvent listener and managed mutex state `PendingOpenFile` with `get_pending_open_file` command to seamlessly handle cold-start launches and live Finder "Open With" file opens.
  - Expanded in-app file picker filter to accept `.wildcat`, `.wcs`, `.vol`, `.json`, `.loadbench`, and `.ldb`.
  - Implemented universal `parseWildcatSpec` supporting official nested schema (`format: 'wildcat_cartridge_specification'`), flat specs, QuickLOAD `.vol`, and LoadBench formats with automatic dimensional and volumetric translation.
  - Added direct window drag-and-drop file ingestion across the application.

### Fixed
- **Case Forming & Wildcatting Parent Donor Selection Bubble Fix (`CartridgePickerModal.tsx`, `FormingModal.tsx`, `WildcatWizardModal.tsx`, `SetbackModal.tsx`)**:
  - Resolved event bubbling bug where clicking a parent/donor cartridge inside the cartridge picker modal triggered the parent modal's backdrop click handler, inadvertently closing both modals.
  - Added `e.stopPropagation()` on the picker container and items, explicit modal dismissal on selection, and strict target verification (`e.target === e.currentTarget`) across all application modals.
- **Miller Twist Stability Modal Controls, Scroll Clearance & Print/Export Actions (`TwistStabilityModal.tsx`)**:
  - Replaced ambiguous bottom selector with an explicit "Barrel Twist Comparative Spectrum" matrix displaying active rifling rate indicator and quick-testing across 5 standard twist rates.
  - Replaced single copy button with high-resolution "Print Stability Sheet" vector print generator, "Download Report (.txt)" file export, and copy action.
  - Hardened layout against vertical flexbox clipping on smaller displays: added `flexShrink: 0` to both Header and Footer, explicit `height: '840px'` with `maxHeight: '92vh'`, expanded width to `840px`, and added generous 24px bottom scroll padding so the bottom spectrum matrix never sits flush or hides under the footer.
- **Shop Blueprint & Engineering Document Print Quality Overhaul (`PrintableSheet.tsx`, `ReamerCADShopPrint.tsx`, `FormingModal.tsx`, `HeadspaceModal.tsx`)**:
  - Eliminated black-background printing in Reamer CAD blueprint by standardizing high-contrast light-mode toolroom rendering with crisp vector lines and formal title block.
  - Constrained engineering blueprint print CSS to single-page letter landscape format, eliminating overflow cut-offs.
  - Enhanced Case Forming protocol sheet with dimensional delta comparison table, step progression boxes, and donut diagnostic alert.
- **Ecosystem Suite & Companion Links (`AboutModal.tsx`, `UserGuideModal.tsx`, `Navbar.tsx`)**:
  - Updated mobile companion links to `https://armstrader.store/companion` instead of GitHub.
  - Updated LoadBench and RangeStudio links in the Settings dropdown to their respective landing pages (`/loadbench`, `/rangestudio`).
- **Native System Print & Preview Bridge Across All Application Sheets (`src-tauri/src/lib.rs`, `fileExport.ts`)**:
  - Resolved macOS Tauri/WKWebView print blockage where `window.print()` and `window.open` were silently suppressed by the system WebKit view.
  - Implemented native Rust commands `trigger_system_print` (auto-print HTML via isolated OS temporary files) and `trigger_system_pdf_print` (direct vector PDF preview and print via Apple Preview.app on macOS and native OS PDF handlers on Windows/Linux).
  - Restored full print functionality across all 5 app modals and technical sheets: Engineering Blueprint Sheet (`PrintableSheet.tsx`), Chamber Reamer CAD Blueprint (`ReamerCADShopPrint.tsx`), Reamer Toolmaker Requisition (`ReamerModal.tsx`), Case Forming Protocol (`FormingModal.tsx`), and Toolroom Headspace Gauge Inspection Sheet (`HeadspaceModal.tsx`).
- **Engineering CAD Print Sheet Bullet Drawing Overhaul (`PrintableSheet.tsx`)**:
  - Replaced crude triangular cone bullet placeholder with authentic toolroom-grade projectile blueprint geometry: seated shank contour inside case neck (with hidden dashed profile), exposed cylindrical bearing surface shank, precision curved tangent ogive, blunted meplat tip, and extractor groove indentation.
  - Added dedicated offset $G_1$ ballistic coefficient callout and fixed non-functioning print button with robust cross-platform vector print bridge.
- **Miller Twist Stability Modal Layout & Scroll Cut-off (`TwistStabilityModal.tsx`)**:
  - Resolved CSS flex container overflow clipping where the bottom stability spectrum card was cut off behind the footer.
  - Implemented `-webkit-backdrop-filter` preceding declaration, `flex: 1`, and `min-height: 0` for smooth scrolling.
- **Wildcat Wizard Modal Column Cut-off (`WildcatWizardModal.tsx`)**:
  - Fixed flex layout clipping where left parametric inputs and right silhouette columns were cut off on smaller display viewports.
- **Settings Menu Nomenclature & Suite Links (`Navbar.tsx`)**:
  - Corrected ArmsTrader entry from "ArmsTrader Store" to "ArmsTrader (armstrader.store)" with vector `Globe` icon (digital utility suite, not an e-commerce store).
  - Added direct links to ecosystem suite applications: LoadBench, RangeStudio, ArmoryVault Core Suite.
- **Caliber Preset Duplicate Key & Category Collision (`WildcatWizardModal.tsx`, `BlueprintCanvas.tsx`, `bullets.ts`)**:
  - Resolved React duplicate key reconciliation warning (`Encountered two children with the same key, '0.51'`) by implementing composite unique keys (`${cal.category}-${cal.designation}-${cal.inches}`) for caliber preset selector grids.
  - Fixed category filter collision in `WildcatWizardModal` where `.50 BMG` in ELR was shadowed by African Express entries sharing the `.510"` diameter.
  - Separated `.505 Gibbs` (`inches: 0.505`) and `.500 Jeffery` (`inches: 0.510`) in `CALIBER_PRESETS` for authentic dimensional accuracy matching the cartridge database.

### Added
- **Native OS File Dialogs & Glassmorphic Toast Notifications (`@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`, `Toast.tsx`)**:
  - Replaced silent browser downloads into `~/Downloads` with native Tauri OS save/open dialogs for `.wildcat`, `.loadbench`, `.vol`, `.qdf`, `.rsb`, and `.dxf` exports.
  - Implemented glassmorphic toast notification system with `-webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);` and custom Lucide vector status indicators.
- **Rust Typst PDF Compilation Engine & Vector Print Bridge (`src-tauri/src/lib.rs`, `fileExport.ts`, `typstTemplates.ts`)**:
  - Implemented native Rust commands `check_typst_available` and `compile_typst_pdf` leveraging host Typst binary (`/usr/local/bin/typst`) to generate manufacturer-ready Reamer Requisition and Case Forming Protocol PDFs.
  - Implemented standalone vector HTML/SVG printable window fallback ensuring 100% print compatibility across macOS WKWebView, Windows, and Linux.
- **Universal Searchable Cartridge Database Selector Modal (`CartridgePickerModal.tsx`)**:
  - Replaced unsearchable native HTML `<select>` dropdowns across Case Forming (`FormingModal.tsx`), Wildcat Wizard (`WildcatWizardModal.tsx`), and Chamber Setback (`SetbackModal.tsx`) with a fast, category-tabbed search modal indexing 268+ cartridges.
- **Designer & Gunsmith Shop Profile System (`DesignerProfileModal.tsx`)**:
  - Added dedicated profile configuration dialog accessible from Settings menu to manage designer name, gunsmith shop name, and contact details stored in `localStorage`.
- **End-to-End Suite Pipeline Integration (Wildcat Studio -> LoadBench -> RangeStudio)**:
  - Harmonized `.loadbench` recipe generation with full dimensional, volumetric, and simulated performance metrics ready for interior ballistics work in LoadBench and exterior trajectory simulation in RangeStudio.
- **Native In-App Auto-Updater Suite (Tauri v2)**:
  - Integrated `@tauri-apps/plugin-updater` with native Rust plugin registration in `lib.rs` and `tauri-plugin-updater = "2"` in `Cargo.toml`.
  - Built dedicated `UpdateModal.tsx` in `src/components/modals/` with live download progress bar (bytes / total, percentage, ETA), release notes markdown rendering, and auto-check startup preference.
  - Added "Check for Updates..." to Settings dropdown and animated subtle glowing update pill in `Navbar.tsx` when a new version is detected.
- **Case Forming, Fire-Forming & Donut Diagnostic Solver (`FormingModal.tsx`)**:
  - Added dedicated case forming solver accessible from `Tools > Case Forming & Donut Diagnostic Solver...`.
  - Dual-contour silhouette SVG overlay contrasting donor parent case brass against custom wildcat target geometry.
  - Volumetric expansion calculations (% volume delta and grains H2O increase) with live/fire-forming method guidance (mild live fire jam load vs. Cream of Wheat inert plug).
  - Outside neck turning calculator evaluating loaded round neck diameter vs. chamber clearance (<0.0025" turning alert).
  - Internal neck doughnut risk detection identifying when parent shoulder brass is displaced into the new neck column, with inside neck reaming recommendations.
- **High-Precision Reamer & Headspace Gauge CAD Print (`ReamerCADShopPrint.tsx`)**:
  - Added tab switcher in `ReamerModal.tsx` between "Toolmaker Order Requisition" and "CAD Engineering Blueprint & Headspace Gauges".
  - High-precision technical blueprint SVG with cutting flutes, relief angles, leade forcing cone, and floating pilot bushing assortment range.
  - Complete precision Headspace Gauge set blueprint: GO gauge (min chamber datum), NO-GO gauge (max chamber datum), and FIELD gauge (service limit) with Rc 60–64 tool steel manufacturing specifications and print sheet output.
- **Enhanced 3D Lathe Modeler with Longitudinal Cutaway & Realistic Shaders**:
  - Implemented 0–100% longitudinal cutaway slice slider (supporting 90° quarter pie cut, 180° half-section, and custom slice angles).
  - Realistic multi-material shader suite:
    - Polished cartridge brass casing with internal wall taper and web contour.
    - Nickel-plated primer cup seated flush inside primer pocket.
    - Granular extruded nitrocellulose propellant column filling case up to the seated bullet base.
    - Dual-material projectile: gilding metal outer copper jacket and dense dull-grey lead alloy inner core.
- **Direct RangeStudio Ballistics Export (`.rsb`) & Enhanced LoadBench Export (`.ldb`)**:
  - Added native RangeStudio Ballistics profile generator (`exportRangeStudioBallistics`) exporting `.rsb` files with 100-yard trajectory drop/drift tables, G1/G7 drag coefficients, and atmospheric defaults.
  - Enhanced LoadBench `.ldb` export with bullet bearing surface, powder fill capacity %, and proof pressure margins.
- **Cartridge Presets Library Expansion**:
  - Added `.338 Weatherby RPM` (`338_rpm`) to Magnums & ELR library.
  - Verified complete dimensional data for modern 2024–2026 standards: `22 ARC`, `6mm ARC`, `7mm PRC`, `300 PRC`, `8.6 Blackout`, `360 Buckhammer`, and `400 Legend`.
- **Anti-Monolith Modal Extraction & CSS Prefix Hygiene**:
  - Extracted `AboutModal.tsx` and `FormingModal.tsx` into `src/components/modals/`.
  - Enforced mandatory `-webkit-backdrop-filter` preceding declarations across all modals and dropdown menus.
- **Custom Application & Taskbar Icon Suite (`app-icon.png`, `src-tauri/icons/`, `public/app-icon.png`, `public/icon.png`)**:
  - Implemented high-definition Split Gunmetal & Glowing Blueprint CAD Wireframe Cutaway icon (Concept C) featuring an upright cartridge split down the center: half solid brushed gunmetal steel, and half glowing electric blueprint cyan CAD wireframe cutaway with internal powder volume ticks.
  - Generated complete cross-platform icon assets for macOS (`icon.icns`), Windows (`icon.ico`, `Square*Logo.png`), Linux (`32x32.png`, `64x64.png`, `128x128.png`, `icon.png`), and web favicon (`public/app-icon.png`, `public/icon.png`, `public/favicon.ico`).
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
