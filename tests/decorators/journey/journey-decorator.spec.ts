/**
 * Behavioral tests for @Journey decorator
 * Tests only the public API and observable behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Journey, JourneyRegistry, Stakeholder, StakeholderRegistry, Persona, PersonaRegistry, PersonaType } from '../../../src/index.js';
import { METADATA_KEYS } from '../../../src/constants/metadata-keys.js';

describe('@Journey Decorator - Basic Behavior', () => {
  beforeEach(() => {
    // Clear all registries before each test
    const journeyRegistry = JourneyRegistry.getInstance();
    journeyRegistry.clear?.();
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should decorate a class as a Journey', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Account Owner', context: 'Banking' })
    class AccountOwner {}

    @Journey({
      primaryStakeholder: AccountOwner,
      slug: 'test-journey',
    })
    class TestJourney {}

    const metadata = (TestJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata).toBeDefined();
    expect(metadata.slug).toBe('test-journey');
    expect(metadata.primaryStakeholder).toBe('Account Owner');
  });

  it('should auto-generate slug from name if not provided', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Account Owner', context: 'Banking' })
    class AccountOwner {}

    @Journey({
      name: 'Deposit Money Journey',
      primaryStakeholder: AccountOwner,
    })
    class DepositMoneyJourney {}

    const metadata = (DepositMoneyJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.slug).toBe('deposit-money-journey');
  });

  it('should use class name as journey name if not provided', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Account Owner', context: 'Banking' })
    class AccountOwner {}

    @Journey({
      primaryStakeholder: AccountOwner,
    })
    class MyJourney {}

    const metadata = (MyJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.name).toBe('MyJourney');
  });

  it('should throw error if primaryStakeholder is missing', () => {
    expect(() => {
      @Journey({} as any)
      class InvalidJourney {}
    }).toThrow(/primaryStakeholder is required/);
  });

  it('should accept stakeholder as string', () => {
    @Journey({
      primaryStakeholder: 'Customer',
    })
    class TestJourney {}

    const metadata = (TestJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.primaryStakeholder).toBe('Customer');
  });
});

describe('@Journey Decorator - Registry Integration', () => {
  beforeEach(() => {
    const journeyRegistry = JourneyRegistry.getInstance();
    journeyRegistry.clear?.();
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should auto-register journey in JourneyRegistry', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Account Owner', context: 'Banking' })
    class AccountOwner {}

    @Journey({
      primaryStakeholder: AccountOwner,
      slug: 'test-journey',
    })
    class TestJourney {}

    const registry = JourneyRegistry.getInstance();
    const registered = registry.getBySlug('test-journey');
    expect(registered).toBeDefined();
  });
});

describe('@Journey Decorator - Milestone References', () => {
  beforeEach(() => {
    const journeyRegistry = JourneyRegistry.getInstance();
    journeyRegistry.clear?.();
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should support declarative milestone references', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    class AuthenticationMilestone {}
    class DepositMilestone {}

    @Journey({
      primaryStakeholder: CustomerStakeholder,
      milestones: [
        { milestone: AuthenticationMilestone, order: 1 },
        { milestone: DepositMilestone, order: 2 },
      ],
    })
    class DepositJourney {}

    const metadata = (DepositJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.milestones).toHaveLength(2);
    expect(metadata.milestones[0].order).toBe(1);
    expect(metadata.milestones[1].order).toBe(2);
  });

  it('should support milestone references as strings', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    @Journey({
      primaryStakeholder: CustomerStakeholder,
      milestones: [
        { milestone: 'Authentication', order: 1 },
        { milestone: 'Deposit', order: 2 },
      ],
    })
    class DepositJourney {}

    const metadata = (DepositJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.milestones).toHaveLength(2);
  });
});

describe('@Journey Decorator - Detour Journeys', () => {
  beforeEach(() => {
    const journeyRegistry = JourneyRegistry.getInstance();
    journeyRegistry.clear?.();
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should support detour references with fractional orders', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    class AuthenticationMilestone {}
    class DepositMilestone {}
    class InsufficientFundsJourney {}

    @Journey({
      primaryStakeholder: CustomerStakeholder,
      milestones: [
        { milestone: AuthenticationMilestone, order: 1 },
        { milestone: DepositMilestone, order: 2 },
      ],
      detours: [
        {
          journey: InsufficientFundsJourney,
          order: 1.5,
          triggeredAfter: AuthenticationMilestone,
          rejoinsAt: 2,
        },
      ],
    })
    class DepositJourney {}

    const metadata = (DepositJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.detours).toHaveLength(1);
    expect(metadata.detours[0].order).toBe(1.5);
  });

  it('should throw error for detour with integer order', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    class AuthenticationMilestone {}
    class InsufficientFundsJourney {}

    expect(() => {
      @Journey({
        primaryStakeholder: CustomerStakeholder,
        milestones: [{ milestone: AuthenticationMilestone, order: 1 }],
        detours: [
          {
            journey: InsufficientFundsJourney,
            order: 2, // Integer order - should fail
            triggeredAfter: AuthenticationMilestone,
          },
        ],
      })
      class DepositJourney {}
    }).toThrow(/must use fractional orders/);
  });

  it('should throw error for duplicate detour orders', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    class AuthenticationMilestone {}
    class Detour1Journey {}
    class Detour2Journey {}

    expect(() => {
      @Journey({
        primaryStakeholder: CustomerStakeholder,
        milestones: [{ milestone: AuthenticationMilestone, order: 1 }],
        detours: [
          {
            journey: Detour1Journey,
            order: 1.5,
            triggeredAfter: AuthenticationMilestone,
          },
          {
            journey: Detour2Journey,
            order: 1.5, // Duplicate order
            triggeredAfter: AuthenticationMilestone,
          },
        ],
      })
      class DepositJourney {}
    }).toThrow(/Duplicate detour order/);
  });

  it('should mark journey as detour when isDetour is true', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    @Journey({
      primaryStakeholder: CustomerStakeholder,
      isDetour: true,
    })
    class DetourJourney {}

    const metadata = (DetourJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.isDetour).toBe(true);
  });
});

describe('@Journey Decorator - Additional Properties', () => {
  beforeEach(() => {
    const journeyRegistry = JourneyRegistry.getInstance();
    journeyRegistry.clear?.();
    PersonaRegistry.clear?.();
    StakeholderRegistry.clear?.();
  });

  it('should store participating stakeholders', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    @Stakeholder({ persona: CustomerPersona, role: 'System', context: 'Banking' })
    class SystemStakeholder {}

    @Journey({
      primaryStakeholder: CustomerStakeholder,
      participatingStakeholders: [CustomerStakeholder, SystemStakeholder],
    })
    class TestJourney {}

    const metadata = (TestJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.participatingStakeholders).toHaveLength(2);
  });

  it('should store outcomes, tags, and description', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    @Journey({
      primaryStakeholder: CustomerStakeholder,
      outcomes: ['Money deposited', 'Balance updated'],
      tags: ['banking', 'core-feature'],
      description: 'Customer deposits money into account',
    })
    class DepositJourney {}

    const metadata = (DepositJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.outcomes).toEqual(['Money deposited', 'Balance updated']);
    expect(metadata.tags).toEqual(['banking', 'core-feature']);
    expect(metadata.description).toBe('Customer deposits money into account');
  });

  it('should store triggering event', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    @Journey({
      primaryStakeholder: CustomerStakeholder,
      triggeringEvent: 'deposit.initiated',
    })
    class DepositJourney {}

    const metadata = (DepositJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.triggeringEvent).toBe('deposit.initiated');
  });

  it('should store alternative flows', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    @Journey({
      primaryStakeholder: CustomerStakeholder,
      alternativeFlows: ['Insufficient funds', 'Invalid amount'],
    })
    class DepositJourney {}

    const metadata = (DepositJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.alternativeFlows).toEqual(['Insufficient funds', 'Invalid amount']);
  });
});

describe('@Journey Decorator - Slug Generation', () => {
  it('should generate kebab-case slug from name', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    @Journey({
      name: 'Deposit Money Into Account',
      primaryStakeholder: CustomerStakeholder,
    })
    class TestJourney {}

    const metadata = (TestJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.slug).toBe('deposit-money-into-account');
  });

  it('should remove special characters from slug', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    @Journey({
      name: 'Place Order! (New Feature)',
      primaryStakeholder: CustomerStakeholder,
    })
    class TestJourney {}

    const metadata = (TestJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.slug).toBe('place-order-new-feature');
  });

  it('should handle multiple spaces in slug generation', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class CustomerPersona {}

    @Stakeholder({ persona: CustomerPersona, role: 'Customer', context: 'Banking' })
    class CustomerStakeholder {}

    @Journey({
      name: 'Place    Order    Flow',
      primaryStakeholder: CustomerStakeholder,
    })
    class TestJourney {}

    const metadata = (TestJourney as any)[Symbol.metadata]?.[METADATA_KEYS.JOURNEY];
    expect(metadata.slug).toBe('place-order-flow');
  });
});
