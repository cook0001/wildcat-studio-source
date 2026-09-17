# Security Policy

## Supported Versions

Wildcat Studio is actively maintained. Security updates, cryptographic patches, and critical hotfixes are provided for the following versions:

| Version | Supported | Notes |
| :--- | :--- | :--- |
| **1.0.x** | :white_check_mark: Yes | Current production release |
| **< 1.0.0** | :x: No | Beta / Pre-release builds (unsupported) |

---

## Reporting a Vulnerability

We take the security and mathematical integrity of Wildcat Studio seriously. If you discover a potential security vulnerability, memory corruption bug, or algorithmic integrity issue, please disclose it responsibly.

### How to Report

1. **GitHub Private Vulnerability Reporting (Preferred)**:
   - Navigate to the **Security** tab of the repository.
   - Click **Report a vulnerability** to open a confidential advisory draft.
   - This ensures the issue is reviewed in private before public disclosure.

2. **Responsible Disclosure Guidelines**:
   - **Do NOT** open a public issue or discussion thread disclosing the vulnerability details.
   - Provide a detailed description including:
     - The type of vulnerability (e.g., buffer overflow, file path traversal during export, binary corruption).
     - The affected platform(s) (macOS Universal, Windows x64, Linux amd64).
     - Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
     - Expected vs actual behavior.

### Response & Remediation Timelines

- **Initial Acknowledgment**: Within **48 hours** of report receipt.
- **Triage & Impact Assessment**: Within **5 business days**.
- **Remediation & Patch Release**: A hotfix release will be built via the hardened CI pipeline, accompanied by updated `SHA256SUMS.txt` cryptographic signatures and a coordinated security advisory.

---

## Scope & Security Architecture

Wildcat Studio operates strictly as an offline, zero-telemetry desktop application. The following areas are strictly monitored:

- **Mathematical & Telemetry Safety**: Integrity of the 1000-slice Simpson composite volumetrics solver, chamber reamer tolerance calculations, and live clearance callouts.
- **Export Sanitization**: Safe parsing and generation of AutoCAD DXF vectors, QuickDESIGN QDF, QuickLOAD VOL, and 3D STL meshes to prevent path traversal or malicious injection.
- **Binary Integrity**: Native Mach-O, PE, and ELF binaries built in cleanroom GitHub Actions virtual environments with dead-code elimination, symbol stripping, and Terser obfuscation.
- **Data Privacy**: All custom cartridge records and screen calibration DPI data reside exclusively in local client storage; no data is ever transmitted externally.

---

## Cryptographic Binary Verification

To verify that your downloaded binary package has not been altered or tampered with in transit, always compare its SHA-256 hash against the official `SHA256SUMS.txt` published on the [Releases](https://github.com/cook0001/wildcat-studio/releases) page.

### Verification Commands:

#### macOS / Linux
```bash
# Verify checksums file directly
shasum -a 256 -c SHA256SUMS.txt

# Or check an individual package
shasum -a 256 Wildcat-Studio-v1.0.0-universal.dmg
```

#### Windows (PowerShell)
```powershell
# Check hash
Get-FileHash -Algorithm SHA256 .\Wildcat.Studio_1.0.0_x64-setup.exe

# Or using certutil
certutil -hashfile .\Wildcat.Studio_1.0.0_x64-setup.exe SHA256
```

---

*Copyright © 2026 Wildcat Studio. All rights reserved.*
