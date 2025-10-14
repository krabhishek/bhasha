/**
 * Aggregate Root interface
 * Represents the root entity of an aggregate
 * @module @bhumika/bhasha/interfaces
 */

import type { IEntity } from './entity.interface.js';
import type { IDomainEvent } from './domain-event.interface.js';

/**
 * Base interface for aggregate roots
 * Aggregate roots control access to aggregate internals and emit domain events
 *
 * An aggregate is a cluster of domain objects (entities and value objects)
 * that are treated as a single unit. The aggregate root is the only member
 * of the aggregate that outside objects are allowed to hold references to.
 */
export interface IAggregateRoot<TId = string> extends IEntity<TId> {
  /**
   * Domain events pending commit
   * These events will be dispatched after the aggregate is persisted
   */
  readonly domainEvents: readonly IDomainEvent[];

  /**
   * Add a domain event to the pending events list
   * @param event - Domain event to add
   */
  addDomainEvent(event: IDomainEvent): void;

  /**
   * Clear domain events (after commit)
   * Should be called after events are successfully dispatched
   */
  clearDomainEvents(): void;

  /**
   * Get the aggregate version (for optimistic concurrency)
   * @returns Version number
   */
  getVersion?(): number;
}
