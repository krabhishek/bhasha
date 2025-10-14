/**
 * Expectation Metadata Types
 * Types for expectations (Contract-based BDD)
 * @module @bhumika/bhasha/types/metadata
 *
 * NOTE: BehaviorContract types have been moved to behavior-metadata.types.ts
 * This reflects the architectural principle:
 * - Expectations define WHAT is expected (business requirement)
 * - Behaviors define HOW expectations are fulfilled (implementation contract)
 */

import type { ExpectationPriority } from '../../enums/expectation-priority.enum.js';
import type { BaseMetadata } from './metadata.types.js';

/**
 * Expectation metadata - Bilateral Contract Structure
 * Every expectation is a CONTRACT between TWO stakeholders
 *
 * Context Derivation: Context is DERIVED from both stakeholders
 * - expectingStakeholder (consumer) exists in context A
 * - providingStakeholder (provider) exists in context B
 * - If A == B: same-context expectation
 * - If A != B: cross-context expectation (requires context relationship validation)
 *
 * NOTE: BehaviorContract has been moved to BehaviorMetadata (Phase 2.5 refactoring)
 * - Expectations define WHAT is expected (the business requirement)
 * - Behaviors define HOW expectations are fulfilled (the implementation contract)
 * - This allows multiple behaviors with different contracts to fulfill the same expectation
 */
export interface ExpectationMetadata extends BaseMetadata {
  /**
   * Stakeholder who has this expectation (the CONSUMER) - required
   */
  expectingStakeholder: string;

  /**
   * Stakeholder who fulfills this expectation (the PROVIDER) - required
   */
  providingStakeholder: string;

  /**
   * Expectation description (what is expected)
   */
  description: string;

  /**
   * Unique expectation ID (auto-generated if not provided)
   * Format: {JOURNEY_SLUG}-EXP-{NUMBER}
   */
  expectationId?: string;

  /**
   * Priority (for test execution order and business criticality)
   */
  priority?: ExpectationPriority;

  /**
   * Milestone this expectation belongs to
   */
  milestone?: string;

  /**
   * Given/When/Then BDD structure
   */
  scenario?: {
    given?: string;
    when?: string;
    then?: string;
  };

  /**
   * Is this a critical path expectation?
   * Critical = journey fails if this expectation fails
   * Optional = journey can continue with degraded experience
   */
  criticalPath?: boolean;

  /**
   * Journey slug this expectation belongs to
   * Used for traceability and auto-linking
   */
  journeySlug?: string;

  /**
   * Milestone name or ID this expectation belongs to
   * Used for organizing expectations by milestone
   */
  milestoneId?: string;

  /**
   * Collection of behaviors that fulfill this expectation
   * Array of behavior class names or IDs
   * This represents the HOW (implementation strategies) for the expectation
   */
  behaviors?: string[];

  /**
   * Inline behaviors defined within this expectation (Pattern 2: Inline methods)
   * When using @Behavior as method decorators within an @Expectation class,
   * these behaviors are stored here for complete hierarchy tracking
   */
  inlineBehaviors?: import('./behavior-metadata.types.js').BehaviorMetadata[];
}
