/**
 * Integration test for type-safe context references
 * Tests that decorators can accept both string and BoundedContext class references
 *
 * NOTE: This test demonstrates the pattern for immediate metadata storage decorators
 * like @Domain and @ValueObject. Other decorators that use addInitializer (@Logic, @DomainEvent, etc.)
 * follow the same extraction pattern but store metadata at instance construction time.
 */

import { describe, it, expect } from 'vitest';
import { BoundedContext } from '../../src/decorators/domain/bounded-context.decorator.js';
import { Behavior } from '../../src/decorators/behavior/behavior.decorator.js';
import { Domain } from '../../src/decorators/domain/domain.decorator.js';
import { ValueObject } from '../../src/decorators/domain/value-object.decorator.js';
import { getMetadata } from '../../src/utils/metadata.utils.js';
import { METADATA_KEYS } from '../../src/constants/metadata-keys.js';
import type { BehaviorMetadata, DomainMetadata, ValueObjectMetadata } from '../../src/types/decorator-metadata.types.js';

describe('Type-Safe Context References Integration', () => {
  // Define a test BoundedContext
  @BoundedContext({ name: 'Order Management' })
  class OrderManagementContext {}

  describe('@Behavior with Context References', () => {
    // Define test class first
    @Behavior({
      test: 'SomeTest',
    })
    class TestBehavior {
      execute() {}
    }

    it('should accept context as string', () => {
      @Behavior({
        context: 'Order Management',
        test: 'SomeTest',
      })
      class ValidateBehavior {
        execute() {}
      }

      const metadata = getMetadata<BehaviorMetadata>(METADATA_KEYS.BEHAVIOR, ValidateBehavior);
      expect(metadata?.context).toBe('Order Management');
    });

    it('should accept context as BoundedContext class', () => {
      @Behavior({
        context: OrderManagementContext,
        test: 'SomeTest',
      })
      class ProcessBehavior {
        execute() {}
      }

      const metadata = getMetadata<BehaviorMetadata>(METADATA_KEYS.BEHAVIOR, ProcessBehavior);
      expect(metadata?.context).toBe('Order Management');
    });
  });

  describe('@Domain with Context References', () => {
    it('should accept context as string', () => {
      @Domain({
        context: 'Order Management',
      })
      class OrderService {}

      const metadata = getMetadata<DomainMetadata>(METADATA_KEYS.DOMAIN, OrderService);
      expect(metadata?.context).toBe('Order Management');
    });

    it('should accept context as BoundedContext class', () => {
      @Domain({
        context: OrderManagementContext,
      })
      class OrderPricingService {}

      const metadata = getMetadata<DomainMetadata>(METADATA_KEYS.DOMAIN, OrderPricingService);
      expect(metadata?.context).toBe('Order Management');
    });
  });

  describe('@ValueObject with Context References', () => {
    it('should accept context as string', () => {
      @ValueObject({
        context: 'Order Management',
      })
      class Money {
        constructor(public amount: number, public currency: string) {}
      }

      const metadata = getMetadata<ValueObjectMetadata>(METADATA_KEYS.VALUE_OBJECT, Money);
      expect(metadata?.context).toBe('Order Management');
    });

    it('should accept context as BoundedContext class', () => {
      @ValueObject({
        context: OrderManagementContext,
      })
      class Price {
        constructor(public amount: number, public currency: string) {}
      }

      const metadata = getMetadata<ValueObjectMetadata>(METADATA_KEYS.VALUE_OBJECT, Price);
      expect(metadata?.context).toBe('Order Management');
    });
  });
});
