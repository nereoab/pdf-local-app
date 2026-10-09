<div align="center">

# ♠️ PDFBlack

**Privacy-First, 100% Client-Side PDF Tools Suite powered by WebAssembly & Web Workers.**  
*Zero server uploads. Zero file size limits. 100% Zero-Knowledge data privacy.*

[![Website](https://img.shields.io/badge/Website-pdf--black.com-000000?style=for-the-badge&logo=google-chrome&logoColor=white)](https://pdf-black.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-Wasm-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Privacy](https://img.shields.io/badge/Privacy-Zero--Knowledge-2ea44f?style=for-the-badge&logo=shield&logoColor=white)](https://pdf-black.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[**Explore Live App »**](https://pdf-black.com) · [Report Bug](https://github.com/nereoab/pdf-local-app/issues) · [Request Feature](https://github.com/nereoab/pdf-local-app/issues)

</div>

---

## ⚡ Why PDFBlack?

Traditional online PDF converters (such as iLovePDF, Smallpdf, or Adobe Acrobat Web) require you to upload your sensitive contracts, medical records, invoices, and legal filings to third-party cloud servers.

**PDFBlack is fundamentally different:**
- 🛡️ **Zero Server Uploads:** Every single operation (merging, splitting, compressing, OCR, and Bates numbering) is executed **100% inside your browser** using **Web Workers** and **WebAssembly (Wasm)**.
- 🚀 **No Artificial Size Limits:** Process multi-hundred megabyte files at the native speed of your device CPU, without paywalls or bandwidth throttling.
- 🔒 **GDPR, HIPAA & Legal Compliance:** Your confidential documents never leave your computer's RAM, ensuring strict attorney-client privilege and regulatory compliance.
- 💻 **Offline & Local Resilience:** Once loaded, core operations work entirely without sending a single byte over the wire.

---

## 🛠️ Key Features & Tools

| Category | Tool | Description | Live Link |
| :--- | :--- | :--- | :--- |
| **Legal & Bates** | **Foliar PDF Judicial** | Bates numbering and custom legal stamps for court filings (SINOE, LexNET, Poder Judicial). | [Launch Tool](https://pdf-black.com/editar/foliar) |
| **Organize** | **Unir PDF** | Merge multiple large PDF documents instantly in browser memory. | [Launch Tool](https://pdf-black.com/organizar/unir) |
| **Organize** | **Dividir & Eliminar** | Extract page ranges or remove specific pages without re-encoding quality loss. | [Launch Tool](https://pdf-black.com/organizar/eliminar) |
| **Optimize** | **Comprimir PDF** | Smart stream compression targeting 1MB, 200KB or custom DPI thresholds. | [Launch Tool](https://pdf-black.com/optimizar/comprimir) |
| **Convert** | **PDF a Word (DOCX)** | High-fidelity OpenXML extraction with structural table and column detection. | [Launch Tool](https://pdf-black.com/soluciones/convertir-pdf-a-word-editable) |
| **Convert** | **PDF a Blanco y Negro** | Grayscale converter and ink-saver mode for ultra-efficient printing. | [Launch Tool](https://pdf-black.com/en/convert-pdf-to-black-and-white) |
| **Security** | **Proteger & Desbloquear** | Client-side AES-256 encryption and permission management. | [Launch Tool](https://pdf-black.com/seguridad/proteger) |

---

## 🏗️ Architecture & Technology Stack

PDFBlack relies on an asynchronous, multi-threaded client-side pipeline to ensure maximum performance and zero UI freezing:

```
┌────────────────────────────────────────────────────────┐
│                   Browser UI (React / Next.js)         │
└───────────────────────────┬────────────────────────────┘
                            │ Comlink RPC
                            ▼
┌────────────────────────────────────────────────────────┐
│              Dedicated Web Worker Threads              │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │   pdf-lib / Wasm     │    │   ONNX / Tesseract   │  │
│  │  (PDF Manipulation)  │    │     (Local OCR)      │  │
│  └──────────────────────┘    └──────────────────────┘  │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │     OpenXML docx     │    │   Canvas / Fabric    │  │
│  │   (DOCX Generator)   │    │  (Visual Bates Foil) │  │
│  └──────────────────────┘    └──────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Components & Static Site Generation)
- **Styling:** Tailwind CSS & Framer Motion
- **Worker Concurrency:** [Comlink](https://github.com/GoogleChromeLabs/comlink) for type-safe Web Worker orchestration
- **PDF Engine:** `pdf-lib` compiled with custom buffer manipulation
- **Document Generation:** `docx` OpenXML builder with native XML layout preservation
- **ML / AI Inference:** `onnxruntime-web` for local on-device document intelligence

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later recommended)
- `npm` or `pnpm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nereoab/pdf-local-app.git
   cd pdf-local-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check out the [issues page](https://github.com/nereoab/pdf-local-app/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
Built with ♠️ by <a href="https://pdf-black.com">PDFBlack</a>
</div>
