from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os
import ssl
import subprocess
import sys

# Fungsi Auto-Update yt-dlp saat startup (untuk hosting tanpa terminal)
def auto_update():
    try:
        print("Checking for yt-dlp updates...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", "yt-dlp"])
        print("yt-dlp updated successfully!")
    except Exception as e:
        print(f"Auto-update failed: {e}")

auto_update()

# Matikan verifikasi SSL secara global untuk mengatasi error [SSL: CERTIFICATE_VERIFY_FAILED]
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

app = Flask(__name__)
CORS(app)

# Tampilkan versi yt-dlp saat startup untuk debugging
print(f"DEBUG: Current yt-dlp version: {yt_dlp.version.__version__}")

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
        # Tentukan path file cookies
        cookies_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
        
        # Konfigurasi ULTRA BYPASS
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'bestvideo+bestaudio/best',
            'nocheckcertificate': True,
            'ignoreerrors': False,
            'no_playlist': True,
            'wait_for_video': 5,
            # Penyamaran Header yang lebih lengkap
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.youtube.com/',
            },
            # Spoofing client yang lebih beragam (Android, iOS, dan YouTube Music)
            # Spoofing client TV & Web Creator (Paling ampuh saat ini)
            'extractor_args': {
                'youtube': {
                    'player_client': ['tv', 'web_creator'],
                    'player_skip': ['webpage', 'configs'],
                }
            }
        }

        # Jika file cookies.txt ada, gunakan untuk bypass
        if os.path.exists(cookies_path):
            print(f"Using cookies from: {cookies_path}")
            ydl_opts['cookiefile'] = cookies_path
        else:
            print("No cookies.txt found, using guest mode.")

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Menggunakan process_ie untuk ekstraksi yang lebih mendalam
            info = ydl.extract_info(url, download=False)
            
            formats = info.get('formats', [])
            picker = []
            
            # Link utama
            video_url = info.get('url') or (formats[-1].get('url') if formats else None)
            
            for f in formats:
                if f.get('url') and (f.get('vcodec') != 'none' or f.get('acodec') != 'none'):
                    ext = f.get('ext', 'mp4')
                    res = f.get('resolution') or f.get('format_note') or "HD"
                    
                    if 'http' in f.get('url'):
                        picker.append({
                            "url": f.get('url'),
                            "quality": f"{res}".strip(),
                            "extension": ext,
                            "type": "video" if f.get('vcodec') != 'none' else "audio"
                        })

            # Sortir picker agar video ada di atas
            picker.sort(key=lambda x: x['type'], reverse=True)

            return jsonify({
                "status": "stream",
                "url": video_url,
                "title": info.get('title', 'Media Content'),
                "thumbnail": info.get('thumbnail', ''),
                "source": "Python Ultra-Bypass Engine",
                "picker": picker[:20]
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        # Berikan pesan error yang lebih jelas ke frontend
        return jsonify({
            "status": "error", 
            "message": f"YouTube memblokir server ini. Solusi: Update yt-dlp atau gunakan cookies. ({str(e)})"
        }), 500

if __name__ == '__main__':
    # Pastikan port sesuai dengan hostingan kamu
    port = int(os.environ.get('PORT', 20212))
    app.run(host='0.0.0.0', port=port)
