/**
 * Behavioral tests for @Milestone decorator
 * Tests only the public API and observable behavior (registry-based tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Milestone,
  Stakeholder,
  Persona,
} from '../../../src/index.js';
import { MilestoneRegistry } from '../../../src/decorators/milestone/milestone.registry.js';
import {
  StakeholderRegistry,
  PersonaRegistry,
} from '../../../src/decorators/stakeholder/registries.js';

describe('@Milestone Decorator - Basic Registration', () => {
  beforeEach(() => {
    const milestoneRegistry = MilestoneRegistry.getInstance();
    milestoneRegistry.clear();
    StakeholderRegistry.clear();
    PersonaRegistry.clear();
  });

  it('should register milestone with class decorator', () => {
    @Persona({ name: 'Account Owner', type: 'human' })
    class AccountOwner {}

    @Stakeholder({
      persona: AccountOwner,
      context: 'Banking',
      role: 'Customer',
    })
    class BankCustomer {}

    new AccountOwner();
    new BankCustomer();

    @Milestone({
      stakeholder: BankCustomer,
      name: 'User Authenticated',
    })
    class UserAuthenticatedMilestone {}

    new UserAuthenticatedMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('User Authenticated');
    expect(milestone).toBeDefined();
    expect(milestone?.metadata.name).toBe('User Authenticated');
  });

  it('should auto-generate name from class name if not provided', () => {
    @Persona({ name: 'Customer', type: 'human' })
    class Customer {}

    @Stakeholder({
      persona: Customer,
      context: 'Banking',
      role: 'Customer',
    })
    class BankCustomer {}

    new Customer();
    new BankCustomer();

    @Milestone({
      stakeholder: BankCustomer,
    })
    class PaymentAuthorized {}

    new PaymentAuthorized();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('PaymentAuthorized');
    expect(milestone).toBeDefined();
  });

  it('should store stakeholder information', () => {
    @Persona({ name: 'System User', type: 'system' })
    class SystemUser {}

    @Stakeholder({
      persona: SystemUser,
      context: 'System',
      role: 'Processor',
    })
    class SystemProcessor {}

    new SystemUser();
    new SystemProcessor();

    @Milestone({
      stakeholder: SystemProcessor,
      name: 'Data Validated',
    })
    class DataValidatedMilestone {}

    new DataValidatedMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Data Validated');
    expect(milestone?.metadata.stakeholder).toBe('Processor');
  });

  it('should require stakeholder field', () => {
    expect(() => {
      // @ts-expect-error - Testing missing required field
      @Milestone({
        name: 'Invalid Milestone',
      })
      class InvalidMilestone {}

      new InvalidMilestone();
    }).toThrow(/stakeholder is required/);
  });

  it('should support string-based stakeholder references', () => {
    @Milestone({
      stakeholder: 'Account Owner',
      name: 'Account Created',
    })
    class AccountCreatedMilestone {}

    new AccountCreatedMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Account Created');
    expect(milestone).toBeDefined();
    expect(milestone?.metadata.stakeholder).toBe('Account Owner');
  });
});

describe('@Milestone Decorator - Order and Prerequisites', () => {
  beforeEach(() => {
    const milestoneRegistry = MilestoneRegistry.getInstance();
    milestoneRegistry.clear();
  });

  it('should store order when provided', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Step One',
      order: 1,
    })
    class StepOne {}

    new StepOne();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Step One');
    expect(milestone?.metadata.order).toBe(1);
  });

  it('should handle undefined order for standalone milestones', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Reusable Milestone',
    })
    class ReusableMilestone {}

    new ReusableMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Reusable Milestone');
    expect(milestone?.metadata.order).toBeUndefined();
  });

  it('should store prerequisites', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Dependent Milestone',
      prerequisites: ['First Milestone', 'Second Milestone'],
    })
    class DependentMilestone {}

    new DependentMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Dependent Milestone');
    expect(milestone?.metadata.prerequisites).toEqual([
      'First Milestone',
      'Second Milestone',
    ]);
  });

  it('should sort milestones by order in journey', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Third',
      order: 3,
      journey: 'test-journey',
    })
    class ThirdMilestone {}

    @Milestone({
      stakeholder: 'System',
      name: 'First',
      order: 1,
      journey: 'test-journey',
    })
    class FirstMilestone {}

    @Milestone({
      stakeholder: 'System',
      name: 'Second',
      order: 2,
      journey: 'test-journey',
    })
    class SecondMilestone {}

    new ThirdMilestone();
    new FirstMilestone();
    new SecondMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestones = registry.getByJourney('test-journey');
    expect(milestones).toHaveLength(3);
    expect(milestones[0].metadata.name).toBe('First');
    expect(milestones[1].metadata.name).toBe('Second');
    expect(milestones[2].metadata.name).toBe('Third');
  });
});

describe('@Milestone Decorator - Business Events', () => {
  beforeEach(() => {
    const milestoneRegistry = MilestoneRegistry.getInstance();
    milestoneRegistry.clear();
  });

  it('should store business event as string', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Payment Completed',
      businessEvent: 'payment.completed',
    })
    class PaymentCompletedMilestone {}

    new PaymentCompletedMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Payment Completed');
    expect(milestone?.metadata.businessEvent).toBe('payment.completed');
  });

  it('should handle undefined business event', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'No Event Milestone',
    })
    class NoEventMilestone {}

    new NoEventMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('No Event Milestone');
    expect(milestone?.metadata.businessEvent).toBeUndefined();
  });
});

describe('@Milestone Decorator - Stateful and Reusable Flags', () => {
  beforeEach(() => {
    const milestoneRegistry = MilestoneRegistry.getInstance();
    milestoneRegistry.clear();
  });

  it('should default stateful to true', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Default Stateful',
    })
    class DefaultStateful {}

    new DefaultStateful();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Default Stateful');
    expect(milestone?.metadata.stateful).toBe(true);
  });

  it('should allow setting stateful to false', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Stateless Milestone',
      stateful: false,
    })
    class StatelessMilestone {}

    new StatelessMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Stateless Milestone');
    expect(milestone?.metadata.stateful).toBe(false);
  });

  it('should default reusable to true for class decorators', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Reusable by Default',
    })
    class ReusableByDefault {}

    new ReusableByDefault();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Reusable by Default');
    expect(milestone?.metadata.reusable).toBe(true);
  });

  it('should allow explicit reusable setting', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Not Reusable',
      reusable: false,
    })
    class NotReusable {}

    new NotReusable();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Not Reusable');
    expect(milestone?.metadata.reusable).toBe(false);
  });

  it('should return all reusable milestones', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Reusable One',
      reusable: true,
    })
    class ReusableOne {}

    @Milestone({
      stakeholder: 'System',
      name: 'Not Reusable',
      reusable: false,
    })
    class NotReusable {}

    @Milestone({
      stakeholder: 'System',
      name: 'Reusable Two',
    }) // defaults to true
    class ReusableTwo {}

    new ReusableOne();
    new NotReusable();
    new ReusableTwo();

    const registry = MilestoneRegistry.getInstance();
    const reusable = registry.getReusable();
    expect(reusable).toHaveLength(2);
    expect(reusable.map((m) => m.metadata.name)).toContain('Reusable One');
    expect(reusable.map((m) => m.metadata.name)).toContain('Reusable Two');
  });

  it('should return all stateful milestones', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Stateful One',
      stateful: true,
    })
    class StatefulOne {}

    @Milestone({
      stakeholder: 'System',
      name: 'Stateless',
      stateful: false,
    })
    class Stateless {}

    @Milestone({
      stakeholder: 'System',
      name: 'Stateful Two',
    }) // defaults to true
    class StatefulTwo {}

    new StatefulOne();
    new Stateless();
    new StatefulTwo();

    const registry = MilestoneRegistry.getInstance();
    const stateful = registry.getStateful();
    expect(stateful).toHaveLength(2);
    expect(stateful.map((m) => m.metadata.name)).toContain('Stateful One');
    expect(stateful.map((m) => m.metadata.name)).toContain('Stateful Two');
  });
});

describe('@Milestone Decorator - Journey Association', () => {
  beforeEach(() => {
    const milestoneRegistry = MilestoneRegistry.getInstance();
    milestoneRegistry.clear();
  });

  it('should associate milestone with journey by string slug', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Journey Milestone',
      journey: 'test-journey',
    })
    class JourneyMilestone {}

    new JourneyMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestones = registry.getByJourney('test-journey');
    expect(milestones).toHaveLength(1);
    expect(milestones[0].metadata.name).toBe('Journey Milestone');
  });

  it('should return empty array for non-existent journey', () => {
    const registry = MilestoneRegistry.getInstance();
    const milestones = registry.getByJourney('non-existent');
    expect(milestones).toEqual([]);
  });

  it('should return all journey slugs', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Milestone A',
      journey: 'journey-a',
    })
    class MilestoneA {}

    @Milestone({
      stakeholder: 'System',
      name: 'Milestone B',
      journey: 'journey-b',
    })
    class MilestoneB {}

    new MilestoneA();
    new MilestoneB();

    const registry = MilestoneRegistry.getInstance();
    const slugs = registry.getAllJourneySlugs();
    expect(slugs).toHaveLength(2);
    expect(slugs).toContain('journey-a');
    expect(slugs).toContain('journey-b');
  });
});

describe('@Milestone Decorator - Registry Queries', () => {
  beforeEach(() => {
    const milestoneRegistry = MilestoneRegistry.getInstance();
    milestoneRegistry.clear();
  });

  it('should query milestone by name', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Find Me',
    })
    class FindMe {}

    new FindMe();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Find Me');
    expect(milestone).toBeDefined();
    expect(milestone?.metadata.name).toBe('Find Me');
  });

  it('should return undefined for non-existent milestone', () => {
    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Non Existent');
    expect(milestone).toBeUndefined();
  });

  it('should query milestones by stakeholder', () => {
    @Milestone({
      stakeholder: 'Account Owner',
      name: 'Milestone One',
    })
    class MilestoneOne {}

    @Milestone({
      stakeholder: 'Account Owner',
      name: 'Milestone Two',
    })
    class MilestoneTwo {}

    @Milestone({
      stakeholder: 'Admin',
      name: 'Admin Milestone',
    })
    class AdminMilestone {}

    new MilestoneOne();
    new MilestoneTwo();
    new AdminMilestone();

    const registry = MilestoneRegistry.getInstance();
    const ownerMilestones = registry.getByStakeholder('Account Owner');
    expect(ownerMilestones).toHaveLength(2);
    expect(ownerMilestones.map((m) => m.metadata.name)).toContain(
      'Milestone One'
    );
    expect(ownerMilestones.map((m) => m.metadata.name)).toContain(
      'Milestone Two'
    );
  });

  it('should return all registered milestones', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Milestone A',
    })
    class MilestoneA {}

    @Milestone({
      stakeholder: 'System',
      name: 'Milestone B',
    })
    class MilestoneB {}

    new MilestoneA();
    new MilestoneB();

    const registry = MilestoneRegistry.getInstance();
    const all = registry.getAll();
    expect(all).toHaveLength(2);
  });

  it('should get prerequisites for a milestone', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Prerequisite One',
    })
    class PrereqOne {}

    @Milestone({
      stakeholder: 'System',
      name: 'Prerequisite Two',
    })
    class PrereqTwo {}

    @Milestone({
      stakeholder: 'System',
      name: 'Main Milestone',
      prerequisites: ['Prerequisite One', 'Prerequisite Two'],
    })
    class MainMilestone {}

    new PrereqOne();
    new PrereqTwo();
    new MainMilestone();

    const registry = MilestoneRegistry.getInstance();
    const prereqs = registry.getPrerequisites('Main Milestone');
    expect(prereqs).toHaveLength(2);
    expect(prereqs.map((p) => p.metadata.name)).toContain('Prerequisite One');
    expect(prereqs.map((p) => p.metadata.name)).toContain('Prerequisite Two');
  });

  it('should return empty array for milestone with no prerequisites', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'No Prerequisites',
    })
    class NoPrereqs {}

    new NoPrereqs();

    const registry = MilestoneRegistry.getInstance();
    const prereqs = registry.getPrerequisites('No Prerequisites');
    expect(prereqs).toEqual([]);
  });
});

describe('@Milestone Decorator - Metadata Storage', () => {
  beforeEach(() => {
    const milestoneRegistry = MilestoneRegistry.getInstance();
    milestoneRegistry.clear();
  });

  it('should store description and tags', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Documented Milestone',
      description: 'A well-documented milestone',
      tags: ['important', 'financial'],
    })
    class DocumentedMilestone {}

    new DocumentedMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Documented Milestone');
    expect(milestone?.metadata.description).toBe('A well-documented milestone');
    expect(milestone?.metadata.tags).toEqual(['important', 'financial']);
  });

  it('should store all metadata together', () => {
    @Milestone({
      stakeholder: 'Account Owner',
      name: 'Complete Milestone',
      order: 5,
      prerequisites: ['First Step'],
      businessEvent: 'milestone.complete',
      stateful: true,
      reusable: true,
      description: 'A complete milestone with all fields',
      tags: ['complete', 'test'],
    })
    class CompleteMilestone {}

    new CompleteMilestone();

    const registry = MilestoneRegistry.getInstance();
    const milestone = registry.getByName('Complete Milestone');
    expect(milestone?.metadata.name).toBe('Complete Milestone');
    expect(milestone?.metadata.order).toBe(5);
    expect(milestone?.metadata.prerequisites).toEqual(['First Step']);
    expect(milestone?.metadata.businessEvent).toBe('milestone.complete');
    expect(milestone?.metadata.stateful).toBe(true);
    expect(milestone?.metadata.reusable).toBe(true);
    expect(milestone?.metadata.description).toBe(
      'A complete milestone with all fields'
    );
    expect(milestone?.metadata.tags).toEqual(['complete', 'test']);
  });
});

describe('@Milestone Decorator - Circular Dependency Detection', () => {
  beforeEach(() => {
    const milestoneRegistry = MilestoneRegistry.getInstance();
    milestoneRegistry.clear();
  });

  it('should detect circular dependencies', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Milestone A',
      prerequisites: ['Milestone B'],
    })
    class MilestoneA {}

    @Milestone({
      stakeholder: 'System',
      name: 'Milestone B',
      prerequisites: ['Milestone A'],
    })
    class MilestoneB {}

    new MilestoneA();
    new MilestoneB();

    const registry = MilestoneRegistry.getInstance();
    expect(registry.hasCircularDependency('Milestone A')).toBe(true);
    expect(registry.hasCircularDependency('Milestone B')).toBe(true);
  });

  it('should not detect false circular dependencies', () => {
    @Milestone({
      stakeholder: 'System',
      name: 'Milestone X',
    })
    class MilestoneX {}

    @Milestone({
      stakeholder: 'System',
      name: 'Milestone Y',
      prerequisites: ['Milestone X'],
    })
    class MilestoneY {}

    @Milestone({
      stakeholder: 'System',
      name: 'Milestone Z',
      prerequisites: ['Milestone Y'],
    })
    class MilestoneZ {}

    new MilestoneX();
    new MilestoneY();
    new MilestoneZ();

    const registry = MilestoneRegistry.getInstance();
    expect(registry.hasCircularDependency('Milestone Z')).toBe(false);
  });
});

describe('@Milestone Decorator - Registry Statistics', () => {
  beforeEach(() => {
    const milestoneRegistry = MilestoneRegistry.getInstance();
    milestoneRegistry.clear();
  });

  it('should provide registry statistics', () => {
    @Milestone({
      stakeholder: 'Account Owner',
      name: 'Milestone 1',
      journey: 'journey-a',
      reusable: true,
      stateful: true,
    })
    class Milestone1 {}

    @Milestone({
      stakeholder: 'Admin',
      name: 'Milestone 2',
      journey: 'journey-a',
      reusable: false,
      stateful: false,
    })
    class Milestone2 {}

    @Milestone({
      stakeholder: 'Account Owner',
      name: 'Milestone 3',
      journey: 'journey-b',
      reusable: true,
      stateful: true,
    })
    class Milestone3 {}

    new Milestone1();
    new Milestone2();
    new Milestone3();

    const registry = MilestoneRegistry.getInstance();
    const stats = registry.getStats();

    expect(stats.totalMilestones).toBe(3);
    expect(stats.reusableMilestones).toBe(2);
    expect(stats.statefulMilestones).toBe(2);
    expect(stats.byJourney['journey-a']).toBe(2);
    expect(stats.byJourney['journey-b']).toBe(1);
    expect(stats.byStakeholder['Account Owner']).toBe(2);
    expect(stats.byStakeholder['Admin']).toBe(1);
  });
});
