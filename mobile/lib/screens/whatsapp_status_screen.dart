import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gal/gal.dart';
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
  bool _hasPermission = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initServiceAndLoad();
  }

  Future<void> _initServiceAndLoad() async {
    setState(() => _isLoading = true);
    // Primary path for WhatsApp
    await WhatsAppService.instance.init();
    await WhatsAppService.instance.requestNotificationPermission();
    
    final bool? isGranted = await WhatsAppService.instance.getFolderPermission();
    
    if (isGranted == true) {
      _hasPermission = true;
      await _refreshStatuses();
    } else {
      // Try Business if primary fails? Or just let user grant primary.
      // For now, if denied, we stay in "Grant Access" UI.
      setState(() {
        _hasPermission = false;
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshStatuses() async {
    setState(() => _isLoading = true);
    try {
      final statuses = await WhatsAppService.instance.getStatuses();
      setState(() {
        _images = statuses.where((s) => !s.isVideo).toList();
        _videos = statuses.where((s) => s.isVideo).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
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
        actions: [
          if (_hasPermission)
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: AppColors.accent),
              onPressed: _refreshStatuses,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
          : !_hasPermission
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
              onPressed: _initServiceAndLoad,
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
                  Image.file(File(status.path), fit: BoxFit.cover)
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
      if (widget.status.isVideo) {
        await Gal.putVideo(widget.status.path);
      } else {
        await Gal.putImage(widget.status.path);
      }

      await NotificationService().showDownloadNotification('wa_status_${widget.status.isVideo ? 'video' : 'image'}');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved to Gallery!')));
        Navigator.pop(context);
      }
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
              : Image.file(File(widget.status.path), height: 300, fit: BoxFit.contain),
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
