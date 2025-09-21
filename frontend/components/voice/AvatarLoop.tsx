'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface AvatarLoopProps {
  className?: string;
  isPlaying: boolean;
  onLoadedData?: () => void;
  onError?: (error: string) => void;
}

export interface AvatarLoopRef {
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export const AvatarLoop = forwardRef<AvatarLoopRef, AvatarLoopProps>(
  ({ className = '', isPlaying, onLoadedData, onError }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isPlayingRef = useRef(false);

    useImperativeHandle(ref, () => ({
      play: () => {
        if (videoRef.current && !isPlayingRef.current) {
          videoRef.current.play().catch(err => {
            console.error('Failed to play avatar video:', err);
            onError?.('Failed to play avatar animation');
          });
          isPlayingRef.current = true;
        }
      },
      pause: () => {
        if (videoRef.current && isPlayingRef.current) {
          videoRef.current.pause();
          isPlayingRef.current = false;
        }
      },
      reset: () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
          isPlayingRef.current = false;
        }
      }
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleLoadedData = () => {
        onLoadedData?.();
      };

      const handleError = () => {
        onError?.('Failed to load avatar video');
      };

      const handleEnded = () => {
        // Loop the video seamlessly
        if (isPlayingRef.current) {
          video.currentTime = 0;
          video.play();
        }
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
        video.removeEventListener('ended', handleEnded);
      };
    }, [onLoadedData, onError]);

    useEffect(() => {
      if (isPlaying && !isPlayingRef.current) {
        // Start playing with ≤120ms delay
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error('Failed to start avatar video:', err);
            });
            isPlayingRef.current = true;
          }
        });
      } else if (!isPlaying && isPlayingRef.current) {
        // Stop playing immediately (≤120ms requirement)
        if (videoRef.current) {
          videoRef.current.pause();
          isPlayingRef.current = false;
        }
      }
    }, [isPlaying]);

    return (
      <div className={`relative ${className}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover rounded-lg"
          muted
          playsInline
          preload="auto"
        >
          <source src="/assets/avatar/talking-loop.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }
);

AvatarLoop.displayName = 'AvatarLoop';