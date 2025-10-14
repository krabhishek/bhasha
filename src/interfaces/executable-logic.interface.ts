/**
 * Executable Logic Interface
 * Standard interface for all executable business logic components
 * @module @bhumika/bhasha/interfaces
 */

/**
 * Standard interface for all executable logic
 * All @Logic, @Specification, @Policy, @Rule, and @Behavior classes must implement this interface
 *
 * @template TInput - Input type for the execute method
 * @template TOutput - Output type for the execute method
 *
 * @example
 * ```typescript
 * @Logic({
 *   type: 'validation',
 *   inputs: { email: 'string' },
 *   outputs: { isValid: 'boolean' },
 * })
 * class ValidateEmailLogic implements IExecutableLogic<string, boolean> {
 *   execute(email: string): boolean {
 *     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 *   }
 * }
 * ```
 */
export interface IExecutableLogic<TInput = unknown, TOutput = unknown> {
  /**
   * Execute the logic with given input
   * @param input - Input data (typed based on logic's input contract)
   * @returns Output data (typed based on logic's output contract)
   */
  execute(input: TInput): TOutput | Promise<TOutput>;
}

/**
 * Type helper to extract input type from logic class
 *
 * @example
 * ```typescript
 * type Input = LogicInput<ValidateEmailLogic>; // string
 * ```
 */
export type LogicInput<T> = T extends IExecutableLogic<infer I, unknown>
  ? I
  : never;

/**
 * Type helper to extract output type from logic class
 *
 * @example
 * ```typescript
 * type Output = LogicOutput<ValidateEmailLogic>; // boolean
 * ```
 */
export type LogicOutput<T> = T extends IExecutableLogic<unknown, infer O>
  ? O
  : never;
