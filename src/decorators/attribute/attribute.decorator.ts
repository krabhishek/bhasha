/**
 * Universal Attribute decorator (Stage 3 - Native TypeScript 5.0+)
 * Works on properties of ANY Bhasha component (Persona, Stakeholder, BoundedContext, Domain, etc.)
 * @module @bhumika/bhasha/decorators/attribute
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { AttributeMetadata, AttributeDefinition, ConstructorWithMetadata } from '../../types/decorator-metadata.types.js';
import { AttributeRegistry } from './registry.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Type guard to check if a constructor has Symbol.metadata
 */
function hasSymbolMetadata(target: Constructor): target is ConstructorWithMetadata {
  return Symbol.metadata in target;
}

/**
 * Attribute decorator (Stage 3)
 * Marks a property as an attribute on ANY Bhasha component
 *
 * IMPORTANT: With Stage 3 decorators, the `type` field must be explicitly specified
 * since automatic type inference (emitDecoratorMetadata) is no longer available.
 *
 * This decorator helps document and extract structured information
 * from any Bhasha-decorated class. Can be used on:
 * - Personas (age, income, preferences)
 * - Stakeholders (limits, thresholds, permissions)
 * - BoundedContexts (team size, budget, SLAs)
 * - Domain classes (business constraints, configurations)
 * - ValueObjects (amount, currency, etc.)
 *
 * @param options - Attribute metadata (type field is REQUIRED)
 * @returns Stage 3 field decorator
 *
 * @example
 * ```typescript
 * // On Persona
 * @Persona({ type: PersonaType.Human })
 * class Customer {
 *   @Attribute({ type: 'number', description: 'Customer age', required: true, validation: { min: 18, max: 120 } })
 *   age!: number;
 *
 *   @Attribute({ type: 'string', description: 'Loyalty tier', validation: { enum: ['bronze', 'silver', 'gold'] } })
 *   loyaltyTier?: string;
 * }
 *
 * // On ValueObject
 * @ValueObject({ immutable: true })
 * class Money {
 *   @Attribute({ type: 'number', description: 'Amount', required: true, validation: { min: 0 } })
 *   readonly amount!: number;
 *
 *   @Attribute({ type: 'string', description: 'Currency code', validation: { pattern: '^[A-Z]{3}$' } })
 *   readonly currency!: string;
 * }
 *
 * // On Stakeholder
 * @Stakeholder({ persona: 'Customer', role: 'Buyer', context: 'E-commerce' })
 * class BuyerStakeholder {
 *   @Attribute({ type: 'number', description: 'Purchase limit', validation: { max: 10000 } })
 *   purchaseLimit!: number;
 * }
 * ```
 */
export function Attribute(options?: Partial<AttributeDefinition>) {
  return function (
    _value: undefined,  // Always undefined for field decorators in Stage 3
    context: ClassFieldDecoratorContext
  ): void {
    // Validate decorator is applied to a field
    if (context.kind !== 'field') {
      throw new Error(`@Attribute can only be applied to class fields. Applied to: ${context.kind}`);
    }

    // Validate type is specified (required in Stage 3)
    if (!options?.type) {
      throw new Error(
        `@Attribute decorator on "${String(context.name)}" requires an explicit "type" field. ` +
        `Example: @Attribute({ type: 'number', ... })`
      );
    }

    // Access shared metadata object via context
    const metadata = context.metadata as Record<symbol, unknown>;

    // Get existing attributes array or create new one
    const attributes = (metadata[METADATA_KEYS.ATTRIBUTE] as AttributeMetadata[]) || [];

    // Create attribute metadata
    const attributeMetadata: AttributeMetadata = {
      name: String(context.name),
      type: options.type,
      ...options,
    };

    // Add to attributes array
    attributes.push(attributeMetadata);

    // Store back to metadata
    metadata[METADATA_KEYS.ATTRIBUTE] = attributes;

    // Register in global registry after class is fully constructed
    // Note: `this` is typed as `unknown` in initializers, so we need to use type assertion
    context.addInitializer(function() {
      // In a field decorator initializer, `this` refers to the instance being created
      // We can safely access the constructor from the instance
      const instance = this as object;
      const ctor = instance.constructor as Constructor;
      AttributeRegistry.registerDecorator(ctor, attributeMetadata);
    });
  };
}

/**
 * Get all attributes from ANY Bhasha component class
 * Merges both decorator-based and inline attributes
 *
 * @param target - Class constructor
 * @returns Array of attribute metadata (decorator attributes take precedence over inline)
 *
 * @example
 * ```typescript
 * // Component with both decorator and inline attributes
 * @Persona({
 *   type: PersonaType.Human,
 *   attributes: [
 *     { name: 'income', type: 'number', description: 'Annual income' }
 *   ]
 * })
 * class Customer {
 *   @Attribute({ type: 'number', description: 'Age', required: true })
 *   age!: number;
 * }
 *
 * const attributes = getAttributes(Customer);
 * // Returns: [{ name: 'age', ... }, { name: 'income', ... }]
 * ```
 */
