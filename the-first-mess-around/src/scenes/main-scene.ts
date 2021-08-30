import { DroidAssassin } from "../objects/droidAssassin";
import { BootScene } from "./boot-scene";

const BACKGROUND_VERTICAL_OFFSET = -376;
const BOUNDS_MULTIPLIER = 5;
const MAX_IMAGE_SCROLLFACTOR = 1.3;

export class MainScene extends Phaser.Scene {
  private droidAssassin: DroidAssassin;
  private floors: Phaser.Physics.Arcade.StaticGroup;
  private images: Phaser.GameObjects.Image[];

  constructor() {
    super({ key: "MainScene" });
    this.images = [];
  }

  create(): void {
    this.createBounds();

    this.createFloor();

    this.createBackground();

    this.droidAssassin = new DroidAssassin({
      scene: this,
      x: this.sys.game.canvas.width / 2,
      y: 337,
      texture: "droid-assassin-idle",
      startWithCutScene: false,
    });

    this.createForeground();

    this.createCollisions();
  }

  public changeImageScrollFactor() {
    this.images.forEach((image) => {
      console.log(image.scrollFactorX);
      image.setScrollFactor(
        Math.round((MAX_IMAGE_SCROLLFACTOR - image.scrollFactorX) * 10) / 10
      );
    });
  }

  createBounds() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.cameras.main.setBounds(
      width * -BOUNDS_MULTIPLIER,
      0,
      width * BOUNDS_MULTIPLIER * 2,
      height
    );
  }

  createCollisions() {
    this.physics.add.collider(this.floors, this.droidAssassin);
  }

  createFloor() {
    this.floors = this.physics.add.staticGroup();
    const floor = this.floors.create(
      this.scale.width / 2,
      this.scale.height,
      "transparent"
    );
    floor.setSize(10000, 95);
  }

  createRepeatingBackground(
    scrollFactor: number,
    texture: string,
    imageHeight: number
  ) {
    const imageWidth = this.textures.get(texture).getSourceImage().width;
    const totalPositiveWidth = this.scale.width * BOUNDS_MULTIPLIER;
    const count = Math.ceil((totalPositiveWidth / imageWidth) * scrollFactor);
    for (let i = -count; i <= count; i++) {
      const image = this.add
        .image(i * imageWidth, imageHeight, texture)
        .setOrigin(0, 0)
        .setScrollFactor(scrollFactor);
      this.images.push(image);
    }
  }

  createBackground() {
    this.createRepeatingBackground(
      0.1,
      "background-forest-9",
      BACKGROUND_VERTICAL_OFFSET
    );
    this.createRepeatingBackground(
      0.2,
      "background-forest-8",
      BACKGROUND_VERTICAL_OFFSET
    );
    this.createRepeatingBackground(
      0.3,
      "background-forest-7",
      BACKGROUND_VERTICAL_OFFSET
    );
    this.createRepeatingBackground(
      0.4,
      "background-forest-6",
      BACKGROUND_VERTICAL_OFFSET
    );
    this.createRepeatingBackground(
      0.5,
      "background-forest-5",
      BACKGROUND_VERTICAL_OFFSET
    );
    this.createRepeatingBackground(
      0.6,
      "background-forest-4",
      BACKGROUND_VERTICAL_OFFSET
    );
    this.createRepeatingBackground(
      0.7,
      "background-forest-3",
      BACKGROUND_VERTICAL_OFFSET
    );
  }

  createForeground() {
    this.createRepeatingBackground(
      1,
      "background-forest-2",
      BACKGROUND_VERTICAL_OFFSET
    );
    this.createRepeatingBackground(
      1.1,
      "background-forest-1",
      BACKGROUND_VERTICAL_OFFSET
    );
    this.createRepeatingBackground(
      MAX_IMAGE_SCROLLFACTOR,
      "background-forest-0",
      BACKGROUND_VERTICAL_OFFSET
    );
  }

  update(): void {
    this.droidAssassin.update();
  }
}
