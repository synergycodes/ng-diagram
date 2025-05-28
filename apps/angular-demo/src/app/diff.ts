export interface DifferenceCreate {
  type: 'CREATE';
  path: (string | number)[];
  value: unknown;
}

export interface DifferenceRemove {
  type: 'REMOVE';
  path: (string | number)[];
  oldValue: unknown;
}

export interface DifferenceChange {
  type: 'CHANGE';
  path: (string | number)[];
  value: unknown;
  oldValue: unknown;
}

export type Difference = DifferenceCreate | DifferenceRemove | DifferenceChange;

export const diff = (
  obj: Record<string, unknown> | unknown[],
  newObj: Record<string, unknown> | unknown[]
): Difference[] => {
  const diffs: Difference[] = [];
  const isObjArray = Array.isArray(obj);
  const isNewObjArray = Array.isArray(newObj);

  // Check for REMOVES and CHANGES
  for (const key in obj) {
    const path = isObjArray ? +key : key;
    const objValue = isObjArray ? obj[+key] : (obj as Record<string, unknown>)[key];
    const newObjValue = isNewObjArray ? newObj[+key] : (newObj as Record<string, unknown>)[key];

    if (!(key in newObj)) {
      diffs.push({
        type: 'REMOVE',
        path: [path],
        oldValue: objValue,
      });
    } else if (objValue !== newObjValue) {
      // Shallow comparison only
      diffs.push({
        type: 'CHANGE',
        path: [path],
        value: newObjValue,
        oldValue: objValue,
      });
    }
  }

  // Check for CREATES
  for (const key in newObj) {
    if (!(key in obj)) {
      const newObjValue = isNewObjArray ? newObj[+key] : (newObj as Record<string, unknown>)[key];
      diffs.push({
        type: 'CREATE',
        path: [isNewObjArray ? +key : key],
        value: newObjValue,
      });
    }
  }

  return diffs;
};
