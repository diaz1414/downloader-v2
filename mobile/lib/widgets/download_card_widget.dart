import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gal/gal.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';
import '../models/download_result.dart';
import '../theme/app_theme.dart';

class DownloadCardWidget extends StatefulWidget {
  final PickerItem item;
  final int index;

  const DownloadCardWidget({
    super.key,
    required this.item,
    required this.index,
  });

  @override
  State<DownloadCardWidget> createState() => _DownloadCardWidgetState();
}

class _DownloadCardWidgetState extends State<DownloadCardWidget> {
  bool _isDownloading = false;
  bool _isSuccess = false;
  double _progress = 0;
  bool _isHovered = false;

  Future<void> _downloadFile() async {
    if (_isDownloading || _isSuccess) return;

    // Check permissions based on Android version
    if (Platform.isAndroid) {
      if (widget.item.type == 'audio' || widget.item.extension == 'mp3') {
        final status = await Permission.audio.request();
        if (status.isDenied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('AUDIO_PERMISSION_DENIED')),
            );
          }
          return;
        }
      } else if (widget.item.type == 'video' || widget.item.extension == 'mp4') {
        final status = await Permission.videos.request();
        if (status.isDenied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('VIDEO_PERMISSION_DENIED')),
            );
          }
          return;
        }
      } else {
        final status = await Permission.storage.request();
        if (status.isDenied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('STORAGE_PERMISSION_DENIED')),
            );
          }
          return;
        }
      }
    }

    setState(() {
      _isDownloading = true;
      _isSuccess = false;
      _progress = 0;
    });

    try {
      final dio = Dio();
      final tempDir = Directory.systemTemp;
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final tempPath = "${tempDir.path}/diaw_$timestamp.${widget.item.extension}";

      await dio.download(
        widget.item.url,
        tempPath,
        onReceiveProgress: (count, total) {
          if (total != -1) {
            setState(() {
              _progress = count / total;
            });
          }
        },
      );

      // Save to Gallery or Share
      if (widget.item.type == 'video') {
        await Gal.putVideo(tempPath);
      } else if (widget.item.type == 'audio' || widget.item.isAudio) {
        // Gal does not support audio files. Use share_plus to allow user to "Save to Files"
        final xFile = XFile(tempPath);
        await Share.shareXFiles(
          [xFile], 
          text: '${widget.item.quality} - ${widget.item.extension.toUpperCase()}',
          subject: 'Download: ${widget.item.quality}',
        );
      } else {
        await Gal.putImage(tempPath);
      }

      if (mounted) {
        setState(() {
          _isDownloading = false;
          _isSuccess = true;
          _progress = 1.0;
        });
      }
      
      final file = File(tempPath);
      if (await file.exists()) {
        // Keep file for a bit so Share can process it if needed, 
        // but normally Share.shareXFiles handles it.
        // For safety on some platforms, we wait a tiny bit or just delete after.
        Future.delayed(const Duration(seconds: 1), () async {
          if (await file.exists()) await file.delete();
        });
      }

    } catch (e) {
      if (mounted) {
        setState(() => _isDownloading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.maroon,
            content: Text('DOWNLOAD_ERROR: ${e.toString()}'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAudio = widget.item.isAudio;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isHovered = true),
      onTapUp: (_) {
        setState(() => _isHovered = false);
        _downloadFile();
      },
      onTapCancel: () => setState(() => _isHovered = false),
      child: Stack(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            height: 72,
            decoration: BoxDecoration(
              border: Border.all(
                color: _isSuccess 
                    ? AppColors.success 
                    : (_isHovered || _isDownloading ? AppColors.accent : AppColors.border),
                width: _isSuccess ? 1.5 : 1,
              ),
              color: _isSuccess 
                  ? AppColors.success.withOpacity(0.05) 
                  : (_isHovered ? AppColors.accentDim : Colors.transparent),
            ),
            child: Stack(
              children: [
                // Progress Background
                if (_isDownloading && !_isSuccess)
                  Positioned.fill(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        width: MediaQuery.of(context).size.width * _progress,
                        color: AppColors.accent.withOpacity(0.1),
                      ),
                    ),
                  ),

                // Left accent bar
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: _isHovered || _isDownloading || _isSuccess ? 3 : 0,
                  color: _isSuccess ? AppColors.success : AppColors.accent,
                ),

                // Card content
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _isSuccess 
                                  ? 'SUCCESS_VERIFIED' 
                                  : (_isDownloading 
                                      ? 'DOWNLOADING... ${( _progress * 100).toInt()}%'
                                      : widget.item.quality.toUpperCase()),
                              style: AppTextStyles.mono(
                                size: 11,
                                weight: FontWeight.w700,
                                color: _isSuccess 
                                    ? AppColors.success 
                                    : (_isHovered || _isDownloading ? AppColors.accent : AppColors.foreground),
                                letterSpacing: 2,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _isSuccess 
                                  ? 'FILE_SAVED_TO_GALLERY'
                                  : '${widget.item.extension.toUpperCase()} • SECURED',
                              style: AppTextStyles.mono(
                                size: 8,
                                color: _isSuccess ? AppColors.success.withOpacity(0.7) : AppColors.foreground.withOpacity(0.4),
                                letterSpacing: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 200),
                        child: _isSuccess
                            ? const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 22)
                            : (_isDownloading
                                ? SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      value: _progress,
                                      strokeWidth: 2,
                                      color: AppColors.accent,
                                    ),
                                  )
                                : Icon(
                                    isAudio ? Icons.music_note_rounded : Icons.download_rounded,
                                    key: ValueKey(_isHovered),
                                    color: _isHovered ? AppColors.accent : AppColors.foreground.withOpacity(0.4),
                                    size: 20,
                                  )),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate(delay: Duration(milliseconds: 80 * widget.index))
        .fadeIn(duration: 400.ms)
        .slideX(begin: 0.1, duration: 400.ms, curve: Curves.easeOut);
  }
}
