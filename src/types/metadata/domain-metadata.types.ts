/**
 * Domain Metadata Types
 * Types for DDD domain models, bounded contexts, entities, value objects, etc.
 * @module @bhumika/bhasha/types/metadata
 */

import type { ContextRelationshipType } from '../../enums/context-relationship.enum.js';
import type { AttributeDefinition } from './attribute-metadata.types.js';
import type { BaseMetadata } from './metadata.types.js';

/**
 * Bounded Context class constructor type
 */
export type BoundedContextClass = new (...args: never[]) => unknown;

/**
 * Context reference - allows both type-safe class references and string names
 * Used in decorator options to allow users to reference contexts either way:
 * - By class: context: OrderManagementContext (type-safe, refactorable)
 * - By string: context: 'Order Management' (flexible, simple)
 */
export type ContextReference = string | BoundedContextClass;

/**
 * Bounded Context metadata
 * Represents a DDD bounded context
 */
export interface BoundedContextMetadata extends BaseMetadata {
  /**
   * Context name (required)
   */
  name: string;

  /**
   * Related contexts with relationship types
   */
  relationships?: {
    /**
     * Context name and relationship type
     */
    [contextName: string]: ContextRelationshipType;
  };

  /**
   * Team owning this context
   */
  owner?: string;

  /**
   * Ubiquitous language terms specific to this context
   */
  vocabulary?: Record<string, string>;

  /**
   * Inline attribute definitions (alternative to @Attribute decorator)
   */
  attributes?: AttributeDefinition[];
}

/**
 * Domain marker metadata
 * Marks a class as part of the domain model
 */
export interface DomainMetadata extends BaseMetadata {
  /**
   * Bounded context this domain model belongs to (string name)
   */
  context?: string;

  /**
   * Ubiquitous language terms specific to this domain
   * Maps terms to their definitions in the domain context
   */
  ubiquitousLanguage?: Record<string, string>;

  /**
   * Inline attribute definitions (alternative to @Attribute decorator)
   */
  attributes?: AttributeDefinition[];
}

/**
 * Domain Entity metadata
 * Extends TypeORM entity with domain semantics
 */
export interface DomainEntityMetadata extends BaseMetadata {
  /**
   * Bounded context this entity belongs to (string name)
   */
  context?: string;

  /**
   * Is this an aggregate root?
   */
  isAggregateRoot?: boolean;

  /**
   * Parent aggregate (if this is a child entity)
   */
  parentAggregate?: string;

  /**
   * Related entities (for dependency tracking)
   */
  relationships?: {
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    target: string;
    description?: string;
  }[];

  /**
   * Inline attribute definitions (alternative to @Attribute decorator)
   */
  attributes?: AttributeDefinition[];
}

/**
 * Value Object metadata
 * ValueObjects are immutable domain values compared by structure, not identity
 */
export interface ValueObjectMetadata extends BaseMetadata {
  /**
   * Bounded context (string name)
   */
  context?: string;

  /**
   * Is this value object immutable? (should always be true)
   */
  immutable?: boolean;

  /**
   * Equality comparison strategy
   * - 'structural': Compare by all property values (default for ValueObjects)
   * - 'reference': Compare by object identity
   */
  equality?: 'structural' | 'reference';

  /**
   * Inline attribute definitions (alternative to @Attribute decorator)
   * Defines the properties/fields that make up this ValueObject
   */
  attributes?: AttributeDefinition[];
}

/**
 * Aggregate Root metadata
 */
export interface AggregateRootMetadata extends BaseMetadata {
  /**
   * Bounded context
   * Can be BoundedContext class or string name
   */
  context?: string;

  /**
   * Child entities within this aggregate
   */
  children?: string[];

  /**
   * Inline attribute definitions (alternative to @Attribute decorator)
   */
  attributes?: AttributeDefinition[];
}

/**
 * Aggregate metadata (general marker)
 */
export interface AggregateMetadata extends BaseMetadata {
  /**
   * Bounded context
   * Can be BoundedContext class or string name
   */
  context?: string;
}

/**
 * Specification metadata
 * Business rule that returns boolean
 */
export interface SpecificationMetadata extends BaseMetadata {
  /**
   * Bounded context
   * Can be BoundedContext class or string name
   */
  context?: string;

  /**
   * Entities this specification applies to
   */
  appliesTo?: string[];
}

/**
 * Policy metadata
 * Decision-making logic
 */
export interface PolicyMetadata extends BaseMetadata {
  /**
   * Bounded context
   * Can be BoundedContext class or string name
   */
  context?: string;

  /**
   * Policy type (approval, pricing, routing, etc.)
   */
  policyType?: string;
}

/**
 * Rule metadata
 * Validation or business rule
 */
export interface RuleMetadata extends BaseMetadata {
  /**
   * Bounded context
   * Can be BoundedContext class or string name
   */
  context?: string;

  /**
   * Rule type (validation, business, etc.)
   */
  ruleType?: 'validation' | 'business' | 'constraint';

  /**
   * Entities this rule applies to
   */
  appliesTo?: string[];
}

/**
 * Service metadata
 */
export interface ServiceMetadata extends BaseMetadata {
  /**
   * Service type
   */
  serviceType: 'domain' | 'application';

  /**
   * Bounded context
   * Can be BoundedContext class or string name
   */
  context?: string;
}

/**
 * Repository metadata
 */
export interface RepositoryMetadata extends BaseMetadata {
  /**
   * Entity this repository manages
   */
  entity: string;

  /**
   * Bounded context
   * Can be BoundedContext class or string name
   */
  context?: string;
}

/**
 * Factory metadata
 */
export interface FactoryMetadata extends BaseMetadata {
  /**
   * Entity/Aggregate this factory creates
   */
  creates: string;

  /**
   * Bounded context
   * Can be BoundedContext class or string name
   */
  context?: string;
}

/**
 * Domain Event metadata
 */
export interface DomainEventMetadata extends BaseMetadata {
  /**
   * Event type/name
   */
  eventType: string;

  /**
   * Bounded context
   * Can be BoundedContext class or string name
   */
  context?: string;

  /**
   * Aggregate that emits this event
   */
  aggregateType?: string;
}

/**
 * Event Handler metadata
 */
export interface EventHandlerMetadata extends BaseMetadata {
  /**
   * Event type this handler subscribes to
   */
  eventType: string;

  /**
   * Handler priority (for ordering)
   */
  priority?: number;

  /**
   * Is this handler async?
   */
  async?: boolean;
}
