/**
 * @Logic Decorator
 * Marks a class as an executable logic component
 * @module @bhumika/bhasha/decorators/logic
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type {
  LogicMetadata,
  LogicType,
  LogicExecutionStrategy,
  LogicReference,
  ContextReference,
} from '../../types/decorator-metadata.types.js';
import { setMetadata } from '../../utils/metadata.utils.js';
import { extractContextName } from '../../utils/class-reference.utils.js';
import { LogicRegistry } from './logic.registry.js';

/**
 * Logic decorator options
 */
export interface LogicOptions {
  /**
   * Logic name (defaults to class name if not provided)
   */
  name?: string;

  /**
   * Logic type (required)
   * Categorizes the purpose of the logic
   */
  type: LogicType;

  /**
   * Input contract - describes expected inputs
   * Example: { email: 'string', age: 'number' }
   */
  inputs?: Record<string, string>;

  /**
   * Output contract - describes expected outputs
   * Example: { isValid: 'boolean', errors: 'string[]' }
   */
  outputs?: Record<string, string>;

  /**
   * Is this logic pure (no side effects)?
   * Pure logic can be cached and memoized
   * @default false
   */
  pure?: boolean;

  /**
   * Is this logic idempotent (safe to retry)?
   * Idempotent logic produces same result for same input
   * @default false
   */
  idempotent?: boolean;

  /**
   * Can results be cached?
   * @default false
   */
  cacheable?: boolean;

  /**
   * Other logic/services this logic invokes
   * Used for dependency tracking
   */
  invokes?: string[];

  /**
   * Required services/repositories for dependency injection
   */
  requires?: string[];

  /**
   * Maximum execution time (e.g., '5s', '100ms')
   */
  timeout?: string;

  /**
   * Can be retried on failure?
   * @default false
   */
  retryable?: boolean;

  /**
   * Bounded context this logic belongs to
   */
  context?: ContextReference;

  /**
   * Aggregate type this logic operates on
   */
  aggregateType?: string;

  /**
   * Entity types this logic applies to
   */
  appliesTo?: string[];

  /**
   * Logic components to orchestrate (required for type: 'orchestration')
   */
  composedOf?: LogicReference[];

  /**
   * How to execute composed logic (for orchestration type)
   */
  strategy?: LogicExecutionStrategy;

  /**
   * Rule type (for type: 'rule')
   */
  ruleType?: 'validation' | 'business' | 'constraint';

  /**
   * Policy type (for type: 'policy')
   */
  policyType?: string;

  /**
   * Expectation ID (for type: 'behavior')
   */
  expectationId?: string;

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
}

/**
 * @Logic decorator
 * Marks a class as an executable logic component
 *
 * All logic classes MUST implement IExecutableLogic<TInput, TOutput> interface
 * which requires an execute() method.
 *
 * This decorator:
 * - Validates required fields based on type
 * - Stores metadata using Symbol.metadata (Stage 3)
 * - Auto-registers in LogicRegistry for discovery
 * - Supports logic composition via composedOf
 *
 * @param options - Logic configuration
 * @returns Class decorator
 *
 * @example Basic validation logic
 * ```typescript
 * ⁣@Logic({
 *   type: 'validation',
 *   inputs: { email: 'string' },
 *   outputs: { isValid: 'boolean' },
 *   pure: true,
 * })
 * class ValidateEmailLogic implements IExecutableLogic<string, boolean> {
 *   execute(email: string): boolean {
 *     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 *   }
 * }
 * ```
 *
 * @example Orchestration logic with composition
 * ```typescript
 * ⁣@Logic({
 *   type: 'orchestration',
 *   composedOf: [
 *     { logic: 'ValidateInput' },
 *     { logic: 'ProcessData' },
 *     { logic: 'SaveResult' },
 *   ],
 *   strategy: 'sequence',
 * })
 * class ProcessOrderLogic implements IExecutableLogic<Order, OrderResult> {
 *   execute(order: Order): OrderResult {
 *     // Orchestration implementation
 *   }
 * }
 * ```
 *
 * @example Behavior logic linked to expectation
 * ```typescript
 * ⁣@Logic({
 *   type: 'behavior',
 *   expectationId: 'deposit-money-EXP-001',
 *   context: 'Piggy Bank',
 * })
 * class ProcessDepositBehavior implements IExecutableLogic<DepositData, DepositResult> {
 *   execute(data: DepositData): DepositResult {
 *     // Behavior implementation
 *   }
 * }
 * ```
 */
export function Logic(options: LogicOptions) {
  return function <T extends new (...args: never[]) => unknown>(
    target: T,
    context: ClassDecoratorContext<T>
  ): T {
    const logicName = options.name || String(context.name);

    // Extract context name from reference (class or string)
    const contextRef = options.context;
    const contextName = contextRef ? extractContextName(contextRef) : undefined;

    // Validate required field: type
    if (!options.type) {
      throw new Error(`@Logic "${logicName}": type is required`);
    }

    // Validate orchestration-specific requirements
    if (options.type === 'orchestration') {
      if (!options.composedOf || options.composedOf.length === 0) {
        throw new Error(
          `@Logic "${logicName}": composedOf is required for type 'orchestration'`
        );
      }
      if (!options.strategy) {
        throw new Error(
          `@Logic "${logicName}": strategy is required for type 'orchestration'`
        );
      }
    }

    // Validate behavior-specific requirements
    if (options.type === 'behavior' && !options.expectationId) {
      console.warn(
        `@Logic "${logicName}": expectationId is recommended for type 'behavior'`
      );
    }

    // Build logic metadata
    const metadata: LogicMetadata = {
      name: logicName,
      type: options.type,
      inputs: options.inputs,
      outputs: options.outputs,
      pure: options.pure,
      idempotent: options.idempotent,
      cacheable: options.cacheable,
      invokes: options.invokes,
      requires: options.requires,
      timeout: options.timeout,
      retryable: options.retryable,
      context: contextName,
      aggregateType: options.aggregateType,
      appliesTo: options.appliesTo,
      composedOf: options.composedOf,
      strategy: options.strategy,
      ruleType: options.ruleType,
      policyType: options.policyType,
      expectationId: options.expectationId,
      description: options.description,
      tags: options.tags,
      examples: options.examples,
    };

    // Store metadata and register in registry using Stage 3 initializer
    context.addInitializer(function (this: unknown) {
      const constructor = (this as object).constructor as new (...args: never[]) => unknown;

      // Store metadata using Symbol.metadata
      setMetadata(METADATA_KEYS.LOGIC, metadata, constructor);

      // Auto-register in LogicRegistry
      const registry = LogicRegistry.getInstance();
      registry.register(metadata, constructor);
    });

    return target;
  };
}
