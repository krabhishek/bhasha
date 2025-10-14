/**
 * Utilities for merging singular and plural references
 * Used to support flexible decorator API with both singular and plural patterns
 * @module @bhumika/bhasha/utils
 */

/**
 * Merge singular and plural references into a single array
 * Handles the common pattern of supporting both `expectation` and `expectations` parameters
 *
 * @param singular - Single reference (optional)
 * @param plural - Array of references (optional)
 * @returns Merged array of references
 *
 * @example
 * ```typescript
 * // With singular only
 * mergeReferences(ValidFormatBehavior, undefined) // => [ValidFormatBehavior]
 *
 * // With plural only
 * mergeReferences(undefined, [ValidFormatBehavior, ValidatePositiveBehavior])
 * // => [ValidFormatBehavior, ValidatePositiveBehavior]
 *
 * // With both (merged)
 * mergeReferences(ValidFormatBehavior, [ValidatePositiveBehavior])
 * // => [ValidFormatBehavior, ValidatePositiveBehavior]
 *
 * // With neither
 * mergeReferences(undefined, undefined) // => []
 * ```
 */
export function mergeReferences<T>(
  singular?: T,
  plural?: T[]
): T[] {
  const result: T[] = [];

  if (singular !== undefined) {
    result.push(singular);
  }

  if (plural !== undefined && Array.isArray(plural)) {
    result.push(...plural);
  }

  return result;
}

/**
 * Validate that at least one reference was provided
 * Throws an error if both singular and plural are empty
 *
 * @param singular - Single reference (optional)
 * @param plural - Array of references (optional)
 * @param singularName - Name of singular parameter (for error message)
 * @param pluralName - Name of plural parameter (for error message)
 * @param decoratorName - Name of decorator (for error message)
 * @param targetName - Name of target (for error message)
 * @throws Error if both singular and plural are empty
 *
 * @example
 * ```typescript
 * // Validates successfully
 * validateAtLeastOne(ValidFormatBehavior, undefined, 'test', 'tests', '@Behavior', 'ValidateFormat')
 *
 * // Throws error
 * validateAtLeastOne(undefined, undefined, 'test', 'tests', '@Behavior', 'ValidateFormat')
 * // Error: @Behavior "ValidateFormat": At least one test/tests is required
 * ```
 */
export function validateAtLeastOne<T>(
  singular: T | undefined,
  plural: T[] | undefined,
  singularName: string,
  pluralName: string,
  decoratorName: string,
  targetName: string
): void {
  const hasValue = singular !== undefined || (plural !== undefined && plural.length > 0);

  if (!hasValue) {
    throw new Error(
      `${decoratorName} "${targetName}": At least one ${singularName}/${pluralName} is required`
    );
  }
}
