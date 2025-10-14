/**
 * Metadata Types Index
 * Re-exports all metadata types from organized module files
 * @module @bhumika/bhasha/types/metadata
 */

// Stage 3 Decorator Types
export type {
  DecoratorContext,
  DecoratorMetadataObject,
  ConstructorWithMetadata,
} from './stage3.types.js';

// Attribute Types
export type {
  AttributeValidation,
  AttributeDefinition,
  AttributeMetadata,
} from './attribute-metadata.types.js';

// Domain Types
export type {
  BoundedContextMetadata,
  DomainMetadata,
  DomainEntityMetadata,
  ValueObjectMetadata,
  AggregateRootMetadata,
  AggregateMetadata,
  SpecificationMetadata,
  PolicyMetadata,
  RuleMetadata,
  ServiceMetadata,
  RepositoryMetadata,
  FactoryMetadata,
  DomainEventMetadata,
  EventHandlerMetadata,
} from './domain-metadata.types.js';

// Persona & Stakeholder Types
export type {
  PersonaMetadata,
  StakeholderMetadata,
} from './persona-metadata.types.js';

// Journey Types
export type {
  StakeholderInteraction,
  JourneyClass,
  JourneyReference,
  JourneyMetadata,
  MilestoneClass,
  StepClass,
  MilestoneReference,
  StepReference,
  MilestoneMetadata,
  StepMetadata,
} from './journey-metadata.types.js';

// Expectation Types
export type {
  ExpectationMetadata,
} from './expectation-metadata.types.js';

// Behavior Types
export type {
  BehaviorContractType,
  BehaviorContract,
  BehaviorExecutionMode,
  BehaviorMetadata,
} from './behavior-metadata.types.js';

// Test Types
export type {
  TestType,
  TestStatus,
  TestMetadata,
  TestDefinition,
} from './test-metadata.types.js';

// Logic Types
export type {
  LogicType,
  LogicExecutionStrategy,
  LogicReference,
  LogicMetadata,
} from './logic-metadata.types.js';
