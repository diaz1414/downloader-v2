import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';

/// Full-screen no internet overlay — shown when connectivity is lost
class NoInternetScreen extends StatelessWidget {
  final VoidCallback onRetry;

  const NoInternetScreen({super.key, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Corner mark
              Align(
                alignment: Alignment.topRight,
                child: Text(
                  'SYS_ERR // NET_OFFLINE',
                  style: AppTextStyles.mono(size: 8, opacity: 0.2),
                ),
              ),
              const Spacer(),

              // Icon pulsing
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.maroon, width: 1),
                ),
                child: const Icon(
                  Icons.wifi_off_rounded,
                  color: AppColors.maroon,
                  size: 28,
                ),
              )
                  .animate(onPlay: (c) => c.repeat())
                  .fadeIn(duration: 600.ms)
                  .then()
                  .fadeOut(duration: 600.ms),

              const SizedBox(height: 32),

              // Big heading
              Text(
                'NO SIGNAL\nDETECTED',
                style: AppTextStyles.serif(size: 42, height: 1.0),
              ).animate().fadeIn(delay: 100.ms, duration: 600.ms).slideY(begin: 0.2),

              const SizedBox(height: 16),

              Container(width: 48, height: 1, color: AppColors.border),

              const SizedBox(height: 16),

              Text(
                'Koneksi internet diperlukan\nuntuk mengunduh media.',
                style: AppTextStyles.mono(size: 11, opacity: 0.5, letterSpacing: 1.2),
              ).animate().fadeIn(delay: 200.ms, duration: 600.ms),

              const SizedBox(height: 48),

              // Retry button — matches gold accent button style
              GestureDetector(
                onTap: onRetry,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.accent),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'RETRY CONNECTION',
                        style: AppTextStyles.mono(
                          size: 10,
                          weight: FontWeight.w700,
                          color: AppColors.accent,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Icon(Icons.arrow_forward, color: AppColors.accent, size: 16),
                    ],
                  ),
                ),
              ).animate().fadeIn(delay: 300.ms, duration: 600.ms),

              const Spacer(),

              // Bottom mono text
              Text(
                '[STATUS: NET_OFFLINE] // Secure Extraction Protocol v1.0',
                style: AppTextStyles.mono(size: 8, opacity: 0.2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
