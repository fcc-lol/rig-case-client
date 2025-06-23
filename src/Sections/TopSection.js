import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import Spinner from "../components/Spinner";

const Container = styled.div`
  width: 100%;
  height: 100%;
  background-color: #000;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: ${(props) => (props.$show ? "block" : "none")};
`;

const ErrorMessage = styled.div`
  color: white;
  text-align: center;
  padding: 20px;
  font-family: Arial, sans-serif;
`;

const PlayButton = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;

  &:before {
    content: "";
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 16px 0 16px 28px;
    border-color: transparent transparent transparent #ffffff;
    margin-left: 6px;
  }

  &.paused:before {
    content: "";
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 16px 0 16px 28px;
    border-color: transparent transparent transparent #ffffff;
    margin-left: 6px;
  }
`;

function TopSection({ videoStream, error, loading, isPaused, onToggle }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoStream && videoRef.current) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Control video play/pause based on isPaused prop
  useEffect(() => {
    if (videoRef.current && !loading && !error) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [isPaused, loading, error]);

  const handleClick = (e) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <Container onClick={handleClick}>
      <Video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        $show={!loading && !error}
      />
      {loading && <Spinner />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!loading && !error && isPaused && (
        <PlayButton
          className={isPaused ? "paused" : ""}
          onClick={handleClick}
        />
      )}
    </Container>
  );
}

export default TopSection;
