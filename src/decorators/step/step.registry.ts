/**
 * Step Registry
 * Singleton registry for all steps with ordering validation
 * @module @bhumika/bhasha/decorators/step
 */

import type { StepMetadata } from '../../types/decorator-metadata.types.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Registry entry containing both metadata and parent milestone/journey
 */
interface StepRegistryEntry {
  metadata: StepMetadata;
  parentClass: Constructor;
  parentType: 'milestone' | 'journey';
}

/**
 * StepRegistry - Singleton registry for all steps
 *
 * Provides:
 * - Registration and lookup by name, parent, actor
 * - Step ordering validation
 * - Alternative step tracking
 * - Actor-based queries
 *
 * @example
 * ```typescript
 * const registry = StepRegistry.getInstance();
 *
 * // Get all steps for a milestone
 * const steps = registry.getByParent(UserAuthMilestone);
 *
 * // Get all steps by actor
 * const userSteps = registry.getByActor('Account Owner');
 *
 * // Get optional steps
 * const optional = registry.getOptional();
 * ```
 */
export class StepRegistry {
  private static instance: StepRegistry;

  /**
   * Map of step name -> array of registry entries
   * (multiple steps can have the same name in different milestones)
   */
  private readonly stepsByName = new Map<string, StepRegistryEntry[]>();

  /**
   * Map of parent class -> array of steps
   */
  private readonly stepsByParent = new Map<Constructor, StepRegistryEntry[]>();

