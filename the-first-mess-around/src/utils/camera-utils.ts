export const panCameraDuringDashFromIdle = (
  x: number,
  y: number,
  camera: Phaser.Cameras.Scene2D.Camera,
  numberOfAnimationFrames: number // assuming 10 frame per second speed
) => {
  camera.pan(x, y, numberOfAnimationFrames * 100, "Sine.easeInOut");
};
