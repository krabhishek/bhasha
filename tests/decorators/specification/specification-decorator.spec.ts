/**
 * Behavioral tests for @Specification decorator
 * Tests only the public API and observable behavior through the registry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Specification, LogicRegistry } from '../../../src/index.js';

describe('@Specification Decorator - Basic Registration', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should register specification with class decorator', () => {
    @Specification()
    class IsEligibleForDiscountSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('IsEligibleForDiscountSpec');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('IsEligibleForDiscountSpec');
    expect(registered?.metadata.type).toBe('specification');
  });

  it('should use provided name over class name', () => {
    @Specification({
      name: 'Eligible For Discount',
    })
    class IsEligibleForDiscountSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('Eligible For Discount');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('Eligible For Discount');
  });

  it('should auto-register in LogicRegistry', () => {
    @Specification({
      name: 'Is Valid Order',
    })
    class IsValidOrderSpec {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('specification');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.name).toBe('Is Valid Order');
  });

  it('should prevent duplicate specification names', () => {
    @Specification({
      name: 'Is Valid',
    })
    class Spec1 {}

    expect(() => {
      @Specification({
        name: 'Is Valid',
      })
      class Spec2 {}
    }).toThrow(/Logic with this name already exists/);
  });
});

describe('@Specification Decorator - Logic Integration', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should always set type as specification', () => {
    @Specification()
    class MySpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MySpec');

    expect(registered?.metadata.type).toBe('specification');
  });

  it('should always be pure', () => {
    @Specification()
    class MySpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MySpec');

    expect(registered?.metadata.pure).toBe(true);
  });

  it('should default cacheable to true', () => {
    @Specification()
    class MySpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MySpec');

    expect(registered?.metadata.cacheable).toBe(true);
  });

  it('should allow disabling caching', () => {
    @Specification({
      cacheable: false,
    })
    class MySpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MySpec');

    expect(registered?.metadata.cacheable).toBe(false);
  });

  it('should always have boolean output', () => {
    @Specification()
    class MySpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MySpec');

    expect(registered?.metadata.outputs).toEqual({ result: 'boolean' });
  });
});

describe('@Specification Decorator - Input Contract', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store input contract', () => {
    @Specification({
      inputs: { customer: 'Customer' },
    })
    class IsEligibleForDiscountSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('IsEligibleForDiscountSpec');

    expect(registered?.metadata.inputs).toEqual({ customer: 'Customer' });
  });

  it('should support multiple inputs', () => {
    @Specification({
      inputs: { customer: 'Customer', order: 'Order' },
    })
    class IsValidPurchaseSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('IsValidPurchaseSpec');

    expect(registered?.metadata.inputs).toEqual({ customer: 'Customer', order: 'Order' });
  });

  it('should work without input contract', () => {
    @Specification()
    class AlwaysTrueSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('AlwaysTrueSpec');

    expect(registered?.metadata.inputs).toBeUndefined();
  });
});

describe('@Specification Decorator - Domain Context', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store context', () => {
    @Specification({
      context: 'E-commerce',
    })
    class IsEligibleForDiscountSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('IsEligibleForDiscountSpec');

    expect(registered?.metadata.context).toBe('E-commerce');
  });

  it('should query specifications by context', () => {
    @Specification({
      context: 'Payment',
    })
    class IsValidPaymentMethodSpec {}

    @Specification({
      context: 'Payment',
    })
    class IsPaymentAuthorizedSpec {}

    @Specification({
      context: 'Shipping',
    })
    class IsShippableSpec {}

    const registry = LogicRegistry.getInstance();
    const paymentSpecs = registry.getByContext('Payment');

    expect(paymentSpecs).toHaveLength(2);
    expect(paymentSpecs.map(s => s.metadata.name)).toContain('IsValidPaymentMethodSpec');
    expect(paymentSpecs.map(s => s.metadata.name)).toContain('IsPaymentAuthorizedSpec');
  });

  it('should store appliesTo', () => {
    @Specification({
      appliesTo: ['Customer', 'PremiumCustomer'],
    })
    class IsEligibleForDiscountSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('IsEligibleForDiscountSpec');

    expect(registered?.metadata.appliesTo).toEqual(['Customer', 'PremiumCustomer']);
  });

  it('should work with both context and appliesTo', () => {
    @Specification({
      context: 'E-commerce',
      appliesTo: ['Order'],
    })
    class IsValidOrderSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('IsValidOrderSpec');

    expect(registered?.metadata.context).toBe('E-commerce');
    expect(registered?.metadata.appliesTo).toEqual(['Order']);
  });
});

describe('@Specification Decorator - Metadata', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store description', () => {
    @Specification({
      description: 'Checks if customer is eligible for discount based on purchase history',
    })
    class IsEligibleForDiscountSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('IsEligibleForDiscountSpec');

    expect(registered?.metadata.description).toBe('Checks if customer is eligible for discount based on purchase history');
  });

  it('should store tags', () => {
    @Specification({
      tags: ['discount', 'customer', 'eligibility'],
    })
    class IsEligibleForDiscountSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('IsEligibleForDiscountSpec');

    expect(registered?.metadata.tags).toEqual(['discount', 'customer', 'eligibility']);
  });

  it('should store examples', () => {
    @Specification({
      examples: [
        {
          input: { customer: { totalPurchases: 1500 } },
          output: true,
          description: 'Customer with purchases > 1000 is eligible',
        },
        {
          input: { customer: { totalPurchases: 500 } },
          output: false,
          description: 'Customer with purchases < 1000 is not eligible',
        },
      ],
    })
    class IsEligibleForDiscountSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('IsEligibleForDiscountSpec');

    expect(registered?.metadata.examples).toHaveLength(2);
    expect(registered?.metadata.examples?.[0].output).toBe(true);
    expect(registered?.metadata.examples?.[1].output).toBe(false);
  });
});

describe('@Specification Decorator - Registry Queries', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should get specification by name', () => {
    @Specification({
      name: 'Is Valid Order',
    })
    class IsValidOrderSpec {}

    const registry = LogicRegistry.getInstance();
    const spec = registry.getByName('Is Valid Order');

    expect(spec).toBeDefined();
    expect(spec?.metadata.type).toBe('specification');
  });

  it('should get all specifications by type', () => {
    @Specification()
    class Spec1 {}

    @Specification()
    class Spec2 {}

    @Specification()
    class Spec3 {}

    const registry = LogicRegistry.getInstance();
    const specs = registry.getByType('specification');

    expect(specs).toHaveLength(3);
    expect(specs.every(s => s.metadata.type === 'specification')).toBe(true);
  });

  it('should find compatible specifications by input', () => {
    @Specification({
      inputs: { customer: 'Customer' },
    })
    class Spec1 {}

    @Specification({
      inputs: { customer: 'Customer' },
    })
    class Spec2 {}

    @Specification({
      inputs: { order: 'Order' },
    })
    class Spec3 {}

    const registry = LogicRegistry.getInstance();
    const compatible = registry.findCompatible({ customer: 'Customer' });

    expect(compatible).toHaveLength(2);
    expect(compatible.map(s => s.metadata.name)).toContain('Spec1');
    expect(compatible.map(s => s.metadata.name)).toContain('Spec2');
  });

  it('should find all specifications by boolean output', () => {
    @Specification()
    class Spec1 {}

    @Specification()
    class Spec2 {}

    const registry = LogicRegistry.getInstance();
    const compatible = registry.findCompatible(undefined, { result: 'boolean' });

    expect(compatible).toHaveLength(2);
  });
});

describe('@Specification Decorator - Complete Examples', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should register specification with all options', () => {
    @Specification({
      name: 'Is Eligible For Premium Discount',
      context: 'E-commerce',
      appliesTo: ['PremiumCustomer'],
      inputs: { customer: 'Customer' },
      cacheable: true,
      description: 'Determines if a premium customer qualifies for additional discounts',
      tags: ['discount', 'premium', 'customer'],
      examples: [
        {
          input: { customer: { isPremium: true, totalPurchases: 2000 } },
          output: true,
          description: 'Premium customer with high purchases',
        },
      ],
    })
    class IsEligibleForPremiumDiscountSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('Is Eligible For Premium Discount');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('Is Eligible For Premium Discount');
    expect(registered?.metadata.type).toBe('specification');
    expect(registered?.metadata.context).toBe('E-commerce');
    expect(registered?.metadata.appliesTo).toEqual(['PremiumCustomer']);
    expect(registered?.metadata.inputs).toEqual({ customer: 'Customer' });
    expect(registered?.metadata.outputs).toEqual({ result: 'boolean' });
    expect(registered?.metadata.pure).toBe(true);
    expect(registered?.metadata.cacheable).toBe(true);
    expect(registered?.metadata.description).toBe('Determines if a premium customer qualifies for additional discounts');
    expect(registered?.metadata.tags).toEqual(['discount', 'premium', 'customer']);
    expect(registered?.metadata.examples).toHaveLength(1);
  });

  it('should register minimal specification', () => {
    @Specification()
    class SimpleSpec {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('SimpleSpec');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('SimpleSpec');
    expect(registered?.metadata.type).toBe('specification');
    expect(registered?.metadata.pure).toBe(true);
    expect(registered?.metadata.cacheable).toBe(true);
    expect(registered?.metadata.outputs).toEqual({ result: 'boolean' });
  });
});

describe('@Specification Decorator - Composite Specifications', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should support multiple specifications for same entity', () => {
    @Specification({
      context: 'Order Management',
      appliesTo: ['Order'],
      inputs: { order: 'Order' },
    })
    class HasItemsSpec {}

    @Specification({
      context: 'Order Management',
      appliesTo: ['Order'],
      inputs: { order: 'Order' },
    })
    class HasPositiveTotalSpec {}

    @Specification({
      context: 'Order Management',
      appliesTo: ['Order'],
      inputs: { order: 'Order' },
    })
    class HasValidShippingAddressSpec {}

    const registry = LogicRegistry.getInstance();
    const orderSpecs = registry.getByContext('Order Management');

    expect(orderSpecs).toHaveLength(3);
    expect(orderSpecs.every(s => s.metadata.appliesTo?.includes('Order'))).toBe(true);
  });

  it('should be discoverable for composition', () => {
    @Specification({
      name: 'Is Adult',
      inputs: { person: 'Person' },
    })
    class IsAdultSpec {}

    @Specification({
      name: 'Has Valid ID',
      inputs: { person: 'Person' },
    })
    class HasValidIDSpec {}

    const registry = LogicRegistry.getInstance();
    const personSpecs = registry.findCompatible({ person: 'Person' });

    expect(personSpecs).toHaveLength(2);
    expect(personSpecs.map(s => s.metadata.name)).toContain('Is Adult');
    expect(personSpecs.map(s => s.metadata.name)).toContain('Has Valid ID');
  });
});
