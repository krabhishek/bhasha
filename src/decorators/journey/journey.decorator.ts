/**
 * @Journey Decorator
 * Marks a class as a Journey (context-free user flow)
 * @module @bhumika/bhasha/decorators/journey
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { JourneyMetadata, MilestoneReference, JourneyReference } from '../../types/decorator-metadata.types.js';
import { setMetadata } from '../../utils/metadata.utils.js';
import { extractStakeholderRole, extractStakeholderRoles, extractEventType } from '../../utils/class-reference.utils.js';
import { JourneyRegistry } from './journey.registry.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Journey decorator options (context-free architecture)
 */
export interface JourneyOptions {
  /**
   * Journey name (defaults to class name if not provided)
   */
  name?: string;

  /**
   * Primary stakeholder who drives this journey (required)
   * This is whose journey/experience we are tracking
   *
   * Can be either:
   * - A Stakeholder class reference (type-safe): `AccountOwnerStakeholder`
   * - A stakeholder role string (flexible): `"Account Owner"`
   */
  primaryStakeholder: Constructor | string;

  /**
   * Journey slug (e.g., "deposit-money" or "DEPOSIT")
   * Auto-generated from name if not provided (kebab-case)
   */
  slug?: string;

  /**
   * Declarative milestone references (Pattern 1: Standalone classes)
   * Array of milestone class references with their order and prerequisites
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
   * Can be either:
   * - Stakeholder class references (type-safe): `[AccountOwnerStakeholder, SystemStakeholder]`
   * - Stakeholder role strings (flexible): `["Account Owner", "System"]`
   * - Mixed: `[AccountOwnerStakeholder, "Guest User"]`
   */
  participatingStakeholders?: Array<Constructor | string>;

  /**
   * Measurable business outcomes of this journey
   */
  outcomes?: string[];

  /**
   * What triggers this journey?
   *
   * Can be either:
   * - An Event class reference (type-safe): `CustomerDepositInitiatedEvent`
   * - An event type string: `'customer.deposit.initiated'`
   */
  triggeringEvent?: Constructor | string;

