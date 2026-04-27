from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import yt_dlp
import os
import ssl
import subprocess
import sys
import importlib
import requests

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

# Fungsi untuk membersihkan file cookies (memastikan format Linux/LF)
def clean_cookies(path):
    if os.path.exists(path):
        try:
            with open(path, 'rb') as f:
                content = f.read()
            new_content = content.replace(b'\r\n', b'\n')
            with open(path, 'wb') as f:
                f.write(new_content)
            print("--- LOG: File cookies berhasil dikonversi ke format Linux (LF) ---")
        except Exception as e:
            print(f"--- LOG: Gagal konversi cookies: {e} ---")

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "ready", "yt_dlp": yt_dlp.version.__version__})

# Fitur PROXY Cerdas untuk TikTok & Instagram
@app.route('/api/proxy')
def proxy():
    target_url = request.args.get('url')
    if not target_url:
        return "URL is required", 400
    
    try:
        # Header default yang mirip browser asli
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
        
        # Penyesuaian khusus berdasarkan domain
        if "tiktok.com" in target_url:
            headers['Referer'] = 'https://www.tiktok.com/'
        elif "instagram.com" in target_url or "cdninstagram.com" in target_url:
            # Instagram TIDAK BOLEH pakai Referer TikTok, dan lebih baik tanpa Referer sama sekali
            headers.pop('Referer', None)

        # Alirkan (stream) kontennya agar hemat RAM
        req = requests.get(target_url, headers=headers, stream=True, timeout=60, verify=False)
        
        def generate():
            for chunk in req.iter_content(chunk_size=1024 * 64): # 64KB buffer
                yield chunk
        
        # Ambil Content-Type asli atau default ke video/mp4
        ctype = req.headers.get('content-type', 'video/mp4')
        
        # Buat nama file agar tidak kedownload sebagai .txt
        filename = "video_download.mp4"
        if "audio" in ctype:
            filename = "audio_download.mp3"

        # Kirim response dengan header download yang benar
        headers_to_send = {
            'Content-Type': ctype,
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Allow-Origin': '*'
        }

        # Tambahkan Content-Length jika tersedia
        if req.headers.get('content-length'):
            headers_to_send['Content-Length'] = req.headers.get('content-length')
            
        return Response(generate(), headers=headers_to_send)
    except Exception as e:
        print(f"Proxy Error: {e}")
        return str(e), 500

@app.route('/api/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({"status": "error", "message": "URL is required"}), 400

    try:
        cookies_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
        clean_cookies(cookies_path)
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'best',
            'nocheckcertificate': True,
            'ignoreerrors': False,
            'no_playlist': True,
            'cachedir': False,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'extractor_args': {
                'youtube': {
                    'player_client': ['tv', 'ios', 'web'],
                }
            },
            'youtube_include_dash_manifest': True,
            'youtube_include_hls_manifest': True,
        }

        if os.path.exists(cookies_path):
            ydl_opts['cookiefile'] = cookies_path

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            
            # Gunakan domain utama lewat jalur HTTPS Vercel
            host_url = "https://downloaderv2.diaww.my.id/python-api"
            
            video_url = info.get('url')
            if not video_url and formats:
                video_url = formats[-1].get('url')

            # Deteksi apakah butuh proxy
            def needs_proxy(u):
                if not u: return False
                return any(x in u for x in ["tiktok.com", "instagram.com", "cdninstagram.com", "fbcdn.net"])

            if needs_proxy(video_url):
                video_url = f"{host_url}/api/proxy?url={video_url}"

            picker = []
            for f in formats:
                f_url = f.get('url')
                if f_url and 'http' in f_url:
                    res = f.get('resolution') or f.get('format_note') or f.get('height') or "HD"
                    
                    final_url = f_url
                    if needs_proxy(f_url):
                        final_url = f"{host_url}/api/proxy?url={f_url}"

                    picker.append({
                        "url": final_url,
                        "quality": str(res),
                        "extension": f.get('ext', 'mp4'),
                        "type": "video" if f.get('vcodec') != 'none' else "audio"
                    })

            return jsonify({
                "status": "stream",
                "url": video_url,
                "title": info.get('title', 'Media Content'),
                "thumbnail": info.get('thumbnail', ''),
                "source": "Python 2026 Smart-Proxy Engine",
                "picker": picker[:20]
            })

    except Exception as e:
        print(f"Error Detail: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 20212))
    app.run(host='0.0.0.0', port=port)
