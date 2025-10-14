/**
 * Event Registry
 * Singleton registry for domain events and event handlers
 * @module @bhumika/bhasha/decorators/event
 */

import type {
  DomainEventMetadata,
  EventHandlerMetadata,
} from '../../types/decorator-metadata.types.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Registry entry for domain events
 */
interface EventRegistryEntry {
  metadata: DomainEventMetadata;
  constructor: Constructor;
}

/**
 * Registry entry for event handlers
 */
interface HandlerRegistryEntry {
  metadata: EventHandlerMetadata;
  constructor: Constructor;
}

/**
 * EventRegistry - Singleton registry for domain events and handlers
 *
 * Provides:
 * - Registration and lookup for domain events
 * - Registration and lookup for event handlers
 * - Query events by context, aggregate, or type
 * - Query handlers for specific events
 * - Event-handler relationship mapping
 *
 * @example
 * ```typescript
 * const registry = EventRegistry.getInstance();
 *
 * // Get event by type
 * const event = registry.getEvent('transaction.recorded');
 *
 * // Get all handlers for an event
 * const handlers = registry.getHandlersFor('transaction.recorded');
 *
 * // Get all events for a context
 * const events = registry.getByContext('Piggy Bank');
 * ```
 */
export class EventRegistry {
  private static instance: EventRegistry;

  /**
   * Map of event type -> event registry entry
   */
  private readonly eventsByType = new Map<string, EventRegistryEntry>();

  /**
   * Map of event name -> event registry entry
   */
  private readonly eventsByName = new Map<string, EventRegistryEntry>();

  /**
   * Map of bounded context -> array of event types
   */
  private readonly eventsByContext = new Map<string, string[]>();

  /**
   * Map of aggregate type -> array of event types
   */
  private readonly eventsByAggregate = new Map<string, string[]>();

  /**
   * Map of event type -> array of handler entries
   */
  private readonly handlersByEventType = new Map<
    string,
    HandlerRegistryEntry[]
  >();

  /**
   * Map of handler name -> handler entry
   */
  private readonly handlersByName = new Map<string, HandlerRegistryEntry>();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EventRegistry {
    if (!EventRegistry.instance) {
      EventRegistry.instance = new EventRegistry();
    }
    return EventRegistry.instance;
  }

  /**
   * Register a domain event in the registry
   * Called automatically by @DomainEvent decorator
   *
   * @param metadata - Domain event metadata
   * @param constructor - Event class constructor
   * @throws Error if event with same type already exists
   */
  public registerEvent(
    metadata: DomainEventMetadata,
    constructor: Constructor
  ): void {
    const { eventType, context, aggregateType } = metadata;

    // Ensure eventType is present
    if (!eventType) {
      throw new Error(
        `@DomainEvent: eventType is required but was not provided`
      );
    }

    // Check for duplicates by event type
    if (this.eventsByType.has(eventType)) {
      throw new Error(
        `@DomainEvent "${eventType}": Event with this type already exists. ` +
          `Event types must be unique.`
      );
    }

    // Store in main registries
    const entry: EventRegistryEntry = { metadata, constructor };
    this.eventsByType.set(eventType, entry);

    // Index by name if available (use constructor name as fallback)
    const eventName = constructor.name;
    this.eventsByName.set(eventName, entry);

    // Index by bounded context
    if (context) {
      const contextIndex = this.eventsByContext.get(context) || [];
      contextIndex.push(eventType);
      this.eventsByContext.set(context, contextIndex);
    }

    // Index by aggregate type
    if (aggregateType) {
      const aggregateIndex = this.eventsByAggregate.get(aggregateType) || [];
      aggregateIndex.push(eventType);
      this.eventsByAggregate.set(aggregateType, aggregateIndex);
    }
  }

  /**
   * Register an event handler in the registry
   * Called automatically by @EventHandler decorator
   *
   * @param metadata - Event handler metadata
   * @param constructor - Handler class constructor
   */
  public registerHandler(
    metadata: EventHandlerMetadata,
    constructor: Constructor
  ): void {
    const { eventType } = metadata;
    const handlerName = constructor.name;

    // Ensure eventType is present
    if (!eventType) {
      throw new Error(
        `@EventHandler: eventType is required but was not provided`
      );
    }

    // Store handler entry
    const entry: HandlerRegistryEntry = { metadata, constructor };

    // Index by event type
    const handlers = this.handlersByEventType.get(eventType) || [];
    handlers.push(entry);

    // Sort handlers by priority (higher priority first)
    handlers.sort((a, b) => {
      const priorityA = a.metadata.priority ?? 0;
      const priorityB = b.metadata.priority ?? 0;
      return priorityB - priorityA;
    });

    this.handlersByEventType.set(eventType, handlers);

    // Index by handler name
    this.handlersByName.set(handlerName, entry);
  }

  /**
   * Get event by event type
   * @param eventType - Event type identifier (e.g., 'transaction.recorded')
   * @returns Event registry entry or undefined
   */
  public getEvent(eventType: string): EventRegistryEntry | undefined {
    return this.eventsByType.get(eventType);
  }

