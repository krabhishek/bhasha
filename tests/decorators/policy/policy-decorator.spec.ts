/**
 * Behavioral tests for @Policy decorator
 * Tests only the public API and observable behavior through the registry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Policy, LogicRegistry } from '../../../src/index.js';

describe('@Policy Decorator - Basic Registration', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should register policy with class decorator', () => {
    @Policy()
    class PurchaseApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('PurchaseApprovalPolicy');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('PurchaseApprovalPolicy');
    expect(registered?.metadata.type).toBe('policy');
  });

  it('should use provided name over class name', () => {
    @Policy({
      name: 'Purchase Approval',
    })
    class PurchaseApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('Purchase Approval');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('Purchase Approval');
  });

  it('should auto-register in LogicRegistry', () => {
    @Policy({
      name: 'Dynamic Pricing',
    })
    class DynamicPricingPolicy {}

    const registry = LogicRegistry.getInstance();
    const policies = registry.getByType('policy');

    expect(policies).toHaveLength(1);
    expect(policies[0].metadata.name).toBe('Dynamic Pricing');
  });

  it('should prevent duplicate policy names', () => {
    @Policy({
      name: 'Approval Policy',
    })
    class Policy1 {}

    expect(() => {
      @Policy({
        name: 'Approval Policy',
      })
      class Policy2 {}
    }).toThrow(/Logic with this name already exists/);
  });
});

describe('@Policy Decorator - Logic Integration', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should always set type as policy', () => {
    @Policy()
    class MyPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyPolicy');

    expect(registered?.metadata.type).toBe('policy');
  });

  it('should default idempotent to true', () => {
    @Policy()
    class MyPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyPolicy');

    expect(registered?.metadata.idempotent).toBe(true);
  });

  it('should allow setting idempotent to false', () => {
    @Policy({
      idempotent: false,
    })
    class MyPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyPolicy');

    expect(registered?.metadata.idempotent).toBe(false);
  });

  it('should default cacheable to false', () => {
    @Policy()
    class MyPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyPolicy');

    expect(registered?.metadata.cacheable).toBe(false);
  });

  it('should allow enabling caching', () => {
    @Policy({
      cacheable: true,
    })
    class MyPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyPolicy');

    expect(registered?.metadata.cacheable).toBe(true);
  });
});

describe('@Policy Decorator - Policy Type', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store policyType', () => {
    @Policy({
      policyType: 'approval',
    })
    class ApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ApprovalPolicy');

    expect(registered?.metadata.policyType).toBe('approval');
  });

  it('should support pricing policy type', () => {
    @Policy({
      policyType: 'pricing',
    })
    class PricingPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('PricingPolicy');

    expect(registered?.metadata.policyType).toBe('pricing');
  });

  it('should support routing policy type', () => {
    @Policy({
      policyType: 'routing',
    })
    class RoutingPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('RoutingPolicy');

    expect(registered?.metadata.policyType).toBe('routing');
  });

  it('should work without policyType', () => {
    @Policy()
    class GenericPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('GenericPolicy');

    expect(registered?.metadata.policyType).toBeUndefined();
  });
});

describe('@Policy Decorator - Input/Output Contracts', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store input contract', () => {
    @Policy({
      inputs: { amount: 'number', customer: 'Customer' },
    })
    class ApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ApprovalPolicy');

    expect(registered?.metadata.inputs).toEqual({ amount: 'number', customer: 'Customer' });
  });

  it('should store output contract', () => {
    @Policy({
      outputs: { approved: 'boolean', reason: 'string' },
    })
    class ApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ApprovalPolicy');

    expect(registered?.metadata.outputs).toEqual({ approved: 'boolean', reason: 'string' });
  });

  it('should store both input and output contracts', () => {
    @Policy({
      inputs: { product: 'Product', customer: 'Customer' },
      outputs: { price: 'number', discount: 'number' },
    })
    class PricingPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('PricingPolicy');

    expect(registered?.metadata.inputs).toEqual({ product: 'Product', customer: 'Customer' });
    expect(registered?.metadata.outputs).toEqual({ price: 'number', discount: 'number' });
  });

  it('should find compatible policies by input contract', () => {
    @Policy({
      inputs: { order: 'Order' },
      outputs: { approved: 'boolean' },
    })
    class Policy1 {}

    @Policy({
      inputs: { order: 'Order' },
      outputs: { decision: 'string' },
    })
    class Policy2 {}

    const registry = LogicRegistry.getInstance();
    const compatible = registry.findCompatible({ order: 'Order' });

    expect(compatible).toHaveLength(2);
  });
});

describe('@Policy Decorator - Dependencies', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store invokes property', () => {
    @Policy({
      invokes: ['CalculateBasePrice', 'CalculateDiscount'],
    })
    class PricingPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('PricingPolicy');

    expect(registered?.metadata.invokes).toEqual(['CalculateBasePrice', 'CalculateDiscount']);
  });

  it('should store requires property', () => {
    @Policy({
      requires: ['PricingService', 'CustomerRepository'],
    })
    class PricingPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('PricingPolicy');

    expect(registered?.metadata.requires).toEqual(['PricingService', 'CustomerRepository']);
  });

  it('should track dependencies from invokes', () => {
    @Policy({
      name: 'Main Policy',
      invokes: ['SubPolicy1', 'SubPolicy2'],
    })
    class MainPolicy {}

    const registry = LogicRegistry.getInstance();
    const dependencies = registry.getDependencies('Main Policy');

    expect(dependencies).toContain('SubPolicy1');
    expect(dependencies).toContain('SubPolicy2');
  });
});

describe('@Policy Decorator - Domain Context', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store context', () => {
    @Policy({
      context: 'Finance',
    })
    class ApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ApprovalPolicy');

    expect(registered?.metadata.context).toBe('Finance');
  });

  it('should query policies by context', () => {
    @Policy({
      context: 'E-commerce',
      policyType: 'pricing',
    })
    class PricingPolicy {}

    @Policy({
      context: 'E-commerce',
      policyType: 'discount',
    })
    class DiscountPolicy {}

    @Policy({
      context: 'Finance',
      policyType: 'approval',
    })
    class ApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const ecommercePolicies = registry.getByContext('E-commerce');

    expect(ecommercePolicies).toHaveLength(2);
    expect(ecommercePolicies.map(p => p.metadata.name)).toContain('PricingPolicy');
    expect(ecommercePolicies.map(p => p.metadata.name)).toContain('DiscountPolicy');
  });
});

describe('@Policy Decorator - Metadata', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store description', () => {
    @Policy({
      description: 'Determines if a purchase requires manager approval',
    })
    class ApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ApprovalPolicy');

    expect(registered?.metadata.description).toBe('Determines if a purchase requires manager approval');
  });

  it('should store tags', () => {
    @Policy({
      tags: ['approval', 'finance', 'critical'],
    })
    class ApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ApprovalPolicy');

    expect(registered?.metadata.tags).toEqual(['approval', 'finance', 'critical']);
  });

  it('should store examples', () => {
    @Policy({
      examples: [
        {
          input: { amount: 5000, customer: { tier: 'gold' } },
          output: { approved: true, reason: 'Within limit for gold customer' },
          description: 'Gold customer approval',
        },
        {
          input: { amount: 15000, customer: { tier: 'silver' } },
          output: { approved: false, reason: 'Exceeds limit for silver customer' },
          description: 'Silver customer rejection',
        },
      ],
    })
    class ApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ApprovalPolicy');

    expect(registered?.metadata.examples).toHaveLength(2);
    expect(registered?.metadata.examples?.[0].description).toBe('Gold customer approval');
  });
});

describe('@Policy Decorator - Registry Queries', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should get policy by name', () => {
    @Policy({
      name: 'Dynamic Pricing',
    })
    class PricingPolicy {}

    const registry = LogicRegistry.getInstance();
    const policy = registry.getByName('Dynamic Pricing');

    expect(policy).toBeDefined();
    expect(policy?.metadata.type).toBe('policy');
  });

  it('should get all policies by type', () => {
    @Policy()
    class Policy1 {}

    @Policy()
    class Policy2 {}

    @Policy()
    class Policy3 {}

    const registry = LogicRegistry.getInstance();
    const policies = registry.getByType('policy');

    expect(policies).toHaveLength(3);
    expect(policies.every(p => p.metadata.type === 'policy')).toBe(true);
  });

  it('should find compatible policies', () => {
    @Policy({
      inputs: { order: 'Order' },
      outputs: { approved: 'boolean' },
    })
    class OrderApprovalPolicy {}

    @Policy({
      inputs: { order: 'Order' },
      outputs: { priority: 'number' },
    })
    class OrderPriorityPolicy {}

    @Policy({
      inputs: { customer: 'Customer' },
      outputs: { discount: 'number' },
    })
    class CustomerDiscountPolicy {}

    const registry = LogicRegistry.getInstance();
    const orderPolicies = registry.findCompatible({ order: 'Order' });

    expect(orderPolicies).toHaveLength(2);
    expect(orderPolicies.map(p => p.metadata.name)).toContain('OrderApprovalPolicy');
    expect(orderPolicies.map(p => p.metadata.name)).toContain('OrderPriorityPolicy');
  });
});

describe('@Policy Decorator - Complete Examples', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should register policy with all options', () => {
    @Policy({
      name: 'Purchase Approval Policy',
      context: 'Finance',
      policyType: 'approval',
      inputs: { amount: 'number', customer: 'Customer', department: 'string' },
      outputs: { approved: 'boolean', reason: 'string', approver: 'string' },
      idempotent: true,
      cacheable: false,
      invokes: ['ValidateCustomer', 'CheckBudget'],
      requires: ['ApprovalService', 'CustomerRepository'],
      description: 'Determines if a purchase requires approval and who should approve',
      tags: ['approval', 'finance', 'purchase'],
      examples: [
        {
          input: { amount: 5000, customer: { id: '123' }, department: 'IT' },
          output: { approved: true, reason: 'Within budget', approver: 'manager' },
          description: 'Standard approval',
        },
      ],
    })
    class PurchaseApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('Purchase Approval Policy');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('Purchase Approval Policy');
    expect(registered?.metadata.type).toBe('policy');
    expect(registered?.metadata.context).toBe('Finance');
    expect(registered?.metadata.policyType).toBe('approval');
    expect(registered?.metadata.inputs).toEqual({ amount: 'number', customer: 'Customer', department: 'string' });
    expect(registered?.metadata.outputs).toEqual({ approved: 'boolean', reason: 'string', approver: 'string' });
    expect(registered?.metadata.idempotent).toBe(true);
    expect(registered?.metadata.cacheable).toBe(false);
    expect(registered?.metadata.invokes).toEqual(['ValidateCustomer', 'CheckBudget']);
    expect(registered?.metadata.requires).toEqual(['ApprovalService', 'CustomerRepository']);
    expect(registered?.metadata.description).toBe('Determines if a purchase requires approval and who should approve');
    expect(registered?.metadata.tags).toEqual(['approval', 'finance', 'purchase']);
    expect(registered?.metadata.examples).toHaveLength(1);
  });

  it('should register minimal policy', () => {
    @Policy()
    class SimplePolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('SimplePolicy');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('SimplePolicy');
    expect(registered?.metadata.type).toBe('policy');
    expect(registered?.metadata.idempotent).toBe(true);
    expect(registered?.metadata.cacheable).toBe(false);
  });
});

describe('@Policy Decorator - Real-World Use Cases', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should support approval policies', () => {
    @Policy({
      policyType: 'approval',
      inputs: { request: 'ApprovalRequest' },
      outputs: { approved: 'boolean', reason: 'string' },
    })
    class LeaveApprovalPolicy {}

    @Policy({
      policyType: 'approval',
      inputs: { request: 'ApprovalRequest' },
      outputs: { approved: 'boolean', reason: 'string' },
    })
    class ExpenseApprovalPolicy {}

    const registry = LogicRegistry.getInstance();
    const policies = registry.getByType('policy');

    expect(policies).toHaveLength(2);
    expect(policies.every(p => p.metadata.policyType === 'approval')).toBe(true);
  });

  it('should support pricing policies', () => {
    @Policy({
      context: 'E-commerce',
      policyType: 'pricing',
      inputs: { product: 'Product', customer: 'Customer' },
      outputs: { price: 'number', discount: 'number' },
      invokes: ['CalculateBasePrice', 'ApplySeasonalDiscount', 'ApplyLoyaltyDiscount'],
    })
    class DynamicPricingPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('DynamicPricingPolicy');

    expect(registered?.metadata.policyType).toBe('pricing');
    expect(registered?.metadata.invokes).toHaveLength(3);
  });

  it('should support routing policies', () => {
    @Policy({
      policyType: 'routing',
      inputs: { order: 'Order', warehouses: 'Warehouse[]' },
      outputs: { warehouse: 'Warehouse', priority: 'number' },
    })
    class OrderRoutingPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('OrderRoutingPolicy');

    expect(registered?.metadata.policyType).toBe('routing');
  });
});
