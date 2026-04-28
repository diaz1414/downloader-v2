import 'dart:io';
import 'package:saf/saf.dart';
import 'package:permission_handler/permission_handler.dart';

class WhatsAppStatus {
  final String path;
  final bool isVideo;

  WhatsAppStatus({required this.path, required this.isVideo});
}

class WhatsAppService {
  WhatsAppService._();
  static final WhatsAppService instance = WhatsAppService._();

  static const String waPath = 'Android/media/com.whatsapp/WhatsApp/Media/.Statuses';
  static const String waBusinessPath = 'Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses';

  Saf? _saf;

  Future<void> init(String path) async {
    _saf = Saf(path);
  }

  Future<bool> requestNotificationPermission() async {
    final status = await Permission.notification.request();
    return status.isGranted;
  }

  Future<bool?> getFolderPermission() async {
    if (_saf == null) return false;
    return await _saf!.getDirectoryPermission();
  }

  Future<List<WhatsAppStatus>> getStatuses() async {
    if (_saf == null) return [];
    
    // Sync/Cache files from SAF to local app storage
    // Returns List<String>? which are the paths of cached files
    final List<String>? files = await _saf!.cache();
    
    if (files == null) return [];

    final List<WhatsAppStatus> statuses = [];
    for (var path in files) {
      if (path.endsWith('.nomedia')) continue;
      
      bool isVideo = path.endsWith('.mp4');
      bool isImage = path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png');
      
      if (isVideo || isImage) {
        statuses.add(WhatsAppStatus(
          path: path,
          isVideo: isVideo,
        ));
      }
    }
    
    return statuses;
  }

  Future<void> clearCache() async {
    if (_saf != null) await _saf!.clearCache();
  }
}
