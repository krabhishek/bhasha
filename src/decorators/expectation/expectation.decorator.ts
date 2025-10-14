/**
 * @Expectation Decorator
 * Marks a class or method as an Expectation (bilateral contract between stakeholders)
 * Supports both standalone and inline patterns
 * @module @bhumika/bhasha/decorators/expectation
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type {
  ExpectationMetadata,
  ExpectationPriority,
  MilestoneMetadata,
} from '../../types/decorator-metadata.types.js';
import { setMetadata, getMetadata } from '../../utils/metadata.utils.js';
import { extractStakeholderRole } from '../../utils/class-reference.utils.js';
import { ExpectationRegistry } from './expectation.registry.js';
import { mergeReferences, validateAtLeastOne } from '../../utils/reference-utils.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Expectation decorator options
 */
export interface ExpectationOptions {
  /**
   * Stakeholder who has this expectation (the CONSUMER)
   * Required for standalone classes
   * Optional for inline methods (can be inherited)
   *
   * Can be either:
   * - A Stakeholder class reference (type-safe): `AccountOwnerStakeholder`
   * - A stakeholder role string (flexible): `"Account Owner"`
   */
  expectingStakeholder?: Constructor | string;

  /**
   * Stakeholder who fulfills this expectation (the PROVIDER)
   * Required for standalone classes
   * Optional for inline methods (can be inherited)
   *
   * Can be either:
   * - A Stakeholder class reference (type-safe): `PiggyBankSystemStakeholder`
   * - A stakeholder role string (flexible): `"Piggy Bank System"`
   */
  providingStakeholder?: Constructor | string;

  /**
   * Expectation description (what is expected)
   * Optional - defaults to method/class name if not provided
   */
  description?: string;

  /**
   * Single behavior that fulfills this expectation (singular form)
   * Can be either a behavior class or behavior name (string)
   * At least one behavior (singular or plural) is required
   */
  behavior?: Constructor | string;

  /**
   * Multiple behaviors that fulfill this expectation (plural form)
   * Array of behavior classes or behavior names (strings)
   * At least one behavior (singular or plural) is required
   */
  behaviors?: Array<Constructor | string>;

  /**
   * Unique expectation ID (auto-generated if not provided)
   * Format: {JOURNEY_SLUG}-EXP-{NUMBER}
   */
  expectationId?: string;

  /**
   * Priority (for test execution order and business criticality)
   * @default 'medium'
   */
  priority?: ExpectationPriority;

  /**
   * Milestone this expectation belongs to (class or name)
   */
  milestone?: Constructor | string;

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
   * @default true
   */
  criticalPath?: boolean;

  /**
   * Journey slug (for auto-generating expectation ID)
   * If not provided, will try to derive from context
   */
  journeySlug?: string;

  /**
   * Milestone ID (for linking to milestone)
   */
  milestoneId?: string;

  /**
   * Human-readable description
   */
  additionalDescription?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];
}

/**
 * Counter for auto-generating expectation IDs
 */
const expectationCounters = new Map<string, number>();

/**
 * Generate next expectation ID for a journey
 * @param journeySlug - Journey slug
 * @returns Next expectation ID
 */
function generateExpectationId(journeySlug: string): string {
  const currentCount = expectationCounters.get(journeySlug) || 0;
  const nextCount = currentCount + 1;
  expectationCounters.set(journeySlug, nextCount);

  const paddedNumber = String(nextCount).padStart(3, '0');
  return `${journeySlug}-EXP-${paddedNumber}`;
}

/**
 * @Expectation decorator (supports both class and method decorators)
 *
 * Expectations represent contracts between two stakeholders:
 * - expectingStakeholder: The stakeholder who has this expectation (consumer)
 * - providingStakeholder: The stakeholder who fulfills this expectation (provider)
 *
 * The expectation defines WHAT is expected, and behaviors define HOW it's fulfilled.
 *
 * Pattern 1: Standalone Expectation Class (Reusable)
 * ```typescript
 * ⁣@Expectation({
 *   expectingStakeholder: AccountOwnerStakeholder,
 *   providingStakeholder: AccountAdministratorStakeholder,
 *   description: 'Deposit amount is validated',
 *   behaviors: [ValidateFormatBehavior, ValidatePositiveBehavior],
 *   journeySlug: 'deposit-money'
 * })
 * export class PositiveAmountExpectation {}
 * ```
 *
 * Note: BehaviorContract has been moved to @Behavior decorator.
 * - Expectations define WHAT is expected (the business requirement)
 * - Behaviors define HOW expectations are fulfilled (the implementation contract)
 *
 * Pattern 2: Inline Expectation Method (Milestone-Specific)
 * ```typescript
 * ⁣@Milestone({
 *   journey: DepositMoneyJourney,
 *   stakeholder: 'System',
 *   order: 1
 * })
 * class AmountValidatedMilestone {
 *   ⁣@Expectation({
 *     expectingStakeholder: 'Customer',
 *     providingStakeholder: 'System',
 *     behaviors: [ValidateFormatBehavior]
 *   })
 *   positiveAmount() {}  // milestone & journeySlug auto-inherited
 * }
 * ```
 *
 * @param options - Expectation configuration
 * @returns Class or method decorator
 */
