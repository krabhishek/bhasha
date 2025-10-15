/**
 * Behavioral tests for @AttachLogic decorator
 * Tests only the public API and observable behavior through helper functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AttachLogic,
  getAttachedLogic,
  getAllAttachedLogic,
  hasAttachedLogic,
  getMembersWithAttachedLogic,
} from '../../../src/index.js';

// Mock logic classes for testing
class ValidateAmountLogic {}
class ProcessDepositLogic {}
class NotifyUserLogic {}

describe('@AttachLogic Decorator - Basic Attachment', () => {
  it('should attach logic to a method', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      enterAmount() {}
    }

    const attached = getAttachedLogic(TestClass, 'enterAmount');

    expect(attached).toBeDefined();
    expect(attached?.logic).toHaveLength(1);
    expect(attached?.logic[0]).toBe(ValidateAmountLogic);
  });

  it('should attach logic by string name', () => {
    class TestClass {
      @AttachLogic({ logic: 'ValidateEmail' })
      enterEmail() {}
    }

    const attached = getAttachedLogic(TestClass, 'enterEmail');

    expect(attached).toBeDefined();
    expect(attached?.logic).toEqual(['ValidateEmail']);
  });

  it('should attach logic to a field', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      amount: number = 0;
    }

    const attached = getAttachedLogic(TestClass, 'amount');

    expect(attached).toBeDefined();
    expect(attached?.logic[0]).toBe(ValidateAmountLogic);
  });

  it('should throw error if logic is not provided', () => {
    expect(() => {
      class TestClass {
        @AttachLogic({} as any)
        method() {}
      }
    }).toThrow(/logic is required/);
  });

  it('should throw error if applied to non-method/non-field', () => {
    expect(() => {
      class TestClass {
        @AttachLogic({ logic: ValidateAmountLogic } as any)
        accessor field = 'test';
      }
    }).toThrow(/can only be applied to methods or fields/);
  });
});

describe('@AttachLogic Decorator - Multiple Logic', () => {
  it('should attach multiple logic classes', () => {
    class TestClass {
      @AttachLogic({ logic: [ValidateAmountLogic, ProcessDepositLogic, NotifyUserLogic] })
      processDeposit() {}
    }

    const attached = getAttachedLogic(TestClass, 'processDeposit');

    expect(attached).toBeDefined();
    expect(attached?.logic).toHaveLength(3);
    expect(attached?.logic[0]).toBe(ValidateAmountLogic);
    expect(attached?.logic[1]).toBe(ProcessDepositLogic);
    expect(attached?.logic[2]).toBe(NotifyUserLogic);
  });

  it('should attach multiple logic by string names', () => {
    class TestClass {
      @AttachLogic({ logic: ['ValidateEmail', 'CheckPermission', 'LogActivity'] })
      sendEmail() {}
    }

    const attached = getAttachedLogic(TestClass, 'sendEmail');

    expect(attached).toBeDefined();
    expect(attached?.logic).toEqual(['ValidateEmail', 'CheckPermission', 'LogActivity']);
  });

  it('should attach mixed class and string references', () => {
    class TestClass {
      @AttachLogic({ logic: [ValidateAmountLogic, 'CheckBalance', NotifyUserLogic] })
      withdraw() {}
    }

    const attached = getAttachedLogic(TestClass, 'withdraw');

    expect(attached).toBeDefined();
    expect(attached?.logic).toHaveLength(3);
    expect(attached?.logic[0]).toBe(ValidateAmountLogic);
    expect(attached?.logic[1]).toBe('CheckBalance');
    expect(attached?.logic[2]).toBe(NotifyUserLogic);
  });
});

describe('@AttachLogic Decorator - Timing', () => {
  it('should store timing information', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic, timing: 'before' })
      enterAmount() {}
    }

    const attached = getAttachedLogic(TestClass, 'enterAmount');

    expect(attached?.timing).toBe('before');
  });

  it('should support different timing values', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic, timing: 'after' })
      method1() {}

      @AttachLogic({ logic: ValidateAmountLogic, timing: 'validation' })
      method2() {}

      @AttachLogic({ logic: ValidateAmountLogic, timing: 'authorization' })
      method3() {}
    }

    expect(getAttachedLogic(TestClass, 'method1')?.timing).toBe('after');
    expect(getAttachedLogic(TestClass, 'method2')?.timing).toBe('validation');
    expect(getAttachedLogic(TestClass, 'method3')?.timing).toBe('authorization');
  });

  it('should work without timing', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      enterAmount() {}
    }

    const attached = getAttachedLogic(TestClass, 'enterAmount');

    expect(attached?.timing).toBeUndefined();
  });
});

describe('@AttachLogic Decorator - Description', () => {
  it('should store description', () => {
    class TestClass {
      @AttachLogic({
        logic: ValidateAmountLogic,
        description: 'Validates that amount is positive and within limits',
      })
      enterAmount() {}
    }

    const attached = getAttachedLogic(TestClass, 'enterAmount');

    expect(attached?.description).toBe('Validates that amount is positive and within limits');
  });

  it('should work without description', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      enterAmount() {}
    }

    const attached = getAttachedLogic(TestClass, 'enterAmount');

    expect(attached?.description).toBeUndefined();
  });
});

describe('@AttachLogic Decorator - Multiple Decorators', () => {
  it('should merge logic from multiple @AttachLogic decorators', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      @AttachLogic({ logic: ProcessDepositLogic })
      processDeposit() {}
    }

    const attached = getAttachedLogic(TestClass, 'processDeposit');

    expect(attached).toBeDefined();
    expect(attached?.logic).toHaveLength(2);
    expect(attached?.logic).toContain(ValidateAmountLogic);
    expect(attached?.logic).toContain(ProcessDepositLogic);
  });

  it('should preserve first timing when merging (decorators applied bottom-up)', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic, timing: 'before' })
      @AttachLogic({ logic: ProcessDepositLogic, timing: 'after' })
      processDeposit() {}
    }

    const attached = getAttachedLogic(TestClass, 'processDeposit');

    // Decorators are applied bottom-up, so 'after' from bottom decorator is set first
    expect(attached?.timing).toBe('after');
  });

  it('should preserve first description when merging (decorators applied bottom-up)', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic, description: 'First description' })
      @AttachLogic({ logic: ProcessDepositLogic, description: 'Second description' })
      processDeposit() {}
    }

    const attached = getAttachedLogic(TestClass, 'processDeposit');

    // Decorators are applied bottom-up, so 'Second description' from bottom decorator is set first
    expect(attached?.description).toBe('Second description');
  });
});

describe('@AttachLogic Decorator - Multiple Members', () => {
  it('should attach logic to multiple methods independently', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      enterAmount() {}

      @AttachLogic({ logic: ProcessDepositLogic })
      processDeposit() {}

      @AttachLogic({ logic: NotifyUserLogic })
      sendNotification() {}
    }

    expect(getAttachedLogic(TestClass, 'enterAmount')?.logic[0]).toBe(ValidateAmountLogic);
    expect(getAttachedLogic(TestClass, 'processDeposit')?.logic[0]).toBe(ProcessDepositLogic);
    expect(getAttachedLogic(TestClass, 'sendNotification')?.logic[0]).toBe(NotifyUserLogic);
  });

  it('should attach logic to both methods and fields', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      amount: number = 0;

      @AttachLogic({ logic: ProcessDepositLogic })
      processDeposit() {}
    }

    expect(getAttachedLogic(TestClass, 'amount')?.logic[0]).toBe(ValidateAmountLogic);
    expect(getAttachedLogic(TestClass, 'processDeposit')?.logic[0]).toBe(ProcessDepositLogic);
  });
});

describe('@AttachLogic Decorator - Helper Functions', () => {
  it('should check if member has attached logic', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      enterAmount() {}

      regularMethod() {}
    }

    expect(hasAttachedLogic(TestClass, 'enterAmount')).toBe(true);
    expect(hasAttachedLogic(TestClass, 'regularMethod')).toBe(false);
  });

  it('should get all attached logic for a class', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      enterAmount() {}

      @AttachLogic({ logic: ProcessDepositLogic })
      processDeposit() {}
    }

    const allAttached = getAllAttachedLogic(TestClass);

    expect(allAttached.size).toBe(2);
    expect(allAttached.has('enterAmount')).toBe(true);
    expect(allAttached.has('processDeposit')).toBe(true);
  });

  it('should get members with attached logic', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      enterAmount() {}

      @AttachLogic({ logic: ProcessDepositLogic })
      processDeposit() {}

      regularMethod() {}
    }

    const members = getMembersWithAttachedLogic(TestClass);

    expect(members).toHaveLength(2);
    expect(members).toContain('enterAmount');
    expect(members).toContain('processDeposit');
    expect(members).not.toContain('regularMethod');
  });

  it('should return undefined for non-existent member', () => {
    class TestClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      enterAmount() {}
    }

    const attached = getAttachedLogic(TestClass, 'nonExistent');

    expect(attached).toBeUndefined();
  });

  it('should return empty map for class without attached logic', () => {
    class TestClass {
      regularMethod() {}
    }

    const allAttached = getAllAttachedLogic(TestClass);

    expect(allAttached.size).toBe(0);
  });

  it('should return empty array for class without attached logic', () => {
    class TestClass {
      regularMethod() {}
    }

    const members = getMembersWithAttachedLogic(TestClass);

    expect(members).toHaveLength(0);
  });
});

describe('@AttachLogic Decorator - Complete Examples', () => {
  it('should support complete workflow with all options', () => {
    class DepositWorkflow {
      @AttachLogic({
        logic: [ValidateAmountLogic, 'CheckBalance'],
        timing: 'before',
        description: 'Validate deposit amount and check account balance',
      })
      enterAmount() {}

      @AttachLogic({
        logic: [ProcessDepositLogic, NotifyUserLogic],
        timing: 'execution',
        description: 'Process deposit and notify user',
      })
      processDeposit() {}

      @AttachLogic({
        logic: 'LogActivity',
        timing: 'after',
        description: 'Log deposit activity for audit',
      })
      logActivity() {}
    }

    const enterAmountLogic = getAttachedLogic(DepositWorkflow, 'enterAmount');
    expect(enterAmountLogic?.logic).toHaveLength(2);
    expect(enterAmountLogic?.timing).toBe('before');
    expect(enterAmountLogic?.description).toBe('Validate deposit amount and check account balance');

    const processDepositLogic = getAttachedLogic(DepositWorkflow, 'processDeposit');
    expect(processDepositLogic?.logic).toHaveLength(2);
    expect(processDepositLogic?.timing).toBe('execution');

    const logActivityLogic = getAttachedLogic(DepositWorkflow, 'logActivity');
    expect(logActivityLogic?.logic).toEqual(['LogActivity']);
    expect(logActivityLogic?.timing).toBe('after');
  });

  it('should support minimal usage', () => {
    class SimpleClass {
      @AttachLogic({ logic: ValidateAmountLogic })
      validate() {}
    }

    const attached = getAttachedLogic(SimpleClass, 'validate');

    expect(attached).toBeDefined();
    expect(attached?.logic[0]).toBe(ValidateAmountLogic);
    expect(attached?.memberName).toBe('validate');
  });
});
