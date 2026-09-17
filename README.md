# Wildcat Studio (Source Core)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Build](https://img.shields.io/badge/QC-passing-brightgreen.svg)
![Security](https://img.shields.io/badge/security-monitored-success.svg)
![License](https://img.shields.io/badge/license-Proprietary%20Freeware-green.svg)

This is the private source code repository for **Wildcat Studio**, the industrial-grade desktop computer-aided drafting (CAD) and internal ballistics volumetrics suite.

> [!IMPORTANT]
> **Confidential Source Code**: This repository contains proprietary mathematical algorithms, parametric definitions, and compiled native solvers. Public distribution is handled through [`cook0001/wildcat-studio`](https://github.com/cook0001/wildcat-studio), which hosts only compiled binaries, installation documentation, and cryptographic checksums.

---

## 🏗️ Architecture

- **Frontend CAD & GUI Layer**: React 18, TypeScript, Tailwind/Vanilla CSS, Lucide icons, Canvas 2D vector drafting engine, and WebGL lathe preview.
- **Backend Native Core**: Rust (Tauri 2), Simpson composite 1000-slice numerical integrator, reamer tooling clearance solver, DXF/STL exporters.
- **Security & Obfuscation**:
  - Terser variable/property mangling with top-level identifier scrambling.
  - Zero sourcemap generation (`sourcemap: false`).
  - Production DevTools and inspect element shortcut lockout.
  - Stripped native release binaries (`opt-level = 3`, `lto = true`, `strip = true`).

---

## 🔒 Security Policy & Checksums

- See [SECURITY.md](SECURITY.md) for vulnerability disclosure guidelines and security architecture.
- Official release checksums are maintained in [SHA256SUMS.txt](SHA256SUMS.txt).

---

## 🧪 Local Development & Quality Control

```bash
# Install frontend dependencies
npm ci

# Run development server with Hot Module Reloading (HMR)
npm run tauri dev

# Typecheck and production bundle verification
npx tsc --noEmit
npm run build

# Rust unit tests and strict linter
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

---

*Copyright © 2026 Wildcat Studio. All rights reserved.*
