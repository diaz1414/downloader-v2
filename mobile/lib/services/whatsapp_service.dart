import 'dart:io';
import 'package:shared_storage/shared_storage.dart';
import 'package:permission_handler/permission_handler.dart';

class WhatsAppStatus {
  final String path;
  final bool isVideo;
  final String? uri; // For SAF

  WhatsAppStatus({required this.path, required this.isVideo, this.uri});
}

class WhatsAppService {
  WhatsAppService._();
  static final WhatsAppService instance = WhatsAppService._();

  // Root URIs for SAF
  final Map<String, String> _waPaths = {
    'WhatsApp': 'Android/media/com.whatsapp/WhatsApp/Media/.Statuses',
    'WhatsApp Business': 'Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses',
    'GBWhatsApp': 'Android/media/com.gbwhatsapp/GBWhatsApp/Media/.Statuses',
    'WhatsApp (Legacy)': 'WhatsApp/Media/.Statuses',
  };

  Future<bool> requestNotificationPermission() async {
    final status = await Permission.notification.request();
    return status.isGranted;
  }

  /// Check if we already have SAF permission for a specific folder
  Future<Uri?> getPersistedUri(String folderName) async {
    final persistedUris = await persistedUriPermissions();
    if (persistedUris == null) return null;
    
    for (final permission in persistedUris) {
      if (permission.isReadPermission) {
        // Simple check: if the URI contains the folder name
        if (permission.uri.toString().contains(folderName.replaceAll(' ', '%20'))) {
          return permission.uri;
        }
      }
    }
    return null;
  }

  /// Request SAF permission for a folder
  Future<Uri?> requestFolderPermission(String folderPath) async {
    // This will open the system file picker
    final uri = await openDocumentTree(initialUri: Uri.parse('content://com.android.externalstorage.documents/tree/primary%3A${folderPath.replaceAll('/', '%2F')}'));
    return uri;
  }

  Future<List<WhatsAppStatus>> getStatusesFromUri(Uri rootUri) async {
    List<WhatsAppStatus> statuses = [];
    
    final files = await listFiles(rootUri, columns: [DocumentFileColumn.displayName, DocumentFileColumn.size, DocumentFileColumn.lastModified, DocumentFileColumn.mimeType, DocumentFileColumn.id]);
    
    if (files == null) return [];

    for (final file in files) {
      final name = file.name ?? '';
      final mimeType = file.mimeType ?? '';
      
      if (name.endsWith('.nomedia')) continue;
      
      bool isVideo = mimeType.startsWith('video/') || name.endsWith('.mp4');
      bool isImage = mimeType.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png');
      
      if (isVideo || isImage) {
        statuses.add(WhatsAppStatus(
          path: file.uri.toString(), // We use URI as path for SAF
          isVideo: isVideo,
          uri: file.uri.toString(),
        ));
      }
    }
    
    // Note: sorting SAF files might be needed if not sorted by system
    return statuses;
  }
}
