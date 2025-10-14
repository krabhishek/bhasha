/**
 * @Milestone Decorator
 * Marks a class or method as a Milestone (supports both standalone and inline patterns)
 * @module @bhumika/bhasha/decorators/journey
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { MilestoneMetadata, JourneyMetadata, StepReference, StepMetadata } from '../../types/decorator-metadata.types.js';
import { getMetadata, setMetadata } from '../../utils/metadata.utils.js';
import { extractStakeholderRole, extractEventType } from '../../utils/class-reference.utils.js';
import { MilestoneRegistry } from './milestone.registry.js';
import { StepRegistry } from '../step/step.registry.js';

/**
 * Milestone decorator options
 */
/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

export interface MilestoneOptions {
  /**
   * Milestone name (defaults to class/method name if not provided)
   */
  name?: string;

  /**
   * Stakeholder who owns/drives this milestone (required)
   * Context is derived from this stakeholder's context
   *
   * Can be either:
   * - A Stakeholder class reference (type-safe): `AccountOwnerStakeholder`
   * - A stakeholder role string (flexible): `"Account Owner"`
   */
  stakeholder: Constructor | string;

  /**
   * Journey this milestone belongs to (optional)
   * Can be a Journey class or journey slug string
   *
   * Pattern 1: Link milestone to journey at milestone definition (easier mental model)
   * Pattern 2: Link milestones to journey at journey definition (via Journey.milestones)
   *
   * Both patterns are supported for flexibility.
   */
  journey?: Constructor | string;

  /**
   * Order in journey
   *
   * **Smart Requirement:**
   * - Method decorator (inline): REQUIRED - must specify order
   * - Class decorator (standalone): OPTIONAL - order specified in Journey.milestones array
   *
   * This enforces correct usage patterns automatically.
   */
  order?: number;

  /**
   * Prerequisites (other milestones that must complete first)
   */
  prerequisites?: string[];

  /**
   * Domain event emitted when this milestone is reached
   *
   * Can be either:
   * - An Event class reference (type-safe): `TransactionRecordedEvent`
   * - An event type string: `'transaction.recorded'`
   *
   * Example: 'user.authenticated', 'kyc.verified'
   */
  businessEvent?: Constructor | string;

  /**
   * Is this milestone stateful? (default: true)
   */
  stateful?: boolean;

  /**
   * Is this milestone reusable across journeys?
   *
   * **Smart Default:** Automatically determined by decorator usage
   * - Class decorator: defaults to `true` (standalone, reusable)
   * - Method decorator: defaults to `false` (inline, journey-specific)
   *
   * Only set explicitly if you want to override the smart default.
   */
  reusable?: boolean;

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Ordered array of step references (standalone steps)
   * Use this to compose milestones from reusable step classes
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
}

/**
 * Internal implementation for milestone metadata creation and registration
 */
function createMilestoneMetadata(
  options: MilestoneOptions,
  name: string,
  isClass: boolean
): MilestoneMetadata {
  // Extract stakeholder role from class reference or string
  const stakeholderRole = extractStakeholderRole(options.stakeholder);

  if (!stakeholderRole) {
    throw new Error(
      `@Milestone "${name}": Could not resolve stakeholder. ` +
      `Make sure the Stakeholder class is decorated and imported.`
    );
  }

  // Extract event type from class reference or string
  const businessEventType = options.businessEvent
    ? extractEventType(options.businessEvent)
    : undefined;

  return {
    name: options.name || name,
    stakeholder: stakeholderRole,
    order: options.order,
    prerequisites: options.prerequisites,
    businessEvent: businessEventType, // Store resolved event type string
    stateful: options.stateful ?? true,
    reusable: options.reusable ?? isClass,
    description: options.description,
    tags: options.tags,
    steps: options.steps,
  };
}

/**
 * Process steps array: Register referenced step classes with the parent milestone
 * This allows milestones to be composed from reusable step classes
 *
 * NOTE: This is called AFTER the milestone class is instantiated, ensuring
 * all step class decorators have already run (when the step classes were imported)
 */
function processStepsArray(
  steps: StepReference[],
  parentMilestone: Constructor
): void {
  const stepRegistry = StepRegistry.getInstance();

  for (const stepRef of steps) {
    const { step, order } = stepRef;

    // Resolve step class from reference (could be string name or class)
    let stepClass: Constructor;

    if (typeof step === 'string') {
      // If it's a string, we need to look it up in the registry
      // For now, throw an error - string lookup not yet implemented
      throw new Error(
        `String step references not yet supported. Use step class directly: "${step}"`
      );
    } else {
      stepClass = step;
    }

    // Instantiate the step class to trigger its decorator and register it
    // The step's initializer will register itself in the registry
    new stepClass();

    // Look up the step in the registry by its class
    // Standalone steps register themselves as their own parent
    // Use the internal map directly to avoid validation (order may be undefined for standalone steps)
    const stepEntries = (stepRegistry as any).stepsByParent.get(stepClass) || [];

    if (stepEntries.length === 0) {
      throw new Error(
        `Step class ${stepClass.name} is not decorated with @Step. ` +
        `Make sure to apply @Step decorator to the class.`
      );
    }

    // Get the first (and should be only) entry
    const stepMetadata = stepEntries[0].metadata;

    // Create a new metadata object with the order from the reference
    const orderedStepMetadata: StepMetadata = {
      ...stepMetadata,
      order, // Override order with the one specified in the reference
    };

    // Register the step with the parent milestone (with updated order)
    stepRegistry.register(orderedStepMetadata, parentMilestone, 'milestone');
  }
}

