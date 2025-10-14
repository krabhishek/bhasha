/**
 * Base class for value objects
 * Optional utility class providing common value object logic
 * @module @bhumika/bhasha/base
 */

import type { IValueObject } from '../interfaces/value-object.interface.js';
import { validateAttributes as validateAttributesUtil } from '../decorators/attribute/attribute.decorator.js';

/**
 * Optional base class for value objects
 * Provides deep equality and cloning
 *
 * Usage:
 * ```typescript
 * class Money extends BaseValueObject {
 *   constructor(
 *     public readonly amount: number,
 *     public readonly currency: string
 *   ) {
 *     super();
 *     this.freeze(); // Make immutable
 *   }
 * }
 * ```
 *
 * Or implement IValueObject directly:
 * ```typescript
 * class Money implements IValueObject {
 *   constructor(
 *     public readonly amount: number,
 *     public readonly currency: string
 *   ) {
 *     Object.freeze(this);
 *   }
 *
 *   equals(other: IValueObject): boolean {
 *     // Custom equality logic
 *   }
 *
 *   clone(): this {
 *     return new Money(this.amount, this.currency) as this;
 *   }
 * }
 * ```
 */
export abstract class BaseValueObject implements IValueObject {
  /**
   * Check value equality
   * Performs deep comparison of all properties
   * @param other - Other value object to compare
   * @returns True if all properties are equal
   */
  equals(other: IValueObject): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false;
    }

    // Get all enumerable own properties
    const thisProps = Object.keys(this);
    const otherProps = Object.keys(other);

    // Different number of properties = not equal
    if (thisProps.length !== otherProps.length) {
      return false;
    }

    // Compare each property value
    return thisProps.every((key) => {
      const thisValue = (this as unknown as Record<string, unknown>)[key];
      const otherValue = (other as unknown as Record<string, unknown>)[key];

      // Handle nested objects and arrays
      if (typeof thisValue === 'object' && thisValue !== null) {
        // For objects, use JSON comparison (not perfect but simple)
        return JSON.stringify(thisValue) === JSON.stringify(otherValue);
      }

      // Primitive value comparison
      return thisValue === otherValue;
    });
  }

  /**
   * Create a copy of this value object
   * @returns Shallow copy of this value object
   */
  clone(): this {
    // Create new instance with same prototype
    const clone = Object.create(Object.getPrototypeOf(this));
    // Copy all properties
    return Object.assign(clone, this);
  }

  /**
   * Helper to make this value object immutable
   * Call this in constructor to ensure immutability
   * @returns This value object (frozen)
   */
  protected freeze(): this {
    return Object.freeze(this);
  }

  /**
   * Helper to create a modified copy
   * Since value objects are immutable, use this to create modified versions
   * @param updates - Properties to update
   * @returns New value object with updates
   */
  protected with(updates: Partial<this>): this {
    const clone = this.clone();
    return Object.assign(clone, updates);
  }

  /**
   * Auto-validate using @Attribute metadata
   * Call this in constructor to validate all properties decorated with @Attribute
   *
   * This method automatically validates:
   * - Required fields (throws if missing)
   * - Validation rules (min/max, pattern, enum, custom validators)
   * - Type constraints
   *
   * @throws Error if validation fails
   *
   * @example
   * ```typescript
   * @ValueObject({ immutable: true })
   * class Money extends BaseValueObject {
   *   @Attribute({ required: true, validation: { min: 0 } })
   *   readonly amount!: number;
   *
   *   @Attribute({ required: true, pattern: '^[A-Z]{3}$' })
   *   readonly currency!: string;
   *
   *   constructor(amount: number, currency: string) {
   *     super();
   *     this.amount = amount;
   *     this.currency = currency;
   *     this.validateAttributes(); // Auto-validates amount >= 0 and currency pattern
   *     this.freeze();
   *   }
   * }
   *
   * // Usage
   * new Money(100, 'USD'); // OK
   * new Money(-10, 'USD'); // Throws: "amount must be at least 0"
   * new Money(100, 'US');  // Throws: "currency does not match required pattern"
   * ```
   */
  protected validateAttributes(): void {
    validateAttributesUtil(this);
  }
}
