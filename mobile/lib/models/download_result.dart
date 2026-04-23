/// Data model for download result — mirrors the JSON response of /api/download route.ts
class PickerItem {
  final String url;
  final String type;    // 'video' | 'audio'
  final String quality; // 'HD (NO-WM)', 'AUDIO', '720P', dll
  final String extension; // 'mp4', 'mp3'

  const PickerItem({
    required this.url,
    required this.type,
    required this.quality,
    required this.extension,
  });

  factory PickerItem.fromJson(Map<String, dynamic> json) => PickerItem(
        url: json['url'] as String? ?? '',
        type: json['type'] as String? ?? 'video',
        quality: json['quality'] as String? ?? 'HD',
        extension: json['extension'] as String? ?? 'mp4',
      );

  bool get isAudio => type == 'audio';
}

class DownloadResult {
  final String status;    // 'stream' | 'error'
  final String? url;
  final String? title;
  final String? thumbnail;
  final String? source;
  final String? errorText;
  final List<PickerItem> picker;

  const DownloadResult({
    required this.status,
    this.url,
    this.title,
    this.thumbnail,
    this.source,
    this.errorText,
    this.picker = const [],
  });

  bool get isSuccess => status == 'stream';
  bool get isError => status == 'error';

  factory DownloadResult.fromJson(Map<String, dynamic> json) => DownloadResult(
        status: json['status'] as String? ?? 'error',
        url: json['url'] as String?,
        title: json['title'] as String?,
        thumbnail: json['thumbnail'] as String?,
        source: json['source'] as String?,
        errorText: json['text'] as String?,
        picker: (json['picker'] as List<dynamic>?)
                ?.map((e) => PickerItem.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
      );

  factory DownloadResult.error(String message) => DownloadResult(
        status: 'error',
        errorText: message,
      );
}
