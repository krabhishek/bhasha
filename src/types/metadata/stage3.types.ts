/**
 * Stage 3 Decorator Types
 * TypeScript 5.0+ native decorator types and utilities
 * @module @bhumika/bhasha/types/metadata
 */

/**
 * Stage 3 decorator context types
 * Native TypeScript 5.0+ decorator context objects
 */
export type DecoratorContext =
  | ClassDecoratorContext
  | ClassFieldDecoratorContext
  | ClassMethodDecoratorContext
  | ClassGetterDecoratorContext
  | ClassSetterDecoratorContext;

/**
 * Metadata storage using Symbol.metadata
 * Stage 3 decorators store metadata in Symbol.metadata on the class
 */
export interface DecoratorMetadataObject {
  [key: symbol]: unknown;
}

/**
 * Constructor with Symbol.metadata support (Stage 3 decorators)
 * Represents a class constructor that has been decorated with Stage 3 decorators
 */
export interface ConstructorWithMetadata {
  new (...args: never[]): unknown;
  [Symbol.metadata]: DecoratorMetadataObject;
}
