/**
 * Behavioral tests for @BoundedContext decorator
 * Tests only the public API and observable behavior (registry-based tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoundedContext } from '../../../src/index.js';
import { BoundedContextRegistry } from '../../../src/decorators/domain/registries.js';
import { ContextRelationshipType } from '../../../src/enums/context-relationship.enum.js';

describe('@BoundedContext Decorator - Basic Registration', () => {
  beforeEach(() => {
    BoundedContextRegistry.clear();
  });

  it('should register bounded context', () => {
    @BoundedContext({
      name: 'Order Management',
    })
    class OrderManagementContext {}

    new OrderManagementContext();

    expect(BoundedContextRegistry.has('Order Management')).toBe(true);
  });

  it('should require name field', () => {
    expect(() => {
      @BoundedContext({
        // @ts-expect-error - Testing missing required field
        description: 'Test context',
      })
      class InvalidContext {}

      new InvalidContext();
    }).toThrow();
  });

  it('should auto-generate ID from name', () => {
    @BoundedContext({
      name: 'Order Management',
    })
    class OrderContext {}

    new OrderContext();

    const context = BoundedContextRegistry.get('Order Management');
    expect(context?.metadata.id).toBe('order-management');
  });

  it('should use provided ID', () => {
    @BoundedContext({
      name: 'User Auth',
      id: 'custom-id',
    })
    class UserAuthContext {}

    new UserAuthContext();

    const context = BoundedContextRegistry.get('User Auth');
    expect(context?.metadata.id).toBe('custom-id');
  });
});

describe('@BoundedContext Decorator - Relationships', () => {
  beforeEach(() => {
    BoundedContextRegistry.clear();
  });

  it('should store context relationships', () => {
    @BoundedContext({
      name: 'Order Management',
      relationships: {
        'Inventory': ContextRelationshipType.Upstream,
        'Shipping': ContextRelationshipType.Downstream,
      },
    })
    class OrderContext {}

    new OrderContext();

    const context = BoundedContextRegistry.get('Order Management');
    expect(context?.metadata.relationships?.['Inventory']).toBe(ContextRelationshipType.Upstream);
    expect(context?.metadata.relationships?.['Shipping']).toBe(ContextRelationshipType.Downstream);
  });

  it('should validate relationship types', () => {
    expect(() => {
      @BoundedContext({
        name: 'Test Context',
        relationships: {
          // @ts-expect-error - Testing invalid type
          'Other': 'invalid-type',
        },
      })
      class InvalidRelationshipContext {}

      new InvalidRelationshipContext();
    }).toThrow(/invalid relationship types/);
  });

  it('should allow all valid relationship types', () => {
    @BoundedContext({
      name: 'Core Context',
      relationships: {
        'Context1': ContextRelationshipType.Upstream,
        'Context2': ContextRelationshipType.Downstream,
        'Context3': ContextRelationshipType.Partnership,
        'Context4': ContextRelationshipType.CustomerSupplier,
      },
    })
    class AllRelationshipsContext {}

    new AllRelationshipsContext();

    expect(BoundedContextRegistry.has('Core Context')).toBe(true);
  });
});

describe('@BoundedContext Decorator - Vocabulary', () => {
  beforeEach(() => {
    BoundedContextRegistry.clear();
  });

  it('should store ubiquitous language vocabulary', () => {
    @BoundedContext({
      name: 'Order Management',
      vocabulary: {
        'Order': 'A customer purchase request',
        'OrderLine': 'Individual item in an order',
      },
    })
    class OrderContext {}

    new OrderContext();

    const context = BoundedContextRegistry.get('Order Management');
    expect(context?.metadata.vocabulary?.['Order']).toBe('A customer purchase request');
    expect(context?.metadata.vocabulary?.['OrderLine']).toBe('Individual item in an order');
  });
});

describe('@BoundedContext Decorator - Metadata Storage', () => {
  beforeEach(() => {
    BoundedContextRegistry.clear();
  });

  it('should store owner', () => {
    @BoundedContext({
      name: 'Sales',
      owner: 'Sales Team',
    })
    class SalesContext {}

    new SalesContext();

    const context = BoundedContextRegistry.get('Sales');
    expect(context?.metadata.owner).toBe('Sales Team');
  });

  it('should store description and tags', () => {
    @BoundedContext({
      name: 'Billing',
      description: 'Handles all billing operations',
      tags: ['core-domain', 'financial'],
    })
    class BillingContext {}

    new BillingContext();

    const context = BoundedContextRegistry.get('Billing');
    expect(context?.metadata.description).toBe('Handles all billing operations');
    expect(context?.metadata.tags).toEqual(['core-domain', 'financial']);
  });

  it('should store all metadata together', () => {
    @BoundedContext({
      name: 'Complete Context',
      id: 'complete-ctx',
      owner: 'Team A',
      description: 'A fully configured context',
      relationships: {
        'Other': ContextRelationshipType.Partnership,
      },
      vocabulary: {
        'Term': 'Definition',
      },
      tags: ['test', 'complete'],
    })
    class CompleteContext {}

    new CompleteContext();

    const context = BoundedContextRegistry.get('Complete Context');
    expect(context?.metadata.id).toBe('complete-ctx');
    expect(context?.metadata.owner).toBe('Team A');
    expect(context?.metadata.description).toBe('A fully configured context');
    expect(context?.metadata.relationships?.['Other']).toBe(ContextRelationshipType.Partnership);
    expect(context?.metadata.vocabulary?.['Term']).toBe('Definition');
    expect(context?.metadata.tags).toEqual(['test', 'complete']);
  });
});

describe('@BoundedContext Decorator - Registry Queries', () => {
  beforeEach(() => {
    BoundedContextRegistry.clear();
  });

  it('should query by name', () => {
    @BoundedContext({
      name: 'Payment',
    })
    class PaymentContext {}

    new PaymentContext();

    expect(BoundedContextRegistry.has('Payment')).toBe(true);
    expect(BoundedContextRegistry.get('Payment')).toBeDefined();
  });

  it('should return all contexts', () => {
    @BoundedContext({ name: 'Context A' })
    class ContextA {}

    @BoundedContext({ name: 'Context B' })
    class ContextB {}

    new ContextA();
    new ContextB();

    const all = BoundedContextRegistry.getAll();
    expect(all.size).toBe(2);
  });

  it('should get related contexts', () => {
    @BoundedContext({
      name: 'Central',
      relationships: {
        'Related1': ContextRelationshipType.Upstream,
        'Related2': ContextRelationshipType.Downstream,
      },
    })
    class CentralContext {}

    new CentralContext();

    const related = BoundedContextRegistry.getRelatedContexts('Central');
    expect(related).toHaveLength(2);
    expect(related[0].contextName).toBeDefined();
    expect(related[0].relationshipType).toBeDefined();
    const contextNames = related.map(r => r.contextName);
    expect(contextNames).toContain('Related1');
    expect(contextNames).toContain('Related2');
  });
});
