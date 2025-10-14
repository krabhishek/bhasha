/**
 * Behavior Registry
 * Singleton registry for all behavior components with semantic discovery
 * @module @bhumika/bhasha/decorators/behavior
 */

import type { BehaviorMetadata, BehaviorExecutionMode, BehaviorContractType, ExpectationMetadata } from '../../types/decorator-metadata.types.js';
import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import { getMetadata } from '../../utils/metadata.utils.js';
import { TestRegistry } from '../test/test.registry.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Extended behavior metadata with resolution tracking
 */
interface BehaviorMetadataWithResolution extends BehaviorMetadata {
  _needsResolution?: boolean;
  _parentClass?: Constructor;
}

/**
 * Registry entry containing both metadata and constructor
 */
interface BehaviorRegistryEntry {
  metadata: BehaviorMetadataWithResolution;
  constructor: Constructor;
}

/**
 * BehaviorRegistry - Singleton registry for all behaviors
 *
 * Provides semantic discovery and querying capabilities for:
 * - Finding behaviors by name, context, expectation
 * - Finding reusable behaviors (no expectationId)
 * - Finding behaviors by execution mode or type
 * - Tracking which behaviors implement which expectations
 *
 * @example
 * ```typescript
 * const registry = BehaviorRegistry.getInstance();
 *
 * // Get behavior by name
 * const behavior = registry.getByName('ProcessDeposit');
 *
 * // Get all behaviors in context
 * const behaviors = registry.getByContext('Piggy Bank');
 *
 * // Get reusable behaviors
 * const reusable = registry.getReusable();
 *
 * // Get async behaviors
 * const async = registry.getByExecutionMode('deferred');
 * ```
 */
export class BehaviorRegistry {
  private static instance: BehaviorRegistry;

  /**
   * Map of behavior name -> registry entry
   */
  private readonly behaviorsByName = new Map<string, BehaviorRegistryEntry>();

  /**
   * Map of context -> array of behavior names
   */
  private readonly behaviorsByContext = new Map<string, string[]>();

  /**
   * Map of expectation ID -> array of behavior names
   */
  private readonly behaviorsByExpectation = new Map<string, string[]>();

  /**
   * Map of execution mode -> array of behavior names
   */
  private readonly behaviorsByExecutionMode = new Map<BehaviorExecutionMode, string[]>();

  /**
   * Map of behavior type -> array of behavior names
   */
  private readonly behaviorsByType = new Map<string, string[]>();

  /**
   * Set of behavior names that need resolution (for inline behaviors)
   */
  private readonly unresolvedBehaviors = new Set<string>();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BehaviorRegistry {
    if (!BehaviorRegistry.instance) {
      BehaviorRegistry.instance = new BehaviorRegistry();
    }
    return BehaviorRegistry.instance;
  }

  /**
   * Auto-resolve inline behaviors by inheriting expectationId from parent Expectation
   * Called lazily before any query operation
   * @private
   */
  private resolveInlineBehaviors(): void {
    if (this.unresolvedBehaviors.size === 0) {
      return; // Nothing to resolve
    }

    for (const behaviorName of this.unresolvedBehaviors) {
      const entry = this.behaviorsByName.get(behaviorName);
      if (!entry) {
        continue;
      }

      const behavior = entry.metadata;

      // Skip if already resolved or no parent class
      if (!behavior._needsResolution || !behavior._parentClass) {
        this.unresolvedBehaviors.delete(behaviorName);
        continue;
      }

      // Get parent Expectation metadata
      const expectationMeta = getMetadata<ExpectationMetadata>(
        METADATA_KEYS.EXPECTATION,
        behavior._parentClass
      );

      if (!expectationMeta) {
        console.warn(
          `@Behavior "${behavior.name}": Cannot resolve - parent Expectation metadata not found`
        );
        continue;
      }

      // Resolve inherited field
      if (!behavior.expectationId && expectationMeta.expectationId) {
        behavior.expectationId = expectationMeta.expectationId;

        // Re-index by expectation
        const expectationIndex = this.behaviorsByExpectation.get(behavior.expectationId) || [];
        if (!expectationIndex.includes(behaviorName)) {
          expectationIndex.push(behaviorName);
          this.behaviorsByExpectation.set(behavior.expectationId, expectationIndex);
        }
      }

      // Mark as resolved
      delete behavior._needsResolution;
      delete behavior._parentClass;
      this.unresolvedBehaviors.delete(behaviorName);
    }
  }

