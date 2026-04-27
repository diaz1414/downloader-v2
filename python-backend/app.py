from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import yt_dlp
import os
import ssl
import subprocess
import sys
import tempfile
import uuid
import shutil

# --- INITIALIZATION ---
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

app = Flask(__name__)
CORS(app)

# --- CORE DOWNLOAD LOGIC (SAMA PERSIS DENGAN BOT TELEGRAM) ---
def get_ydl_opts(temp_dir, unique_id, format_type, url):
    filename = os.path.join(temp_dir, f"diaww_dl_{unique_id}_{format_type}")
    
    # LOGIKA STEALTH YOUTUBE: Jangan pakai cookies untuk YouTube agar bisa pakai klien iOS/Android
    is_youtube = "youtube.com" in url or "youtu.be" in url
    
    opts = {
        'outtmpl': f'{filename}.%(ext)s',
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'nocheckcertificate': True,
        'ignoreerrors': False,
        'extractor_args': {
            'youtube': {
                'player_client': ['web_creator', 'tv', 'web_embedded', 'ios', 'android'],
                'po_token': 'MlOnlnIeoh3rhaeqsoswNbpREsch2vENGukFpo8UkmmKnMTwREuVSR8DV2pXE_4yVdOEVkD3MyuA0wAPyjEa5hk_fSlSHPhF3lOgeYd8DgQN0XBi2g==',
                'visitor_data': 'CgtMaGpjd0szVDhXQSjKxrzPBjIKCgJJRBIEGgAgVWLfAgrcAjE4LllUPVVWa3RvX1J2U0NIdGFhbmNfOGlJZGlYNklERjFKUHl0bTB4MW1yWWh1eGZQc1hVaHV3NGh6UzNKN3ZnYzRocTNTVnFtOXZ4OGlaUHlJMF9ST2dubk9PdU8yTFhoM1dFa1ZzU2VSbkRNVWNYY214WUFERUZJem94Q1o4c0c1eHlmWEhaRjNVYVUtU3RJNkYzTERFc0dVeEN4Tlp6VVppSXIzV1U4NUNzQTZtSzVwYUNCZ3ZtMk9CYjhEaXhMdk9xNDNLc3VwclpaY1E4eWY1WnJhRzAzbExzQVd0cTRwdVBWbTRHbVRJM05za0NwNXd5Z1cwOXhNMmtZZXFEc09wUkdQbElURUx0d093Mzk2VVM2eDhrQW15RVBDd0FrSTVXTHFxbDZyczRieFlELXdHbDFCVVhPd1Y2bEs0TkZpMENHVEVaQU8tZnR5RzZWeVh4bm5aVGItQQ=='
            }
        }
    }

    cookies_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
    if os.path.exists(cookies_path) and not is_youtube:
        opts['cookiefile'] = cookies_path

    if format_type == 'mp3':
        opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })
    else:
        opts.update({
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'merge_output_format': 'mp4',
        })

    cookies_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
    if os.path.exists(cookies_path):
        opts['cookiefile'] = cookies_path
        
    return opts, filename

# --- ROUTES ---
@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "ready", "engine": "diaww-core-v2"})

@app.route('/api/get', methods=['GET'])
def get_media():
    url = request.args.get('url')
    format_type = request.args.get('format', 'mp4')
    if not url: return "URL is required", 400

    temp_dir = tempfile.mkdtemp()
    unique_id = str(uuid.uuid4())[:8]
    
    try:
        # URL Cleaning (Identik Bot Tele)
        clean_url = url
        if "youtube.com" in url or "youtu.be" in url:
            clean_url = url.split('&list=')[0].split('?list=')[0].split('&si=')[0].split('?si=')[0].split('&start_radio=')[0]
        elif "tiktok.com" in url:
            clean_url = url.split('?')[0]

        ydl_opts, base_filename = get_ydl_opts(temp_dir, unique_id, format_type, clean_url)

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"--- LOG: Downloading {clean_url} as {format_type} ---")
            info = ydl.extract_info(clean_url, download=True)
            actual_filename = ydl.prepare_filename(info)

            # Extension Correction
            if format_type == 'mp3':
                actual_filename = f"{base_filename}.mp3"
            
            if not os.path.exists(actual_filename):
                base_path = os.path.splitext(actual_filename)[0]
                for ext in ['.mp4', '.mkv', '.webm', '.3gp', '.mp3']:
                    if os.path.exists(base_path + ext):
                        actual_filename = base_path + ext
                        break

            def generate():
                with open(actual_filename, 'rb') as f:
                    while True:
                        chunk = f.read(1024 * 1024)
                        if not chunk: break
                        yield chunk
                shutil.rmtree(temp_dir, ignore_errors=True)

            return Response(
                stream_with_context(generate()),
                mimetype='video/mp4' if format_type == 'mp4' else 'audio/mpeg',
                headers={
                    "Content-Disposition": f"attachment; filename=\"{os.path.basename(actual_filename)}\"",
                    "Content-Length": os.path.getsize(actual_filename)
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
        # Panggil fungsi get_ydl_opts agar YouTube lolos verifikasi (mode preview)
        temp_dir = tempfile.gettempdir()
        ydl_opts, _ = get_ydl_opts(temp_dir, "preview", "mp4", url)

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            picker = [
                {
                    "url": f"/python-api/api/get?url={url}&format=mp4",
                    "quality": "🎬 MP4 (Video)",
                    "extension": "mp4",
                    "type": "video",
                    "has_audio": True,
                    "priority": 2
                },
                {
                    "url": f"/python-api/api/get?url={url}&format=mp3",
                    "quality": "🎵 MP3 (Audio)",
                    "extension": "mp3",
                    "type": "audio",
                    "has_audio": True,
                    "priority": 1
                }
            ]

            return jsonify({
                "status": "stream",
                "url": f"/python-api/api/get?url={url}&format=mp4",
                "title": info.get('title', 'Media Content'),
                "thumbnail": info.get('thumbnail', ''),
                "source": "Diaww Downloader Core",
                "picker": picker
            })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 20212))
    app.run(host='0.0.0.0', port=port)
