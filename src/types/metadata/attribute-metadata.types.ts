/**
 * Attribute Metadata Types
 * Types for defining and validating attributes across domain models
 * @module @bhumika/bhasha/types/metadata
 */

import type { BaseMetadata } from './metadata.types.js';

/**
 * Attribute validation rules
 * Defines constraints and validation logic for attributes
 */
export interface AttributeValidation {
  /**
   * Minimum value (for numbers)
   */
  min?: number;

  /**
   * Maximum value (for numbers)
   */
  max?: number;

  /**
   * Minimum length (for strings/arrays)
   */
  minLength?: number;

  /**
   * Maximum length (for strings/arrays)
   */
  maxLength?: number;

  /**
   * Regex pattern (for strings)
   */
  pattern?: string | RegExp;

  /**
   * Allowed values (enum constraint)
   */
  enum?: unknown[];

  /**
   * Custom validation function
   * Returns true if valid, false or error message if invalid
   */
  custom?: (value: unknown) => boolean | string;
}

/**
 * Inline attribute definition
 * Used for defining attributes in decorator metadata (alternative to @Attribute decorator)
 */
export interface AttributeDefinition {
  /**
   * Property/attribute name
   */
  name: string;

  /**
   * Type information (can be string like 'number', 'string', or a constructor function)
   */
  type?: string | Function;

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Is this attribute required?
   */
  required?: boolean;

  /**
   * Default value if not provided
   */
  defaultValue?: unknown;

  /**
   * Is this attribute immutable? (for ValueObject semantics)
   */
  immutable?: boolean;

  /**
   * Validation rules
   */
  validation?: AttributeValidation;

  /**
   * Example values for documentation
   */
  examples?: unknown[];

  /**
   * For nested/composite attributes (inline ValueObjects)
   * Defines the structure of complex attributes
   */
  properties?: Record<string, AttributeDefinition>;

  /**
   * Marks this as a ValueObject reference
   */
  valueObject?: boolean;

  /**
   * Equality comparison strategy (for ValueObjects)
   */
  equality?: 'structural' | 'reference';
}

/**
 * Full attribute metadata
 * Combines AttributeDefinition with BaseMetadata for complete attribute information
 * Used by both @Attribute decorator and inline attribute definitions
 */
export interface AttributeMetadata
  extends Omit<BaseMetadata, 'name'>,
    AttributeDefinition {
  // Inherits all fields from AttributeDefinition and BaseMetadata
  // AttributeDefinition.name (required) takes precedence over BaseMetadata.name (optional)
}
