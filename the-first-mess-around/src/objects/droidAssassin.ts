import { SpriteConstructorParams } from "../interfaces/sprite.interface";
import { panCameraDuringDashFromIdle } from "../utils/camera-utils";
import { MainScene } from "../scenes/main-scene";
import {
  ORIGIN,
  CHARACTER_SCALE,
  LeftRightXYType,
} from "../utils/sprite-utils";
import { MageSamuraiState } from "./mageSamurai";

// The associated strings match the animation
export enum DroidAssassinState {
  IDLE_RIGHT = "droid-assassin-idle-right",
  IDLE_LEFT = "droid-assassin-idle-left",
  RUN_RIGHT = "droid-assassin-run-right",
  RUN_LEFT = "droid-assassin-run-left",
  DASH_ATTACK_FROM_IDLE_RIGHT = "droid-assassin-dash-attack-from-idle-right",
  DASH_ATTACK_FROM_IDLE_LEFT = "droid-assassin-dash-attack-from-idle-left",
  DASH_ATTACK_FROM_RUN_RIGHT = "droid-assassin-dash-attack-from-run-right",
  DASH_ATTACK_FROM_RUN_LEFT = "droid-assassin-dash-attack-from-run-left",
  ATTACK_RIGHT = "droid-assassin-attack-right",
  ATTACK_LEFT = "droid-assassin-attack-left",
  BAD_ASS_CUT_SCENE_LEFT = "bad-ass-cut-scene-left",
  BAD_ASS_CUT_SCENE_RIGHT = "bad-ass-cut-scene-right",
}

enum ActiveInput {
  RIGHT = "RIGHT",
  LEFT = "LEFT",
  SPACE = "SPACE",
  DOWN = "DOWN",
}

const CONTROLS = {
  RUN_DECELERATION: 1200,
  RUN_ACCELERATION: 1200,
  ATTACK_SLIDE_DECELERATION: 300,
  FULL_STOP_VELOCITY: 5, // Velocity at which you are made to stop i.r have 0 velocity
  RUN_SPEED: 210,
};

const ATTACK_WIDTH = 100;

const OFFSET: LeftRightXYType = {
  RIGHT: [22, 10],
  LEFT: [98, 10],
};

const SIZE: [number, number] = [25, 22];
const CHARACTER_VERTICAL_OFFSET = 130;

const DASH_DISTANCE = 66 * CHARACTER_SCALE;

interface DroidAssassinConstructorProps extends SpriteConstructorParams {
  startWithCutScene: boolean;
}

export class DroidAssassin extends Phaser.GameObjects.Sprite {
  body: Phaser.Physics.Arcade.Body;

  private currentScene: MainScene;
  public currentState: DroidAssassinState;
  private keys: Map<ActiveInput, Phaser.Input.Keyboard.Key>;

  // Start Transition
  private startingAnimationConstants: {
    INITIAL_X: number;
    SECONDARY_X: number;
  };

  constructor({
    scene,
    x,
    y,
    texture,
    frame,
    startWithCutScene,
  }: DroidAssassinConstructorProps) {
    super(scene, x, y, texture, frame);
    this.startingAnimationConstants = {
      INITIAL_X: x,
      SECONDARY_X: 0,
    };
    this.currentScene = scene as MainScene;
    this.currentScene.add.existing(this);

    this.initSprite(startWithCutScene);
  }

  initSprite(startWithCutScene: boolean) {
    this.setOrigin(...ORIGIN.RIGHT);
    this.scale = CHARACTER_SCALE;

    if (startWithCutScene) {
      this.currentState = DroidAssassinState.BAD_ASS_CUT_SCENE_RIGHT;
    } else {
      this.currentState = DroidAssassinState.IDLE_RIGHT;
    }

    this.currentScene.cameras.main.startFollow(
      this,
      false,
      1,
      1,
      0,
      CHARACTER_VERTICAL_OFFSET
    );

    this.currentScene.physics.world.enable(this);
    this.body.setOffset(...OFFSET.RIGHT);
    this.body.setSize(...SIZE); // Doesn't seem to fo anything
    this.body.debugShowBody = true;
    // this.body.debugBodyColor = 0xff00ff;

    this.keys = new Map([
      [ActiveInput.LEFT, this.addKey("LEFT")],
      [ActiveInput.RIGHT, this.addKey("RIGHT")],
      [ActiveInput.DOWN, this.addKey("DOWN")],
      [ActiveInput.SPACE, this.addKey("SPACE")],
    ]);

    this.body.setMaxVelocityX(CONTROLS.RUN_SPEED);
  }

