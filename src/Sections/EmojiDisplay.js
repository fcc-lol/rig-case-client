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

const Emoji = styled.div`
  font-size: 5rem;
  text-align: center;
  line-height: 1;
`;

function EmojiDisplay({ emoji }) {
  return <Container>{emoji ? <Emoji>{emoji}</Emoji> : <Spinner />}</Container>;
}

export default EmojiDisplay;
