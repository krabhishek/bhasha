/**
 * Persona and Stakeholder Metadata Types
 * Types for defining personas (context-free actors) and stakeholders (context-specific roles)
 * @module @bhumika/bhasha/types/metadata
 */

import type { PersonaType } from '../../enums/stakeholder-type.enum.js';
import type { AttributeDefinition } from './attribute-metadata.types.js';
import type { BaseMetadata } from './metadata.types.js';

/**
 * Persona metadata
 * Represents the fundamental identity of an actor (context-free)
 * Personas describe WHO/WHAT something is intrinsically
 */
export interface PersonaMetadata extends BaseMetadata {
  /**
   * Persona type (what kind of entity is this?)
   */
  type: PersonaType;

  /**
   * Persona name (defaults to class name)
   */
  name?: string;

  /**
   * Unique identifier (auto-generated)
   */
  id?: string;

  /**
   * Description of this persona
   */
  description?: string;

  /**
   * Demographic information (primarily for humans)
   */
  demographics?: {
    ageRange?: string;
    location?: string;
    educationLevel?: string;
    incomeLevel?: string;
    occupation?: string;
    [key: string]: unknown;
  };

  /**
   * Behavioral characteristics (applies to any persona type)
   */
  behaviors?: {
    techSavviness?: 'low' | 'medium' | 'high';
    riskTolerance?: 'low' | 'medium' | 'high';
    decisionMakingStyle?: 'analytical' | 'intuitive' | 'collaborative';
    preferredChannels?: string[];
    [key: string]: unknown;
  };

  /**
   * General characteristics (context-free)
   */
  characteristics?: Record<string, unknown>;

  /**
   * General motivations (not context-specific)
   */
  motivations?: string[];

  /**
   * Pain points (general, not context-specific)
   */
  painPoints?: string[];

  /**
   * Quote or motto representing this persona
   */
  quote?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Inline attribute definitions (alternative to @Attribute decorator)
   * Defines structured properties for this persona (age, income, preferences, etc.)
   */
  attributes?: AttributeDefinition[];

  /**
   * Extension metadata (for plugins and future features)
   */
  extensions?: Record<string, unknown>;
}

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Stakeholder metadata
 * Represents a Persona playing a specific ROLE in a bounded context
 * Stakeholders are context-specific
 */
export interface StakeholderMetadata extends BaseMetadata {
  /**
   * Reference to the underlying persona (required)
   * Can be either:
   * - A Persona class (with @Persona decorator) for type-safe references
   * - A string persona name for flexibility
   */
  persona: Constructor | string;

  /**
   * Stakeholder role name in this context (required)
   * Example: "Investor", "Bill Payer", "Loan Applicant"
   */
  role: string;

  /**
   * Bounded context where this stakeholder operates (required)
   * Example: "Investment Management", "Bill Payment", "Lending"
   */
  context: string;

  /**
   * Context-specific goals
   */
  goals?: string[];

  /**
   * Context-specific responsibilities
   */
  responsibilities?: string[];

  /**
   * Relationships with other stakeholders IN THIS CONTEXT
   */
  relationships?: Record<string, string | string[]>;

  /**
   * Context-specific attributes
   */
  contextAttributes?: Record<string, unknown>;

  /**
   * Access rights/permissions in this context
   */
  permissions?: string[];

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Inline attribute definitions (alternative to @Attribute decorator)
   * Defines structured properties for this stakeholder role (limits, thresholds, preferences, etc.)
   */
  attributes?: AttributeDefinition[];

  /**
   * Extension metadata
   */
  extensions?: Record<string, unknown>;
}
