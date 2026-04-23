import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:simple_icons/simple_icons.dart';
import '../theme/app_theme.dart';
import '../models/download_result.dart';
import '../widgets/search_bar_widget.dart';
import '../screens/result_bottom_sheet.dart';

/// HomeScreen — mirrors page.tsx + Hero.tsx + Navbar from website
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onResult(DownloadResult result) {
    ResultBottomSheet.show(context, result);
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: AppColors.background,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
        shape: const RoundedRectangleBorder(
          side: BorderSide(color: AppColors.border, width: 1),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Developer Image
              Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 1,
                    child: Image.asset(
                      'assets/images/developer.jpg',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: AppColors.cardSurface,
                        child: const Icon(Icons.person_rounded, size: 60, color: AppColors.border),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 20,
                    left: 20,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      color: AppColors.accent,
                      child: Text(
                        'LEAD_ARCHITECT',
                        style: AppTextStyles.mono(
                          size: 9,
                          weight: FontWeight.w700,
                          color: AppColors.background,
                          letterSpacing: 2,
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'DIAW Downloader V2',
                      style: AppTextStyles.serif(size: 28, height: 1.1),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'NATIVE_MOBILE_PROTOCOL_V2.0',
                      style: AppTextStyles.mono(size: 8, color: AppColors.accent, letterSpacing: 2),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Sebuah protokol ekstraksi media premium yang dirancang untuk memberikan pengalaman download yang aman, cepat, dan tanpa jejak. Semua logika berjalan langsung dari perangkat Anda.',
                      style: AppTextStyles.mono(size: 11, opacity: 0.6, height: 1.6),
                    ),
                    const SizedBox(height: 32),
                    Container(height: 1, color: AppColors.border),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'ENCRYPTION: AES-256',
                          style: AppTextStyles.mono(size: 8, opacity: 0.3),
                        ),
                        Text(
                          'STATUS: OPERATIONAL',
                          style: AppTextStyles.mono(size: 8, color: AppColors.success),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.accent,
                          side: const BorderSide(color: AppColors.accent),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                        ),
                        child: Text(
                          'TERMINATE_DIALOG',
                          style: AppTextStyles.mono(size: 10, weight: FontWeight.w700, letterSpacing: 2),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // ── App Bar (Navbar) ──────────────────────────────────────────────
          SliverAppBar(
            pinned: true,
            expandedHeight: 0,
            backgroundColor: AppColors.background.withOpacity(0.95),
            surfaceTintColor: Colors.transparent,
            title: Row(
              children: [
                // Real Logo from Assets
                Image.asset(
                  'assets/images/logo.png',
                  height: 28,
                  errorBuilder: (_, __, ___) => Container(
                    padding: const EdgeInsets.all(6),
                    color: AppColors.accent,
                    child: const Icon(
                      Icons.download_rounded,
                      color: AppColors.background,
                      size: 14,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'DIAW DOWNLOADER V2',
                      style: AppTextStyles.serif(size: 14, height: 1.0),
                    ),
                    Text(
                      'SECURE EXTRACTION PROTOCOL',
                      style: AppTextStyles.mono(size: 7, opacity: 0.4, letterSpacing: 2),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.info_outline_rounded, size: 20, color: AppColors.foreground),
                onPressed: () => _showAboutDialog(context),
              ),
              const SizedBox(width: 8),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Container(
                height: 1,
                color: AppColors.border,
              ),
            ),
          ),

          // ── Hero Section ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: _HeroSection(onResult: _onResult),
          ),

          // ── Platforms Feature Grid ───────────────────────────────────────
          SliverToBoxAdapter(
            child: _FeatureGridSection(),
          ),

          // ── Tutorial Section ─────────────────────────────────────────────
          SliverToBoxAdapter(
            child: _TutorialSection(),
          ),

          // ── Footer ───────────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: _Footer(onAboutTap: () => _showAboutDialog(context)),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero Section
// ─────────────────────────────────────────────────────────────────────────────
class _HeroSection extends StatelessWidget {
  final ValueChanged<DownloadResult> onResult;
  const _HeroSection({required this.onResult});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        minHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Eyebrow text
          Text(
            '// SOCIAL MEDIA',
            style: AppTextStyles.mono(size: 10, opacity: 0.5, letterSpacing: 3),
          )
              .animate()
              .fadeIn(duration: 600.ms, delay: 200.ms),

          const SizedBox(height: 12),

          // Big editorial title — mirrors hero.title
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: 'DOWNLOAD\n',
                  style: AppTextStyles.serif(size: 52, height: 1.05),
                ),
                TextSpan(
                  text: 'ANYTHING',
                  style: AppTextStyles.serif(
                    size: 52,
                    height: 1.05,
                    color: AppColors.foreground.withOpacity(0.5),
                  ),
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(duration: 800.ms, delay: 100.ms)
              .slideY(begin: 0.2, duration: 800.ms, curve: Curves.easeOut),

          const SizedBox(height: 24),

          // Subtitle — mirrors hero.subtitle
          Text(
            'Extract high-quality media from TikTok,\nInstagram, YouTube & more.\nSafe. Fast. Private.',
            style: AppTextStyles.mono(size: 10, opacity: 0.5, letterSpacing: 1.5),
          )
              .animate()
              .fadeIn(duration: 800.ms, delay: 400.ms),

          const SizedBox(height: 40),

          // Search bar
          SearchBarWidget(onResult: onResult)
              .animate()
              .fadeIn(duration: 800.ms, delay: 600.ms)
              .scale(begin: const Offset(0.97, 0.97), duration: 800.ms),

          const SizedBox(height: 40),

          // Scroll indicator
          Column(
            children: [
              Text(
                '↓ EXPLORE',
                style: AppTextStyles.mono(size: 8, opacity: 0.3, letterSpacing: 3),
              )
                  .animate(onPlay: (c) => c.repeat())
                  .slideY(begin: 0, end: 0.3, duration: 1000.ms, curve: Curves.easeInOut)
                  .then()
                  .slideY(begin: 0.3, end: 0, duration: 1000.ms),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Grid Section — mirrors FeatureGrid.tsx
// ─────────────────────────────────────────────────────────────────────────────
class _FeatureGridSection extends StatelessWidget {
  static const _platforms = [
    _PlatformData('Instagram', SimpleIcons.instagram, Color(0xFFE4405F)),
    _PlatformData('TikTok', SimpleIcons.tiktok, Colors.white),
    _PlatformData('YouTube', SimpleIcons.youtube, Color(0xFFFF0000)),
    _PlatformData('Twitter/X', SimpleIcons.x, Colors.white),
    _PlatformData('Pinterest', SimpleIcons.pinterest, Color(0xFFBD081C)),
    _PlatformData('SoundCloud', SimpleIcons.soundcloud, Color(0xFFFF3300)),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section header — mirrors FeatureGrid header
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Supported\nPlatforms.',
                      style: AppTextStyles.serif(size: 32, height: 1.1),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'MULTI-PLATFORM SUPPORT',
                      style: AppTextStyles.mono(size: 8, opacity: 0.5, letterSpacing: 3),
                    ),
                  ],
                ),
              ),
              Text(
                'Total: 06\n// Active',
                style: AppTextStyles.mono(size: 8, opacity: 0.3),
                textAlign: TextAlign.right,
              ),
            ],
          ),

          const SizedBox(height: 20),
          Container(height: 1, color: AppColors.border),
          const SizedBox(height: 24),

          // Platform grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 1.0,
              mainAxisSpacing: 1,
              crossAxisSpacing: 1,
            ),
            itemCount: _platforms.length,
            itemBuilder: (_, i) => _PlatformCell(
              data: _platforms[i],
              index: i,
            ),
          ),
        ],
      ),
    );
  }
}

