/**
 * Base class for aggregate roots
 * Optional utility class providing common aggregate root logic
 * @module @bhumika/bhasha/base
 */

import { BaseEntity } from './entity.base.js';
import type { IAggregateRoot } from '../interfaces/aggregate-root.interface.js';
import type { IDomainEvent } from '../interfaces/domain-event.interface.js';

/**
 * Optional base class for aggregate roots
 * Manages domain events and provides aggregate root utilities
 *
 * Usage:
 * ```typescript
 * @Entity()
 * @AggregateRoot()
 * class Order extends BaseAggregateRoot<string> {
 *   @PrimaryGeneratedColumn('uuid')
 *   id: string;
 *
 *   confirm(): void {
 *     this.status = 'confirmed';
 *
 *     // Emit domain event
 *     this.addDomainEvent(
 *       this.createDomainEvent('OrderConfirmed', {
 *         orderId: this.id,
 *         confirmedAt: new Date(),
 *       })
 *     );
 *   }
 * }
 * ```
 */
export abstract class BaseAggregateRoot<TId = string>
  extends BaseEntity<TId>
  implements IAggregateRoot<TId>
{
  /**
   * Domain events pending dispatch
   * @private
   */
  private _domainEvents: IDomainEvent[] = [];

  /**
   * Optional version field for optimistic concurrency
   * If your entity has a version column, override this getter
   */
  protected _version?: number;

  /**
   * Get domain events (read-only)
   * Returns frozen copy to prevent external modification
   */
  get domainEvents(): readonly IDomainEvent[] {
    return Object.freeze([...this._domainEvents]);
  }

  /**
   * Add a domain event to pending events
   * Event will be dispatched after aggregate is persisted
   * @param event - Domain event to add
   */
  addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Clear all pending domain events
   * Should be called after events are successfully dispatched
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Get aggregate version (for optimistic concurrency)
   * Override this if your entity has a version field
   * @returns Version number
   */
  getVersion?(): number {
    return this._version ?? 0;
  }

  /**
   * Helper to create domain event
   * Provides a convenient way to create events with common fields
   * @param eventType - Event type/name
   * @param payload - Event payload
   * @param options - Optional event options
   * @returns Domain event
   */
  protected createDomainEvent<TPayload = Record<string, unknown>>(
    eventType: string,
    payload: TPayload,
    options?: {
      correlationId?: string;
      causationId?: string;
      version?: number;
    }
  ): IDomainEvent<TPayload> {
    return {
      eventType,
      occurredAt: new Date(),
      aggregateId: String(this.id),
      payload,
      version: options?.version,
      correlationId: options?.correlationId,
      causationId: options?.causationId,
    };
  }

  /**
   * Helper to apply domain event
   * Override this to implement event sourcing
   * @param event - Domain event to apply
   */
  protected applyEvent?(event: IDomainEvent): void;

  /**
   * Helper to check if aggregate has pending events
   * @returns True if there are pending domain events
   */
  hasPendingEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}