  /**
   * Map of actor -> array of step entries
   */
  private readonly stepsByActor = new Map<string, StepRegistryEntry[]>();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): StepRegistry {
    if (!StepRegistry.instance) {
      StepRegistry.instance = new StepRegistry();
    }
    return StepRegistry.instance;
  }

  /**
   * Register step in the registry
   * Called automatically by @Step decorator
   *
   * @param metadata - Step metadata
   * @param parentClass - Parent milestone or journey class
   * @param parentType - Type of parent ('milestone' or 'journey')
   */
  public register(
    metadata: StepMetadata,
    parentClass: Constructor,
    parentType: 'milestone' | 'journey'
  ): void {
    const { name, actor } = metadata;

    const entry: StepRegistryEntry = {
      metadata,
      parentClass,
      parentType,
    };

    // Store by name (multiple steps can have same name)
    const nameIndex = this.stepsByName.get(name) || [];
    nameIndex.push(entry);
    this.stepsByName.set(name, nameIndex);

    // Store by parent (no sorting yet - lazy sort on retrieval)
    const parentIndex = this.stepsByParent.get(parentClass) || [];
    parentIndex.push(entry);
    this.stepsByParent.set(parentClass, parentIndex);

    // Index by actor
    if (actor) {
      const actorIndex = this.stepsByActor.get(actor) || [];
      actorIndex.push(entry);
      this.stepsByActor.set(actor, actorIndex);
    }
  }

  /**
   * Get all steps with a specific name
   * @param name - Step name
   * @returns Array of step entries with this name
   */
  public getByName(name: string): StepRegistryEntry[] {
    return this.stepsByName.get(name) || [];
  }

  /**
   * Get all steps for a parent milestone or journey
   * Performs lazy sorting and validates that all steps have order defined
   * @param parentClass - Parent milestone or journey constructor
   * @returns Array of step entries (ordered by step order)
   * @throws Error if any step has undefined order
   */
  public getByParent(parentClass: Constructor): StepRegistryEntry[] {
    const entries = this.stepsByParent.get(parentClass) || [];

    if (entries.length === 0) {
      return entries;
    }

    // Validate all steps have order defined
    const stepsWithoutOrder = entries.filter(e => e.metadata.order === undefined);
    if (stepsWithoutOrder.length > 0) {
      const stepNames = stepsWithoutOrder.map(e => e.metadata.name).join(', ');
      throw new Error(
        `Steps must have order defined when retrieved: ${stepNames} in ${parentClass.name}`
      );
    }

    // Lazy sort by order
    return [...entries].sort((a, b) => a.metadata.order! - b.metadata.order!);
  }

  /**
   * Get all steps performed by a specific actor
   * @param actor - Actor/stakeholder name
   * @returns Array of step entries
   */
  public getByActor(actor: string): StepRegistryEntry[] {
    return this.stepsByActor.get(actor) || [];
  }

  /**
   * Get all optional steps
   * @returns Array of optional step entries
   */
  public getOptional(): StepRegistryEntry[] {
    const allSteps: StepRegistryEntry[] = [];
    for (const entries of this.stepsByParent.values()) {
      allSteps.push(...entries);
    }
    return allSteps.filter((entry) => entry.metadata.optional === true);
  }

  /**
   * Get all required steps
   * @returns Array of required step entries
   */
  public getRequired(): StepRegistryEntry[] {
    const allSteps: StepRegistryEntry[] = [];
    for (const entries of this.stepsByParent.values()) {
      allSteps.push(...entries);
    }
    return allSteps.filter((entry) => entry.metadata.optional !== true);
  }

  /**
   * Get steps with alternatives
   * @returns Array of step entries that have alternative steps defined
   */
  public getWithAlternatives(): StepRegistryEntry[] {
    const allSteps: StepRegistryEntry[] = [];
    for (const entries of this.stepsByParent.values()) {
      allSteps.push(...entries);
    }
    return allSteps.filter(
      (entry) => entry.metadata.alternatives && entry.metadata.alternatives.length > 0
    );
  }

  /**
   * Validate step ordering for a parent
   * Checks for undefined orders, duplicate orders, gaps, etc.
   * @param parentClass - Parent milestone or journey constructor
   * @returns Validation result with issues (if any)
   */
  public validateOrdering(parentClass: Constructor): {
    valid: boolean;
    issues: string[];
  } {
    // Get raw entries without lazy sorting to check for undefined orders
    const entries = this.stepsByParent.get(parentClass) || [];
    const issues: string[] = [];

    if (entries.length === 0) {
      return { valid: true, issues: [] };
    }

    // Check for undefined orders first
    const stepsWithoutOrder = entries.filter(e => e.metadata.order === undefined);
    if (stepsWithoutOrder.length > 0) {
      const stepNames = stepsWithoutOrder.map(e => e.metadata.name).join(', ');
      issues.push(`Steps missing order: ${stepNames}`);
      return { valid: false, issues };
    }

    const orders = entries.map((s) => s.metadata.order!);
    const uniqueOrders = new Set(orders);

    // Check for duplicate orders
    if (uniqueOrders.size !== orders.length) {
      const duplicates = orders.filter(
        (order, index) => orders.indexOf(order) !== index
      );
      issues.push(
        `Duplicate step orders found: ${duplicates.join(', ')}`
      );
    }

    // Check for gaps (not necessarily an error, but worth noting)
    const sortedOrders = Array.from(uniqueOrders).sort((a, b) => a - b);
    for (let i = 1; i < sortedOrders.length; i++) {
      if (sortedOrders[i] - sortedOrders[i - 1] > 1) {
        issues.push(
          `Gap in step ordering: ${sortedOrders[i - 1]} -> ${sortedOrders[i]}`
        );
      }
    }

    // Check if starts at 1
    if (sortedOrders[0] !== 1) {
      issues.push(`Step ordering should start at 1, but starts at ${sortedOrders[0]}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get all registered steps
   * @returns Array of all step entries
   */
  public getAll(): StepRegistryEntry[] {
    const allSteps: StepRegistryEntry[] = [];
    for (const entries of this.stepsByParent.values()) {
      allSteps.push(...entries);
    }
    return allSteps;
  }

  /**
   * Get all actors who perform steps
   * @returns Array of actor names
   */
  public getAllActors(): string[] {
    return Array.from(this.stepsByActor.keys());
  }

  /**
   * Clear all registered steps (useful for testing)
   */
  public clear(): void {
    this.stepsByName.clear();
    this.stepsByParent.clear();
    this.stepsByActor.clear();
  }

  /**
   * Get registry statistics
   * @returns Statistics about registered steps
   */
  public getStats(): {
    totalSteps: number;
    optionalSteps: number;
    requiredSteps: number;
    stepsWithAlternatives: number;
    byActor: Record<string, number>;
  } {
    const byActor: Record<string, number> = {};
    for (const [actor, entries] of this.stepsByActor.entries()) {
      byActor[actor] = entries.length;
    }

    return {
      totalSteps: this.getAll().length,
      optionalSteps: this.getOptional().length,
      requiredSteps: this.getRequired().length,
      stepsWithAlternatives: this.getWithAlternatives().length,
      byActor,
    };
  }
}
