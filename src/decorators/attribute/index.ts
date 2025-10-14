/**
 * Attribute decorators and utilities
 * Universal property descriptor for all Bhasha components
 * @module @bhumika/bhasha/decorators/attribute
 */

// Decorator
export {
  Attribute,
  getAttributes,
  hasAttributes,
  getAttribute,
  getRequiredAttributes,
  validateAttributeValue,
  validateAttributes,
} from './attribute.decorator.js';

// Registry
export { AttributeRegistry } from './registry.js';

// Types (re-export from types module)
export type {
  AttributeDefinition,
  AttributeMetadata,
  AttributeValidation,
} from '../../types/decorator-metadata.types.js';
