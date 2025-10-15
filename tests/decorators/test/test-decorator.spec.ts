/**
 * Behavioral tests for @Test decorator
 * Tests only the public API and observable behavior through the registry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestRegistry, BehaviorRegistry } from '../../../src/index.js';

describe('@Test Decorator - Basic Registration', () => {
  beforeEach(() => {
    const registry = TestRegistry.getInstance();
    registry.clear();
  });

  it('should register test with class decorator', () => {
    @Test({
      type: 'unit',
    })
    class ValidateAmountTest {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].metadata.name).toBe('ValidateAmountTest');
    expect(all[0].metadata.type).toBe('unit');
  });

  it('should use provided name over class name', () => {
    @Test({
      name: 'Amount Validation Test',
      type: 'unit',
    })
    class ValidateAmountTest {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all[0].metadata.name).toBe('Amount Validation Test');
  });

  it('should throw error if type is missing', () => {
    expect(() => {
      @Test({} as any)
      class InvalidTest {}
    }).toThrow(/type is required/);
  });

  it('should auto-generate test ID', () => {
    @Test({
      type: 'unit',
      expectation: 'EXP-001',
    })
    class Test1 {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all[0].metadata.testId).toMatch(/EXP-001-TEST-\d{3}/);
  });

  it('should log info for standalone tests without explicit behavior/expectation', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    @Test({
      type: 'unit',
    })
    class StandaloneTest {}

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No explicit behavior/expectation provided')
    );

    consoleSpy.mockRestore();
  });
});

describe('@Test Decorator - Test Types', () => {
  beforeEach(() => {
    const registry = TestRegistry.getInstance();
    registry.clear();
  });

  it('should support unit test type', () => {
    @Test({
      type: 'unit',
    })
    class UnitTest {}

    const registry = TestRegistry.getInstance();
    const unitTests = registry.getByType('unit');

    expect(unitTests).toHaveLength(1);
    expect(unitTests[0].metadata.type).toBe('unit');
  });

  it('should support integration test type', () => {
    @Test({
      type: 'integration',
    })
    class IntegrationTest {}

    const registry = TestRegistry.getInstance();
    const integrationTests = registry.getByType('integration');

    expect(integrationTests).toHaveLength(1);
    expect(integrationTests[0].metadata.type).toBe('integration');
  });

  it('should support e2e test type', () => {
    @Test({
      type: 'e2e',
    })
    class E2ETest {}

    const registry = TestRegistry.getInstance();
    const e2eTests = registry.getByType('e2e');

    expect(e2eTests).toHaveLength(1);
    expect(e2eTests[0].metadata.type).toBe('e2e');
  });

  it('should support contract test type', () => {
    @Test({
      type: 'contract',
    })
    class ContractTest {}

    const registry = TestRegistry.getInstance();
    const contractTests = registry.getByType('contract');

    expect(contractTests).toHaveLength(1);
    expect(contractTests[0].metadata.type).toBe('contract');
  });

  it('should support performance test type', () => {
    @Test({
      type: 'performance',
    })
    class PerformanceTest {}

    const registry = TestRegistry.getInstance();
    const perfTests = registry.getByType('performance');

    expect(perfTests).toHaveLength(1);
    expect(perfTests[0].metadata.type).toBe('performance');
  });
});

describe('@Test Decorator - Expectation Linking', () => {
  beforeEach(() => {
    const registry = TestRegistry.getInstance();
    registry.clear();
  });

  it('should link test to expectation by string ID', () => {
    @Test({
      type: 'unit',
      expectation: 'deposit-money-EXP-001',
    })
    class DepositTest {}

    const registry = TestRegistry.getInstance();
    const tests = registry.getByExpectation('deposit-money-EXP-001');

    expect(tests).toHaveLength(1);
    expect(tests[0].metadata.expectationId).toBe('deposit-money-EXP-001');
  });

  it('should generate test ID based on expectation ID', () => {
    @Test({
      type: 'unit',
      expectation: 'EXP-001',
    })
    class Test1 {}

    @Test({
      type: 'unit',
      expectation: 'EXP-001',
    })
    class Test2 {}

    const registry = TestRegistry.getInstance();
    const tests = registry.getByExpectation('EXP-001');

    expect(tests[0].metadata.testId).toBe('EXP-001-TEST-001');
    expect(tests[1].metadata.testId).toBe('EXP-001-TEST-002');
  });

  it('should allow multiple tests for same expectation', () => {
    @Test({
      type: 'unit',
      expectation: 'EXP-001',
    })
    class Test1 {}

    @Test({
      type: 'integration',
      expectation: 'EXP-001',
    })
    class Test2 {}

    @Test({
      type: 'e2e',
      expectation: 'EXP-001',
    })
    class Test3 {}

    const registry = TestRegistry.getInstance();
    const tests = registry.getByExpectation('EXP-001');

    expect(tests).toHaveLength(3);
  });
});

describe('@Test Decorator - Behavior Linking', () => {
  beforeEach(() => {
    const registry = TestRegistry.getInstance();
    registry.clear();
  });

  it('should link test to behavior by string ID', () => {
    @Test({
      type: 'unit',
      behavior: 'ValidateAmountBehavior',
    })
    class AmountTest {}

    const registry = TestRegistry.getInstance();
    const tests = registry.getByBehavior('ValidateAmountBehavior');

    expect(tests).toHaveLength(1);
    expect(tests[0].metadata.behaviorId).toBe('ValidateAmountBehavior');
  });

  it('should allow multiple tests for same behavior', () => {
    @Test({
      type: 'unit',
      behavior: 'ValidateAmountBehavior',
    })
    class Test1 {}

    @Test({
      type: 'unit',
      behavior: 'ValidateAmountBehavior',
    })
    class Test2 {}

    const registry = TestRegistry.getInstance();
    const tests = registry.getByBehavior('ValidateAmountBehavior');

    expect(tests).toHaveLength(2);
  });
});

describe('@Test Decorator - Metadata', () => {
  beforeEach(() => {
    const registry = TestRegistry.getInstance();
    registry.clear();
  });

  it('should store description', () => {
    @Test({
      type: 'unit',
      description: 'Validates that positive amounts are accepted',
    })
    class PositiveAmountTest {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all[0].metadata.description).toBe('Validates that positive amounts are accepted');
  });

  it('should store framework', () => {
    @Test({
      type: 'unit',
      framework: 'vitest',
    })
    class MyTest {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all[0].metadata.framework).toBe('vitest');
  });

  it('should store file path', () => {
    @Test({
      type: 'unit',
      file: '__tests__/validate-amount.test.ts',
    })
    class MyTest {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all[0].metadata.file).toBe('__tests__/validate-amount.test.ts');
  });

  it('should store tags', () => {
    @Test({
      type: 'unit',
      tags: ['validation', 'amount', 'critical'],
    })
    class MyTest {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all[0].metadata.tags).toEqual(['validation', 'amount', 'critical']);
  });

  it('should store related tests', () => {
    @Test({
      type: 'unit',
      relatedTests: ['TEST-001', 'TEST-002'],
    })
    class MyTest {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all[0].metadata.relatedTests).toEqual(['TEST-001', 'TEST-002']);
  });
});

describe('@Test Decorator - Registry Queries', () => {
  beforeEach(() => {
    const registry = TestRegistry.getInstance();
    registry.clear();
  });

  it('should get test by ID', () => {
    @Test({
      type: 'unit',
      expectation: 'EXP-001',
    })
    class MyTest {}

    const registry = TestRegistry.getInstance();
    const test = registry.getById('EXP-001-TEST-001');

    expect(test).toBeDefined();
    expect(test?.metadata.testId).toBe('EXP-001-TEST-001');
  });

  it('should return undefined for non-existent test ID', () => {
    const registry = TestRegistry.getInstance();
    const test = registry.getById('NON-EXISTENT');

    expect(test).toBeUndefined();
  });

  it('should get all tests', () => {
    @Test({ type: 'unit' })
    class Test1 {}

    @Test({ type: 'integration' })
    class Test2 {}

    @Test({ type: 'e2e' })
    class Test3 {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all).toHaveLength(3);
  });

  it('should get all test IDs', () => {
    @Test({ type: 'unit', expectation: 'EXP-001' })
    class Test1 {}

    @Test({ type: 'unit', expectation: 'EXP-002' })
    class Test2 {}

    const registry = TestRegistry.getInstance();
    const ids = registry.getAllTestIds();

    expect(ids).toContain('EXP-001-TEST-001');
    expect(ids).toContain('EXP-002-TEST-001');
  });

  it('should check if expectation has tests', () => {
    @Test({
      type: 'unit',
      expectation: 'EXP-001',
    })
    class MyTest {}

    const registry = TestRegistry.getInstance();

    expect(registry.hasTests('EXP-001')).toBe(true);
    expect(registry.hasTests('EXP-999')).toBe(false);
  });

  it('should get covered expectations', () => {
    @Test({ type: 'unit', expectation: 'EXP-001' })
    class Test1 {}

    @Test({ type: 'unit', expectation: 'EXP-002' })
    class Test2 {}

    @Test({ type: 'unit', expectation: 'EXP-001' })
    class Test3 {}

    const registry = TestRegistry.getInstance();
    const covered = registry.getCoveredExpectations();

    expect(covered).toContain('EXP-001');
    expect(covered).toContain('EXP-002');
    expect(covered).toHaveLength(2);
  });
});

describe('@Test Decorator - Coverage Analysis', () => {
  beforeEach(() => {
    const registry = TestRegistry.getInstance();
    registry.clear();
  });

  it('should calculate coverage statistics', () => {
    @Test({ type: 'unit', expectation: 'EXP-001' })
    class Test1 {}

    @Test({ type: 'unit', expectation: 'EXP-002' })
    class Test2 {}

    @Test({ type: 'integration', expectation: 'EXP-001' })
    class Test3 {}

    const registry = TestRegistry.getInstance();
    const coverage = registry.getCoverage(['EXP-001', 'EXP-002', 'EXP-003']);

    expect(coverage.totalTests).toBe(3);
    expect(coverage.totalExpectations).toBe(3);
    expect(coverage.coveredExpectations).toBe(2);
    expect(coverage.coveragePercentage).toBeCloseTo(66.67, 1);
    expect(coverage.byType.unit).toBe(2);
    expect(coverage.byType.integration).toBe(1);
  });

  it('should identify gaps in test coverage', () => {
    @Test({ type: 'unit', expectation: 'EXP-001' })
    class Test1 {}

    @Test({ type: 'unit', expectation: 'EXP-003' })
    class Test2 {}

    const registry = TestRegistry.getInstance();
    const gaps = registry.getGaps(['EXP-001', 'EXP-002', 'EXP-003', 'EXP-004']);

    expect(gaps).toContain('EXP-002');
    expect(gaps).toContain('EXP-004');
    expect(gaps).toHaveLength(2);
  });
});

describe('@Test Decorator - Statistics', () => {
  beforeEach(() => {
    const registry = TestRegistry.getInstance();
    registry.clear();
  });

  it('should provide registry statistics', () => {
    @Test({ type: 'unit', framework: 'vitest', expectation: 'EXP-001' })
    class Test1 {}

    @Test({ type: 'unit', framework: 'jest', expectation: 'EXP-002' })
    class Test2 {}

    @Test({ type: 'integration', framework: 'vitest', expectation: 'EXP-003' })
    class Test3 {}

    @Test({ type: 'e2e', framework: 'playwright', expectation: 'EXP-004' })
    class Test4 {}

    const registry = TestRegistry.getInstance();
    const stats = registry.getStats();

    expect(stats.totalTests).toBe(4);
    expect(stats.totalExpectations).toBe(4);
    expect(stats.byType.unit).toBe(2);
    expect(stats.byType.integration).toBe(1);
    expect(stats.byType.e2e).toBe(1);
    expect(stats.byFramework.vitest).toBe(2);
    expect(stats.byFramework.jest).toBe(1);
    expect(stats.byFramework.playwright).toBe(1);
  });

  it('should track unknown framework', () => {
    @Test({ type: 'unit', expectation: 'EXP-001' })
    class Test1 {}

    const registry = TestRegistry.getInstance();
    const stats = registry.getStats();

    expect(stats.byFramework.unknown).toBe(1);
  });
});

describe('@Test Decorator - Complete Examples', () => {
  beforeEach(() => {
    const registry = TestRegistry.getInstance();
    registry.clear();
  });

  it('should register test with all options', () => {
    @Test({
      name: 'Validate Positive Amount',
      description: 'Tests that positive amounts are accepted',
      type: 'unit',
      framework: 'vitest',
      file: '__tests__/validate-amount.test.ts',
      expectation: 'deposit-money-EXP-001',
      behavior: 'ValidateAmountBehavior',
      tags: ['validation', 'amount', 'positive'],
      relatedTests: ['TEST-002', 'TEST-003'],
    })
    class ValidatePositiveAmountTest {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all).toHaveLength(1);
    const test = all[0].metadata;

    expect(test.name).toBe('Validate Positive Amount');
    expect(test.description).toBe('Tests that positive amounts are accepted');
    expect(test.type).toBe('unit');
    expect(test.framework).toBe('vitest');
    expect(test.file).toBe('__tests__/validate-amount.test.ts');
    expect(test.expectationId).toBe('deposit-money-EXP-001');
    expect(test.behaviorId).toBe('ValidateAmountBehavior');
    expect(test.tags).toEqual(['validation', 'amount', 'positive']);
    expect(test.relatedTests).toEqual(['TEST-002', 'TEST-003']);
    expect(test.testId).toBe('deposit-money-EXP-001-TEST-001');
  });

  it('should register minimal test', () => {
    @Test({
      type: 'unit',
    })
    class SimpleTest {}

    const registry = TestRegistry.getInstance();
    const all = registry.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].metadata.name).toBe('SimpleTest');
    expect(all[0].metadata.type).toBe('unit');
  });
});

describe('@Test Decorator - Method Decorator Support', () => {
  beforeEach(() => {
    const registry = TestRegistry.getInstance();
    registry.clear();
    const behaviorRegistry = BehaviorRegistry.getInstance();
    behaviorRegistry.clear?.();
  });

  it('should throw error if applied to non-class/non-method', () => {
    expect(() => {
      class TestClass {
        @Test({ type: 'unit' } as any)
        accessor field = 'test';
      }
    }).toThrow(/can only be applied to classes or methods/);
  });
});
