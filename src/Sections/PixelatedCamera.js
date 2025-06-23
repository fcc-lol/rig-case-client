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
  // max-height: 100%;
  display: ${(props) => (props.$show ? "block" : "none")};
`;

const HiddenVideo = styled.video`
  position: absolute;
  top: -9999px;
  left: -9999px;
  width: 1px;
  height: 1px;
`;

function PixelatedCamera({ videoStream, error, loading, pixelSize = 0.1 }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);
  const offscreenCanvasRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoStream && videoElement) {
      videoElement.srcObject = videoStream;

      const drawFrame = () => {
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

          // Set canvas dimensions to match video dimensions
          if (
            canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight
          ) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          // Create or update off-screen canvas
          if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement("canvas");
          }
          const offscreenCanvas = offscreenCanvasRef.current;
          const offscreenCtx = offscreenCanvas.getContext("2d");

          // Calculate pixelated dimensions
          const pixelatedWidth = Math.max(
            1,
            Math.floor(canvas.width * pixelSize)
          );
          const pixelatedHeight = Math.max(
            1,
            Math.floor(canvas.height * pixelSize)
          );

          // Set off-screen canvas to pixelated size
          offscreenCanvas.width = pixelatedWidth;
          offscreenCanvas.height = pixelatedHeight;

          // Draw video to small off-screen canvas
          offscreenCtx.drawImage(video, 0, 0, pixelatedWidth, pixelatedHeight);

          // Clear main canvas and set up for pixelated drawing
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.mozImageSmoothingEnabled = false;
          ctx.imageSmoothingEnabled = false;
          ctx.webkitImageSmoothingEnabled = false;
          ctx.msImageSmoothingEnabled = false;

          // Draw the small off-screen canvas scaled up to main canvas
          ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
        }

        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };

      const handleCanPlay = () => {
        drawFrame();
      };

      // Add event listeners
      videoElement.addEventListener("canplay", handleCanPlay);

      // Ensure video plays
      videoElement.play().catch(console.error);

      // Cleanup function
      return () => {
        if (videoElement) {
          videoElement.removeEventListener("canplay", handleCanPlay);
        }
      };
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoStream, pixelSize]);

  return (
    <Container>
      <HiddenVideo ref={videoRef} autoPlay playsInline muted />
      <Canvas ref={canvasRef} $show={!loading && !error} />
    </Container>
  );
}

export default PixelatedCamera;
