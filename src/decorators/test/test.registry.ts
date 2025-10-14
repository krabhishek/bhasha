/**
 * Test Registry
 * Singleton registry for all tests with coverage analysis
 * @module @bhumika/bhasha/decorators/test
 */

import type { TestMetadata, TestType } from '../../types/decorator-metadata.types.js';
import { BehaviorRegistry } from '../behavior/behavior.registry.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Extended test metadata with resolution tracking
 */
interface TestMetadataWithResolution extends TestMetadata {
  _needsResolution?: boolean;
  _parentClass?: Constructor;
}

/**
 * Registry entry containing both metadata and constructor
 */
interface TestRegistryEntry {
  metadata: TestMetadataWithResolution;
  constructor: Constructor;
}

/**
 * TestRegistry - Singleton registry for all tests
 *
 * Provides:
 * - Registration and lookup by testId, expectationId, type
 * - Coverage analysis (which expectations have tests)
 * - Gap analysis (expectations without tests)
 * - Priority-based queries
 *
 * @example
 * ```typescript
 * const registry = TestRegistry.getInstance();
 *
 * // Get all tests for an expectation
 * const tests = registry.getByExpectation('deposit-money-EXP-001');
 *
 * // Check coverage
 * const coverage = registry.getCoverage();
 * console.log(`${coverage.totalExpectations} expectations, ${coverage.coveredExpectations} have tests`);
 *
 * // Find gaps
 * const gaps = registry.getGaps();
 * console.log(`Missing tests for: ${gaps.join(', ')}`);
 * ```
 */
export class TestRegistry {
  private static instance: TestRegistry;

  /**
   * Map of test ID -> registry entry
   */
  private readonly testsById = new Map<string, TestRegistryEntry>();

  /**
   * Map of expectation ID -> array of test IDs
   */
  private readonly testsByExpectation = new Map<string, string[]>();

  /**
   * Map of test type -> array of test IDs
   */
  private readonly testsByType = new Map<TestType, string[]>();

  /**
   * Map of behavior ID -> array of test IDs
   */
  private readonly testsByBehavior = new Map<string, string[]>();

  /**
   * Counter for auto-generating test IDs per expectation
   */
  private readonly testCounters = new Map<string, number>();

  /**
   * Set of test IDs that need resolution (for inline tests)
   */
  private readonly unresolvedTests = new Set<string>();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TestRegistry {
    if (!TestRegistry.instance) {
      TestRegistry.instance = new TestRegistry();
    }
    return TestRegistry.instance;
  }

  /**
   * Generate unique test ID for an expectation
   * Format: {EXPECTATION_ID}-TEST-{NUMBER}
   *
   * @param expectationId - Expectation ID
   * @returns Generated test ID
   */
  private generateTestId(expectationId: string): string {
    const counter = (this.testCounters.get(expectationId) || 0) + 1;
    this.testCounters.set(expectationId, counter);
    return `${expectationId}-TEST-${counter.toString().padStart(3, '0')}`;
  }

