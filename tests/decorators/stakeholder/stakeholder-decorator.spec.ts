/**
 * Behavioral tests for @Stakeholder decorator
 * Tests only the public API and observable behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Stakeholder, StakeholderRegistry, Persona, PersonaRegistry, PersonaType } from '../../../src/index.js';
import { METADATA_KEYS } from '../../../src/constants/metadata-keys.js';

describe('@Stakeholder Decorator - Basic Behavior', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should decorate a class as a Stakeholder', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata).toBeDefined();
    expect(metadata.role).toBe('Account Owner');
    expect(metadata.context).toBe('Banking');
  });

  it('should throw error if persona is missing', () => {
    expect(() => {
      @Stakeholder({
        role: 'Account Owner',
        context: 'Banking',
      } as any)
      class InvalidStakeholder {}
    }).toThrow(/requires a "persona" field/);
  });

  it('should throw error if role is missing', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    expect(() => {
      @Stakeholder({
        persona: CustomerPersona,
        context: 'Banking',
      } as any)
      class InvalidStakeholder {}
    }).toThrow(/requires a "role" field/);
  });

  it('should throw error if context is missing', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    expect(() => {
      @Stakeholder({
        persona: CustomerPersona,
        role: 'Account Owner',
      } as any)
      class InvalidStakeholder {}
    }).toThrow(/requires a "context" field/);
  });

  it('should auto-generate name from role if not provided', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.name).toBe('Account Owner');
  });

  it('should auto-generate ID from context and role', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.id).toBe('banking:account-owner');
  });

  it('should accept custom ID', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
      id: 'custom-id',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.id).toBe('custom-id');
  });

  it('should accept persona as string', () => {
    @Stakeholder({
      persona: 'Customer',
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.persona).toBe('Customer');
  });

  it('should only be applied to classes', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    expect(() => {
      class TestClass {
        @Stakeholder({ persona: CustomerPersona, role: 'Test', context: 'Test' } as any)
        method() {}
      }
    }).toThrow(/can only be applied to classes/);
  });
});

describe('@Stakeholder Decorator - Goals and Responsibilities', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should store goals', () => {
    @Persona({ type: PersonaType.Human, name: 'Investor' })
    class InvestorPersona {}

    @Stakeholder({
      persona: InvestorPersona,
      role: 'Portfolio Manager',
      context: 'Investment',
      goals: ['Maximize returns', 'Minimize risk', 'Diversify portfolio'],
    })
    class PortfolioManagerStakeholder {}

    const metadata = (PortfolioManagerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.goals).toEqual(['Maximize returns', 'Minimize risk', 'Diversify portfolio']);
  });

  it('should initialize empty goals array if not provided', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.goals).toEqual([]);
  });

  it('should store responsibilities', () => {
    @Persona({ type: PersonaType.Human, name: 'Admin' })
    class AdminPersona {}

    @Stakeholder({
      persona: AdminPersona,
      role: 'System Administrator',
      context: 'IT Operations',
      responsibilities: ['Manage user accounts', 'Monitor system health', 'Deploy updates'],
    })
    class SystemAdminStakeholder {}

    const metadata = (SystemAdminStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.responsibilities).toEqual(['Manage user accounts', 'Monitor system health', 'Deploy updates']);
  });

  it('should initialize empty responsibilities array if not provided', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.responsibilities).toEqual([]);
  });
});

describe('@Stakeholder Decorator - Permissions and Relationships', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should store permissions', () => {
    @Persona({ type: PersonaType.Human, name: 'Manager' })
    class ManagerPersona {}

    @Stakeholder({
      persona: ManagerPersona,
      role: 'Branch Manager',
      context: 'Banking',
      permissions: ['approve_transactions', 'manage_staff', 'view_reports'],
    })
    class BranchManagerStakeholder {}

    const metadata = (BranchManagerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.permissions).toEqual(['approve_transactions', 'manage_staff', 'view_reports']);
  });

  it('should initialize empty permissions array if not provided', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.permissions).toEqual([]);
  });

  it('should store relationships', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
      relationships: {
        reportsTo: 'Branch Manager',
        collaboratesWith: ['Teller', 'Customer Service'],
      },
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.relationships).toEqual({
      reportsTo: 'Branch Manager',
      collaboratesWith: ['Teller', 'Customer Service'],
    });
  });

  it('should initialize empty relationships object if not provided', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.relationships).toEqual({});
  });
});

describe('@Stakeholder Decorator - Context Attributes and Extensions', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should store context attributes', () => {
    @Persona({ type: PersonaType.Human, name: 'Investor' })
    class InvestorPersona {}

    @Stakeholder({
      persona: InvestorPersona,
      role: 'High Net Worth Investor',
      context: 'Investment',
      contextAttributes: {
        riskProfile: 'aggressive',
        investmentLimit: 1000000,
        preferredAssets: ['stocks', 'bonds'],
      },
    })
    class HighNetWorthInvestorStakeholder {}

    const metadata = (HighNetWorthInvestorStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.contextAttributes).toEqual({
      riskProfile: 'aggressive',
      investmentLimit: 1000000,
      preferredAssets: ['stocks', 'bonds'],
    });
  });

  it('should initialize empty contextAttributes object if not provided', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.contextAttributes).toEqual({});
  });

  it('should store tags', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Premium Customer',
      context: 'Banking',
      tags: ['high-value', 'frequent-user', 'loyal'],
    })
    class PremiumCustomerStakeholder {}

    const metadata = (PremiumCustomerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.tags).toEqual(['high-value', 'frequent-user', 'loyal']);
  });

  it('should initialize empty tags array if not provided', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.tags).toEqual([]);
  });

  it('should store extensions', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
      extensions: {
        customField: 'customValue',
        metadata: { foo: 'bar' },
      },
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.extensions).toEqual({
      customField: 'customValue',
      metadata: { foo: 'bar' },
    });
  });

  it('should initialize empty extensions object if not provided', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.extensions).toEqual({});
  });
});

describe('@Stakeholder Decorator - Registry Integration', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should auto-register stakeholder in StakeholderRegistry', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const registered = StakeholderRegistry.get('banking:account-owner');
    expect(registered).toBeDefined();
  });

  it('should be retrievable by ID from registry', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
    })
    class AccountOwnerStakeholder {}

    const retrieved = StakeholderRegistry.get('banking:account-owner');
    expect(retrieved?.target).toBe(AccountOwnerStakeholder);
  });
});

describe('@Stakeholder Decorator - ID Generation', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should generate kebab-case ID from context and role', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Online Banking',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.id).toBe('online-banking:account-owner');
  });

  it('should handle camelCase in ID generation', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'PremiumAccountOwner',
      context: 'OnlineBanking',
    })
    class PremiumAccountOwnerStakeholder {}

    const metadata = (PremiumAccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.id).toBe('online-banking:premium-account-owner');
  });

  it('should remove special characters from ID', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner (Premium)',
      context: 'Banking Investment',
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.STAKEHOLDER];
    expect(metadata.id).toBe('banking-investment:account-owner-premium');
  });
});

describe('@Stakeholder Decorator - Inline Attributes', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should support inline attributes', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({
      persona: CustomerPersona,
      role: 'Account Owner',
      context: 'Banking',
      attributes: [
        { name: 'accountBalance', type: 'number', description: 'Current account balance' },
        { name: 'creditScore', type: 'number', description: 'Credit score' },
      ],
    })
    class AccountOwnerStakeholder {}

    const metadata = (AccountOwnerStakeholder as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata).toBeDefined();
    expect(metadata).toHaveLength(2);
    expect(metadata[0].name).toBe('accountBalance');
    expect(metadata[1].name).toBe('creditScore');
  });
});
