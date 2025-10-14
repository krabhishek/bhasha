/**
 * @Step Decorator
 * Marks a method/field as a Step (granular action within a milestone)
 * @module @bhumika/bhasha/decorators/journey
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { StepMetadata } from '../../types/decorator-metadata.types.js';
import { StepRegistry } from './step.registry.js';
import { extractStakeholderRole, extractExpectationId } from '../../utils/class-reference.utils.js';
import { mergeReferences } from '../../utils/reference-utils.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Step decorator options
 */
export interface StepOptions {
  /**
   * Step name (defaults to method/field name if not provided)
   */
  name?: string;

  /**
   * Order within milestone
   *
   * **Smart Requirement:**
   * - Method/field decorator (inline): REQUIRED - must specify order for sequencing
   * - Class decorator (standalone): OPTIONAL - step can be referenced without order
   *
   * This enforces correct usage patterns automatically.
   */
  order?: number;

  /**
   * Actor performing this step (should be a known stakeholder)
   * Can be either:
   * - A Stakeholder class (with @Stakeholder decorator) for type-safe references
   * - A string stakeholder role for flexibility
   */
  actor?: Constructor | string;

  /**
   * Single expectation this step validates (singular form)
   * Can be either:
   * - An Expectation class (with @Expectation decorator) for type-safe references
   * - An expectation ID string for flexibility
   */
  expectation?: Constructor | string;

  /**
   * Multiple expectations this step validates (plural form)
   * Can be either:
   * - Expectation classes (with @Expectation decorator) for type-safe references
   * - Expectation ID strings for flexibility
   */
  expectations?: Array<Constructor | string>;

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
   * Human-readable description
   */
  description?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Is this step reusable across milestones?
   *
   * **Smart Default:** Automatically determined by decorator usage
   * - Class decorator: defaults to `true` (standalone, reusable)
   * - Method decorator: defaults to `false` (inline, milestone-specific)
   *
   * Only set explicitly if you want to override the smart default.
   */
  reusable?: boolean;
}

/**
 * @Step decorator
 * Marks a class or method/field as a Step (granular action within a milestone)
 *
 * Semantic Distinction:
 * - Step = Stateless, tactical action (e.g., "Click Login Button", "Enter Password")
 * - Milestone = Stateful, business-significant (e.g., "User Authenticated")
 *
 * Steps are the granular actions that lead to achieving a milestone.
 * They can have @AttachLogic applied to attach executable logic.
 *
 * @param options - Step configuration
 * @returns Class, method, or field decorator
 *
 * @example Standalone Step class (Pattern 1: Reusable)
 * ```typescript
 * ⁣@Step({
 *   order: 1,
 *   actor: AccountOwnerStakeholder,
 *   expectation: ValidFormatExpectation
 * })
 * class EnterAmountStep {}
 * ```
 *
 * @example Inline step method (Pattern 2: Milestone-specific)
 * ```typescript
 * ⁣@Milestone({
 *   stakeholder: 'Account Owner',
 *   businessEvent: 'user.authenticated',
 * })
 * class UserAuthenticationMilestone {
 *   ⁣@Step({
 *     order: 1,
 *     actor: 'Account Owner',
 *     expectations: [ValidFormatExpectation, PositiveAmountExpectation]
 *   })
 *   enterCredentials() { }
 *
 *   ⁣@Step({ order: 2, actor: 'System' })
 *   validateCredentials() { }
 *
 *   ⁣@Step({ order: 3, actor: 'System', optional: true })
 *   sendMFACode() { }
 * }
 * ```
 *
 * @example Step with attached logic
 * ```typescript
 * ⁣@Step({ order: 1, actor: 'Account Owner', expectation: ValidEmailExpectation })
 * ⁣@AttachLogic({ logic: ValidateEmailLogic, timing: 'validation' })
 * enterEmail() { }
 * ```
 *
 * @example Step with alternatives
 * ```typescript
 * ⁣@Step({
 *   order: 1,
 *   actor: 'Account Owner',
 *   alternatives: ['loginWithGoogle', 'loginWithFacebook'],
 * })
 * loginWithEmail() { }
 * ```
 */