  /**
   * Auto-resolve inline tests by inheriting expectationId and behaviorId from parent Behavior
   * Called lazily before any query operation
   * @private
   */
  private resolveInlineTests(): void {
    if (this.unresolvedTests.size === 0) {
      return; // Nothing to resolve
    }

    const behaviorRegistry = BehaviorRegistry.getInstance();

    for (const testId of this.unresolvedTests) {
      const entry = this.testsById.get(testId);
      if (!entry) {
        continue;
      }

      const test = entry.metadata;

      // Skip if already resolved or no parent class
      if (!test._needsResolution || !test._parentClass) {
        this.unresolvedTests.delete(testId);
        continue;
      }

      // Get parent Behavior metadata from BehaviorRegistry
      // We query the registry instead of Symbol.metadata because the metadata
      // is stored in the registry during registration, which happens before resolution
      const behaviorEntry = behaviorRegistry.getByName(test._parentClass?.name || '');

      if (!behaviorEntry) {
        console.warn(
          `@Test "${test.name}": Cannot resolve - parent Behavior "${test._parentClass?.name}" not found in registry`
        );
        continue;
      }

      const behaviorMeta = behaviorEntry.metadata;

      // Resolve inherited fields
      if (!test.expectationId && behaviorMeta.expectationId) {
        test.expectationId = behaviorMeta.expectationId;

        // Re-index by expectation
        const expectationIndex = this.testsByExpectation.get(test.expectationId) || [];
        if (!expectationIndex.includes(testId)) {
          expectationIndex.push(testId);
          this.testsByExpectation.set(test.expectationId, expectationIndex);
        }
      }

      if (!test.behaviorId && behaviorMeta.name) {
        test.behaviorId = behaviorMeta.name;
      }

      // Re-index by behavior if we now have behaviorId
      if (test.behaviorId) {
        const behaviorIndex = this.testsByBehavior.get(test.behaviorId) || [];
        if (!behaviorIndex.includes(testId)) {
          behaviorIndex.push(testId);
          this.testsByBehavior.set(test.behaviorId, behaviorIndex);
        }
      }

      // Mark as resolved
      delete test._needsResolution;
      delete test._parentClass;
      this.unresolvedTests.delete(testId);
    }
  }

  /**
   * Register test in the registry
   * Called automatically by @Test decorator
   *
   * @param metadata - Test metadata (may include _needsResolution and _parentClass)
   * @param constructor - Test class constructor
   * @returns Generated test ID
   */
  public register(
    metadata: TestMetadata,
    constructor: Constructor
  ): string {
    const metadataWithResolution = metadata as TestMetadataWithResolution;
    const { expectationId, behaviorId, type, _needsResolution } = metadataWithResolution;

    // Generate test ID if not provided
    // For unresolved tests, use a temporary expectationId or generate one
    const effectiveExpectationId = expectationId || 'UNRESOLVED';
    const testId = metadata.testId || this.generateTestId(effectiveExpectationId);

    // Update metadata with generated ID
    const updatedMetadata: TestMetadataWithResolution = {
      ...metadataWithResolution,
      testId,
    };

    // Create registry entry
    const entry: TestRegistryEntry = {
      metadata: updatedMetadata,
      constructor,
    };

    // Store by test ID
    this.testsById.set(testId, entry);

    // Track if needs resolution
    if (_needsResolution) {
      this.unresolvedTests.add(testId);
    }

    // Index by expectation (if provided and not unresolved)
    if (expectationId && expectationId !== 'UNRESOLVED') {
      const expectationIndex = this.testsByExpectation.get(expectationId) || [];
      expectationIndex.push(testId);
      this.testsByExpectation.set(expectationId, expectationIndex);
    }

    // Index by type
    const typeIndex = this.testsByType.get(type) || [];
    typeIndex.push(testId);
    this.testsByType.set(type, typeIndex);

    // Index by behavior (if provided)
    if (behaviorId) {
      const behaviorIndex = this.testsByBehavior.get(behaviorId) || [];
      behaviorIndex.push(testId);
      this.testsByBehavior.set(behaviorId, behaviorIndex);
    }

    return testId;
  }

  /**
   * Get test by ID
   * @param testId - Test ID
   * @returns Registry entry or undefined
   */
  public getById(testId: string): TestRegistryEntry | undefined {
    return this.testsById.get(testId);
  }

  /**
   * Get all tests for a specific expectation
   * @param expectationId - Expectation ID
   * @returns Array of test entries
   */
  public getByExpectation(expectationId: string): TestRegistryEntry[] {
    this.resolveInlineTests(); // Auto-resolve before query
    const testIds = this.testsByExpectation.get(expectationId) || [];
    return testIds
      .map((id) => this.testsById.get(id))
      .filter((entry): entry is TestRegistryEntry => entry !== undefined);
  }

  /**
   * Get all tests of a specific type
   * @param type - Test type
   * @returns Array of test entries
   */
  public getByType(type: TestType): TestRegistryEntry[] {
    const testIds = this.testsByType.get(type) || [];
    return testIds
      .map((id) => this.testsById.get(id))
      .filter((entry): entry is TestRegistryEntry => entry !== undefined);
  }

