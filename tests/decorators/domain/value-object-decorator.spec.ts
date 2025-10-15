/**
 * Behavioral tests for @ValueObject decorator
 * Tests only the public API and observable behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ValueObject,
  isValueObject,
  getValueObjectMetadata,
} from '../../../src/index.js';

describe('@ValueObject Decorator - Basic Registration', () => {
  it('should mark class as value object', () => {
    @ValueObject()
    class Money {}

    expect(isValueObject(Money)).toBe(true);
  });

  it('should store metadata', () => {
    @ValueObject({
      name: 'Email',
      description: 'Email address value object',
    })
    class Email {}

    const metadata = getValueObjectMetadata(Email);
    expect(metadata).toBeDefined();
    expect(metadata?.name).toBe('Email');
    expect(metadata?.description).toBe('Email address value object');
  });

  it('should auto-generate name from class name', () => {
    @ValueObject()
    class Address {}

    const metadata = getValueObjectMetadata(Address);
    expect(metadata?.name).toBe('Address');
  });

  it('should detect non-value-objects', () => {
    class RegularClass {}

    expect(isValueObject(RegularClass)).toBe(false);
  });
});

describe('@ValueObject Decorator - Immutability', () => {
  it('should force immutability to true', () => {
    @ValueObject()
    class Money {}

    const metadata = getValueObjectMetadata(Money);
    expect(metadata?.immutable).toBe(true);
  });

  it('should warn and force immutability even if set to false', () => {
    @ValueObject({
      immutable: false,
    })
    class NotImmutable {}

    const metadata = getValueObjectMetadata(NotImmutable);
    expect(metadata?.immutable).toBe(true);
  });
});

describe('@ValueObject Decorator - Equality', () => {
  it('should default equality to structural', () => {
    @ValueObject()
    class Money {}

    const metadata = getValueObjectMetadata(Money);
    expect(metadata?.equality).toBe('structural');
  });

  it('should allow setting equality to reference', () => {
    @ValueObject({
      equality: 'reference',
    })
    class CustomEquality {}

    const metadata = getValueObjectMetadata(CustomEquality);
    expect(metadata?.equality).toBe('reference');
  });

  it('should respect structural equality setting', () => {
    @ValueObject({
      equality: 'structural',
    })
    class StructuralVO {}

    const metadata = getValueObjectMetadata(StructuralVO);
    expect(metadata?.equality).toBe('structural');
  });
});

describe('@ValueObject Decorator - ID Generation', () => {
  it('should auto-generate ID without context', () => {
    @ValueObject()
    class Money {}

    const metadata = getValueObjectMetadata(Money);
    expect(metadata?.id).toBe('vo:money');
  });

  it('should auto-generate ID with context', () => {
    @ValueObject({
      context: 'E-commerce',
    })
    class Money {}

    const metadata = getValueObjectMetadata(Money);
    expect(metadata?.id).toBe('e-commerce:vo:money');
  });

  it('should use provided ID', () => {
    @ValueObject({
      id: 'custom:vo:id',
    })
    class CustomId {}

    const metadata = getValueObjectMetadata(CustomId);
    expect(metadata?.id).toBe('custom:vo:id');
  });
});

describe('@ValueObject Decorator - Context', () => {
  it('should store bounded context', () => {
    @ValueObject({
      context: 'Payment Processing',
    })
    class Money {}

    const metadata = getValueObjectMetadata(Money);
    expect(metadata?.context).toBe('Payment Processing');
  });
});

describe('@ValueObject Decorator - Metadata Storage', () => {
  it('should store description and tags', () => {
    @ValueObject({
      description: 'Monetary value with currency',
      tags: ['financial', 'immutable'],
    })
    class Money {}

    const metadata = getValueObjectMetadata(Money);
    expect(metadata?.description).toBe('Monetary value with currency');
    expect(metadata?.tags).toEqual(['financial', 'immutable']);
  });

  it('should store all metadata together', () => {
    @ValueObject({
      name: 'CompleteVO',
      id: 'custom:vo:complete',
      context: 'Domain',
      description: 'A complete value object',
      equality: 'structural',
      immutable: true,
      tags: ['test', 'complete'],
    })
    class CompleteVO {}

    const metadata = getValueObjectMetadata(CompleteVO);
    expect(metadata?.name).toBe('CompleteVO');
    expect(metadata?.id).toBe('custom:vo:complete');
    expect(metadata?.context).toBe('Domain');
    expect(metadata?.description).toBe('A complete value object');
    expect(metadata?.equality).toBe('structural');
    expect(metadata?.immutable).toBe(true);
    expect(metadata?.tags).toEqual(['test', 'complete']);
  });
});

describe('@ValueObject Decorator - Inline Attributes', () => {
  it('should store inline attributes', () => {
    @ValueObject({
      attributes: [
        { name: 'amount', type: 'number', required: true },
        { name: 'currency', type: 'string', required: true },
      ],
    })
    class Money {}

    const metadata = getValueObjectMetadata(Money);
    expect(metadata?.attributes).toHaveLength(2);
    expect(metadata?.attributes?.[0].name).toBe('amount');
    expect(metadata?.attributes?.[1].name).toBe('currency');
  });
});

describe('@ValueObject Decorator - Validation', () => {
  it('should only apply to classes', () => {
    expect(() => {
      // This should fail at decorator application time
      const decorator = ValueObject();
      // @ts-expect-error - Testing invalid usage
      decorator(
        function testMethod() {},
        { kind: 'method', name: 'testMethod' } as any
      );
    }).toThrow(/can only be applied to classes/);
  });
});

describe('@ValueObject Decorator - Type Guards', () => {
  it('should correctly identify value objects', () => {
    @ValueObject()
    class ValidVO {}

    class NotVO {}

    expect(isValueObject(ValidVO)).toBe(true);
    expect(isValueObject(NotVO)).toBe(false);
  });

  it('should return undefined metadata for non-value-objects', () => {
    class NotVO {}

    expect(getValueObjectMetadata(NotVO)).toBeUndefined();
  });
});
