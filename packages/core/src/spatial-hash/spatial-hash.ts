import { Node } from '../types';
import { Rect, RectWithId } from '../types/utils';
import { getRect } from './utils';

export class SpatialHash {
  private readonly cellSize = 100;
  private readonly grid = new Map<string, RectWithId[]>();
  private readonly idToCells = new Map<string, string[]>();
  private readonly idToRects = new Map<string, RectWithId>();

  process(nodes: Node[]) {
    const previousIds = new Set(this.idToRects.keys());
    const currentIds = new Set<string>();

    for (const node of nodes) {
      const rect = this.idToRects.get(node.id);
      currentIds.add(node.id);
      if (!rect) {
        this.addToGrid(this.nodeToRect(node));
      } else if (!this.isSameRect(rect, this.nodeToRect(node))) {
        this.updateInGrid(this.nodeToRect(node));
      }
    }

    for (const id of previousIds.difference(currentIds)) {
      this.removeFromGrid(id);
    }
  }

  query(range: Rect): RectWithId[] {
    const result = new Set<RectWithId>();
    const cells = this.getCells(range);
    for (const cell of cells) {
      const objects = this.grid.get(cell);
      if (objects) {
        for (const rect of objects) {
          if (this.intersects(rect, range)) {
            result.add(rect);
          }
        }
      }
    }
    return [...result];
  }

  private intersects(a: Rect, b: Rect): boolean {
    return b.x <= a.x + a.width && b.x + b.width >= a.x && b.y <= a.y + a.height && b.y + b.height >= a.y;
  }

  private isSameRect(rect1: Rect, rect2: Rect) {
    return rect1.x === rect2.x && rect1.y === rect2.y && rect1.width === rect2.width && rect1.height === rect2.height;
  }

  private nodeToRect(node: Node): RectWithId {
    return {
      ...getRect(node),
      id: node.id,
    };
  }

  private addToCell(cell: string, rect: RectWithId) {
    if (!this.grid.has(cell)) {
      this.grid.set(cell, []);
    }
    this.grid.get(cell)!.push(rect);
  }

  private removeFromCell(cell: string, id: string) {
    const newCells = this.grid.get(cell)!.filter((rect) => rect.id !== id);
    this.grid.set(cell, newCells);
  }

  private updateInCell(cell: string, rect: RectWithId) {
    const newCells = this.grid.get(cell)!.filter((rect) => rect.id !== rect.id);
    this.grid.set(cell, [...newCells, rect]);
  }

  private addToGrid(rect: RectWithId) {
    const cells = this.getCells(rect);
    for (const cell of cells) {
      this.addToCell(cell, rect);
    }
    this.idToCells.set(rect.id, cells);
    this.idToRects.set(rect.id, rect);
  }

  private updateInGrid(rect: RectWithId) {
    const newCells = this.getCells(rect);
    const newCellsSet = new Set(newCells);
    const oldCellsSet = new Set(this.idToCells.get(rect.id) || []);
    const cellsToRemove = oldCellsSet.difference(newCellsSet);
    const cellsToAdd = newCellsSet.difference(oldCellsSet);
    const cellsToUpdate = newCellsSet.intersection(oldCellsSet);
    for (const cell of cellsToRemove) {
      this.removeFromCell(cell, rect.id);
    }
    for (const cell of cellsToAdd) {
      this.addToCell(cell, rect);
    }
    for (const cell of cellsToUpdate) {
      this.updateInCell(cell, rect);
    }
    this.idToRects.set(rect.id, rect);
    this.idToCells.set(rect.id, newCells);
  }

  private removeFromGrid(id: string) {
    const cells = this.idToCells.get(id);
    if (!cells) {
      return;
    }
    for (const cell of cells) {
      this.removeFromCell(cell, id);
    }
    this.idToCells.delete(id);
    this.idToRects.delete(id);
  }

  private getCellsRange(startPos: number, size: number): [number, number] {
    const start = Math.floor(startPos / this.cellSize);
    const end = Math.floor((startPos + size) / this.cellSize);
    return [start, end];
  }

  private getCells(rect: Rect) {
    const [minX, maxX] = this.getCellsRange(rect.x, rect.width);
    const [minY, maxY] = this.getCellsRange(rect.y, rect.height);
    const cells: string[] = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        cells.push(`${x}-${y}`);
      }
    }
    return cells;
  }
}
