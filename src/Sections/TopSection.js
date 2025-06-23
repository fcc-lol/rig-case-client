import React, { useRef, useEffect } from "react";
import styled from "styled-components";

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

const LoadingMessage = styled.div`
  color: white;
  text-align: center;
  font-family: Arial, sans-serif;
`;

function TopSection({ videoStream, error, loading }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoStream && videoRef.current) {
      console.log("Setting video source in TopSection...");
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  return (
    <Container>
      <Video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        $show={!loading && !error}
      />
      {loading && <LoadingMessage>Loading camera...</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </Container>
  );
}

export default TopSection;
