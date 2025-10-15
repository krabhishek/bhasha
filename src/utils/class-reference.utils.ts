/**
 * Utilities for working with class references in decorators
 * Supports type-safe class references while maintaining string flexibility
 * @module @bhumika/bhasha/utils
 */

import { METADATA_KEYS } from '../constants/metadata-keys.js';
import { getMetadata } from './metadata.utils.js';
import { StakeholderRegistry, PersonaRegistry } from '../decorators/stakeholder/registries.js';
import { BoundedContextRegistry } from '../decorators/domain/registries.js';
import type {
  StakeholderMetadata,
  ExpectationMetadata,
  BehaviorMetadata,
  PersonaMetadata,
  DomainEventMetadata,
  BoundedContextMetadata,
} from '../types/decorator-metadata.types.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Extract persona name from either a class reference or string
 *
 * @param persona - Persona class (with @Persona decorator) or name string
 * @returns Persona name string
 *
 * @example
 * ```typescript
 * // From class reference
 * extractPersonaName(ChildSaverPersona) // => "ChildSaver"
 *
 * // From string
 * extractPersonaName("ChildSaver") // => "ChildSaver"
 * ```
 */
export function extractPersonaName(persona: Constructor | string | undefined): string | undefined {
  if (!persona) {
    return undefined;
  }

  if (typeof persona === 'string') {
    return persona;
  }

  // Try to get name from @Persona metadata
  const metadata = getMetadata<PersonaMetadata>(
    METADATA_KEYS.PERSONA,
    persona
  );

  if (metadata?.name) {
    return metadata.name;
  }

  // If Symbol.metadata not available, try to get from PersonaRegistry
  // Search all personas in the registry for one with matching class
  const allPersonas = PersonaRegistry.getAll();
  for (const [, entry] of allPersonas) {
    if (entry.target === persona || entry.target.name === persona.name) {
      return entry.metadata.name;
    }
  }

  // Return undefined if no metadata found - this indicates an error
  // Caller should handle this appropriately (validation error, warning, etc.)
  return undefined;
}

/**
 * Extract stakeholder role from either a class reference or string
 *
 * @param stakeholder - Stakeholder class (with @Stakeholder decorator) or role string
 * @returns Stakeholder role string
 *
 * @example
 * ```typescript
 * // From class reference
 * extractStakeholderRole(AccountOwnerStakeholder) // => "Account Owner"
 *
 * // From string
 * extractStakeholderRole("Account Owner") // => "Account Owner"
 * ```
 */
export function extractStakeholderRole(stakeholder: Constructor | string | undefined): string | undefined {
  if (!stakeholder) {
    return undefined;
  }

  if (typeof stakeholder === 'string') {
    return stakeholder;
  }

  // Try to get role from @Stakeholder metadata
  const metadata = getMetadata<StakeholderMetadata>(
    METADATA_KEYS.STAKEHOLDER,
    stakeholder
  );

  if (metadata?.role) {
    return metadata.role;
  }

  // If Symbol.metadata not available, try to get from StakeholderRegistry
  // Search all stakeholders in the registry for one with matching class name
  const allStakeholders = StakeholderRegistry.getAll();
  for (const [, entry] of allStakeholders) {
    if (entry.target === stakeholder || entry.target.name === stakeholder.name) {
      return entry.metadata.role;
    }
  }

  // Return undefined if no metadata found - this indicates an error
  // Caller should handle this appropriately (validation error, warning, etc.)
  return undefined;
}

/**
 * Extract expectation ID from either a class reference or string
 *
 * @param expectation - Expectation class (with @Expectation decorator) or ID string
 * @returns Expectation ID string
 *
 * @example
 * ```typescript
 * // From class reference
 * extractExpectationId(PositiveAmountExpectation) // => "deposit-money-EXP-001"
 *
 * // From string
 * extractExpectationId("deposit-money-EXP-001") // => "deposit-money-EXP-001"
 * ```
 */
export function extractExpectationId(expectation: Constructor | string | undefined): string | undefined {
  if (!expectation) {
    return undefined;
  }

  if (typeof expectation === 'string') {
    return expectation;
  }

  // Try to get expectationId from @Expectation metadata
  const metadata = getMetadata<ExpectationMetadata>(
    METADATA_KEYS.EXPECTATION,
    expectation
  );

  if (metadata?.expectationId) {
    return metadata.expectationId;
  }

  // Return undefined if no expectationId found - indicates an error
  return undefined;
}

