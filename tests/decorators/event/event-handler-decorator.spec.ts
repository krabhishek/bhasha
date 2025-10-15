/**
 * Behavioral tests for @EventHandler decorator
 * Tests only the public API and observable behavior (registry-based tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EventHandler,
  EventRegistry,
  DomainEvent,
} from '../../../src/index.js';
import { LogicRegistry } from '../../../src/decorators/logic/logic.registry.js';
import type { IDomainEvent } from '../../../src/interfaces/domain-event.interface.js';

describe('@EventHandler Decorator - Basic Registration', () => {
  beforeEach(() => {
    const eventRegistry = EventRegistry.getInstance();
    const logicRegistry = LogicRegistry.getInstance();
    eventRegistry.clear();
    logicRegistry.clear();
  });

  it('should register handler in EventRegistry', () => {
    @EventHandler({
      eventType: 'test.event',
    })
    class TestHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new TestHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('test.event');
    expect(handlers).toHaveLength(1);
    expect(handlers[0].metadata.eventType).toBe('test.event');
  });

  it('should register handler in LogicRegistry with type "event-handler"', () => {
    @EventHandler({
      eventType: 'test.event',
    })
    class TestHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new TestHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const eventHandlers = logicRegistry.getByType('event-handler');
    expect(eventHandlers).toHaveLength(1);
    expect(eventHandlers[0].metadata.type).toBe('event-handler');
  });

  it('should handle type-safe event class references', () => {
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

    @EventHandler({
      eventType: TransactionRecordedEvent, // Type-safe reference
    })
    class UpdateBalanceHandler {
      execute(event: TransactionRecordedEvent): void {
        // Handler logic
      }
    }

    new UpdateBalanceHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('transaction.recorded');
    expect(handlers).toHaveLength(1);
    expect(handlers[0].metadata.eventType).toBe('transaction.recorded');
  });

  it('should handle string event type references', () => {
    @EventHandler({
      eventType: 'transaction.recorded', // String reference
    })
    class NotificationHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new NotificationHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('transaction.recorded');
    expect(handlers).toHaveLength(1);
    expect(handlers[0].metadata.eventType).toBe('transaction.recorded');
  });

  it('should use custom handler name if provided', () => {
    @EventHandler({
      name: 'CustomHandlerName',
      eventType: 'test.event',
    })
    class TestHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new TestHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('CustomHandlerName');
    expect(handler).toBeDefined();
    expect(handler?.metadata.name).toBe('CustomHandlerName');
  });

  it('should throw error if eventType is not provided', () => {
    expect(() => {
      // @ts-expect-error - Testing missing required field
      @EventHandler({})
      class InvalidHandler {
        execute(event: unknown): void {
          // Handler logic
        }
      }

      new InvalidHandler();
    }).toThrow(/eventType is required/);
  });
});

describe('@EventHandler Decorator - Priority-Based Ordering', () => {
  beforeEach(() => {
    const eventRegistry = EventRegistry.getInstance();
    const logicRegistry = LogicRegistry.getInstance();
    eventRegistry.clear();
    logicRegistry.clear();
  });

  it('should order handlers by priority (higher first)', () => {
    @EventHandler({
      eventType: 'test.event',
      priority: 5,
    })
    class MediumPriorityHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    @EventHandler({
      eventType: 'test.event',
      priority: 10,
    })
    class HighPriorityHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    @EventHandler({
      eventType: 'test.event',
      priority: 1,
    })
    class LowPriorityHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new MediumPriorityHandler();
    new HighPriorityHandler();
    new LowPriorityHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('test.event');

    expect(handlers).toHaveLength(3);
    expect(handlers[0].metadata.priority).toBe(10);
    expect(handlers[1].metadata.priority).toBe(5);
    expect(handlers[2].metadata.priority).toBe(1);
  });

  it('should handle handlers with same priority', () => {
    @EventHandler({
      eventType: 'test.event',
      priority: 5,
    })
    class Handler1 {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    @EventHandler({
      eventType: 'test.event',
      priority: 5,
    })
    class Handler2 {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new Handler1();
    new Handler2();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('test.event');

    expect(handlers).toHaveLength(2);
    expect(handlers[0].metadata.priority).toBe(5);
    expect(handlers[1].metadata.priority).toBe(5);
  });

  it('should default priority to 0', () => {
    @EventHandler({
      eventType: 'test.event',
    })
    class DefaultPriorityHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new DefaultPriorityHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('test.event');

    expect(handlers).toHaveLength(1);
    expect(handlers[0].metadata.priority).toBe(0);
  });

  it('should support negative priorities', () => {
    @EventHandler({
      eventType: 'test.event',
      priority: -5,
    })
    class NegativePriorityHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    @EventHandler({
      eventType: 'test.event',
      priority: 0,
    })
    class ZeroPriorityHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new NegativePriorityHandler();
    new ZeroPriorityHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('test.event');

    expect(handlers).toHaveLength(2);
    expect(handlers[0].metadata.priority).toBe(0);
    expect(handlers[1].metadata.priority).toBe(-5);
  });
});

describe('@EventHandler Decorator - Handler Properties', () => {
  beforeEach(() => {
    const eventRegistry = EventRegistry.getInstance();
    const logicRegistry = LogicRegistry.getInstance();
    eventRegistry.clear();
    logicRegistry.clear();
  });

  it('should store async flag', () => {
    @EventHandler({
      eventType: 'test.event',
      async: true,
    })
    class AsyncHandler {
      async execute(event: unknown): Promise<void> {
        // Async handler logic
      }
    }

    new AsyncHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('test.event');
    expect(handlers[0].metadata.async).toBe(true);
  });

  it('should default async to false', () => {
    @EventHandler({
      eventType: 'test.event',
    })
    class SyncHandler {
      execute(event: unknown): void {
        // Sync handler logic
      }
    }

    new SyncHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('test.event');
    expect(handlers[0].metadata.async).toBe(false);
  });

  it('should store idempotent flag (default true)', () => {
    @EventHandler({
      eventType: 'test.event',
    })
    class DefaultIdempotentHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new DefaultIdempotentHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('DefaultIdempotentHandler');
    expect(handler?.metadata.idempotent).toBe(true);
  });

  it('should allow setting idempotent to false', () => {
    @EventHandler({
      eventType: 'test.event',
      idempotent: false,
    })
    class NonIdempotentHandler {
      execute(event: unknown): void {
        // Non-idempotent handler logic
      }
    }

    new NonIdempotentHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('NonIdempotentHandler');
    expect(handler?.metadata.idempotent).toBe(false);
  });

  it('should store retryable flag (default true)', () => {
    @EventHandler({
      eventType: 'test.event',
    })
    class DefaultRetryableHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new DefaultRetryableHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('DefaultRetryableHandler');
    expect(handler?.metadata.retryable).toBe(true);
  });

  it('should allow setting retryable to false', () => {
    @EventHandler({
      eventType: 'test.event',
      retryable: false,
    })
    class NonRetryableHandler {
      execute(event: unknown): void {
        // Non-retryable handler logic
      }
    }

    new NonRetryableHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('NonRetryableHandler');
    expect(handler?.metadata.retryable).toBe(false);
  });

  it('should store timeout', () => {
    @EventHandler({
      eventType: 'test.event',
      timeout: '5s',
    })
    class TimeoutHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new TimeoutHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('TimeoutHandler');
    expect(handler?.metadata.timeout).toBe('5s');
  });

  it('should store context', () => {
    @EventHandler({
      eventType: 'test.event',
      context: 'Piggy Bank Savings',
    })
    class ContextualHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new ContextualHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('ContextualHandler');
    expect(handler?.metadata.context).toBe('Piggy Bank Savings');
  });

  it('should store requires (dependencies)', () => {
    @EventHandler({
      eventType: 'test.event',
      requires: ['AccountRepository', 'NotificationService'],
    })
    class DependentHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new DependentHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('DependentHandler');
    expect(handler?.metadata.requires).toEqual([
      'AccountRepository',
      'NotificationService',
    ]);
  });

  it('should store description and tags', () => {
    @EventHandler({
      eventType: 'test.event',
      description: 'Updates account balance when transaction is recorded',
      tags: ['financial', 'critical'],
    })
    class DocumentedHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new DocumentedHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('test.event');
    expect(handlers[0].metadata.description).toBe(
      'Updates account balance when transaction is recorded'
    );
    expect(handlers[0].metadata.tags).toEqual(['financial', 'critical']);
  });

  it('should store all properties together', () => {
    @EventHandler({
      eventType: 'transaction.recorded',
      priority: 10,
      async: true,
      context: 'Piggy Bank Savings',
      requires: ['AccountRepository', 'Logger'],
      idempotent: true,
      retryable: true,
      timeout: '3s',
      description: 'Critical transaction handler',
      tags: ['financial', 'audit'],
    })
    class CompleteHandler {
      async execute(event: unknown): Promise<void> {
        // Handler logic
      }
    }

    new CompleteHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('transaction.recorded');
    const eventMetadata = handlers[0].metadata;

    expect(eventMetadata.eventType).toBe('transaction.recorded');
    expect(eventMetadata.priority).toBe(10);
    expect(eventMetadata.async).toBe(true);
    expect(eventMetadata.description).toBe('Critical transaction handler');
    expect(eventMetadata.tags).toEqual(['financial', 'audit']);

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('CompleteHandler');
    const logicMetadata = handler?.metadata;

    expect(logicMetadata?.context).toBe('Piggy Bank Savings');
    expect(logicMetadata?.requires).toEqual(['AccountRepository', 'Logger']);
    expect(logicMetadata?.idempotent).toBe(true);
    expect(logicMetadata?.retryable).toBe(true);
    expect(logicMetadata?.timeout).toBe('3s');
  });
});

describe('@EventHandler Decorator - Event Type Resolution', () => {
  beforeEach(() => {
    const eventRegistry = EventRegistry.getInstance();
    const logicRegistry = LogicRegistry.getInstance();
    eventRegistry.clear();
    logicRegistry.clear();
  });

  it('should resolve event type from registered event class', () => {
    @DomainEvent({
      eventType: 'payment.processed',
    })
    class PaymentProcessedEvent implements IDomainEvent {
      readonly eventType = 'payment.processed';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new PaymentProcessedEvent();

    @EventHandler({
      eventType: PaymentProcessedEvent,
    })
    class PaymentHandler {
      execute(event: PaymentProcessedEvent): void {
        // Handler logic
      }
    }

    new PaymentHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('payment.processed');
    expect(handlers).toHaveLength(1);
  });

  it('should use static eventType property if available', () => {
    class CustomEvent {
      static eventType = 'custom.static.event';
    }

    @EventHandler({
      eventType: CustomEvent,
    })
    class CustomHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new CustomHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('custom.static.event');
    expect(handlers).toHaveLength(1);
  });

  it('should use prototype.eventType if available', () => {
    class ProtoEvent {
      eventType = 'proto.event';
    }
    // Create prototype property
    ProtoEvent.prototype.eventType = 'proto.event';

    @EventHandler({
      eventType: ProtoEvent,
    })
    class ProtoHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new ProtoHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('proto.event');
    expect(handlers).toHaveLength(1);
  });

  it('should query EventRegistry as fallback', () => {
    @DomainEvent()
    class UserRegisteredEvent implements IDomainEvent {
      readonly eventType = 'user.registered';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new UserRegisteredEvent();

    @EventHandler({
      eventType: UserRegisteredEvent,
    })
    class UserHandler {
      execute(event: UserRegisteredEvent): void {
        // Handler logic
      }
    }

    new UserHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('user.registered');
    expect(handlers).toHaveLength(1);
  });

  it('should generate from class name as last resort', () => {
    class AccountActivatedEvent {
      // No eventType property
    }

    @EventHandler({
      eventType: AccountActivatedEvent,
    })
    class ActivationHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new ActivationHandler();

    // Generated: AccountActivatedEvent → account.activated
    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('account.activated');
    expect(handlers).toHaveLength(1);
  });

  it('should handle multiple handlers for the same event', () => {
    @DomainEvent({
      eventType: 'balance.updated',
    })
    class BalanceUpdatedEvent implements IDomainEvent {
      readonly eventType = 'balance.updated';
      readonly occurredAt = new Date();
      readonly aggregateId = 'test-id';
      readonly payload = {};
    }

    new BalanceUpdatedEvent();

    @EventHandler({
      eventType: BalanceUpdatedEvent,
      priority: 10,
    })
    class AuditLogHandler {
      execute(event: BalanceUpdatedEvent): void {
        // Log to audit
      }
    }

    @EventHandler({
      eventType: BalanceUpdatedEvent,
      priority: 5,
    })
    class NotificationHandler {
      execute(event: BalanceUpdatedEvent): void {
        // Send notification
      }
    }

    @EventHandler({
      eventType: BalanceUpdatedEvent,
      priority: 1,
    })
    class AnalyticsHandler {
      execute(event: BalanceUpdatedEvent): void {
        // Track analytics
      }
    }

    new AuditLogHandler();
    new NotificationHandler();
    new AnalyticsHandler();

    const eventRegistry = EventRegistry.getInstance();
    const handlers = eventRegistry.getHandlersFor('balance.updated');
    expect(handlers).toHaveLength(3);
    expect(handlers[0].metadata.priority).toBe(10);
    expect(handlers[1].metadata.priority).toBe(5);
    expect(handlers[2].metadata.priority).toBe(1);
  });
});

describe('@EventHandler Decorator - Dual Registration', () => {
  beforeEach(() => {
    const eventRegistry = EventRegistry.getInstance();
    const logicRegistry = LogicRegistry.getInstance();
    eventRegistry.clear();
    logicRegistry.clear();
  });

  it('should register handler in both EventRegistry and LogicRegistry', () => {
    @EventHandler({
      eventType: 'test.event',
    })
    class DualRegistryHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new DualRegistryHandler();

    const eventRegistry = EventRegistry.getInstance();
    const logicRegistry = LogicRegistry.getInstance();

    // Check EventRegistry
    const eventHandlers = eventRegistry.getHandlersFor('test.event');
    expect(eventHandlers).toHaveLength(1);

    // Check LogicRegistry
    const logicHandlers = logicRegistry.getByType('event-handler');
    expect(logicHandlers).toHaveLength(1);
  });

  it('should be queryable from LogicRegistry by name', () => {
    @EventHandler({
      eventType: 'test.event',
    })
    class NamedHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new NamedHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('NamedHandler');

    expect(handler).toBeDefined();
    expect(handler?.metadata.type).toBe('event-handler');
  });

  it('should store correct input/output contracts in LogicMetadata', () => {
    @EventHandler({
      eventType: 'transaction.recorded',
    })
    class ContractHandler {
      execute(event: unknown): void {
        // Handler logic
      }
    }

    new ContractHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('ContractHandler');

    expect(handler?.metadata.inputs).toEqual({
      event: 'transaction.recorded',
    });
    expect(handler?.metadata.outputs).toEqual({ result: 'void' });
  });

  it('should mark logic as not pure and not cacheable', () => {
    @EventHandler({
      eventType: 'test.event',
    })
    class ImpureHandler {
      execute(event: unknown): void {
        // Side effects
      }
    }

    new ImpureHandler();

    const logicRegistry = LogicRegistry.getInstance();
    const handler = logicRegistry.getByName('ImpureHandler');

    expect(handler?.metadata.pure).toBe(false);
    expect(handler?.metadata.cacheable).toBe(false);
  });
});