  /**
   * Get all tests for a specific behavior
   * @param behaviorId - Behavior ID
   * @returns Array of test entries
   */
  public getByBehavior(behaviorId: string): TestRegistryEntry[] {
    this.resolveInlineTests(); // Auto-resolve before query
    const testIds = this.testsByBehavior.get(behaviorId) || [];
    return testIds
      .map((id) => this.testsById.get(id))
      .filter((entry): entry is TestRegistryEntry => entry !== undefined);
  }

  /**
   * Get all registered tests
   * @returns Array of all test entries
   */
  public getAll(): TestRegistryEntry[] {
    this.resolveInlineTests(); // Auto-resolve before query
    return Array.from(this.testsById.values());
  }

  /**
   * Get all test IDs
   * @returns Array of test IDs
   */
  public getAllTestIds(): string[] {
    return Array.from(this.testsById.keys());
  }

  /**
   * Get all expectation IDs that have tests
   * @returns Array of expectation IDs
   */
  public getCoveredExpectations(): string[] {
    return Array.from(this.testsByExpectation.keys());
  }

  /**
   * Check if an expectation has tests
   * @param expectationId - Expectation ID
   * @returns True if expectation has at least one test
   */
  public hasTests(expectationId: string): boolean {
    const tests = this.testsByExpectation.get(expectationId);
    return tests !== undefined && tests.length > 0;
  }

  /**
   * Get coverage statistics
   * NOTE: To get accurate coverage, you need to register all expectations first
   *
   * @param allExpectationIds - Optional array of all expectation IDs in the system
   * @returns Coverage statistics
   */
  public getCoverage(allExpectationIds?: string[]): {
    totalTests: number;
    totalExpectations: number;
    coveredExpectations: number;
    coveragePercentage: number;
    byType: Record<TestType, number>;
  } {
    const coveredExpectationIds = this.getCoveredExpectations();
    const totalExpectations = allExpectationIds
      ? allExpectationIds.length
      : coveredExpectationIds.length;

    const coveragePercentage =
      totalExpectations > 0
        ? (coveredExpectationIds.length / totalExpectations) * 100
        : 0;

    const byType: Partial<Record<TestType, number>> = {};
    for (const [type, testIds] of this.testsByType.entries()) {
      byType[type] = testIds.length;
    }

    return {
      totalTests: this.testsById.size,
      totalExpectations,
      coveredExpectations: coveredExpectationIds.length,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      byType: byType as Record<TestType, number>,
    };
  }

  /**
   * Get expectations without tests (gaps)
   * @param allExpectationIds - Array of all expectation IDs in the system
   * @returns Array of expectation IDs without tests
   */
  public getGaps(allExpectationIds: string[]): string[] {
    const coveredExpectationIds = new Set(this.getCoveredExpectations());
    return allExpectationIds.filter((id) => !coveredExpectationIds.has(id));
  }

  /**
   * Clear all registered tests (useful for testing)
   */
  public clear(): void {
    this.testsById.clear();
    this.testsByExpectation.clear();
    this.testsByType.clear();
    this.testsByBehavior.clear();
    this.testCounters.clear();
  }

  /**
   * Get registry statistics
   * @returns Statistics about registered tests
   */
  public getStats(): {
    totalTests: number;
    totalExpectations: number;
    byType: Record<string, number>;
    byFramework: Record<string, number>;
  } {
    this.resolveInlineTests(); // Auto-resolve before query
    const byType: Record<string, number> = {};
    for (const [type, testIds] of this.testsByType.entries()) {
      byType[type] = testIds.length;
    }

    const byFramework: Record<string, number> = {};
    for (const entry of this.testsById.values()) {
      const framework = entry.metadata.framework || 'unknown';
      byFramework[framework] = (byFramework[framework] || 0) + 1;
    }

    return {
      totalTests: this.testsById.size,
      totalExpectations: this.testsByExpectation.size,
      byType,
      byFramework,
    };
  }
}