/**
 * Extract behavior name from either a class reference or string
 *
 * @param behavior - Behavior class (with @Behavior decorator) or name string
 * @returns Behavior name string
 *
 * @example
 * ```typescript
 * // From class reference
 * extractBehaviorName(ValidateFormatBehavior) // => "ValidateFormatBehavior"
 *
 * // From string
 * extractBehaviorName("ValidateFormatBehavior") // => "ValidateFormatBehavior"
 * ```
 */
export function extractBehaviorName(behavior: Constructor | string | undefined): string | undefined {
  if (!behavior) {
    return undefined;
  }

  if (typeof behavior === 'string') {
    return behavior;
  }

  // Try to get name from @Behavior metadata
  const metadata = getMetadata<BehaviorMetadata>(
    METADATA_KEYS.BEHAVIOR,
    behavior
  );

  if (metadata?.name) {
    return metadata.name;
  }

  // Fallback to class name if metadata not available
  return behavior.name;
}

/**
 * Extract array of stakeholder roles from mixed array of classes and strings
 *
 * @param stakeholders - Array of Stakeholder classes or role strings
 * @returns Array of stakeholder role strings
 *
 * @example
 * ```typescript
 * extractStakeholderRoles([
 *   AccountOwnerStakeholder,
 *   "Guest User",
 *   SystemStakeholder
 * ]) // => ["Account Owner", "Guest User", "System"]
 * ```
 */
export function extractStakeholderRoles(
  stakeholders: Array<Constructor | string>
): string[] {
  return stakeholders
    .map(extractStakeholderRole)
    .filter((role): role is string => role !== undefined);
}

/**
 * Extract event type from either a class reference or string
 *
 * @param event - Event class (with @DomainEvent decorator) or event type string
 * @returns Event type string (e.g., 'transaction.recorded')
 *
 * @example
 * ```typescript
 * // From class reference
 * extractEventType(TransactionRecordedEvent) // => "transaction.recorded"
 *
 * // From string
 * extractEventType("transaction.recorded") // => "transaction.recorded"
 * ```
 */
export function extractEventType(event: Constructor | string | undefined): string | undefined {
  if (!event) {
    return undefined;
  }

  if (typeof event === 'string') {
    return event;
  }

  // Try to get eventType from @DomainEvent metadata
  const metadata = getMetadata<DomainEventMetadata>(
    METADATA_KEYS.DOMAIN_EVENT,
    event
  );

  if (metadata?.eventType) {
    return metadata.eventType;
  }

  // Check if the class has a static eventType property
  const eventClass = event as unknown as {
    eventType?: string;
    prototype?: { eventType?: string };
  };

  if (eventClass.eventType) {
    return eventClass.eventType;
  }

  // Check if instances have eventType
  if (eventClass.prototype && eventClass.prototype.eventType) {
    return eventClass.prototype.eventType;
  }

  // Fallback: Generate from class name
  // TransactionRecordedEvent → transaction.recorded
  return event.name
    .replace(/Event$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    .replace(/-+/g, '.');
}

/**
 * Extract bounded context name from either a class reference or string
 *
 * @param context - BoundedContext class (with @BoundedContext decorator) or context name string
 * @returns Context name string
 *
 * @example
 * ```typescript
 * // From class reference
 * extractContextName(OrderManagementContext) // => "Order Management"
 *
 * // From string
 * extractContextName("Order Management") // => "Order Management"
 * ```
 */
export function extractContextName(context: Constructor | string | undefined): string | undefined {
  if (!context) {
    return undefined;
  }

  if (typeof context === 'string') {
    return context;
  }

  // Try to get name from @BoundedContext metadata
  const metadata = getMetadata<BoundedContextMetadata>(
    METADATA_KEYS.BOUNDED_CONTEXT,
    context
  );

  if (metadata?.name) {
    return metadata.name;
  }

  // If Symbol.metadata not available, try to get from BoundedContextRegistry
  // Search all contexts in the registry for one with matching class
  const allContexts = BoundedContextRegistry.getAll();
  for (const [, entry] of allContexts) {
    if (entry.target === context || entry.target.name === context.name) {
      return entry.metadata.name;
    }
  }

  // Return undefined if no metadata found - this indicates an error
  // Caller should handle this appropriately (validation error, warning, etc.)
  return undefined;
}
