/** The canvas operations used by the renderer. A small port makes the drawing
 * contract injectable in tests without pretending a fake is a full DOM canvas. */
export type DrawContext = Pick<
  CanvasRenderingContext2D,
  | "clearRect"
  | "fillRect"
  | "save"
  | "restore"
  | "scale"
  | "translate"
  | "rotate"
  | "beginPath"
  | "closePath"
  | "moveTo"
  | "lineTo"
  | "arc"
  | "stroke"
  | "fillText"
  | "setLineDash"
  | "fillStyle"
  | "strokeStyle"
  | "lineWidth"
  | "globalAlpha"
  | "font"
  | "textAlign"
> & {
  fill(): void;
  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    width: number,
    height: number,
  ): void;
};
