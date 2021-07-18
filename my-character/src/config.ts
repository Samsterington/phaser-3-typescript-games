import { MainScene } from "./scenes/main-scene";

export const GameConfig: Phaser.Types.Core.GameConfig = {
  title: "Webpack-Boilerplate",
  url: "https://github.com/digitsensitive/phaser3-typescript",
  version: "2.0",
  width: 200,
  height: 100,
  backgroundColor: 0x67f77b,
  type: Phaser.AUTO,
  zoom: 4,
  parent: "game",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 60 },
      debug: false,
    },
  },
  scene: [MainScene],
};
