/**
 * Persona decorator implementation (Stage 3 - Native TypeScript 5.0+)
 * @module @bhumika/bhasha/decorators/stakeholder
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { PersonaMetadata } from '../../types/decorator-metadata.types.js';
import { PersonaType } from '../../enums/stakeholder-type.enum.js';
import { PersonaRegistry } from './registries.js';
import { AttributeRegistry } from '../attribute/registry.js';

// Type alias for class constructors
type Constructor = new (...args: never[]) => unknown;

/**
 * Persona decorator (Stage 3)
 * Defines a context-free persona (WHO someone/something is fundamentally)
 *
 * Personas represent the intrinsic identity and characteristics of actors
 * independent of any specific context or role. They describe WHO the actor is,
 * their demographics, behaviors, motivations, and pain points.
 *
 * @param options - Persona metadata
 * @returns Stage 3 class decorator
 *
 * @example
 * ```typescript
 * @Persona({
 *   type: PersonaType.Human,
 *   demographics: {
 *     ageRange: '28-35',
 *     location: 'Urban',
 *     occupation: 'Software Engineer'
 *   },
 *   behaviors: {
 *     techSavviness: 'high',
 *     riskTolerance: 'medium'
 *   },
 *   motivations: ['Financial independence', 'Work-life balance'],
 *   quote: "I want my money to work as hard as I do"
 * })
 * class TechSavvyMillennial {}
 * ```
 */
export function Persona(options: PersonaMetadata) {
  return function <T extends Constructor>(
    target: T,
    context: ClassDecoratorContext
  ): void {
    // Validate decorator is applied to a class
    if (context.kind !== 'class') {
      throw new Error(`@Persona can only be applied to classes. Applied to: ${context.kind}`);
    }

    // Validation: Type is required
    if (!options.type) {
      throw new Error(
        `@Persona decorator on "${target.name}" requires a "type" field. ` +
        `Valid types: ${Object.values(PersonaType).join(', ')}`
      );
    }

    // Validation: Type must be valid enum value
    if (!Object.values(PersonaType).includes(options.type)) {
      throw new Error(
        `@Persona decorator on "${target.name}" has invalid type "${options.type}". ` +
        `Valid types: ${Object.values(PersonaType).join(', ')}`
      );
    }

    // Auto-generate name from class name if not provided
    if (!options.name) {
      options.name = target.name;
    }

    // Auto-generate ID from name if not provided
    if (!options.id) {
      options.id = generatePersonaId(options.name);
    }

    // Initialize arrays if not provided
    if (!options.tags) {
      options.tags = [];
    }

    if (!options.motivations) {
      options.motivations = [];
    }

    if (!options.painPoints) {
      options.painPoints = [];
    }

    // Initialize objects if not provided
    if (!options.extensions) {
      options.extensions = {};
    }

    if (!options.characteristics) {
      options.characteristics = {};
    }

    // Store metadata using Symbol.metadata
    const metadata = context.metadata as Record<symbol, unknown>;
    metadata[METADATA_KEYS.PERSONA] = options;

    // Process inline attributes (if provided)
    if (options.attributes && options.attributes.length > 0) {
      metadata[METADATA_KEYS.ATTRIBUTE] = options.attributes;
      AttributeRegistry.registerInline(target, options.attributes);
    }

    // Register in global persona registry after class is defined
    context.addInitializer(function() {
      PersonaRegistry.register(options.name!, target, options);
    });
  };
}

/**
 * Generate persona ID from name
 * Converts name to kebab-case for use as ID
 *
 * @param name - Persona name
 * @returns Kebab-case ID
 *
 * @example
 * "TechSavvyMillennial" -> "tech-savvy-millennial"
 * "OAuth2 Auth Service" -> "oauth2-auth-service"
 */
function generatePersonaId(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase -> kebab-case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // ABCDef -> ABC-Def
    .replace(/\s+/g, '-')                 // spaces -> hyphens
    .replace(/[^a-zA-Z0-9-]/g, '')        // remove special chars except hyphens
    .toLowerCase();
}
