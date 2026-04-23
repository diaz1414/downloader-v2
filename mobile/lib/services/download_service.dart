import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import '../models/download_result.dart';
import '../utils/platform_detector.dart';

/// Download service — Dart port of route.ts
/// Calls the same external APIs directly from the mobile device's network.
/// No Vercel / local server needed.
class DownloadService {
  DownloadService._();
  static final DownloadService instance = DownloadService._();

  // ScrapingAnt API key (same as route.ts)
  static const _antApiKey = 'b64b4ddbe94240de97808fdeedae26c2';
  static const Duration _timeout = Duration(seconds: 15);
  static const Duration _antTimeout = Duration(seconds: 10);

  // Random IP spoofer (same as route.ts)
  String _randomIP() {
    final r = Random();
    return List.generate(4, (_) => r.nextInt(255)).join('.');
  }

  Map<String, String> get _baseHeaders => {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'X-Forwarded-For': _randomIP(),
      };

  /// Fetch via ScrapingAnt proxy (datacenter) — mirrors fetchWithAnt()
  Future<http.Response?> _fetchWithAnt(String url) async {
    final proxyUrl =
        'https://api.scrapingant.com/v2/general?url=${Uri.encodeComponent(url)}&x-api-key=$_antApiKey&browser=false&proxy_type=datacenter';
    try {
      return await http
          .get(Uri.parse(proxyUrl), headers: _baseHeaders)
          .timeout(_antTimeout);
    } catch (_) {
      return null;
    }
  }

  /// Direct fetch with timeout — mirrors fetchWithTimeout()
  Future<http.Response?> _fetchDirect(String url,
      {Map<String, String>? extraHeaders}) async {
    try {
      return await http
          .get(Uri.parse(url),
              headers: {..._baseHeaders, ...?extraHeaders})
          .timeout(_timeout);
    } catch (_) {
      return null;
    }
  }

  // ─── Main Entry Point ───────────────────────────────────────────────────────

  Future<DownloadResult> fetch(String url) async {
    if (url.trim().isEmpty) {
      return DownloadResult.error('URL tidak boleh kosong');
    }

    final platform = PlatformDetector.detect(url);

    // 1. TIKTOK
    if (platform == DetectedPlatform.tiktok) {
      final result = await _fetchTikTok(url);
      if (result != null) return result;
    }

    // 2. INSTAGRAM
    if (platform == DetectedPlatform.instagram) {
      final result = await _fetchInstagram(url);
      if (result != null) return result;
    }

    // 3. YOUTUBE
    if (platform == DetectedPlatform.youtube) {
      final result = await _fetchYouTube(url);
      if (result != null) return result;
    }

    // 4. UNIVERSAL FALLBACK
    final result = await _fetchUniversal(url);
    if (result != null) return result;

    return DownloadResult.error(
        'Maaf, semua protokol gagal mendapatkan data. Link mungkin privat atau server sedang sibuk.');
  }

  // ─── Platform Handlers ──────────────────────────────────────────────────────

  /// TikTok via TikWM (same as route.ts)
  Future<DownloadResult?> _fetchTikTok(String url) async {
    final res = await _fetchDirect(
      'https://www.tikwm.com/api/?url=${Uri.encodeComponent(url)}',
      extraHeaders: {'Referer': 'https://www.tikwm.com/'},
    );
    if (res == null || res.statusCode != 200) return null;
    try {
      final data = jsonDecode(res.body) as Map<String, dynamic>?;
      final d = data?['data'] as Map<String, dynamic>?;
      if (d == null) return null;
      return DownloadResult(
        status: 'stream',
        url: d['play'] as String?,
        title: d['title'] as String? ?? 'TikTok Video',
        thumbnail: d['cover'] as String?,
        source: 'TikTok Protocol',
        picker: [
          if (d['play'] != null)
            PickerItem(
              url: d['play'] as String,
              type: 'video',
              quality: 'HD (NO-WM)',
              extension: 'mp4',
            ),
          if (d['wmplay'] != null)
            PickerItem(
              url: d['wmplay'] as String,
              type: 'video',
              quality: 'WATERMARK',
              extension: 'mp4',
            ),
          if (d['music'] != null)
            PickerItem(
              url: d['music'] as String,
              type: 'audio',
              quality: 'AUDIO',
              extension: 'mp3',
            ),
        ],
      );
    } catch (_) {
      return null;
    }
  }