class _PlatformData {
  final String name;
  final IconData icon;
  final Color color;
  const _PlatformData(this.name, this.icon, this.color);
}

class _PlatformCell extends StatefulWidget {
  final _PlatformData data;
  final int index;
  const _PlatformCell({required this.data, required this.index});

  @override
  State<_PlatformCell> createState() => _PlatformCellState();
}

class _PlatformCellState extends State<_PlatformCell> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _hovered = true),
      onTapUp: (_) => setState(() => _hovered = false),
      onTapCancel: () => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          color: _hovered ? AppColors.accent : Colors.transparent,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              widget.data.icon,
              size: 28,
              color: _hovered ? AppColors.background : widget.data.color,
            ),
            const SizedBox(height: 8),
            Text(
              widget.data.name.toUpperCase(),
              style: AppTextStyles.mono(
                size: 7,
                weight: FontWeight.w700,
                color: _hovered ? AppColors.background : AppColors.foreground,
                letterSpacing: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    )
        .animate(delay: Duration(milliseconds: 80 * widget.index))
        .fadeIn(duration: 400.ms);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial Section — mirrors TutorialSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
class _TutorialSection extends StatelessWidget {
  static const _steps = [
    _StepData('01', 'Copy URL', 'Salin URL dari TikTok, Instagram, YouTube, atau platform lain'),
    _StepData('02', 'Paste & Fetch', 'Paste di search bar, tekan FETCH STREAM'),
    _StepData('03', 'Pilih Format', 'Pilih kualitas video atau audio yang diinginkan'),
    _StepData('04', 'Download', 'Tekan tombol download, file tersimpan di app'),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(height: 1, color: AppColors.border),
          const SizedBox(height: 32),
          Text(
            'How It\nWorks.',
            style: AppTextStyles.serif(size: 32, height: 1.1),
          ),
          const SizedBox(height: 8),
          Text(
            'PANDUAN PENGGUNAAN',
            style: AppTextStyles.mono(size: 8, opacity: 0.5, letterSpacing: 3),
          ),
          const SizedBox(height: 32),
          ..._steps.asMap().entries.map((entry) => _StepRow(
                data: entry.value,
                index: entry.key,
              )),
        ],
      ),
    );
  }
}

