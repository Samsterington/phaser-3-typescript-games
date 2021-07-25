import { DroidAssassinState } from "../objects/droidAssassin";
import { MageSamuraiState } from "../objects/mageSamurai";

export enum Direction {
  RIGHT = 1,
  LEFT = -1,
}

export interface LeftRightXYType {
  LEFT: [number, number];
  RIGHT: [number, number];
}

export const ORIGIN: LeftRightXYType = {
  LEFT: [0.76, 0.5],
  RIGHT: [0.24, 0.5],
};

export const CHARACTER_SCALE = 2.5;

type SpriteState = DroidAssassinState | MageSamuraiState;

export interface SpriteSnapshot {
  spritePosition: {
    x: number;
    y: number;
  };
  frameName: string;
  state: SpriteState;
  cameraPosition: {
    x: number;
    y: number;
  };
}
