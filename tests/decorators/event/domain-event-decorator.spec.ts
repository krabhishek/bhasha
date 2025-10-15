/**
 * Behavioral tests for @DomainEvent decorator
 * Tests only the public API and observable behavior (registry-based tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DomainEvent, EventRegistry } from '../../../src/index.js';
import type { IDomainEvent } from '../../../src/interfaces/domain-event.interface.js';

describe('@DomainEvent Decorator - Registry Integration', () => {
  beforeEach(() => {
    const eventRegistry = EventRegistry.getInstance();
    eventRegistry.clear();
  });

  it('should auto-register event in EventRegistry', () => {
    @DomainEvent({
      eventType: 'test.event',
    })
    class TestEvent implements IDomainEvent {
      readonly eventType = 'test.event';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new TestEvent();

    const registry = EventRegistry.getInstance();
    const registered = registry.getEvent('test.event');
    expect(registered).toBeDefined();
    expect(registered?.metadata.eventType).toBe('test.event');
  });

  it('should be queryable by event type', () => {
    @DomainEvent({
      eventType: 'transaction.recorded',
    })
    class TransactionRecordedEvent implements IDomainEvent {
      readonly eventType = 'transaction.recorded';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new TransactionRecordedEvent();

    const registry = EventRegistry.getInstance();
    const event = registry.getEvent('transaction.recorded');
    expect(event).toBeDefined();
    expect(event?.metadata.eventType).toBe('transaction.recorded');
  });


  it('should throw error for duplicate event types', () => {
    @DomainEvent({
      eventType: 'duplicate.event',
    })
    class Event1 implements IDomainEvent {
      readonly eventType = 'duplicate.event';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new Event1();

    expect(() => {
      @DomainEvent({
        eventType: 'duplicate.event',
      })
      class Event2 implements IDomainEvent {
        readonly eventType = 'duplicate.event';
        readonly occurredAt = new Date();
        readonly aggregateId = 'test-id';
        readonly payload = {};
      }

      new Event2();
    }).toThrow(/already exists/);
  });
});

describe('@DomainEvent Decorator - Event Type Generation', () => {
  beforeEach(() => {
    const eventRegistry = EventRegistry.getInstance();
    eventRegistry.clear();
  });

  it('should auto-generate eventType from class name if not provided', () => {
    @DomainEvent()
    class TransactionRecordedEvent implements IDomainEvent {
      readonly eventType = 'transaction.recorded';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new TransactionRecordedEvent();

    const registry = EventRegistry.getInstance();
    const event = registry.getEvent('transaction.recorded');
    expect(event).toBeDefined();
    expect(event?.metadata.eventType).toBe('transaction.recorded');
  });

  it('should convert PascalCase class name to dot.case event type', () => {
    @DomainEvent()
    class UserAccountActivatedEvent implements IDomainEvent {
      readonly eventType = 'user.account.activated';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new UserAccountActivatedEvent();

    const registry = EventRegistry.getInstance();
    const event = registry.getEvent('user.account.activated');
    expect(event).toBeDefined();
  });

  it('should remove "Event" suffix when generating eventType', () => {
    @DomainEvent()
    class PaymentProcessedEvent implements IDomainEvent {
      readonly eventType = 'payment.processed';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new PaymentProcessedEvent();

    const registry = EventRegistry.getInstance();
    const event = registry.getEvent('payment.processed');
    expect(event).toBeDefined();
  });

  it('should accept explicit eventType that differs from class name', () => {
    @DomainEvent({
      eventType: 'custom.event.type',
    })
    class SomeEvent implements IDomainEvent {
      readonly eventType = 'custom.event.type';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new SomeEvent();

    const registry = EventRegistry.getInstance();
    const event = registry.getEvent('custom.event.type');
    expect(event).toBeDefined();
  });
});

describe('@DomainEvent Decorator - Contextual Information', () => {
  beforeEach(() => {
    const eventRegistry = EventRegistry.getInstance();
    eventRegistry.clear();
  });

  it('should store bounded context', () => {
    @DomainEvent({
      eventType: 'transaction.recorded',
      context: 'Piggy Bank Savings',
    })
    class TransactionRecordedEvent implements IDomainEvent {
      readonly eventType = 'transaction.recorded';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new TransactionRecordedEvent();

    const registry = EventRegistry.getInstance();
    const event = registry.getEvent('transaction.recorded');
    expect(event?.metadata.context).toBe('Piggy Bank Savings');
  });

  it('should store aggregate type', () => {
    @DomainEvent({
      eventType: 'transaction.recorded',
      aggregateType: 'PiggyBankAccount',
    })
    class TransactionRecordedEvent implements IDomainEvent {
      readonly eventType = 'transaction.recorded';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new TransactionRecordedEvent();

    const registry = EventRegistry.getInstance();
    const event = registry.getEvent('transaction.recorded');
    expect(event?.metadata.aggregateType).toBe('PiggyBankAccount');
  });

  it('should store description and tags', () => {
    @DomainEvent({
      eventType: 'transaction.recorded',
      description: 'Emitted when a transaction is successfully recorded',
      tags: ['financial', 'audit'],
    })
    class TransactionRecordedEvent implements IDomainEvent {
      readonly eventType = 'transaction.recorded';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new TransactionRecordedEvent();

    const registry = EventRegistry.getInstance();
    const event = registry.getEvent('transaction.recorded');
    expect(event?.metadata.description).toBe('Emitted when a transaction is successfully recorded');
    expect(event?.metadata.tags).toEqual(['financial', 'audit']);
  });

  it('should store all metadata together', () => {
    @DomainEvent({
      eventType: 'balance.updated',
      context: 'Piggy Bank Savings',
      aggregateType: 'PiggyBankAccount',
      description: 'Balance changed in account',
      tags: ['financial', 'real-time'],
    })
    class BalanceUpdatedEvent implements IDomainEvent {
      readonly eventType = 'balance.updated';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new BalanceUpdatedEvent();

    const registry = EventRegistry.getInstance();
    const event = registry.getEvent('balance.updated');
    expect(event?.metadata.eventType).toBe('balance.updated');
    expect(event?.metadata.context).toBe('Piggy Bank Savings');
    expect(event?.metadata.aggregateType).toBe('PiggyBankAccount');
    expect(event?.metadata.description).toBe('Balance changed in account');
    expect(event?.metadata.tags).toEqual(['financial', 'real-time']);
  });
});

describe('@DomainEvent Decorator - Context-Based Queries', () => {
  beforeEach(() => {
    const eventRegistry = EventRegistry.getInstance();
    eventRegistry.clear();
  });

  it('should support querying events by context', () => {
    @DomainEvent({
      eventType: 'transaction.recorded',
      context: 'Banking',
    })
    class TransactionRecordedEvent implements IDomainEvent {
      readonly eventType = 'transaction.recorded';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    @DomainEvent({
      eventType: 'balance.updated',
      context: 'Banking',
    })
    class BalanceUpdatedEvent implements IDomainEvent {
      readonly eventType = 'balance.updated';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    @DomainEvent({
      eventType: 'user.registered',
      context: 'User Management',
    })
    class UserRegisteredEvent implements IDomainEvent {
      readonly eventType = 'user.registered';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    // Trigger registrations
    new TransactionRecordedEvent();
    new BalanceUpdatedEvent();
    new UserRegisteredEvent();

    const registry = EventRegistry.getInstance();
    const bankingEvents = registry.getByContext('Banking');
    expect(bankingEvents).toHaveLength(2);
  });

  it('should support querying events by aggregate type', () => {
    @DomainEvent({
      eventType: 'balance.updated',
      aggregateType: 'Account',
    })
    class BalanceUpdatedEvent implements IDomainEvent {
      readonly eventType = 'balance.updated';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    @DomainEvent({
      eventType: 'account.closed',
      aggregateType: 'Account',
    })
    class AccountClosedEvent implements IDomainEvent {
      readonly eventType = 'account.closed';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    @DomainEvent({
      eventType: 'user.registered',
      aggregateType: 'User',
    })
    class UserRegisteredEvent implements IDomainEvent {
      readonly eventType = 'user.registered';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    // Trigger registrations
    new BalanceUpdatedEvent();
    new AccountClosedEvent();
    new UserRegisteredEvent();

    const registry = EventRegistry.getInstance();
    const accountEvents = registry.getByAggregate('Account');
    expect(accountEvents).toHaveLength(2);
  });

  it('should return all registered events', () => {
    @DomainEvent({ eventType: 'event.1' })
    class Event1 implements IDomainEvent {
      readonly eventType = 'event.1';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    @DomainEvent({ eventType: 'event.2' })
    class Event2 implements IDomainEvent {
      readonly eventType = 'event.2';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new Event1();
    new Event2();

    const registry = EventRegistry.getInstance();
    const allEvents = registry.getAllEvents();
    expect(allEvents).toHaveLength(2);
  });
});
