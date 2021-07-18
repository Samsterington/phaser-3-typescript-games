import { Physics, GameObjects } from "phaser";

interface PlayerState {
  dashingRight: boolean;
  dashingLeft: boolean;
  jumpingRight: boolean;
  jumpingLeft: boolean;
  fallingRight: boolean;
  fallingLeft: boolean;
  triggeredLandEffect: boolean;
  animationTiming: number;
}

interface TargetState {
  beingSlashed: boolean;
}

interface HealthBarState {
  health: number;
}

enum MinionState {
  IDLE = "idle",
  MOVING = "moving",
  GETTING_UP = "getting_up",
  DEAD = "dead",
  BUFFETED = "buffeted",
  REBIRTH = "rebirth",
}

export class MainScene extends Phaser.Scene {
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  minions: Phaser.GameObjects.Group;
  target: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  healthBar: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

  cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  playerState: PlayerState;
  targetState: TargetState;
  healthBarState: HealthBarState;

  constructor() {
    super({ key: "MainScene" });
    this.playerState = {
      dashingLeft: false,
      dashingRight: false,
      jumpingRight: false,
      jumpingLeft: false,
      fallingRight: false,
      fallingLeft: false,
      triggeredLandEffect: false,
      animationTiming: 0,
    };

    this.targetState = {
      beingSlashed: false,
    };

    this.healthBarState = {
      health: 38,
    };
  }

