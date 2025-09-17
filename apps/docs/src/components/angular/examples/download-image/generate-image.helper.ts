import { type Node } from 'ng-diagram';

export const downloadImage = (data: string | Blob, fileName: string) => {
  try {
    const anchor = document.createElement('a');
    let url: string | null = null;

    if (typeof data === 'string') {
      anchor.href = data;
    } else if (data instanceof Blob) {
      url = URL.createObjectURL(data);
      anchor.href = url;
    } else {
      throw new Error('Unsupported data type for download');
    }

    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    if (url) {
      URL.revokeObjectURL(url);
    }
  } catch (e) {
    console.error(e);
  }
};

export const calculateBoundingBox = (nodes: Node[], margin: number) => {
  if (nodes.length === 0) {
    return {
      width: 0,
      height: 0,
      top: 0,
      left: 0,
    };
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const node of nodes) {
    const nodeWidth = node.size?.width || 0;
    const nodeHeight = node.size?.height || 0;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + nodeWidth);
    maxY = Math.max(maxY, node.position.y + nodeHeight);
  }

  return {
    width: maxX - minX + margin * 2,
    height: maxY - minY + margin * 2,
    left: minX - margin,
    top: minY - margin,
  };
};
