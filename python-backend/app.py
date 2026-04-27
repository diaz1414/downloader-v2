from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os

app = Flask(__name__)
CORS(app)

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
        # Konfigurasi Heavy Duty untuk menembus proteksi YouTube terbaru
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'best',
            'nocheckcertificate': True,
            'ignoreerrors': False,
            'no_playlist': True,
            # Menyamar sebagai berbagai jenis client untuk menghindari deteksi
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.youtube.com/',
            },
            # Gunakan client Android untuk bypass "Player Response" error
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'web'],
                    'player_skip': ['webpage', 'configs']
                }
            }
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            formats = info.get('formats', [])
            picker = []
            
            # Format dasar
            video_url = info.get('url')
            
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

            return jsonify({
                "status": "stream",
                "url": video_url,
                "title": info.get('title', 'Media Content'),
                "thumbnail": info.get('thumbnail', ''),
                "source": "Python Heavy-Duty Engine",
                "picker": picker[:15]
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": f"Gagal mengambil data: {str(e)}"
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 20212))
    app.run(host='0.0.0.0', port=port)
