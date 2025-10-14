/**
 * Attribute Registry
 * Global registry for tracking attributes across all Bhasha components
 * @module @bhumika/bhasha/decorators/attribute
 */

import type { AttributeMetadata, AttributeDefinition } from '../../types/decorator-metadata.types.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Global Attribute Registry
 * Tracks both decorator-based and inline attributes across all components
 *
 * This registry serves two purposes:
 * 1. Store inline attributes defined in component metadata (e.g., @Persona({ attributes: [...] }))
 * 2. Provide global queries across all registered attributes
 *
 * Note: Decorator-based attributes (@Attribute) are stored via reflect-metadata,
 * not in this registry. This registry only stores inline attributes.
 */
class AttributeRegistryImpl {
  /**
   * Map of component class -> inline attributes
   * Key: Constructor function
   * Value: Array of inline attribute definitions
   */
  private readonly inlineAttributes = new Map<Constructor, AttributeDefinition[]>();

  /**
   * Map of component class -> decorator attributes (cached for queries)
   * Key: Constructor function
   * Value: Array of decorator-based attribute metadata
   */
  private readonly decoratorAttributes = new Map<Constructor, AttributeMetadata[]>();

  /**
   * Register inline attributes from component metadata
   * Called by component decorators (@Persona, @Stakeholder, @BoundedContext, etc.)
   *
   * @param target - Component class constructor
   * @param attributes - Array of inline attribute definitions
   *
   * @example
   * ```typescript
   * // Called internally by @Persona decorator
   * AttributeRegistry.registerInline(CustomerPersona, [
   *   { name: 'age', type: 'number', required: true },
   *   { name: 'income', type: 'number' }
   * ]);
   * ```
   */
  registerInline(target: Constructor, attributes: AttributeDefinition[]): void {
    this.inlineAttributes.set(target, attributes);
  }

  /**
   * Register a single inline attribute
   * Convenience method for registering attributes one at a time
   *
   * @param target - Component class constructor
   * @param attribute - Single attribute definition
   */
  registerInlineAttribute(target: Constructor, attribute: AttributeDefinition): void {
    const existing = this.inlineAttributes.get(target) || [];
    existing.push(attribute);
    this.inlineAttributes.set(target, existing);
  }

  /**
   * Register decorator attribute (called by @Attribute decorator)
   * Caches decorator attributes for global queries
   *
   * @param target - Component class constructor
   * @param attribute - Attribute metadata from decorator
   */
  registerDecorator(target: Constructor, attribute: AttributeMetadata): void {
    const existing = this.decoratorAttributes.get(target) || [];
    existing.push(attribute);
    this.decoratorAttributes.set(target, existing);
  }

  /**
   * Get inline attributes for a component
   *
   * @param target - Component class constructor
   * @returns Array of inline attribute definitions
   */
  getInline(target: Constructor): AttributeDefinition[] {
    return this.inlineAttributes.get(target) || [];
  }

  /**
   * Get decorator attributes for a component (from cache)
   *
   * @param target - Component class constructor
   * @returns Array of decorator attribute metadata
   */
  getDecorator(target: Constructor): AttributeMetadata[] {
    return this.decoratorAttributes.get(target) || [];
  }

  /**
   * Get all inline attributes across all registered components
   *
   * @returns Map of component constructor -> inline attributes
   *
   * @example
   * ```typescript
   * const allInline = AttributeRegistry.getAllInline();
   * allInline.forEach((attrs, ComponentClass) => {
   *   console.log(`${ComponentClass.name} has ${attrs.length} inline attributes`);
   * });
   * ```
   */
  getAllInline(): Map<Constructor, AttributeDefinition[]> {
    return new Map(this.inlineAttributes);
  }

  /**
   * Get all decorator attributes across all registered components
   *
   * @returns Map of component constructor -> decorator attributes
   */
  getAllDecorator(): Map<Constructor, AttributeMetadata[]> {
    return new Map(this.decoratorAttributes);
  }

  /**
   * Check if a component has inline attributes
   *
   * @param target - Component class constructor
   * @returns True if component has inline attributes
   */
  hasInline(target: Constructor): boolean {
    const attrs = this.inlineAttributes.get(target);
    return attrs !== undefined && attrs.length > 0;
  }

  /**
   * Check if a component has decorator attributes
   *
   * @param target - Component class constructor
   * @returns True if component has decorator attributes
   */
  hasDecorator(target: Constructor): boolean {
    const attrs = this.decoratorAttributes.get(target);
    return attrs !== undefined && attrs.length > 0;
  }

  /**
   * Count total number of registered components with attributes
   *
   * @returns Total count of components
   */
  count(): number {
    // Use Set to avoid double-counting components with both inline and decorator attributes
    const allComponents = new Set([
      ...this.inlineAttributes.keys(),
      ...this.decoratorAttributes.keys(),
    ]);
    return allComponents.size;
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.inlineAttributes.clear();
    this.decoratorAttributes.clear();
  }

  /**
   * Get all components that have attributes (either inline or decorator)
   *
   * @returns Array of component constructors
   */
  getAllComponents(): Constructor[] {
    const allComponents = new Set([
      ...this.inlineAttributes.keys(),
      ...this.decoratorAttributes.keys(),
    ]);
    return Array.from(allComponents);
  }

  /**
   * Query attributes by component name pattern
   *
   * @param pattern - Regex pattern to match component names
   * @returns Map of matching components -> their attributes (merged inline + decorator)
   *
   * @example
   * ```typescript
   * // Find all Persona components
   * const personaAttributes = AttributeRegistry.queryByName(/Persona$/);
   * ```
   */
  queryByName(pattern: RegExp): Map<Constructor, AttributeMetadata[]> {
    const results = new Map<Constructor, AttributeMetadata[]>();

    this.getAllComponents().forEach((component) => {
      if (pattern.test(component.name)) {
        // Merge inline and decorator attributes
        const inline = this.getInline(component);
        const decorator = this.getDecorator(component);

        const merged = new Map<string, AttributeMetadata>();

        // Add inline first
        inline.forEach((attr) => merged.set(attr.name, attr as AttributeMetadata));

        // Override with decorator (decorator takes precedence)
        decorator.forEach((attr) => merged.set(attr.name, attr));

        results.set(component, Array.from(merged.values()));
      }
    });

    return results;
  }
}

/**
 * Singleton instance of the Attribute Registry
 * Use this to register and query attributes globally
 */
export const AttributeRegistry = new AttributeRegistryImpl();