  private addKey(key: string): Phaser.Input.Keyboard.Key {
    return this.currentScene.input.keyboard.addKey(key);
  }

  update() {
    this.runStateMachine();
    this.handleAnimations();
  }

  handleAnimations() {
    switch (this.currentState) {
      case DroidAssassinState.BAD_ASS_CUT_SCENE_RIGHT:
        this.anims.play(DroidAssassinState.IDLE_RIGHT, true);
        break;
      case DroidAssassinState.BAD_ASS_CUT_SCENE_LEFT:
        this.anims.play(DroidAssassinState.IDLE_RIGHT, true);
        break;
      case DroidAssassinState.IDLE_RIGHT:
        this.anims.play(this.currentState, true);
        break;
      case DroidAssassinState.IDLE_LEFT:
        this.anims.play(this.currentState, true);
        break;
      case DroidAssassinState.RUN_RIGHT:
        this.anims.play(this.currentState, true);
        break;
      case DroidAssassinState.RUN_LEFT:
        this.anims.play(this.currentState, true);
        break;
      case DroidAssassinState.DASH_ATTACK_FROM_IDLE_RIGHT:
        this.anims
          .play(this.currentState, true)
          .on("animationcomplete", () => this.dashAttackFromIdleRightReset());
        break;
      case DroidAssassinState.DASH_ATTACK_FROM_IDLE_LEFT:
        this.anims
          .play(this.currentState, true)
          .on("animationcomplete", () => this.dashAttackFromIdleLeftReset());
        break;
      case DroidAssassinState.DASH_ATTACK_FROM_RUN_RIGHT:
        this.anims
          .play(this.currentState, true)
          .on("animationcomplete", () => this.dashAttackFromRunRightReset());
        break;
      case DroidAssassinState.DASH_ATTACK_FROM_RUN_LEFT:
        this.anims
          .play(this.currentState, true)
          .on("animationcomplete", () => this.dashAttackFromRunLeftReset());
        break;
      case DroidAssassinState.ATTACK_RIGHT:
        this.anims
          .play(this.currentState, true)
          .on("animationcomplete", () => this.attackRightReset());
        break;
      case DroidAssassinState.ATTACK_LEFT:
        this.anims
          .play(this.currentState, true)
          .on("animationcomplete", () => this.attackLeftReset());
        break;
    }
  }

  runStateMachine() {
    const activeInputs = calculateActiveInputs(this.keys);
    this.droidAssassinStateMachine(activeInputs);
  }

