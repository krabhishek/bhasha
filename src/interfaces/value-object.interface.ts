/**
 * Value Object interface
 * Represents immutable domain values
 * @module @bhumika/bhasha/interfaces
 */

/**
 * Base interface for value objects
 * Value objects are immutable and compared by value (not identity)
 * Examples: Money, Address, Email, etc.
 */
export interface IValueObject {
  /**
   * Value equality (deep comparison of all properties)
   * Two value objects are equal if all their properties are equal
   * @param other - Other value object to compare
   * @returns True if all properties are equal
   */
  equals(other: IValueObject): boolean;

  /**
   * Create a copy of this value object
   * Since value objects are immutable, this ensures modifications create new instances
   * @returns A copy of this value object
   */
  clone(): this;
}
