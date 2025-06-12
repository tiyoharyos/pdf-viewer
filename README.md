
📄 PDF Viewer

Aplikasi React sederhana untuk menampilkan dan mencari teks dalam file PDF. Dilengkapi dengan fitur:

- 🔍 Pencarian teks
- 🔁 Rotasi halaman
- 🔎 Zoom in / out
- 🌓 Dark mode
- 🎯 Navigasi hasil pencarian

--------------------------------------------------

🚀 Cara Menjalankan Proyek

1. Clone repositori ini:

   git clone <https://github.com/tiyoharyos/pdf-viewer.git>
   
   cd pdf-viewer

2. Install dependencies:

   npm install

3. Jalankan proyek di development mode:

   npm run dev

4. Build untuk produksi:

   npm run build

5. Preview hasil build:

   npm run preview

--------------------------------------------------

🏗️ Arsitektur Proyek

pdf-viewer/
├── public/
├── src/
│   ├── components/
│   │   └── PDFViewer.jsx      # Komponen utama viewer PDF
│   ├── App.jsx                # Mengatur dark mode dan layout utama
│   └── main.jsx               # Entry point React
├── package.json
└── vite.config.js

Penjelasan:

- PDFViewer.jsx  
  Berisi logika utama untuk me-load PDF menggunakan PDF.js, menampilkan halaman, menangani zoom, rotasi, dark mode, dan pencarian.

- App.jsx  
  Mengatur tema global (light/dark mode) dan menyisipkan PDFViewer.

- main.jsx  
  Entry point aplikasi React.

- vite.config.js  
  Konfigurasi untuk bundler Vite.

--------------------------------------------------

🧩 Dependencies

Dependencies Utama:

- react, react-dom: Library utama untuk membangun UI.
- pdfjs-dist: Menampilkan dan membaca isi PDF.
- bootstrap, react-bootstrap: Komponen UI cepat berbasis Bootstrap.
- tailwindcss: Utility-first CSS framework untuk styling.
- lucide-react: Ikon SVG modern berbasis React.

Dev Dependencies:

- vite: Bundler cepat untuk pengembangan React.
- @vitejs/plugin-react: Plugin Vite untuk React.
- eslint, @eslint/js: Menjaga kualitas kode.
- eslint-plugin-react-hooks: Menjaga konsistensi penggunaan React Hooks.
- eslint-plugin-react-refresh: Hot module replacement saat development.
- @types/react, @types/react-dom: Mendukung IntelliSense dan type checking.

--------------------------------------------------


