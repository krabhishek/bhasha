/**
 * @Behavior Decorator
 * Marks a class or method as a Behavior (implementation of an expectation)
 * Supports both standalone and inline patterns
 * @module @bhumika/bhasha/decorators/behavior
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type {
  BehaviorMetadata,
  LogicMetadata,
  BehaviorContract,
  BehaviorExecutionMode,
  ContextReference,
} from '../../types/decorator-metadata.types.js';
import { extractContextName } from '../../utils/class-reference.utils.js';
import { LogicRegistry } from '../logic/logic.registry.js';
import { BehaviorRegistry } from './behavior.registry.js';
import { mergeReferences, validateAtLeastOne } from '../../utils/reference-utils.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Behavior decorator options
 */
export interface BehaviorOptions {
  /**
   * Behavior name (defaults to class name if not provided)
   */
  name?: string;

  /**
   * What does this behavior invoke? (method, service, API, etc.)
   */
  invokes?: string;

  /**
   * The complete behavior contract - HOW this behavior fulfills the expectation
   * Moved from @Expectation to @Behavior (Phase 2.5 refactoring)
   *
   * This defines the implementation contract including:
   * - type: 'sync' | 'async' | 'event-driven' | 'batch'
   * - inputs: Expected input parameters
   * - outputs: Expected return values
   * - sla: Service level agreements
   * - errorHandling: Error handling contract
   */
  behaviorContract?: BehaviorContract;

  /**
   * Execution mode
   * @default 'immediate'
   */
  executionMode?: BehaviorExecutionMode;

  /**
   * Error handling strategy
   */
  errorHandling?: {
    strategy: 'retry' | 'fallback' | 'fail-fast' | 'circuit-breaker';
    retryConfig?: {
      maxAttempts: number;
      backoff?: 'linear' | 'exponential';
      delay?: string;
    };
    fallbackBehavior?: string;
  };

  /**
   * Performance constraints
   */
  performance?: {
    timeout?: string;
    maxLatency?: string;
    caching?: boolean;
  };

  /**
   * Bounded context this behavior belongs to
   */
  context?: ContextReference;

  /**
   * Other logic/services this behavior invokes
   */
  invokesLogic?: string[];

  /**
   * Required services/repositories for dependency injection
   */
  requires?: string[];

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Example usages for documentation
   */
  examples?: Array<{
    input: unknown;
    output: unknown;
    description?: string;
  }>;

  /**
   * Domain events emitted by this behavior
   * Useful for documenting side effects and event-driven flows
   *
   * Can be either:
   * - Event class references (type-safe): `[TransactionRecordedEvent, BalanceUpdatedEvent]`
   * - Event type strings: `['transaction.recorded', 'balance.updated']`
   * - Mixed: `[TransactionRecordedEvent, 'balance.updated']`
   */
  emitsEvents?: Array<Constructor | string>;

  /**
   * Single test that validates this behavior (singular form)
   * Can be either a test class or test name (string)
   * At least one test (singular or plural) is required
   */
  test?: Constructor | string;

  /**
   * Multiple tests that validate this behavior (plural form)
   * Array of test classes or test names (strings)
   *
   * Tests are defined separately using @Test decorator
   * This links the behavior to its test specifications
   * At least one test (singular or plural) is required
   *
   * Example: tests: [ValidateFormatTests, ValidatePositiveTests]
   */
  tests?: Array<Constructor | string>;
}

/**
 * @Behavior decorator (supports both class and method decorators)
 *
 * Behaviors implement the contracts defined by expectations.
 * They describe HOW an expectation is fulfilled.
 *
 * Pattern 1: Standalone Behavior Class (Reusable)
 * ```typescript
 * ⁣@Behavior({
 *   expectationId: 'deposit-money-EXP-001',
 *   type: 'sync',
 *   context: 'Piggy Bank',
 *   inputs: { amount: 'number', accountId: 'string' },
 *   outputs: { transactionId: 'string', newBalance: 'number' },
 *   tests: [ValidateAmountTests]
 * })
 * class ProcessDepositBehavior implements IExecutableLogic<DepositData, DepositResult> {
 *   execute(data: DepositData): DepositResult {
 *     // Process deposit logic
 *   }
 * }
 * ```
 *
 * Pattern 2: Inline Behavior Method (Expectation-Specific)
 * ```typescript
 * ⁣@Expectation({
 *   expectingStakeholder: 'Customer',
 *   providingStakeholder: 'System',
 *   description: 'Amount is validated',
 *   behaviorContract: { type: 'sync' }
 * })
 * class ValidateAmountExpectation {
 *   ⁣@Behavior({
 *     type: 'sync',
 *     tests: [FormatTests]
 *   })
 *   validateFormat() {}  // expectationId auto-inherited
 *
 *   ⁣@Behavior({
 *     type: 'sync',
 *     tests: [PositiveTests]
 *   })
 *   validatePositive() {}  // expectationId auto-inherited
 * }
 * ```
 *
 * @param options - Behavior configuration
 * @returns Class or method decorator
 */
