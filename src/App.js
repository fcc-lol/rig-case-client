import React, { useEffect, useState, useRef, useCallback } from "react";
import styled from "styled-components";
import TopSection from "./Sections/TopSection";
import ColorSpectrum from "./Sections/ColorSpectrum";
import DescriptionDisplay from "./Sections/DescriptionDisplay";
import EmojiDisplay from "./Sections/EmojiDisplay";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const openaiApiKey =
  new URLSearchParams(window.location.search).get("openAiApiKey") || "";

const Response = z.object({
  emoji: z.string(),
  description: z.string()
});

const Page = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #000000;
`;

const Section = styled.div`
  position: absolute;
  border-radius: 32px;
  overflow: hidden;
`;

const TopSectionWrapper = styled(Section)`
  top: 8px;
  left: 12px;
  width: 392px;
  height: 318px;
`;

const MiddleSectionWrapper = styled(Section)`
  top: 406px;
  left: 12px;
  width: 392px;
  height: 188px;
`;

const BottomLeftSectionWrapper = styled(Section)`
  top: 672px;
  left: 12px;
  width: 150px;
  height: 164px;
`;

const BottomRightSectionWrapper = styled(Section)`
  top: 672px;
  left: 252px;
  width: 150px;
  height: 164px;
`;

function App() {
  const [videoStream, setVideoStream] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentEmoji, setCurrentEmoji] = useState(null);
  const [currentDescription, setCurrentDescription] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isPausedRef = useRef(false);

  const captureAndAnalyze = useCallback(async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      isProcessing ||
      isPausedRef.current
    ) {
      return;
    }

    try {
      setIsProcessing(true);

      // Capture frame from video
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = 256;
      canvas.height = 256;

      // Draw the current video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, 256, 256);

      // Convert to base64 with higher quality
      const imageData = canvas.toDataURL("image/jpeg", 0.9);

      // Send to OpenAI
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-nano",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: "Look at this image and respond with a single emoji that best represents what you see and a short description of what you see (in the style of a observing radio transmission, max 8 words, with no trailing period)"
                },
                {
                  type: "input_image",
                  image_url: imageData,
                  detail: "low"
                }
              ]
            }
          ],
          text: {
            format: zodTextFormat(Response, "response")
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      const parsedResponse = JSON.parse(data.output?.[0]?.content?.[0]?.text);
      const emoji = parsedResponse.emoji;
      const description = parsedResponse.description;

      // Only update emoji if we're not paused
      if (!isPausedRef.current) {
        if (emoji) {
          setCurrentEmoji(emoji);
          setCurrentDescription(description);
        }
      }
    } catch (err) {
      console.error("Error analyzing image:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleEmojiToggle = useCallback(() => {
    // Clear existing timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (isPaused) {
      // Resuming - start new timers and analysis, keep current emoji until new one loads
      timeoutRef.current = setTimeout(captureAndAnalyze, 500);
      intervalRef.current = setInterval(captureAndAnalyze, 5000);
    }
    setIsPaused(!isPaused);
    isPausedRef.current = !isPaused;
  }, [isPaused, captureAndAnalyze]);

  useEffect(() => {
    let stream = null;
    let mounted = true;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "environment"
          },
          audio: false
        });

        if (mounted) {
          setVideoStream(stream);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (mounted) {
          setError(`Camera error: ${err.message}`);
          setLoading(false);
        }
      }
    };

    startCamera();

    // Cleanup function to stop camera when component unmounts
    return () => {
      mounted = false;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Set up video analysis when videoStream is available
  useEffect(() => {
    if (!videoStream) return;

    // Set up video element
    const setupVideo = async () => {
      if (videoRef.current) {
        try {
          videoRef.current.srcObject = videoStream;
          await videoRef.current.play();
        } catch (err) {
          console.error("Error playing video:", err);
          setCurrentEmoji(null);
          setCurrentDescription(null);
        }
      }
    };

    const videoElement = videoRef.current;
    setupVideo();

    // Start periodic analysis every 5 seconds
    intervalRef.current = setInterval(captureAndAnalyze, 5000);

    // Initial analysis after a short delay
    timeoutRef.current = setTimeout(captureAndAnalyze, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [videoStream, captureAndAnalyze]);

  // Control hidden video play/pause based on isPaused state
  useEffect(() => {
    if (videoRef.current && videoStream) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [isPaused, videoStream]);

  return (
    <Page>
      <TopSectionWrapper>
        <TopSection
          videoStream={videoStream}
          error={error}
          loading={loading}
          isPaused={isPaused}
          onToggle={handleEmojiToggle}
        />
      </TopSectionWrapper>
      <MiddleSectionWrapper>
        <ColorSpectrum
          videoStream={videoStream}
          error={error}
          loading={loading}
          isPaused={isPaused}
        />
      </MiddleSectionWrapper>
      <BottomLeftSectionWrapper>
        <DescriptionDisplay description={currentDescription} />
      </BottomLeftSectionWrapper>
      <BottomRightSectionWrapper>
        <EmojiDisplay emoji={currentEmoji} />
      </BottomRightSectionWrapper>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          top: "-1000px",
          left: "-1000px",
          width: "224px",
          height: "224px"
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: "-1000px",
          left: "-1000px",
          width: "256px",
          height: "256px"
        }}
      />
    </Page>
  );
}

export default App;
