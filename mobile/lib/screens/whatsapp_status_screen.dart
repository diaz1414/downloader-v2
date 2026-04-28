import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gal/gal.dart';
import 'package:video_player/video_player.dart';
import 'package:shared_storage/shared_storage.dart' as saf;
import 'package:path_provider/path_provider.dart';
import '../theme/app_theme.dart';
import '../services/whatsapp_service.dart';
import '../services/notification_service.dart';

class WhatsAppStatusScreen extends StatefulWidget {
  const WhatsAppStatusScreen({super.key});

  @override
  State<WhatsAppStatusScreen> createState() => _WhatsAppStatusScreenState();
}

class _WhatsAppStatusScreenState extends State<WhatsAppStatusScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<WhatsAppStatus> _images = [];
  List<WhatsAppStatus> _videos = [];
  bool _isLoading = true;
  Uri? _grantedUri;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _checkPermissionsAndLoad();
  }

  Future<void> _checkPermissionsAndLoad() async {
    setState(() => _isLoading = true);
    
    // Request Notification permission first
    await WhatsAppService.instance.requestNotificationPermission();

    // Try to find persisted URI for WhatsApp
    Uri? uri = await WhatsAppService.instance.getPersistedUri('com.whatsapp');
    
    if (uri != null) {
      _grantedUri = uri;
      _loadFromUri(uri);
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _requestFolderAccess() async {
    // Show a helpful dialog explaining what to do
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.background,
        title: Text('IZIN AKSES FOLDER', style: AppTextStyles.mono(weight: FontWeight.bold)),
        content: Text(
          'Android membutuhkan izin manual untuk mengakses folder WhatsApp.\n\nNanti tekan tombol "Gunakan Folder Ini" / "Use This Folder" di bagian bawah layar sistem.',
          style: AppTextStyles.mono(size: 12),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('MENGERTI', style: AppTextStyles.mono(color: AppColors.accent)),
          ),
        ],
      ),
    );

    final uri = await WhatsAppService.instance.requestFolderPermission('Android/media/com.whatsapp/WhatsApp/Media/.Statuses');
    
    if (uri != null) {
      _grantedUri = uri;
      _loadFromUri(uri);
    }
  }

  Future<void> _loadFromUri(Uri uri) async {
    setState(() => _isLoading = true);
    final statuses = await WhatsAppService.instance.getStatusesFromUri(uri);
    
    setState(() {
      _images = statuses.where((s) => !s.isVideo).toList();
      _videos = statuses.where((s) => s.isVideo).toList();
      _isLoading = false;
    });
  }

  void _showStatusPreview(WhatsAppStatus status) {
    showDialog(
      context: context,
      builder: (context) => _StatusPreviewDialog(status: status),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.foreground),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('WHATSAPP STATUS', style: AppTextStyles.serif(size: 16, height: 1.0)),
            Text('SAF SECURE PROTOCOL', style: AppTextStyles.mono(size: 8, opacity: 0.4, letterSpacing: 2)),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accent,
          labelColor: AppColors.accent,
          tabs: const [Tab(text: 'IMAGES'), Tab(text: 'VIDEOS')],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
          : _grantedUri == null
              ? _buildGrantAccessUI()
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildGrid(_images),
                    _buildGrid(_videos),
                  ],
                ),
    );
  }

  Widget _buildGrantAccessUI() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.folder_shared_rounded, size: 64, color: AppColors.border),
            const SizedBox(height: 24),
            Text('AKSES DIBLOKIR SISTEM', style: AppTextStyles.mono(size: 14, weight: FontWeight.w700)),
            const SizedBox(height: 12),
            Text(
              'Android 11+ memerlukan izin manual untuk membaca folder WhatsApp Status demi keamanan Anda.',
              style: AppTextStyles.mono(size: 10, opacity: 0.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            OutlinedButton(
              onPressed: _requestFolderAccess,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.accent,
                side: const BorderSide(color: AppColors.accent),
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
              child: Text('BERIKAN AKSES FOLDER', style: AppTextStyles.mono(size: 10, weight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrid(List<WhatsAppStatus> items) {
    if (items.isEmpty) return const Center(child: Text('NO_STATUS_FOUND', style: TextStyle(color: Colors.white30)));
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 0.6,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final status = items[index];
        return GestureDetector(
          onTap: () => _showStatusPreview(status),
          child: Container(
            decoration: BoxDecoration(border: Border.all(color: AppColors.border), color: AppColors.cardSurface),
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (!status.isVideo)
                  Image.network(status.path, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.image))
                else
                  const Center(child: Icon(Icons.play_circle_outline_rounded, size: 40, color: AppColors.accent)),
                Positioned(
                  bottom: 0, left: 0, right: 0,
                  child: Container(
                    color: Colors.black54, padding: const EdgeInsets.all(4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(status.isVideo ? 'VIDEO' : 'IMAGE', style: const TextStyle(fontSize: 8, color: Colors.white70)),
                        const Icon(Icons.download, size: 12, color: AppColors.accent),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatusPreviewDialog extends StatefulWidget {
  final WhatsAppStatus status;
  const _StatusPreviewDialog({required this.status});

  @override
  State<_StatusPreviewDialog> createState() => _StatusPreviewDialogState();
}

class _StatusPreviewDialogState extends State<_StatusPreviewDialog> {
  bool _isSaving = false;

  Future<void> _saveMedia() async {
    setState(() => _isSaving = true);
    try {
      final uri = Uri.parse(widget.status.uri!);
      final content = await saf.getDocumentContent(uri);
      if (content == null) throw 'Gagal membaca file';

      final tempDir = await getTemporaryDirectory();
      final ext = widget.status.isVideo ? 'mp4' : 'jpg';
      final tempFile = File('${tempDir.path}/temp_wa_status.$ext');
      await tempFile.writeAsBytes(content);

      if (widget.status.isVideo) {
        await Gal.putVideo(tempFile.path);
      } else {
        await Gal.putImage(tempFile.path);
      }

      await NotificationService().showDownloadNotification('wa_status_$ext');
      
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.background,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: widget.status.isVideo 
              ? const Icon(Icons.video_library, size: 100, color: AppColors.accent)
              : Image.network(widget.status.path, height: 300, fit: BoxFit.contain),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: OutlinedButton(
              onPressed: _isSaving ? null : _saveMedia,
              style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.accent)),
              child: _isSaving ? const CircularProgressIndicator() : const Text('SAVE TO GALLERY'),
            ),
          ),
        ],
      ),
    );
  }
}
