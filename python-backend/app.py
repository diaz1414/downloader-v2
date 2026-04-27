from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os
import ssl
import subprocess
import sys
import importlib

# Integrasi FFmpeg Portable
try:
    from static_ffmpeg import add_paths
    add_paths()
except ImportError:
    pass

def auto_update():
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", "yt-dlp"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", "static-ffmpeg"])
        importlib.reload(yt_dlp)
    except:
        pass

auto_update()

try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

app = Flask(__name__)
CORS(app)

def clean_cookies(path):
    if os.path.exists(path):
        try:
            with open(path, 'rb') as f:
                content = f.read()
            new_content = content.replace(b'\r\n', b'\n')
            with open(path, 'wb') as f:
                f.write(new_content)
        except:
            pass

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "ready", "yt_dlp": yt_dlp.version.__version__})

@app.route('/api/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    if not url: return jsonify({"status": "error", "message": "URL is required"}), 400

    try:
        cookies_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
        clean_cookies(cookies_path)
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'bestvideo+bestaudio/best',
            'nocheckcertificate': True,
            'ignoreerrors': True,
            'no_playlist': True,
            'cachedir': False,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'extractor_args': {
                'youtube': {
                    'player_client': ['tv', 'ios', 'web', 'android'],
                }
            },
            'youtube_include_dash_manifest': True,
            'youtube_include_hls_manifest': True,
        }

        if os.path.exists(cookies_path):
            ydl_opts['cookiefile'] = cookies_path

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                return jsonify({"status": "error", "message": "Failed to extract info"}), 404
            
            formats = info.get('formats', [])
            video_url = info.get('url')
            if not video_url and formats:
                # Ambil URL terbaik yang tersedia
                video_url = formats[-1].get('url')

            picker = []
            for f in formats:
                f_url = f.get('url')
                if not f_url or 'http' not in f_url: continue
                
                # Filter gambar/storyboard
                ext = str(f.get('ext', '')).lower()
                if ext in ['mhtml', 'jpg', 'png', 'webp']: continue
                
                res = f.get('resolution') or f.get('format_note') or f.get('height') or "HD"
                if 'storyboard' in str(res).lower(): continue

                picker.append({
                    "url": f_url,
                    "quality": str(res),
                    "extension": ext if ext != 'none' else 'mp4',
                    "type": "video" if f.get('vcodec') != 'none' else "audio"
                })

            return jsonify({
                "status": "stream",
                "url": video_url,
                "title": info.get('title', 'Media Content'),
                "thumbnail": info.get('thumbnail', ''),
                "source": "Python Direct Engine",
                "picker": picker[:30]
            })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 20212))
    app.run(host='0.0.0.0', port=port)
