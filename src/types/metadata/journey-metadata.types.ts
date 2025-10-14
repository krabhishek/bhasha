/**
 * Journey Metadata Types
 * Types for journey, milestone, and step definitions (Contract-based BDD)
 * @module @bhumika/bhasha/types/metadata
 */

import type { AttributeDefinition } from './attribute-metadata.types.js';
import type { BaseMetadata } from './metadata.types.js';

/**
 * Stakeholder interaction - tracks handoffs between stakeholders in a journey
 */
export interface StakeholderInteraction {
  from: string;
  to: string;
  interaction: string;
  milestone?: string;
}

/**
 * Journey class constructor type
 */
export type JourneyClass = new (...args: never[]) => unknown;

/**
 * Milestone class constructor type
 */
export type MilestoneClass = new (...args: never[]) => unknown;

/**
 * Step class constructor type
 */
export type StepClass = new (...args: never[]) => unknown;

/**
 * Milestone reference for Journey decorator
 * Allows referencing milestone classes with explicit ordering
 */
export interface MilestoneReference {
  /**
   * Milestone class (constructor) or name (string)
   */
  milestone: string | MilestoneClass;

  /**
   * Order in journey (required for sequencing)
   */
  order: number;

  /**
   * Prerequisites (other milestones that must complete first)
   */
  prerequisites?: string[];
}

/**
 * Step reference for Milestone decorator
 * Allows referencing standalone step classes with explicit ordering
 * This enables mixing standalone and inline steps with full control over sequence
 */
export interface StepReference {
  /**
   * Step class (constructor) or name (string)
   */
  step: string | StepClass;

  /**
   * Order in milestone (required for sequencing)
   */
  order: number;

  /**
   * Is this step optional? (default: false)
   */
  optional?: boolean;
}

/**
 * Journey reference for detours
 * Allows embedding sub-journeys as detours that branch from and rejoin the main journey
 *
 * Mental Model: Like a scenic route that branches off the highway and rejoins later
 *
 * Example:
 * ```typescript
 * detours: [
 *   {
 *     journey: InsufficientFundsJourney,
 *     order: 2.5,  // Between milestone 2 and 3
 *     triggeredAfter: 'ValidateBalance',
 *     triggeredBy: 'balance < amount',
 *     rejoinsAt: 3,
 *     label: 'Handle insufficient funds'
 *   }
 * ]
 * ```
 */
export interface JourneyReference {
  /**
   * Sub-journey to execute as a detour
   * This journey should be marked with `isDetour: true`
   */
  journey: string | JourneyClass;

  /**
   * Fractional order indicating where the detour branches
   * Use decimals to show position between main milestones (e.g., 2.5 is between 2 and 3)
   * Convention: x.5 for primary detour, x.7 for secondary, x.9 for tertiary
   */
  order: number;

  /**
   * Which milestone triggers this detour
   * Can be milestone name (string) or class reference
   */
  triggeredAfter: string | MilestoneClass;

  /**
   * Condition expression that determines when detour is taken
   * Simple string expression evaluated at runtime
   * Examples: 'balance < amount', 'creditScore < 600', 'error === true'
   */
  triggeredBy?: string;

  /**
   * Where the detour rejoins the main journey
   * Can be milestone order number or milestone name
   * If not specified, rejoins at next milestone in sequence
   */
  rejoinsAt?: number | string;

  /**
   * Human-readable label for this detour
   * Useful for documentation and visualization
   */
  label?: string;
}

/**
 * Journey metadata (Stage 3 - Contract-based BDD, Context-Free Architecture)
 * Represents a complete user flow through the system with explicit stakeholder tracking
 *
 * IMPORTANT: Journey is CONTEXT-FREE
 * - Journey represents the primary stakeholder's experience, NOT a system boundary
 * - NO context field - context is derived from stakeholders in milestones and expectations
 * - Same journey can naturally span multiple contexts
 * - Context information is obtained through analysis of milestones and expectations
 *
 * Milestone Patterns: Supports BOTH declarative and inline milestone definitions
 * - Declarative: milestones array references standalone milestone classes (reusable)
 * - Inline: @Milestone decorator on methods within journey class (journey-specific)
 * - Both patterns can be used together
 */
export interface JourneyMetadata extends BaseMetadata {
  /**
   * Journey name (required)
   */
  name: string;

  /**
   * Primary stakeholder who drives this journey (required)
   * This is whose journey/experience we are tracking
   *
   * Note: While decorators accept Constructor | string for type safety,
   * this metadata stores the resolved string role name.
   */
  primaryStakeholder: string;

  /**
   * Journey slug (e.g., "deposit-money" or "DEPOSIT" for Deposit Money)
   * Used in expectation IDs: deposit-money-EXP-001
   * Auto-generated from name if not provided (kebab-case)
   */
  slug: string;

  /**
   * Declarative milestone references (Pattern 1: Standalone classes)
   * Array of milestone class references with their order and prerequisites
   * These milestones are defined as separate classes and can be reused across journeys
   *
   * Example:
   * ```typescript
   * milestones: [
   *   { milestone: UserAuthenticationMilestone, order: 1 },
   *   { milestone: FraudCheckMilestone, order: 2 },
   * ]
   * ```
   */
  milestones?: MilestoneReference[];

  /**
   * All stakeholders participating in this journey
   * Used for validation - expectations can only reference stakeholders in this list
   *
   * Note: While decorators accept Array<Constructor | string> for type safety,
   * this metadata stores the resolved string role names.
   */
  participatingStakeholders?: string[];

