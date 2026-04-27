# DIAW Downloader Python Backend

Backend ini menggunakan Python dan `yt-dlp` untuk memproses link download dengan lebih stabil dan cepat dibanding Vercel.

## Cara Install di Hosting Kamu:

1.  **Upload:** Copy semua file di dalam folder `python-backend` ini ke hostingan kamu.
2.  **Install Dependencies:** Jalankan perintah berikut di terminal hosting kamu (jika tersedia):
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run:** Jalankan aplikasi dengan:
    ```bash
    python app.py
    ```
    Atau jika di production (misal Heroku/Railway/VPS), gunakan gunicorn:
    ```bash
    gunicorn app:app
    ```

## Cara Menghubungkan ke Frontend (Next.js):

Setelah backend Python kamu online, buka file `src/app/api/download/route.ts` di project Next.js kamu, lalu ganti logika di dalamnya agar memanggil URL backend Python kamu.

**Contoh Logic di Next.js:**
```typescript
const pythonApiUrl = "https://url-hosting-python-kamu.com/api/download";
const res = await fetch(pythonApiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: targetUrl })
});
```
