import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/download_result.dart';
import '../theme/app_theme.dart';

/// Download card for each picker item — mirrors the Button picker in ResultSection
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
  bool _isHovered = false;

  Future<void> _openUrl() async {
    final uri = Uri.tryParse(widget.item.url);
    if (uri == null) return;
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.maroon,
            content: Text(
              'DOWNLOAD_ERROR: Gagal membuka URL',
              style: AppTextStyles.mono(size: 10, color: AppColors.foreground),
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
        _openUrl();
      },
      onTapCancel: () => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        height: 72,
        decoration: BoxDecoration(
          border: Border.all(
            color: _isHovered ? AppColors.accent : AppColors.border,
            width: 1,
          ),
          color: _isHovered ? AppColors.accentDim : Colors.transparent,
        ),
        child: Stack(
          children: [
            // Left gold accent bar (appears on hover like website)
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: _isHovered ? 3 : 0,
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
                          widget.item.quality.toUpperCase(),
                          style: AppTextStyles.mono(
                            size: 11,
                            weight: FontWeight.w700,
                            color: _isHovered ? AppColors.accent : AppColors.foreground,
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
                            opacity: _isHovered ? 0.6 : 0.4,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
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
    )
        .animate(delay: Duration(milliseconds: 80 * widget.index))
        .fadeIn(duration: 400.ms)
        .slideX(begin: 0.1, duration: 400.ms, curve: Curves.easeOut);
  }
}
