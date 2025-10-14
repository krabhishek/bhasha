/**
 * Stakeholder decorator implementation (Stage 3 - Native TypeScript 5.0+)
 * @module @bhumika/bhasha/decorators/stakeholder
 */

import { METADATA_KEYS } from '../../constants/metadata-keys.js';
import type { StakeholderMetadata } from '../../types/decorator-metadata.types.js';
import { StakeholderRegistry, PersonaRegistry } from './registries.js';
import { AttributeRegistry } from '../attribute/registry.js';
import { extractPersonaName } from '../../utils/class-reference.utils.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Stakeholder decorator (Stage 3)
 * Defines a context-specific role that a Persona plays
 *
 * Stakeholders represent WHAT a persona does in a specific bounded context.
 * They reference an underlying persona and add context-specific information
 * like goals, responsibilities, relationships, and permissions.
 *
 * @param options - Stakeholder metadata
 * @returns Stage 3 class decorator
 *
 * @example
 * ```typescript
 * @Stakeholder({
 *   persona: 'TechSavvyMillennial',
 *   role: 'Investor',
 *   context: 'Investment Management',
 *   goals: ['Maximize returns', 'Track portfolio in real-time'],
 *   contextAttributes: {
 *     riskProfile: 'moderate',
 *     investmentLimit: 50000
 *   },
 *   permissions: ['view_portfolio', 'execute_trades']
 * })
 * class InvestorStakeholder {}
 * ```
 */
export function Stakeholder(options: StakeholderMetadata) {
  return function <T extends Constructor>(
    target: T,
    context: ClassDecoratorContext
  ): void {
    // Validate decorator is applied to a class
    if (context.kind !== 'class') {
      throw new Error(`@Stakeholder can only be applied to classes. Applied to: ${context.kind}`);
    }

    // Validation: persona is required
    if (!options.persona) {
      throw new Error(
        `@Stakeholder decorator on "${target.name}" requires a "persona" field. ` +
        `The persona field must reference a registered @Persona.`
      );
    }

    // Validation: role is required
    if (!options.role) {
      throw new Error(
        `@Stakeholder decorator on "${target.name}" requires a "role" field. ` +
        `Example: "Investor", "Bill Payer", "Loan Applicant"`
      );
    }

    // Validation: context is required
    if (!options.context) {
      throw new Error(
        `@Stakeholder decorator on "${target.name}" requires a "context" field. ` +
        `Example: "Investment Management", "Bill Payment", "Lending"`
      );
    }

    // Auto-generate name from role if not provided
    if (!options.name) {
      options.name = options.role;
    }

    // Auto-generate ID from context + role if not provided
    if (!options.id) {
      options.id = generateStakeholderId(options.context, options.role);
    }

    // Initialize arrays if not provided
    if (!options.goals) {
      options.goals = [];
    }

    if (!options.responsibilities) {
      options.responsibilities = [];
    }

    if (!options.permissions) {
      options.permissions = [];
    }

    if (!options.tags) {
      options.tags = [];
    }

    // Initialize objects if not provided
    if (!options.relationships) {
      options.relationships = {};
    }

    if (!options.contextAttributes) {
      options.contextAttributes = {};
    }

    if (!options.extensions) {
      options.extensions = {};
    }

    // Store the original persona reference (could be class or string)
    const personaRef = options.persona;

    // Store metadata using Symbol.metadata
    const metadata = context.metadata as Record<symbol, unknown>;
    metadata[METADATA_KEYS.STAKEHOLDER] = options;

    // Process inline attributes (if provided)
    if (options.attributes && options.attributes.length > 0) {
      metadata[METADATA_KEYS.ATTRIBUTE] = options.attributes;
      AttributeRegistry.registerInline(target, options.attributes);
    }

    // Register in global stakeholder registry after class is defined
    context.addInitializer(function() {
      // Extract persona name from class reference or use string directly
      const personaName = extractPersonaName(personaRef);

      if (!personaName) {
        console.warn(
          `@Stakeholder decorator on "${target.name}": Could not resolve persona reference. ` +
          `Make sure the @Persona decorator is applied and the class is imported.`
        );
      }

      // Update options with resolved persona name (string)
      options.persona = personaName || (typeof personaRef === 'string' ? personaRef : '');

      // Warning: Check if persona is registered (optional validation)
      if (personaName && !PersonaRegistry.has(personaName)) {
        console.warn(
          `@Stakeholder decorator on "${target.name}" references persona "${personaName}", ` +
          `but this persona is not registered. Make sure the @Persona decorator ` +
          `is applied and imported before this stakeholder.`
        );
      }

      StakeholderRegistry.register(options.id!, target, options);
    });
  };
}

/**
 * Generate stakeholder ID from context and role
 * Format: {context-kebab-case}:{role-kebab-case}
 *
 * @param context - Bounded context name
 * @param role - Stakeholder role name
 * @returns Stakeholder ID
 *
 * @example
 * ("Investment Management", "Investor") -> "investment-management:investor"
 * ("Bill Payment", "Bill Payer") -> "bill-payment:bill-payer"
 */
function generateStakeholderId(context: string, role: string): string {
  const contextId = toKebabCase(context);
  const roleId = toKebabCase(role);
  return `${contextId}:${roleId}`;
}

/**
 * Convert string to kebab-case
 * @param str - Input string
 * @returns Kebab-case string
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase -> kebab-case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // ABCDef -> ABC-Def
    .replace(/\s+/g, '-')                 // spaces -> hyphens
    .replace(/[^a-zA-Z0-9-]/g, '')        // remove special chars except hyphens
    .toLowerCase();
}
