/**
 * Test Metadata Types
 * Types for test definitions and validation
 * @module @bhumika/bhasha/types/metadata
 */

import type { BaseMetadata } from './metadata.types.js';

/**
 * Test type
 */
export type TestType =
  | 'unit'
  | 'integration'
  | 'e2e'
  | 'contract'
  | 'performance'
  | 'security';

/**
 * Test definition for inline tests within behaviors
 * Used to define tests colocated with behavior implementations
 */
export interface TestDefinition {
  /**
   * Test name/description
   */
  name: string;

  /**
   * Test type
   */
  type: TestType;

  /**
   * Test framework (Jest, Vitest, Playwright, etc.)
   */
  framework?: string;

  /**
   * Test implementation function
   * Can be sync or async
   */
  run: () => void | Promise<void>;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Optional description for documentation
   */
  description?: string;
}

/**
 * Test status
 */
export type TestStatus =
  | 'pending'
  | 'passing'
  | 'failing'
  | 'skipped'
  | 'flaky';

/**
 * Test metadata
 * Describes automated tests that validate expectations/behaviors
 */
export interface TestMetadata extends BaseMetadata {
  /**
   * Test name/description
   */
  name: string;

  /**
   * Human-readable description of what this test validates
   */
  description?: string;

  /**
   * Unique test ID (auto-generated if not provided)
   * Format: {EXPECTATION_ID}-TEST-{NUMBER}
   */
  testId?: string;

  /**
   * Expectation ID this test validates
   * Can be undefined during initialization for inline tests (will be resolved later)
   */
  expectationId?: string;

  /**
   * Behavior ID this test validates (if testing specific behavior)
   */
  behaviorId?: string;

  /**
   * Test framework (Jest, Vitest, Playwright, etc.)
   */
  framework?: string;

  /**
   * Test type
   */
  type: TestType;

  /**
   * Test file path
   */
  file?: string;

  /**
   * Current test status
   */
  status?: TestStatus;

  /**
   * Coverage information
   */
  coverage?: {
    lines?: number;
    branches?: number;
    functions?: number;
    statements?: number;
  };

  /**
   * Test execution time (in ms)
   */
  executionTime?: number;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Related test IDs (for test suites/dependencies)
   */
  relatedTests?: string[];
}
