from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os

app = Flask(__name__)
CORS(app) # Mengizinkan frontend Next.js kamu memanggil API ini

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "ready", "message": "DIAW Downloader Python Backend is Running"})

@app.route('/api/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({"status": "error", "message": "URL is required"}), 400

    try:
        # Konfigurasi yt-dlp
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'best',
            # Optimasi untuk kecepatan dan bypass
            'nocheckcertificate': True,
            'ignoreerrors': False,
            'logtostderr': False,
            'no_color': True,
            'no_playlist': True,
            'extract_flat': False,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Ekstrak informasi tanpa mendownload file
            info = ydl.extract_info(url, download=False)
            
            # Format data untuk dikirim ke frontend Next.js
            formats = info.get('formats', [])
            picker = []
            
            # Cari format video terbaik
            video_url = info.get('url') # Link direct
            
            # Olah daftar pilihan (picker)
            for f in formats:
                # Ambil yang ada link-nya dan punya info kualitas
                if f.get('url') and (f.get('vcodec') != 'none' or f.get('acodec') != 'none'):
                    ext = f.get('ext', 'mp4')
                    res = f.get('resolution') or f.get('format_note') or "HD"
                    note = f.get('format_note') or ""
                    
                    # Saring agar tidak terlalu banyak pilihan yang membingungkan
                    if 'http' in f.get('url'):
                        picker.append({
                            "url": f.get('url'),
                            "quality": f"{res} {note}".strip(),
                            "extension": ext,
                            "type": "video" if f.get('vcodec') != 'none' else "audio"
                        })

            # Jika data spesifik tidak ketemu, gunakan info utama
            return jsonify({
                "status": "stream",
                "url": video_url,
                "title": info.get('title', 'Media Content'),
                "thumbnail": info.get('thumbnail', ''),
                "source": "Python yt-dlp Engine",
                "picker": picker[:10] # Ambil 10 pilihan teratas saja
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": f"Gagal mengambil data: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Jalankan di port 5000 (standar Flask)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
