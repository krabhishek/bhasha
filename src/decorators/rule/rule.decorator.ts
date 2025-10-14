/**
 * @Rule Decorator
 * Marks a class as a Rule (validation or business constraint)
 * @module @bhumika/bhasha/decorators/rule
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { RuleMetadata, LogicMetadata } from '../../types/decorator-metadata.types.js';
import { setMetadata } from '../../utils/metadata.utils.js';
import { LogicRegistry } from '../logic/logic.registry.js';

/**
 * Rule decorator options
 */
export interface RuleOptions {
  /**
   * Rule name (defaults to class name if not provided)
   */
  name?: string;

  /**
   * Bounded context this rule belongs to
   */
  context?: string;

  /**
   * Rule type (validation, business, constraint)
   * @default 'business'
   */
  ruleType?: 'validation' | 'business' | 'constraint';

  /**
   * Entities this rule applies to
   */
  appliesTo?: string[];

  /**
   * Input contract - describes expected inputs
   * Example: { amount: 'number', currency: 'string' }
   */
  inputs?: Record<string, string>;

  /**
   * Is this rule pure (no side effects)?
   * @default true
   */
  pure?: boolean;

  /**
   * Can results be cached?
   * @default true
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
 * Validation result interface
 * Standard output format for rules
 */
export interface ValidationResult {
  /**
   * Is the validation successful?
   */
  isValid: boolean;

  /**
   * Validation errors (if any)
   */
  errors?: string[];
}

/**
 * @Rule decorator
 * Marks a class as a Rule (validation or business constraint)
 *
 * BREAKING CHANGE: Classes decorated with @Rule must implement
 * IExecutableLogic<TInput, ValidationResult> with an `execute()` method.
 * Previous method name `validate()` is no longer supported.
 *
 * Rules:
 * - Validate data or enforce constraints
 * - Return standard format: { isValid: boolean, errors?: string[] }
 * - Should be pure functions (no side effects)
 * - Are automatically cacheable
 * - Are registered as @Logic with type: 'rule'
 *
 * @param options - Rule configuration
 * @returns Class decorator
 *
 * @example Validation rule
 * ```typescript
 * ⁣@Rule({
 *   context: 'Piggy Bank',
 *   ruleType: 'validation',
 *   appliesTo: ['Deposit'],
 *   inputs: { amount: 'number' },
 * })
 * class ValidateDepositAmountRule implements IExecutableLogic<number, ValidationResult> {
 *   execute(amount: number): ValidationResult {
 *     const errors: string[] = [];
 *
 *     if (amount <= 0) {
 *       errors.push('Amount must be positive');
 *     }
 *     if (amount > 10000) {
 *       errors.push('Amount exceeds maximum limit');
 *     }
 *
 *     return {
 *       isValid: errors.length === 0,
 *       errors: errors.length > 0 ? errors : undefined,
 *     };
 *   }
 * }
 * ```
 *
 * @example Business rule
 * ```typescript
 * ⁣@Rule({
 *   context: 'E-commerce',
 *   ruleType: 'business',
 *   appliesTo: ['Order'],
 *   inputs: { order: 'Order', customer: 'Customer' },
 * })
 * class MinimumOrderRule implements IExecutableLogic<OrderContext, ValidationResult> {
 *   execute(context: OrderContext): ValidationResult {
 *     if (context.order.total < 10) {
 *       return {
 *         isValid: false,
 *         errors: ['Minimum order amount is $10'],
 *       };
 *     }
 *     return { isValid: true };
 *   }
 * }
 * ```
 */
export function Rule(options: RuleOptions = {}) {
  return function <T extends new (...args: never[]) => unknown>(
    target: T,
    context: ClassDecoratorContext<T>
  ): T {
    const ruleName = options.name || String(context.name);

    // Build rule metadata
    const ruleMetadata: RuleMetadata = {
      context: options.context,
      ruleType: options.ruleType || 'business',
      appliesTo: options.appliesTo,
      description: options.description,
      tags: options.tags,
    };

    // Build logic metadata
    // Rules always have standard validation output
    const logicMetadata: LogicMetadata = {
      name: ruleName,
      type: 'rule',
      inputs: options.inputs,
      outputs: {
        isValid: 'boolean',
        errors: 'string[]',
      },
      pure: options.pure ?? true,
      cacheable: options.cacheable ?? true,
      context: options.context,
      ruleType: options.ruleType || 'business',
      appliesTo: options.appliesTo,
      description: options.description,
      tags: options.tags,
      examples: options.examples,
    };

    // Store metadata and register in registry using Stage 3 initializer
    context.addInitializer(function (this: unknown) {
      const constructor = (this as object).constructor as new (...args: never[]) => unknown;

      // Store both rule metadata and logic metadata
      setMetadata(METADATA_KEYS.RULE, ruleMetadata, constructor);
      setMetadata(METADATA_KEYS.LOGIC, logicMetadata, constructor);

      // Auto-register in LogicRegistry
      const registry = LogicRegistry.getInstance();
      registry.register(logicMetadata, constructor);
    });

    return target;
  };
}
