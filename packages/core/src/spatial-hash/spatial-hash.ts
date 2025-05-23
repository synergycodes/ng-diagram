import { Node } from '../types';
import { Rect, RectWithId } from '../types/utils';
import { doesRectsIntersect, getRect, isSameRect } from './utils';

export class SpatialHash {
  private readonly cellSize = 100;
  private readonly grid = new Map<string, RectWithId[]>();
  private readonly idToCells = new Map<string, string[]>();
  private readonly idToRect = new Map<string, RectWithId>();

  process(nodes: Node[]) {
    const previousIds = new Set(this.idToRect.keys());
    const currentIds = new Set<string>();

    for (const node of nodes) {
      currentIds.add(node.id);

      const prevRect = this.idToRect.get(node.id);
      if (!prevRect) {
        this.addToGrid(this.nodeToRect(node));
      } else {
        const currentRect = this.nodeToRect(node);
        if (!isSameRect(prevRect, currentRect)) {
          this.updateInGrid(currentRect);
        }
      }
    }

    for (const id of previousIds.difference(currentIds)) {
      this.removeFromGrid(id);
    }
  }

  query(range: Rect): RectWithId[] {
    const result: RectWithId[] = [];
    this._query(range, (rect) => result.push(rect));
    return result;
  }

  queryIds(range: Rect): string[] {
    const results: string[] = [];
    this._query(range, (rect) => results.push(rect.id));
    return results;
  }

  private _query(range: Rect, addToCollection: (rect: RectWithId) => void): void {
    const cells = this.getCells(range);
    const checkedRects = new Set<string>();
    for (const cell of cells) {
      const objects = this.grid.get(cell);
      if (objects) {
        for (const rect of objects) {
          if (checkedRects.has(rect.id)) {
            continue;
          }
          checkedRects.add(rect.id);
          if (doesRectsIntersect(rect, range)) {
            addToCollection(rect);
          }
        }
      }
    }
  }

  private nodeToRect(node: Node): RectWithId {
    const ports = node.ports || [];
    const { x, y, width, height } = getRect(node);
    const angle = (node.angle || 0) * 2 * Math.PI;

    let leftOffset = 0;
    let rightOffset = 0;
    let topOffset = 0;
    let bottomOffset = 0;

    for (const port of ports) {
      const px = port.position.x;
      const py = port.position.y;
      const pw = port.size.width;
      const ph = port.size.height;

      leftOffset = Math.min(leftOffset, px);
      rightOffset = Math.max(rightOffset, px + pw - width);
      topOffset = Math.min(topOffset, py);
      bottomOffset = Math.max(bottomOffset, py + ph - height);
    }

    const expandedX = x + leftOffset;
    const expandedY = y + topOffset;
    const expandedWidth = width + rightOffset - leftOffset;
    const expandedHeight = height + bottomOffset - topOffset;

    if (!node.angle || node.angle % 1 === 0) {
      return {
        id: node.id,
        x: expandedX,
        y: expandedY,
        width: expandedWidth,
        height: expandedHeight,
      };
    }

    const cx = expandedX + expandedWidth / 2;
    const cy = expandedY + expandedHeight / 2;

    const corners = [
      { x: expandedX, y: expandedY },
      { x: expandedX + expandedWidth, y: expandedY },
      { x: expandedX + expandedWidth, y: expandedY + expandedHeight },
      { x: expandedX, y: expandedY + expandedHeight },
    ];

    const rotated = corners.map(({ x, y }) => {
      const dx = x - cx;
      const dy = y - cy;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      };
    });

    const minX = Math.min(...rotated.map((p) => p.x));
    const maxX = Math.max(...rotated.map((p) => p.x));
    const minY = Math.min(...rotated.map((p) => p.y));
    const maxY = Math.max(...rotated.map((p) => p.y));

    return {
      id: node.id,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
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
    const newCells = this.grid.get(cell)!.filter(({ id }) => id !== rect.id);
    this.grid.set(cell, [...newCells, rect]);
  }

  private addToGrid(rect: RectWithId) {
    const cells = this.getCells(rect);
    for (const cell of cells) {
      this.addToCell(cell, rect);
    }
    this.idToCells.set(rect.id, cells);
    this.idToRect.set(rect.id, rect);
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
    this.idToRect.set(rect.id, rect);
    this.idToCells.set(rect.id, newCells);
  }

  private removeFromGrid(id: string) {
    const cells = this.idToCells.get(id);
    if (!cells) {
      return;
    }
    for (const cell of cells) {
      this.removeFromCell(cell, id);
      if (this.grid.get(cell)!.length === 0) {
        this.grid.delete(cell);
      }
    }
    this.idToCells.delete(id);
    this.idToRect.delete(id);
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
