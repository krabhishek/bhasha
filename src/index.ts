/**
 * @bhumika/bhasha - Domain Specific Language for Product Management as Code
 *
 * A TypeScript-based DSL for modeling software products through journeys, stakeholders,
 * expectations, and domain-driven design patterns. Enables AI-assisted development with
 * comprehensive code generation and test scaffolding.
 *
 * @example
 * ```typescript
 * import { Journey, Stakeholder, Expectation, Entity, AggregateRoot } from '@bhumika/bhasha';
 *
 * @Journey({ name: 'Place Order', code: 'PO' })
 * class PlaceOrderJourney {
 *   @Expectation({ stakeholder: 'Customer', description: 'Place an order' })
 *   async customerCanPlaceOrder(): Promise<void> {
 *     // Test implementation
 *   }
 * }
 * ```
 *
 * @packageDocumentation
 */

// ============================================================================
// Core Types
// ============================================================================

export type * from './types/index.js';

// ============================================================================
// Interfaces
// ============================================================================

export type * from './interfaces/index.js';

// ============================================================================
// Base Classes (Optional)
// ============================================================================

export * from './base/index.js';

// ============================================================================
// Constants
// ============================================================================

export * from './constants/index.js';

// ============================================================================
// Utilities
// ============================================================================

export * from './utils/index.js';

// ============================================================================
// Enums
// ============================================================================

export * from './enums/index.js';

// ============================================================================
// Decorators (using TypeScript 5.0+ Stage 3 decorators - no reflect-metadata needed)
// ============================================================================

export * from './decorators/index.js';
