import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../utils/platform_detector.dart';

/// Platform badge widget — mirrors the "Origin: [platform]" badge in SmartSearchBar
class PlatformBadgeWidget extends StatelessWidget {
  final DetectedPlatform platform;

  const PlatformBadgeWidget({super.key, required this.platform});

  @override
  Widget build(BuildContext context) {
    if (platform == DetectedPlatform.unknown) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.accent,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.language_rounded, color: AppColors.background, size: 12),
          const SizedBox(width: 6),
          Text(
            'ORIGIN: ${platform.label.toUpperCase()}',
            style: AppTextStyles.mono(
              size: 9,
              weight: FontWeight.w700,
              color: AppColors.background,
              letterSpacing: 1.5,
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 300.ms)
        .slideY(begin: 0.3, duration: 300.ms, curve: Curves.easeOut);
  }
}
