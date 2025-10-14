/**
 * Behavioral tests for @Behavior decorator
 * Tests only the public API and observable behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Behavior, BehaviorRegistry, LogicRegistry } from '../../../src/index.js';
import { METADATA_KEYS } from '../../../src/constants/metadata-keys.js';

describe('@Behavior Decorator - Basic Behavior', () => {
  beforeEach(() => {
    const behaviorRegistry = BehaviorRegistry.getInstance();
    behaviorRegistry.clear?.();
    const logicRegistry = LogicRegistry.getInstance();
    logicRegistry.clear?.();
  });

  it('should decorate a class as a Behavior', () => {
    class ValidateAmountTest {}

    @Behavior({
      name: 'Validate Amount',
      description: 'Validates deposit amount is positive',
      test: ValidateAmountTest,
    })
    class ValidateAmountBehavior {}

    const metadata = (ValidateAmountBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata).toBeDefined();
    expect(metadata.name).toBe('Validate Amount');
    expect(metadata.description).toBe('Validates deposit amount is positive');
  });

  it('should use class name if name not provided', () => {
    class ValidateAmountTest {}

    @Behavior({
      test: ValidateAmountTest,
    })
    class ValidateAmountBehavior {}

    const metadata = (ValidateAmountBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.name).toBe('ValidateAmountBehavior');
  });

  it('should throw error if no test is provided', () => {
    expect(() => {
      @Behavior({} as any)
      class InvalidBehavior {}
    }).toThrow(/At least one test/);
  });

  it('should support method decorator', () => {
    class ValidateAmountTest {}

    // Just verify the decorator doesn't throw an error
    expect(() => {
      class ValidateAmountExpectation {
        @Behavior({
          test: ValidateAmountTest,
        })
        validateFormat() {}
      }
      // Create an instance to trigger the decorator
      new ValidateAmountExpectation();
    }).not.toThrow();
  });

  it('should throw error if applied to non-class/non-method', () => {
    class ValidateAmountTest {}

    expect(() => {
      class TestClass {
        @Behavior({ test: ValidateAmountTest } as any)
        accessor field = 'test';
      }
    }).toThrow(/can only be applied to classes or methods/);
  });
});

describe('@Behavior Decorator - Execution Mode', () => {
  beforeEach(() => {
    const behaviorRegistry = BehaviorRegistry.getInstance();
    behaviorRegistry.clear?.();
    const logicRegistry = LogicRegistry.getInstance();
    logicRegistry.clear?.();
  });

  it('should default to immediate execution mode', () => {
    class ValidateAmountTest {}

    @Behavior({
      test: ValidateAmountTest,
    })
    class ValidateAmountBehavior {}

    const metadata = (ValidateAmountBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.executionMode).toBe('immediate');
  });

  it('should support async execution mode', () => {
    class ProcessPaymentTest {}

    @Behavior({
      executionMode: 'async',
      test: ProcessPaymentTest,
    })
    class ProcessPaymentBehavior {}

    const metadata = (ProcessPaymentBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.executionMode).toBe('async');
  });

  it('should support deferred execution mode', () => {
    class SendEmailTest {}

    @Behavior({
      executionMode: 'deferred',
      test: SendEmailTest,
    })
    class SendEmailBehavior {}

    const metadata = (SendEmailBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.executionMode).toBe('deferred');
  });
});

describe('@Behavior Decorator - Behavior Contract', () => {
  beforeEach(() => {
    const behaviorRegistry = BehaviorRegistry.getInstance();
    behaviorRegistry.clear?.();
    const logicRegistry = LogicRegistry.getInstance();
    logicRegistry.clear?.();
  });

  it('should store behavior contract', () => {
    class ProcessDepositTest {}

    @Behavior({
      behaviorContract: {
        type: 'sync',
        inputs: { amount: 'number', accountId: 'string' },
        outputs: { transactionId: 'string', newBalance: 'number' },
      },
      test: ProcessDepositTest,
    })
    class ProcessDepositBehavior {}

    const metadata = (ProcessDepositBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.behaviorContract).toEqual({
      type: 'sync',
      inputs: { amount: 'number', accountId: 'string' },
      outputs: { transactionId: 'string', newBalance: 'number' },
    });
  });

  it('should support async behavior contract', () => {
    class SendNotificationTest {}

    @Behavior({
      behaviorContract: {
        type: 'async',
        inputs: { userId: 'string', message: 'string' },
        outputs: { messageId: 'string' },
      },
      test: SendNotificationTest,
    })
    class SendNotificationBehavior {}

    const metadata = (SendNotificationBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.behaviorContract?.type).toBe('async');
  });

  it('should support SLA in behavior contract', () => {
    class ProcessPaymentTest {}

    @Behavior({
      behaviorContract: {
        type: 'sync',
        sla: {
          maxResponseTime: '500ms',
          availability: '99.9%',
        },
      },
      test: ProcessPaymentTest,
    })
    class ProcessPaymentBehavior {}

    const metadata = (ProcessPaymentBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.behaviorContract?.sla).toEqual({
      maxResponseTime: '500ms',
      availability: '99.9%',
    });
  });
});

describe('@Behavior Decorator - Error Handling', () => {
  beforeEach(() => {
    const behaviorRegistry = BehaviorRegistry.getInstance();
    behaviorRegistry.clear?.();
    const logicRegistry = LogicRegistry.getInstance();
    logicRegistry.clear?.();
  });

  it('should store retry error handling strategy', () => {
    class ProcessPaymentTest {}

    @Behavior({
      errorHandling: {
        strategy: 'retry',
        retryConfig: {
          maxAttempts: 3,
          backoff: 'exponential',
          delay: '1s',
        },
      },
      test: ProcessPaymentTest,
    })
    class ProcessPaymentBehavior {}

    const metadata = (ProcessPaymentBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.errorHandling?.strategy).toBe('retry');
    expect(metadata.errorHandling?.retryConfig?.maxAttempts).toBe(3);
    expect(metadata.errorHandling?.retryConfig?.backoff).toBe('exponential');
  });

  it('should store fallback error handling strategy', () => {
    class ProcessPaymentTest {}

    @Behavior({
      errorHandling: {
        strategy: 'fallback',
        fallbackBehavior: 'ProcessPaymentOffline',
      },
      test: ProcessPaymentTest,
    })
    class ProcessPaymentBehavior {}

    const metadata = (ProcessPaymentBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.errorHandling?.strategy).toBe('fallback');
    expect(metadata.errorHandling?.fallbackBehavior).toBe('ProcessPaymentOffline');
  });

  it('should store fail-fast error handling strategy', () => {
    class ValidateInputTest {}

    @Behavior({
      errorHandling: {
        strategy: 'fail-fast',
      },
      test: ValidateInputTest,
    })
    class ValidateInputBehavior {}

    const metadata = (ValidateInputBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.errorHandling?.strategy).toBe('fail-fast');
  });

  it('should store circuit-breaker error handling strategy', () => {
    class CallExternalAPITest {}

    @Behavior({
      errorHandling: {
        strategy: 'circuit-breaker',
      },
      test: CallExternalAPITest,
    })
    class CallExternalAPIBehavior {}

    const metadata = (CallExternalAPIBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.errorHandling?.strategy).toBe('circuit-breaker');
  });
});

describe('@Behavior Decorator - Performance Constraints', () => {
  beforeEach(() => {
    const behaviorRegistry = BehaviorRegistry.getInstance();
    behaviorRegistry.clear?.();
    const logicRegistry = LogicRegistry.getInstance();
    logicRegistry.clear?.();
  });

  it('should store performance constraints', () => {
    class ProcessPaymentTest {}

    @Behavior({
      performance: {
        timeout: '5s',
        maxLatency: '500ms',
        caching: true,
      },
      test: ProcessPaymentTest,
    })
    class ProcessPaymentBehavior {}

    const metadata = (ProcessPaymentBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.performance).toEqual({
      timeout: '5s',
      maxLatency: '500ms',
      caching: true,
    });
  });

  it('should support timeout only', () => {
    class QueryDatabaseTest {}

    @Behavior({
      performance: {
        timeout: '10s',
      },
      test: QueryDatabaseTest,
    })
    class QueryDatabaseBehavior {}

    const metadata = (QueryDatabaseBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.performance?.timeout).toBe('10s');
  });

  it('should support caching flag', () => {
    class FetchUserDataTest {}

    @Behavior({
      performance: {
        caching: true,
      },
      test: FetchUserDataTest,
    })
    class FetchUserDataBehavior {}

    const metadata = (FetchUserDataBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.performance?.caching).toBe(true);
  });
});

describe('@Behavior Decorator - Tests', () => {
  beforeEach(() => {
    const behaviorRegistry = BehaviorRegistry.getInstance();
    behaviorRegistry.clear?.();
    const logicRegistry = LogicRegistry.getInstance();
    logicRegistry.clear?.();
  });

  it('should accept single test (singular form)', () => {
    class ValidateAmountTest {}

    @Behavior({
      test: ValidateAmountTest,
    })
    class ValidateAmountBehavior {}

    const metadata = (ValidateAmountBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.tests).toHaveLength(1);
    expect(metadata.tests[0]).toBe('ValidateAmountTest');
  });

  it('should accept multiple tests (plural form)', () => {
    class ValidateFormatTest {}
    class ValidatePositiveTest {}

    @Behavior({
      tests: [ValidateFormatTest, ValidatePositiveTest],
    })
    class ValidateAmountBehavior {}

    const metadata = (ValidateAmountBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.tests).toHaveLength(2);
    expect(metadata.tests[0]).toBe('ValidateFormatTest');
    expect(metadata.tests[1]).toBe('ValidatePositiveTest');
  });

  it('should accept test names as strings', () => {
    @Behavior({
      tests: ['ValidateFormatTest', 'ValidatePositiveTest'],
    })
    class ValidateAmountBehavior {}

    const metadata = (ValidateAmountBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.tests).toHaveLength(2);
    expect(metadata.tests[0]).toBe('ValidateFormatTest');
    expect(metadata.tests[1]).toBe('ValidatePositiveTest');
  });

  it('should merge singular and plural test references', () => {
    class ValidateFormatTest {}

    @Behavior({
      test: ValidateFormatTest,
      tests: ['ValidatePositiveTest', 'ValidateRangeTest'],
    })
    class ValidateAmountBehavior {}

    const metadata = (ValidateAmountBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.tests).toHaveLength(3);
  });
});

describe('@Behavior Decorator - Additional Properties', () => {
  beforeEach(() => {
    const behaviorRegistry = BehaviorRegistry.getInstance();
    behaviorRegistry.clear?.();
    const logicRegistry = LogicRegistry.getInstance();
    logicRegistry.clear?.();
  });

  it('should store context', () => {
    class ProcessPaymentTest {}

    @Behavior({
      context: 'Payment Processing',
      test: ProcessPaymentTest,
    })
    class ProcessPaymentBehavior {}

    const metadata = (ProcessPaymentBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.context).toBe('Payment Processing');
  });

  it('should store invokes property', () => {
    class ProcessPaymentTest {}

    @Behavior({
      invokes: 'PaymentGatewayService',
      test: ProcessPaymentTest,
    })
    class ProcessPaymentBehavior {}

    const metadata = (ProcessPaymentBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.invokes).toBe('PaymentGatewayService');
  });

  it('should store tags', () => {
    class ProcessPaymentTest {}

    @Behavior({
      tags: ['payment', 'critical', 'transactional'],
      test: ProcessPaymentTest,
    })
    class ProcessPaymentBehavior {}

    const metadata = (ProcessPaymentBehavior as any)[Symbol.metadata]?.[METADATA_KEYS.BEHAVIOR];
    expect(metadata.tags).toEqual(['payment', 'critical', 'transactional']);
  });
});

describe('@Behavior Decorator - Registry Integration', () => {
  beforeEach(() => {
    const behaviorRegistry = BehaviorRegistry.getInstance();
    behaviorRegistry.clear?.();
    const logicRegistry = LogicRegistry.getInstance();
    logicRegistry.clear?.();
  });

  it('should auto-register behavior in BehaviorRegistry', () => {
    class ValidateAmountTest {}

    @Behavior({
      name: 'Validate Amount',
      test: ValidateAmountTest,
    })
    class ValidateAmountBehavior {}

    const registry = BehaviorRegistry.getInstance();
    const registered = registry.getByName('Validate Amount');
    expect(registered).toBeDefined();
  });
});
