import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
  border-radius: 32px;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ItemList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ItemCard = styled.div`
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ItemName = styled.span`
  color: white;
  font-family: Arial, sans-serif;
  font-size: 14px;
`;

const Confidence = styled.span`
  color: #4caf50;
  font-family: Arial, sans-serif;
  font-size: 12px;
  font-weight: bold;
`;

const StatusMessage = styled.div`
  color: #888;
  text-align: center;
  font-family: Arial, sans-serif;
  font-size: 14px;
  margin-top: 20px;
`;

const HiddenVideo = styled.video`
  position: absolute;
  top: -1000px;
  left: -1000px;
  width: 224px;
  height: 224px;
`;

function BottomRightSection({ videoStream, error: streamError, loading }) {
  const videoRef = useRef(null);
  const [detectedItems, setDetectedItems] = useState([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    let classifier = null;
    let isDetecting = false;
    const initializeDetection = async () => {
      try {
        console.log("Initializing object detection...");
        // Check if ml5 is loaded
        if (typeof window.ml5 === "undefined") {
          throw new Error("ml5.js library not loaded");
        }
        console.log("ml5.js library found");

        // Use the shared video stream instead of requesting our own
        if (!videoStream) {
          console.log("Waiting for video stream...");
          return;
        }

        console.log("Using shared video stream for detection");
        // Wait a bit for the video element to be ready
        setTimeout(async () => {
          console.log("Video element check:", !!videoRef.current);
          if (videoRef.current && videoStream) {
            console.log("Setting up detection video element...");
            videoRef.current.srcObject = videoStream;
            // Wait for video to be ready and playing
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error("Video setup timeout"));
              }, 10000);
              videoRef.current.onloadedmetadata = () => {
                console.log("Detection video metadata loaded");
                // Wait for the video to actually start playing
                videoRef.current.onplaying = () => {
                  console.log("Detection video is playing");
                  // Wait a bit more for frames to be available
                  setTimeout(() => {
                    clearTimeout(timeout);
                    resolve();
                  }, 1000);
                };
                // Start playing the video
                videoRef.current.play().catch((err) => {
                  console.error("Error playing video:", err);
                  reject(err);
                });
              };
            });
            // Load MobileNet model (without video element - we'll pass it later)
            console.log("Loading MobileNet model...");
            classifier = await window.ml5.imageClassifier("MobileNet");
            setIsModelLoaded(true);
            console.log("MobileNet model loaded successfully");
            // Start continuous detection
            startDetection();
          } else {
            console.log("Detection video element not ready");
            setError("Failed to initialize detection video");
          }
        }, 200);
      } catch (err) {
        console.error("Error initializing detection:", err);
        setError(err.message);
      }
    };
    const startDetection = () => {
      if (!classifier || !videoRef.current || isDetecting) return;
      isDetecting = true;
      console.log("Starting continuous video classification...");
      // Set up the callback for continuous classification
      classifier.classifyStart(videoRef.current, (results) => {
        console.log("Classification results:", results);
        if (results && results.length > 0) {
          // Filter results with confidence > 0.02 and take top 5
          const filteredResults = results
            .filter((result) => result.confidence > 0.02)
            .slice(0, 5)
            .map((result) => ({
              name: result.label,
              confidence: (result.confidence * 100).toFixed(1)
            }));
          console.log("Filtered results:", filteredResults);
          setDetectedItems(filteredResults);
        } else {
          console.log("No valid results found");
        }
      });
    };
    initializeDetection();
    // Cleanup
    return () => {
      isDetecting = false;
      if (classifier && classifier.classifyStop) {
        console.log("Stopping video classification...");
        classifier.classifyStop();
      }
      // No need to stop the stream as it's managed by the parent component
    };
  }, [videoStream]);
  return (
    <Container>
      <HiddenVideo ref={videoRef} autoPlay playsInline muted />
      {error || streamError ? (
        <StatusMessage>Error: {error || streamError}</StatusMessage>
      ) : loading ? (
        <StatusMessage>Loading camera...</StatusMessage>
      ) : !isModelLoaded ? (
        <StatusMessage>Loading AI model...</StatusMessage>
      ) : detectedItems.length === 0 ? (
        <StatusMessage>Looking for objects...</StatusMessage>
      ) : (
        <ItemList>
          {detectedItems.map((item, index) => (
            <ItemCard key={`${item.name}-${index}`}>
              <ItemName>{item.name}</ItemName>
              <Confidence>{item.confidence}%</Confidence>
            </ItemCard>
          ))}
        </ItemList>
      )}
    </Container>
  );
}

export default BottomRightSection;
