import { MainScene } from "./scenes/main-scene";
import { BootScene } from "./scenes/boot-scene";

export const GameConfig: Phaser.Types.Core.GameConfig = {
  title: "Webpack-Boilerplate",
  url: "https://github.com/digitsensitive/phaser3-typescript",
  version: "2.0",
  width: 800,
  height: 400,
  zoom: 1.5,
  backgroundColor: 0x888888,
  type: Phaser.AUTO,
  parent: "game",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 200 },
    },
  },
  scene: [BootScene, MainScene],
  render: { pixelArt: true, antialias: false },
};