/**
 * Extract journey slug from journey option
 */
function extractJourneySlug(journey: Constructor | string | undefined): string | undefined {
  if (!journey) {
    return undefined;
  }

  if (typeof journey === 'string') {
    return journey;
  }

  // It's a class - try to extract slug from class name or metadata
  // For now, we'll derive slug from class name (e.g., DepositMoneyJourney -> deposit-money)
  const className = journey.name;

  // Remove 'Journey' suffix if present
  const withoutSuffix = className.replace(/Journey$/, '');

  // Convert PascalCase to kebab-case
  const slug = withoutSuffix
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

  return slug;
}

/**
 * @Milestone decorator (supports both class and method decorators)
 *
 * Pattern 1: Standalone Milestone Class linked to Journey (RECOMMENDED)
 * ```typescript
 * ⁣@Milestone({
 *   journey: DepositMoneyJourney,  // Link milestone to journey
 *   stakeholder: 'Piggy Bank System',
 *   name: 'Amount Validated',
 *   order: 1,
 *   businessEvent: 'amount.validated',
 * })
 * class AmountValidatedMilestone {}
 * ```
 *
 * Pattern 2: Standalone Milestone Class (Reusable, no journey link)
 * ```typescript
 * ⁣@Milestone({
 *   stakeholder: 'Account Owner',
 *   businessEvent: 'user.authenticated',
 * })
 * class UserAuthenticationMilestone {
 *   ⁣@Step({ order: 1 })
 *   enterCredentials() { }
 * }
 * ```
 *
 * Pattern 3: Inline Milestone Method (Journey-Specific, legacy)
 * ```typescript
 * ⁣@Journey({ primaryStakeholder: 'Account Owner' })
 * class DepositMoneyJourney {
 *   ⁣@Milestone({ stakeholder: 'Account Owner', order: 1 })
 *   initiateDeposit() { }
 * }
 * ```
 *
 * @param options - Milestone configuration
 * @returns Class or method decorator
 */
export function Milestone(options: MilestoneOptions): ClassDecorator & MethodDecorator {
  // Validate required fields
  if (!options.stakeholder) {
    throw new Error(`@Milestone: stakeholder is required`);
  }

  // Return a unified decorator that handles both cases
  return function (
    target: unknown,
    context?: ClassMethodDecoratorContext | ClassDecoratorContext
  ): unknown {
    // Handle both old-style decorators (no context) and new Stage 3 decorators (with context)
    if (!context) {
      throw new Error('@Milestone requires Stage 3 decorator support (TypeScript 5.0+)');
    }

    const isClassDecorator = context.kind === 'class';
    const isMethodDecorator = context.kind === 'method';

    if (!isClassDecorator && !isMethodDecorator) {
      throw new Error('@Milestone can only be applied to classes or methods');
    }

    const milestoneName = String(context.name);

    // For inline methods, order is required
    if (isMethodDecorator && (options.order === undefined || options.order === null)) {
      throw new Error(
        `@Milestone "${milestoneName}": order is required for inline milestones`
      );
    }

    const metadata = createMilestoneMetadata(options, milestoneName, isClassDecorator);

    if (isClassDecorator) {
      // Pattern 1: Standalone Milestone Class
      const classContext = context as ClassDecoratorContext;

      // Store metadata using context.metadata (Stage 3 way) - available immediately!
      classContext.metadata[METADATA_KEYS.MILESTONE] = metadata;

      classContext.addInitializer(function (this: unknown) {
        // In class decorator initializers, `this` is the constructor itself, not an instance
        const constructor = this as new (...args: never[]) => unknown;

        // Process steps array if provided: register referenced step classes with this milestone
        if (options.steps && options.steps.length > 0) {
          processStepsArray(options.steps, constructor);
        }

        // Extract journey slug from options if provided
        const journeySlug = extractJourneySlug(options.journey);

        // Auto-register with registry
        const registry = MilestoneRegistry.getInstance();
        registry.register(metadata, constructor, journeySlug);
      });
      return target;
    } else {
      // Pattern 2: Inline Milestone Method
      const methodContext = context as ClassMethodDecoratorContext;
      methodContext.addInitializer(function (this: unknown) {
        const constructor = (this as object).constructor as new (...args: never[]) => unknown;

        // Get existing milestones array or create new one
        const existingMilestones = getMetadata<MilestoneMetadata[]>(
          METADATA_KEYS.MILESTONE,
          constructor
        ) || [];

        // Add this milestone to the array
        existingMilestones.push(metadata);

        // Sort by order (if order exists)
        existingMilestones.sort((a, b) => {
          if (a.order === undefined || b.order === undefined) return 0;
          return a.order - b.order;
        });

        // Store updated milestones array
        setMetadata(METADATA_KEYS.MILESTONE, existingMilestones, constructor);

        // Auto-register with registry
        // For inline milestones, we need the journey slug from the parent class
        const journeyMetadata = getMetadata<JourneyMetadata>(
          METADATA_KEYS.JOURNEY,
          constructor
        );
        const journeySlug = journeyMetadata?.slug;

        const registry = MilestoneRegistry.getInstance();
        registry.register(metadata, constructor, journeySlug);
      });
      return undefined;
    }
  } as ClassDecorator & MethodDecorator;
}