  /**
   * Register behavior in the registry
   * Called automatically by @Behavior decorator
   *
   * @param metadata - Behavior metadata (may include _needsResolution and _parentClass)
   * @param constructor - Behavior class constructor
   * @throws Error if behavior with same name already exists
   */
  public register(metadata: BehaviorMetadata, constructor: Constructor): void {
    const metadataWithResolution = metadata as BehaviorMetadataWithResolution;
    const { name, expectationId, executionMode, _needsResolution } = metadataWithResolution;
    const contractType = metadataWithResolution.behaviorContract?.type;

    // Check for duplicates
    if (this.behaviorsByName.has(name)) {
      throw new Error(
        `@Behavior "${name}": Behavior with this name already exists. ` +
        `Please use a unique name for each behavior.`
      );
    }

    // Store in main registry
    this.behaviorsByName.set(name, { metadata: metadataWithResolution, constructor });

    // Track if needs resolution
    if (_needsResolution) {
      this.unresolvedBehaviors.add(name);
    }

    // Index by context (if provided)
    const context = metadata.context;
    if (context) {
      const contextIndex = this.behaviorsByContext.get(context) || [];
      contextIndex.push(name);
      this.behaviorsByContext.set(context, contextIndex);
    }

    // Index by expectation (if provided and not unresolved)
    if (expectationId) {
      const expectationIndex = this.behaviorsByExpectation.get(expectationId) || [];
      expectationIndex.push(name);
      this.behaviorsByExpectation.set(expectationId, expectationIndex);
    }

    // Index by execution mode (if provided)
    if (executionMode) {
      const modeIndex = this.behaviorsByExecutionMode.get(executionMode) || [];
      modeIndex.push(name);
      this.behaviorsByExecutionMode.set(executionMode, modeIndex);
    }

    // Index by type (from behaviorContract)
    if (contractType) {
      const typeIndex = this.behaviorsByType.get(contractType) || [];
      typeIndex.push(name);
      this.behaviorsByType.set(contractType, typeIndex);
    }
  }

  /**
   * Get behavior by name
   * @param name - Behavior name
   * @returns Registry entry or undefined
   */
  public getByName(name: string): BehaviorRegistryEntry | undefined {
    return this.behaviorsByName.get(name);
  }

  /**
   * Get all behaviors in a specific context
   * @param context - Bounded context name
   * @returns Array of behavior entries
   */
  public getByContext(context: string): BehaviorRegistryEntry[] {
    const names = this.behaviorsByContext.get(context) || [];
    return names
      .map((name) => this.behaviorsByName.get(name))
      .filter((entry): entry is BehaviorRegistryEntry => entry !== undefined);
  }

  /**
   * Get all behaviors for a specific expectation
   * @param expectationId - Expectation ID
   * @returns Array of behavior entries
   */
  public getByExpectation(expectationId: string): BehaviorRegistryEntry[] {
    this.resolveInlineBehaviors(); // Auto-resolve before query
    const names = this.behaviorsByExpectation.get(expectationId) || [];
    return names
      .map((name) => this.behaviorsByName.get(name))
      .filter((entry): entry is BehaviorRegistryEntry => entry !== undefined);
  }

  /**
   * Get all behaviors with a specific execution mode
   * @param mode - Execution mode
   * @returns Array of behavior entries
   */
  public getByExecutionMode(mode: BehaviorExecutionMode): BehaviorRegistryEntry[] {
    const names = this.behaviorsByExecutionMode.get(mode) || [];
    return names
      .map((name) => this.behaviorsByName.get(name))
      .filter((entry): entry is BehaviorRegistryEntry => entry !== undefined);
  }

  /**
   * Get all behaviors with a specific contract type
   * @param type - Behavior contract type
   * @returns Array of behavior entries
   */
  public getByType(type: BehaviorContractType): BehaviorRegistryEntry[] {
    const names = this.behaviorsByType.get(type) || [];
    return names
      .map((name) => this.behaviorsByName.get(name))
      .filter((entry): entry is BehaviorRegistryEntry => entry !== undefined);
  }

