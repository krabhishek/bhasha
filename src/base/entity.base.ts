/**
 * Base class for entities
 * Optional utility class providing common entity logic
 * @module @bhumika/bhasha/base
 */

import type { IEntity } from '../interfaces/entity.interface.js';

/**
 * Optional base class for entities
 * Provides common ID equality logic
 *
 * Usage:
 * ```typescript
 * class Order extends BaseEntity<string> {
 *   id: string;
 *   // ... other properties
 * }
 * ```
 *
 * Or implement IEntity directly if you prefer no inheritance:
 * ```typescript
 * class Order implements IEntity<string> {
 *   id: string;
 *   equals(other: IEntity<string>): boolean {
 *     return this.id === other.id;
 *   }
 * }
 * ```
 */
export abstract class BaseEntity<TId = string> implements IEntity<TId> {
  /**
   * Entity ID (must be implemented by subclass)
   */
  abstract id: TId;

  /**
   * Check equality based on ID
   * Two entities are equal if they have the same ID
   * @param other - Other entity to compare
   * @returns True if IDs match
   */
  equals(other: IEntity<TId>): boolean {
    if (!other || !(other instanceof BaseEntity)) {
      return false;
    }

    // Null/undefined IDs are never equal
    if (this.id === null || this.id === undefined) {
      return false;
    }

    return this.id === other.id;
  }

  /**
   * Helper to check if entity is new (not persisted)
   * @returns True if ID is null/undefined
   */
  isNew(): boolean {
    return this.id === null || this.id === undefined;
  }

  /**
   * Helper to check if entity is persisted
   * @returns True if ID is not null/undefined
   */
  isPersisted(): boolean {
    return !this.isNew();
  }
}
