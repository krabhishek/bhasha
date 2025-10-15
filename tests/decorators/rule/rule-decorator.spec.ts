/**
 * Behavioral tests for @Rule decorator
 * Tests only the public API and observable behavior through the registry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Rule, LogicRegistry } from '../../../src/index.js';

describe('@Rule Decorator - Basic Registration', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should register rule with class decorator', () => {
    @Rule()
    class ValidateAmountRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateAmountRule');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('ValidateAmountRule');
    expect(registered?.metadata.type).toBe('rule');
  });

  it('should use provided name over class name', () => {
    @Rule({
      name: 'Amount Validation',
    })
    class ValidateAmountRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('Amount Validation');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('Amount Validation');
  });

  it('should auto-register in LogicRegistry', () => {
    @Rule({
      name: 'Email Validation',
    })
    class ValidateEmailRule {}

    const registry = LogicRegistry.getInstance();
    const rules = registry.getByType('rule');

    expect(rules).toHaveLength(1);
    expect(rules[0].metadata.name).toBe('Email Validation');
  });

  it('should prevent duplicate rule names', () => {
    @Rule({
      name: 'Validation Rule',
    })
    class Rule1 {}

    expect(() => {
      @Rule({
        name: 'Validation Rule',
      })
      class Rule2 {}
    }).toThrow(/Logic with this name already exists/);
  });
});

describe('@Rule Decorator - Logic Integration', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should always set type as rule', () => {
    @Rule()
    class MyRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyRule');

    expect(registered?.metadata.type).toBe('rule');
  });

  it('should default pure to true', () => {
    @Rule()
    class MyRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyRule');

    expect(registered?.metadata.pure).toBe(true);
  });

  it('should allow setting pure to false', () => {
    @Rule({
      pure: false,
    })
    class MyRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyRule');

    expect(registered?.metadata.pure).toBe(false);
  });

  it('should default cacheable to true', () => {
    @Rule()
    class MyRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyRule');

    expect(registered?.metadata.cacheable).toBe(true);
  });

  it('should allow disabling caching', () => {
    @Rule({
      cacheable: false,
    })
    class MyRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyRule');

    expect(registered?.metadata.cacheable).toBe(false);
  });

  it('should always have standard validation output', () => {
    @Rule()
    class MyRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyRule');

    expect(registered?.metadata.outputs).toEqual({
      isValid: 'boolean',
      errors: 'string[]',
    });
  });
});

describe('@Rule Decorator - Rule Types', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should default ruleType to business', () => {
    @Rule()
    class MyRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MyRule');

    expect(registered?.metadata.ruleType).toBe('business');
  });

  it('should support validation rule type', () => {
    @Rule({
      ruleType: 'validation',
    })
    class ValidationRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidationRule');

    expect(registered?.metadata.ruleType).toBe('validation');
  });

  it('should support business rule type', () => {
    @Rule({
      ruleType: 'business',
    })
    class BusinessRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('BusinessRule');

    expect(registered?.metadata.ruleType).toBe('business');
  });

  it('should support constraint rule type', () => {
    @Rule({
      ruleType: 'constraint',
    })
    class ConstraintRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ConstraintRule');

    expect(registered?.metadata.ruleType).toBe('constraint');
  });
});

describe('@Rule Decorator - Input Contract', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store input contract', () => {
    @Rule({
      inputs: { amount: 'number' },
    })
    class ValidateAmountRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateAmountRule');

    expect(registered?.metadata.inputs).toEqual({ amount: 'number' });
  });

  it('should support multiple inputs', () => {
    @Rule({
      inputs: { email: 'string', domain: 'string' },
    })
    class ValidateEmailRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateEmailRule');

    expect(registered?.metadata.inputs).toEqual({ email: 'string', domain: 'string' });
  });

  it('should work without input contract', () => {
    @Rule()
    class SimpleRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('SimpleRule');

    expect(registered?.metadata.inputs).toBeUndefined();
  });

  it('should find compatible rules by input', () => {
    @Rule({
      inputs: { amount: 'number' },
    })
    class Rule1 {}

    @Rule({
      inputs: { amount: 'number' },
    })
    class Rule2 {}

    @Rule({
      inputs: { email: 'string' },
    })
    class Rule3 {}

    const registry = LogicRegistry.getInstance();
    const compatible = registry.findCompatible({ amount: 'number' });

    expect(compatible).toHaveLength(2);
    expect(compatible.map(r => r.metadata.name)).toContain('Rule1');
    expect(compatible.map(r => r.metadata.name)).toContain('Rule2');
  });
});

describe('@Rule Decorator - Domain Context', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store context', () => {
    @Rule({
      context: 'Piggy Bank',
    })
    class ValidateDepositRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateDepositRule');

    expect(registered?.metadata.context).toBe('Piggy Bank');
  });

  it('should query rules by context', () => {
    @Rule({
      context: 'Payment',
      ruleType: 'validation',
    })
    class Rule1 {}

    @Rule({
      context: 'Payment',
      ruleType: 'business',
    })
    class Rule2 {}

    @Rule({
      context: 'Order',
      ruleType: 'validation',
    })
    class Rule3 {}

    const registry = LogicRegistry.getInstance();
    const paymentRules = registry.getByContext('Payment');

    expect(paymentRules).toHaveLength(2);
    expect(paymentRules.map(r => r.metadata.name)).toContain('Rule1');
    expect(paymentRules.map(r => r.metadata.name)).toContain('Rule2');
  });

  it('should store appliesTo', () => {
    @Rule({
      appliesTo: ['Deposit', 'Withdrawal'],
    })
    class ValidateAmountRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateAmountRule');

    expect(registered?.metadata.appliesTo).toEqual(['Deposit', 'Withdrawal']);
  });

  it('should work with both context and appliesTo', () => {
    @Rule({
      context: 'Banking',
      appliesTo: ['Transaction'],
    })
    class ValidateTransactionRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateTransactionRule');

    expect(registered?.metadata.context).toBe('Banking');
    expect(registered?.metadata.appliesTo).toEqual(['Transaction']);
  });
});

describe('@Rule Decorator - Metadata', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store description', () => {
    @Rule({
      description: 'Validates that deposit amount is positive and within limits',
    })
    class ValidateDepositRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateDepositRule');

    expect(registered?.metadata.description).toBe('Validates that deposit amount is positive and within limits');
  });

  it('should store tags', () => {
    @Rule({
      tags: ['validation', 'amount', 'deposit'],
    })
    class ValidateDepositRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateDepositRule');

    expect(registered?.metadata.tags).toEqual(['validation', 'amount', 'deposit']);
  });

  it('should store examples', () => {
    @Rule({
      examples: [
        {
          input: { amount: 100 },
          output: { isValid: true },
          description: 'Valid positive amount',
        },
        {
          input: { amount: -50 },
          output: { isValid: false, errors: ['Amount must be positive'] },
          description: 'Negative amount is invalid',
        },
      ],
    })
    class ValidateAmountRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateAmountRule');

    expect(registered?.metadata.examples).toHaveLength(2);
    expect(registered?.metadata.examples?.[0].description).toBe('Valid positive amount');
  });
});

describe('@Rule Decorator - Registry Queries', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should get rule by name', () => {
    @Rule({
      name: 'Validate Email',
    })
    class ValidateEmailRule {}

    const registry = LogicRegistry.getInstance();
    const rule = registry.getByName('Validate Email');

    expect(rule).toBeDefined();
    expect(rule?.metadata.type).toBe('rule');
  });

  it('should get all rules by type', () => {
    @Rule()
    class Rule1 {}

    @Rule()
    class Rule2 {}

    @Rule()
    class Rule3 {}

    const registry = LogicRegistry.getInstance();
    const rules = registry.getByType('rule');

    expect(rules).toHaveLength(3);
    expect(rules.every(r => r.metadata.type === 'rule')).toBe(true);
  });

  it('should find all rules by validation output', () => {
    @Rule()
    class Rule1 {}

    @Rule()
    class Rule2 {}

    const registry = LogicRegistry.getInstance();
    const compatible = registry.findCompatible(
      undefined,
      { isValid: 'boolean', errors: 'string[]' }
    );

    expect(compatible).toHaveLength(2);
  });
});

describe('@Rule Decorator - Complete Examples', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should register rule with all options', () => {
    @Rule({
      name: 'Validate Deposit Amount',
      context: 'Piggy Bank',
      ruleType: 'validation',
      appliesTo: ['Deposit'],
      inputs: { amount: 'number', currency: 'string' },
      pure: true,
      cacheable: true,
      description: 'Validates deposit amount is positive and within limits',
      tags: ['validation', 'deposit', 'amount'],
      examples: [
        {
          input: { amount: 100, currency: 'USD' },
          output: { isValid: true },
          description: 'Valid deposit',
        },
      ],
    })
    class ValidateDepositAmountRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('Validate Deposit Amount');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('Validate Deposit Amount');
    expect(registered?.metadata.type).toBe('rule');
    expect(registered?.metadata.context).toBe('Piggy Bank');
    expect(registered?.metadata.ruleType).toBe('validation');
    expect(registered?.metadata.appliesTo).toEqual(['Deposit']);
    expect(registered?.metadata.inputs).toEqual({ amount: 'number', currency: 'string' });
    expect(registered?.metadata.outputs).toEqual({ isValid: 'boolean', errors: 'string[]' });
    expect(registered?.metadata.pure).toBe(true);
    expect(registered?.metadata.cacheable).toBe(true);
    expect(registered?.metadata.description).toBe('Validates deposit amount is positive and within limits');
    expect(registered?.metadata.tags).toEqual(['validation', 'deposit', 'amount']);
    expect(registered?.metadata.examples).toHaveLength(1);
  });

  it('should register minimal rule', () => {
    @Rule()
    class SimpleRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('SimpleRule');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('SimpleRule');
    expect(registered?.metadata.type).toBe('rule');
    expect(registered?.metadata.ruleType).toBe('business');
    expect(registered?.metadata.pure).toBe(true);
    expect(registered?.metadata.cacheable).toBe(true);
    expect(registered?.metadata.outputs).toEqual({ isValid: 'boolean', errors: 'string[]' });
  });
});

describe('@Rule Decorator - Real-World Use Cases', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should support validation rules', () => {
    @Rule({
      ruleType: 'validation',
      inputs: { email: 'string' },
    })
    class ValidateEmailFormatRule {}

    @Rule({
      ruleType: 'validation',
      inputs: { password: 'string' },
    })
    class ValidatePasswordStrengthRule {}

    const registry = LogicRegistry.getInstance();
    const rules = registry.getByType('rule');

    expect(rules).toHaveLength(2);
    expect(rules.every(r => r.metadata.ruleType === 'validation')).toBe(true);
  });

  it('should support business rules', () => {
    @Rule({
      context: 'E-commerce',
      ruleType: 'business',
      appliesTo: ['Order'],
      inputs: { order: 'Order' },
    })
    class MinimumOrderAmountRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('MinimumOrderAmountRule');

    expect(registered?.metadata.ruleType).toBe('business');
    expect(registered?.metadata.context).toBe('E-commerce');
  });

  it('should support constraint rules', () => {
    @Rule({
      ruleType: 'constraint',
      appliesTo: ['User'],
      inputs: { user: 'User' },
    })
    class UniqueEmailConstraintRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('UniqueEmailConstraintRule');

    expect(registered?.metadata.ruleType).toBe('constraint');
  });

  it('should support multiple rules for same entity', () => {
    @Rule({
      context: 'Banking',
      appliesTo: ['Transaction'],
      inputs: { transaction: 'Transaction' },
    })
    class ValidateTransactionAmountRule {}

    @Rule({
      context: 'Banking',
      appliesTo: ['Transaction'],
      inputs: { transaction: 'Transaction' },
    })
    class ValidateTransactionDateRule {}

    @Rule({
      context: 'Banking',
      appliesTo: ['Transaction'],
      inputs: { transaction: 'Transaction' },
    })
    class ValidateTransactionCurrencyRule {}

    const registry = LogicRegistry.getInstance();
    const bankingRules = registry.getByContext('Banking');

    expect(bankingRules).toHaveLength(3);
    expect(bankingRules.every(r => r.metadata.appliesTo?.includes('Transaction'))).toBe(true);
  });
});
