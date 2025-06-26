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

function Camera({ videoStream, error, loading, isPaused, onToggle }) {
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
    </Container>
  );
}

export default Camera;
