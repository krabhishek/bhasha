/**
 * Behavioral tests for @Persona decorator
 * Tests only the public API and observable behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Persona, PersonaRegistry, PersonaType } from '../../../src/index.js';
import { METADATA_KEYS } from '../../../src/constants/metadata-keys.js';

describe('@Persona Decorator - Basic Behavior', () => {
  beforeEach(() => {
    // Clear registry before each test
    PersonaRegistry.clear?.();
  });

  it('should decorate a class as a Persona', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Tech Savvy Millennial',
    })
    class TechSavvyMillennial {}

    const metadata = (TechSavvyMillennial as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata).toBeDefined();
    expect(metadata.type).toBe(PersonaType.Human);
    expect(metadata.name).toBe('Tech Savvy Millennial');
  });

  it('should throw error if type is missing', () => {
    expect(() => {
      @Persona({} as any)
      class InvalidPersona {}
    }).toThrow(/requires a "type" field/);
  });

  it('should throw error if type is invalid', () => {
    expect(() => {
      @Persona({
        type: 'InvalidType' as any,
      })
      class InvalidPersona {}
    }).toThrow(/has invalid type/);
  });

  it('should auto-generate name from class name if not provided', () => {
    @Persona({
      type: PersonaType.Human,
    })
    class TechSavvyMillennial {}

    const metadata = (TechSavvyMillennial as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.name).toBe('TechSavvyMillennial');
  });

  it('should auto-generate ID from name', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Tech Savvy Millennial',
    })
    class TechSavvyMillennial {}

    const metadata = (TechSavvyMillennial as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.id).toBe('tech-savvy-millennial');
  });

  it('should accept custom ID', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Tech Savvy Millennial',
      id: 'custom-id',
    })
    class TechSavvyMillennial {}

    const metadata = (TechSavvyMillennial as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.id).toBe('custom-id');
  });

  it('should only be applied to classes', () => {
    expect(() => {
      class TestClass {
        @Persona({ type: PersonaType.Human } as any)
        method() {}
      }
    }).toThrow(/can only be applied to classes/);
  });
});

describe('@Persona Decorator - Persona Types', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should support Human persona type', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Customer',
    })
    class Customer {}

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.type).toBe(PersonaType.Human);
  });

  it('should support System persona type', () => {
    @Persona({
      type: PersonaType.System,
      name: 'Payment Gateway',
    })
    class PaymentGateway {}

    const metadata = (PaymentGateway as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.type).toBe(PersonaType.System);
  });

  it('should support Organization persona type', () => {
    @Persona({
      type: PersonaType.Organization,
      name: 'Bank',
    })
    class Bank {}

    const metadata = (Bank as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.type).toBe(PersonaType.Organization);
  });

  it('should support Group persona type', () => {
    @Persona({
      type: PersonaType.Group,
      name: 'Marketing Team',
    })
    class MarketingTeam {}

    const metadata = (MarketingTeam as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.type).toBe(PersonaType.Group);
  });
});

describe('@Persona Decorator - Demographics and Behaviors', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should store demographics', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Young Professional',
      demographics: {
        ageRange: '25-35',
        location: 'Urban',
        occupation: 'Software Engineer',
      },
    })
    class YoungProfessional {}

    const metadata = (YoungProfessional as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.demographics).toEqual({
      ageRange: '25-35',
      location: 'Urban',
      occupation: 'Software Engineer',
    });
  });

  it('should store behaviors', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Tech Savvy User',
      behaviors: {
        techSavviness: 'high',
        riskTolerance: 'medium',
      },
    })
    class TechSavvyUser {}

    const metadata = (TechSavvyUser as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.behaviors).toEqual({
      techSavviness: 'high',
      riskTolerance: 'medium',
    });
  });

  it('should store motivations and pain points', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Busy Parent',
      motivations: ['Save time', 'Convenience'],
      painPoints: ['Lack of time', 'Complex processes'],
    })
    class BusyParent {}

    const metadata = (BusyParent as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.motivations).toEqual(['Save time', 'Convenience']);
    expect(metadata.painPoints).toEqual(['Lack of time', 'Complex processes']);
  });

  it('should initialize empty arrays for motivations and painPoints if not provided', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Simple Persona',
    })
    class SimplePersona {}

    const metadata = (SimplePersona as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.motivations).toEqual([]);
    expect(metadata.painPoints).toEqual([]);
  });
});

describe('@Persona Decorator - Additional Properties', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should store persona quote', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Ambitious Investor',
      quote: 'I want my money to work as hard as I do',
    })
    class AmbitiousInvestor {}

    const metadata = (AmbitiousInvestor as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.quote).toBe('I want my money to work as hard as I do');
  });

  it('should store tags', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Premium Customer',
      tags: ['high-value', 'frequent-user'],
    })
    class PremiumCustomer {}

    const metadata = (PremiumCustomer as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.tags).toEqual(['high-value', 'frequent-user']);
  });

  it('should initialize empty tags array if not provided', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Simple Persona',
    })
    class SimplePersona {}

    const metadata = (SimplePersona as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.tags).toEqual([]);
  });

  it('should store characteristics', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Tech Enthusiast',
      characteristics: {
        techAdoption: 'early-adopter',
        devicePreference: 'mobile-first',
      },
    })
    class TechEnthusiast {}

    const metadata = (TechEnthusiast as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.characteristics).toEqual({
      techAdoption: 'early-adopter',
      devicePreference: 'mobile-first',
    });
  });

  it('should initialize empty characteristics object if not provided', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Simple Persona',
    })
    class SimplePersona {}

    const metadata = (SimplePersona as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.characteristics).toEqual({});
  });

  it('should store extensions', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Custom Persona',
      extensions: {
        customField: 'customValue',
      },
    })
    class CustomPersona {}

    const metadata = (CustomPersona as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.extensions).toEqual({
      customField: 'customValue',
    });
  });

  it('should initialize empty extensions object if not provided', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Simple Persona',
    })
    class SimplePersona {}

    const metadata = (SimplePersona as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.extensions).toEqual({});
  });
});

describe('@Persona Decorator - Registry Integration', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should auto-register persona in PersonaRegistry', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Test Persona',
    })
    class TestPersona {}

    const registered = PersonaRegistry.get('Test Persona');
    expect(registered).toBeDefined();
  });

  it('should be retrievable by name from registry', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Customer',
    })
    class Customer {}

    const retrieved = PersonaRegistry.get('Customer');
    expect(retrieved?.target).toBe(Customer);
  });
});

describe('@Persona Decorator - Inline Attributes', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should support inline attributes', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Customer',
      attributes: [
        { name: 'age', type: 'number', description: 'Customer age' },
        { name: 'income', type: 'number', description: 'Annual income' },
      ],
    })
    class Customer {}

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata).toBeDefined();
    expect(metadata).toHaveLength(2);
    expect(metadata[0].name).toBe('age');
    expect(metadata[1].name).toBe('income');
  });
});

describe('@Persona Decorator - ID Generation', () => {
  it('should generate kebab-case ID from camelCase name', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'TechSavvyMillennial',
    })
    class TestPersona {}

    const metadata = (TestPersona as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.id).toBe('tech-savvy-millennial');
  });

  it('should generate kebab-case ID from space-separated name', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'Tech Savvy Millennial',
    })
    class TestPersona {}

    const metadata = (TestPersona as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.id).toBe('tech-savvy-millennial');
  });

  it('should handle special characters in ID generation', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'OAuth2 Auth Service',
    })
    class TestPersona {}

    const metadata = (TestPersona as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    // The regex removes 'O' because it's followed by uppercase letters, resulting in 'o-auth2-auth-service'
    expect(metadata.id).toBe('o-auth2-auth-service');
  });

  it('should handle consecutive capitals in ID generation', () => {
    @Persona({
      type: PersonaType.Human,
      name: 'ABCDefGHI',
    })
    class TestPersona {}

    const metadata = (TestPersona as any)[Symbol.metadata]?.[METADATA_KEYS.PERSONA];
    expect(metadata.id).toBe('abc-def-ghi');
  });
});
