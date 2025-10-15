/**
 * Domain decorator implementation (Stage 3 - Native TypeScript 5.0+)
 * @module @bhumika/bhasha/decorators/domain
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { DomainMetadata } from '../../types/decorator-metadata.types.js';
import { extractContextName } from '../../utils/class-reference.utils.js';
import { BoundedContextRegistry, DomainRegistry } from './registries.js';
import { AttributeRegistry } from '../attribute/registry.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Domain decorator (Stage 3)
 * Marks a class as part of the domain model
 *
 * This is a lightweight marker decorator that identifies classes belonging
 * to the domain layer (as opposed to infrastructure, application, or presentation).
 * It can optionally link to a specific bounded context.
 *
 * Use this decorator on:
 * - Domain services
 * - Domain models (when not using more specific decorators like @Entity, @ValueObject)
 * - Domain event handlers
 * - Any class that contains core business logic
 *
 * @param options - Domain metadata (optional, can be empty object)
 * @returns Stage 3 class decorator
 *
 * @example
 * ```typescript
 * // Simple domain marker
 * @Domain()
 * class OrderValidator {}
 *
 * // With context
 * @Domain({ context: 'Order Management' })
 * class OrderPricingService {}
 *
 * // With full metadata
 * @Domain({
 *   context: 'Payment Processing',
 *   description: 'Handles payment authorization and capture',
 *   tags: ['payment', 'critical']
 * })
 * class PaymentAuthorizationService {}
 * ```
 */
export function Domain(options: DomainMetadata = {}) {
  return function <T extends Constructor>(
    target: T,
    context: ClassDecoratorContext
  ): void {
    // Validate decorator is applied to a class
    if (context.kind !== 'class') {
      throw new Error(`@Domain can only be applied to classes. Applied to: ${context.kind}`);
    }

    // Extract context name from reference (class or string)
    const contextRef = options.context;
    const contextName = contextRef ? extractContextName(contextRef) : undefined;

    // Optional validation: Warn if context is specified but not registered
    if (contextName && !BoundedContextRegistry.has(contextName)) {
      console.warn(
        `@Domain decorator on "${target.name}" references context "${contextName}", ` +
        `but this context is not registered. Make sure the @BoundedContext decorator ` +
        `is applied and imported before this domain class.`
      );
    }

    // Auto-generate name from class name if not provided
    if (!options.name) {
      options.name = target.name;
    }

    // Auto-generate ID from name if not provided
    if (!options.id) {
      options.id = generateDomainId(options.name, contextName);
    }

    // Initialize arrays if not provided
    if (!options.tags) {
      options.tags = [];
    }

    // Build metadata with extracted context name
    const domainMetadata: DomainMetadata = {
      ...options,
      context: contextName,
    };

    // Store metadata using Symbol.metadata
    const metadata = context.metadata as Record<symbol, unknown>;
    metadata[METADATA_KEYS.DOMAIN] = domainMetadata;

    // Process inline attributes (if provided)
    if (options.attributes && options.attributes.length > 0) {
      metadata[METADATA_KEYS.ATTRIBUTE] = options.attributes;
      AttributeRegistry.registerInline(target, options.attributes);
    }

    // Register domain in DomainRegistry
    DomainRegistry.register(target.name, target, {
      name: options.name,
      description: options.description,
      context: contextName,
      ubiquitousLanguage: options.ubiquitousLanguage,
      tags: options.tags,
    });
  };
}

/**
 * Generate domain ID from name and optional context
 * Format: {context-kebab-case}:{name-kebab-case} or just {name-kebab-case}
 *
 * @param name - Domain class name
 * @param context - Optional bounded context name
 * @returns Domain ID
 *
 * @example
 * ("OrderValidator", "Order Management") -> "order-management:order-validator"
 * ("PaymentService") -> "payment-service"
 */
function generateDomainId(name: string, context?: string): string {
  const nameId = toKebabCase(name);

  if (context) {
    const contextId = toKebabCase(context);
    return `${contextId}:${nameId}`;
  }

  return nameId;
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
