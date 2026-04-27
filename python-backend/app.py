from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os
import ssl
import subprocess
import sys
import importlib

def auto_update():
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", "yt-dlp"])
        importlib.reload(yt_dlp)
    except Exception as e:
        print(f"Update failed: {e}")

auto_update()

try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "ready", "yt_dlp": yt_dlp.version.__version__})

@app.route('/api/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({"status": "error", "message": "URL is required"}), 400

    try:
        cookies_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
        
        # Konfigurasi Berdasarkan Panduan GitHub yt-dlp 2025/2026
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'best',
            'nocheckcertificate': True,
            'ignoreerrors': False,
            'no_playlist': True,
            # Teknik Bypass 2026 yang sudah berhasil
            'extractor_args': {
                'youtube': {
                    'player_client': ['mweb', 'ios'],
                    'player_skip': ['webpage', 'configs'],
                }
            },
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        }

        if os.path.exists(cookies_path):
            print(f"--- LOG: Menggunakan Cookies (Wiki Method) ---")
            ydl_opts['cookiefile'] = cookies_path

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            picker = []
            
            video_url = info.get('url')
            if not video_url and formats:
                for f in reversed(formats):
                    if f.get('url') and f.get('ext') == 'mp4':
                        video_url = f.get('url')
                        break

            for f in formats:
                f_url = f.get('url')
                if f_url and 'http' in f_url:
                    res = f.get('resolution') or f.get('format_note') or f.get('height') or "HD"
                    picker.append({
                        "url": f_url,
                        "quality": str(res),
                        "extension": f.get('ext', 'mp4'),
                        "type": "video" if f.get('vcodec') != 'none' else "audio"
                    })

            return jsonify({
                "status": "stream",
                "url": video_url,
                "title": info.get('title', 'Media Content'),
                "thumbnail": info.get('thumbnail', ''),
                "source": "Python 2026 Wiki-Optimized Engine",
                "picker": picker[:20]
            })

    except Exception as e:
        print(f"Error Detail: {str(e)}")
        # Jika masih minta sign-in, berarti butuh PO Token atau Cookies baru
        return jsonify({
            "status": "error", 
            "message": "YouTube mendeteksi bot. Pastikan Cookies diambil lewat mode Incognito di robots.txt."
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 20212))
    app.run(host='0.0.0.0', port=port)
