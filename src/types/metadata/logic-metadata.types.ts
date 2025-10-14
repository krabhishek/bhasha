/**
 * Logic Metadata Types
 * Types for defining executable business logic components
 * @module @bhumika/bhasha/types/metadata
 */

import type { BaseMetadata } from './metadata.types.js';
import type { MilestoneClass } from './journey-metadata.types.js';

/**
 * Logic types - categorizes the purpose of the logic
 */
export type LogicType =
  | 'specification' // Boolean business rules (DDD Specification pattern)
  | 'policy' // Decision-making (DDD Policy pattern)
  | 'rule' // Validation/constraints (Business Rule pattern)
  | 'behavior' // Expectation implementation (BDD Behavior pattern)
  | 'calculation' // Compute derived values
  | 'transformation' // Data transformation (input → output)
  | 'validation' // Input validation
  | 'orchestration' // Workflow coordination
  | 'query' // Read operations
  | 'command' // Write operations
  | 'event-handler'; // Event handler (reacts to domain events)

/**
 * Logic execution strategy for composite logic
 */
export type LogicExecutionStrategy = 'sequence' | 'parallel' | 'conditional';

/**
 * Logic reference for composition
 */
export interface LogicReference {
  /**
   * Logic class or name
   */
  logic: string | MilestoneClass;

  /**
   * When to execute this logic (for conditional strategy)
   */
  condition?: string;
}

/**
 * Logic metadata
 * Describes an executable business logic component
 */
export interface LogicMetadata extends BaseMetadata {
  /**
   * Logic name (required)
   */
  name: string;

  /**
   * Logic type (required)
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
   */
  pure?: boolean;

  /**
   * Is this logic idempotent (safe to retry)?
   * Idempotent logic produces same result for same input
   */
  idempotent?: boolean;

  /**
   * Can results be cached?
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
   */
  retryable?: boolean;

  /**
   * Bounded context this logic belongs to
   */
  context?: string;

  /**
   * Aggregate type this logic operates on
   */
  aggregateType?: string;

  /**
   * Entity types this logic applies to
   */
  appliesTo?: string[];

  /**
   * Logic components to orchestrate (for orchestration type)
   */
  composedOf?: LogicReference[];

  /**
   * How to execute composed logic
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
   * Example usages for documentation
   */
  examples?: Array<{
    input: unknown;
    output: unknown;
    description?: string;
  }>;
}
