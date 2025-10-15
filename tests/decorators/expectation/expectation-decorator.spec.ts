/**
 * Behavioral tests for @Expectation decorator
 * Tests only the public API and observable behavior (registry-based tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Expectation,
  Persona,
  Stakeholder,
} from '../../../src/index.js';
import { ExpectationRegistry } from '../../../src/decorators/expectation/expectation.registry.js';
import {
  StakeholderRegistry,
  PersonaRegistry,
} from '../../../src/decorators/stakeholder/registries.js';

describe('@Expectation Decorator - Basic Registration', () => {
  beforeEach(() => {
    const expectationRegistry = ExpectationRegistry.getInstance();
    expectationRegistry.clear();
    StakeholderRegistry.clear();
    PersonaRegistry.clear();
  });

  it('should register expectation with class decorator', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      description: 'Valid amount is accepted',
      behavior: 'ValidateAmount',
      journeySlug: 'test-journey',
    })
    class ValidAmountExpectation {}

    new ValidAmountExpectation();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].metadata.description).toBe('Valid amount is accepted');
  });

  it('should require expectingStakeholder for standalone expectations', () => {
    expect(() => {
      @Expectation({
        // @ts-expect-error - Testing missing required field
        providingStakeholder: 'System',
        behavior: 'TestBehavior',
        journeySlug: 'test',
      })
      class InvalidExpectation {}

      new InvalidExpectation();
    }).toThrow(/expectingStakeholder is required/);
  });

  it('should require providingStakeholder for standalone expectations', () => {
    expect(() => {
      @Expectation({
        expectingStakeholder: 'Customer',
        // @ts-expect-error - Testing missing required field
        behavior: 'TestBehavior',
        journeySlug: 'test',
      })
      class InvalidExpectation {}

      new InvalidExpectation();
    }).toThrow(/providingStakeholder is required/);
  });

  it('should require at least one behavior', () => {
    expect(() => {
      @Expectation({
        expectingStakeholder: 'Customer',
        providingStakeholder: 'System',
        journeySlug: 'test',
      })
      class NoBehaviorExpectation {}

      new NoBehaviorExpectation();
    }).toThrow(/At least one/);
  });

  it('should auto-generate expectation ID from journey slug', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'TestBehavior',
      journeySlug: 'deposit-money',
    })
    class FirstExpectation {}

    new FirstExpectation();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all[0].metadata.expectationId).toMatch(/deposit-money-EXP-\d{3}/);
  });

  it('should use provided expectation ID', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'TestBehavior',
      expectationId: 'CUSTOM-ID-001',
      journeySlug: 'test',
    })
    class CustomIdExpectation {}

    new CustomIdExpectation();

    const registry = ExpectationRegistry.getInstance();
    const expectation = registry.getById('CUSTOM-ID-001');
    expect(expectation).toBeDefined();
    expect(expectation?.metadata.expectationId).toBe('CUSTOM-ID-001');
  });
});

describe('@Expectation Decorator - Behaviors', () => {
  beforeEach(() => {
    const expectationRegistry = ExpectationRegistry.getInstance();
    expectationRegistry.clear();
  });

  it('should support single behavior', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'ValidateAmount',
      journeySlug: 'test',
    })
    class SingleBehaviorExpectation {}

    new SingleBehaviorExpectation();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all[0].metadata.behaviors).toEqual(['ValidateAmount']);
  });

  it('should support multiple behaviors', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behaviors: ['ValidateFormat', 'ValidateRange', 'ValidatePositive'],
      journeySlug: 'test',
    })
    class MultipleBehaviorsExpectation {}

    new MultipleBehaviorsExpectation();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all[0].metadata.behaviors).toEqual([
      'ValidateFormat',
      'ValidateRange',
      'ValidatePositive',
    ]);
  });

  it('should merge singular and plural behaviors', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'SingleBehavior',
      behaviors: ['Behavior1', 'Behavior2'],
      journeySlug: 'test',
    })
    class MergedBehaviorsExpectation {}

    new MergedBehaviorsExpectation();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all[0].metadata.behaviors).toContain('SingleBehavior');
    expect(all[0].metadata.behaviors).toContain('Behavior1');
    expect(all[0].metadata.behaviors).toContain('Behavior2');
  });
});

describe('@Expectation Decorator - Priority and Critical Path', () => {
  beforeEach(() => {
    const expectationRegistry = ExpectationRegistry.getInstance();
    expectationRegistry.clear();
  });

  it('should default criticalPath to true', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'TestBehavior',
      journeySlug: 'test',
    })
    class DefaultCriticalPathExpectation {}

    new DefaultCriticalPathExpectation();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all[0].metadata.criticalPath).toBe(true);
  });

  it('should allow setting criticalPath to false', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'TestBehavior',
      criticalPath: false,
      journeySlug: 'test',
    })
    class OptionalExpectation {}

    new OptionalExpectation();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all[0].metadata.criticalPath).toBe(false);
  });

  it('should store priority', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'TestBehavior',
      priority: 'high',
      journeySlug: 'test',
    })
    class HighPriorityExpectation {}

    new HighPriorityExpectation();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all[0].metadata.priority).toBe('high');
  });

  it('should return critical path expectations', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B1',
      criticalPath: true,
      journeySlug: 'test',
    })
    class Critical1 {}

    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B2',
      criticalPath: false,
      journeySlug: 'test',
    })
    class Optional1 {}

    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B3',
      journeySlug: 'test',
    })
    class Critical2 {}

    new Critical1();
    new Optional1();
    new Critical2();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    const critical = all.filter((e) => e.metadata.criticalPath === true);
    expect(critical).toHaveLength(2);
  });

  it('should return expectations by priority', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B1',
      priority: 'high',
      journeySlug: 'test',
    })
    class High1 {}

    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B2',
      priority: 'medium',
      journeySlug: 'test',
    })
    class Medium1 {}

    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B3',
      priority: 'high',
      journeySlug: 'test',
    })
    class High2 {}

    new High1();
    new Medium1();
    new High2();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    const high = all.filter((e) => e.metadata.priority === 'high');
    expect(high).toHaveLength(2);
  });
});

describe('@Expectation Decorator - BDD Scenario', () => {
  beforeEach(() => {
    const expectationRegistry = ExpectationRegistry.getInstance();
    expectationRegistry.clear();
  });

  it('should store BDD scenario', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'TestBehavior',
      scenario: {
        given: 'User is logged in',
        when: 'User enters amount',
        then: 'Amount is validated',
      },
      journeySlug: 'test',
    })
    class BDDExpectation {}

    new BDDExpectation();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all[0].metadata.scenario).toEqual({
      given: 'User is logged in',
      when: 'User enters amount',
      then: 'Amount is validated',
    });
  });
});

describe('@Expectation Decorator - Registry Queries', () => {
  beforeEach(() => {
    const expectationRegistry = ExpectationRegistry.getInstance();
    expectationRegistry.clear();
  });

  it('should query by expectation ID', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'TestBehavior',
      expectationId: 'TEST-001',
      journeySlug: 'test',
    })
    class TestExpectation {}

    new TestExpectation();

    const registry = ExpectationRegistry.getInstance();
    const expectation = registry.getById('TEST-001');
    expect(expectation).toBeDefined();
    expect(expectation?.metadata.expectationId).toBe('TEST-001');
  });

  it('should query by journey slug', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B1',
      journeySlug: 'deposit-money',
    })
    class Exp1 {}

    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B2',
      journeySlug: 'withdraw-money',
    })
    class Exp2 {}

    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B3',
      journeySlug: 'deposit-money',
    })
    class Exp3 {}

    new Exp1();
    new Exp2();
    new Exp3();

    const registry = ExpectationRegistry.getInstance();
    const depositExpectations = registry.getByJourney('deposit-money');
    expect(depositExpectations).toHaveLength(2);
  });

  it('should query by milestone', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B1',
      milestone: 'Validate Amount',
      milestoneId: 'validate-amount',
      journeySlug: 'test',
    })
    class Exp1 {}

    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B2',
      milestone: 'Process Payment',
      milestoneId: 'process-payment',
      journeySlug: 'test',
    })
    class Exp2 {}

    new Exp1();
    new Exp2();

    const registry = ExpectationRegistry.getInstance();
    const validateExpectations = registry.getByMilestone('validate-amount');
    expect(validateExpectations).toHaveLength(1);
  });

  it('should query by stakeholder', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B1',
      journeySlug: 'test',
    })
    class Exp1 {}

    @Expectation({
      expectingStakeholder: 'Admin',
      providingStakeholder: 'System',
      behavior: 'B2',
      journeySlug: 'test',
    })
    class Exp2 {}

    new Exp1();
    new Exp2();

    const registry = ExpectationRegistry.getInstance();
    const customerExpectations = registry.getByStakeholder('Customer');
    expect(customerExpectations.length).toBeGreaterThan(0);
  });

  it('should return all expectations', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B1',
      journeySlug: 'test',
    })
    class Exp1 {}

    @Expectation({
      expectingStakeholder: 'Admin',
      providingStakeholder: 'System',
      behavior: 'B2',
      journeySlug: 'test',
    })
    class Exp2 {}

    new Exp1();
    new Exp2();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all).toHaveLength(2);
  });
});

describe('@Expectation Decorator - Metadata Storage', () => {
  beforeEach(() => {
    const expectationRegistry = ExpectationRegistry.getInstance();
    expectationRegistry.clear();
  });

  it('should store tags', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'TestBehavior',
      tags: ['validation', 'financial'],
      journeySlug: 'test',
    })
    class TaggedExpectation {}

    new TaggedExpectation();

    const registry = ExpectationRegistry.getInstance();
    const all = registry.getAll();
    expect(all[0].metadata.tags).toEqual(['validation', 'financial']);
  });

  it('should store all metadata together', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      description: 'Complete test expectation',
      behavior: 'MainBehavior',
      behaviors: ['AuxBehavior1', 'AuxBehavior2'],
      expectationId: 'COMPLETE-001',
      priority: 'high',
      criticalPath: true,
      milestone: 'Test Milestone',
      scenario: {
        given: 'Precondition',
        when: 'Action',
        then: 'Outcome',
      },
      journeySlug: 'test-journey',
      tags: ['complete', 'test'],
    })
    class CompleteExpectation {}

    new CompleteExpectation();

    const registry = ExpectationRegistry.getInstance();
    const expectation = registry.getById('COMPLETE-001');

    expect(expectation?.metadata.description).toBe('Complete test expectation');
    expect(expectation?.metadata.behaviors).toContain('MainBehavior');
    expect(expectation?.metadata.behaviors).toContain('AuxBehavior1');
    expect(expectation?.metadata.behaviors).toContain('AuxBehavior2');
    expect(expectation?.metadata.priority).toBe('high');
    expect(expectation?.metadata.criticalPath).toBe(true);
    expect(expectation?.metadata.milestone).toBe('Test Milestone');
    expect(expectation?.metadata.scenario).toBeDefined();
    expect(expectation?.metadata.tags).toEqual(['complete', 'test']);
  });
});

describe('@Expectation Decorator - Statistics', () => {
  beforeEach(() => {
    const expectationRegistry = ExpectationRegistry.getInstance();
    expectationRegistry.clear();
  });

  it('should provide registry statistics', () => {
    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B1',
      journeySlug: 'journey-a',
      priority: 'high',
      criticalPath: true,
    })
    class Exp1 {}

    @Expectation({
      expectingStakeholder: 'Admin',
      providingStakeholder: 'System',
      behavior: 'B2',
      journeySlug: 'journey-a',
      priority: 'medium',
      criticalPath: false,
    })
    class Exp2 {}

    @Expectation({
      expectingStakeholder: 'Customer',
      providingStakeholder: 'System',
      behavior: 'B3',
      journeySlug: 'journey-b',
      priority: 'high',
      criticalPath: true,
    })
    class Exp3 {}

    new Exp1();
    new Exp2();
    new Exp3();

    const registry = ExpectationRegistry.getInstance();
    const stats = registry.getStats();

    expect(stats.totalExpectations).toBe(3);
    expect(stats.byJourney['journey-a']).toBe(2);
    expect(stats.byJourney['journey-b']).toBe(1);

    // Count critical path and priority manually since stats may not include them
    const all = registry.getAll();
    const critical = all.filter((e) => e.metadata.criticalPath === true);
    const high = all.filter((e) => e.metadata.priority === 'high');
    const medium = all.filter((e) => e.metadata.priority === 'medium');

    expect(critical).toHaveLength(2);
    expect(high).toHaveLength(2);
    expect(medium).toHaveLength(1);
  });
});
