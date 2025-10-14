/**
 * @Test Decorator
 * Marks a class or method as a Test that validates an expectation or behavior
 * Supports both standalone and inline patterns
 * @module @bhumika/bhasha/decorators/test
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { TestMetadata, TestType } from '../../types/decorator-metadata.types.js';
import { TestRegistry } from './test.registry.js';
import { extractExpectationId, extractBehaviorName } from '../../utils/class-reference.utils.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Test decorator options
 */
export interface TestOptions {
  /**
   * Test name (defaults to class/method name if not provided)
   */
  name?: string;

  /**
   * Human-readable description of what this test validates
   * Provides context and intent for the test
   */
  description?: string;

  /**
   * Behavior this test validates (PREFERRED)
   *
   * Tests should validate Behaviors (the HOW), not Expectations (the WHAT).
   * The expectation is automatically derived from the Behavior's metadata.
   *
   * Can be either:
   * - A Behavior class (with @Behavior decorator) for type-safe references
   * - A string behavior name for flexibility
   *
   * For inline test methods, this is auto-inherited from parent Behavior.
   */
  behavior?: Constructor | string;

  /**
   * Expectation this test validates (FALLBACK)
   *
   * Use this only when testing at the Expectation level (integration tests).
   * Prefer using `behavior` instead for unit tests of specific behaviors.
   *
   * Can be either:
   * - An Expectation class (with @Expectation decorator) for type-safe references
   * - A string expectation ID for flexibility
   *
   * Required only if `behavior` is not provided for standalone test classes.
   */
  expectation?: Constructor | string;

  /**
   * Test type (required)
   */
  type: TestType;

  /**
   * Test framework (Jest, Vitest, Playwright, etc.)
   */
  framework?: string;

  /**
   * Test file path (auto-detected if not provided)
   */
  file?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Related test IDs (for test suites/dependencies)
   */
  relatedTests?: string[];
}

/**
 * @Test decorator (supports both class and method decorators)
 *
 * Tests are automatically registered in TestRegistry for coverage analysis
 * Each test must be linked to an expectation via expectationId
 *
 * Test ID is auto-generated: {EXPECTATION_ID}-TEST-{NUMBER}
 *
 * Pattern 1: Standalone Test Class (Reusable)
 * ```typescript
 * ⁣@Test({
 *   expectationId: 'deposit-money-EXP-001',
 *   behaviorId: 'ValidateAmountBehavior',
 *   type: 'unit',
 *   framework: 'vitest'
 * })
 * export class ValidateAmountTests {
 *   // Test implementation in __tests__/validate-amount.test.ts
 * }
 * ```
 *
 * Pattern 2: Inline Test Method (Behavior-Specific)
 * ```typescript
 * ⁣@Behavior({
 *   expectationId: 'deposit-money-EXP-001',
 *   type: 'sync'
 * })
 * class ValidateAmountBehavior {
 *   ⁣@Test({
 *     type: 'unit',
 *     framework: 'vitest'
 *   })
 *   shouldAcceptPositiveNumbers() {}  // expectationId & behaviorId auto-inherited
 *
 *   ⁣@Test({
 *     type: 'unit',
 *     framework: 'vitest'
 *   })
 *   shouldRejectNegativeNumbers() {}  // expectationId & behaviorId auto-inherited
 * }
 * ```
 *
 * @param options - Test configuration
 * @returns Class or method decorator
 */
