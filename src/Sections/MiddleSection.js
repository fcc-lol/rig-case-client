import React, { useRef, useEffect } from "react";
import styled from "styled-components";

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

function MiddleSection({ videoStream, error, loading, barCount = 16 }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);
  const offscreenCanvasRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoStream && videoElement) {
      videoElement.srcObject = videoStream;

      const drawSpectrum = () => {
        if (
          videoElement &&
          canvasRef.current &&
          videoElement.readyState >= 3 &&
          !videoElement.paused &&
          !videoElement.ended
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
          const maxBarHeight = canvas.height * 0.8;

          // Analyze pixelated video data and extract dominant colors
          const colorData = [];
          const segmentWidth = Math.floor(pixelatedWidth / barCount);

          for (let i = 0; i < barCount; i++) {
            let totalR = 0,
              totalG = 0,
              totalB = 0;
            let totalIntensity = 0;
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

                // Calculate luminance (brightness) for bar height
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                totalIntensity += luminance;
                pixelCount++;
              }
            }

            if (pixelCount > 0) {
              // Calculate average color and intensity for this segment
              const avgR = Math.round(totalR / pixelCount);
              const avgG = Math.round(totalG / pixelCount);
              const avgB = Math.round(totalB / pixelCount);

              // Calculate color saturation and dominance for intensity
              const maxChannel = Math.max(avgR, avgG, avgB);
              const minChannel = Math.min(avgR, avgG, avgB);
              const saturation =
                maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;

              // Boost intensity for saturated colors, especially red
              let colorIntensity = totalIntensity / pixelCount / 255; // Base luminance

              // Add saturation boost
              colorIntensity += saturation * 0.5;

              // Extra boost for red colors
              if (avgR > avgG && avgR > avgB) {
                const redDominance = (avgR - Math.max(avgG, avgB)) / 255;
                colorIntensity += redDominance * 0.8; // Strong boost for red
              }

              // Cap intensity at 1.0
              colorIntensity = Math.min(colorIntensity, 1.0);

              colorData.push({
                color: `rgb(${avgR}, ${avgG}, ${avgB})`,
                intensity: colorIntensity
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
          const normalizedMaxHeight = canvas.height * 0.9; // 90% of canvas height

          // Draw spectrum bars with dominant colors
          for (let i = 0; i < barCount; i++) {
            const normalizedIntensity =
              maxIntensity > 0 ? colorData[i].intensity / maxIntensity : 0;
            const barHeight = normalizedIntensity * normalizedMaxHeight;
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

        animationFrameRef.current = requestAnimationFrame(drawSpectrum);
      };

      const handleCanPlay = () => {
        console.log("Video can play, starting spectrum analyzer");
        drawSpectrum();
      };

      const handlePlaying = () => {
        console.log("Video is playing - spectrum analyzer active");
      };

      // Add event listeners
      videoElement.addEventListener("canplay", handleCanPlay);
      videoElement.addEventListener("playing", handlePlaying);

      // Ensure video plays
      videoElement.play().catch(console.error);

      // Cleanup function
      return () => {
        if (videoElement) {
          videoElement.removeEventListener("canplay", handleCanPlay);
          videoElement.removeEventListener("playing", handlePlaying);
        }
      };
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoStream, barCount]);

  return (
    <Container>
      <HiddenVideo ref={videoRef} autoPlay playsInline muted />
      <Canvas ref={canvasRef} $show={!loading && !error} />
    </Container>
  );
}

export default MiddleSection;
