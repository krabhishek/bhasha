/**
 * Domain event interface
 * Represents something that happened in the domain
 * @module @bhumika/bhasha/interfaces
 */

/**
 * Base interface for domain events
 * Domain events represent state changes in aggregates
 */
export interface IDomainEvent<TPayload = Record<string, unknown>> {
  /**
   * Event type/name (e.g., "OrderPlaced", "PaymentReceived")
   */
  readonly eventType: string;

  /**
   * When the event occurred
   */
  readonly occurredAt: Date;

  /**
   * Aggregate ID that emitted the event
   */
  readonly aggregateId: string;

  /**
   * Event payload (event-specific data)
   */
  readonly payload: TPayload;

  /**
   * Event version (for event versioning)
   */
  readonly version?: number;

  /**
   * Correlation ID (for tracking across services)
   */
  readonly correlationId?: string;

  /**
   * Causation ID (ID of the command that caused this event)
   */
  readonly causationId?: string;
}
