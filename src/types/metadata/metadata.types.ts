/**
 * Core metadata types for Bhasha DSL
 * @module @bhumika/bhasha/types
 */

/**
 * Source location information (populated by parser)
 */
export interface SourceLocation {
  /**
   * File path
   */
  filePath: string;

  /**
   * Line number (1-indexed)
   */
  line: number;

  /**
   * Column number (1-indexed)
   */
  column: number;
}

/**
 * Base metadata that all decorators attach
 * Provides common fields for all Bhasha components
 */
export interface BaseMetadata {
  /**
   * Unique identifier (generated or explicit)
   */
  id?: string;

  /**
   * Human-readable name
   */
  name?: string;

  /**
   * Description for documentation
   */
  description?: string;

  /**
   * Tags for categorization and filtering
   */
  tags?: string[];

  /**
   * JSDoc comment extracted from source (populated by parser)
   */
  jsDoc?: string;

  /**
   * Source location (populated by parser)
   */
  sourceLocation?: SourceLocation;

  /**
   * Custom metadata (extensible)
   */
  [key: string]: unknown;
}
