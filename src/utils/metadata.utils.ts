/**
 * Metadata utilities for working with Stage 3 decorators
 * @module @bhumika/bhasha/utils
 */

import type { MetadataKey } from '../constants/metadata-keys.js';
import type { ConstructorWithMetadata, DecoratorMetadataObject } from '../types/decorator-metadata.types.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Type guard to check if a constructor has Symbol.metadata
 */
function hasSymbolMetadata(target: Constructor): target is ConstructorWithMetadata {
  // Check if Symbol.metadata exists as a property (including non-enumerable)
  return Object.getOwnPropertySymbols(target).includes(Symbol.metadata) ||
         Symbol.metadata in target ||
         Object.prototype.hasOwnProperty.call(target, Symbol.metadata);
}

/**
 * Get metadata object from a constructor (type-safe)
 */
function getMetadataObject(target: Constructor): DecoratorMetadataObject | undefined {
  if (hasSymbolMetadata(target)) {
    return target[Symbol.metadata];
  }
  return undefined;
}

/**
 * Get metadata from a class using Symbol.metadata (Stage 3)
 * @param metadataKey - Symbol key for the metadata
 * @param target - Target class constructor
 * @returns Metadata or undefined if not found
 *
 * @example
 * ```typescript
 * const journeyMetadata = getMetadata<JourneyMetadata>(
 *   METADATA_KEYS.JOURNEY,
 *   PlaceOrderJourney
 * );
 * ```
 */
export function getMetadata<T>(
  metadataKey: MetadataKey,
  target: Constructor
): T | undefined {
  const metadata = getMetadataObject(target);
  return metadata?.[metadataKey] as T | undefined;
}

/**
 * Set metadata on a class using Symbol.metadata (Stage 3)
 * Note: This is typically not needed as decorators set metadata directly.
 * This utility is provided for advanced use cases or testing.
 *
 * @param metadataKey - Symbol key for the metadata
 * @param value - Metadata to store
 * @param target - Target class constructor
 *
 * @example
 * ```typescript
 * setMetadata(
 *   METADATA_KEYS.JOURNEY,
 *   { name: 'Place Order', code: 'PO' },
 *   PlaceOrderJourney
 * );
 * ```
 */
export function setMetadata<T>(
  metadataKey: MetadataKey,
  value: T,
  target: Constructor
): void {
  let metadata = getMetadataObject(target);

  // If Symbol.metadata doesn't exist on the constructor, create it
  if (!metadata) {
    if (typeof Symbol.metadata !== 'undefined') {
      // Create the metadata object if Symbol.metadata exists globally
      metadata = {};
      (target as ConstructorWithMetadata)[Symbol.metadata] = metadata;
    } else {
      console.warn(
        `Cannot set metadata on ${target.name}: Symbol.metadata is not available. ` +
        `Make sure the class is decorated with a Stage 3 decorator.`
      );
      return;
    }
  }

  metadata[metadataKey] = value;
}

/**
 * Check if target has specific metadata
 * @param metadataKey - Symbol key for the metadata
 * @param target - Target class constructor
 * @returns True if metadata exists
 *
 * @example
 * ```typescript
 * if (hasMetadata(METADATA_KEYS.JOURNEY, PlaceOrderJourney)) {
 *   // This is a Journey class
 * }
 * ```
 */
export function hasMetadata(
  metadataKey: MetadataKey,
  target: Constructor
): boolean {
  const metadata = getMetadataObject(target);
  return metadata ? metadataKey in metadata : false;
}

/**
 * Get all metadata keys attached to a class
 * @param target - Target class constructor
 * @returns Array of metadata keys
 *
 * @example
 * ```typescript
 * const keys = getAllMetadataKeys(PlaceOrderJourney);
 * // Returns: [Symbol(bhasha:journey), Symbol(bhasha:attribute), ...]
 * ```
 */
export function getAllMetadataKeys(target: Constructor): symbol[] {
  const metadata = getMetadataObject(target);
  if (!metadata) {
    return [];
  }

  // Get all symbol keys from the metadata object
  return Object.getOwnPropertySymbols(metadata);
}

/**
 * Check if class is decorated with a Bhasha decorator
 * @param target - Target class
 * @param metadataKey - Metadata key to check
 * @returns True if class has the decorator
 *
 * @example
 * ```typescript
 * if (isDecoratedWith(PlaceOrderJourney, METADATA_KEYS.JOURNEY)) {
 *   // Handle journey class
 * }
 * ```
 */
export function isDecoratedWith(target: Constructor, metadataKey: MetadataKey): boolean {
  return hasMetadata(metadataKey, target);
}

/**
 * Get all metadata from a class as a map
 * @param target - Target class constructor
 * @returns Map of metadata keys to values
 *
 * @example
 * ```typescript
 * const allMetadata = getAllMetadata(PlaceOrderJourney);
 * const journeyMetadata = allMetadata.get(METADATA_KEYS.JOURNEY);
 * ```
 */
export function getAllMetadata(target: Constructor): Map<symbol, unknown> {
  const metadata = getMetadataObject(target);
  const result = new Map<symbol, unknown>();

  if (!metadata) {
    return result;
  }

  const keys = Object.getOwnPropertySymbols(metadata);
  for (const key of keys) {
    result.set(key, metadata[key]);
  }

  return result;
}

/**
 * Copy metadata from source class to target class
 * Useful for class composition or inheritance scenarios
 *
 * @param source - Source class to copy from
 * @param target - Target class to copy to
 * @param keys - Optional array of specific keys to copy (copies all if not specified)
 *
 * @example
 * ```typescript
 * // Copy all metadata
 * copyMetadata(SourceClass, TargetClass);
 *
 * // Copy specific metadata
 * copyMetadata(SourceClass, TargetClass, [METADATA_KEYS.PERSONA]);
 * ```
 */
export function copyMetadata(
  source: Constructor,
  target: Constructor,
  keys?: MetadataKey[]
): void {
  const sourceMetadata = getMetadataObject(source);
  const targetMetadata = getMetadataObject(target);

  if (!sourceMetadata) {
    console.warn(`Cannot copy metadata from ${source.name}: Symbol.metadata is not available.`);
    return;
  }

  if (!targetMetadata) {
    console.warn(`Cannot copy metadata to ${target.name}: Symbol.metadata is not available.`);
    return;
  }

  const keysToCopy = keys || Object.getOwnPropertySymbols(sourceMetadata);

  for (const key of keysToCopy) {
    if (key in sourceMetadata) {
      targetMetadata[key] = sourceMetadata[key];
    }
  }
}

/**
 * Check if a class has any Bhasha decorators
 * @param target - Target class constructor
 * @returns True if class has Symbol.metadata with at least one key
 *
 * @example
 * ```typescript
 * if (isDecorated(SomeClass)) {
 *   // This class has Bhasha decorators
 * }
 * ```
 */
export function isDecorated(target: Constructor): boolean {
  const metadata = getMetadataObject(target);
  if (!metadata) {
    return false;
  }

  const keys = Object.getOwnPropertySymbols(metadata);
  return keys.length > 0;
}