  droidAssassinStateMachine(activeInputs: ActiveInput[]) {
    switch (this.currentState) {
      case DroidAssassinState.IDLE_RIGHT:
        if (activeInputs.length === 0) {
          this.idleRight();
        }
        if (activeInputs.length === 1) {
          if (activeInputs.includes(ActiveInput.LEFT)) {
            this.runLeft();
          }
          if (activeInputs.includes(ActiveInput.RIGHT)) {
            this.runRight();
          }
          if (activeInputs.includes(ActiveInput.SPACE)) {
            this.dashAttackFromIdleRight();
          }
          if (activeInputs.includes(ActiveInput.DOWN)) {
            this.attackRight();
          }
        }
        break;
      case DroidAssassinState.IDLE_LEFT:
        if (activeInputs.length === 0) {
          this.idleLeft();
        }
        if (activeInputs.length === 1) {
          if (activeInputs.includes(ActiveInput.LEFT)) {
            this.runLeft();
          }
          if (activeInputs.includes(ActiveInput.RIGHT)) {
            this.runRight();
          }
          if (activeInputs.includes(ActiveInput.SPACE)) {
            this.dashAttackFromIdleLeft();
          }
          if (activeInputs.includes(ActiveInput.DOWN)) {
            this.attackLeft();
          }
        }
        break;
      case DroidAssassinState.RUN_RIGHT:
        if (activeInputs.length === 0) {
          this.idleRight();
        }
        if (activeInputs.length === 1) {
          if (activeInputs.includes(ActiveInput.LEFT)) {
            this.runLeft();
          }
        }
        if (activeInputs.length === 2) {
          if (
            activeInputs.includes(ActiveInput.RIGHT) &&
            activeInputs.includes(ActiveInput.DOWN)
          ) {
            this.attackRight();
          }
          if (
            activeInputs.includes(ActiveInput.RIGHT) &&
            activeInputs.includes(ActiveInput.SPACE)
          ) {
            this.dashAttackFromRunRight();
          }
        }
        break;
      case DroidAssassinState.RUN_LEFT:
        if (activeInputs.length === 0) {
          this.idleLeft();
        }
        if (activeInputs.length === 1) {
          if (activeInputs.includes(ActiveInput.RIGHT)) {
            this.runRight();
          }
        }
        if (activeInputs.length === 2) {
          if (
            activeInputs.includes(ActiveInput.LEFT) &&
            activeInputs.includes(ActiveInput.DOWN)
          ) {
            this.attackLeft();
          }
          if (
            activeInputs.includes(ActiveInput.LEFT) &&
            activeInputs.includes(ActiveInput.SPACE)
          ) {
            this.dashAttackFromRunLeft();
          }
        }
        break;
      case DroidAssassinState.BAD_ASS_CUT_SCENE_RIGHT:
        this.badAssCutSceneRight();
        break;
      case DroidAssassinState.BAD_ASS_CUT_SCENE_LEFT:
        this.badAssCutSceneLeft();
        break;
      case DroidAssassinState.ATTACK_RIGHT:
        this.attackRight();
        break;
      case DroidAssassinState.ATTACK_LEFT:
        this.attackLeft();
        break;
      case DroidAssassinState.DASH_ATTACK_FROM_RUN_RIGHT:
        this.maintainMaximumVelocityRight();
        break;
      case DroidAssassinState.DASH_ATTACK_FROM_RUN_LEFT:
        this.maintainMaximumVelocityLeft();
        break;
    }
  }

  // TRANSITIONS //

  badAssCutSceneRight() {
    //Hacky check if this is the first run
    if (this.body.velocity.x === 0) {
      this.currentScene.changeImageScrollFactor();
    }
    this.body.setVelocityX(
      500 - (this.x - this.startingAnimationConstants.INITIAL_X)
    );
    if (this.body.velocity.x < 70) {
      this.currentState = DroidAssassinState.BAD_ASS_CUT_SCENE_LEFT;
    }
  }

  badAssCutSceneLeft() {
    this.body.setVelocityX(-100);
    if (this.x <= this.startingAnimationConstants.INITIAL_X) {
      this.x = this.startingAnimationConstants.INITIAL_X;
      this.currentScene.changeImageScrollFactor();
      this.idleRight();
    }
  }

  maintainMaximumVelocityRight() {
    this.body.setVelocityX(CONTROLS.RUN_SPEED);
  }

  maintainMaximumVelocityLeft() {
    this.body.setVelocityX(-CONTROLS.RUN_SPEED);
  }

  dashAttackFromRunRight() {
    this.currentState = DroidAssassinState.DASH_ATTACK_FROM_RUN_RIGHT;
    this.maintainMaximumVelocityRight();
    const numberOfAnimationFrames = this.currentScene.anims.get(
      DroidAssassinState.DASH_ATTACK_FROM_RUN_RIGHT
    ).frames.length;
    const frameRateOfAnimation = this.currentScene.anims.get(
      DroidAssassinState.DASH_ATTACK_FROM_RUN_LEFT
    ).frameRate;
    const timeLengthOfAnimation =
      numberOfAnimationFrames * (1 / frameRateOfAnimation);
    const totalDistanceCovered =
      DASH_DISTANCE + CONTROLS.RUN_SPEED * timeLengthOfAnimation;
    panCameraDuringDashFromIdle(
      this.x + totalDistanceCovered,
      this.y - CHARACTER_VERTICAL_OFFSET,
      this.currentScene.cameras.main,
      numberOfAnimationFrames
    );
  }

