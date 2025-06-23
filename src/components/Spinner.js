import React from "react";
import styled from "styled-components";

const SpinnerContainer = styled.div`
  border: 5px solid rgba(255, 255, 255, 0.2);
  border-top: 5px solid #fff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Spinner = () => {
  return <SpinnerContainer />;
};

export default Spinner;
