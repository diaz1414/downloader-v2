from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import yt_dlp
import os
import ssl
import subprocess
import sys
import importlib
import tempfile
import uuid
import shutil

def auto_update():
    # Pastikan library terbaru terinstall
    required_libs = ["yt-dlp", "static-ffmpeg", "requests"]
    for lib in required_libs:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", lib])
        except: pass
    
    importlib.reload(yt_dlp)
    
    try:
        from static_ffmpeg import add_paths
        add_paths()
        ffmpeg_exe = shutil.which("ffmpeg")
        print(f"--- LOG: FFmpeg Found at {ffmpeg_exe} ---")
        return ffmpeg_exe
    except Exception as e:
        print(f"--- LOG: FFmpeg Error: {e} ---")
        return None

FFMPEG_PATH = auto_update()

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
    return jsonify({
        "status": "ready", 
        "yt_dlp": yt_dlp.version.__version__,
        "ffmpeg": FFMPEG_PATH
    })

@app.route('/api/get', methods=['GET'])
def get_media():
    url = request.args.get('url')
    format_type = request.args.get('format', 'mp4') # 'mp4' atau 'mp3'
    if not url: return "URL is required", 400

    temp_dir = tempfile.mkdtemp()
    unique_id = str(uuid.uuid4())[:8]
    
    try:
        cookies_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
        clean_cookies(cookies_path)

        # LOGIKA DISAMAKAN DENGAN BOT TELEGRAM KAMU
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'outtmpl': os.path.join(temp_dir, f'diaww_dl_{unique_id}_%(title).100s.%(ext)s'),
        }

        if format_type == 'mp3':
            ydl_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            })
        else:
            # FALLBACK SYSTEM: Prioritas MP4 High Quality agar Suara Ada
            ydl_opts.update({
                'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'merge_output_format': 'mp4',
            })

        if FFMPEG_PATH: ydl_opts['ffmpeg_location'] = FFMPEG_PATH
        if os.path.exists(cookies_path): ydl_opts['cookiefile'] = cookies_path

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"--- LOG: Processing {url} as {format_type} ---")
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            # Koreksi ekstensi jika berubah setelah konversi/merge (mkv -> mp4)
            if not os.path.exists(filename):
                base = os.path.splitext(filename)[0]
                for ext in ['.mp4', '.mp3', '.mkv', '.webm']:
                    if os.path.exists(base + ext):
                        filename = base + ext
                        break

            def generate():
                with open(filename, 'rb') as f:
                    while True:
                        chunk = f.read(1024 * 1024) # 1MB chunks
                        if not chunk: break
                        yield chunk
                shutil.rmtree(temp_dir, ignore_errors=True)

            return Response(
                stream_with_context(generate()),
                mimetype='video/mp4' if format_type == 'mp4' else 'audio/mpeg',
                headers={
                    "Content-Disposition": f"attachment; filename=\"{os.path.basename(filename)}\"",
                    "Content-Length": os.path.getsize(filename)
                }
            )
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"--- ERROR: {e} ---")
        return str(e), 500

@app.route('/api/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    if not url: return jsonify({"status": "error", "message": "URL is required"}), 400

    try:
        cookies_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
        clean_cookies(cookies_path)
        
        # Opsi Probing (Cepat, tanpa download)
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'nocheckcertificate': True,
            'ignoreerrors': True,
            'no_playlist': True,
            'extractor_args': {'youtube': {'player_client': ['tv', 'ios', 'web', 'android']}},
        }

        if os.path.exists(cookies_path): ydl_opts['cookiefile'] = cookies_path

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            
            def has_codec(codec):
                return codec is not None and str(codec).lower() not in ['none', '', 'unknown']

            # Link default untuk preview
            video_url = info.get('url') or (formats[-1].get('url') if formats else None)

            picker = []
            for f in formats:
                f_url = f.get('url')
                vcodec = f.get('vcodec')
                acodec = f.get('acodec')
                
                if f_url and 'http' in f_url:
                    ext = str(f.get('ext', '')).lower()
                    if ext in ['mhtml', 'jpg', 'png', 'webp', 'gif', 'json', 'xml']: continue
                        
                    has_v = has_codec(vcodec)
                    has_a = has_codec(acodec)
                    if not has_v and not has_a: continue
                        
                    res = f.get('resolution') or f.get('format_note') or f.get('height') or "HD"
                    if any(x in str(res).lower() for x in ['storyboard', 'thumbnail', 'preview']): continue

                    # Logika Proxy untuk Merging
                    final_url = f_url
                    if has_v and has_a:
                        label = f"{res}"
                        priority = 3
                    elif has_v:
                        label = f"{res} (Pro Merge)"
                        final_url = f"/python-api/api/get?url={url}&format=mp4"
                        priority = 1
                    else:
                        label = "Audio Only"
                        final_url = f"/python-api/api/get?url={url}&format=mp3"
                        priority = 2

                    picker.append({
                        "url": final_url,
                        "quality": label,
                        "extension": "mp4" if has_v else "mp3",
                        "type": "video" if has_v else "audio",
                        "has_audio": has_a,
                        "priority": priority
                    })

            picker.sort(key=lambda x: x.get('priority', 0), reverse=True)

            return jsonify({
                "status": "stream",
                "url": f"/python-api/api/get?url={url}&format=mp4" if "instagram.com" in url or "youtube.com" in url else video_url,
                "title": info.get('title', 'Media Content'),
                "thumbnail": info.get('thumbnail', ''),
                "source": "Python Premium Engine",
                "picker": picker[:20]
            })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 20212))
    app.run(host='0.0.0.0', port=port)
