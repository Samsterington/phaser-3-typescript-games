import { SpriteConstructorParams } from "../interfaces/sprite.interface";
import { MainScene } from "../scenes/main-scene";
import {
  Direction,
  CHARACTER_SCALE,
  LeftRightXYType,
  SpriteSnapshot,
} from "../utils/sprite-utils";
import { DroidAssassinState } from "./droidAssassin";

export enum MageSamuraiState {
  IDLE_RIGHT = "mage-samurai-idle-right",
  IDLE_LEFT = "mage-samurai-idle-left",
  WALK_RIGHT = "mage-samurai-walk-right",
  WALK_LEFT = "mage-samurai-walk-left",
  JUMP_ATTACK_RIGHT = "mage-samurai-jump-attack-right",
  JUMP_ATTACK_LEFT = "mage-samurai-jump-attack-left",
  DYING_RIGHT = "mage-samurai-dying-right",
  DYING_LEFT = "mage-samurai-dying-left",
  DEAD_RIGHT = "mage-samurai-dead-right",
  DEAD_LEFT = "mage-samurai-dead-left",
  HAS_BEEN_HIT_RIGHT = "mage-samurai-has-been-hit-right",
  HAS_BEEN_HIT_LEFT = "mage-samurai-has-been-hit-left",
}

interface Inputs {
  DISTANCE_TO_DA: number;
}

const ORIGIN: LeftRightXYType = {
  LEFT: [0.72, 0.5],
  RIGHT: [0.28, 0.5],
};

const CONTROLS = {
  SEEING_DISTANCE: 350,
  ATTACK_DISTANCE: 180,
  WALK_SPEED: 29,
  WALK_ACCELERATION: 200,
  JUMP_ATTACK_WIDTH: 90,
  JUMP_ATTACK_TIMEOUT: 5000,
};

const OFFSET: LeftRightXYType = {
  RIGHT: [23, 10],
  LEFT: [80, 10],
};

const SIZE: [number, number] = [25, 22];

export class MageSamurai extends Phaser.GameObjects.Sprite {
  body: Phaser.Physics.Arcade.Body;

  private currentScene: MainScene;
  public currentState: MageSamuraiState;

  private history: SpriteSnapshot[] = [];

  private isAttackReady = {
    jumpAttack: true,
  };

  public isInvulnerable = false;

  constructor({ scene, x, y, texture, frame }: SpriteConstructorParams) {
    super(scene, x, y, texture, frame);
    this.currentScene = scene as MainScene;
    this.currentScene.add.existing(this);
    this.initSprite();
  }

  initSprite() {
    this.currentScene.physics.world.enable(this);
    this.body.setMaxSpeed(CONTROLS.WALK_SPEED);
    this.body.setSize(...SIZE);
    this.body.setOffset(...OFFSET.RIGHT);

    this.setOrigin(...ORIGIN.RIGHT);
    this.scale = CHARACTER_SCALE;
    this.currentState = MageSamuraiState.IDLE_RIGHT;
  }

  update() {
    this.runStateMachine();
    this.handleAnimations();
    this.captureHistory();
  }

  captureHistory() {
    // this.history.unshift({
    //   position: {
    //     x: this.x,
    //     y: this.y,
    //   },
    //   frameName: this.anims.currentFrame.frame.name,
    //   state: this.currentState,
    // });
  }

  handleAnimations() {
    switch (this.currentState) {
      case MageSamuraiState.HAS_BEEN_HIT_RIGHT:
      case MageSamuraiState.HAS_BEEN_HIT_LEFT:
        this.anims.stop();
        break;
      case MageSamuraiState.IDLE_RIGHT:
      case MageSamuraiState.IDLE_LEFT:
      case MageSamuraiState.WALK_RIGHT:
      case MageSamuraiState.WALK_LEFT:
        this.anims.play(this.currentState, true);
        break;
      case MageSamuraiState.DYING_LEFT:
      case MageSamuraiState.DYING_RIGHT:
        this.anims.play(this.currentState, true).on("animationcomplete", () => {
          this.dead();
        });
        break;
      case MageSamuraiState.JUMP_ATTACK_LEFT:
      case MageSamuraiState.JUMP_ATTACK_RIGHT:
        this.anims.play(this.currentState, true).on("animationcomplete", () => {
          this.jumpAttackReset();
        });
        break;
    }
  }

  runStateMachine() {
    // Something that collects inputs maybe
    const inputs = this.calculateInputs();
    this.stateMachine(inputs);
  }

  calculateInputs(): Inputs {
    const distanceToDA = this.currentScene.droidAssassin.x - this.x;
    return {
      DISTANCE_TO_DA: distanceToDA,
    };
  }

