import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/download_result.dart';
import '../services/download_service.dart';
import '../theme/app_theme.dart';
import '../utils/platform_detector.dart';
import 'platform_badge_widget.dart';

enum SearchStatus { idle, fetching, success, error }

/// SmartSearchBar — mirrors SmartSearchBar.tsx from website
class SearchBarWidget extends StatefulWidget {
  final ValueChanged<DownloadResult> onResult;

  const SearchBarWidget({super.key, required this.onResult});

  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  final _controller = TextEditingController();
  SearchStatus _status = SearchStatus.idle;
  DetectedPlatform _platform = DetectedPlatform.unknown;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      setState(() {
        _platform = PlatformDetector.detect(_controller.text);
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleFetch() async {
    final url = _controller.text.trim();
    if (url.isEmpty || _status == SearchStatus.fetching) return;

    setState(() {
      _status = SearchStatus.fetching;
      _errorMessage = '';
    });

    final result = await DownloadService.instance.fetch(url);

    if (!mounted) return;

    if (result.isSuccess) {
      setState(() => _status = SearchStatus.success);
      widget.onResult(result);
      await Future.delayed(const Duration(seconds: 3));
      if (mounted) setState(() => _status = SearchStatus.idle);
    } else {
      setState(() {
        _status = SearchStatus.error;
        _errorMessage = result.errorText ?? 'Fetch gagal. Coba lagi.';
      });
      await Future.delayed(const Duration(seconds: 5));
      if (mounted) setState(() => _status = SearchStatus.idle);
    }
  }

  Future<void> _pasteFromClipboard() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data?.text != null) {
      _controller.text = data!.text!;
    }
  }

  Color get _buttonColor {
    switch (_status) {
      case SearchStatus.success:
        return AppColors.success;
      case SearchStatus.error:
        return AppColors.maroon;
      default:
        return AppColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Platform badge
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _platform != DetectedPlatform.unknown
              ? Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: PlatformBadgeWidget(platform: _platform),
                )
              : const SizedBox.shrink(),
        ),

        // Search field container
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              // Input row
              Row(
                children: [
                  const SizedBox(width: 16),
                  const Icon(Icons.search_rounded, color: AppColors.foreground, size: 18),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      style: AppTextStyles.mono(size: 11, letterSpacing: 1.0),
                      textCapitalization: TextCapitalization.none,
                      autocorrect: false,
                      onSubmitted: (_) => _handleFetch(),
                      decoration: InputDecoration(
                        hintText: 'PASTE URL MEDIA DI SINI...',
                        hintStyle: AppTextStyles.mono(size: 11, opacity: 0.3, letterSpacing: 1.0),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 18,
                        ),
                      ),
                    ),
                  ),
                  // Paste icon button
                  IconButton(
                    icon: const Icon(Icons.content_paste_rounded, size: 18),
                    color: AppColors.foreground.withOpacity(0.4),
                    onPressed: _pasteFromClipboard,
                    tooltip: 'Paste',
                  ),
                ],
              ),

              // Divider
              Container(height: 1, color: AppColors.border),

              // Fetch button — full width on mobile
              GestureDetector(
                onTap: _handleFetch,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 500),
                  width: double.infinity,
                  height: 52,
                  color: _buttonColor,
                  child: Center(
                    child: _status == SearchStatus.fetching
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.background,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'FETCHING...',
                                style: AppTextStyles.mono(
                                  size: 10,
                                  weight: FontWeight.w700,
                                  color: AppColors.background,
                                  letterSpacing: 2.5,
                                ),
                              ),
                            ],
                          )
                        : Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _status == SearchStatus.success
                                    ? 'SUCCESS ✓'
                                    : _status == SearchStatus.error
                                        ? 'RETRY'
                                        : 'FETCH STREAM',
                                style: AppTextStyles.mono(
                                  size: 10,
                                  weight: FontWeight.w700,
                                  color: AppColors.background,
                                  letterSpacing: 2.5,
                                ),
                              ),
                              if (_status == SearchStatus.idle) ...[
                                const SizedBox(width: 8),
                                const Icon(Icons.arrow_forward,
                                    color: AppColors.background, size: 16),
                              ],
                            ],
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Status bar (mono text below input, matches website)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(color: AppColors.border),
              right: BorderSide(color: AppColors.border),
              bottom: BorderSide(color: AppColors.border),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '[STATUS: ${_status == SearchStatus.fetching ? "BUSY" : "READY"}]',
                style: AppTextStyles.mono(size: 8, opacity: 0.4),
              ),
              Text(
                'Secure Extraction Protocol v1.0',
                style: AppTextStyles.mono(size: 8, opacity: 0.4),
              ),
            ],
          ),
        ),

        // Error message
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _errorMessage.isNotEmpty
              ? Container(
                  key: const ValueKey('error'),
                  margin: const EdgeInsets.only(top: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.maroonDim,
                    border: Border.all(color: AppColors.maroon.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded,
                          color: AppColors.maroon, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage,
                          style: AppTextStyles.mono(
                            size: 9,
                            weight: FontWeight.w700,
                            color: AppColors.maroon,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : const SizedBox.shrink(),
        ),
      ],
    );
  }
}
