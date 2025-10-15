/**
 * Behavioral tests for @Logic decorator
 * Tests only the public API and observable behavior through the registry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logic, LogicRegistry } from '../../../src/index.js';

describe('@Logic Decorator - Basic Registration', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should register logic with class decorator', () => {
    @Logic({
      type: 'validation',
    })
    class ValidateEmailLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateEmailLogic');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('ValidateEmailLogic');
    expect(registered?.metadata.type).toBe('validation');
  });

  it('should use provided name over class name', () => {
    @Logic({
      name: 'Email Validator',
      type: 'validation',
    })
    class ValidateEmailLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('Email Validator');

    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('Email Validator');
  });

  it('should throw error if type is missing', () => {
    expect(() => {
      @Logic({} as any)
      class InvalidLogic {}
    }).toThrow(/type is required/);
  });

  it('should prevent duplicate logic names', () => {
    @Logic({
      name: 'Validate Email',
      type: 'validation',
    })
    class ValidateEmailLogic1 {}

    expect(() => {
      @Logic({
        name: 'Validate Email',
        type: 'validation',
      })
      class ValidateEmailLogic2 {}
    }).toThrow(/Logic with this name already exists/);
  });
});

describe('@Logic Decorator - Logic Types', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should register specification type logic', () => {
    @Logic({
      type: 'specification',
    })
    class AccountEligibleForLoanSpecification {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('specification');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.type).toBe('specification');
  });

  it('should register policy type logic', () => {
    @Logic({
      type: 'policy',
    })
    class DiscountCalculationPolicy {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('policy');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.type).toBe('policy');
  });

  it('should register rule type logic', () => {
    @Logic({
      type: 'rule',
    })
    class PasswordValidationRule {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('rule');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.type).toBe('rule');
  });

  it('should register behavior type logic', () => {
    @Logic({
      type: 'behavior',
      expectationId: 'deposit-money-EXP-001',
    })
    class ProcessDepositBehavior {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('behavior');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.type).toBe('behavior');
  });

  it('should register calculation type logic', () => {
    @Logic({
      type: 'calculation',
    })
    class CalculateInterestLogic {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('calculation');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.type).toBe('calculation');
  });

  it('should register transformation type logic', () => {
    @Logic({
      type: 'transformation',
    })
    class ConvertCurrencyLogic {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('transformation');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.type).toBe('transformation');
  });

  it('should register orchestration type logic', () => {
    @Logic({
      type: 'orchestration',
      composedOf: [{ logic: 'ValidateInput' }],
      strategy: 'sequence',
    })
    class ProcessOrderOrchestration {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('orchestration');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.type).toBe('orchestration');
  });

  it('should register query type logic', () => {
    @Logic({
      type: 'query',
    })
    class GetUserByIdQuery {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('query');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.type).toBe('query');
  });

  it('should register command type logic', () => {
    @Logic({
      type: 'command',
    })
    class CreateAccountCommand {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('command');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.type).toBe('command');
  });

  it('should register event-handler type logic', () => {
    @Logic({
      type: 'event-handler',
    })
    class HandleAccountCreatedEvent {}

    const registry = LogicRegistry.getInstance();
    const logics = registry.getByType('event-handler');

    expect(logics).toHaveLength(1);
    expect(logics[0].metadata.type).toBe('event-handler');
  });
});

describe('@Logic Decorator - Input/Output Contracts', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store input contract', () => {
    @Logic({
      type: 'validation',
      inputs: { email: 'string', age: 'number' },
    })
    class ValidateUserLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateUserLogic');

    expect(registered?.metadata.inputs).toEqual({ email: 'string', age: 'number' });
  });

  it('should store output contract', () => {
    @Logic({
      type: 'validation',
      outputs: { isValid: 'boolean', errors: 'string[]' },
    })
    class ValidateUserLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateUserLogic');

    expect(registered?.metadata.outputs).toEqual({ isValid: 'boolean', errors: 'string[]' });
  });

  it('should store both input and output contracts', () => {
    @Logic({
      type: 'transformation',
      inputs: { amount: 'number', currency: 'string' },
      outputs: { convertedAmount: 'number' },
    })
    class ConvertCurrencyLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ConvertCurrencyLogic');

    expect(registered?.metadata.inputs).toEqual({ amount: 'number', currency: 'string' });
    expect(registered?.metadata.outputs).toEqual({ convertedAmount: 'number' });
  });

  it('should find compatible logic by input contract', () => {
    @Logic({
      type: 'validation',
      inputs: { email: 'string' },
      outputs: { isValid: 'boolean' },
    })
    class ValidateEmailLogic {}

    @Logic({
      type: 'validation',
      inputs: { email: 'string' },
      outputs: { isValid: 'boolean', suggestion: 'string' },
    })
    class ValidateEmailWithSuggestionLogic {}

    const registry = LogicRegistry.getInstance();
    const compatible = registry.findCompatible({ email: 'string' });

    expect(compatible).toHaveLength(2);
  });

  it('should find compatible logic by output contract', () => {
    @Logic({
      type: 'validation',
      inputs: { email: 'string' },
      outputs: { isValid: 'boolean' },
    })
    class ValidateEmailLogic {}

    @Logic({
      type: 'validation',
      inputs: { phone: 'string' },
      outputs: { isValid: 'boolean' },
    })
    class ValidatePhoneLogic {}

    const registry = LogicRegistry.getInstance();
    const compatible = registry.findCompatible(undefined, { isValid: 'boolean' });

    expect(compatible).toHaveLength(2);
  });

  it('should find compatible logic by both input and output contracts', () => {
    @Logic({
      type: 'validation',
      inputs: { email: 'string' },
      outputs: { isValid: 'boolean' },
    })
    class ValidateEmailLogic {}

    @Logic({
      type: 'validation',
      inputs: { email: 'string' },
      outputs: { isValid: 'boolean', errors: 'string[]' },
    })
    class ValidateEmailWithErrorsLogic {}

    @Logic({
      type: 'validation',
      inputs: { phone: 'string' },
      outputs: { isValid: 'boolean' },
    })
    class ValidatePhoneLogic {}

    const registry = LogicRegistry.getInstance();
    const compatible = registry.findCompatible(
      { email: 'string' },
      { isValid: 'boolean' }
    );

    expect(compatible).toHaveLength(2);
    expect(compatible.map(l => l.metadata.name)).toContain('ValidateEmailLogic');
    expect(compatible.map(l => l.metadata.name)).toContain('ValidateEmailWithErrorsLogic');
  });
});

describe('@Logic Decorator - Execution Characteristics', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should default pure to undefined', () => {
    @Logic({
      type: 'validation',
    })
    class ValidateEmailLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateEmailLogic');

    expect(registered?.metadata.pure).toBeUndefined();
  });

  it('should store pure flag as true', () => {
    @Logic({
      type: 'calculation',
      pure: true,
    })
    class CalculateInterestLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('CalculateInterestLogic');

    expect(registered?.metadata.pure).toBe(true);
  });

  it('should store pure flag as false', () => {
    @Logic({
      type: 'command',
      pure: false,
    })
    class CreateAccountLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('CreateAccountLogic');

    expect(registered?.metadata.pure).toBe(false);
  });

  it('should store idempotent flag', () => {
    @Logic({
      type: 'command',
      idempotent: true,
    })
    class UpdateAccountStatusLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('UpdateAccountStatusLogic');

    expect(registered?.metadata.idempotent).toBe(true);
  });

  it('should store cacheable flag', () => {
    @Logic({
      type: 'query',
      cacheable: true,
    })
    class GetUserProfileLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('GetUserProfileLogic');

    expect(registered?.metadata.cacheable).toBe(true);
  });

  it('should store retryable flag', () => {
    @Logic({
      type: 'command',
      retryable: true,
    })
    class SendEmailLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('SendEmailLogic');

    expect(registered?.metadata.retryable).toBe(true);
  });

  it('should store timeout', () => {
    @Logic({
      type: 'query',
      timeout: '5s',
    })
    class FetchUserDataLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('FetchUserDataLogic');

    expect(registered?.metadata.timeout).toBe('5s');
  });

  it('should store all execution characteristics together', () => {
    @Logic({
      type: 'calculation',
      pure: true,
      idempotent: true,
      cacheable: true,
      retryable: false,
      timeout: '100ms',
    })
    class CalculateTaxLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('CalculateTaxLogic');

    expect(registered?.metadata.pure).toBe(true);
    expect(registered?.metadata.idempotent).toBe(true);
    expect(registered?.metadata.cacheable).toBe(true);
    expect(registered?.metadata.retryable).toBe(false);
    expect(registered?.metadata.timeout).toBe('100ms');
  });
});

describe('@Logic Decorator - Dependencies', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store invokes property', () => {
    @Logic({
      type: 'command',
      invokes: ['ValidateInput', 'SaveToDatabase'],
    })
    class CreateUserLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('CreateUserLogic');

    expect(registered?.metadata.invokes).toEqual(['ValidateInput', 'SaveToDatabase']);
  });

  it('should store requires property', () => {
    @Logic({
      type: 'command',
      requires: ['UserRepository', 'EmailService'],
    })
    class CreateUserLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('CreateUserLogic');

    expect(registered?.metadata.requires).toEqual(['UserRepository', 'EmailService']);
  });

  it('should track dependencies from invokes', () => {
    @Logic({
      type: 'validation',
    })
    class ValidateInputLogic {}

    @Logic({
      type: 'command',
    })
    class SaveToDatabaseLogic {}

    @Logic({
      type: 'command',
      invokes: ['ValidateInputLogic', 'SaveToDatabaseLogic'],
    })
    class CreateUserLogic {}

    const registry = LogicRegistry.getInstance();
    const dependencies = registry.getDependencies('CreateUserLogic');

    expect(dependencies).toContain('ValidateInputLogic');
    expect(dependencies).toContain('SaveToDatabaseLogic');
  });
});

describe('@Logic Decorator - Orchestration', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should require composedOf for orchestration type', () => {
    expect(() => {
      @Logic({
        type: 'orchestration',
        strategy: 'sequence',
      } as any)
      class InvalidOrchestration {}
    }).toThrow(/composedOf is required for type 'orchestration'/);
  });

  it('should require strategy for orchestration type', () => {
    expect(() => {
      @Logic({
        type: 'orchestration',
        composedOf: [{ logic: 'ValidateInput' }],
      } as any)
      class InvalidOrchestration {}
    }).toThrow(/strategy is required for type 'orchestration'/);
  });

  it('should register orchestration with sequence strategy', () => {
    @Logic({
      type: 'orchestration',
      composedOf: [
        { logic: 'ValidateInput' },
        { logic: 'ProcessData' },
        { logic: 'SaveResult' },
      ],
      strategy: 'sequence',
    })
    class ProcessOrderLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ProcessOrderLogic');

    expect(registered?.metadata.strategy).toBe('sequence');
    expect(registered?.metadata.composedOf).toHaveLength(3);
  });

  it('should register orchestration with parallel strategy', () => {
    @Logic({
      type: 'orchestration',
      composedOf: [
        { logic: 'SendEmail' },
        { logic: 'SendSMS' },
        { logic: 'SendPushNotification' },
      ],
      strategy: 'parallel',
    })
    class SendNotificationsLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('SendNotificationsLogic');

    expect(registered?.metadata.strategy).toBe('parallel');
  });

  it('should register orchestration with conditional strategy', () => {
    @Logic({
      type: 'orchestration',
      composedOf: [
        { logic: 'ProcessStandardOrder', condition: 'isStandardOrder' },
        { logic: 'ProcessPriorityOrder', condition: 'isPriorityOrder' },
      ],
      strategy: 'conditional',
    })
    class ProcessOrderLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ProcessOrderLogic');

    expect(registered?.metadata.strategy).toBe('conditional');
  });

  it('should track dependencies from composedOf', () => {
    @Logic({
      type: 'validation',
    })
    class ValidateInputLogic {}

    @Logic({
      type: 'transformation',
    })
    class ProcessDataLogic {}

    @Logic({
      type: 'orchestration',
      composedOf: [
        { logic: 'ValidateInputLogic' },
        { logic: 'ProcessDataLogic' },
      ],
      strategy: 'sequence',
    })
    class OrchestrationLogic {}

    const registry = LogicRegistry.getInstance();
    const dependencies = registry.getDependencies('OrchestrationLogic');

    expect(dependencies).toContain('ValidateInputLogic');
    expect(dependencies).toContain('ProcessDataLogic');
  });
});

describe('@Logic Decorator - Cyclic Dependency Detection', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should detect direct cyclic dependency', () => {
    @Logic({
      type: 'command',
      invokes: ['LogicB'],
    })
    class LogicA {}

    @Logic({
      type: 'command',
      invokes: ['LogicA'],
    })
    class LogicB {}

    const registry = LogicRegistry.getInstance();

    expect(registry.hasCyclicDependency('LogicA')).toBe(true);
    expect(registry.hasCyclicDependency('LogicB')).toBe(true);
  });

  it('should detect indirect cyclic dependency', () => {
    @Logic({
      type: 'command',
      invokes: ['LogicB'],
    })
    class LogicA {}

    @Logic({
      type: 'command',
      invokes: ['LogicC'],
    })
    class LogicB {}

    @Logic({
      type: 'command',
      invokes: ['LogicA'],
    })
    class LogicC {}

    const registry = LogicRegistry.getInstance();

    expect(registry.hasCyclicDependency('LogicA')).toBe(true);
    expect(registry.hasCyclicDependency('LogicB')).toBe(true);
    expect(registry.hasCyclicDependency('LogicC')).toBe(true);
  });

  it('should not detect cycles in acyclic dependencies', () => {
    @Logic({
      type: 'command',
      invokes: ['LogicB', 'LogicC'],
    })
    class LogicA {}

    @Logic({
      type: 'command',
    })
    class LogicB {}

    @Logic({
      type: 'command',
    })
    class LogicC {}

    const registry = LogicRegistry.getInstance();

    expect(registry.hasCyclicDependency('LogicA')).toBe(false);
    expect(registry.hasCyclicDependency('LogicB')).toBe(false);
    expect(registry.hasCyclicDependency('LogicC')).toBe(false);
  });
});

describe('@Logic Decorator - Domain Context', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store context', () => {
    @Logic({
      type: 'command',
      context: 'Account Management',
    })
    class CreateAccountLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('CreateAccountLogic');

    expect(registered?.metadata.context).toBe('Account Management');
  });

  it('should query logic by context', () => {
    @Logic({
      type: 'command',
      context: 'Payment',
    })
    class ProcessPaymentLogic {}

    @Logic({
      type: 'command',
      context: 'Payment',
    })
    class RefundPaymentLogic {}

    @Logic({
      type: 'command',
      context: 'Account',
    })
    class CreateAccountLogic {}

    const registry = LogicRegistry.getInstance();
    const paymentLogic = registry.getByContext('Payment');

    expect(paymentLogic).toHaveLength(2);
    expect(paymentLogic.map(l => l.metadata.name)).toContain('ProcessPaymentLogic');
    expect(paymentLogic.map(l => l.metadata.name)).toContain('RefundPaymentLogic');
  });

  it('should store aggregateType', () => {
    @Logic({
      type: 'command',
      aggregateType: 'Account',
    })
    class CreateAccountLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('CreateAccountLogic');

    expect(registered?.metadata.aggregateType).toBe('Account');
  });

  it('should store appliesTo', () => {
    @Logic({
      type: 'validation',
      appliesTo: ['SavingsAccount', 'CheckingAccount'],
    })
    class ValidateAccountLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateAccountLogic');

    expect(registered?.metadata.appliesTo).toEqual(['SavingsAccount', 'CheckingAccount']);
  });
});

describe('@Logic Decorator - Type-Specific Options', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store ruleType for rule logic', () => {
    @Logic({
      type: 'rule',
      ruleType: 'validation',
    })
    class ValidatePasswordRule {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidatePasswordRule');

    expect(registered?.metadata.ruleType).toBe('validation');
  });

  it('should store policyType for policy logic', () => {
    @Logic({
      type: 'policy',
      policyType: 'pricing',
    })
    class DynamicPricingPolicy {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('DynamicPricingPolicy');

    expect(registered?.metadata.policyType).toBe('pricing');
  });

  it('should store expectationId for behavior logic', () => {
    @Logic({
      type: 'behavior',
      expectationId: 'deposit-money-EXP-001',
    })
    class ProcessDepositBehavior {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ProcessDepositBehavior');

    expect(registered?.metadata.expectationId).toBe('deposit-money-EXP-001');
  });

  it('should warn if behavior logic missing expectationId', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Logic({
      type: 'behavior',
    })
    class ProcessDepositBehavior {}

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('expectationId is recommended for type \'behavior\'')
    );

    consoleSpy.mockRestore();
  });
});

describe('@Logic Decorator - Metadata', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should store description', () => {
    @Logic({
      type: 'validation',
      description: 'Validates email format using regex',
    })
    class ValidateEmailLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ValidateEmailLogic');

    expect(registered?.metadata.description).toBe('Validates email format using regex');
  });

  it('should store tags', () => {
    @Logic({
      type: 'command',
      tags: ['critical', 'payment', 'transactional'],
    })
    class ProcessPaymentLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('ProcessPaymentLogic');

    expect(registered?.metadata.tags).toEqual(['critical', 'payment', 'transactional']);
  });

  it('should store examples', () => {
    @Logic({
      type: 'calculation',
      examples: [
        {
          input: { principal: 1000, rate: 0.05, time: 1 },
          output: { interest: 50 },
          description: 'Simple interest calculation',
        },
      ],
    })
    class CalculateInterestLogic {}

    const registry = LogicRegistry.getInstance();
    const registered = registry.getByName('CalculateInterestLogic');

    expect(registered?.metadata.examples).toHaveLength(1);
    expect(registered?.metadata.examples?.[0].description).toBe('Simple interest calculation');
  });
});

describe('@Logic Decorator - Registry Queries', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should get all registered logic', () => {
    @Logic({ type: 'validation' })
    class Logic1 {}

    @Logic({ type: 'command' })
    class Logic2 {}

    @Logic({ type: 'query' })
    class Logic3 {}

    const registry = LogicRegistry.getInstance();
    const all = registry.getAll();

    expect(all).toHaveLength(3);
  });

  it('should get all logic types', () => {
    @Logic({ type: 'validation' })
    class Logic1 {}

    @Logic({ type: 'command' })
    class Logic2 {}

    @Logic({ type: 'query' })
    class Logic3 {}

    const registry = LogicRegistry.getInstance();
    const types = registry.getAllTypes();

    expect(types).toContain('validation');
    expect(types).toContain('command');
    expect(types).toContain('query');
  });

  it('should get all contexts', () => {
    @Logic({ type: 'command', context: 'Payment' })
    class Logic1 {}

    @Logic({ type: 'command', context: 'Account' })
    class Logic2 {}

    @Logic({ type: 'query', context: 'Payment' })
    class Logic3 {}

    const registry = LogicRegistry.getInstance();
    const contexts = registry.getAllContexts();

    expect(contexts).toContain('Payment');
    expect(contexts).toContain('Account');
    expect(contexts).toHaveLength(2);
  });

  it('should return empty array for non-existent logic dependencies', () => {
    const registry = LogicRegistry.getInstance();
    const dependencies = registry.getDependencies('NonExistentLogic');

    expect(dependencies).toEqual([]);
  });

  it('should return undefined for non-existent logic', () => {
    const registry = LogicRegistry.getInstance();
    const logic = registry.getByName('NonExistentLogic');

    expect(logic).toBeUndefined();
  });
});

describe('@Logic Decorator - Registry Statistics', () => {
  beforeEach(() => {
    const registry = LogicRegistry.getInstance();
    registry.clear();
  });

  it('should provide registry statistics', () => {
    @Logic({ type: 'validation' })
    class Logic1 {}

    @Logic({ type: 'validation' })
    class Logic2 {}

    @Logic({ type: 'command', context: 'Payment' })
    class Logic3 {}

    @Logic({ type: 'query', context: 'Payment' })
    class Logic4 {}

    @Logic({ type: 'query', context: 'Account' })
    class Logic5 {}

    const registry = LogicRegistry.getInstance();
    const stats = registry.getStats();

    expect(stats.totalLogic).toBe(5);
    expect(stats.byType.validation).toBe(2);
    expect(stats.byType.command).toBe(1);
    expect(stats.byType.query).toBe(2);
    expect(stats.byContext.Payment).toBe(2);
    expect(stats.byContext.Account).toBe(1);
  });
});
