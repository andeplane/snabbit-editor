// Grid coordinate math — matches the game's coordinate system.
// Source: Classes/GameConfig.h
//   X = col * B_SIZE * 2 + (row % 2) * B_SIZE
//   Y = row * B_SIZE
//
// In the actual game the snake moves UPWARD on screen (world scrolls down).
// Row 0 is at the BOTTOM; higher row numbers go UP.
// We reflect this: y = (levelHeight - row) * CELL_H + TOP_OFFSET

export const CELL_W = 16;
export const CELL_H = 16;
export const TOP_OFFSET = CELL_W;

// Returns the CENTER of a block in canvas space.
// levelHeight needed so row 0 appears at the bottom.
export function gridToPixel(
  col: number,
  row: number,
  levelHeight: number,
): { x: number; y: number } {
  return {
    x: col * CELL_W * 2 + (row % 2) * CELL_W,
    y: (levelHeight - row) * CELL_H + TOP_OFFSET,
  };
}

// Hit-test: nearest grid cell to a canvas world position.
export function pixelToGrid(
  worldX: number,
  worldY: number,
  cols: number,
  rows: number,
  levelHeight: number,
): { col: number; row: number } | null {
  const row = levelHeight - Math.round((worldY - TOP_OFFSET) / CELL_H);
  if (row < 0 || row >= rows) return null;
  const offset = (row % 2) * CELL_W;
  const col = Math.round((worldX - offset) / (CELL_W * 2));
  if (col < 0 || col >= cols) return null;
  return { row, col };
}

// World-space Y for the center of a given row
export function rowToWorldY(row: number, levelHeight: number): number {
  return (levelHeight - row) * CELL_H + TOP_OFFSET;
}

export function canvasOriginX(
  width: number,
  canvasWidth: number,
  zoom: number,
  scrollX: number,
) {
  return (canvasWidth / zoom - width * CELL_W * 2) / 2 + CELL_W - scrollX;
}
export function rectangleCells(
  a: number,
  b: number,
  width: number,
  filled = true,
): number[] {
  const r0 = Math.min(Math.floor(a / width), Math.floor(b / width)),
    r1 = Math.max(Math.floor(a / width), Math.floor(b / width));
  const c0 = Math.min(a % width, b % width),
    c1 = Math.max(a % width, b % width),
    cells = [];
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++)
      if (filled || r === r0 || r === r1 || c === c0 || c === c1)
        cells.push(r * width + c);
  return cells;
}
export function lineCells(
  a: number,
  b: number,
  width: number,
  height: number,
): number[] {
  const p = gridToPixel(a % width, Math.floor(a / width), height),
    q = gridToPixel(b % width, Math.floor(b / width), height);
  const n = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 4)),
    cells = new Set<number>();
  for (let i = 0; i <= n; i++) {
    const pos = pixelToGrid(
      p.x + ((q.x - p.x) * i) / n,
      p.y + ((q.y - p.y) * i) / n,
      width,
      height,
      height,
    );
    if (pos) cells.add(pos.row * width + pos.col);
  }
  return [...cells];
}
