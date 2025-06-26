import React, { useEffect, useState, useRef, useCallback } from "react";
import styled from "styled-components";
import Camera from "./Sections/Camera";
import ColorSpectrum from "./Sections/ColorSpectrum";
import Description from "./Sections/Description";
import Emoji from "./Sections/Emoji";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const getApiKey = () => {
  const urlApiKey = new URLSearchParams(window.location.search).get(
    "openAiApiKey"
  );
  if (urlApiKey) {
    localStorage.setItem("openaiApiKey", urlApiKey);
    return urlApiKey;
  }
  return localStorage.getItem("openaiApiKey") || "";
};

const isAlignmentMode = () => {
  return (
    new URLSearchParams(window.location.search).get("alignmentMode") === "true"
  );
};

let openaiApiKey = getApiKey();

const Response = z.object({
  emoji: z.string(),
  description: z.string()
});

const Page = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${(props) =>
    props.$alignmentMode ? "#ffffff" : "#000000"};
`;

const Section = styled.div`
  position: absolute;
  border-radius: 32px;
  overflow: hidden;
`;

const TopSection = styled(Section)`
  top: 8px;
  left: 12px;
  width: 392px;
  height: 318px;
  background-color: ${(props) =>
    props.$alignmentMode ? "#ff6b6b" : "transparent"};
`;

const MiddleSection = styled(Section)`
  top: 406px;
  left: 12px;
  width: 392px;
  height: 188px;
  background-color: ${(props) =>
    props.$alignmentMode ? "#4ecdc4" : "transparent"};
`;

const BottomLeftSection = styled(Section)`
  top: 672px;
  left: 12px;
  width: 150px;
  height: 164px;
  background-color: ${(props) =>
    props.$alignmentMode ? "#45b7d1" : "transparent"};
`;

const BottomRightSection = styled(Section)`
  top: 672px;
  left: 252px;
  width: 150px;
  height: 164px;
  background-color: ${(props) =>
    props.$alignmentMode ? "#96ceb4" : "transparent"};
`;

function App() {
  const [videoStream, setVideoStream] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentEmoji, setCurrentEmoji] = useState(null);
  const [currentDescription, setCurrentDescription] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [alignmentMode] = useState(isAlignmentMode());
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    if (!openaiApiKey) {
      const apiKey = prompt("Please enter your OpenAI API key:");
      if (apiKey) {
        openaiApiKey = apiKey.trim();
        localStorage.setItem("openaiApiKey", openaiApiKey);
      }
    }
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      isProcessing ||
      isPausedRef.current ||
      !openaiApiKey
    ) {
      return;
    }

    try {
      setIsProcessing(true);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = 256;
      canvas.height = 256;

      ctx.drawImage(videoRef.current, 0, 0, 256, 256);

      const imageData = canvas.toDataURL("image/jpeg", 0.9);

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
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (isPaused) {
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

    return () => {
      mounted = false;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!videoStream) return;

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

    intervalRef.current = setInterval(captureAndAnalyze, 5000);
    timeoutRef.current = setTimeout(captureAndAnalyze, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [videoStream, captureAndAnalyze]);

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
    <Page $alignmentMode={alignmentMode}>
      <TopSection $alignmentMode={alignmentMode}>
        {!alignmentMode && (
          <Camera
            videoStream={videoStream}
            error={error}
            loading={loading}
            isPaused={isPaused}
            onToggle={handleEmojiToggle}
          />
        )}
      </TopSection>
      <MiddleSection $alignmentMode={alignmentMode}>
        {!alignmentMode && (
          <ColorSpectrum
            videoStream={videoStream}
            error={error}
            loading={loading}
            isPaused={isPaused}
          />
        )}
      </MiddleSection>
      <BottomLeftSection $alignmentMode={alignmentMode}>
        {!alignmentMode && <Description description={currentDescription} />}
      </BottomLeftSection>
      <BottomRightSection $alignmentMode={alignmentMode}>
        {!alignmentMode && <Emoji emoji={currentEmoji} />}
      </BottomRightSection>
      {!alignmentMode && (
        <>
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
        </>
      )}
    </Page>
  );
}

export default App;
