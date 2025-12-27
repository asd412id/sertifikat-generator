# Netlify Deployment Guide

## Environment Variables

Untuk deployment di Netlify, tambahkan environment variables berikut di Netlify dashboard:

### OpenRouter (Recommended)
```
Tidak memerlukan environment variables
API key disimpan di localStorage user
```

### Z.AI (GLM)
```
ZAI_BASE_URL = https://api.z.ai/api/paas/v4
ZAI_CODING_BASE_URL = https://api.z.ai/api/coding/paas/v4
```

## Configuration

File `netlify.toml` sudah dikonfigurasi dengan:
- Timeout function: 30 detik
- Node bundler: esbuild
- Plugin: @netlify/plugin-nextjs

## Troubleshooting Error 502

### Jika Z.AI error 502 di production:

1. **Cek Environment Variables**
   - Pastikan `ZAI_BASE_URL` dan `ZAI_CODING_BASE_URL` sudah benar
   - Cek di Netlify Dashboard > Site Settings > Environment Variables

2. **Cek API Key**
   - Pastikan API key Z.AI aktif dan memiliki quota
   - Test dengan API key di local development

3. **Cek Koneksi**
   - Netlify functions harus bisa connect ke `api.z.ai`
   - Cek firewall atau network restrictions

4. **Timeout**
   - Request dibatasi 30 detik
   - Jika timeout, coba generate ulang

## Fitur Filter Backticks & Penjelasan AI

### Masalah yang Difix:
1. **Backticks**: ` ```html ` dan ` ``` ` dihapus otomatis
2. **Penjelasan AI**: Teks seperti "Berikut adalah..." dihapus
3. **User Override**: Style preferences di prompt dihargai

### Cara Penggunaan:
1. **Filter Backticks**: Otomatis di API routes dan client
2. **User Override**: Tambahkan preferensi di form data:
   ```
   Nomor: 001.2025/X/SCERT
   Nama: ANDI SAPUTRA

   Preferensi: font besar, warna merah, rata kiri
   ```

## Testing

### Local:
```bash
npm run dev
```

### Production:
Deploy ke Netlify dan test:
1. Generate dengan Z.AI
2. Generate dengan OpenRouter
3. Cek preview (harus bersih dari backticks & penjelasan)
4. Cek export PDF/PNG

## Notes

- Semua API routes sudah memiliki timeout 30 detik
- Retry mechanism: 3x dengan exponential backoff
- Error handling spesifik untuk timeout dan network errors
- HTML validation tetap berjalan setelah filter
