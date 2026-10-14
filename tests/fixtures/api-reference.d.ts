/** Create a value. More details follow. */
export declare function create(value: number): ReadableStore

/** @deprecated Use create instead. */
export declare function legacy(): ReadableStore

export interface ReadableStore {
  /** Read the current value. */
  get(): number
}

export interface WritableStore extends ReadableStore {
  /** Replace the current value. */
  set(value: number): void
}

export type Value = number

export interface Derive {
  /**
   * Derive from text.
   * @deprecated Pass a number instead.
   */
  (value: string): ReadableStore
  /**
   * Derive a value. More details follow.
   *
   * ```ts
   * derive(1)
   * ```
   */
  (value: number): ReadableStore
}

export declare const derive: Derive