class _StepData {
  final String number;
  final String title;
  final String desc;
  const _StepData(this.number, this.title, this.desc);
}

class _StepRow extends StatelessWidget {
  final _StepData data;
  final int index;
  const _StepRow({required this.data, required this.index});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 1),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 0),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            data.number,
            style: AppTextStyles.mono(
              size: 10,
              color: AppColors.accent,
              weight: FontWeight.w700,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.title.toUpperCase(),
                  style: AppTextStyles.mono(
                    size: 11,
                    weight: FontWeight.w700,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  data.desc,
                  style: AppTextStyles.mono(size: 10, opacity: 0.5, letterSpacing: 0.8),
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate(delay: Duration(milliseconds: 80 * index))
        .fadeIn(duration: 500.ms)
        .slideX(begin: -0.05, duration: 500.ms);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────
class _Footer extends StatelessWidget {
  final VoidCallback onAboutTap;
  const _Footer({required this.onAboutTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 40, 20, 60),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'DIAW DOWNLOADER V2',
                style: AppTextStyles.serif(size: 20),
              ),
              IconButton(
                onPressed: onAboutTap,
                icon: const Icon(Icons.arrow_outward_rounded, color: AppColors.accent, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'The ultimate tool for high-quality social media content extraction. Safe, fast, and private. No tracking. No logs. All processing happens on-device.',
            style: AppTextStyles.mono(size: 9, opacity: 0.4, height: 1.5, letterSpacing: 1.2),
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '© ${DateTime.now().year} DIAW PROTOCOL',
                style: AppTextStyles.mono(size: 8, opacity: 0.2, letterSpacing: 2),
              ),
              Text(
                'V2.0.0-STABLE',
                style: AppTextStyles.mono(size: 8, opacity: 0.2, letterSpacing: 2),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