  dashAttackFromRunLeft() {
    this.currentState = DroidAssassinState.DASH_ATTACK_FROM_RUN_LEFT;
    this.maintainMaximumVelocityLeft();
    const numberOfAnimationFrames = this.currentScene.anims.get(
      DroidAssassinState.DASH_ATTACK_FROM_RUN_LEFT
    ).frames.length;
    const frameRateOfAnimation = this.currentScene.anims.get(
      DroidAssassinState.DASH_ATTACK_FROM_RUN_LEFT
    ).frameRate;
    const timeLengthOfAnimation =
      numberOfAnimationFrames * (1 / frameRateOfAnimation);
    const totalDistanceCovered =
      DASH_DISTANCE + CONTROLS.RUN_SPEED * timeLengthOfAnimation;
    panCameraDuringDashFromIdle(
      this.x - totalDistanceCovered,
      this.y - CHARACTER_VERTICAL_OFFSET,
      this.currentScene.cameras.main,
      numberOfAnimationFrames
    );
  }

  attackLeft() {
    this.applyFrictionFromLeft(CONTROLS.ATTACK_SLIDE_DECELERATION);
    this.setOrigin(...ORIGIN.LEFT);
    this.body.setOffset(...OFFSET.LEFT);
    this.currentState = DroidAssassinState.ATTACK_LEFT;
  }

  attackRight() {
    this.applyFrictionFromRight(CONTROLS.ATTACK_SLIDE_DECELERATION);
    this.setOrigin(...ORIGIN.RIGHT);
    this.body.setOffset(...OFFSET.RIGHT);
    this.currentState = DroidAssassinState.ATTACK_RIGHT;
  }

  runLeft() {
    this.setOrigin(...ORIGIN.LEFT);
    this.body.setOffset(...OFFSET.LEFT);
    this.currentState = DroidAssassinState.RUN_LEFT;
    this.body.setAccelerationX(-CONTROLS.RUN_ACCELERATION);
  }

  runRight() {
    this.setOrigin(...ORIGIN.RIGHT);
    this.body.setOffset(...OFFSET.RIGHT);
    this.currentState = DroidAssassinState.RUN_RIGHT;
    this.body.setAccelerationX(CONTROLS.RUN_ACCELERATION);
  }

  idleLeft() {
    this.applyFrictionFromLeft(CONTROLS.RUN_DECELERATION);
    this.setOrigin(...ORIGIN.LEFT);
    this.body.setOffset(...OFFSET.LEFT);
    this.currentState = DroidAssassinState.IDLE_LEFT;
  }

  idleRight() {
    this.applyFrictionFromRight(CONTROLS.RUN_DECELERATION);
    this.setOrigin(...ORIGIN.RIGHT);
    this.body.setOffset(...OFFSET.RIGHT);
    this.currentState = DroidAssassinState.IDLE_RIGHT;
  }

  dashAttackFromIdleLeft() {
    this.currentState = DroidAssassinState.DASH_ATTACK_FROM_IDLE_LEFT;
    this.stopMotion();
    this.body.setSize(ATTACK_WIDTH, SIZE[1], false);
    this.body.setOffset(SIZE[0], OFFSET.LEFT[1]);
    panCameraDuringDashFromIdle(
      this.x - DASH_DISTANCE,
      this.y - CHARACTER_VERTICAL_OFFSET,
      this.currentScene.cameras.main,
      this.currentScene.anims.get(DroidAssassinState.DASH_ATTACK_FROM_IDLE_LEFT)
        .frames.length
    );
  }

  dashAttackFromIdleRight() {
    this.currentState = DroidAssassinState.DASH_ATTACK_FROM_IDLE_RIGHT;
    this.stopMotion();
    this.body.setSize(ATTACK_WIDTH, SIZE[1], false);
    this.body.setOffset(...OFFSET.RIGHT);
    panCameraDuringDashFromIdle(
      this.x + DASH_DISTANCE,
      this.y - CHARACTER_VERTICAL_OFFSET,
      this.currentScene.cameras.main,
      this.currentScene.anims.get(
        DroidAssassinState.DASH_ATTACK_FROM_IDLE_RIGHT
      ).frames.length
    );
  }

