import React from "react";
import styled from "styled-components";

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
`;

const TopSection = styled(Section)`
  top: 8px;
  left: 12px;
  width: 392px;
  height: 318px;
  background-color: red;
`;

const MiddleSection = styled(Section)`
  top: 406px;
  left: 12px;
  width: 392px;
  height: 188px;
  background-color: blue;
`;

const BottomLeftSection = styled(Section)`
  top: 672px;
  left: 12px;
  width: 150px;
  height: 164px;
  background-color: green;
`;

const BottomRightSection = styled(Section)`
  top: 672px;
  left: 252px;
  width: 150px;
  height: 164px;
  background-color: yellow;
`;

function App() {
  return (
    <Page>
      <TopSection />
      <MiddleSection />
      <BottomLeftSection />
      <BottomRightSection />
    </Page>
  );
}

export default App;
