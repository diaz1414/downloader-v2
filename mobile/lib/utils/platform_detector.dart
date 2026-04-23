/// Platform detector — Dart port of lib/detector.ts from the website
enum DetectedPlatform {
  tiktok,
  instagram,
  youtube,
  twitter,
  pinterest,
  soundcloud,
  unknown,
}

extension DetectedPlatformLabel on DetectedPlatform {
  String get label {
    switch (this) {
      case DetectedPlatform.tiktok:
        return 'TikTok';
      case DetectedPlatform.instagram:
        return 'Instagram';
      case DetectedPlatform.youtube:
        return 'YouTube';
      case DetectedPlatform.twitter:
        return 'Twitter / X';
      case DetectedPlatform.pinterest:
        return 'Pinterest';
      case DetectedPlatform.soundcloud:
        return 'SoundCloud';
      case DetectedPlatform.unknown:
        return 'Unknown';
    }
  }

  /// Accent color per platform (matches website icon colors)
  int get colorHex {
    switch (this) {
      case DetectedPlatform.tiktok:
        return 0xFF69C9D0; // TikTok cyan
      case DetectedPlatform.instagram:
        return 0xFFE4405F;
      case DetectedPlatform.youtube:
        return 0xFFFF0000;
      case DetectedPlatform.twitter:
        return 0xFFD4AF37; // use accent gold for X
      case DetectedPlatform.pinterest:
        return 0xFFBD081C;
      case DetectedPlatform.soundcloud:
        return 0xFFFF3300;
      case DetectedPlatform.unknown:
        return 0xFFD4AF37;
    }
  }
}

class PlatformDetector {
  PlatformDetector._();

  static DetectedPlatform detect(String url) {
    final lower = url.toLowerCase();
    if (lower.contains('tiktok.com') || lower.contains('vm.tiktok.com')) {
      return DetectedPlatform.tiktok;
    }
    if (lower.contains('instagram.com') || lower.contains('instagr.am')) {
      return DetectedPlatform.instagram;
    }
    if (lower.contains('youtube.com') || lower.contains('youtu.be')) {
      return DetectedPlatform.youtube;
    }
    if (lower.contains('twitter.com') || lower.contains('x.com')) {
      return DetectedPlatform.twitter;
    }
    if (lower.contains('pinterest.com') || lower.contains('pin.it')) {
      return DetectedPlatform.pinterest;
    }
    if (lower.contains('soundcloud.com')) {
      return DetectedPlatform.soundcloud;
    }
    return DetectedPlatform.unknown;
  }
}
