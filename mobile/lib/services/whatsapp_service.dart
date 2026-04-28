import 'dart:io';
import 'package:shared_storage/shared_storage.dart' as saf;
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';

class WhatsAppStatus {
  final String path;
  final bool isVideo;

  WhatsAppStatus({required this.path, required this.isVideo});
}

class WhatsAppService {
  WhatsAppService._();
  static final WhatsAppService instance = WhatsAppService._();

  // Android 11+ (Scoped Storage)
  static const String waTreeUri = 'content://com.android.externalstorage.documents/tree/primary%3AAndroid%2Fmedia%2Fcom.whatsapp%2FWhatsApp';
  static const String waBusinessTreeUri = 'content://com.android.externalstorage.documents/tree/primary%3AAndroid%2Fmedia%2Fcom.whatsapp.w4b%2FWhatsApp%20Business';

  // Android 10 and below (Legacy)
  static const String waLegacyPath = '/storage/emulated/0/WhatsApp/Media/.Statuses';

  Uri? _grantedUri;

  Future<void> init(String path) async {
    // Check if we already have permission for the WA directory
    final permissions = await saf.persistedUriPermissions();
    for (var perm in permissions ?? []) {
      if (perm.uri.toString().contains('com.whatsapp')) {
        _grantedUri = perm.uri;
        break;
      }
    }
  }

  Future<bool> requestNotificationPermission() async {
    final status = await Permission.notification.request();
    return status.isGranted;
  }

  Future<bool?> getFolderPermission() async {
    if (Platform.isAndroid && await Permission.storage.request().isGranted) {
      final androidInfo = Platform.operatingSystemVersion;
      // For older Android versions, we might not need SAF, but let's try SAF if needed
    }

    final uri = Uri.parse(waTreeUri);
    final grantedUri = await saf.openDocumentTree(initialUri: uri);
    if (grantedUri != null) {
      _grantedUri = grantedUri;
      return true;
    }
    return false;
  }

  Future<List<WhatsAppStatus>> getStatuses() async {
    if (_grantedUri == null) {
      // For Android 10 and below, try direct access as fallback
      final legacyDir = Directory(waLegacyPath);
      if (legacyDir.existsSync()) {
        return _getStatusesFromDir(legacyDir);
      }
      return [];
    }

    try {
      // Find Media folder
      final mediaDir = await saf.findFile(_grantedUri!, 'Media');
      if (mediaDir == null) return [];

      // Find .Statuses folder
      final statusesDir = await saf.findFile(mediaDir.uri, '.Statuses');
      if (statusesDir == null) return [];

      final cacheDir = await getTemporaryDirectory();
      final List<WhatsAppStatus> statuses = [];

      // List all files in .Statuses
      await for (final file in saf.listFiles(statusesDir.uri)) {
        final name = file.name ?? '';
        if (name.endsWith('.nomedia')) continue;

        bool isVideo = name.endsWith('.mp4');
        bool isImage = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png');

        if (isVideo || isImage) {
          // Cache the file locally to show it in UI since Image.file requires real path
          final bytes = await saf.getDocumentContent(file.uri);
          if (bytes != null) {
            final localFile = File('${cacheDir.path}/$name');
            if (!localFile.existsSync()) {
              await localFile.writeAsBytes(bytes);
            }
            statuses.add(WhatsAppStatus(
              path: localFile.path,
              isVideo: isVideo,
            ));
          }
        }
      }

      // Sort by modified time
      statuses.sort((a, b) => File(b.path).lastModifiedSync().compareTo(File(a.path).lastModifiedSync()));
      return statuses;
    } catch (e) {
      print('Error getting statuses: $e');
      return [];
    }
  }

  List<WhatsAppStatus> _getStatusesFromDir(Directory dir) {
    final List<WhatsAppStatus> statuses = [];
    for (var file in dir.listSync()) {
      if (file is File) {
        final path = file.path;
        if (path.endsWith('.nomedia')) continue;
        bool isVideo = path.endsWith('.mp4');
        bool isImage = path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png');
        if (isVideo || isImage) {
          statuses.add(WhatsAppStatus(path: path, isVideo: isVideo));
        }
      }
    }
    statuses.sort((a, b) => File(b.path).lastModifiedSync().compareTo(File(a.path).lastModifiedSync()));
    return statuses;
  }

  Future<void> clearCache() async {
    try {
      final cacheDir = await getTemporaryDirectory();
      for (var file in cacheDir.listSync()) {
        if (file is File && (file.path.endsWith('.mp4') || file.path.endsWith('.jpg') || file.path.endsWith('.jpeg') || file.path.endsWith('.png'))) {
          file.deleteSync();
        }
      }
    } catch (e) {
      print('Error clearing cache: $e');
    }
  }
}
