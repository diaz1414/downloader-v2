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
            # Paksa cari format yang SUDAH ada video dan audio dalam satu link
            'format': 'best[vcodec!=none][acodec!=none]/best',
            'nocheckcertificate': True,
            'ignoreerrors': True,
            'no_playlist': True,
            'cachedir': False,
            'extractor_args': {
                'youtube': {
                    'player_client': ['tv', 'ios', 'web', 'android'],
                    'player_skip': ['configs'],
                }
            },
            'ignore_no_formats_error': True,
            'allow_unplayable_formats': True,
        }

        if os.path.exists(cookies_path): ydl_opts['cookiefile'] = cookies_path

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            
            # Helper untuk cek validitas codec
            def has_codec(codec):
                return codec is not None and str(codec).lower() not in ['none', '', 'unknown']

            # Cari video URL terbaik (Utamakan yang ada audio)
            video_url = info.get('url')
            best_combined = None
            
            for f in reversed(formats):
                if has_codec(f.get('vcodec')) and has_codec(f.get('acodec')) and f.get('url'):
                    best_combined = f.get('url')
                    break
            
            if best_combined:
                video_url = best_combined
            elif not video_url and formats:
                video_url = formats[-1].get('url')

            picker = []
            for f in formats:
                f_url = f.get('url')
                vcodec = f.get('vcodec')
                acodec = f.get('acodec')
                
                if f_url and 'http' in f_url:
                    ext = str(f.get('ext', '')).lower()
                    blocked_exts = ['mhtml', 'jpg', 'png', 'webp', 'gif', 'json', 'xml']
                    if ext in blocked_exts: continue
                        
                    has_v = has_codec(vcodec)
                    has_a = has_codec(acodec)
                    
                    if not has_v and not has_a: continue
                        
                    res = f.get('resolution') or f.get('format_note') or f.get('height') or "HD"
                    low_res = str(res).lower()
                    if any(x in low_res for x in ['storyboard', 'thumbnail', 'preview']): continue

                    # Labeling & Type
                    if has_v and has_a:
                        quality_label = f"{res}"
                        ftype = "video"
                        priority = 3
                    elif has_v:
                        quality_label = f"{res} (No Sound)"
                        ftype = "video"
                        priority = 1
                    else: # Audio only
                        quality_label = "Audio Only"
                        ftype = "audio"
                        priority = 2

                    picker.append({
                        "url": f_url,
                        "quality": quality_label,
                        "extension": f.get('ext', 'mp4'),
                        "type": ftype,
                        "has_audio": has_a,
                        "priority": priority
                    })

            # Sort: Video+Audio (3) > Audio Only (2) > Video Only (1)
            picker.sort(key=lambda x: x.get('priority', 0), reverse=True)

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
