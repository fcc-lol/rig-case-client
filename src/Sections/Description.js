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

const DescriptionDisplay = styled.div`
  font-size: 1rem;
  line-height: 1.125;
  color: #fff;
  font-family: "Courier New", Courier, monospace;
  font-weight: 600;
  width: calc(100% - 3rem);
  height: calc(100% - 3rem);
  text-transform: uppercase;
  word-spacing: 0.2em;
  letter-spacing: 0.1em;
  padding-top: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  hyphens: auto;
  -webkit-hyphens: auto;
  -ms-hyphens: auto;
`;

// Function to add soft hyphens to long words
const addSoftHyphens = (text) => {
  if (!text) return text;

  return text
    .split(" ")
    .map((word) => {
      if (word.length > 8) {
        // Add soft hyphens every 4-6 characters for long words
        const parts = [];
        for (let i = 0; i < word.length; i += 4) {
          parts.push(word.slice(i, i + 4));
        }
        return parts.join("\u00AD"); // Soft hyphen character
      }
      return word;
    })
    .join(" ");
};

function Description({ description }) {
  const hyphenatedDescription = addSoftHyphens(description);

  return (
    <Container>
      {description ? (
        <DescriptionDisplay>{hyphenatedDescription}</DescriptionDisplay>
      ) : (
        <Spinner />
      )}
    </Container>
  );
}

export default Description;