  /**
   * Alternative/error flows
   */
  alternativeFlows?: string[];

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

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
 * Generate slug from name (kebab-case)
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Validate detour references
 * Ensures detours have valid orders, trigger points, and rejoin points
 */
function validateDetours(
  journeyName: string,
  detours: JourneyReference[],
  milestones?: MilestoneReference[]
): void {
  const detourOrders = new Set<number>();
  const milestoneOrders = new Set<number>();
  const milestoneMap = new Map<string, number>();

  // Build milestone lookup maps
  if (milestones) {
    for (const milestone of milestones) {
      milestoneOrders.add(milestone.order);

      // Handle both class references and string names
      const milestoneName = typeof milestone.milestone === 'string'
        ? milestone.milestone
        : milestone.milestone.name;

      milestoneMap.set(milestoneName, milestone.order);
    }
  }

  // Validate each detour
  for (const detour of detours) {
    const detourLabel = detour.label || 'Unnamed detour';

    // 1. Validate detour order is unique
    if (detourOrders.has(detour.order)) {
      throw new Error(
        `@Journey "${journeyName}": Duplicate detour order ${detour.order} found for "${detourLabel}"`
      );
    }
    detourOrders.add(detour.order);

    // 2. Validate detour order is fractional (contains decimal)
    if (Number.isInteger(detour.order)) {
      throw new Error(
        `@Journey "${journeyName}": Detour "${detourLabel}" has integer order ${detour.order}. ` +
        `Detours must use fractional orders (e.g., 2.5) to indicate branching between milestones.`
      );
    }

    // 3. Validate triggeredAfter milestone exists (if milestones are defined)
    if (milestones && milestones.length > 0) {
      const triggerMilestoneName = typeof detour.triggeredAfter === 'string'
        ? detour.triggeredAfter
        : detour.triggeredAfter.name;

      if (!milestoneMap.has(triggerMilestoneName)) {
        throw new Error(
          `@Journey "${journeyName}": Detour "${detourLabel}" references unknown milestone "${triggerMilestoneName}" in triggeredAfter`
        );
      }
    }

    // 4. Validate rejoinsAt if specified
    if (detour.rejoinsAt !== undefined && milestones && milestones.length > 0) {
      if (typeof detour.rejoinsAt === 'number') {
        // Validate rejoin order exists
        if (!milestoneOrders.has(detour.rejoinsAt)) {
          throw new Error(
            `@Journey "${journeyName}": Detour "${detourLabel}" rejoinsAt order ${detour.rejoinsAt} does not exist`
          );
        }
      } else {
        // Validate rejoin milestone name exists
        if (!milestoneMap.has(detour.rejoinsAt)) {
          throw new Error(
            `@Journey "${journeyName}": Detour "${detourLabel}" rejoinsAt milestone "${detour.rejoinsAt}" does not exist`
          );
        }
      }
    }

    // 5. Validate detour order is between valid milestones
    const wholePart = Math.floor(detour.order);
    if (milestones && milestones.length > 0) {
      const hasWholePart = milestoneOrders.has(wholePart);
      const hasNextPart = milestoneOrders.has(wholePart + 1);

      if (!hasWholePart && !hasNextPart) {
        throw new Error(
          `@Journey "${journeyName}": Detour "${detourLabel}" order ${detour.order} is not between any valid milestones. ` +
          `Ensure the detour order falls between existing milestone orders.`
        );
      }
    }
  }
}

/**
 * @Journey decorator
 * Marks a class as a Journey with context-free architecture
 *
 * IMPORTANT: Journey is CONTEXT-FREE
 * - Represents the primary stakeholder's experience
 * - Context is derived from stakeholders in milestones and expectations
 * - Same journey can naturally span multiple contexts
 *
 * Milestone Patterns: Supports BOTH declarative and inline patterns
 * - Declarative: Use milestones array to reference standalone milestone classes (reusable)
 * - Inline: Use @Milestone decorator on methods within journey class (journey-specific)
 * - Both patterns can be used together
 *
 * @param options - Journey configuration
 * @returns Class decorator
 *
 * @example Declarative Pattern (Reusable Milestones)
 * ```typescript
 * ⁣@Journey({
 *   primaryStakeholder: 'Account Owner',
 *   slug: 'deposit-money',
 *   milestones: [
 *     { milestone: UserAuthenticationMilestone, order: 1 },
 *     { milestone: InitiateDepositMilestone, order: 2 },
 *   ],
 * })
 * class DepositMoneyJourney { }
 * ```
 *
 * @example Inline Pattern (Journey-Specific Milestones)
 * ```typescript
 * ⁣@Journey({
 *   primaryStakeholder: 'Account Owner',
 *   slug: 'simple-login',
 * })
 * class SimpleLoginJourney {
 *   ⁣@Milestone({ stakeholder: 'Account Owner', order: 1 })
 *   authenticate() { }
 * }
 * ```
 *
 * @example Mixed Pattern (Both)
 * ```typescript
 * ⁣@Journey({
 *   primaryStakeholder: 'Account Owner',
 *   milestones: [
 *     { milestone: UserAuthenticationMilestone, order: 1 }, // Reusable
 *   ],
 * })
 * class MixedJourney {
 *   ⁣@Milestone({ stakeholder: 'Account Owner', order: 2 }) // Journey-specific
 *   customStep() { }
 * }
 * ```
 */
export function Journey(options: JourneyOptions) {
  return function <T extends new (...args: never[]) => unknown>(
    target: T,
    context: ClassDecoratorContext<T>
  ): T {
    const journeyName = options.name || String(context.name);
    const journeySlug = options.slug || generateSlug(journeyName);

    // Validate required fields
    if (!options.primaryStakeholder) {
      throw new Error(
        `@Journey "${journeyName}": primaryStakeholder is required`
      );
    }

    // Extract stakeholder roles from class references or strings
    const primaryStakeholderRole = extractStakeholderRole(options.primaryStakeholder);

    if (!primaryStakeholderRole) {
      throw new Error(
        `@Journey "${journeyName}": Could not resolve primaryStakeholder. ` +
        `Make sure the Stakeholder class is decorated and imported.`
      );
    }

    const participatingStakeholderRoles = options.participatingStakeholders
      ? extractStakeholderRoles(options.participatingStakeholders)
      : undefined;

    // Extract event type from class reference or string
    const triggeringEventType = options.triggeringEvent
      ? extractEventType(options.triggeringEvent)
      : undefined;

    // Validate detours if provided
    if (options.detours && options.detours.length > 0) {
      validateDetours(journeyName, options.detours, options.milestones);
    }

    // Build journey metadata
    const metadata: JourneyMetadata = {
      name: journeyName,
      primaryStakeholder: primaryStakeholderRole,
      slug: journeySlug,
      milestones: options.milestones,
      participatingStakeholders: participatingStakeholderRoles,
      outcomes: options.outcomes,
      triggeringEvent: triggeringEventType, // Store resolved event type string
      alternativeFlows: options.alternativeFlows,
      description: options.description,
      tags: options.tags,
      detours: options.detours,
      isDetour: options.isDetour,
    };

    // Store metadata using Stage 3 Symbol.metadata
    // AND auto-register with JourneyRegistry
    context.addInitializer(function (this: unknown) {
      // In class decorators, 'this' IS the constructor itself
      const constructor = this as new (...args: never[]) => unknown;

      // Store metadata
      setMetadata(METADATA_KEYS.JOURNEY, metadata, constructor);

      // Auto-register with registry
      const registry = JourneyRegistry.getInstance();
      registry.register(metadata, constructor);
    });

    return target;
  };
}
