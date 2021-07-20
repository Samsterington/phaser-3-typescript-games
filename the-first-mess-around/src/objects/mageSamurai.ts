import { SpriteConstructorParams } from "../interfaces/sprite.interface";
import { MainScene } from "../scenes/main-scene";
import { Direction, CHARACTER_SCALE, ORIGIN } from "../utils/sprite-utils";

export enum MageSamuraiState {
  IDLE_RIGHT = "mage-samurai-idle-right",
  DYING_RIGHT = "mage-samurai-dying-right",
  DEAD_RIGHT = "mage-samurai-dead-right",
  DEAD_LEFT = "mage-samurai-dead-left",
}

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
    this.setOrigin(...ORIGIN.RIGHT);
    this.scale = CHARACTER_SCALE;
    this.currentState = MageSamuraiState.IDLE_RIGHT;
    this.currentScene.physics.world.enable(this);
    this.body.setSize(250, 18);
  }

  update() {
    this.runStateMachine();
    this.handleAnimations();
  }

  handleAnimations() {
    switch (this.currentState) {
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

  dead(paramDirection?: Direction) {
    const direction = this.getDirection(paramDirection);
    switch (direction) {
      case Direction.RIGHT:
        this.currentState = MageSamuraiState.DEAD_RIGHT;
      case Direction.LEFT:
        this.currentState = MageSamuraiState.DEAD_LEFT;
    }
  }

  die(paramDirection?: Direction) {
    const direction = this.getDirection(paramDirection);
    switch (direction) {
      case Direction.RIGHT:
        this.currentState = MageSamuraiState.DYING_RIGHT;
      case Direction.LEFT:
        this.currentState = MageSamuraiState.DYING_RIGHT; // TODO - Will need to change to left
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
      default:
        return Direction.RIGHT;
    }
  };
}
