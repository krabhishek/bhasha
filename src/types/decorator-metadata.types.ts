/**
 * Decorator metadata types for Bhasha DSL
 * These interfaces define the structure of metadata attached by decorators
 * @module @bhumika/bhasha/types
 *
 * This file re-exports all metadata types from organized module files.
 * Individual types are now organized by category in the metadata/ subdirectory.
 */

// Re-export all types from the metadata subdirectory
export type {
  // Stage 3 Decorator Types
  DecoratorContext,
  DecoratorMetadataObject,
  ConstructorWithMetadata,

  // Attribute Types
  AttributeValidation,
  AttributeDefinition,
  AttributeMetadata,

  // Domain Types
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

  // Persona & Stakeholder Types
  PersonaMetadata,
  StakeholderMetadata,

  // Journey Types
  StakeholderInteraction,
  BehaviorContractType,
  BehaviorContract,
  JourneyClass,
  JourneyReference,
  JourneyMetadata,
  MilestoneClass,
  MilestoneReference,
  MilestoneMetadata,
  StepClass,
  StepReference,
  StepMetadata,
  ExpectationMetadata,
  BehaviorExecutionMode,
  BehaviorMetadata,
  TestType,
  TestStatus,
  TestMetadata,

  // Logic Types
  LogicType,
  LogicExecutionStrategy,
  LogicReference,
  LogicMetadata,
} from './metadata/index.js';

// Re-export enums from their respective files
export { PersonaType } from '../enums/stakeholder-type.enum.js';
export { ExpectationPriority } from '../enums/expectation-priority.enum.js';
export { ContextRelationshipType } from '../enums/context-relationship.enum.js';
