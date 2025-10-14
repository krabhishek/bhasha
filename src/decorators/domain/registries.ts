/**
 * Global registry for Bounded Contexts
 * Allows finding and querying bounded contexts across the codebase
 * @module @bhumika/bhasha/decorators/domain
 */

import type { BoundedContextMetadata } from '../../types/decorator-metadata.types.js';
import type { ContextRelationshipType } from '../../enums/context-relationship.enum.js';

// Type alias for class constructors
type Constructor = new (...args: never[]) => unknown;

/**
 * Bounded Context Registry Entry
 */
export interface BoundedContextRegistryEntry {
  target: Constructor;
  metadata: BoundedContextMetadata;
}

/**
 * Global Bounded Context Registry
 * Stores all registered bounded contexts for easy lookup and analysis
 */
class BoundedContextRegistryClass {
  private contexts = new Map<string, BoundedContextRegistryEntry>();

  /**
   * Register a bounded context
   * @param name - Context name
   * @param target - Context class
   * @param metadata - Context metadata
   */
  register(name: string, target: Constructor, metadata: BoundedContextMetadata): void {
    if (this.contexts.has(name)) {
      console.warn(
        `Bounded Context "${name}" is already registered. ` +
        `This may indicate duplicate context definitions.`
      );
    }
    this.contexts.set(name, { target, metadata });
  }

  /**
   * Get bounded context by name
   * @param name - Context name
   * @returns Context entry or undefined
   */
  get(name: string): BoundedContextRegistryEntry | undefined {
    return this.contexts.get(name);
  }

  /**
   * Get all bounded contexts
   * @returns Map of all bounded contexts
   */
  getAll(): Map<string, BoundedContextRegistryEntry> {
    return new Map(this.contexts);
  }

  /**
   * Get bounded contexts by owner/team
   * @param owner - Team or owner name
   * @returns Array of matching bounded contexts
   */
  getByOwner(owner: string): Array<{ name: string } & BoundedContextRegistryEntry> {
    return Array.from(this.contexts.entries())
      .filter(([, { metadata }]) => metadata.owner === owner)
      .map(([name, entry]) => ({ name, ...entry }));
  }

  /**
   * Get bounded contexts by tag
   * @param tag - Tag to filter by
   * @returns Array of matching bounded contexts
   */
  getByTag(tag: string): Array<{ name: string } & BoundedContextRegistryEntry> {
    return Array.from(this.contexts.entries())
      .filter(([, { metadata }]) => metadata.tags?.includes(tag))
      .map(([name, entry]) => ({ name, ...entry }));
  }

  /**
   * Get related contexts for a given context
   * @param contextName - Name of the context
   * @param relationshipType - Optional filter by relationship type
   * @returns Array of related contexts with their relationship types
   */
  getRelatedContexts(
    contextName: string,
    relationshipType?: ContextRelationshipType
  ): Array<{ contextName: string; relationshipType: ContextRelationshipType }> {
    const context = this.contexts.get(contextName);
    if (!context || !context.metadata.relationships) {
      return [];
    }

    const relationships = Object.entries(context.metadata.relationships)
      .map(([name, type]) => ({
        contextName: name,
        relationshipType: type,
      }));

    if (relationshipType) {
      return relationships.filter((rel) => rel.relationshipType === relationshipType);
    }

    return relationships;
  }

  /**
   * Get upstream contexts for a given context
   * @param contextName - Name of the context
   * @returns Array of upstream context names
   */
  getUpstreamContexts(contextName: string): string[] {
    return this.getRelatedContexts(contextName, 'upstream' as ContextRelationshipType)
      .map((rel) => rel.contextName);
  }

  /**
   * Get downstream contexts for a given context
   * @param contextName - Name of the context
   * @returns Array of downstream context names
   */
  getDownstreamContexts(contextName: string): string[] {
    return this.getRelatedContexts(contextName, 'downstream' as ContextRelationshipType)
      .map((rel) => rel.contextName);
  }

  /**
   * Check if bounded context exists
   * @param name - Context name
   * @returns True if context is registered
   */
  has(name: string): boolean {
    return this.contexts.has(name);
  }

  /**
   * Get all bounded context names
   * @returns Array of context names
   */
  getNames(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * Get bounded context count
   * @returns Number of registered contexts
   */
  count(): number {
    return this.contexts.size;
  }

  /**
   * Get vocabulary for a context
   * @param contextName - Name of the context
   * @returns Vocabulary map or undefined
   */
  getVocabulary(contextName: string): Record<string, string> | undefined {
    const context = this.contexts.get(contextName);
    return context?.metadata.vocabulary;
  }

  /**
   * Clear registry (useful for testing)
   */
  clear(): void {
    this.contexts.clear();
  }
}

/**
 * Global Bounded Context Registry instance
 */
export const BoundedContextRegistry = new BoundedContextRegistryClass();
