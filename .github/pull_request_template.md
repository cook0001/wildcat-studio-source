## Description
<!-- Provide a clear, concise summary of the changes and motivation behind them. -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New cartridge / CAD feature (non-breaking change adding functionality)
- [ ] ⚡ Numerical / Solver performance optimization
- [ ] 🎨 UI/UX styling & canvas drafting responsiveness
- [ ] 🔧 Build / CI/CD / Dependencies

## Pre-Submission Quality Checklist
- [ ] **Frontend TypeScript**: Ran `npx tsc --noEmit` with zero errors.
- [ ] **Production Bundle**: Ran `npm run build` and client bundle builds cleanly.
- [ ] **Rust Core**: Ran `cargo check --manifest-path src-tauri/Cargo.toml` and `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` with zero warnings.
- [ ] **Volumetric & Parser Unit Tests**: Ran `cargo test --manifest-path src-tauri/Cargo.toml` and all tests pass.
- [ ] **Rule #2 Strict Emoji Ban**: Zero raw emoji placeholders in UI markup; dedicated vector SVGs or Lucide icons only.
- [ ] **Zero-Cloud Guarantee**: Confirmed cartridge designs and CAD parameters remain strictly on the local machine.
- [ ] **Documentation**: Documented changes in `CHANGELOG.md` under the appropriate header.
