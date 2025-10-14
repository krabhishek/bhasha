/**
 * @DomainEvent Decorator
 * Marks a class as a Domain Event (something that happened in the domain)
 * @module @bhumika/bhasha/decorators/event
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { DomainEventMetadata } from '../../types/decorator-metadata.types.js';
import { setMetadata } from '../../utils/metadata.utils.js';
import { EventRegistry } from './event.registry.js';

/**
 * Domain event decorator options
 */
export interface DomainEventOptions {
  /**
   * Event name (defaults to class name if not provided)
   */
  name?: string;

  /**
   * Event type identifier (e.g., 'transaction.recorded', 'user.authenticated')
   * If not provided, will be generated from class name in kebab-case
   */
  eventType?: string;

  /**
   * Bounded context this event belongs to
   */
  context?: string;

  /**
   * Aggregate type that emits this event
   * Example: 'PiggyBankAccount', 'Order', 'User'
   */
  aggregateType?: string;

  /**
   * Event payload schema (for documentation and validation)
   * Example: { transactionId: 'string', amount: 'Money', timestamp: 'Date' }
   */
  schema?: Record<string, string>;

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Example event payload for documentation
   */
  example?: unknown;
}

/**
 * @DomainEvent decorator
 * Marks a class as a Domain Event
 *
 * Domain events represent something that happened in the past in the domain.
 * They are immutable facts that other parts of the system can react to.
 *
 * Classes decorated with @DomainEvent should implement IDomainEvent<TPayload> interface.
 *
 * This decorator:
 * - Validates and stores event metadata
 * - Auto-registers event in EventRegistry
 * - Enables type-safe event references in Journey/Milestone
 *
 * @param options - Domain event configuration
 * @returns Class decorator
 *
 * @example Basic domain event
 * ```typescript
 * ⁣@DomainEvent({
 *   eventType: 'transaction.recorded',
 *   context: 'Piggy Bank Savings',
 *   aggregateType: 'PiggyBankAccount',
 *   schema: {
 *     transactionId: 'string',
 *     amount: 'Money',
 *     newBalance: 'number',
 *   }
 * })
 * export class TransactionRecordedEvent implements IDomainEvent<{
 *   transactionId: string;
 *   amount: Money;
 *   newBalance: number;
 * }> {
 *   readonly eventType = 'transaction.recorded';
 *   readonly occurredAt: Date;
 *   readonly aggregateId: string;
 *   readonly payload: {
 *     transactionId: string;
 *     amount: Money;
 *     newBalance: number;
 *   };
 *
 *   constructor(
 *     aggregateId: string,
 *     payload: { transactionId: string; amount: Money; newBalance: number }
 *   ) {
 *     this.aggregateId = aggregateId;
 *     this.payload = payload;
 *     this.occurredAt = new Date();
 *   }
 * }
 * ```
 *
 * @example Using in milestone
 * ```typescript
 * ⁣@Milestone({
 *   name: 'Transaction Recorded',
 *   stakeholder: AccountOwnerStakeholder,
 *   businessEvent: TransactionRecordedEvent, // ← Type-safe reference
 * })
 * export class TransactionRecordedMilestone {}
 * ```
 */
export function DomainEvent(options: DomainEventOptions = {}) {
  return function <T extends new (...args: never[]) => unknown>(
    target: T,
    context: ClassDecoratorContext<T>
  ): T {
    const eventName = options.name || String(context.name);

    // Generate eventType from class name if not provided
    // Convert PascalCase to kebab-case
    // Example: TransactionRecordedEvent → transaction-recorded-event
    const generateEventType = (name: string): string => {
      return name
        .replace(/Event$/, '') // Remove 'Event' suffix
        .replace(/([a-z])([A-Z])/g, '$1-$2') // Add hyphen between lowercase and uppercase
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Handle consecutive capitals
        .toLowerCase()
        .replace(/-+/g, '.'); // Replace hyphens with dots for event naming convention
    };

    const eventType = options.eventType || generateEventType(eventName);

    // Build domain event metadata
    const metadata: DomainEventMetadata = {
      eventType,
      context: options.context,
      aggregateType: options.aggregateType,
      description: options.description,
      tags: options.tags,
    };

    // Store metadata and register in registry using Stage 3 initializer
    context.addInitializer(function (this: unknown) {
      const constructor = (this as object).constructor as new (
        ...args: never[]
      ) => unknown;

      // Store metadata using Symbol.metadata
      setMetadata(METADATA_KEYS.DOMAIN_EVENT, metadata, constructor);

      // Auto-register in EventRegistry
      const registry = EventRegistry.getInstance();
      registry.registerEvent(metadata, constructor);
    });

    return target;
  };
}