  preload(): void {
    this.loadImageSources();
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  create(): void {
    // this.target = this.physics.add.sprite(100, 92, "target");

    // this.target.body.setCollideWorldBounds();

    this.minions = this.physics.add.group({
      collideWorldBounds: true,
      allowGravity: true,
      gravityY: 300,
      classType: Phaser.GameObjects.Sprite,
    });

    this.minions.create(180, 20, "minion-move-left", -1, true, true).state =
      MinionState.IDLE;

    this.player = this.physics.add.sprite(10, 20, "man-idle-right");

    this.player.body.setCollideWorldBounds();

    this.healthBar = this.physics.add.image(22, 6, "health-bar-38");
    this.healthBar.setGravityY(-60);
    this.healthBar.body.setCollideWorldBounds();
    this.healthBar.setBounceY(0.1);

    this.createAnimations();
  }

  initiateLeftJump() {
    this.playerState.jumpingLeft = true;
    this.playerState.animationTiming = 0;
  }

  initiateRightJump() {
    this.playerState.jumpingRight = true;
    this.playerState.animationTiming = 0;
  }

  initiateRightDash() {
    this.playerState.dashingRight = true;
    this.playerState.animationTiming = 0;
  }

  initiateLeftDash() {
    this.playerState.dashingLeft = true;
    this.playerState.animationTiming = 0;
  }

  walk(direction: "right" | "left") {
    if (direction === "right") {
      this.player.body.setVelocityX(30);
      this.player.anims.play("man-walk-right", true);
    }
    if (direction === "left") {
      this.player.body.setVelocityX(-30);
      this.player.anims.play("man-walk-left", true);
    }
  }

  idle() {
    if (this.player.body.velocity.x < 0) {
      this.player.anims.play("man-idle-left", true);
    } else if (this.player.body.velocity.x >= 0) {
      this.player.anims.play("man-idle-right", true);
    }
    this.player.body.setVelocityX(0);
  }

  dashing(direction: "right" | "left") {
    let directionMultiplier = 1;
    if (direction === "left") {
      directionMultiplier = -1;
    }

    if (this.playerState.animationTiming > 5) {
      this.player.body.setVelocityX(directionMultiplier * 0);
    }
    if (this.playerState.animationTiming > 20) {
      this.player.body.setVelocityX(directionMultiplier * 300);
    }
    if (this.playerState.animationTiming > 32) {
      this.player.body.setVelocityX(directionMultiplier * 100);
    }
    if (this.playerState.animationTiming > 35) {
      this.player.body.setVelocityX(directionMultiplier * 10);
    }
    if (this.playerState.animationTiming > 40) {
      if (direction === "right") {
        this.playerState.dashingRight = false;
      } else {
        this.playerState.dashingLeft = false;
      }
    } else {
      if (direction === "right") {
        this.player.anims.play("man-dash-right", true);
      } else {
        this.player.anims.play("man-dash-left", true);
      }
      this.playerState.animationTiming++;
    }

    if (
      this.playerState.animationTiming > 20 &&
      this.playerState.animationTiming < 35
    ) {
      this.physics.overlap(this.player, this.target, (player, target) => {
        this.slashing(
          player,
          target as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
        );
      });
      this.physics.overlap(this.player, this.minions, (player, minion) => {
        this.slashing(
          player,
          minion as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
        );
      });
    }
  }

  slashing(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    target: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ) {
    if (!this.targetState.beingSlashed) {
      if (player.body.velocity.x > 0) {
        this.physics.add
          .staticSprite(
            target.body.x + target.body.width / 2,
            target.body.y + target.body.height / 2,
            "slash-right"
          )
          .anims.play("slash-right", true)
          .on("animationcomplete", () => {
            this.targetState.beingSlashed = false;
            target.state = MinionState.DEAD;
            target.body.setVelocity(
              Phaser.Math.Between(150, 350),
              Phaser.Math.Between(-150, -350)
            );
            target.body.setSize(6, 6);
            target.body.setAllowRotation();
            target.body.setAngularVelocity(10);
            target.body.setBounce(0.2, 0.2);

            target.body.setGravityY(500);
          });
        this.targetState.beingSlashed = true;
      } else {
        this.physics.add
          .staticSprite(
            target.body.x + target.body.width / 2,
            target.body.y + target.body.height / 2,
            "slash-left"
          )
          .anims.play("slash-left", true)
          .on("animationcomplete", () => {
            this.targetState.beingSlashed = false;
            target.state = MinionState.DEAD;
            target.body.setVelocity(
              Phaser.Math.Between(-150, -350),
              Phaser.Math.Between(-150, -350)
            );
            target.body.setSize(6, 6);
            target.body.setAllowRotation();
            target.body.setAngularVelocity(10);
            target.body.setBounce(0.4, 0.4);
            target.body.setGravityY(500);
          });
        this.targetState.beingSlashed = true;
      }
    } else {
      this.player.body.setVelocityX(this.player.body.velocity.x * 0.2);
      this.playerState.animationTiming -= 1;
    }
  }

  jumping(direction: "right" | "left") {
    let directionMultiplier = 1;
    if (direction === "left") {
      directionMultiplier = -1;
    }

    if (this.playerState.animationTiming > 5) {
      this.player.body.setVelocityX(0);
    }
    if (this.playerState.animationTiming > 20) {
      this.player.body.setVelocityY(-350);
      this.player.setVelocityX(directionMultiplier * 30);
    }
    if (this.playerState.animationTiming > 28) {
      this.player.body.setVelocityY(-150);
    }
    if (this.playerState.animationTiming > 32) {
      this.player.body.setVelocityY(-80);
    }
    if (this.playerState.animationTiming > 35) {
      this.player.body.setVelocityY(-10);
    }
    if (this.playerState.animationTiming > 40) {
      if (direction === "right") {
        this.playerState.jumpingRight = false;
      } else {
        this.playerState.jumpingLeft = false;
      }
    } else {
      if (direction === "right") {
        this.player.anims.play("man-jump-right", true);
      } else {
        this.player.anims.playReverse("man-jump-left", true);
      }
      this.playerState.animationTiming++;
    }
  }

  float() {
    this.player.body.setGravityY(60);
    if (this.cursors.left.isDown) {
      this.player.anims.play("man-float-left", true);
      this.player.setVelocityX(-15);
    } else if (this.cursors.right.isDown) {
      this.player.anims.play("man-float-right", true);
      this.player.setVelocityX(15);
    } else if (this.player.body.velocity.x < 0) {
      this.player.anims.play("man-float-left", true);
      this.player.setVelocityX(-5);
    } else {
      this.player.anims.play("man-float-right", true);
      this.player.setVelocityX(5);
    }
  }

  fall() {
    if (this.playerState.fallingRight) {
      this.player.anims.play("fall-right", true);
      this.player.body.setVelocityX(5);
    } else if (this.playerState.fallingLeft) {
      this.player.anims.play("fall-left", true);
      this.player.body.setVelocityX(-5);
    } else {
      if (this.player.body.velocity.x < 0) {
        this.player.anims.play("prep-fall-left", true);
        this.playerState.fallingLeft = true;
      } else {
        this.player.anims.play("prep-fall-right", true);
        this.playerState.fallingRight = true;
      }
      this.player.body.setGravityY(2000);
      this.player.body.setVelocityX(0);
    }
  }

  onLandAnimationComplete(direction: "left" | "right") {
    if (direction === "left") {
      this.playerState.fallingLeft = false;
    } else if (direction === "right") {
      this.playerState.fallingRight = false;
    } else {
      throw new Error(
        `onLandAnimationComplete direction paramter was not left or right instead was: ${direction}`
      );
    }
    this.minions.children.iterate(
      (minion: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) => {
        if (minion.state === MinionState.BUFFETED) {
          minion.body.setVelocityX(0);
          minion.state = MinionState.GETTING_UP;
        }
      }
    );
  }

  land() {
    this.player.body.setVelocityX(0);
    this.player.body.setGravityY(60);
    this.addDustClouds();

    if (this.playerState.fallingLeft) {
      this.player.anims
        .play("man-land-left", true)
        .on("animationcomplete", () => this.onLandAnimationComplete("left"));
    }
    if (this.playerState.fallingRight) {
      this.player.anims
        .play("man-land-right", true)
        .on("animationcomplete", () => this.onLandAnimationComplete("right"));
    }

    if (this.playerState.triggeredLandEffect) {
      this.buffetMinions();
    }
  }

  buffetMinions() {
    const BUFFET_DISTANCE = 18;
    const MAX_BUFFET_VELOCITY = 200;
    this.minions.children.iterate(
      (minion: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) => {
        const distance = minion.body.x - this.player.body.x;
        if (Math.abs(distance) < BUFFET_DISTANCE) {
          const velocity =
            Math.min(Math.abs(500 / distance), MAX_BUFFET_VELOCITY) *
            (distance / Math.abs(distance));
          minion.body.setVelocityX(velocity);
          if (minion.state !== MinionState.DEAD) {
            minion.state = MinionState.BUFFETED;
          }
        }
      }
    );
  }

  addDustClouds() {
    if (!this.playerState.triggeredLandEffect) {
      const dustRight = this.physics.add.sprite(
        this.player.body.x + 16,
        this.player.body.y + 8,
        "dust-right"
      );
      dustRight.anims.play("dust-right", true).on("animationcomplete", () => {
        this.playerState.triggeredLandEffect = false;
      });
      dustRight.setVelocityY(-8);
      dustRight.body.setVelocityX(40);

      const dustLeft = this.physics.add.sprite(
        this.player.body.x,
        this.player.body.y + 8,
        "dust-left"
      );
      dustLeft.anims.play("dust-left", true);
      dustLeft.setVelocityY(-8);
      dustLeft.body.setVelocityX(-40);
      this.playerState.triggeredLandEffect = true;
    }
  }

  updateMan() {
    if (
      !this.playerState.dashingRight &&
      !this.playerState.dashingLeft &&
      !this.playerState.jumpingRight &&
      !this.playerState.jumpingLeft &&
      !this.playerState.fallingRight &&
      !this.playerState.fallingLeft &&
      this.player.body.blocked.down
    ) {
      if (this.cursors.up.isDown && this.cursors.left.isDown) {
        this.initiateLeftJump();
      } else if (this.cursors.up.isDown) {
        this.initiateRightJump();
      } else if (this.cursors.right.isDown && this.cursors.shift.isDown) {
        this.initiateRightDash();
      } else if (this.cursors.left.isDown && this.cursors.shift.isDown) {
        this.initiateLeftDash();
      } else if (this.cursors.right.isDown) {
        this.walk("right");
      } else if (this.cursors.left.isDown) {
        this.walk("left");
      } else {
        this.idle();
      }
    } else if (this.playerState.dashingRight) {
      this.dashing("right");
    } else if (this.playerState.dashingLeft) {
      this.dashing("left");
    } else if (this.playerState.jumpingRight) {
      this.jumping("right");
    } else if (this.playerState.jumpingLeft) {
      this.jumping("left");
    } else if (!this.player.body.blocked.down) {
      if (
        this.cursors.down.isDown ||
        this.playerState.fallingRight ||
        this.playerState.fallingLeft
      ) {
        this.fall();
      } else {
        this.float();
      }
    } else if (
      this.player.body.blocked.down &&
      (this.playerState.fallingRight || this.playerState.fallingLeft)
    ) {
      this.land();
    }
  }

  updateMinion(minion: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    if (minion.state === MinionState.REBIRTH) {
      console.log(`in buffet loop ${minion.state}`);
      minion.anims.play("minion-rebirth", true).on("animationcomplete", () => {
        minion.state = MinionState.MOVING;
      });
    } else if (minion.state === MinionState.DEAD) {
      this.minionDead(minion);
    } else {
      if (minion.state !== MinionState.BUFFETED) {
        const playerX = this.player.body.x;
        const minionX = minion.body.x;
        const absoluteDistance = Math.abs(playerX - minionX);
        if (absoluteDistance < 20) {
          if (playerX < minionX) {
            if (minion.state === MinionState.IDLE) {
              minion.anims.play("minion-idle-left", true);
            } else {
              minion.anims
                .play("minion-down-left", true)
                .on("animationcomplete", () => {
                  minion.state = MinionState.IDLE;
                });
            }
          } else {
            if (minion.state === MinionState.IDLE) {
              minion.anims.play("minion-idle-right", true);
            } else {
              minion.anims
                .playReverse("minion-down-right", true)
                .on("animationcomplete", () => {
                  minion.state = MinionState.IDLE;
                });
            }
          }
          minion.body.setVelocityX(0);
        } else {
          if (playerX < minionX) {
            if (minion.state === MinionState.MOVING) {
              minion.anims.play("minion-move-left", true);
              minion.body.setVelocityX(-32);
            } else {
              minion.anims
                .play("minion-up-left", true)
                .on("animationcomplete", () => {
                  minion.state = MinionState.MOVING;
                });
            }
          } else {
            if (minion.state === MinionState.MOVING) {
              minion.anims.playReverse("minion-move-right", true);
              minion.body.setVelocityX(32);
            } else {
              minion.anims
                .playReverse("minion-up-right", true)
                .on("animationcomplete", () => {
                  minion.state = MinionState.MOVING;
                });
            }
          }
        }
      }
    }
  }

  minionRebirth(minion: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {}

  minionDead(minion: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    minion.anims.play("minion-head");
    if (minion.body.blocked.down) {
      minion.body.setDragX(400);
    } else {
      minion.body.setDragX(0);
    }
    if (minion.body.velocity.x === 0) {
      minion.body.setAngularVelocity(0);
      minion.body.rotation = 0;
      setTimeout(() => {
        const x = minion.body.position.x;
        const y = minion.body.position.y;
        minion.destroy();
        const newMinion = this.minions.create(
          x + 8,
          y,
          "minion-move-left",
          -1,
          true,
          true
        );
        newMinion.state = MinionState.REBIRTH;
      }, 400);
    }
  }

  update(): void {
    this.updateMan();
    this.minions.children.iterate((minion) => {
      this.updateMinion(
        minion as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
      );
    });

    this.physics.collide(this.minions, this.healthBar, () => {
      this.healthBarState.health > 0
        ? (this.healthBarState.health -= 2)
        : (this.healthBarState.health = 0);
      this.healthBar.setGravityY(100);
      this.healthBar.setTexture(`health-bar-${this.healthBarState.health}`);
    });
  }

  loadImageSources() {
    this.load.spritesheet("man-idle-right", "../../assets/man-idle-right.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet("man-idle-left", "../../assets/man-idle-left.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet(
      "man-walk-right",
      "../../assets/man-walk-right-2.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet("man-walk-left", "../../assets/man-walk-left-2.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet(
      "man-dash-right",
      "../../assets/man-dash-right-1.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet("man-dash-left", "../../assets/man-dash-left-1.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet(
      "man-jump-right",
      "../../assets/man-jump-right-0.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet("man-jump-left", "../../assets/man-jump-left-0.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet(
      "man-float-right",
      "../../assets/man-float-right-0.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet(
      "man-float-left",
      "../../assets/man-float-left-0.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet("slash-left", "../../assets/slash-left.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet("slash-right", "../../assets/slash-right.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.image("target", "../../assets/target.png");

    this.load.spritesheet(
      "prep-fall-right",
      "../../assets/man-prep-fall-right.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet("fall-right", "../../assets/man-fall-right.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet(
      "prep-fall-left",
      "../../assets/man-prep-fall-left.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet("fall-left", "../../assets/man-fall-left.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet(
      "man-land-right",
      "../../assets/man-land-right-2.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet("man-land-left", "../../assets/man-land-left-2.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet("dust-right", "../../assets/dust-right.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet("dust-left", "../../assets/dust-left.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet(
      "minion-idle-left",
      "../../assets/minion/minion-idle-left.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet(
      "minion-idle-right",
      "../../assets/minion/minion-idle-right.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet(
      "minion-up-left",
      "../../assets/minion/minion-up-left.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet(
      "minion-up-right",
      "../../assets/minion/minion-up-right.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet(
      "minion-move-left",
      "../../assets/minion/minion-move-left.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet(
      "minion-move-right",
      "../../assets/minion/minion-move-right.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet(
      "minion-down-left",
      "../../assets/minion/minion-down-left.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet(
      "minion-down-right",
      "../../assets/minion/minion-down-right.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.spritesheet(
      "minion-head",
      "../../assets/minion/minion-head.png",
      {
        frameWidth: 6,
        frameHeight: 6,
      }
    );

    this.load.spritesheet(
      "minion-rebirth",
      "../../assets/minion/minion-rebirth.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.image("health-bar-0", "../../assets/health-bar/health-bar-0.png");
    this.load.image("health-bar-2", "../../assets/health-bar/health-bar-2.png");
    this.load.image("health-bar-4", "../../assets/health-bar/health-bar-4.png");
    this.load.image("health-bar-6", "../../assets/health-bar/health-bar-6.png");
    this.load.image("health-bar-8", "../../assets/health-bar/health-bar-8.png");
    this.load.image(
      "health-bar-10",
      "../../assets/health-bar/health-bar-10.png"
    );
    this.load.image(
      "health-bar-12",
      "../../assets/health-bar/health-bar-12.png"
    );
    this.load.image(
      "health-bar-14",
      "../../assets/health-bar/health-bar-14.png"
    );
    this.load.image(
      "health-bar-16",
      "../../assets/health-bar/health-bar-16.png"
    );
    this.load.image(
      "health-bar-18",
      "../../assets/health-bar/health-bar-18.png"
    );
    this.load.image(
      "health-bar-20",
      "../../assets/health-bar/health-bar-20.png"
    );
    this.load.image(
      "health-bar-22",
      "../../assets/health-bar/health-bar-22.png"
    );
    this.load.image(
      "health-bar-24",
      "../../assets/health-bar/health-bar-24.png"
    );
    this.load.image(
      "health-bar-26",
      "../../assets/health-bar/health-bar-26.png"
    );
    this.load.image(
      "health-bar-28",
      "../../assets/health-bar/health-bar-28.png"
    );
    this.load.image(
      "health-bar-30",
      "../../assets/health-bar/health-bar-30.png"
    );
    this.load.image(
      "health-bar-32",
      "../../assets/health-bar/health-bar-32.png"
    );
    this.load.image(
      "health-bar-34",
      "../../assets/health-bar/health-bar-34.png"
    );
    this.load.image(
      "health-bar-36",
      "../../assets/health-bar/health-bar-36.png"
    );
    this.load.image(
      "health-bar-38",
      "../../assets/health-bar/health-bar-38.png"
    );
  }

  createAnimations() {
    this.anims.create({
      key: "man-idle-right",
      frames: this.anims.generateFrameNumbers("man-idle-right", {
        start: 0,
        end: 7,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "man-walk-right",
      frames: this.anims.generateFrameNumbers("man-walk-right", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "man-idle-left",
      frames: this.anims.generateFrameNumbers("man-idle-left", {
        start: 0,
        end: 7,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "man-walk-left",
      frames: this.anims.generateFrameNumbers("man-walk-left", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "man-dash-right",
      frames: this.anims.generateFrameNumbers("man-dash-right", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "man-dash-left",
      frames: this.anims.generateFrameNumbers("man-dash-left", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "man-jump-right",
      frames: this.anims.generateFrameNumbers("man-jump-right", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "man-jump-left",
      frames: this.anims.generateFrameNumbers("man-jump-left", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "man-float-right",
      frames: this.anims.generateFrameNumbers("man-float-right", {
        start: 0,
        end: 12,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "man-float-left",
      frames: this.anims.generateFrameNumbers("man-float-left", {
        start: 0,
        end: 12,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "fall-right",
      frames: this.anims.generateFrameNumbers("fall-right", {
        start: 0,
        end: 0,
      }),
      repeat: -1,
      frameRate: 10,
    });

    this.anims.create({
      key: "prep-fall-right",
      frames: this.anims.generateFrameNumbers("prep-fall-right", {
        start: 0,
        end: 0,
      }),
      repeat: -1,
      frameRate: 10,
    });

    this.anims.create({
      key: "fall-left",
      frames: this.anims.generateFrameNumbers("fall-left", {
        start: 0,
        end: 0,
      }),
      repeat: -1,
      frameRate: 10,
    });

    this.anims.create({
      key: "prep-fall-left",
      frames: this.anims.generateFrameNumbers("prep-fall-left", {
        start: 0,
        end: 0,
      }),
      repeat: -1,
      frameRate: 10,
    });

    this.anims.create({
      key: "man-land-right",
      frames: this.anims.generateFrameNumbers("man-land-right", {
        start: 3,
        end: 8,
      }),
      repeat: 0,
      frameRate: 20,
    });

    this.anims.create({
      key: "man-land-left",
      frames: this.anims.generateFrameNumbers("man-land-left", {
        start: 0,
        end: 5,
      }),
      repeat: 0,
      frameRate: 20,
    });

    this.anims.create({
      key: "slash-left",
      frames: this.anims.generateFrameNumbers("slash-left", {
        start: 0,
        end: 3,
      }),
      frameRate: 40,
      repeat: 0,
      hideOnComplete: true,
    });

    this.anims.create({
      key: "slash-right",
      frames: this.anims.generateFrameNumbers("slash-right", {
        start: 0,
        end: 3,
      }),
      frameRate: 40,
      repeat: 0,
      hideOnComplete: true,
    });

    this.anims.create({
      key: "dust-right",
      frames: this.anims.generateFrameNumbers("dust-right", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: 0,
      hideOnComplete: true,
    });

    this.anims.create({
      key: "dust-left",
      frames: this.anims.generateFrameNumbers("dust-left", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: 0,
      hideOnComplete: true,
    });

    this.anims.create({
      key: "minion-idle-left",
      frames: this.anims.generateFrameNumbers("minion-idle-left", {
        start: 0,
        end: 8,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "minion-idle-right",
      frames: this.anims.generateFrameNumbers("minion-idle-right", {
        start: 0,
        end: 8,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "minion-move-left",
      frames: this.anims.generateFrameNumbers("minion-move-left", {
        start: 0,
        end: 5,
      }),
      frameRate: 30,
      repeat: -1,
    });

    this.anims.create({
      key: "minion-move-right",
      frames: this.anims.generateFrameNumbers("minion-move-right", {
        start: 0,
        end: 5,
      }),
      frameRate: 30,
      repeat: -1,
    });

    this.anims.create({
      key: "minion-up-left",
      frames: this.anims.generateFrameNumbers("minion-up-left", {
        start: 0,
        end: 4,
      }),
      frameRate: 7,
      repeat: 0,
    });

    this.anims.create({
      key: "minion-up-right",
      frames: this.anims.generateFrameNumbers("minion-up-right", {
        start: 0,
        end: 4,
      }),
      frameRate: 7,
      repeat: 0,
    });

    this.anims.create({
      key: "minion-down-left",
      frames: this.anims.generateFrameNumbers("minion-down-left", {
        start: 0,
        end: 4,
      }),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: "minion-down-right",
      frames: this.anims.generateFrameNumbers("minion-down-right", {
        start: 0,
        end: 4,
      }),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: "minion-head",
      frames: this.anims.generateFrameNumbers("minion-head", {
        start: 0,
        end: 0,
      }),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: "minion-rebirth",
      frames: this.anims.generateFrameNumbers("minion-rebirth", {
        start: 0,
        end: 17,
      }),
      frameRate: 10,
      repeat: 0,
    });
  }
}