export function Step(options: StepOptions): ClassDecorator & MethodDecorator & PropertyDecorator {
  return function (
    target: unknown,
    context?: ClassDecoratorContext | ClassMethodDecoratorContext | ClassFieldDecoratorContext
  ): unknown {
    // Handle both old-style decorators (no context) and new Stage 3 decorators (with context)
    if (!context) {
      throw new Error('@Step requires Stage 3 decorator support (TypeScript 5.0+)');
    }

    const isClassDecorator = context.kind === 'class';
    const isMethod = context.kind === 'method';
    const isField = context.kind === 'field';

    // Validate decorator is applied to a class, method, or field
    if (!isClassDecorator && !isMethod && !isField) {
      throw new Error(
        `@Step can only be applied to classes, methods, or fields.`
      );
    }

    const stepName = options.name || String(context.name);

    // Smart validation: order is required for inline steps (methods), optional for standalone (classes)
    if (isMethod && (options.order === undefined || options.order === null)) {
      throw new Error(`@Step "${stepName}": order is required for inline steps (method decorators)`);
    }

    // Store original references (could be class or string)
    const actorRef = options.actor;
    const expectationRefs = mergeReferences(options.expectation, options.expectations);

    if (isClassDecorator) {
      // Pattern 1: Standalone Step Class
      const classContext = context as ClassDecoratorContext;

      // Build step metadata (actor and expectations will be resolved in initializer)
      const metadata: StepMetadata = {
        name: stepName,
        order: options.order,
        actor: undefined, // Will be resolved in initializer
        expectations: undefined, // Will be resolved in initializer
        optional: options.optional ?? false,
        alternatives: options.alternatives,
        description: options.description,
        tags: options.tags,
        reusable: options.reusable ?? true, // Smart default: class decorators are reusable
      };

      // Store metadata using context.metadata (Stage 3 way) - available immediately!
      classContext.metadata[METADATA_KEYS.STEP] = metadata;

      classContext.addInitializer(function (this: unknown) {
        // In class decorator initializers, `this` is the constructor itself, not an instance
        const constructor = this as Constructor;

        // Extract actor role from class reference or use string directly
        if (actorRef) {
          const actorRole = extractStakeholderRole(actorRef);

          if (!actorRole && typeof actorRef !== 'string') {
            console.warn(
              `@Step "${stepName}": Could not resolve actor reference. ` +
              `Make sure the @Stakeholder decorator is applied and the class is imported.`
            );
          }

          metadata.actor = actorRole || (typeof actorRef === 'string' ? actorRef : undefined);
        }

        // Extract expectation IDs from class references or use strings directly
        if (expectationRefs.length > 0) {
          const expectationIds: string[] = [];
          for (const ref of expectationRefs) {
            const expectationId = extractExpectationId(ref);

            if (!expectationId && typeof ref !== 'string') {
              console.warn(
                `@Step "${stepName}": Could not resolve expectation reference. ` +
                `Make sure the @Expectation decorator is applied and the class is imported.`
              );
            }

            const resolvedId = expectationId || (typeof ref === 'string' ? ref : undefined);
            if (resolvedId) {
              expectationIds.push(resolvedId);
            }
          }

          if (expectationIds.length > 0) {
            metadata.expectations = expectationIds;
          }
        }

        // Auto-register with registry
        // For standalone step classes, the step itself is both the target and parent
        // This allows them to be referenced by milestones or journeys later
        const registry = StepRegistry.getInstance();
        registry.register(metadata, constructor, 'milestone'); // Use 'milestone' as default parent type
      });

      return target;
    } else {
      // Pattern 2: Inline Step Method/Field
      const methodContext = context as ClassMethodDecoratorContext | ClassFieldDecoratorContext;

      // Build step metadata (actor and expectations will be resolved in initializer)
      const metadata: StepMetadata = {
        name: stepName,
        order: options.order,
        actor: undefined, // Will be resolved in initializer
        expectations: undefined, // Will be resolved in initializer
        optional: options.optional ?? false,
        alternatives: options.alternatives,
        description: options.description,
        tags: options.tags,
        reusable: options.reusable ?? false, // Smart default: method decorators are NOT reusable
      };

      // Store metadata using Stage 3 initializer
      methodContext.addInitializer(function (this: unknown) {
        // In method decorator initializers, `this` is an instance, so use this.constructor
        const constructor = (this as object).constructor as Constructor;

        // Extract actor role from class reference or use string directly
        if (actorRef) {
          const actorRole = extractStakeholderRole(actorRef);

          if (!actorRole && typeof actorRef !== 'string') {
            console.warn(
              `@Step "${stepName}": Could not resolve actor reference. ` +
              `Make sure the @Stakeholder decorator is applied and the class is imported.`
            );
          }

          metadata.actor = actorRole || (typeof actorRef === 'string' ? actorRef : undefined);
        }

        // Extract expectation IDs from class references or use strings directly
        if (expectationRefs.length > 0) {
          const expectationIds: string[] = [];
          for (const ref of expectationRefs) {
            const expectationId = extractExpectationId(ref);

            if (!expectationId && typeof ref !== 'string') {
              console.warn(
                `@Step "${stepName}": Could not resolve expectation reference. ` +
                `Make sure the @Expectation decorator is applied and the class is imported.`
              );
            }

            const resolvedId = expectationId || (typeof ref === 'string' ? ref : undefined);
            if (resolvedId) {
              expectationIds.push(resolvedId);
            }
          }

          if (expectationIds.length > 0) {
            metadata.expectations = expectationIds;
          }
        }

        // Note: For inline steps, we don't need to store metadata via setMetadata
        // because Symbol.metadata may not be available in all Node versions.
        // The registry registration below is sufficient for functionality.

        // Auto-register with registry
        // For inline steps, assume parent is a milestone (most common case)
        // Parent type validation is not critical for functionality
        const registry = StepRegistry.getInstance();
        registry.register(metadata, constructor, 'milestone');
      });

      return undefined;
    }
  } as ClassDecorator & MethodDecorator & PropertyDecorator;
}
