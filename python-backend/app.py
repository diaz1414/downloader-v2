from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os
import ssl
import subprocess
import sys
import importlib

def auto_update():
    # List library yang wajib ada
    required_libs = ["yt-dlp", "static-ffmpeg", "requests"]
    for lib in required_libs:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", lib])
            print(f"--- LOG: {lib} updated/installed ---")
        except Exception as e:
            print(f"--- LOG: Gagal install {lib}: {e} ---")
    
    # Reload yt-dlp setelah update
    importlib.reload(yt_dlp)
    
    # Coba load static-ffmpeg setelah dipastikan terinstall
    try:
        from static_ffmpeg import add_paths
        add_paths()
        print("--- LOG: FFmpeg Portable Siap Digunakan ---")
    except ImportError:
        print("--- LOG: FFmpeg gagal dimuat otomatis ---")

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
            print("--- LOG: Cookies Sanitized ---")
        except Exception as e:
            print(f"--- LOG: Cookies Fix Failed: {e} ---")

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
            # Format lebih fleksibel
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'nocheckcertificate': True,
            'ignoreerrors': True,
            'no_playlist': True,
            'cachedir': False,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'extractor_args': {
                'youtube': {
                    'player_client': ['tv', 'ios', 'web', 'android'],
                    'player_skip': ['configs'],
                }
            },
            'youtube_include_dash_manifest': True,
            'youtube_include_hls_manifest': True,
            'ignore_no_formats_error': True,
            'allow_unplayable_formats': True,
        }

        if os.path.exists(cookies_path): ydl_opts['cookiefile'] = cookies_path

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            
            # Ambil link asli langsung tanpa proxy apa pun
            video_url = info.get('url')
            if not video_url and formats: video_url = formats[-1].get('url')

            picker = []
            for f in formats:
                f_url = f.get('url')
                vcodec = f.get('vcodec', 'none')
                acodec = f.get('acodec', 'none')
                
                # Filter: Hanya ambil yang punya Video ATAU Audio
                if f_url and 'http' in f_url:
                    ext = str(f.get('ext', '')).lower()
                    
                    # Daftar extension yang DILARANG (Gambar/Metadata)
                    blocked_exts = ['mhtml', 'jpg', 'png', 'webp', 'gif', 'json', 'xml']
                    if ext in blocked_exts:
                        continue
                        
                    if vcodec == 'none' and acodec == 'none':
                        continue
                        
                    res = f.get('resolution') or f.get('format_note') or f.get('height') or "HD"
                    low_res = str(res).lower()
                    
                    # Abaikan storyboard/thumbnail
                    if 'storyboard' in low_res or 'thumbnail' in low_res or 'preview' in low_res:
                        continue

                    picker.append({
                        "url": f_url,
                        "quality": str(res),
                        "extension": f.get('ext', 'mp4'),
                        "type": "video" if vcodec != 'none' else "audio"
                    })

            return jsonify({
                "status": "stream",
                "url": video_url,
                "title": info.get('title', 'Media Content'),
                "thumbnail": info.get('thumbnail', ''),
                "source": "Python 1080p Engine (Stable)",
                "picker": picker[:20]
            })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 20212))
    app.run(host='0.0.0.0', port=port)
