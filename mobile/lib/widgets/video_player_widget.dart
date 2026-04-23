import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../theme/app_theme.dart';

class VideoPlayerWidget extends StatefulWidget {
  final String url;
  final String? poster;

  const VideoPlayerWidget({
    super.key,
    required this.url,
    this.poster,
  });

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  late VideoPlayerController _videoPlayerController;
  ChewieController? _chewieController;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(widget.url));
    await _videoPlayerController.initialize();

    _chewieController = ChewieController(
      videoPlayerController: _videoPlayerController,
      autoPlay: false,
      looping: false,
      aspectRatio: _videoPlayerController.value.aspectRatio,
      materialProgressColors: ChewieProgressColors(
        playedColor: AppColors.accent,
        handleColor: AppColors.accent,
        backgroundColor: AppColors.border,
        bufferedColor: AppColors.foreground.withOpacity(0.1),
      ),
      placeholder: widget.poster != null
          ? Image.network(widget.poster!, fit: BoxFit.cover)
          : const Center(child: CircularProgressIndicator(strokeWidth: 1, color: AppColors.accent)),
      errorBuilder: (context, errorMessage) {
        return Center(
          child: Text(
            'VIDEO_PLAYBACK_ERROR',
            style: AppTextStyles.mono(size: 10, color: AppColors.maroon),
          ),
        );
      },
    );
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _videoPlayerController.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: _videoPlayerController.value.isInitialized
          ? _videoPlayerController.value.aspectRatio
          : 16 / 9,
      child: _chewieController != null && _chewieController!.videoPlayerController.value.isInitialized
          ? Chewie(controller: _chewieController!)
          : Container(
              color: Colors.black,
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 1, color: AppColors.accent),
              ),
            ),
    );
  }
}
