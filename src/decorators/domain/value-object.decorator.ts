/**
 * ValueObject decorator implementation (Stage 3 - Native TypeScript 5.0+)
 * @module @bhumika/bhasha/decorators/domain
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { ValueObjectMetadata, ConstructorWithMetadata } from '../../types/decorator-metadata.types.js';
import { extractContextName } from '../../utils/class-reference.utils.js';
import { AttributeRegistry } from '../attribute/registry.js';

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
 * ValueObject decorator (Stage 3)
 * Marks a class as a DDD Value Object - immutable domain values compared by structure
 *
 * Value Objects are:
 * - **Immutable**: Cannot be changed after creation (use Object.freeze)
 * - **Structural equality**: Two instances are equal if all properties match
 * - **Self-validating**: Validate in constructor
 * - **Side-effect free**: Methods return new instances, never mutate
 *
 * This decorator integrates with @Attribute to define the structure:
 * - Use @Attribute decorators on properties for type-safe definitions
 * - OR use inline `attributes` array in metadata for documentation-first approach
 * - OR use both (decorator attributes take precedence)
 *
 * @param options - Value object metadata
 * @returns Stage 3 class decorator
 *
 * @example
 * ```typescript
 * // Example 1: Using @Attribute decorators (recommended for runtime validation)
 * @ValueObject({
 *   context: 'E-commerce',
 *   description: 'Monetary value with currency',
 *   equality: 'structural'
 * })
 * class Money extends BaseValueObject {
 *   @Attribute({ type: 'number', description: 'Amount in base units', required: true, validation: { min: 0 } })
 *   readonly amount!: number;
 *
 *   @Attribute({ type: 'string', description: 'ISO currency code', required: true, validation: { pattern: '^[A-Z]{3}$' } })
 *   readonly currency!: string;
 *
 *   constructor(amount: number, currency: string = 'USD') {
 *     super();
 *     this.amount = amount;
 *     this.currency = currency;
 *     this.validateAttributes(); // Use BaseValueObject helper
 *     this.freeze();
 *   }
 *
 *   add(other: Money): Money {
 *     if (this.currency !== other.currency) {
 *       throw new Error('Currency mismatch');
 *     }
 *     return new Money(this.amount + other.amount, this.currency);
 *   }
 * }
 *
 * // Example 2: Using inline attributes (documentation-first)
 * @ValueObject({
 *   context: 'E-commerce',
 *   description: 'Email address',
 *   attributes: [
 *     { name: 'local', type: 'string', required: true },
 *     { name: 'domain', type: 'string', required: true, validation: { pattern: '^[a-z0-9.-]+\\.[a-z]{2,}$' } }
 *   ]
 * })
 * class Email extends BaseValueObject {
 *   constructor(
 *     public readonly local: string,
 *     public readonly domain: string
 *   ) {
 *     super();
 *     this.freeze();
 *   }
 *
 *   toString(): string {
 *     return `${this.local}@${this.domain}`;
 *   }
 * }
 *
 * // Example 3: Inline ValueObject (no separate class)
 * @Persona({ type: PersonaType.Human })
 * class Customer {
 *   @Attribute({
 *     type: 'object',
 *     description: 'Customer address',
 *     valueObject: true,
 *     immutable: true,
 *     properties: {
 *       street: { type: 'string', required: true },
 *       city: { type: 'string', required: true },
 *       zipCode: { type: 'string', validation: { pattern: '^\\d{5}$' } }
 *     }
 *   })
 *   address!: { street: string; city: string; zipCode: string };
 * }
 * ```
 */
