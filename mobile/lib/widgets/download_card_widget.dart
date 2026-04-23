import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gal/gal.dart';
import 'package:permission_handler/permission_handler.dart';
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
  double _progress = 0;
  bool _isHovered = false;

  Future<void> _downloadFile() async {
    if (_isDownloading) return;

    // Check permissions
    if (Platform.isAndroid) {
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

    setState(() {
      _isDownloading = true;
      _progress = 0;
    });

    try {
      final dio = Dio();
      
      // Use temporary directory for initial download
      // We will then move it to Gallery using Gal
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

      // Save to Gallery/Photos
      if (widget.item.type == 'video') {
        await Gal.putVideo(tempPath);
      } else if (widget.item.type == 'audio' || widget.item.isAudio) {
        // Gal handles images and videos. For audio, we might need to save to Download folder
        // but let's try putVideo (some systems accept it) or just notify user
        // If it's truly audio, we might just keep it in Downloads
        await Gal.putVideo(tempPath); // Fallback attempt
      } else {
        await Gal.putImage(tempPath);
      }

      if (mounted) {
        setState(() {
          _isDownloading = false;
          _progress = 1.0;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.success,
            content: Text(
              'SAVED_TO_GALLERY_SUCCESSFULLY',
              style: AppTextStyles.mono(size: 10, color: Colors.white),
            ),
          ),
        );
      }
      
      // Clean up temp file
      final file = File(tempPath);
      if (await file.exists()) await file.delete();

    } catch (e) {
      if (mounted) {
        setState(() => _isDownloading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.maroon,
            content: Text(
              'DOWNLOAD_ERROR: ${e.toString()}',
              style: AppTextStyles.mono(size: 10, color: Colors.white),
            ),
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
                color: _isHovered || _isDownloading ? AppColors.accent : AppColors.border,
                width: 1,
              ),
              color: _isHovered ? AppColors.accentDim : Colors.transparent,
            ),
            child: Stack(
              children: [
                // Progress Background
                if (_isDownloading)
                  Positioned.fill(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        width: MediaQuery.of(context).size.width * _progress,
                        color: AppColors.accent.withOpacity(0.1),
                      ),
                    ),
                  ),

                // Left gold accent bar
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: _isHovered || _isDownloading ? 3 : 0,
                  color: AppColors.accent,
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
                              _isDownloading 
                                  ? 'DOWNLOADING... ${( _progress * 100).toInt()}%'
                                  : widget.item.quality.toUpperCase(),
                              style: AppTextStyles.mono(
                                size: 11,
                                weight: FontWeight.w700,
                                color: _isHovered || _isDownloading ? AppColors.accent : AppColors.foreground,
                                letterSpacing: 2,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${widget.item.extension.toUpperCase()} • SECURED',
                              style: AppTextStyles.mono(
                                size: 8,
                                opacity: _isHovered || _isDownloading ? 0.6 : 0.4,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 200),
                        child: _isDownloading
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
                              ),
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
