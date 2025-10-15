/**
 * Domain decorators export
 * @module @bhumika/bhasha/decorators/domain
 */

// Decorators
export { BoundedContext } from './bounded-context.decorator.js';
export { Domain } from './domain.decorator.js';
export { ValueObject, isValueObject, getValueObjectMetadata } from './value-object.decorator.js';

// Registries
export { BoundedContextRegistry, DomainRegistry } from './registries.js';
export type { BoundedContextRegistryEntry, DomainRegistryEntry } from './registries.js';
