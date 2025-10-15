/**
 * Behavior Metadata Types
 * Types for behavior definitions (Contract-based BDD)
 * @module @bhumika/bhasha/types/metadata
 */

import type { BaseMetadata } from './metadata.types.js';

/**
 * Behavior contract type - defines HOW the expectation is fulfilled
 */
export type BehaviorContractType = 'sync' | 'async' | 'event-driven' | 'batch';

/**
 * Behavior contract - the terms of fulfillment
 * Defines the implementation contract for how a behavior operates
 *
 * Moved from ExpectationMetadata (Phase 2.5 refactoring)
 * - Expectations define WHAT is expected
 * - Behaviors define HOW expectations are fulfilled (with this contract)
 */
export interface BehaviorContract {
  /**
   * Type of interaction
   */
  type: BehaviorContractType;

  /**
   * Expected inputs (parameters/data needed)
   */
  inputs?: Record<string, string>;

  /**
   * Expected outputs (return values/data provided)
   */
  outputs?: Record<string, string>;

  /**
   * Service level agreement (SLA) constraints
   */
  sla?: {
    responseTime?: string;
    availability?: string;
    throughput?: string;
  };

  /**
   * Error handling contract
   */
  errorHandling?: {
    retryable?: boolean;
    fallback?: string;
    timeout?: string;
  };
}

/**
 * Behavior execution mode
 */
export type BehaviorExecutionMode =
  | 'immediate'
  | 'deferred'
  | 'scheduled'
  | 'conditional';

/**
 * Behavior metadata
 * Describes HOW an expectation is implemented/fulfilled
 *
 * NOTE: BehaviorContract moved here from ExpectationMetadata (Phase 2.5 refactoring)
 * - Each behavior carries its own implementation contract
 * - Multiple behaviors can fulfill the same expectation with different contracts
 * - Example: Same expectation fulfilled by sync behavior OR async behavior
 */
export interface BehaviorMetadata extends BaseMetadata {
  /**
   * Behavior name/description
   */
  name: string;

  /**
   * Expectation ID this behavior implements (optional for reusable behaviors)
   */
  expectationId?: string;

  /**
   * Bounded context this behavior belongs to (string name)
   */
  context?: string;

  /**
   * What does this behavior invoke? (method, service, API, etc.)
   */
  invokes?: string;

  /**
   * The complete behavior contract - HOW this behavior fulfills the expectation
   * Moved from Expectation to Behavior for proper separation of concerns:
   * - Expectation = WHAT is expected (business requirement)
   * - Behavior = HOW it's fulfilled (implementation contract)
   */
  behaviorContract?: BehaviorContract;

  /**
   * Execution mode
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
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Test names/IDs that validate this behavior
   * References to test specifications defined using @Test decorator
   * Array of test class names or test IDs
   */
  tests?: string[];

  /**
   * Inline tests defined within this behavior (Pattern 2: Inline methods)
   * When using @Test as method decorators within a @Behavior class,
   * these tests are stored here for complete hierarchy tracking
   */
  inlineTests?: import('./test-metadata.types.js').TestMetadata[];
}
