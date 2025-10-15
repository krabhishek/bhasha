/**
 * @EventHandler Decorator
 * Marks a class as an Event Handler (reacts to domain events)
 * EventHandler is a semantic specialization of @Logic
 * @module @bhumika/bhasha/decorators/event
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type {
  EventHandlerMetadata,
  LogicMetadata,
  ContextReference,
} from '../../types/decorator-metadata.types.js';
import { setMetadata } from '../../utils/metadata.utils.js';
import { extractContextName } from '../../utils/class-reference.utils.js';
import { LogicRegistry } from '../logic/logic.registry.js';
import { EventRegistry } from './event.registry.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Event handler decorator options
 */
export interface EventHandlerOptions {
  /**
   * Handler name (defaults to class name if not provided)
   */
  name?: string;

  /**
   * Event type this handler subscribes to (required)
   * Can be either:
   * - Event class reference (type-safe): `TransactionRecordedEvent`
   * - Event type string: `'transaction.recorded'`
   */
  eventType: Constructor | string;

  /**
   * Handler execution priority (higher = executes first)
   * Useful when multiple handlers subscribe to the same event
   * @default 0
   */
  priority?: number;

  /**
   * Is this handler asynchronous?
   * @default false
   */
  async?: boolean;

  /**
   * Bounded context this handler belongs to
   */
  context?: ContextReference;

  /**
   * Required services/repositories for dependency injection
   * Example: ['AccountRepository', 'NotificationService']
   */
  requires?: string[];

  /**
   * Is this handler idempotent (safe to execute multiple times)?
   * Idempotent handlers can be safely retried
   * @default true (most event handlers should be idempotent)
   */
  idempotent?: boolean;

  /**
   * Maximum execution time (e.g., '5s', '100ms')
   */
  timeout?: string;

  /**
   * Can this handler be retried on failure?
   * @default true
   */
  retryable?: boolean;

  /**
   * Retry configuration
   */
  retryConfig?: {
    maxAttempts: number;
    backoff?: 'linear' | 'exponential';
    delay?: string;
  };

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Example event for documentation
   */
  example?: unknown;
}

/**
 * Extract event type string from Constructor or string
 * @param eventTypeRef - Event type reference
 * @returns Event type string
 */