  attackLeftReset() {
    if (this.currentState === DroidAssassinState.ATTACK_LEFT) {
      this.idleLeft();
      this.attackFinishedDeathCheck();
    }
  }

  attackRightReset() {
    if (this.currentState === DroidAssassinState.ATTACK_RIGHT) {
      this.idleRight();
      this.attackFinishedDeathCheck();
    }
  }

  dashAttackFromIdleLeftReset() {
    // Fudge because the on animationcomplete callback fires multiple times
    if (this.currentState === DroidAssassinState.DASH_ATTACK_FROM_IDLE_LEFT) {
      this.x -= DASH_DISTANCE;
      this.body.setSize(...SIZE);
      this.idleLeft();
      this.attackFinishedDeathCheck();
    }
  }

  dashAttackFromIdleRightReset() {
    // Fudge because the on animationcomplete callback fires multiple times
    if (this.currentState === DroidAssassinState.DASH_ATTACK_FROM_IDLE_RIGHT) {
      this.x += DASH_DISTANCE;
      this.body.setSize(...SIZE);
      this.idleRight();
      this.attackFinishedDeathCheck();
    }
  }

  dashAttackFromRunLeftReset() {
    // Fudge because the on animationcomplete callback fires multiple times
    if (this.currentState === DroidAssassinState.DASH_ATTACK_FROM_RUN_LEFT) {
      this.x -= DASH_DISTANCE;
      this.runLeft();
    }
  }

  dashAttackFromRunRightReset() {
    // Fudge because the on animationcomplete callback fires multiple times
    if (this.currentState === DroidAssassinState.DASH_ATTACK_FROM_RUN_RIGHT) {
      this.x += DASH_DISTANCE;
      this.runRight();
    }
  }

  stopMotion() {
    this.body.setAccelerationX(0);
    this.body.setVelocityX(0);
  }

  applyFrictionFromRight(acceleration: number) {
    if (this.body.velocity.x >= CONTROLS.FULL_STOP_VELOCITY) {
      this.body.setAccelerationX(-acceleration);
    } else {
      this.stopMotion();
    }
  }

  applyFrictionFromLeft(acceleration: number) {
    if (this.body.velocity.x <= -CONTROLS.FULL_STOP_VELOCITY) {
      this.body.setAccelerationX(acceleration);
    } else {
      this.stopMotion();
    }
  }

  attackFinishedDeathCheck() {
    const mageSamurai = this.currentScene.mageSamurai;
    if (
      mageSamurai.currentState === MageSamuraiState.HAS_BEEN_HIT_LEFT ||
      mageSamurai.currentState === MageSamuraiState.HAS_BEEN_HIT_RIGHT
    ) {
      setTimeout(() => {
        mageSamurai.die();
      }, 100);
    }
  }

  isAttackingAnimationFrame(): boolean {
    const frameNumber = parseInt(this.anims.currentFrame.frame.name, 10);
    switch (this.currentState) {
      case DroidAssassinState.DASH_ATTACK_FROM_IDLE_RIGHT:
      case DroidAssassinState.DASH_ATTACK_FROM_IDLE_LEFT:
        if (frameNumber >= 10 && frameNumber <= 13) {
          return true;
        }
        break;
      case DroidAssassinState.ATTACK_RIGHT:
      case DroidAssassinState.ATTACK_LEFT:
        if (frameNumber >= 12 && frameNumber <= 16) {
          return true;
        }
        break;
    }
    return false;
  }
}

// STATE MACHINE UTILS //
const calculateActiveInputs = (
  keys: Map<ActiveInput, Phaser.Input.Keyboard.Key>
): ActiveInput[] => {
  const activeInputs: ActiveInput[] = [];

  keys.forEach((_, inputName) => {
    if (keys.get(inputName).isDown) {
      activeInputs.push(ActiveInput[inputName]);
    }
  });
  return activeInputs;
};
