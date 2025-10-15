/**
 * Behavioral tests for @Step decorator
 * Tests only the public API and observable behavior (registry-based tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Step } from '../../../src/index.js';
import { StepRegistry } from '../../../src/decorators/step/step.registry.js';

describe('@Step Decorator - Basic Registration', () => {
  beforeEach(() => {
    const stepRegistry = StepRegistry.getInstance();
    stepRegistry.clear();
  });

  it('should register step with class decorator', () => {
    @Step({
      name: 'Enter Amount',
      actor: 'Customer',
    })
    class EnterAmountStep {}

    new EnterAmountStep();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps.length).toBeGreaterThan(0);
  });

  it('should auto-generate name from class name', () => {
    @Step({
      actor: 'System',
    })
    class ValidateInput {}

    new ValidateInput();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    const step = steps.find((s) => s.metadata.name === 'ValidateInput');
    expect(step).toBeDefined();
  });

  it('should store actor', () => {
    @Step({
      name: 'Click Button',
      actor: 'User',
    })
    class ClickButton {}

    new ClickButton();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.actor).toBe('User');
  });

  it('should require order for method decorators', () => {
    expect(() => {
      class TestMilestone {
        @Step({
          // @ts-expect-error - Testing missing required field
          actor: 'User',
        })
        testStep() {}
      }

      new TestMilestone();
    }).toThrow(/order is required/);
  });
});

describe('@Step Decorator - Order Management', () => {
  beforeEach(() => {
    const stepRegistry = StepRegistry.getInstance();
    stepRegistry.clear();
  });

  it('should store order when provided', () => {
    @Step({
      actor: 'User',
      order: 5,
    })
    class StepFive {}

    new StepFive();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.order).toBe(5);
  });

  it('should allow undefined order for standalone steps', () => {
    @Step({
      actor: 'User',
    })
    class StandaloneStep {}

    new StandaloneStep();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.order).toBeUndefined();
  });
});

describe('@Step Decorator - Optional and Alternatives', () => {
  beforeEach(() => {
    const stepRegistry = StepRegistry.getInstance();
    stepRegistry.clear();
  });

  it('should default optional to false', () => {
    @Step({
      actor: 'User',
    })
    class RequiredStep {}

    new RequiredStep();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.optional).toBe(false);
  });

  it('should allow setting optional to true', () => {
    @Step({
      actor: 'User',
      optional: true,
    })
    class OptionalStep {}

    new OptionalStep();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.optional).toBe(true);
  });

  it('should store alternatives', () => {
    @Step({
      actor: 'User',
      alternatives: ['loginWithGoogle', 'loginWithFacebook'],
    })
    class LoginWithEmail {}

    new LoginWithEmail();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.alternatives).toEqual([
      'loginWithGoogle',
      'loginWithFacebook',
    ]);
  });
});

describe('@Step Decorator - Reusability', () => {
  beforeEach(() => {
    const stepRegistry = StepRegistry.getInstance();
    stepRegistry.clear();
  });

  it('should default reusable to true for class decorators', () => {
    @Step({
      actor: 'User',
    })
    class ReusableStep {}

    new ReusableStep();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.reusable).toBe(true);
  });

  it('should allow explicit reusable setting', () => {
    @Step({
      actor: 'User',
      reusable: false,
    })
    class NonReusableStep {}

    new NonReusableStep();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.reusable).toBe(false);
  });
});

describe('@Step Decorator - Expectations', () => {
  beforeEach(() => {
    const stepRegistry = StepRegistry.getInstance();
    stepRegistry.clear();
  });

  it('should store single expectation', () => {
    @Step({
      actor: 'User',
      expectation: 'valid-format',
    })
    class ValidateFormat {}

    new ValidateFormat();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.expectations).toContain('valid-format');
  });

  it('should store multiple expectations', () => {
    @Step({
      actor: 'User',
      expectations: ['exp-1', 'exp-2', 'exp-3'],
    })
    class MultipleExpectations {}

    new MultipleExpectations();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.expectations).toEqual(['exp-1', 'exp-2', 'exp-3']);
  });

  it('should merge singular and plural expectations', () => {
    @Step({
      actor: 'User',
      expectation: 'single-exp',
      expectations: ['exp-1', 'exp-2'],
    })
    class MergedExpectations {}

    new MergedExpectations();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.expectations).toContain('single-exp');
    expect(steps[0].metadata.expectations).toContain('exp-1');
    expect(steps[0].metadata.expectations).toContain('exp-2');
  });
});

describe('@Step Decorator - Metadata Storage', () => {
  beforeEach(() => {
    const stepRegistry = StepRegistry.getInstance();
    stepRegistry.clear();
  });

  it('should store description and tags', () => {
    @Step({
      actor: 'User',
      description: 'User enters their email address',
      tags: ['input', 'validation'],
    })
    class EnterEmail {}

    new EnterEmail();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps[0].metadata.description).toBe('User enters their email address');
    expect(steps[0].metadata.tags).toEqual(['input', 'validation']);
  });

  it('should store all metadata together', () => {
    @Step({
      name: 'Complete Step',
      actor: 'User',
      order: 3,
      expectation: 'exp-1',
      expectations: ['exp-2', 'exp-3'],
      optional: true,
      alternatives: ['alt-1', 'alt-2'],
      description: 'A complete step',
      tags: ['test', 'complete'],
      reusable: true,
    })
    class CompleteStep {}

    new CompleteStep();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    const step = steps[0].metadata;

    expect(step.name).toBe('Complete Step');
    expect(step.actor).toBe('User');
    expect(step.order).toBe(3);
    expect(step.expectations).toContain('exp-1');
    expect(step.expectations).toContain('exp-2');
    expect(step.expectations).toContain('exp-3');
    expect(step.optional).toBe(true);
    expect(step.alternatives).toEqual(['alt-1', 'alt-2']);
    expect(step.description).toBe('A complete step');
    expect(step.tags).toEqual(['test', 'complete']);
    expect(step.reusable).toBe(true);
  });
});

describe('@Step Decorator - Registry Queries', () => {
  beforeEach(() => {
    const stepRegistry = StepRegistry.getInstance();
    stepRegistry.clear();
  });

  it('should return all steps', () => {
    @Step({ actor: 'User' })
    class Step1 {}

    @Step({ actor: 'User' })
    class Step2 {}

    new Step1();
    new Step2();

    const registry = StepRegistry.getInstance();
    const steps = registry.getAll();
    expect(steps.length).toBeGreaterThanOrEqual(2);
  });

  it('should query steps by actor', () => {
    @Step({ actor: 'Customer' })
    class CustomerStep {}

    @Step({ actor: 'Admin' })
    class AdminStep {}

    new CustomerStep();
    new AdminStep();

    const registry = StepRegistry.getInstance();
    const customerSteps = registry.getByActor('Customer');
    expect(customerSteps.length).toBeGreaterThan(0);
  });

  it('should query optional steps', () => {
    @Step({ actor: 'User', optional: true })
    class OptionalStep1 {}

    @Step({ actor: 'User', optional: false })
    class RequiredStep1 {}

    @Step({ actor: 'User', optional: true })
    class OptionalStep2 {}

    new OptionalStep1();
    new RequiredStep1();
    new OptionalStep2();

    const registry = StepRegistry.getInstance();
    const optional = registry.getOptional();
    expect(optional.length).toBeGreaterThanOrEqual(2);
  });

  it('should query reusable steps', () => {
    @Step({ actor: 'User', reusable: true })
    class Reusable1 {}

    @Step({ actor: 'User', reusable: false })
    class NotReusable {}

    @Step({ actor: 'User' }) // defaults to true for classes
    class Reusable2 {}

    new Reusable1();
    new NotReusable();
    new Reusable2();

    const registry = StepRegistry.getInstance();
    const all = registry.getAll();
    const reusable = all.filter((s) => s.metadata.reusable === true);
    expect(reusable.length).toBeGreaterThanOrEqual(2);
  });
});

describe('@Step Decorator - Validation', () => {
  it('should only apply to classes, methods, or fields', () => {
    expect(() => {
      const decorator = Step({ actor: 'User' });
      // @ts-expect-error - Testing invalid usage
      decorator(() => {}, { kind: 'accessor', name: 'test' } as any);
    }).toThrow(/can only be applied to classes, methods, or fields/);
  });
});
