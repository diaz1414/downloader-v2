from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os
import ssl
import subprocess
import sys
import importlib

# Fungsi Auto-Update
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
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'best',
            'nocheckcertificate': True,
            'ignoreerrors': False,
            'no_playlist': True,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'web'],
                    'player_skip': ['webpage', 'configs'],
                }
            }
        }

        if os.path.exists(cookies_path):
            print(f"--- LOG: Menggunakan file cookies dari {cookies_path} ---")
            ydl_opts['cookiefile'] = cookies_path
        else:
            print("--- LOG: Tidak ada cookies.txt, menggunakan mode guest ---")

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            picker = []
            video_url = info.get('url')
            
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

            if not picker and video_url:
                picker.append({"url": video_url, "quality": "Default", "extension": "mp4", "type": "video"})

            return jsonify({
                "status": "stream",
                "url": video_url,
                "title": info.get('title', 'Media Content'),
                "thumbnail": info.get('thumbnail', ''),
                "source": "Python 2026 Stable",
                "picker": picker[:20]
            })

    except Exception as e:
        print(f"Error Detail: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 20212))
    app.run(host='0.0.0.0', port=port)