  /// Instagram — Chocomilk first, then Ryzumi via ScrapingAnt
  Future<DownloadResult?> _fetchInstagram(String url) async {
    // Try Chocomilk first
    final res = await _fetchDirect(
      'https://chocomilk.amira.us.kg/v1/download/instagram?url=${Uri.encodeComponent(url)}',
      extraHeaders: {'Referer': 'https://chocomilk.amira.us.kg/'},
    );
    if (res != null && res.statusCode == 200) {
      try {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        final data = (body['data'] ?? body['result'] ?? body) as Map<String, dynamic>?;
        final mediaUrl = data?['url'] as String?;
        if (mediaUrl != null && mediaUrl.isNotEmpty) {
          return DownloadResult(
            status: 'stream',
            url: mediaUrl,
            title: data?['title'] as String? ?? 'Instagram Content',
            thumbnail: data?['thumbnail'] as String?,
            source: 'Instagram Protocol (v1)',
            picker: [
              PickerItem(
                url: mediaUrl,
                type: 'video',
                quality: 'HD',
                extension: 'mp4',
              )
            ],
          );
        }
      } catch (_) {}
    }

    // Fallback: Ryzumi via ScrapingAnt
    final antRes = await _fetchWithAnt(
        'https://api.ryzumi.net/api/downloader/instagram?url=${Uri.encodeComponent(url)}');
    if (antRes != null && antRes.statusCode == 200) {
      try {
        final data = jsonDecode(antRes.body) as Map<String, dynamic>;
        final medias = data['medias'] as List<dynamic>?;
        if (medias != null && medias.isNotEmpty) {
          return DownloadResult(
            status: 'stream',
            url: (medias.first as Map)['url'] as String?,
            title: data['title'] as String? ?? 'Instagram Content',
            thumbnail: data['thumbnail'] as String?,
            source: 'Instagram Protocol (v2 - Ant)',
            picker: medias
                .map((m) {
                  final item = m as Map<String, dynamic>;
                  return PickerItem(
                    url: item['url'] as String? ?? '',
                    type: item['type'] as String? ?? 'video',
                    quality: item['quality'] as String? ?? 'HD',
                    extension: item['extension'] as String? ?? 'mp4',
                  );
                })
                .where((p) => p.url.isNotEmpty)
                .toList(),
          );
        }
      } catch (_) {}
    }
    return null;
  }

  /// YouTube — Ryzumi MP4 + MP3 via ScrapingAnt (parallel)
  Future<DownloadResult?> _fetchYouTube(String url) async {
    final results = await Future.wait([
      _fetchWithAnt(
          'https://api.ryzumi.net/api/downloader/ytmp4?url=${Uri.encodeComponent(url)}'),
      _fetchWithAnt(
          'https://api.ryzumi.net/api/downloader/ytmp3?url=${Uri.encodeComponent(url)}'),
    ]);

    final picker = <PickerItem>[];
    String title = 'YouTube Video';
    String? thumbnail;

    final mp4Res = results[0];
    if (mp4Res != null && mp4Res.statusCode == 200) {
      try {
        final d = jsonDecode(mp4Res.body) as Map<String, dynamic>;
        if (d['videoUrl'] != null) {
          title = d['title'] as String? ?? title;
          thumbnail = d['thumbnail'] as String?;
          picker.add(PickerItem(
            url: d['videoUrl'] as String,
            type: 'video',
            quality: '720P (DIRECT)',
            extension: 'mp4',
          ));
        }
      } catch (_) {}
    }

    final mp3Res = results[1];
    if (mp3Res != null && mp3Res.statusCode == 200) {
      try {
        final d = jsonDecode(mp3Res.body) as Map<String, dynamic>;
        if (d['audioUrl'] != null) {
          picker.add(PickerItem(
            url: d['audioUrl'] as String,
            type: 'audio',
            quality: 'AUDIO (320kbps)',
            extension: 'mp3',
          ));
        }
      } catch (_) {}
    }

    if (picker.isNotEmpty) {
      return DownloadResult(
        status: 'stream',
        url: picker.first.url,
        title: title,
        thumbnail: thumbnail,
        source: 'YouTube Protocol (Ant)',
        picker: picker,
      );
    }
    return null;
  }

  /// Universal fallback — Ryzumi all-in-one via ScrapingAnt
  Future<DownloadResult?> _fetchUniversal(String url) async {
    final res = await _fetchWithAnt(
        'https://api.ryzumi.net/api/downloader/all-in-one?url=${Uri.encodeComponent(url)}');
    if (res == null || res.statusCode != 200) return null;
    try {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final medias = data['medias'] as List<dynamic>?;
      if (medias == null || medias.isEmpty) return null;
      return DownloadResult(
        status: 'stream',
        url: (medias.first as Map)['url'] as String?,
        title: data['title'] as String? ?? 'Archive Result',
        thumbnail: data['thumbnail'] as String?,
        source: 'Universal Protocol (Ant)',
        picker: medias
            .map((m) {
              final item = m as Map<String, dynamic>;
              return PickerItem(
                url: item['url'] as String? ?? '',
                type: item['type'] as String? ?? 'video',
                quality: item['quality'] as String? ?? 'HD',
                extension: item['extension'] as String? ?? 'mp4',
              );
            })
            .where((p) => p.url.isNotEmpty)
            .toList(),
      );
    } catch (_) {
      return null;
    }
  }
}
