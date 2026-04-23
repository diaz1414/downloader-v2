import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/download_result.dart';
import '../theme/app_theme.dart';
import '../widgets/download_card_widget.dart';
import '../widgets/video_player_widget.dart';

/// ResultBottomSheet — mirrors ResultSection.tsx from website
/// Shown as a DraggableScrollableSheet after a successful fetch
class ResultBottomSheet extends StatelessWidget {
  final DownloadResult data;

  const ResultBottomSheet({super.key, required this.data});

  static Future<void> show(BuildContext context, DownloadResult data) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withOpacity(0.8),
      builder: (_) => ResultBottomSheet(data: data),
    );
  }

  @override
  Widget build(BuildContext context) {
    final recordId = DateTime.now().millisecondsSinceEpoch
        .toRadixString(36)
        .substring(3)
        .toUpperCase();

    // Use the first video URL for preview if available, otherwise use data.url
    final previewUrl = data.picker.firstWhere(
      (item) => item.type == 'video',
      orElse: () => PickerItem(url: data.url ?? '', type: 'video', quality: 'HD', extension: 'mp4')
    ).url;

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.97,
      minChildSize: 0.5,
      builder: (_, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.background,
            border: Border(
              top: BorderSide(color: AppColors.border, width: 1),
              left: BorderSide(color: AppColors.border, width: 1),
              right: BorderSide(color: AppColors.border, width: 1),
            ),
          ),
          child: Column(
            children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 3,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // System result log header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'SYSTEM_RESULT_LOG',
                      style: AppTextStyles.mono(size: 8, opacity: 0.2),
                    ),
                    Text(
                      DateTime.now().toIso8601String().substring(0, 19),
                      style: AppTextStyles.mono(size: 8, opacity: 0.2),
                    ),
                  ],
                ),
              ),

              // Scrollable content
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                  children: [
                    // ── Title & Status ──────────────────────────────────────
                    Text(
                      data.title ?? 'Unidentified Media Record',
                      style: AppTextStyles.serif(size: 26, height: 1.2),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    )
                        .animate()
                        .fadeIn(duration: 500.ms)
                        .slideY(begin: 0.2, duration: 500.ms),

                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: AppColors.accent,
                            shape: BoxShape.circle,
                          ),
                        )
                            .animate(onPlay: (c) => c.repeat())
                            .fadeIn(duration: 500.ms)
                            .then()
                            .fadeOut(duration: 500.ms),
                        const SizedBox(width: 8),
                        Text(
                          'READY FOR DOWNLOAD',
                          style: AppTextStyles.mono(size: 8, opacity: 0.4, letterSpacing: 2),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),
                    Container(height: 1, color: AppColors.border.withOpacity(0.3)),
                    const SizedBox(height: 20),

                    // ── Media Player Preview ─────────────────────────────────
                    if (previewUrl.isNotEmpty) ...[
                      Stack(
                        children: [
                          VideoPlayerWidget(
                            url: previewUrl,
                            poster: data.thumbnail,
                          ),
                          Positioned(
                            top: 8,
                            left: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              color: AppColors.background.withOpacity(0.9),
                              child: Text(
                                'LIVE PREVIEW',
                                style: AppTextStyles.mono(
                                    size: 7, weight: FontWeight.w700, letterSpacing: 2),
                              ),
                            ),
                          ),
                        ],
                      )
                          .animate()
                          .fadeIn(delay: 150.ms, duration: 500.ms),
                      const SizedBox(height: 8),
                    ],

                    // Source info
                    if (data.source != null) ...[
                      Row(
                        children: [
                          const Icon(Icons.language_rounded,
                              size: 12, color: AppColors.foreground),
                          const SizedBox(width: 6),
                          Text(
                            data.source!.toUpperCase(),
                            style: AppTextStyles.mono(size: 9, opacity: 0.5),
                          ),
                          const Spacer(),
                          Text(
                            'INTEGRITY: 100%',
                            style: AppTextStyles.mono(size: 9, opacity: 0.3),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                    ],

                    Container(height: 1, color: AppColors.border.withOpacity(0.3)),
                    const SizedBox(height: 20),

                    // ── Output Protocols Label ───────────────────────────────
                    Row(
                      children: [
                        Text(
                          'OUTPUT PROTOCOLS',
                          style: AppTextStyles.mono(
                            size: 9,
                            weight: FontWeight.w700,
                            color: AppColors.accent,
                            letterSpacing: 3,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            height: 1,
                            color: AppColors.accentMid,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // ── Download Picker Cards ────────────────────────────────
                    if (data.picker.isNotEmpty) ...[
                      ...data.picker
                          .asMap()
                          .entries
                          .map((entry) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: DownloadCardWidget(
                                  item: entry.value,
                                  index: entry.key,
                                ),
                              )),
                    ] else if (data.url != null) ...[
                      GestureDetector(
                        onTap: () {}, // handled in download card
                        child: Container(
                          width: double.infinity,
                          height: 72,
                          color: AppColors.accent,
                          child: Center(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.download_rounded,
                                    color: AppColors.background, size: 18),
                                const SizedBox(width: 10),
                                Text(
                                  'FETCH STREAM',
                                  style: AppTextStyles.mono(
                                    size: 11,
                                    weight: FontWeight.w700,
                                    color: AppColors.background,
                                    letterSpacing: 2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          border: Border.all(
                              color: AppColors.border,
                              style: BorderStyle.solid),
                        ),
                        child: Center(
                          child: Text(
                            'ARCHIVE_FETCH_ERROR: NO_STREAMS_FOUND',
                            style: AppTextStyles.mono(size: 9, opacity: 0.4),
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 28),
                    Divider(color: AppColors.border.withValues(alpha: 0.5)),
                    const SizedBox(height: 16),

                    // ── Technical Footer ─────────────────────────────────────
                    Wrap(
                      spacing: 16,
                      runSpacing: 6,
                      children: [
                        Text('Record ID: $recordId',
                            style: AppTextStyles.mono(size: 8, opacity: 0.3)),
                        Text('Integrity: Verified',
                            style: AppTextStyles.mono(size: 8, opacity: 0.3)),
                        Text('Access Level: Universal',
                            style: AppTextStyles.mono(size: 8, opacity: 0.3)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.accentDim,
                        border: Border.all(color: AppColors.accentMid),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'PROCEED TO LOCAL STORAGE',
                            style: AppTextStyles.mono(
                              size: 8,
                              weight: FontWeight.w700,
                              color: AppColors.accent,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.open_in_new_rounded,
                              color: AppColors.accent, size: 12),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
