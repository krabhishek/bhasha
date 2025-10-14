/**
 * @AttachLogic Decorator
 * Attaches executable logic to any component (Step, Expectation, Milestone, Domain models)
 * @module @bhumika/bhasha/decorators/logic
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { MilestoneClass } from '../../types/decorator-metadata.types.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Attachable logic types - used for attaching logic to methods/fields
 * (Distinct from LogicReference in metadata types which is for logic composition)
 */
export type AttachableLogicClass = Constructor | MilestoneClass;
export type AttachableLogicName = string;
export type AttachableLogic = AttachableLogicClass | AttachableLogicName;
export type AttachableLogicList = AttachableLogic | AttachableLogic[];

/**
 * Attached logic metadata entry
 */
export interface AttachedLogicEntry {
  /**
   * Member name (method/field name) this logic is attached to
   */
  memberName: string;

  /**
   * Logic classes or names
   */
  logic: AttachableLogic[];

  /**
   * When to execute this logic (optional condition)
   * Example: 'before', 'after', 'validation', 'authorization'
   */
  timing?: string;

  /**
   * Description of why this logic is attached
   */
  description?: string;
}

/**
 * Options for @AttachLogic decorator
 */
export interface AttachLogicOptions {
  /**
   * Logic to attach (single class, array of classes, string name, or array of names)
   */
  logic: AttachableLogicList;

  /**
   * When to execute this logic
   * Example: 'before', 'after', 'validation', 'authorization'
   */
  timing?: string;

  /**
   * Description of why this logic is attached
   */
  description?: string;
}

/**
 * Normalize logic references to an array
 */
function normalizeLogicReferences(logic: AttachableLogicList): AttachableLogic[] {
  return Array.isArray(logic) ? logic : [logic];
}

/**
 * @AttachLogic decorator
 * Attaches executable logic to methods or fields
 *
 * Can attach logic to:
 * - @Step methods
 * - @Expectation methods
 * - @Milestone methods/classes
 * - Domain model methods
 * - Any other method/field that needs executable logic
 *
 * Logic can be referenced by:
 * - Class reference: ValidateEmailLogic
 * - String name: 'ValidateEmail'
 * - Array of classes or names: [ValidateEmailLogic, 'CheckPermission']
 *
 * @param options - Logic attachment configuration
 * @returns Method or field decorator
 *
 * @example Attach single logic to a step
 * ```typescript
 * ⁣@Journey({ primaryStakeholder: 'Account Owner' })
 * class DepositMoneyJourney {
 *   ⁣@Milestone({ stakeholder: 'Account Owner', order: 1 })
 *   class InitiateDeposit {
 *     ⁣@Step({ order: 1 })
 *     ⁣@AttachLogic({ logic: ValidateAmountLogic, timing: 'before' })
 *     enterAmount() { }
 *   }
 * }
 * ```
 *
 * @example Attach multiple logic to expectation
 * ```typescript
 * ⁣@Expectation({
 *   expectingStakeholder: 'Account Owner',
 *   providingStakeholder: 'Piggy Bank System',
 *   description: 'Deposit is processed',
 *   behaviorContract: 'Money added to account',
 * })
 * ⁣@AttachLogic({
 *   logic: [ValidateAmountLogic, ProcessDepositLogic, NotifyUserLogic],
 *   timing: 'execution',
 * })
 * processDeposit() { }
 * ```
 *
 * @example Attach logic by name
 * ```typescript
 * ⁣@Step({ order: 1 })
 * ⁣@AttachLogic({ logic: 'ValidateEmail', timing: 'validation' })
 * enterEmail() { }
 * ```
 */
export function AttachLogic(options: AttachLogicOptions) {
  return function (
    _target: unknown,
    context: ClassMethodDecoratorContext | ClassFieldDecoratorContext
  ): void {
    const isMethod = context.kind === 'method';
    const isField = context.kind === 'field';

    // Validate decorator is applied to a method or field
    if (!isMethod && !isField) {
      throw new Error(
        `@AttachLogic can only be applied to methods or fields.`
      );
    }

    // Validate logic is provided
    if (!options.logic) {
      throw new Error(
        `@AttachLogic on "${String(context.name)}": logic is required`
      );
    }

    // Access shared metadata object via context
    const metadata = context.metadata as Record<symbol, unknown>;

    // Get existing attached logic map or create new one
    const attachedLogicMap = (metadata[METADATA_KEYS.ATTACHED_LOGIC] as Map<string, AttachedLogicEntry>)
      || new Map<string, AttachedLogicEntry>();

    // Normalize logic references to array
    const logicArray = normalizeLogicReferences(options.logic);

    // Create attached logic entry
    const entry: AttachedLogicEntry = {
      memberName: String(context.name),
      logic: logicArray,
      timing: options.timing,
      description: options.description,
    };

    // Check if logic is already attached to this member
    if (attachedLogicMap.has(entry.memberName)) {
      // Merge with existing logic
      const existing = attachedLogicMap.get(entry.memberName)!;
      existing.logic = [...existing.logic, ...logicArray];
      if (options.timing && !existing.timing) {
        existing.timing = options.timing;
      }
      if (options.description && !existing.description) {
        existing.description = options.description;
      }
    } else {
      // Add new entry
      attachedLogicMap.set(entry.memberName, entry);
    }

    // Store back to metadata
    metadata[METADATA_KEYS.ATTACHED_LOGIC] = attachedLogicMap;

    // No initializer needed - metadata is already stored in Symbol.metadata
  };
}

/**
 * Get attached logic for a specific member
 * @param target - Class constructor
 * @param memberName - Method/field name
 * @returns Attached logic entry or undefined
 */
export function getAttachedLogic(
  target: Constructor,
  memberName: string
): AttachedLogicEntry | undefined {
  if (!(Symbol.metadata in target)) {
    return undefined;
  }

  type ConstructorWithMetadata = Constructor & { [Symbol.metadata]: Record<symbol, unknown> };
  const metadata = (target as ConstructorWithMetadata)[Symbol.metadata];
  const attachedLogicMap = metadata[METADATA_KEYS.ATTACHED_LOGIC] as Map<string, AttachedLogicEntry> | undefined;

  if (!attachedLogicMap) {
    return undefined;
  }

  return attachedLogicMap.get(memberName);
}

/**
 * Get all attached logic for a class
 * @param target - Class constructor
 * @returns Map of member name to attached logic entry
 */
export function getAllAttachedLogic(
  target: Constructor
): Map<string, AttachedLogicEntry> {
  if (!(Symbol.metadata in target)) {
    return new Map();
  }

  type ConstructorWithMetadata = Constructor & { [Symbol.metadata]: Record<symbol, unknown> };
  const metadata = (target as ConstructorWithMetadata)[Symbol.metadata];
  const attachedLogicMap = metadata[METADATA_KEYS.ATTACHED_LOGIC] as Map<string, AttachedLogicEntry> | undefined;

  return attachedLogicMap || new Map();
}

/**
 * Check if a member has attached logic
 * @param target - Class constructor
 * @param memberName - Method/field name
 * @returns True if member has attached logic
 */
export function hasAttachedLogic(
  target: Constructor,
  memberName: string
): boolean {
  return getAttachedLogic(target, memberName) !== undefined;
}

/**
 * Get all members with attached logic
 * @param target - Class constructor
 * @returns Array of member names that have attached logic
 */
export function getMembersWithAttachedLogic(target: Constructor): string[] {
  const allAttached = getAllAttachedLogic(target);
  return Array.from(allAttached.keys());
}