function extractEventType(eventTypeRef: Constructor | string): string {
  if (typeof eventTypeRef === 'string') {
    return eventTypeRef;
  }

  // It's a constructor - try to get eventType from the class
  // First check if the class has a static eventType property
  const eventClass = eventTypeRef as unknown as {
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

  // Fallback: Try to get from EventRegistry by class name
  const registry = EventRegistry.getInstance();
  const eventEntry = registry.getEventByName(eventTypeRef.name);
  if (eventEntry) {
    return eventEntry.metadata.eventType;
  }

  // Last resort: Generate from class name
  // TransactionRecordedEvent → transaction.recorded
  return eventTypeRef.name
    .replace(/Event$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    .replace(/-+/g, '.');
}

/**
 * @EventHandler decorator
 * Marks a class as an Event Handler (Logic specialization)
 *
 * Event handlers are reactive components that respond to domain events.
 * They are automatically registered in both EventRegistry (semantic) and
 * LogicRegistry (structural) as type 'event-handler'.
 *
 * Classes decorated with @EventHandler should implement IExecutableLogic<TEvent, void>
 * with an `execute(event: TEvent): void | Promise<void>` method.
 *
 * This decorator:
 * - Stores EventHandlerMetadata and LogicMetadata
 * - Auto-registers in EventRegistry for event-handler mapping
 * - Auto-registers in LogicRegistry as type: 'event-handler'
 * - Validates event type reference
 * - Supports priority-based handler ordering
 *
 * @param options - Event handler configuration
 * @returns Class decorator
 *
 * @example Basic event handler
 * ```typescript
 * ⁣@EventHandler({
 *   eventType: TransactionRecordedEvent, // Type-safe reference
 *   context: 'Piggy Bank Savings',
 *   priority: 1,
 *   async: true,
 * })
 * export class UpdateBalanceHandler implements IExecutableLogic<TransactionRecordedEvent, void> {
 *   constructor(
 *     private accountRepo: AccountRepository,
 *     private logger: Logger
 *   ) {}
 *
 *   async execute(event: TransactionRecordedEvent): Promise<void> {
 *     this.logger.info('Updating balance', { aggregateId: event.aggregateId });
 *     const account = await this.accountRepo.findById(event.aggregateId);
 *     account.updateBalance(event.payload.newBalance);
 *     await this.accountRepo.save(account);
 *   }
 * }
 * ```
 *
 * @example Handler with string reference
 * ```typescript
 * ⁣@EventHandler({
 *   eventType: 'transaction.recorded', // String reference
 *   priority: 2,
 * })
 * export class SendNotificationHandler implements IExecutableLogic<TransactionRecordedEvent, void> {
 *   execute(event: TransactionRecordedEvent): void {
 *     // Send notification
 *   }
 * }
 * ```
 *
 * @example Idempotent handler with retry
 * ```typescript
 * ⁣@EventHandler({
 *   eventType: TransactionRecordedEvent,
 *   idempotent: true,
 *   retryable: true,
 *   retryConfig: {
 *     maxAttempts: 3,
 *     backoff: 'exponential',
 *     delay: '1s',
 *   },
 * })
 * export class AuditLogHandler implements IExecutableLogic<TransactionRecordedEvent, void> {
 *   execute(event: TransactionRecordedEvent): void {
 *     // Write to audit log (idempotent operation)
 *   }
 * }
 * ```
 */
export function EventHandler(options: EventHandlerOptions) {
  return function <T extends new (...args: never[]) => unknown>(
    target: T,
    context: ClassDecoratorContext<T>
  ): T {
    const handlerName = options.name || String(context.name);

    // Extract context name from reference (class or string)
    const contextRef = options.context;
    const contextName = contextRef ? extractContextName(contextRef) : undefined;

    // Validate required field: eventType
    if (!options.eventType) {
      throw new Error(`@EventHandler "${handlerName}": eventType is required`);
    }

    // Extract event type string from reference
    const eventType = extractEventType(options.eventType);

    // Build event handler metadata
    const handlerMetadata: EventHandlerMetadata = {
      eventType,
      priority: options.priority ?? 0,
      async: options.async ?? false,
      description: options.description,
      tags: options.tags,
    };

    // Build logic metadata
    // EventHandlers are registered as Logic type: 'event-handler'
    const logicMetadata: LogicMetadata = {
      name: handlerName,
      type: 'event-handler', // This will be added to LogicType union
      inputs: { event: eventType }, // Event is the input
      outputs: { result: 'void' }, // Handlers don't return values
      pure: false, // Event handlers typically have side effects
      idempotent: options.idempotent ?? true, // Most handlers should be idempotent
      cacheable: false, // Don't cache event handler results
      retryable: options.retryable ?? true,
      timeout: options.timeout,
      context: contextName,
      requires: options.requires,
      description: options.description,
      tags: options.tags,
      examples: options.example
        ? [
            {
              input: options.example,
              output: undefined,
              description: 'Example event',
            },
          ]
        : undefined,
    };

    // Store metadata and register in registries using Stage 3 initializer
    context.addInitializer(function (this: unknown) {
      const constructor = (this as object).constructor as new (
        ...args: never[]
      ) => unknown;

      // Store both event handler metadata and logic metadata
      setMetadata(METADATA_KEYS.EVENT_HANDLER, handlerMetadata, constructor);
      setMetadata(METADATA_KEYS.LOGIC, logicMetadata, constructor);

      // Auto-register in EventRegistry (semantic layer)
      const eventRegistry = EventRegistry.getInstance();
      eventRegistry.registerHandler(handlerMetadata, constructor);

      // Auto-register in LogicRegistry (structural layer)
      const logicRegistry = LogicRegistry.getInstance();
      logicRegistry.register(logicMetadata, constructor);
    });

    return target;
  };
}
