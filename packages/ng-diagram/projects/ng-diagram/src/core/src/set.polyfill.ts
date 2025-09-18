export {};

declare global {
  interface Set<T> {
    difference(other: Set<T>): Set<T>;
    intersection(other: Set<T>): Set<T>;
  }
}

(function () {
  if (!Set.prototype.difference) {
    Set.prototype.difference = function <T>(other: Set<T>): Set<T> {
      const result = new Set<T>();
      for (const elem of this) {
        if (!other.has(elem)) {
          result.add(elem);
        }
      }
      return result;
    };
  }
  if (!Set.prototype.intersection) {
    Set.prototype.intersection = function <T>(other: Set<T>): Set<T> {
      const result = new Set<T>();
      for (const elem of this) {
        if (other.has(elem)) {
          result.add(elem);
        }
      }
      return result;
    };
  }
})();