  /**
   * Measurable business outcomes of this journey
   */
  outcomes?: string[];

  /**
   * What triggers this journey?
   */
  triggeringEvent?: string;

  /**
   * Alternative/error flows
   */
  alternativeFlows?: string[];

  /**
   * Track stakeholder interactions/handoffs
   */
  stakeholderInteractions?: StakeholderInteraction[];

  /**
   * Inline attribute definitions (alternative to @Attribute decorator)
   */
  attributes?: AttributeDefinition[];

  /**
   * Detour sub-journeys that branch from and rejoin the main journey
   * Enables non-linear flows with explicit branch/rejoin points
   *
   * Example:
   * ```typescript
   * detours: [
   *   {
   *     journey: InsufficientFundsJourney,
   *     order: 2.5,  // Between milestone 2 and 3
   *     triggeredAfter: 'ValidateBalance',
   *     triggeredBy: 'balance < amount',
   *     rejoinsAt: 3
   *   }
   * ]
   * ```
   */
  detours?: JourneyReference[];

  /**
   * Marks this journey as a detour (sub-journey)
   * Detour journeys are not meant to be executed standalone
   * They are only executed when triggered from a parent journey
   * Default: false
   */
  isDetour?: boolean;
}

/**
 * Milestone metadata
 * Represents a stateful, business-significant achievement within a journey
 *
 * Semantic Distinction:
 * - Milestone = Stateful, reusable, business-significant (e.g., "User Authenticated", "KYC Verified")
 * - Step = Stateless, tactical action (e.g., "Click Login Button", "Enter Password")
 *
 * Context Derivation: Context is DERIVED from the stakeholder
 * - Each milestone is owned by a specific stakeholder
 * - The stakeholder exists in a specific bounded context
 * - Therefore, milestone's context is the stakeholder's context
 *
 * Reusability: Milestones can be reused across multiple journeys
 * - Example: UserAuthenticationMilestone used in login, password reset, profile update
 */
export interface MilestoneMetadata extends BaseMetadata {
  /**
   * Milestone name (required)
   */
  name: string;

  /**
   * Stakeholder who owns/drives this milestone (required)
   * Context is derived from this stakeholder's context
   */
  stakeholder: string;

  /**
   * Order in journey (required for inline milestones, optional for standalone)
   * For standalone milestone classes, order is specified in Journey.milestones array
   */
  order?: number;

  /**
   * Prerequisites (other milestones that must complete first)
   */
  prerequisites?: string[];

  /**
   * Domain event emitted when this milestone is reached
   * Example: 'user.authenticated', 'kyc.verified', 'payment.authorized'
   */
  businessEvent?: string;

  /**
   * Is this milestone stateful? (default: true)
   * Stateful milestones represent a state change in the domain
   */
  stateful?: boolean;

  /**
   * Is this milestone reusable across journeys? (default: true for standalone, false for inline)
   * Reusable milestones should be defined as standalone classes
   */
  reusable?: boolean;

  /**
   * Which journeys use this milestone (for tracking/documentation)
   * Useful for understanding milestone usage across the system
   */
  journeys?: string[];

  /**
   * Declarative step references (Pattern 1: Standalone classes)
   * Array of step class references with their order
   * These steps are defined as separate classes and can be mixed with inline steps
   *
   * Example:
   * ```typescript
   * steps: [
   *   { step: ValidateInputStep, order: 1 },
   *   { step: SanitizeDataStep, order: 2 },
   *   // Inline @Step({order: 3}) can be mixed in
   * ]
   * ```
   */
  steps?: StepReference[];

  /**
   * Inline expectations defined within this milestone (Pattern 2: Inline methods)
   * When using @Expectation as method decorators within a @Milestone class,
   * these expectations are stored here for complete hierarchy tracking
   *
   * This completes the hierarchy:
   * Journey → Milestones (array) → Expectations (array) → Behaviors (array) → Tests (array)
   */
  expectations?: import('./expectation-metadata.types.js').ExpectationMetadata[];
}

/**
 * Step metadata (granular action within a milestone)
 *
 * Semantic Distinction:
 * - Step = Stateless, tactical action (e.g., "Click Login Button", "Enter Password")
 * - Milestone = Stateful, business-significant (e.g., "User Authenticated")
 *
 * Steps are the granular actions that lead to achieving a milestone
 */
export interface StepMetadata extends BaseMetadata {
  /**
   * Step name (required)
   */
  name: string;

  /**
   * Order within milestone
   *
   * **Smart Default:**
   * - Inline steps (method/field decorator): REQUIRED - used for sequencing
   * - Standalone steps (class decorator): OPTIONAL - can be referenced without order
   */
  order?: number;

  /**
   * Actor performing this step (should be a known stakeholder)
   */
  actor?: string;

  /**
   * Expectations validated by this step
   * Links steps to expectations in the traceability chain:
   * Journey → Milestone → Step → Expectation → Behavior → Test
   */
  expectations?: string[];

  /**
   * Can this step be skipped? (default: false)
   * Optional steps allow for flexible flows
   */
  optional?: boolean;

  /**
   * Alternative steps that achieve the same goal
   * Useful for A/B testing or different user paths
   */
  alternatives?: string[];

  /**
   * Is this step reusable across milestones?
   *
   * **Smart Default:**
   * - Class decorator (standalone): defaults to `true` (reusable)
   * - Method decorator (inline): defaults to `false` (milestone-specific)
   */
  reusable?: boolean;
}