  /**
   * Get all reusable behaviors (no expectationId)
   * These behaviors can be attached to multiple expectations
   * @returns Array of reusable behavior entries
   */
  public getReusable(): BehaviorRegistryEntry[] {
    const allBehaviors = Array.from(this.behaviorsByName.values());
    return allBehaviors.filter((entry) => !entry.metadata.expectationId);
  }

  /**
   * Get all expectation-specific behaviors (has expectationId)
   * @returns Array of expectation-specific behavior entries
   */
  public getExpectationSpecific(): BehaviorRegistryEntry[] {
    const allBehaviors = Array.from(this.behaviorsByName.values());
    return allBehaviors.filter((entry) => entry.metadata.expectationId !== undefined);
  }

  /**
   * Get all registered behaviors
   * @returns Array of all behavior entries
   */
  public getAll(): BehaviorRegistryEntry[] {
    this.resolveInlineBehaviors(); // Auto-resolve before query
    return Array.from(this.behaviorsByName.values());
  }

  /**
   * Get all contexts that have behaviors
   * @returns Array of context names
   */
  public getAllContexts(): string[] {
    return Array.from(this.behaviorsByContext.keys());
  }

  /**
   * Get all execution modes used
   * @returns Array of execution modes
   */
  public getAllExecutionModes(): BehaviorExecutionMode[] {
    return Array.from(this.behaviorsByExecutionMode.keys());
  }

  /**
   * Get test coverage for each behavior
   * Returns a map of behavior name -> number of tests
   * @returns Map of behavior name to test count
   */
  public getCoverageByBehavior(): Map<string, number> {
    const testRegistry = TestRegistry.getInstance();
    const coverage = new Map<string, number>();

    // Iterate through all behaviors
    for (const behaviorName of this.behaviorsByName.keys()) {
      const tests = testRegistry.getByBehavior(behaviorName);
      coverage.set(behaviorName, tests.length);
    }

    return coverage;
  }

  /**
   * Clear all registered behaviors (useful for testing)
   */
  public clear(): void {
    this.behaviorsByName.clear();
    this.behaviorsByContext.clear();
    this.behaviorsByExpectation.clear();
    this.behaviorsByExecutionMode.clear();
    this.behaviorsByType.clear();
  }

  /**
   * Get registry statistics
   * @returns Statistics about registered behaviors
   */
  public getStats(): {
    totalBehaviors: number;
    reusableBehaviors: number;
    expectationSpecific: number;
    behaviorsWithTests: number;
    behaviorsWithoutTests: number;
    averageTestsPerBehavior: number;
    byContext: Record<string, number>;
    byExecutionMode: Record<string, number>;
  } {
    this.resolveInlineBehaviors(); // Auto-resolve before query
    const byContext: Record<string, number> = {};
    for (const [context, names] of this.behaviorsByContext.entries()) {
      byContext[context] = names.length;
    }

    const byExecutionMode: Record<string, number> = {};
    for (const [mode, names] of this.behaviorsByExecutionMode.entries()) {
      byExecutionMode[mode] = names.length;
    }

    // Calculate test coverage statistics
    const coverage = this.getCoverageByBehavior();
    let behaviorsWithTests = 0;
    let totalTests = 0;

    for (const testCount of coverage.values()) {
      if (testCount > 0) {
        behaviorsWithTests++;
      }
      totalTests += testCount;
    }

    const totalBehaviors = this.behaviorsByName.size;
    const behaviorsWithoutTests = totalBehaviors - behaviorsWithTests;
    const averageTestsPerBehavior = totalBehaviors > 0
      ? Math.round((totalTests / totalBehaviors) * 100) / 100
      : 0;

    return {
      totalBehaviors,
      reusableBehaviors: this.getReusable().length,
      expectationSpecific: this.getExpectationSpecific().length,
      behaviorsWithTests,
      behaviorsWithoutTests,
      averageTestsPerBehavior,
      byContext,
      byExecutionMode,
    };
  }
}
