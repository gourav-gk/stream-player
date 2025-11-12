declare module "hls-stream-player" {
  import React from "react";

  interface PlayerProps {
    id: string;
    src: string;
    poster?: string;
    captions?: { src: string; lang: string; label: string }[];
    previewImg?: string;
    width?: string;
    maxHeight?: string;
    setting?: boolean;
    backgroundColor?: string;
  }

  export const Player: React.FC<PlayerProps>;
}
