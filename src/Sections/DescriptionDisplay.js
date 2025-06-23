import React from "react";
import styled from "styled-components";
import Spinner from "../components/Spinner";

const Container = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Description = styled.div`
  font-size: 1rem;
  text-align: justify;
  text-justify: distribute;
  line-height: 1;
  color: #fff;
  font-family: "Courier New", Courier, monospace;
  font-weight: 600;
  width: calc(100% - 2rem);
  text-transform: uppercase;
  word-spacing: 0.2em;
  letter-spacing: 0.1em;
`;

function EmojiDisplay({ description }) {
  return (
    <Container>
      {description ? <Description>{description}</Description> : <Spinner />}
    </Container>
  );
}

export default EmojiDisplay;
