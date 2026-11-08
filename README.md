# nonformal — ultra-lightweight Indonesian personality layer untuk AI coding agents

[![Bundle Size](https://img.shields.io/badge/bundle-~145KB-success.svg)](#keunggulan--highlights)
[![Zero Daemon](https://img.shields.io/badge/daemon-zero-blue.svg)](#keunggulan--highlights)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

`nonformal` adalah personality dan zero-fluff communication layer ultra-ringan bahasa Indonesia dan daerah untuk AI coding agents (Google Antigravity, Claude Code, Cursor, OpenCode, GitHub Copilot). Dirancang untuk developer yang bosan dengan basa-basi korporat AI, respons robotik bertele-tele, dan pemborosan token reasoning yang bocor ke output.

---

## ⚡ Keunggulan / Highlights

- **Bundle Ultra-Ringan (~145KB minified)**: Bundled single-file ESM mandiri tanpa bloatware — no `ajv`, no `gpt-tokenizer`.
- **Zero Daemon**: Tidak ada proses background yang berjalan diam-diam menguras CPU dan RAM.
- **Zero External Runtime Bloat**: Mengganti dependency berat dengan pure deterministic heuristic token estimator dan native TypeScript validators.
- **Pure Local & Atomic**: Menggunakan atomic filesystem writes dengan SHA-256 integrity verification.
- **Multi-Agent First-Class**: Mendukung Google Antigravity (default), Claude Code, Cursor (agents-md), OpenCode, Qoder, dan GitHub Copilot.

---

## 🚀 Quick Start

Buka terminal di root direktori proyek Anda, lalu jalankan:

```bash
npx nonformal install --profile rusuh-id --adapter antigravity --target .
```

Periksa integritas file kapan saja:
```bash
npx nonformal doctor --target .
```

Untuk memperbarui atau menghapus:
```bash
# Update
npx nonformal update --target .

# Uninstall bersih
npx nonformal uninstall --target .
```

---

## 🎭 Personas Tersedia / Available Personas

`nonformal` menyediakan 3 persona dengan karakteristik unik:

| Persona ID | Nama | Bahasa / Dialek | Karakter & Tone |
| :--- | :--- | :--- | :--- |
| `rusuh-id` | **+62 Mode** | Bahasa Indonesia Santai / Slang | Cepat, tajam, to-the-point, ceplas-ceplos khas grup dev lokal, menantang bad architecture, zero basa-basi. |
| `halal-id` | **HALAL** | Bahasa Indonesia Sopan & Santun | Ramah, penuh etika, bebas konten toksik/sarkasme tajam, ideal untuk lingkungan formal/edukatif. |
| `jawa-id` | **JAWA** | Basa Jawa & Dialek Banyumasan | Mengadaptasi tata krama bahasa Jawa (Ngoko/Krama) dan dialek lokal untuk suasana koding yang akrab dan guyub. |

Lihat daftar lengkap persona dan adapter kapan saja:
```bash
npx nonformal list
```

---

## 🛠️ Panduan Instalasi per Agent / Agent Install Guides

### 1. Google Antigravity (Default)
Google Antigravity menggunakan aturan berbasis direktori (`.agents/rules/`):
```bash
# Per-project
npx nonformal install --profile rusuh-id --adapter antigravity --target .

# Global (berlaku untuk semua sesi Antigravity)
npx nonformal install --profile rusuh-id --adapter antigravity --target ~/.gemini --scope global
```

### 2. Claude Code
Menginstal skill tree di `.claude/skills/` dan managed block di `CLAUDE.md`:
```bash
npx nonformal install --profile rusuh-id --adapter claude-code --target .
```

### 3. Cursor / Windsurf (`agents-md`)
Menghasilkan managed block di `AGENTS.md` dan rules di `.cursor/rules/`:
```bash
npx nonformal install --profile rusuh-id --adapter agents-md --target .
```

### 4. OpenCode
Menginstal managed block di `AGENTS.md` dan kompatibel dengan skill tree:
```bash
npx nonformal install --profile rusuh-id --adapter opencode --target .
```

### 5. GitHub Copilot
Menggunakan format folded instruction di `.github/copilot-instructions.md`:
```bash
npx nonformal install --profile rusuh-id --adapter copilot --target .
```

---

## 📖 English Overview

`nonformal` is an ultra-lightweight personality layer injecting natural Indonesian and regional vernacular into AI coding agents.

### Why nonformal?
- **Sub-50KB bundle**: Single-file distributable, lightning-fast execution.
- **Zero daemons**: Pure static configuration layer, no persistent memory footprint.
- **Deterministic Token Estimator**: Built-in Indonesian/Javanese heuristic tokenizer running in microseconds without external dictionary downloads.
- **Full Lifecycle Management**: Clean installation, atomic updates, tamper detection via `doctor`, and zero-residue `uninstall`.

### Supported Commands
- `nonformal list`: List available personas and supported agent adapters.
- `nonformal install`: Install managed configuration blocks and rules into target workspace.
- `nonformal update`: Re-synchronize installed files against the latest engine templates.
- `nonformal doctor`: Verify file hashes and report any manual modifications.
- `nonformal uninstall`: Completely remove injected blocks and prune empty directories.
- `nonformal measure`: Inspect token budgets for always-on and on-demand layers.
- `nonformal build`: Compile artifacts without writing to target directories.

---

## 📄 Lisensi / License

MIT License. Copyright (c) 2026 nonformal contributors.