export function Expectation(options: ExpectationOptions): ClassDecorator & MethodDecorator {
  // Return a unified decorator that handles both cases
  return function (
    target: unknown,
    context?: ClassMethodDecoratorContext | ClassDecoratorContext
  ): unknown {
    // Handle both old-style decorators (no context) and new Stage 3 decorators (with context)
    if (!context) {
      throw new Error('@Expectation requires Stage 3 decorator support (TypeScript 5.0+)');
    }

    const isClassDecorator = context.kind === 'class';
    const isMethodDecorator = context.kind === 'method';

    if (!isClassDecorator && !isMethodDecorator) {
      throw new Error('@Expectation can only be applied to classes or methods');
    }

    const expectationName = String(context.name);

    if (isClassDecorator) {
      // Pattern 1: Standalone Expectation Class
      const classContext = context as ClassDecoratorContext;

      // For standalone expectations, stakeholders are required
      if (!options.expectingStakeholder) {
        throw new Error(
          `@Expectation "${expectationName}": expectingStakeholder is required for standalone expectations`
        );
      }

      if (!options.providingStakeholder) {
        throw new Error(
          `@Expectation "${expectationName}": providingStakeholder is required for standalone expectations`
        );
      }

      // Validate at least one behavior is provided
      validateAtLeastOne(
        options.behavior,
        options.behaviors,
        'behavior',
        'behaviors',
        '@Expectation',
        expectationName
      );

      const description = options.description || expectationName;

      // Auto-generate expectation ID if not provided
      let expectationId = options.expectationId;
      if (!expectationId) {
        if (!options.journeySlug) {
          throw new Error(
            `@Expectation "${expectationName}": either expectationId or journeySlug must be provided for auto-generation`
          );
        }
        expectationId = generateExpectationId(options.journeySlug);
      }

      // Extract milestone name/ID from milestone option
      let milestoneName: string | undefined;
      const milestoneIdValue = options.milestoneId;

      if (options.milestone) {
        if (typeof options.milestone === 'string') {
          milestoneName = options.milestone;
        } else {
          // It's a class constructor - extract the class name
          milestoneName = options.milestone.name;
        }
      }

      // Merge singular and plural behavior references
      const behaviorRefs = mergeReferences(options.behavior, options.behaviors);

      // Extract behavior names from behaviors array
      const behaviorNames: string[] = [];
      for (const behavior of behaviorRefs) {
        if (typeof behavior === 'string') {
          behaviorNames.push(behavior);
        } else {
          // It's a class constructor - extract the class name
          behaviorNames.push(behavior.name);
        }
      }

      // Build expectation metadata (stakeholders will be resolved in initializer)
      const metadata: ExpectationMetadata = {
        expectingStakeholder: '', // Resolved in initializer
        providingStakeholder: '', // Resolved in initializer
        description,
        expectationId,
        priority: options.priority,
        milestone: milestoneName,
        scenario: options.scenario,
        criticalPath: options.criticalPath ?? true,
        journeySlug: options.journeySlug,
        milestoneId: milestoneIdValue,
        behaviors: behaviorNames.length > 0 ? behaviorNames : undefined,
        tags: options.tags,
      };

      classContext.addInitializer(function (this: unknown) {
        const constructor = (this as object).constructor as Constructor;

        // Extract stakeholder roles NOW when initializer runs
        // At this point, Stakeholder decorators have executed and StakeholderRegistry is populated
        metadata.expectingStakeholder = extractStakeholderRole(options.expectingStakeholder) || '';
        metadata.providingStakeholder = extractStakeholderRole(options.providingStakeholder) || '';

        // Warn if stakeholders couldn't be resolved
        if (!metadata.expectingStakeholder && options.expectingStakeholder) {
          console.warn(
            `@Expectation "${expectationId}": Could not resolve expectingStakeholder. ` +
            `Make sure the Stakeholder class is decorated and imported.`
          );
        }
        if (!metadata.providingStakeholder && options.providingStakeholder) {
          console.warn(
            `@Expectation "${expectationId}": Could not resolve providingStakeholder. ` +
            `Make sure the Stakeholder class is decorated and imported.`
          );
        }

        // Store expectation metadata on the class
        setMetadata(METADATA_KEYS.EXPECTATION, metadata, constructor);

        // Register in ExpectationRegistry
        const registry = ExpectationRegistry.getInstance();
        registry.register(metadata, constructor);

        // Validate cross-context relationship
        const validation = registry.validateContextRelationship(metadata);
        if (validation.warning) {
          console.warn(
            `@Expectation "${expectationId}": ${validation.warning}`
          );
        }
        if (!validation.valid && validation.error) {
          console.error(
            `@Expectation "${expectationId}": ${validation.error}`
          );
        }
      });

      return target;
    } else {
      // Pattern 2: Inline Expectation Method
      const methodContext = context as ClassMethodDecoratorContext;

      methodContext.addInitializer(function (this: unknown) {
        const constructor = (this as object).constructor as Constructor;

        // Get parent Milestone metadata to auto-inherit milestone and journeySlug
        const milestoneMetadata = getMetadata<MilestoneMetadata>(
          METADATA_KEYS.MILESTONE,
          constructor
        );

        // Auto-inherit milestone name
        const milestoneName = options.milestone
          ? (typeof options.milestone === 'string' ? options.milestone : options.milestone.name)
          : milestoneMetadata?.name;

        // For inline expectations, try to inherit stakeholders from milestone
        const expectingStakeholderInput = options.expectingStakeholder || milestoneMetadata?.stakeholder;
        const providingStakeholderInput = options.providingStakeholder || milestoneMetadata?.stakeholder;

        // Extract stakeholder roles from class references or strings
        const expectingStakeholder = expectingStakeholderInput
          ? (typeof expectingStakeholderInput === 'string'
              ? expectingStakeholderInput
              : extractStakeholderRole(expectingStakeholderInput))
          : undefined;
        const providingStakeholder = providingStakeholderInput
          ? (typeof providingStakeholderInput === 'string'
              ? providingStakeholderInput
              : extractStakeholderRole(providingStakeholderInput))
          : undefined;

        if (!expectingStakeholder || !providingStakeholder) {
          console.warn(
            `@Expectation "${expectationName}": Missing stakeholders. ` +
            `Inline expectations should be used within @Milestone classes or provide stakeholders explicitly.`
          );
        }

        const description = options.description || expectationName;

        // Auto-generate expectation ID if not provided
        let expectationId = options.expectationId;
        if (!expectationId) {
          const journeySlug = options.journeySlug;
          if (!journeySlug) {
            console.warn(
              `@Expectation "${expectationName}": Cannot auto-generate expectationId without journeySlug`
            );
          } else {
            expectationId = generateExpectationId(journeySlug);
          }
        }

        // Merge singular and plural behavior references
        const behaviorRefs = mergeReferences(options.behavior, options.behaviors);

        // Validate at least one behavior is provided (warn for inline expectations)
        if (behaviorRefs.length === 0) {
          console.warn(
            `@Expectation "${expectationName}": At least one behavior/behaviors is recommended for inline expectations`
          );
        }

        // Extract behavior names from behaviors array
        const behaviorNames: string[] = [];
        for (const behavior of behaviorRefs) {
          if (typeof behavior === 'string') {
            behaviorNames.push(behavior);
          } else {
            behaviorNames.push(behavior.name);
          }
        }

        // Build expectation metadata (inline expectations are milestone-specific)
        const metadata: ExpectationMetadata = {
          expectingStakeholder: expectingStakeholder!,
          providingStakeholder: providingStakeholder!,
          description,
          expectationId,
          priority: options.priority,
          milestone: milestoneName,
          scenario: options.scenario,
          criticalPath: options.criticalPath ?? true,
          journeySlug: options.journeySlug,
          milestoneId: options.milestoneId,
          behaviors: behaviorNames.length > 0 ? behaviorNames : undefined,
          tags: options.tags,
        };

        // Get existing inline expectations array or create new one
        const existingExpectations = getMetadata<ExpectationMetadata[]>(
          METADATA_KEYS.EXPECTATION,
          constructor
        ) || [];

        // Add this expectation to the array
        existingExpectations.push(metadata);

        // Store updated expectations array
        setMetadata(METADATA_KEYS.EXPECTATION, existingExpectations, constructor);

        // Register in ExpectationRegistry
        const registry = ExpectationRegistry.getInstance();
        registry.register(metadata, constructor);

        // Validate cross-context relationship
        if (expectationId) {
          const validation = registry.validateContextRelationship(metadata);
          if (validation.warning) {
            console.warn(
              `@Expectation "${expectationId}": ${validation.warning}`
            );
          }
          if (!validation.valid && validation.error) {
            console.error(
              `@Expectation "${expectationId}": ${validation.error}`
            );
          }
        }
      });

      return undefined;
    }
  } as ClassDecorator & MethodDecorator;
}
