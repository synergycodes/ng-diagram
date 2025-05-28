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

const richTypes = { Date: true, RegExp: true, String: true, Number: true };

export const diff = (
  obj: Record<string, unknown> | unknown[],
  newObj: Record<string, unknown> | unknown[]
): Difference[] {
  const diffs: Difference[] = [];
  const isObjArray = Array.isArray(obj);

  for (const key in obj) {
    const objKey = obj[key];
    const path = isObjArray ? +key : key;
    if (!(key in newObj)) {
      diffs.push({
        type: 'REMOVE',
        path: [path],
        oldValue: obj[key],
      });
      continue;
    }
    const newObjKey = newObj[key];
    const areCompatibleObjects =
      typeof objKey === 'object' && typeof newObjKey === 'object' && Array.isArray(objKey) === Array.isArray(newObjKey);
    if (
      objKey &&
      newObjKey &&
      areCompatibleObjects &&
      !richTypes[Object.getPrototypeOf(objKey)?.constructor?.name] &&
      !_stack.includes(objKey)
    ) {
      diffs.push.apply(
        diffs,
        diff(objKey, newObjKey, _stack.concat([objKey])).map((difference) => {
          difference.path.unshift(path);
          return difference;
        })
      );
    } else if (
      objKey !== newObjKey &&
      // treat NaN values as equivalent
      !(Number.isNaN(objKey) && Number.isNaN(newObjKey)) &&
      !(areCompatibleObjects && (isNaN(objKey) ? objKey + '' === newObjKey + '' : +objKey === +newObjKey))
    ) {
      diffs.push({
        path: [path],
        type: 'CHANGE',
        value: newObjKey,
        oldValue: objKey,
      });
    }
  }

  const isNewObjArray = Array.isArray(newObj);
  for (const key in newObj) {
    if (!(key in obj)) {
      diffs.push({
        type: 'CREATE',
        path: [isNewObjArray ? +key : key],
        value: newObj[key],
      });
    }
  }
  return diffs;
}
