import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TopSection from "./Sections/TopSection";
import MiddleSection from "./Sections/BottomRightSection";
import BottomLeftSection from "./Sections/BottomLeftSection";
import BottomRightSection from "./Sections/MiddleSection";

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

  useEffect(() => {
    let stream = null;
    let mounted = true;

    const startCamera = async () => {
      try {
        console.log("Requesting camera access...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "environment"
          },
          audio: false
        });

        console.log("Camera stream obtained:", stream);

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
        console.log("Cleaning up camera stream");
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <Page>
      <TopSectionWrapper>
        <TopSection videoStream={videoStream} error={error} loading={loading} />
      </TopSectionWrapper>
      <MiddleSectionWrapper>
        <MiddleSection
          videoStream={videoStream}
          error={error}
          loading={loading}
        />
      </MiddleSectionWrapper>
      <BottomLeftSectionWrapper>
        <BottomLeftSection
          videoStream={videoStream}
          error={error}
          loading={loading}
        />
      </BottomLeftSectionWrapper>
      <BottomRightSectionWrapper>
        <BottomRightSection
          videoStream={videoStream}
          error={error}
          loading={loading}
        />
      </BottomRightSectionWrapper>
    </Page>
  );
}

export default App;