  /**
   * Get event by name
   * @param name - Event class name
   * @returns Event registry entry or undefined
   */
  public getEventByName(name: string): EventRegistryEntry | undefined {
    return this.eventsByName.get(name);
  }

  /**
   * Get all events for a specific bounded context
   * @param context - Bounded context name
   * @returns Array of event entries
   */
  public getByContext(context: string): EventRegistryEntry[] {
    const eventTypes = this.eventsByContext.get(context) || [];
    return eventTypes
      .map((type) => this.eventsByType.get(type))
      .filter((entry): entry is EventRegistryEntry => entry !== undefined);
  }

  /**
   * Get all events emitted by a specific aggregate
   * @param aggregateType - Aggregate type name
   * @returns Array of event entries
   */
  public getByAggregate(aggregateType: string): EventRegistryEntry[] {
    const eventTypes = this.eventsByAggregate.get(aggregateType) || [];
    return eventTypes
      .map((type) => this.eventsByType.get(type))
      .filter((entry): entry is EventRegistryEntry => entry !== undefined);
  }

  /**
   * Get all registered domain events
   * @returns Array of all event entries
   */
  public getAllEvents(): EventRegistryEntry[] {
    return Array.from(this.eventsByType.values());
  }

  /**
   * Get all event types
   * @returns Array of event type strings
   */
  public getAllEventTypes(): string[] {
    return Array.from(this.eventsByType.keys());
  }

  /**
   * Get all handlers for a specific event type
   * @param eventType - Event type identifier
   * @returns Array of handler entries, sorted by priority
   */
  public getHandlersFor(eventType: string): HandlerRegistryEntry[] {
    return this.handlersByEventType.get(eventType) || [];
  }

  /**
   * Get handler by name
   * @param name - Handler class name
   * @returns Handler registry entry or undefined
   */
  public getHandlerByName(name: string): HandlerRegistryEntry | undefined {
    return this.handlersByName.get(name);
  }

  /**
   * Get all registered event handlers
   * @returns Array of all handler entries
   */
  public getAllHandlers(): HandlerRegistryEntry[] {
    const allHandlers: HandlerRegistryEntry[] = [];
    for (const handlers of this.handlersByEventType.values()) {
      allHandlers.push(...handlers);
    }
    // Remove duplicates (same handler might be in multiple event type arrays)
    return Array.from(new Set(allHandlers));
  }

  /**
   * Check if an event type is registered
   * @param eventType - Event type to check
   * @returns True if event is registered
   */
  public hasEvent(eventType: string): boolean {
    return this.eventsByType.has(eventType);
  }

  /**
   * Check if there are handlers for an event type
   * @param eventType - Event type to check
   * @returns True if there are handlers registered
   */
  public hasHandlersFor(eventType: string): boolean {
    const handlers = this.handlersByEventType.get(eventType);
    return handlers !== undefined && handlers.length > 0;
  }

  /**
   * Get event-to-handlers mapping
   * Useful for visualization and documentation
   * @returns Map of event type to handler count
   */
  public getEventHandlerMap(): Map<string, number> {
    const map = new Map<string, number>();
    for (const [eventType, handlers] of this.handlersByEventType.entries()) {
      map.set(eventType, handlers.length);
    }
    return map;
  }

  /**
   * Get all bounded contexts that have events
   * @returns Array of context names
   */
  public getAllContexts(): string[] {
    return Array.from(this.eventsByContext.keys());
  }

  /**
   * Get all aggregate types that emit events
   * @returns Array of aggregate type names
   */
  public getAllAggregates(): string[] {
    return Array.from(this.eventsByAggregate.keys());
  }

  /**
   * Clear all registered events and handlers (useful for testing)
   */
  public clear(): void {
    this.eventsByType.clear();
    this.eventsByName.clear();
    this.eventsByContext.clear();
    this.eventsByAggregate.clear();
    this.handlersByEventType.clear();
    this.handlersByName.clear();
  }

  /**
   * Get registry statistics
   * @returns Statistics about registered events and handlers
   */
  public getStats(): {
    totalEvents: number;
    totalHandlers: number;
    byContext: Record<string, number>;
    byAggregate: Record<string, number>;
    eventsWithHandlers: number;
    eventsWithoutHandlers: number;
  } {
    const byContext: Record<string, number> = {};
    for (const [context, eventTypes] of this.eventsByContext.entries()) {
      byContext[context] = eventTypes.length;
    }

    const byAggregate: Record<string, number> = {};
    for (const [
      aggregateType,
      eventTypes,
    ] of this.eventsByAggregate.entries()) {
      byAggregate[aggregateType] = eventTypes.length;
    }

    let eventsWithHandlers = 0;
    let eventsWithoutHandlers = 0;

    for (const eventType of this.eventsByType.keys()) {
      if (this.hasHandlersFor(eventType)) {
        eventsWithHandlers++;
      } else {
        eventsWithoutHandlers++;
      }
    }

    return {
      totalEvents: this.eventsByType.size,
      totalHandlers: this.getAllHandlers().length,
      byContext,
      byAggregate,
      eventsWithHandlers,
      eventsWithoutHandlers,
    };
  }
}
