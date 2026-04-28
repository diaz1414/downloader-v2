import 'dart:io';
import 'package:permission_handler/permission_handler.dart';

class WhatsAppStatus {
  final String path;
  final bool isVideo;

  WhatsAppStatus({required this.path, required this.isVideo});
}

class WhatsAppService {
  WhatsAppService._();
  static final WhatsAppService instance = WhatsAppService._();

  final List<String> _paths = [
    '/storage/emulated/0/WhatsApp/Media/.Statuses',
    '/storage/emulated/0/Android/media/com.whatsapp/WhatsApp/Media/.Statuses',
    '/storage/emulated/0/Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses',
    '/storage/emulated/0/WhatsApp Business/Media/.Statuses',
    '/storage/emulated/0/GBWhatsApp/Media/.Statuses',
    '/storage/emulated/0/Android/media/com.gbwhatsapp/GBWhatsApp/Media/.Statuses',
  ];

  Future<bool> requestPermission() async {
    // Android 11+ All Files Access
    var manageStatus = await Permission.manageExternalStorage.status;
    if (!manageStatus.isGranted) {
      manageStatus = await Permission.manageExternalStorage.request();
    }
    if (manageStatus.isGranted) return true;

    // Android 10 and below Fallback
    var storageStatus = await Permission.storage.status;
    if (!storageStatus.isGranted) {
      storageStatus = await Permission.storage.request();
    }
    return storageStatus.isGranted;
  }

  Future<List<WhatsAppStatus>> getStatuses() async {
    final hasPermission = await requestPermission();
    if (!hasPermission) return [];

    List<WhatsAppStatus> statuses = [];
    Set<String> uniquePaths = {};

    for (String folderPath in _paths) {
      final dir = Directory(folderPath);
      if (await dir.exists()) {
        try {
          final items = dir.listSync();
          for (var item in items) {
            if (item is File) {
              final path = item.path;
              if (uniquePaths.contains(path)) continue;
              
              // Filter out .nomedia files
              if (path.endsWith('.nomedia')) continue;
              
              // Accept common image/video extensions
              if (path.endsWith('.jpg') || 
                  path.endsWith('.jpeg') || 
                  path.endsWith('.png') ||
                  path.endsWith('.mp4') ||
                  path.endsWith('.gif')) {
                
                uniquePaths.add(path);
                statuses.add(WhatsAppStatus(
                  path: path,
                  isVideo: path.endsWith('.mp4') || path.endsWith('.gif'),
                ));
              }
            }
          }
        } catch (e) {
          print('Error reading folder $folderPath: $e');
        }
      }
    }

    // Sort by modified time (newest first)
    statuses.sort((a, b) {
      final fileA = File(a.path);
      final fileB = File(b.path);
      try {
        final modA = fileA.lastModifiedSync();
        final modB = fileB.lastModifiedSync();
        return modB.compareTo(modA);
      } catch (_) {
        return 0;
      }
    });

    return statuses;
  }
}
