/**
 * @Policy Decorator
 * Marks a class as a Policy (decision-making logic using DDD Policy pattern)
 * @module @bhumika/bhasha/decorators/policy
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { PolicyMetadata, LogicMetadata, ContextReference } from '../../types/decorator-metadata.types.js';
import { setMetadata } from '../../utils/metadata.utils.js';
import { extractContextName } from '../../utils/class-reference.utils.js';
import { LogicRegistry } from '../logic/logic.registry.js';

/**
 * Policy decorator options
 */
export interface PolicyOptions {
  /**
   * Policy name (defaults to class name if not provided)
   */
  name?: string;

  /**
   * Bounded context this policy belongs to
   */
  context?: ContextReference;

  /**
   * Policy type (approval, pricing, routing, etc.)
   */
  policyType?: string;

  /**
   * Input contract - describes expected inputs
   * Example: { order: 'Order', customer: 'Customer' }
   */
  inputs?: Record<string, string>;

  /**
   * Output contract - describes expected outputs
   * Example: { decision: 'string', reason: 'string' }
   */
  outputs?: Record<string, string>;

  /**
   * Is this policy idempotent?
   * @default true
   */
  idempotent?: boolean;

  /**
   * Can results be cached?
   * @default false
   */
  cacheable?: boolean;

  /**
   * Other logic/services this policy invokes
   */
  invokes?: string[];

  /**
   * Required services/repositories for dependency injection
   */
  requires?: string[];

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
 * @Policy decorator
 * Marks a class as a Policy (DDD Policy pattern for decision-making)
 *
 * BREAKING CHANGE: Classes decorated with @Policy must implement
 * IExecutableLogic<TInput, TOutput> with an `execute()` method.
 * Previous method name `apply()` is no longer supported.
 *
 * Policies:
 * - Make decisions based on business rules
 * - Can have side effects (unlike specifications)
 * - Should be idempotent when possible
 * - Are registered as @Logic with type: 'policy'
 *
 * @param options - Policy configuration
 * @returns Class decorator
 *
 * @example Approval policy
 * ```typescript
 * interface ApprovalDecision {
 *   approved: boolean;
 *   reason: string;
 * }
 *
 * ⁣@Policy({
 *   context: 'Finance',
 *   policyType: 'approval',
 *   inputs: { amount: 'number', customer: 'Customer' },
 *   outputs: { approved: 'boolean', reason: 'string' },
 *   idempotent: true,
 * })
 * class PurchaseApprovalPolicy implements IExecutableLogic<PurchaseRequest, ApprovalDecision> {
 *   execute(request: PurchaseRequest): ApprovalDecision {
 *     if (request.amount > 10000) {
 *       return { approved: false, reason: 'Exceeds limit' };
 *     }
 *     return { approved: true, reason: 'Within limit' };
 *   }
 * }
 * ```
 *
 * @example Pricing policy with dependencies
 * ```typescript
 * ⁣@Policy({
 *   context: 'E-commerce',
 *   policyType: 'pricing',
 *   inputs: { product: 'Product', customer: 'Customer' },
 *   outputs: { price: 'number', discount: 'number' },
 *   requires: ['PricingService', 'CustomerRepository'],
 *   invokes: ['CalculateBasePrice', 'CalculateDiscount'],
 * })
 * class DynamicPricingPolicy implements IExecutableLogic<PricingContext, PricingResult> {
 *   execute(context: PricingContext): PricingResult {
 *     // Pricing logic implementation
 *   }
 * }
 * ```
 */
export function Policy(options: PolicyOptions = {}) {
  return function <T extends new (...args: never[]) => unknown>(
    target: T,
    context: ClassDecoratorContext<T>
  ): T {
    const policyName = options.name || String(context.name);

    // Extract context name from reference (class or string)
    const contextRef = options.context;
    const contextName = contextRef ? extractContextName(contextRef) : undefined;

    // Build policy metadata
    const policyMetadata: PolicyMetadata = {
      context: contextName,
      policyType: options.policyType,
      description: options.description,
      tags: options.tags,
    };

    // Build logic metadata
    const logicMetadata: LogicMetadata = {
      name: policyName,
      type: 'policy',
      inputs: options.inputs,
      outputs: options.outputs,
      idempotent: options.idempotent ?? true,
      cacheable: options.cacheable ?? false,
      invokes: options.invokes,
      requires: options.requires,
      context: contextName,
      policyType: options.policyType,
      description: options.description,
      tags: options.tags,
      examples: options.examples,
    };

    // Store metadata and register in registry using Stage 3 initializer
    context.addInitializer(function (this: unknown) {
      const constructor = (this as object).constructor as new (...args: never[]) => unknown;

      // Store both policy metadata and logic metadata
      setMetadata(METADATA_KEYS.POLICY, policyMetadata, constructor);
      setMetadata(METADATA_KEYS.LOGIC, logicMetadata, constructor);

      // Auto-register in LogicRegistry
      const registry = LogicRegistry.getInstance();
      registry.register(logicMetadata, constructor);
    });

    return target;
  };
}