export function Test(options: TestOptions): ClassDecorator & MethodDecorator {
  // Return a unified decorator that handles both cases
  return function (
    target: unknown,
    context?: ClassMethodDecoratorContext | ClassDecoratorContext
  ): unknown {
    // Handle both old-style decorators (no context) and new Stage 3 decorators (with context)
    if (!context) {
      throw new Error('@Test requires Stage 3 decorator support (TypeScript 5.0+)');
    }

    const isClassDecorator = context.kind === 'class';
    const isMethodDecorator = context.kind === 'method';

    if (!isClassDecorator && !isMethodDecorator) {
      throw new Error('@Test can only be applied to classes or methods');
    }

    const testName = options.name || String(context.name);

    // Validate required fields
    if (!options.type) {
      throw new Error(
        `@Test "${testName}": type is required`
      );
    }

    if (isClassDecorator) {
      // Pattern 1: Standalone Test Class
      const classContext = context as ClassDecoratorContext;

      // Standalone tests are reusable and don't require behavior/expectation
      // They will be linked when referenced by a Behavior's `tests` array

      // Store original references (optional - for explicit linking)
      const behaviorRef = options.behavior;
      const expectationRef = options.expectation;

      // Build test metadata (testId will be set during registration)
      const metadata: TestMetadata = {
        name: testName,
        description: options.description,
        testId: undefined, // Will be set by registry
        expectationId: undefined, // Will be resolved in initializer
        behaviorId: undefined, // Will be resolved in initializer
        type: options.type,
        framework: options.framework,
        file: options.file,
        tags: options.tags,
        relatedTests: options.relatedTests,
      };

      // Store metadata using context.metadata (Stage 3 way)
      classContext.metadata[METADATA_KEYS.TEST] = metadata;

      classContext.addInitializer(function (this: unknown) {
        const constructor = (this as object).constructor as new (...args: never[]) => unknown;

        // Priority 1: Extract from behavior (preferred)
        if (behaviorRef) {
          const behaviorId = extractBehaviorName(behaviorRef);

          if (!behaviorId && typeof behaviorRef !== 'string') {
            throw new Error(
              `@Test "${testName}": Could not resolve behavior reference. ` +
              `Make sure the @Behavior decorator is applied and the class is imported.`
            );
          }

          metadata.behaviorId = behaviorId || (typeof behaviorRef === 'string' ? behaviorRef : undefined);

          // Try to extract expectationId from the Behavior's metadata
          if (typeof behaviorRef !== 'string') {
            const behaviorExpectationId = extractExpectationId(behaviorRef);
            if (behaviorExpectationId) {
              metadata.expectationId = behaviorExpectationId;
            }
          }
        }

        // Priority 2: Extract from expectation (fallback)
        if (expectationRef && !metadata.expectationId) {
          const expectationId = extractExpectationId(expectationRef);

          if (!expectationId) {
            throw new Error(
              `@Test "${testName}": Could not resolve expectation reference. ` +
              `Make sure the @Expectation decorator is applied and the class is imported.`
            );
          }

          metadata.expectationId = expectationId;
        }

        // For standalone tests, expectationId is optional
        // It will be set when the test is referenced by a Behavior
        if (!metadata.expectationId) {
          // This is OK for reusable standalone tests
          // The expectationId will be inherited from the Behavior that references this test
          console.info(
            `@Test "${testName}": No explicit behavior/expectation provided. ` +
            `This test is reusable and will inherit context when referenced by a Behavior.`
          );
        }

        // Auto-register with registry
        const registry = TestRegistry.getInstance();
        const generatedTestId = registry.register(metadata, constructor);

        // Update metadata with generated testId
        metadata.testId = generatedTestId;
      });

      return target;
    } else {
      // Pattern 2: Inline Test Method
      const methodContext = context as ClassMethodDecoratorContext;

      // Store original references (could be class or string)
      const behaviorRef = options.behavior;
      const expectationRef = options.expectation;

      // Build test metadata with placeholders for inherited values
      interface TestMetadataWithResolution extends TestMetadata {
        _needsResolution?: boolean;
        _parentClass?: new (...args: never[]) => unknown;
      }

      const metadata: TestMetadataWithResolution = {
        name: testName,
        description: options.description,
        testId: undefined, // Will be set by registry
        expectationId: '', // Will be resolved by registry or from class reference
        behaviorId: undefined, // Will be resolved by registry or from class reference
        type: options.type,
        framework: options.framework,
        file: options.file,
        tags: options.tags,
        relatedTests: options.relatedTests,
        _needsResolution: true, // Mark for lazy resolution
      };

      // Use addInitializer to register immediately with TestRegistry
      methodContext.addInitializer(function (this: unknown) {
        const constructor = (this as object).constructor as new (...args: never[]) => unknown;

        // Priority 1: Extract from behavior (preferred)
        if (behaviorRef) {
          const behaviorId = extractBehaviorName(behaviorRef);

          if (!behaviorId && typeof behaviorRef !== 'string') {
            console.warn(
              `@Test "${testName}": Could not resolve behavior reference. ` +
              `Make sure the @Behavior decorator is applied and the class is imported.`
            );
          }

          metadata.behaviorId = behaviorId || (typeof behaviorRef === 'string' ? behaviorRef : undefined);

          // Try to extract expectationId from the Behavior's metadata
          if (typeof behaviorRef !== 'string') {
            const behaviorExpectationId = extractExpectationId(behaviorRef);
            if (behaviorExpectationId) {
              metadata.expectationId = behaviorExpectationId;
            }
          }
        }

        // Priority 2: Extract from expectation (fallback)
        if (expectationRef && !metadata.expectationId) {
          const expectationId = extractExpectationId(expectationRef);

          if (!expectationId && typeof expectationRef !== 'string') {
            console.warn(
              `@Test "${testName}": Could not resolve expectation reference. ` +
              `Make sure the @Expectation decorator is applied and the class is imported.`
            );
          }

          metadata.expectationId = expectationId || (typeof expectationRef === 'string' ? expectationRef : '');
        }

        // Store parent class reference for lazy resolution (if expectationId/behaviorId not explicitly provided)
        metadata._parentClass = constructor;

        // Register immediately with TestRegistry (will be marked as unresolved if expectationId is empty)
        const registry = TestRegistry.getInstance();
        const generatedTestId = registry.register(metadata, constructor);

        // Update metadata with generated testId
        metadata.testId = generatedTestId;
      });

      return undefined;
    }
  } as ClassDecorator & MethodDecorator;
}