export function getAttributes(target: Constructor): AttributeMetadata[] {
  // Stage 3: Access Symbol.metadata on constructor (type-safe)
  const decoratorAttrs = hasSymbolMetadata(target)
    ? (target[Symbol.metadata][METADATA_KEYS.ATTRIBUTE] as AttributeMetadata[] | undefined) || []
    : [];

  // Get from inline metadata (registered by component decorators)
  const inlineAttrs = AttributeRegistry.getInline(target) || [];

  // Merge: decorator attributes take precedence for same property name
  const merged = new Map<string, AttributeMetadata>();

  // Add inline attributes first (cast to AttributeMetadata for compatibility)
  inlineAttrs.forEach((attr) => merged.set(attr.name, attr as AttributeMetadata));

  // Override with decorator attributes (they have priority)
  decoratorAttrs.forEach((attr) => merged.set(attr.name, attr));

  return Array.from(merged.values());
}

/**
 * Check if class has any attributes (decorator or inline)
 * @param target - Class constructor
 * @returns True if class has @Attribute decorators or inline attributes
 */
export function hasAttributes(target: Constructor): boolean {
  const attributes = getAttributes(target);
  return attributes.length > 0;
}

/**
 * Get attribute by name
 * @param target - Class constructor
 * @param attributeName - Attribute name to find
 * @returns Attribute metadata or undefined
 */
export function getAttribute(
  target: Constructor,
  attributeName: string
): AttributeMetadata | undefined {
  const attributes = getAttributes(target);
  return attributes.find((attr) => attr.name === attributeName);
}

/**
 * Get required attributes
 * @param target - Class constructor
 * @returns Array of required attributes
 */
export function getRequiredAttributes(target: Constructor): AttributeMetadata[] {
  const attributes = getAttributes(target);
  return attributes.filter((attr) => attr.required === true);
}

/**
 * Validate a value against attribute metadata
 * Returns true if valid, error message if invalid
 *
 * @param value - Value to validate
 * @param attribute - Attribute metadata with validation rules
 * @returns True if valid, error message string if invalid
 *
 * @example
 * ```typescript
 * const ageAttr: AttributeMetadata = {
 *   name: 'age',
 *   type: 'number',
 *   required: true,
 *   validation: { min: 18, max: 120 }
 * };
 *
 * validateAttributeValue(25, ageAttr); // true
 * validateAttributeValue(15, ageAttr); // 'age must be at least 18'
 * validateAttributeValue(null, ageAttr); // 'age is required'
 * ```
 */
export function validateAttributeValue(
  value: unknown,
  attribute: AttributeMetadata
): true | string {
  // Check required
  if (attribute.required && (value === undefined || value === null)) {
    return `${attribute.name} is required`;
  }

  // Skip validation if value is undefined/null and not required
  if (value === undefined || value === null) {
    return true;
  }

  // Run validation rules if present
  if (attribute.validation) {
    const v = attribute.validation;

    // Number validations
    if (typeof value === 'number') {
      if (v.min !== undefined && value < v.min) {
        return `${attribute.name} must be at least ${v.min}`;
      }
      if (v.max !== undefined && value > v.max) {
        return `${attribute.name} must be at most ${v.max}`;
      }
    }

    // String/Array validations
    if (typeof value === 'string' || Array.isArray(value)) {
      const length = value.length;
      if (v.minLength !== undefined && length < v.minLength) {
        return `${attribute.name} length must be at least ${v.minLength}`;
      }
      if (v.maxLength !== undefined && length > v.maxLength) {
        return `${attribute.name} length must be at most ${v.maxLength}`;
      }
    }

    // Pattern validation (strings)
    if (typeof value === 'string' && v.pattern) {
      const regex = typeof v.pattern === 'string' ? new RegExp(v.pattern) : v.pattern;
      if (!regex.test(value)) {
        return `${attribute.name} does not match required pattern`;
      }
    }

    // Enum validation
    if (v.enum && !v.enum.includes(value)) {
      return `${attribute.name} must be one of: ${v.enum.join(', ')}`;
    }

    // Custom validation
    if (v.custom) {
      const result = v.custom(value);
      if (result !== true) {
        return typeof result === 'string' ? result : `${attribute.name} validation failed`;
      }
    }
  }

  return true;
}

/**
 * Validate all attributes on an instance
 * Throws error with all validation failures
 *
 * @param instance - Instance to validate
 * @returns void (throws on validation failure)
 *
 * @example
 * ```typescript
 * @Persona({ type: PersonaType.Human })
 * class Customer {
 *   @Attribute({ type: 'number', required: true, validation: { min: 18 } })
 *   age!: number;
 * }
 *
 * const customer = new Customer();
 * customer.age = 15;
 * validateAttributes(customer); // Throws: "Validation failed: age must be at least 18"
 * ```
 */
export function validateAttributes(instance: object): void {
  const attributes = getAttributes(instance.constructor as Constructor);
  const errors: string[] = [];

  attributes.forEach((attr) => {
    const value = (instance as Record<string, unknown>)[attr.name];
    const result = validateAttributeValue(value, attr);

    if (result !== true) {
      errors.push(result);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }
}
