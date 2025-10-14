/**
 * Metadata keys for reflect-metadata storage
 * Using Symbols prevents collision with other decorators
 * @module @bhumika/bhasha/constants
 */

/**
 * Metadata keys for Bhasha decorators
 * Each decorator stores its metadata using a unique Symbol key
 */
export const METADATA_KEYS = {
  /**
   * Bounded context metadata key
   * Applied to: class
   */
  BOUNDED_CONTEXT: Symbol('bhasha:bounded-context'),

  /**
   * Domain marker metadata key
   * Applied to: class
   */
  DOMAIN: Symbol('bhasha:domain'),

  /**
   * Domain entity metadata key
   * Applied to: class
   */
  ENTITY: Symbol('bhasha:entity'),

  /**
   * Value object metadata key
   * Applied to: class
   */
  VALUE_OBJECT: Symbol('bhasha:value-object'),

  /**
   * Aggregate root metadata key
   * Applied to: class
   */
  AGGREGATE_ROOT: Symbol('bhasha:aggregate-root'),

  /**
   * Aggregate metadata key (marks any aggregate member)
   * Applied to: class
   */
  AGGREGATE: Symbol('bhasha:aggregate'),

  /**
   * Persona metadata key
   * Applied to: class
   */
  PERSONA: Symbol('bhasha:persona'),

  /**
   * Stakeholder metadata key
   * Applied to: class
   */
  STAKEHOLDER: Symbol('bhasha:stakeholder'),

  /**
   * Journey metadata key
   * Applied to: class
   */
  JOURNEY: Symbol('bhasha:journey'),

  /**
   * Milestone metadata key
   * Applied to: property or method
   */
  MILESTONE: Symbol('bhasha:milestone'),

  /**
   * Step metadata key
   * Applied to: method
   */
  STEP: Symbol('bhasha:step'),

  /**
   * Expectation metadata key
   * Applied to: method
   */
  EXPECTATION: Symbol('bhasha:expectation'),

  /**
   * Behavior metadata key
   * Applied to: method
   */
  BEHAVIOR: Symbol('bhasha:behavior'),

  /**
   * Test metadata key
   * Applied to: method
   */
  TEST: Symbol('bhasha:test'),

  /**
   * Logic component metadata key
   * Applied to: class
   */
  LOGIC: Symbol('bhasha:logic'),

  /**
   * Attached logic metadata key
   * Applied to: method or property
   */
  ATTACHED_LOGIC: Symbol('bhasha:attached-logic'),

  /**
   * Specification metadata key
   * Applied to: class
   */
  SPECIFICATION: Symbol('bhasha:specification'),

  /**
   * Policy metadata key
   * Applied to: class or method
   */
  POLICY: Symbol('bhasha:policy'),

  /**
   * Rule metadata key
   * Applied to: class or method
   */
  RULE: Symbol('bhasha:rule'),

  /**
   * Domain service metadata key
   * Applied to: class
   */
  DOMAIN_SERVICE: Symbol('bhasha:domain-service'),

  /**
   * Application service metadata key
   * Applied to: class
   */
  APPLICATION_SERVICE: Symbol('bhasha:application-service'),

  /**
   * Repository metadata key
   * Applied to: class
   */
  REPOSITORY: Symbol('bhasha:repository'),

  /**
   * Factory metadata key
   * Applied to: class
   */
  FACTORY: Symbol('bhasha:factory'),

  /**
   * Domain event metadata key
   * Applied to: class
   */
  DOMAIN_EVENT: Symbol('bhasha:domain-event'),

  /**
   * Event handler metadata key
   * Applied to: method
   */
  EVENT_HANDLER: Symbol('bhasha:event-handler'),

  /**
   * Attribute metadata key
   * Applied to: property (property decorator) or class (inline metadata)
   * Used to define structured properties on any Bhasha component
   */
  ATTRIBUTE: Symbol('bhasha:attribute'),
} as const;

/**
 * Type for metadata key values
 */
export type MetadataKey = (typeof METADATA_KEYS)[keyof typeof METADATA_KEYS];
