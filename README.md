# Sertifikat2 – AI Certificate Background Generator

Sertifikat2 adalah aplikasi Next.js yang membantu Anda membuat latar sertifikat landscape premium langsung dari browser. Pengguna menuliskan instruksi sertifikat, memilih model AI (OpenRouter atau Z.AI), lalu menerima HTML dekoratif yang aman dicetak dan siap diunduh sebagai PDF, PNG, atau JPG. Semua permintaan AI stateless sehingga setiap generasi benar-benar baru tanpa riwayat percakapan. @app/page.tsx#152-424

## Fitur Utama

- **Generator HTML dekoratif berbasis AI** – Prompt ketat memastikan tata letak aman, tidak overflow, dan hanya memakai warna yang kompatibel untuk ekspor. @app/page.tsx#152-185
- **Dukungan multi-provider** – Pilih OpenRouter atau Z.AI, cari model, dan simpan API key di localStorage pengguna. @app/page.tsx#495-647
- **Editor instruksi fleksibel** – Masukkan data peserta, nomor sertifikat, preferensi layout, dst. Instruksi lama otomatis dimigrasi ke format bebas. @app/page.tsx#233-709
- **Preview interaktif** – Canvas memanfaatkan template/palette internal saat belum ada hasil AI, lengkap dengan dekorasi acak deterministik. @components/certificate-canvas.tsx#1-55 @lib/design.ts#4-22
- **Ekspor sekali klik** – Unduh HTML mentah, cetak langsung, atau ekspor PDF/PNG/JPG menggunakan html2canvas + jsPDF dengan penormal warna otomatis. @app/page.tsx#399-543 @lib/export.ts#1-218
- **Netlify-ready API routes** – Serverless route untuk fetch model dan generate HTML di kedua provider, lengkap fallback & pesan error ramah. @app/api/openrouter/generate/route.ts#1-158 @app/api/zai/generate/route.ts#1-160 @app/api/openrouter/models/route.ts#1-24

## Teknologi

- Next.js 16 (App Router) & React 19
- TypeScript + Tailwind CSS v4 preview
- DOMPurify, culori, html2canvas, jsPDF
- Netlify Functions / Next.js Route Handlers

Daftar lengkap paket ada di `package.json`. @package.json#1-32

## Struktur Proyek

```
app/                Halaman utama & API routes
components/         Canvas sertifikat, toolbar, dekorasi
lib/                Palet warna, template, utilitas ekspor
public/             Aset statis
netlify.toml        Konfigurasi deploy Netlify
```

## Prasyarat

- Node.js 20.x (disarankan) atau versi minimal yang didukung Next.js 16.
- npm (mengikuti `package-lock.json`). Anda boleh memakai pnpm/yarn bila diinginkan.

## Menjalankan Secara Lokal

1. **Instal dependensi**
   ```bash
   npm install
   ```
2. **Jalankan mode pengembangan**
   ```bash
   npm run dev
   ```
   Aplikasi tersedia di `http://localhost:3000`.
3. **Build produksi**
   ```bash
   npm run build
   npm start
   ```

## Konfigurasi API & Environment

- Pengguna memasukkan API key OpenRouter/Z.AI melalui UI. Nilai disimpan di `localStorage` browser, bukan environment server. @app/page.tsx#495-580
- Serverless route otomatis meneruskan system prompt + prompt pengguna ke provider tanpa riwayat percakapan (stateless). @app/api/openrouter/generate/route.ts#59-157 @app/api/zai/generate/route.ts#63-158
- Opsional: Anda dapat men-set `ZAI_BASE_URL` atau `ZAI_CODING_BASE_URL` di environment hosting untuk mengarahkan endpoint kustom. @app/api/zai/generate/route.ts#12-42

Tidak diperlukan `.env` wajib untuk menjalankan aplikasi dasar.

## Cara Menggunakan

1. Pilih provider (OpenRouter/Z.AI) dan masukkan API key Anda.
2. Cari & pilih model dari daftar (misalnya `openrouter/google/learnlm-1.5`). @app/page.tsx#582-633
3. Pilih ukuran kertas (A4 atau F4) demi prompt & ekspor yang sesuai. @app/page.tsx#634-647
4. Isi instruksi sertifikat pada modal “Data Sertifikat”.
5. Klik **Generate** untuk meminta AI membuat HTML dekoratif.
6. Setelah berhasil, gunakan toolbar untuk mengunduh HTML, mencetak, atau ekspor PDF/PNG/JPG.

Tips: jika model gagal karena tidak mendukung system role, backend otomatis mencoba ulang dengan instruksi digabungkan ke prompt pengguna—ganti model bila tetap gagal. @app/api/openrouter/generate/route.ts#91-135

## API Ringkas

| Route | Metode | Deskripsi |
| --- | --- | --- |
| `/api/openrouter/generate` | POST | Proxy ke OpenRouter chat completions. |
| `/api/openrouter/models` | GET | Mengambil daftar model OpenRouter terbaru. |
| `/api/zai/generate` | POST | Proxy ke Z.AI coding/general endpoint dgn fallback otomatis. |

Setiap route hanya menerima `apiKey`, `model`, dan `prompt`, lalu mengembalikan `{ html: string }` saat sukses.

## Deployment

- Proyek menyertakan konfigurasi Netlify sehingga bisa langsung dideploy menggunakan Next.js adapter resmi.
- Pastikan environment runtime memakai Node 20 dan mengizinkan panggilan keluar ke OpenRouter serta Z.AI.
- Untuk hosting lain (Vercel, self-host), ikuti proses build Next standar.

## Lisensi

Belum ada lisensi eksplisit. Tambahkan lisensi pilihan Anda sebelum memublikasikan repositori secara publik.

---

Selamat berkreasi dengan generator sertifikat ini! Jika menemukan bug atau ide peningkatan, silakan buka issue/pr. 
