import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gal/gal.dart';
import 'package:video_player/video_player.dart';
import '../theme/app_theme.dart';
import '../services/whatsapp_service.dart';

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
    _loadStatuses();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadStatuses() async {
    setState(() => _isLoading = true);
    
    final hasPerm = await WhatsAppService.instance.requestPermission();
    if (!hasPerm) {
      setState(() {
        _hasPermission = false;
        _isLoading = false;
      });
      return;
    }

    final statuses = await WhatsAppService.instance.getStatuses();
    
    setState(() {
      _hasPermission = true;
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
            Text(
              'WHATSAPP STATUS',
              style: AppTextStyles.serif(size: 16, height: 1.0),
            ),
            Text(
              'LOCAL STORAGE EXTRACTION',
              style: AppTextStyles.mono(size: 8, opacity: 0.4, letterSpacing: 2),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accent,
          labelColor: AppColors.accent,
          unselectedLabelColor: AppColors.foreground.withOpacity(0.5),
          labelStyle: AppTextStyles.mono(size: 10, weight: FontWeight.w700, letterSpacing: 1),
          tabs: const [
            Tab(text: 'IMAGES'),
            Tab(text: 'VIDEOS'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
          : !_hasPermission
              ? _buildPermissionDenied()
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildGrid(_images),
                    _buildGrid(_videos),
                  ],
                ),
    );
  }

  Widget _buildPermissionDenied() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.folder_off_rounded, size: 64, color: AppColors.border),
            const SizedBox(height: 24),
            Text(
              'PERMISSION DENIED',
              style: AppTextStyles.mono(size: 14, weight: FontWeight.w700, letterSpacing: 2),
            ),
            const SizedBox(height: 12),
            Text(
              'Aplikasi membutuhkan izin akses penyimpanan untuk membaca file status WhatsApp yang tersembunyi di perangkat Anda.',
              style: AppTextStyles.mono(size: 10, opacity: 0.5, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            OutlinedButton(
              onPressed: _loadStatuses,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.accent,
                side: const BorderSide(color: AppColors.accent),
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
              ),
              child: Text(
                'GRANT PERMISSION',
                style: AppTextStyles.mono(size: 10, weight: FontWeight.w700, letterSpacing: 2),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrid(List<WhatsAppStatus> items) {
    if (items.isEmpty) {
      return Center(
        child: Text(
          'NO_STATUS_FOUND',
          style: AppTextStyles.mono(size: 12, opacity: 0.3, letterSpacing: 2),
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.6,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final status = items[index];
        return GestureDetector(
          onTap: () => _showStatusPreview(status),
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              color: AppColors.cardSurface,
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (!status.isVideo)
                  Image.file(
                    File(status.path),
                    fit: BoxFit.cover,
                  )
                else
                  const Center(
                    child: Icon(Icons.play_circle_outline_rounded, size: 40, color: AppColors.accent),
                  ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    color: AppColors.background.withOpacity(0.8),
                    padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          status.isVideo ? 'VIDEO' : 'IMAGE',
                          style: AppTextStyles.mono(size: 8, opacity: 0.7),
                        ),
                        const Icon(Icons.download_rounded, size: 12, color: AppColors.accent),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ).animate(delay: Duration(milliseconds: 50 * (index % 10))).fadeIn(duration: 400.ms),
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
  VideoPlayerController? _videoController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.status.isVideo) {
      _videoController = VideoPlayerController.file(File(widget.status.path))
        ..initialize().then((_) {
          setState(() {});
          _videoController!.setLooping(true);
          _videoController!.play();
        });
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _saveMedia() async {
    setState(() => _isSaving = true);
    try {
      if (widget.status.isVideo) {
        await Gal.putVideo(widget.status.path);
      } else {
        await Gal.putImage(widget.status.path);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.success,
            content: Text(
              'SAVED TO GALLERY',
              style: AppTextStyles.mono(size: 10, color: AppColors.background, weight: FontWeight.w700),
            ),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.error,
            content: Text(
              'FAILED: $e',
              style: AppTextStyles.mono(size: 10, color: AppColors.foreground),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.background,
      insetPadding: const EdgeInsets.all(20),
      shape: const RoundedRectangleBorder(
        side: BorderSide(color: AppColors.border, width: 1),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'PREVIEW',
                  style: AppTextStyles.mono(size: 10, weight: FontWeight.w700, letterSpacing: 2),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20, color: AppColors.foreground),
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
          Container(height: 1, color: AppColors.border),
          
          // Content
          Container(
            color: AppColors.cardSurface,
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.6,
            ),
            child: widget.status.isVideo
                ? (_videoController != null && _videoController!.value.isInitialized)
                    ? AspectRatio(
                        aspectRatio: _videoController!.value.aspectRatio,
                        child: VideoPlayer(_videoController!),
                      )
                    : const Center(child: CircularProgressIndicator(color: AppColors.accent))
                : Image.file(
                    File(widget.status.path),
                    fit: BoxFit.contain,
                  ),
          ),
          
          // Footer / Action
          Container(height: 1, color: AppColors.border),
          Padding(
            padding: const EdgeInsets.all(16),
            child: OutlinedButton(
              onPressed: _isSaving ? null : _saveMedia,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.accent,
                side: const BorderSide(color: AppColors.accent),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
              ),
              child: _isSaving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent),
                    )
                  : Text(
                      'SAVE TO GALLERY',
                      style: AppTextStyles.mono(size: 10, weight: FontWeight.w700, letterSpacing: 2),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
