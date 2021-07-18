import { Redhat } from "../objects/redhat";
import { Physics, GameObjects } from "phaser";

interface PlayerState {
  isWallJumping: boolean;
  numWallJumps: number;
}

interface GameState {
  score: number;
  gameOver: boolean;
}

export class MainScene extends Phaser.Scene {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  stars: Phaser.Physics.Arcade.Group;
  bombs: Phaser.Physics.Arcade.Group;

  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  playerState: PlayerState;
  gameState: GameState;
  scoreText: any;

  constructor() {
    super({ key: "MainScene" });
    this.playerState = {
      isWallJumping: false,
      numWallJumps: 1,
    };

    this.gameState = {
      score: 0,
      gameOver: false,
    };
  }

  preload(): void {
    this.load.image("sky", "../../assets/sky.png");
    this.load.image("platform", "../../assets/platform.png");
    this.load.image("star", "../../assets/star.png");
    this.load.image("bomb", "../../assets/bomb.png");
    this.load.image("sky", "../../assets/sky.png");
    this.load.spritesheet("dude", "../../assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  create(): void {
    this.add.image(400, 300, "sky");

    this.scoreText = this.add.text(16, 16, "score: 0", {
      fontSize: "32px",
      color: "#000",
    });

    this.platforms = this.physics.add.staticGroup();

    this.platforms.create(400, 568, "platform").setScale(2).refreshBody();

    this.platforms.create(600, 400, "platform");
    this.platforms.create(50, 250, "platform");
    this.platforms.create(700, 220, "platform");

    this.player = this.physics.add.sprite(100, 450, "dude");

    this.physics.add.collider(this.player, this.platforms);

    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate(
      (child: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      }
    );

    this.physics.add.collider(this.stars, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );

    this.bombs = this.physics.add.group();
    this.physics.add.collider(this.platforms, this.bombs);

    this.physics.add.collider(
      this.player,
      this.bombs,
      this.hitBomb,
      null,
      this
    );

    this.addBomb();

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  update(): void {
    const playerUncontrollable = this.playerState.isWallJumping;

    if (this.player.body.touching.down) {
      this.playerState = {
        isWallJumping: false,
        numWallJumps: 1,
      };
    }

    if (!playerUncontrollable) {
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-160);

        this.player.anims.play("left", true);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(160);

        this.player.anims.play("right", true);
      } else {
        this.player.setVelocityX(0);

        this.player.anims.play("turn");
      }
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-230);
    }

    // Wall jump left
    if (
      this.cursors.up.isDown &&
      this.cursors.right.isDown &&
      this.player.body.touching.right &&
      this.playerState.numWallJumps > 0
    ) {
      this.player.setVelocityY(-300);
      this.player.setVelocityX(-20);

      this.playerState.isWallJumping = true;
      this.playerState.numWallJumps--;
      this.player.anims.play("turn");

      setTimeout(() => {
        this.playerState.isWallJumping = false;
      }, 500);
    }

    // Wall jump right
    if (
      this.cursors.up.isDown &&
      this.cursors.left.isDown &&
      this.player.body.touching.left &&
      this.playerState.numWallJumps > 0
    ) {
      this.player.setVelocityY(-300);
      this.player.setVelocityX(20);

      this.playerState.isWallJumping = true;
      this.playerState.numWallJumps--;
      this.player.anims.play("turn");

      setTimeout(() => {
        this.playerState.isWallJumping = false;
      }, 500);
    }
  }

  collectStar(
    _: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    star: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
  ) {
    this.gameState.score++;
    this.scoreText.setText(`score: ${this.gameState.score}`);
    star.disableBody(true, true);

    if (this.stars.countActive(true) === 0) {
      this.stars.children.iterate(function (
        child: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
      ) {
        child.enableBody(true, child.x, 0, true, true);
      });
      this.addBomb();
    }
  }

  addBomb() {
    var x =
      this.player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    var bomb = this.bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }

  hitBomb(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    bomb: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
  ) {
    this.physics.pause();

    bomb.destroy();

    player.setTint(0xff0000);

    player.anims.play("turn");

    this.gameState.gameOver = true;

    this.displayGameOverText();
  }

  displayGameOverText() {
    this.add
      .text(400, 300, "GAME OVER", {
        fontSize: "64px",
        color: "#000",
        align: "center",
      })
      .setOrigin(0.5);
  }
}
