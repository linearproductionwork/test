import React from "react";
import { Composition } from "remotion";
import { PillOrbit } from "./PillOrbit";

// 3-second seamless loop at 30 fps
const FPS = 30;
const DURATION_S = 3;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PillOrbit"
      component={PillOrbit}
      durationInFrames={FPS * DURATION_S}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