export function ValueObject(options: ValueObjectMetadata = {}) {
  return function <T extends Constructor>(
    target: T,
    context: ClassDecoratorContext
  ): void {
    // Validate decorator is applied to a class
    if (context.kind !== 'class') {
      throw new Error(`@ValueObject can only be applied to classes. Applied to: ${context.kind}`);
    }

    // Extract context name from reference (class or string)
    const contextRef = options.context;
    const contextName = contextRef ? extractContextName(contextRef) : undefined;

    // Validation: Ensure immutability (warn if explicitly set to false)
    if (options.immutable === false) {
      console.warn(
        `@ValueObject decorator on "${target.name}" should be immutable. ` +
        `Value Objects must be immutable by definition.`
      );
    }

    // Force immutability (core principle of Value Objects)
    options.immutable = true;

    // Default to structural equality (value-based comparison)
    if (!options.equality) {
      options.equality = 'structural';
    }

    // Auto-generate name from class name if not provided
    if (!options.name) {
      options.name = target.name;
    }

    // Auto-generate ID if not provided
    if (!options.id) {
      options.id = generateValueObjectId(options.name, contextName);
    }

    // Initialize arrays if not provided
    if (!options.tags) {
      options.tags = [];
    }

    // Build metadata with extracted context name
    const valueObjectMetadata: ValueObjectMetadata = {
      ...options,
      context: contextName,
    };

    // Store metadata using Symbol.metadata
    const metadata = context.metadata as Record<symbol, unknown>;
    metadata[METADATA_KEYS.VALUE_OBJECT] = valueObjectMetadata;

    // Process inline attributes (if provided)
    if (options.attributes && options.attributes.length > 0) {
      // Store attributes in metadata
      metadata[METADATA_KEYS.ATTRIBUTE] = options.attributes;

      // Register inline attributes in AttributeRegistry
      AttributeRegistry.registerInline(target, options.attributes);

      // Helpful dev log
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `@ValueObject "${target.name}" registered ${options.attributes.length} inline attributes`
        );
      }
    }

    // Note: No separate ValueObject registry needed - ValueObjects are just
    // specialized Domain classes. Use getMetadata(METADATA_KEYS.VALUE_OBJECT, class)
    // to check if a class is a ValueObject.
  };
}

/**
 * Generate value object ID from name and optional context
 * Format: {context-kebab-case}:vo:{name-kebab-case} or just vo:{name-kebab-case}
 *
 * @param name - ValueObject class name
 * @param context - Optional bounded context name
 * @returns ValueObject ID
 *
 * @example
 * ("Money", "E-commerce") -> "e-commerce:vo:money"
 * ("Email") -> "vo:email"
 */
function generateValueObjectId(name: string, context?: string): string {
  const nameId = toKebabCase(name);

  if (context) {
    const contextId = toKebabCase(context);
    return `${contextId}:vo:${nameId}`;
  }

  return `vo:${nameId}`;
}

/**
 * Convert string to kebab-case
 * @param str - Input string
 * @returns Kebab-case string
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase -> kebab-case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // ABCDef -> ABC-Def
    .replace(/\s+/g, '-')                 // spaces -> hyphens
    .replace(/[^a-zA-Z0-9-]/g, '')        // remove special chars except hyphens
    .toLowerCase();
}

/**
 * Check if a class is decorated with @ValueObject
 *
 * @param target - Class constructor
 * @returns True if class has @ValueObject decorator
 *
 * @example
 * ```typescript
 * @ValueObject()
 * class Money extends BaseValueObject { }
 *
 * isValueObject(Money); // true
 * isValueObject(String); // false
 * ```
 */
export function isValueObject(target: Constructor): boolean {
  return hasSymbolMetadata(target) && METADATA_KEYS.VALUE_OBJECT in target[Symbol.metadata];
}

/**
 * Get ValueObject metadata from a class
 *
 * @param target - Class constructor
 * @returns ValueObject metadata or undefined
 */
export function getValueObjectMetadata(target: Constructor): ValueObjectMetadata | undefined {
  if (!hasSymbolMetadata(target)) {
    return undefined;
  }
  return target[Symbol.metadata][METADATA_KEYS.VALUE_OBJECT] as ValueObjectMetadata | undefined;
}
