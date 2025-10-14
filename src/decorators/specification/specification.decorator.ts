/**
 * @Specification Decorator
 * Marks a class as a Specification (boolean business rule using DDD Specification pattern)
 * @module @bhumika/bhasha/decorators/specification
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { SpecificationMetadata, LogicMetadata } from '../../types/decorator-metadata.types.js';
import { setMetadata } from '../../utils/metadata.utils.js';
import { LogicRegistry } from '../logic/logic.registry.js';

/**
 * Specification decorator options
 */
export interface SpecificationOptions {
  /**
   * Specification name (defaults to class name if not provided)
   */
  name?: string;

  /**
   * Bounded context this specification belongs to
   */
  context?: string;

  /**
   * Entities this specification applies to
   */
  appliesTo?: string[];

  /**
   * Input contract - describes expected inputs
   * Example: { customer: 'Customer', order: 'Order' }
   */
  inputs?: Record<string, string>;

  /**
   * Can results be cached?
   * @default true (specifications should be pure by default)
   */
  cacheable?: boolean;

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Example usages for documentation
   */
  examples?: Array<{
    input: unknown;
    output: unknown;
    description?: string;
  }>;
}

/**
 * @Specification decorator
 * Marks a class as a Specification (DDD Specification pattern)
 *
 * BREAKING CHANGE: Classes decorated with @Specification must implement
 * IExecutableLogic<TInput, boolean> with an `execute()` method.
 * Previous method name `isSatisfiedBy()` is no longer supported.
 *
 * Specifications:
 * - Return boolean (satisfied or not)
 * - Should be pure functions (no side effects)
 * - Are automatically cacheable
 * - Are registered as @Logic with type: 'specification'
 *
 * @param options - Specification configuration
 * @returns Class decorator
 *
 * @example Basic specification
 * ```typescript
 * ⁣@Specification({
 *   context: 'E-commerce',
 *   appliesTo: ['Customer'],
 *   inputs: { customer: 'Customer' },
 * })
 * class IsEligibleForDiscountSpec implements IExecutableLogic<Customer, boolean> {
 *   execute(customer: Customer): boolean {
 *     return customer.totalPurchases > 1000;
 *   }
 * }
 * ```
 *
 * @example Composite specification with caching
 * ```typescript
 * ⁣@Specification({
 *   context: 'E-commerce',
 *   appliesTo: ['Order'],
 *   inputs: { order: 'Order' },
 *   cacheable: true,
 * })
 * class IsValidOrderSpec implements IExecutableLogic<Order, boolean> {
 *   execute(order: Order): boolean {
 *     return order.items.length > 0 && order.total > 0;
 *   }
 * }
 * ```
 */
export function Specification(options: SpecificationOptions = {}) {
  return function <T extends new (...args: never[]) => unknown>(
    target: T,
    context: ClassDecoratorContext<T>
  ): T {
    const specName = options.name || String(context.name);

    // Build specification metadata
    const specMetadata: SpecificationMetadata = {
      context: options.context,
      appliesTo: options.appliesTo,
      description: options.description,
      tags: options.tags,
    };

    // Build logic metadata
    // Specifications always have boolean output
    const logicMetadata: LogicMetadata = {
      name: specName,
      type: 'specification',
      inputs: options.inputs,
      outputs: { result: 'boolean' },
      pure: true, // Specifications should always be pure
      cacheable: options.cacheable ?? true, // Cacheable by default
      context: options.context,
      appliesTo: options.appliesTo,
      description: options.description,
      tags: options.tags,
      examples: options.examples,
    };

    // Store metadata and register in registry using Stage 3 initializer
    context.addInitializer(function (this: unknown) {
      const constructor = (this as object).constructor as new (...args: never[]) => unknown;

      // Store both specification metadata and logic metadata
      setMetadata(METADATA_KEYS.SPECIFICATION, specMetadata, constructor);
      setMetadata(METADATA_KEYS.LOGIC, logicMetadata, constructor);

      // Auto-register in LogicRegistry
      const registry = LogicRegistry.getInstance();
      registry.register(logicMetadata, constructor);
    });

    return target;
  };
}
