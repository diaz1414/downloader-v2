import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

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

    setState(() {
      _isDownloading = true;
      _progress = 0;
    });

    try {
      final dio = Dio();
      
      // Manual path for Android to avoid path_provider build errors on Windows with spaces
      // Standard Android download path
      const String directoryPath = "/storage/emulated/0/Download";
      final dir = Directory(directoryPath);
      
      // Fallback if public download dir is not accessible
      String finalDir = directoryPath;
      if (!await dir.exists()) {
        finalDir = "/sdcard/Download";
        if (!await Directory(finalDir).exists()) {
           // Last fallback to internal files
           finalDir = "/data/user/0/com.diaw.downloader_v2/files";
        }
      }
      
      // Generate filename based on timestamp and extension
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = "diaw_${widget.item.type}_$timestamp.${widget.item.extension}";
      final filePath = "$finalDir/$fileName";

      await dio.download(
        widget.item.url,
        filePath,
        onReceiveProgress: (count, total) {
          if (total != -1) {
            setState(() {
              _progress = count / total;
            });
          }
        },
      );

      if (mounted) {
        setState(() {
          _isDownloading = false;
          _progress = 1.0;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.success,
            content: Text(
              'DOWNLOAD_SUCCESS: Saved to $fileName',
              style: AppTextStyles.mono(size: 10, color: Colors.white),
            ),
          ),
        );
      }
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
