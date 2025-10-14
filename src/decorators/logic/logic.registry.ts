/**
 * Logic Registry
 * Singleton registry for all executable logic components
 * @module @bhumika/bhasha/decorators/logic
 */

import type { LogicMetadata, LogicType } from '../../types/decorator-metadata.types.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Registry entry containing both metadata and constructor
 */
interface LogicRegistryEntry {
  metadata: LogicMetadata;
  constructor: Constructor;
}

/**
 * LogicRegistry - Singleton registry for all logic components
 *
 * Provides indexing and querying capabilities for:
 * - Finding logic by name, type, or context
 * - Finding logic by input/output contracts
 * - Tracking dependencies and detecting cycles
 * - Cross-context validation
 *
 * @example
 * ```typescript
 * const registry = LogicRegistry.getInstance();
 *
 * // Get logic by name
 * const logic = registry.getByName('ValidateEmail');
 *
 * // Get all validations
 * const validations = registry.getByType('validation');
 *
 * // Find compatible logic
 * const compatible = registry.findCompatible(
 *   { email: 'string' },
 *   { isValid: 'boolean' }
 * );
 * ```
 */
export class LogicRegistry {
  private static instance: LogicRegistry;

  /**
   * Map of logic name -> registry entry
   */
  private readonly logicByName = new Map<string, LogicRegistryEntry>();

  /**
   * Map of logic type -> array of logic names
   */
  private readonly logicByType = new Map<LogicType, string[]>();

  /**
   * Map of context -> array of logic names
   */
  private readonly logicByContext = new Map<string, string[]>();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LogicRegistry {
    if (!LogicRegistry.instance) {
      LogicRegistry.instance = new LogicRegistry();
    }
    return LogicRegistry.instance;
  }

  /**
   * Register logic in the registry
   * Called automatically by @Logic decorator
   *
   * @param metadata - Logic metadata
   * @param constructor - Logic class constructor
   * @throws Error if logic with same name already exists
   */
  public register(metadata: LogicMetadata, constructor: Constructor): void {
    const { name, type, context } = metadata;

    // Check for duplicates
    if (this.logicByName.has(name)) {
      throw new Error(
        `@Logic "${name}": Logic with this name already exists. ` +
        `Please use a unique name for each logic component.`
      );
    }

    // Store in main registry
    this.logicByName.set(name, { metadata, constructor });

    // Index by type
    const typeIndex = this.logicByType.get(type) || [];
    typeIndex.push(name);
    this.logicByType.set(type, typeIndex);

    // Index by context (if provided)
    if (context) {
      const contextIndex = this.logicByContext.get(context) || [];
      contextIndex.push(name);
      this.logicByContext.set(context, contextIndex);
    }
  }

  /**
   * Get logic by name
   * @param name - Logic name
   * @returns Registry entry or undefined
   */
  public getByName(name: string): LogicRegistryEntry | undefined {
    return this.logicByName.get(name);
  }

  /**
   * Get all logic of a specific type
   * @param type - Logic type
   * @returns Array of logic entries
   */
  public getByType(type: LogicType): LogicRegistryEntry[] {
    const names = this.logicByType.get(type) || [];
    return names
      .map((name) => this.logicByName.get(name))
      .filter((entry): entry is LogicRegistryEntry => entry !== undefined);
  }

  /**
   * Get all logic in a specific context
   * @param context - Bounded context name
   * @returns Array of logic entries
   */
  public getByContext(context: string): LogicRegistryEntry[] {
    const names = this.logicByContext.get(context) || [];
    return names
      .map((name) => this.logicByName.get(name))
      .filter((entry): entry is LogicRegistryEntry => entry !== undefined);
  }

  /**
   * Find logic compatible with given input/output contracts
   * @param inputs - Expected input contract
   * @param outputs - Expected output contract
   * @returns Array of compatible logic entries
   */
  public findCompatible(
    inputs?: Record<string, string>,
    outputs?: Record<string, string>
  ): LogicRegistryEntry[] {
    const allLogic = Array.from(this.logicByName.values());

    return allLogic.filter((entry) => {
      const { metadata } = entry;

      // Check input compatibility
      if (inputs && metadata.inputs) {
        const inputsMatch = Object.entries(inputs).every(
          ([key, type]) => metadata.inputs![key] === type
        );
        if (!inputsMatch) return false;
      }

      // Check output compatibility
      if (outputs && metadata.outputs) {
        const outputsMatch = Object.entries(outputs).every(
          ([key, type]) => metadata.outputs![key] === type
        );
        if (!outputsMatch) return false;
      }

      return true;
    });
  }

  /**
   * Get all logic that the given logic depends on
   * @param name - Logic name
   * @returns Array of dependency names
   */
  public getDependencies(name: string): string[] {
    const entry = this.logicByName.get(name);
    if (!entry) {
      return [];
    }

    const dependencies = new Set<string>();

    // Add direct invocations
    if (entry.metadata.invokes) {
      entry.metadata.invokes.forEach((dep) => dependencies.add(dep));
    }

    // Add composed logic (for orchestration)
    if (entry.metadata.composedOf) {
      entry.metadata.composedOf.forEach((ref) => {
        if (typeof ref.logic === 'string') {
          dependencies.add(ref.logic);
        }
      });
    }

    return Array.from(dependencies);
  }

  /**
   * Check if logic has cyclic dependencies
   * @param name - Logic name to check
   * @param visited - Set of visited logic names (used for recursion)
   * @param path - Current dependency path (used for recursion)
   * @returns True if cyclic dependency detected
   */
  public hasCyclicDependency(
    name: string,
    visited: Set<string> = new Set(),
    path: Set<string> = new Set()
  ): boolean {
    // If we've seen this logic in the current path, we have a cycle
    if (path.has(name)) {
      return true;
    }

    // If we've already fully explored this logic, no need to check again
    if (visited.has(name)) {
      return false;
    }

    // Mark as visited and add to current path
    visited.add(name);
    path.add(name);

    // Check all dependencies
    const dependencies = this.getDependencies(name);
    for (const dep of dependencies) {
      if (this.hasCyclicDependency(dep, visited, path)) {
        return true;
      }
    }

    // Remove from current path (backtrack)
    path.delete(name);

    return false;
  }

  /**
   * Get all registered logic
   * @returns Array of all logic entries
   */
  public getAll(): LogicRegistryEntry[] {
    return Array.from(this.logicByName.values());
  }

  /**
   * Get all logic types registered
   * @returns Array of logic types
   */
  public getAllTypes(): LogicType[] {
    return Array.from(this.logicByType.keys());
  }

  /**
   * Get all contexts registered
   * @returns Array of context names
   */
  public getAllContexts(): string[] {
    return Array.from(this.logicByContext.keys());
  }

  /**
   * Clear all registered logic (useful for testing)
   */
  public clear(): void {
    this.logicByName.clear();
    this.logicByType.clear();
    this.logicByContext.clear();
  }

  /**
   * Get registry statistics
   * @returns Statistics about registered logic
   */
  public getStats(): {
    totalLogic: number;
    byType: Record<LogicType, number>;
    byContext: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    for (const [type, names] of this.logicByType.entries()) {
      byType[type] = names.length;
    }

    const byContext: Record<string, number> = {};
    for (const [context, names] of this.logicByContext.entries()) {
      byContext[context] = names.length;
    }

    return {
      totalLogic: this.logicByName.size,
      byType: byType as Record<LogicType, number>,
      byContext,
    };
  }
}