export function Behavior(options: BehaviorOptions): ClassDecorator & MethodDecorator {
  // Return a unified decorator that handles both cases
  return function (
    target: unknown,
    context?: ClassMethodDecoratorContext | ClassDecoratorContext
  ): unknown {
    // Handle both old-style decorators (no context) and new Stage 3 decorators (with context)
    if (!context) {
      throw new Error('@Behavior requires Stage 3 decorator support (TypeScript 5.0+)');
    }

    const isClassDecorator = context.kind === 'class';
    const isMethodDecorator = context.kind === 'method';

    if (!isClassDecorator && !isMethodDecorator) {
      throw new Error('@Behavior can only be applied to classes or methods');
    }

    const behaviorName = options.name || String(context.name);

    // Extract context name from reference (class or string)
    const contextRef = options.context;
    const contextName = contextRef ? extractContextName(contextRef) : undefined;

    // Validate at least one test is provided
    validateAtLeastOne(
      options.test,
      options.tests,
      'test',
      'tests',
      '@Behavior',
      behaviorName
    );

    // Merge singular and plural test references
    const testRefs = mergeReferences(options.test, options.tests);

    // Extract test names from test references
    const testNames: string[] = [];
    for (const test of testRefs) {
      if (typeof test === 'string') {
        testNames.push(test);
      } else {
        // It's a class constructor - extract the class name
        testNames.push(test.name);
      }
    }

    if (isClassDecorator) {
      // Pattern 1: Standalone Behavior Class
      const classContext = context as ClassDecoratorContext;

      // Behaviors are now always reusable and independent
      // They don't reference expectations - expectations reference them!

      // Build behavior metadata (expectationId will be resolved in initializer)
      const behaviorMetadata: BehaviorMetadata = {
        name: behaviorName,
        expectationId: undefined, // Will be resolved in initializer
        invokes: options.invokes,
        behaviorContract: options.behaviorContract, // The complete implementation contract
        executionMode: options.executionMode || 'immediate',
        errorHandling: options.errorHandling,
        performance: options.performance,
        context: contextName,
        description: options.description,
        tags: options.tags,
        tests: testNames.length > 0 ? testNames : undefined,
      };

      // Build logic metadata (expectationId will be resolved in initializer)
      const logicMetadata: LogicMetadata = {
        name: behaviorName,
        type: 'behavior',
        inputs: options.behaviorContract?.inputs,
        outputs: options.behaviorContract?.outputs,
        expectationId: undefined, // Will be resolved in initializer
        context: contextName,
        invokes: options.invokesLogic,
        requires: options.requires,
        timeout: options.performance?.timeout,
        retryable: options.errorHandling?.strategy === 'retry',
        cacheable: options.performance?.caching ?? false,
        description: options.description,
        tags: options.tags,
        examples: options.examples,
      };

      // Store metadata using context.metadata (Stage 3 way)
      classContext.metadata[METADATA_KEYS.BEHAVIOR] = behaviorMetadata;
      classContext.metadata[METADATA_KEYS.LOGIC] = logicMetadata;

      classContext.addInitializer(function (this: unknown) {
        const constructor = (this as object).constructor as Constructor;

        // Behaviors are independent - expectationId will be set by the Expectation
        // that references this behavior (via its `behaviors` array)

        // Auto-register in LogicRegistry
        const logicRegistry = LogicRegistry.getInstance();
        logicRegistry.register(logicMetadata, constructor);

        // Auto-register in BehaviorRegistry for semantic discovery
        const behaviorRegistry = BehaviorRegistry.getInstance();
        behaviorRegistry.register(behaviorMetadata, constructor);

        // Inline tests are now auto-registered by the @Test decorator itself
        // They will be auto-resolved lazily by TestRegistry when queried
      });

      return target;
    } else {
      // Pattern 2: Inline Behavior Method
      const methodContext = context as ClassMethodDecoratorContext;

      // Build behavior metadata with placeholders for inherited values
      interface BehaviorMetadataWithResolution extends BehaviorMetadata {
        _needsResolution?: boolean;
        _parentClass?: Constructor;
      }

      const behaviorMetadata: BehaviorMetadataWithResolution = {
        name: behaviorName,
        expectationId: '', // Will be resolved by registry or from class reference
        invokes: options.invokes,
        behaviorContract: options.behaviorContract, // The complete implementation contract
        executionMode: options.executionMode || 'immediate',
        errorHandling: options.errorHandling,
        performance: options.performance,
        context: contextName,
        description: options.description,
        tags: options.tags,
        tests: testNames.length > 0 ? testNames : undefined,
        _needsResolution: true, // Mark for lazy resolution
      };

      // Build logic metadata
      const logicMetadata: LogicMetadata = {
        name: behaviorName,
        type: 'behavior',
        inputs: options.behaviorContract?.inputs,
        outputs: options.behaviorContract?.outputs,
        expectationId: '', // Will be resolved in initializer
        context: contextName,
        invokes: options.invokesLogic,
        requires: options.requires,
        timeout: options.performance?.timeout,
        retryable: options.errorHandling?.strategy === 'retry',
        cacheable: options.performance?.caching ?? false,
        description: options.description,
        tags: options.tags,
        examples: options.examples,
      };

      methodContext.addInitializer(function (this: unknown) {
        const constructor = (this as object).constructor as Constructor;

        // For inline behaviors, expectationId will be inherited from parent Expectation class
        // Store parent class reference for lazy resolution
        behaviorMetadata._parentClass = constructor;

        // Register immediately with BehaviorRegistry (will be marked as unresolved if expectationId is empty)
        const behaviorRegistry = BehaviorRegistry.getInstance();
        behaviorRegistry.register(behaviorMetadata, constructor);

        // Auto-register in LogicRegistry
        const logicRegistry = LogicRegistry.getInstance();
        logicRegistry.register(logicMetadata, constructor);
      });

      return undefined;
    }
  } as ClassDecorator & MethodDecorator;
}
