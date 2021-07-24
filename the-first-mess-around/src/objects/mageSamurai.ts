import { SpriteConstructorParams } from "../interfaces/sprite.interface";
import { MainScene } from "../scenes/main-scene";
import {
  Direction,
  CHARACTER_SCALE,
  ORIGIN,
  LeftRightXYType,
} from "../utils/sprite-utils";

export enum MageSamuraiState {
  IDLE_RIGHT = "mage-samurai-idle-right",
  DYING_RIGHT = "mage-samurai-dying-right",
  DEAD_RIGHT = "mage-samurai-dead-right",
  DEAD_LEFT = "mage-samurai-dead-left",
  HAS_BEEN_HIT_RIGHT = "mage-samurai-has-been-hit-right",
  HAS_BEEN_HIT_LEFT = "mage-samurai-has-been-hit-left",
}

const OFFSET: LeftRightXYType = {
  RIGHT: [22, 10],
  LEFT: [98, 10],
};

const SIZE: [number, number] = [25, 22];

export class MageSamurai extends Phaser.GameObjects.Sprite {
  body: Phaser.Physics.Arcade.Body;

  private currentScene: MainScene;
  public currentState: MageSamuraiState;

  constructor({ scene, x, y, texture, frame }: SpriteConstructorParams) {
    super(scene, x, y, texture, frame);
    this.currentScene = scene as MainScene;
    this.currentScene.add.existing(this);
    this.initSprite();
  }

  initSprite() {
    this.currentScene.physics.world.enable(this);
    this.body.setSize(...SIZE);
    this.body.setOffset(...OFFSET.RIGHT);

    this.setOrigin(...ORIGIN.RIGHT);
    this.scale = CHARACTER_SCALE;
    this.currentState = MageSamuraiState.IDLE_RIGHT;
  }

  update() {
    this.runStateMachine();
    this.handleAnimations();
  }

  handleAnimations() {
    switch (this.currentState) {
      case MageSamuraiState.HAS_BEEN_HIT_RIGHT:
        this.anims.stop();
        break;
      case MageSamuraiState.IDLE_RIGHT:
        this.anims.play(this.currentState, true);
        break;
      case MageSamuraiState.DYING_RIGHT:
        this.anims.play(this.currentState, true).on("animationcomplete", () => {
          this.dead(Direction.RIGHT);
        });
        break;
    }
  }

  runStateMachine() {
    // Something that collects inputs maybe
    this.stateMachine();
  }

  stateMachine() {
    // switch (this.currentState) {
    // }
  }

  getHit(paramDirection?: Direction) {
    if (!this.isDeadAlready()) {
      this.tint = 0xff0000;
      const direction = this.getDirection(paramDirection);
      switch (direction) {
        case Direction.RIGHT:
          this.currentState = MageSamuraiState.HAS_BEEN_HIT_RIGHT;
          break;
        case Direction.LEFT:
          this.currentState = MageSamuraiState.HAS_BEEN_HIT_LEFT;
          break;
      }
    }
  }

  dead(paramDirection?: Direction) {
    if (this.currentState === MageSamuraiState.DYING_RIGHT) {
      const direction = this.getDirection(paramDirection);
      switch (direction) {
        case Direction.RIGHT:
          this.currentState = MageSamuraiState.DEAD_RIGHT;
          break;
        case Direction.LEFT:
          this.currentState = MageSamuraiState.DEAD_LEFT;
          break;
      }
    }
  }

  die(paramDirection?: Direction) {
    if (!this.isDeadAlready()) {
      this.clearTint();
      const direction = this.getDirection(paramDirection);
      switch (direction) {
        case Direction.RIGHT:
          this.currentState = MageSamuraiState.DYING_RIGHT;
        case Direction.LEFT:
          this.currentState = MageSamuraiState.DYING_RIGHT; // TODO - Will need to change to left
      }
    }
  }

  getDirection = (paramDirection?: Direction): Direction => {
    if (paramDirection) {
      return paramDirection;
    }
    const words = this.currentState.split("-");
    const stringDirection = words[words.length - 1];
    switch (stringDirection) {
      case "left":
        return Direction.LEFT;
      case "right":
        return Direction.RIGHT;
      default:
        return Direction.RIGHT;
    }
  };

  isDeadAlready(): boolean {
    if (
      this.currentState === MageSamuraiState.DEAD_RIGHT ||
      this.currentState === MageSamuraiState.DEAD_LEFT
    ) {
      return true;
    } else {
      return false;
    }
  }
}
