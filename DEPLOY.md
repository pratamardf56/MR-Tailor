# Panduan Deploy — Godabaya Tailor

Arsitektur: **1 server backend (data pusat)** + **website customer (publik)** + **APK admin**.
Ketiganya menunjuk ke server backend yang sama.

```
        SERVER (Railway)  ← sumber data tunggal (SQLite persisten)
        /              \
  Website (Vercel)      APK (EAS Build)
  untuk customer        untuk 1 admin
```

---

## 1. Deploy Server ke Railway

Server ada di folder `server/` (Node.js murni, butuh Node >= 22.5).

1. Push project ke GitHub.
2. Buka [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → pilih repo ini.
3. Di service settings:
   - **Root Directory**: `server`
   - Start command sudah diatur otomatis via `server/railway.json` (`node index.js`).
4. Tambahkan **Volume** (penyimpanan persisten) — WAJIB agar database tidak hilang saat restart:
   - Mount path: `/data`
5. Set **Variables** (Environment):
   | Variable | Nilai | Keterangan |
   |----------|-------|------------|
   | `DATA_DIR` | `/data` | Sama dengan mount path volume |
   | `ALLOWED_ORIGINS` | `https://NAMA-WEB.vercel.app` | Domain website customer (isi setelah langkah 2) |
   | `ADMIN_USERNAME` | `081214386602` | Nomor WhatsApp admin |
   | `ADMIN_PIN` | (PIN kuat) | GANTI dari 9999! |
   | `ADMIN_NAME` | `Penjahit` | Nama tampilan admin |
6. Deploy. Railway memberi domain publik HTTPS, mis. `https://godabaya-api.up.railway.app`.
7. Cek: buka `https://<domain-server>/health` → harus `{"ok":true}`.

> Catatan: `PORT` diisi otomatis oleh Railway, tidak perlu di-set manual.

---

## 2. Deploy Website Customer ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repo ini.
2. Konfigurasi sudah diatur via `vercel.json`:
   - Build: `npx expo export --platform web`
   - Output: `dist`
3. Set **Environment Variable**:
   | Variable | Nilai |
   |----------|-------|
   | `EXPO_PUBLIC_API_URL` | `https://<domain-server>` (dari langkah 1) |
4. Deploy. Vercel memberi domain, mis. `https://godabaya-tailor.vercel.app`.
5. **Kembali ke Railway**, isi `ALLOWED_ORIGINS` dengan domain Vercel ini, lalu redeploy server.

Website ini otomatis TIDAK menampilkan halaman admin (disembunyikan di web).
Inilah alamat yang disebar ke customer.

---

## 3. Build APK Admin (EAS)

1. Install & login:
   ```
   npm install -g eas-cli
   eas login
   ```
2. Inisialisasi (sekali saja, mengisi projectId di app.json):
   ```
   eas init
   ```
3. Edit `eas.json` → ganti `EXPO_PUBLIC_API_URL` pada profil `preview`
   dengan domain server dari langkah 1.
4. Build APK:
   ```
   eas build --platform android --profile preview
   ```
5. Setelah selesai, unduh APK dari link yang diberikan → install di HP admin.

Admin login lewat APK (menu Akses Admin / Penjahit) dengan nomor + PIN
sesuai `ADMIN_USERNAME` / `ADMIN_PIN` di server.

---

## Checklist keamanan sebelum publik

- [ ] `ADMIN_PIN` sudah diganti dari `9999` ke PIN kuat.
- [ ] `ALLOWED_ORIGINS` hanya berisi domain website customer.
- [ ] Server & website berjalan di HTTPS (otomatis di Railway & Vercel).
- [ ] `.env` tidak ikut ter-commit (sudah di `.gitignore`).

## Uji cepat tanpa deploy (opsional, pakai ngrok)

```
node server/index.js                  # terminal 1
npx ngrok http 3001                   # terminal 2 → dapat URL publik sementara
```
Set `EXPO_PUBLIC_API_URL` ke URL ngrok untuk uji dari HP di data seluler.
