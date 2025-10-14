/**
 * Entity interface
 * Represents domain entities with unique identity
 * @module @bhumika/bhasha/interfaces
 */

/**
 * Base interface for all entities
 * Entities have unique identity (ID) and are compared by ID
 * Inspired by DDD patterns
 */
export interface IEntity<TId = string> {
  /**
   * Unique identifier
   * Two entities with the same ID are considered equal
   */
  id: TId;

  /**
   * Equality comparison based on ID
   * @param other - Other entity to compare
   * @returns True if entities have the same ID
   */
  equals(other: IEntity<TId>): boolean;
}