  stateMachine({ DISTANCE_TO_DA }: Inputs) {
    switch (this.currentState) {
      case MageSamuraiState.IDLE_LEFT:
      case MageSamuraiState.IDLE_RIGHT:
        if (
          Math.abs(DISTANCE_TO_DA) < CONTROLS.ATTACK_DISTANCE &&
          this.isAttackReady.jumpAttack
        ) {
          this.jumpAttack();
        } else if (
          Math.abs(DISTANCE_TO_DA) < CONTROLS.SEEING_DISTANCE &&
          Math.abs(DISTANCE_TO_DA) > CONTROLS.ATTACK_DISTANCE
        ) {
          if (DISTANCE_TO_DA < 0) {
            this.walk(Direction.LEFT);
          }
          if (DISTANCE_TO_DA > 0) {
            this.walk(Direction.RIGHT);
          }
        } else {
          this.idle();
        }
        break;
      case MageSamuraiState.WALK_RIGHT:
      case MageSamuraiState.WALK_LEFT:
        const absoluteDistanceT0DA = Math.abs(DISTANCE_TO_DA);
        if (absoluteDistanceT0DA < CONTROLS.ATTACK_DISTANCE) {
          this.idle();
        } else {
          this.walk();
        }
        break;
    }
  }

  jumpAttack(paramDirection?: Direction) {
    const direction = this.getDirection(paramDirection);
    this.stopMotion(); // Might need to be replaced with friction down the line if wanting more realism
    this.correctOriginAndOffset(direction);
    this.body.setSize(CONTROLS.JUMP_ATTACK_WIDTH, SIZE[1], false);
    this.isAttackReady.jumpAttack = false;
    this.isInvulnerable = true;

    switch (direction) {
      case Direction.RIGHT:
        this.currentState = MageSamuraiState.JUMP_ATTACK_RIGHT;
        this.body.setOffset(...OFFSET.RIGHT);
        break;
      case Direction.LEFT:
        this.currentState = MageSamuraiState.JUMP_ATTACK_LEFT;
        this.body.setOffset(SIZE[0] / 2, OFFSET.LEFT[1]); // SEEMS FUDGY?
        break;
    }
  }

  jumpAttackReset(paramDirection?: Direction) {
    const direction = this.getDirection(paramDirection);
    this.correctOriginAndOffset(direction);
    this.body.setSize(...SIZE);
    this.isInvulnerable = false;
    setTimeout(() => {
      this.isAttackReady.jumpAttack = true;
    }, CONTROLS.JUMP_ATTACK_TIMEOUT);

    switch (direction) {
      case Direction.RIGHT:
        this.currentState = MageSamuraiState.IDLE_RIGHT;
        this.body.setOffset(...OFFSET.RIGHT);
        break;
      case Direction.LEFT:
        this.currentState = MageSamuraiState.IDLE_LEFT;
        this.body.setOffset(...OFFSET.LEFT);
        break;
    }
  }

  idle(paramDirection?: Direction) {
    const direction = this.getDirection(paramDirection);
    this.stopMotion(); // Might need to be replaced with friction down the line if wanting more realism
    this.correctOriginAndOffset(direction);
    switch (direction) {
      case Direction.RIGHT:
        this.currentState = MageSamuraiState.IDLE_RIGHT;
        break;
      case Direction.LEFT:
        this.currentState = MageSamuraiState.IDLE_LEFT;
        break;
    }
  }

  walk(paramDirection?: Direction) {
    const direction = this.getDirection(paramDirection);
    this.correctOriginAndOffset(direction);
    switch (direction) {
      case Direction.RIGHT:
        this.currentState = MageSamuraiState.WALK_RIGHT;
        break;
      case Direction.LEFT:
        this.currentState = MageSamuraiState.WALK_LEFT;
        break;
    }
    this.body.setAccelerationX(CONTROLS.WALK_ACCELERATION * direction);
  }

  getHit(impactXPixels?: number, paramDirection?: Direction) {
    if (
      !this.isDeadAlready() &&
      this.currentState !== MageSamuraiState.HAS_BEEN_HIT_RIGHT &&
      this.currentState !== MageSamuraiState.HAS_BEEN_HIT_LEFT
    ) {
      this.x += impactXPixels ? impactXPixels : 0;
      this.tint = 0xff0000;
      this.stopMotion();
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
    if (!this.isDeadAlready()) {
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
      this.stopMotion();
      this.clearTint();
      const direction = this.getDirection(paramDirection);
      this.correctOriginAndOffset(direction);
      switch (direction) {
        case Direction.RIGHT:
          this.currentState = MageSamuraiState.DYING_RIGHT;
          break;
        case Direction.LEFT:
          this.currentState = MageSamuraiState.DYING_LEFT;
          break;
      }
    }
  }

  // -- UTILS --

  correctOriginAndOffset(direction: Direction) {
    switch (direction) {
      case Direction.RIGHT:
        this.setOrigin(...ORIGIN.RIGHT);
        this.body.setOffset(...OFFSET.RIGHT);
        break;
      case Direction.LEFT:
        this.setOrigin(...ORIGIN.LEFT);
        this.body.setOffset(...OFFSET.LEFT);
        break;
    }
  }

  getDirection = (paramDirection?: Direction): Direction => {
    if (paramDirection !== undefined) {
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

  stopMotion() {
    this.body.setAccelerationX(0);
    this.body.setVelocityX(0);
  }

  isAttackingAnimationFrame(): boolean {
    const frameNumber = parseInt(this.anims.currentFrame.frame.name, 10);
    switch (this.currentState) {
      case MageSamuraiState.JUMP_ATTACK_LEFT:
      case MageSamuraiState.JUMP_ATTACK_RIGHT:
        if (frameNumber >= 5 && frameNumber <= 8) {
          return true;
        }
        break;
    }
    return false;
  }
}
