import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import '../models/download_result.dart';
import '../utils/platform_detector.dart';

/// Download service — Optimized for Mobile (Direct Fetch)
/// Calls external APIs directly without proxies to ensure maximum speed.
class DownloadService {
  DownloadService._();
  static final DownloadService instance = DownloadService._();

  static const Duration _timeout = Duration(seconds: 20);

  // Random IP spoofer to avoid simple rate limits
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

  /// Direct fetch with timeout
  Future<http.Response?> _fetchDirect(String url,
      {Map<String, String>? extraHeaders}) async {
    try {
      return await http
          .get(Uri.parse(url),
              headers: {..._baseHeaders, ...?extraHeaders})
          .timeout(_timeout);
    } catch (e) {
      print('FETCH_ERROR: $e');
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
        'Maaf, semua protokol gagal mendapatkan data secara langsung. Server mungkin sedang sibuk.');
  }

  // ─── Platform Handlers (DIRECT ONLY) ──────────────────────────────────────

  /// TikTok via TikWM (Direct)
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
        source: 'TikTok Direct Protocol',
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

  /// Instagram — Direct Chocomilk or Ryzumi
  Future<DownloadResult?> _fetchInstagram(String url) async {
    // Try Chocomilk Direct
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
            source: 'Instagram Direct (v1)',
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

    // Fallback: Ryzumi Direct (No ScrapingAnt)
    final resRyzumi = await _fetchDirect(
        'https://api.ryzumi.net/api/downloader/instagram?url=${Uri.encodeComponent(url)}');
    if (resRyzumi != null && resRyzumi.statusCode == 200) {
      try {
        final data = jsonDecode(resRyzumi.body) as Map<String, dynamic>;
        final medias = data['medias'] as List<dynamic>?;
        if (medias != null && medias.isNotEmpty) {
          return DownloadResult(
            status: 'stream',
            url: (medias.first as Map)['url'] as String?,
            title: data['title'] as String? ?? 'Instagram Content',
            thumbnail: data['thumbnail'] as String?,
            source: 'Instagram Direct (v2)',
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

  /// YouTube — Multi-Protocol Fetch (ytmp4 + ytmp3 + all-in-one)
  Future<DownloadResult?> _fetchYouTube(String url) async {
    // Fetch from all sources in parallel for maximum performance
    final futures = [
      _fetchDirect('https://api.ryzumi.net/api/downloader/ytmp4?url=${Uri.encodeComponent(url)}'),
      _fetchDirect('https://api.ryzumi.net/api/downloader/ytmp3?url=${Uri.encodeComponent(url)}'),
      _fetchUniversal(url), // all-in-one source
    ];

    final results = await Future.wait(futures);

    final picker = <PickerItem>[];
    String title = 'YouTube Video';
    String? thumbnail;

    // 1. Process ytmp4 (Specific)
    if (results[0] != null && (results[0] as http.Response).statusCode == 200) {
      try {
        final d = jsonDecode((results[0] as http.Response).body) as Map<String, dynamic>;
        if (d['videoUrl'] != null) {
          title = d['title'] as String? ?? title;
          thumbnail = d['thumbnail'] as String? ?? thumbnail;
          picker.add(PickerItem(
            url: d['videoUrl'] as String,
            type: 'video',
            quality: '720P (DIRECT)',
            extension: 'mp4',
          ));
        }
      } catch (_) {}
    }

    // 2. Process ytmp3 (Specific)
    if (results[1] != null && (results[1] as http.Response).statusCode == 200) {
      try {
        final d = jsonDecode((results[1] as http.Response).body) as Map<String, dynamic>;
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

    // 3. Process all-in-one result
    if (results[2] != null && results[2] is DownloadResult) {
      final res = results[2] as DownloadResult;
      title = res.title ?? title;
      thumbnail = res.thumbnail ?? thumbnail;
      picker.addAll(res.picker);
    }

    if (picker.isNotEmpty) {
      // Deduplicate by URL to avoid showing same link multiple times
      final seenUrls = <String>{};
      final uniquePicker = <PickerItem>[];
      for (var item in picker) {
        if (item.url.isNotEmpty && !seenUrls.contains(item.url)) {
          seenUrls.add(item.url);
          uniquePicker.add(item);
        }
      }

      return DownloadResult(
        status: 'stream',
        url: uniquePicker.first.url,
        title: title,
        thumbnail: thumbnail,
        source: 'YouTube Multi-Protocol',
        picker: uniquePicker,
      );
    }
    return null;
  }

  /// Universal fallback — Ryzumi All-in-One Direct
  Future<DownloadResult?> _fetchUniversal(String url) async {
    final res = await _fetchDirect(
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
        source: 'Universal Direct Protocol',
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
