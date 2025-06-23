import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import Spinner from "../components/Spinner";

const Container = styled.div`
  height: 100%;
  width: 100%;
  background-color: #000;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Canvas = styled.canvas`
  display: ${(props) => (props.$show ? "block" : "none")};
  width: 100%;
  height: 100%;
`;

const HiddenVideo = styled.video`
  position: absolute;
  top: -9999px;
  left: -9999px;
  width: 1px;
  height: 1px;
`;

const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

function ColorSpectrum({
  videoStream,
  error,
  loading,
  barCount = 36,
  isPaused = false
}) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const previousIntensitiesRef = useRef([]);
  const smoothingFactor = 0.9; // How much to smooth (0 = no smoothing, 1 = full smoothing)

  // Consolidated video control and animation logic
  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement || loading || error) {
      return;
    }

    // Set up video stream if provided
    if (videoStream) {
      videoElement.srcObject = videoStream;
    }

    // Function to safely control video playback
    const controlVideoPlayback = async () => {
      try {
        if (isPaused) {
          videoElement.pause();
          // Stop animation when paused (but keep current frame visible)
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        } else {
          // Only try to play if video is ready and not already playing
          if (videoElement.readyState >= 3 && videoElement.paused) {
            await videoElement.play();
          }

          // Start animation if not already running
          if (!animationFrameRef.current && videoElement.readyState >= 3) {
            startAnimation();
          }
        }
      } catch (error) {
        // Silently handle play errors (they're expected when video isn't ready)
        console.debug("Video playback control:", error.message);
      }
    };

    // Animation function
    const drawSpectrum = () => {
      if (
        videoElement &&
        canvasRef.current &&
        videoElement.readyState >= 3 &&
        !videoElement.paused &&
        !videoElement.ended &&
        !isPaused
      ) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const video = videoElement;

        // Set canvas dimensions
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Create or update off-screen canvas for video analysis
        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement("canvas");
        }
        const offscreenCanvas = offscreenCanvasRef.current;
        const offscreenCtx = offscreenCanvas.getContext("2d");

        // Set off-screen canvas to a smaller "pixelated" size for dominant color extraction
        const pixelatedWidth = Math.max(1, Math.floor(barCount * 2)); // 2x bar count for good sampling
        const pixelatedHeight = Math.max(
          1,
          Math.floor(video.videoHeight * (pixelatedWidth / video.videoWidth))
        );

        offscreenCanvas.width = pixelatedWidth;
        offscreenCanvas.height = pixelatedHeight;

        // Draw video frame to small off-screen canvas (this "pixelates" it)
        offscreenCtx.drawImage(video, 0, 0, pixelatedWidth, pixelatedHeight);

        // Get image data from the pixelated version
        const imageData = offscreenCtx.getImageData(
          0,
          0,
          pixelatedWidth,
          pixelatedHeight
        );
        const data = imageData.data;

        // Clear main canvas
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate bar width and spacing
        const barWidth = canvas.width / barCount;

        // Analyze pixelated video data and extract dominant colors
        const colorData = [];
        const segmentWidth = Math.floor(pixelatedWidth / barCount);

        for (let i = 0; i < barCount; i++) {
          let totalR = 0,
            totalG = 0,
            totalB = 0;
          let colorAmount = 0;
          let pixelCount = 0;

          // Sample pixels from this vertical segment of the pixelated image
          const startX = i * segmentWidth;
          const endX = Math.min(startX + segmentWidth, pixelatedWidth);

          for (let x = startX; x < endX; x++) {
            for (let y = 0; y < pixelatedHeight; y++) {
              // Sample all pixels since the image is already small
              const pixelIndex = (y * pixelatedWidth + x) * 4;
              const r = data[pixelIndex];
              const g = data[pixelIndex + 1];
              const b = data[pixelIndex + 2];

              totalR += r;
              totalG += g;
              totalB += b;

              // Calculate color amount based on how much color is present (not just brightness)
              const maxChannel = Math.max(r, g, b);
              const minChannel = Math.min(r, g, b);
              const colorPresence = maxChannel - minChannel; // How much color vs grayscale
              colorAmount += colorPresence;
              pixelCount++;
            }
          }

          if (pixelCount > 0) {
            // Calculate average color and color amount for this segment
            const avgR = Math.round(totalR / pixelCount);
            const avgG = Math.round(totalG / pixelCount);
            const avgB = Math.round(totalB / pixelCount);

            // Calculate the amount of color present (normalized to 0-1)
            const avgColorAmount = colorAmount / pixelCount / 255;

            colorData.push({
              color: `rgb(${avgR}, ${avgG}, ${avgB})`,
              intensity: avgColorAmount
            });
          } else {
            colorData.push({
              color: "rgb(0, 0, 0)",
              intensity: 0
            });
          }
        }

        // Find the maximum intensity to normalize bar heights
        const maxIntensity = Math.max(
          ...colorData.map((data) => data.intensity)
        );
        const normalizedMaxHeight = canvas.height; // 100% of canvas height

        // Apply smoothing to the intensities
        const currentIntensities = colorData.map((data) => data.intensity);
        if (previousIntensitiesRef.current.length === 0) {
          previousIntensitiesRef.current = currentIntensities;
        }

        const smoothedIntensities = currentIntensities.map(
          (intensity, index) => {
            const previousIntensity =
              previousIntensitiesRef.current[index] || 0;
            return (
              previousIntensity * smoothingFactor +
              intensity * (1 - smoothingFactor)
            );
          }
        );

        previousIntensitiesRef.current = smoothedIntensities;

        // Draw spectrum bars with dominant colors
        for (let i = 0; i < barCount; i++) {
          const normalizedIntensity =
            maxIntensity > 0 ? smoothedIntensities[i] / maxIntensity : 0;
          // Apply power function to amplify lower values
          const amplifiedIntensity = Math.pow(normalizedIntensity, 3);
          const barHeight = amplifiedIntensity * normalizedMaxHeight;
          const x = i * barWidth;
          const y = canvas.height - barHeight;
          const dominantColor = colorData[i].color;

          // Extract RGB values for transparency effects
          const rgbMatch = dominantColor.match(
            /rgb\((\d+),\s*(\d+),\s*(\d+)\)/
          );

          // Create gradient using RGBA for transparency
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, y);
          if (rgbMatch) {
            const [, r, g, b] = rgbMatch;
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.8)`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.6)`);
          } else {
            gradient.addColorStop(0, dominantColor);
            gradient.addColorStop(1, dominantColor);
          }

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 2, barHeight);

          // Add glow effect using the dominant color
          ctx.shadowColor = dominantColor;
          ctx.shadowBlur = 15;
          ctx.fillRect(x, y, barWidth - 2, barHeight);
          ctx.shadowBlur = 0;
        }
      }

      // Continue animation loop only if not paused
      if (!isPaused) {
        animationFrameRef.current = requestAnimationFrame(drawSpectrum);
      }
    };

    // Function to start animation
    const startAnimation = () => {
      if (!animationFrameRef.current && !isPaused) {
        drawSpectrum();
      }
    };

    // Event handler for when video can play
    const handleCanPlay = () => {
      if (!isPaused) {
        controlVideoPlayback();
      }
    };

    // Event handler for when video is loaded
    const handleLoadedData = () => {
      if (!isPaused) {
        controlVideoPlayback();
      }
    };

    // Add event listeners
    videoElement.addEventListener("canplay", handleCanPlay);
    videoElement.addEventListener("loadeddata", handleLoadedData);

    // Initial control
    controlVideoPlayback();

    // Cleanup function
    return () => {
      if (videoElement) {
        videoElement.removeEventListener("canplay", handleCanPlay);
        videoElement.removeEventListener("loadeddata", handleLoadedData);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [videoStream, isPaused, loading, error, barCount]);

  return (
    <Container>
      <HiddenVideo ref={videoRef} autoPlay playsInline muted />
      <Canvas ref={canvasRef} $show={!loading && !error} />
      {loading && (
        <SpinnerContainer>
          <Spinner />
        </SpinnerContainer>
      )}
    </Container>
  );
}

export default ColorSpectrum;
