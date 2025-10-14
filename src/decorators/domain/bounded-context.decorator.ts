/**
 * BoundedContext decorator implementation (Stage 3 - Native TypeScript 5.0+)
 * @module @bhumika/bhasha/decorators/domain
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { BoundedContextMetadata } from '../../types/decorator-metadata.types.js';
import { ContextRelationshipType } from '../../enums/context-relationship.enum.js';
import { BoundedContextRegistry } from './registries.js';
import { AttributeRegistry } from '../attribute/registry.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * BoundedContext decorator (Stage 3)
 * Defines a DDD bounded context boundary
 *
 * Bounded contexts represent logical boundaries within a domain where
 * specific models, ubiquitous language, and business rules apply.
 * They help organize large domains into manageable, cohesive pieces.
 *
 * @param options - Bounded context metadata
 * @returns Stage 3 class decorator
 *
 * @example
 * ```typescript
 * @BoundedContext({
 *   name: 'Order Management',
 *   owner: 'Sales Team',
 *   description: 'Handles customer orders and fulfillment',
 *   relationships: {
 *     'Inventory': ContextRelationshipType.Upstream,
 *     'Shipping': ContextRelationshipType.Downstream,
 *     'Payment': ContextRelationshipType.Partnership
 *   },
 *   vocabulary: {
 *     'Order': 'A customer purchase request',
 *     'OrderLine': 'Individual item in an order'
 *   },
 *   tags: ['core-domain', 'revenue-generating']
 * })
 * class OrderManagementContext {}
 * ```
 */
export function BoundedContext(options: BoundedContextMetadata) {
  return function <T extends Constructor>(
    target: T,
    context: ClassDecoratorContext
  ): void {
    // Validate decorator is applied to a class
    if (context.kind !== 'class') {
      throw new Error(`@BoundedContext can only be applied to classes. Applied to: ${context.kind}`);
    }

    // Validation: name is required
    if (!options.name) {
      throw new Error(
        `@BoundedContext decorator on "${target.name}" requires a "name" field. ` +
        `The name should clearly identify the bounded context (e.g., "Order Management", "User Authentication").`
      );
    }

    // Validation: Validate relationship types if provided
    if (options.relationships) {
      const validTypes = Object.values(ContextRelationshipType);
      const invalidRelationships = Object.entries(options.relationships)
        .filter(([, type]) => !validTypes.includes(type))
        .map(([context, type]) => `"${context}": "${type}"`);

      if (invalidRelationships.length > 0) {
        throw new Error(
          `@BoundedContext decorator on "${target.name}" has invalid relationship types: ` +
          `${invalidRelationships.join(', ')}. ` +
          `Valid types are: ${validTypes.join(', ')}`
        );
      }
    }

    // Auto-generate ID from name if not provided
    if (!options.id) {
      options.id = generateContextId(options.name);
    }

    // Initialize arrays if not provided
    if (!options.tags) {
      options.tags = [];
    }

    // Initialize objects if not provided
    if (!options.relationships) {
      options.relationships = {};
    }

    if (!options.vocabulary) {
      options.vocabulary = {};
    }

    // Store metadata using Symbol.metadata
    const metadata = context.metadata as Record<symbol, unknown>;
    metadata[METADATA_KEYS.BOUNDED_CONTEXT] = options;

    // Process inline attributes (if provided)
    if (options.attributes && options.attributes.length > 0) {
      metadata[METADATA_KEYS.ATTRIBUTE] = options.attributes;
      AttributeRegistry.registerInline(target, options.attributes);
    }

    // Register in global bounded context registry after class is defined
    context.addInitializer(function() {
      BoundedContextRegistry.register(options.name, target, options);
    });
  };
}

/**
 * Generate context ID from name
 * Converts name to kebab-case for use as ID
 *
 * @param name - Context name
 * @returns Kebab-case ID
 *
 * @example
 * "Order Management" -> "order-management"
 * "UserAuthentication" -> "user-authentication"
 */
function generateContextId(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase -> kebab-case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // ABCDef -> ABC-Def
    .replace(/\s+/g, '-')                 // spaces -> hyphens
    .replace(/[^a-zA-Z0-9-]/g, '')        // remove special chars except hyphens
    .toLowerCase();
}
