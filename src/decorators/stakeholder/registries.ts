/**
 * Global registries for Personas and Stakeholders
 * Allows finding and querying personas and stakeholders across the codebase
 * @module @bhumika/bhasha/decorators/stakeholder
 */

import type { PersonaMetadata, StakeholderMetadata } from '../../types/decorator-metadata.types.js';
import type { PersonaType } from '../../enums/stakeholder-type.enum.js';

// Type alias for class constructors
type Constructor = new (...args: never[]) => unknown;

/**
 * Persona Registry Entry
 */
export interface PersonaRegistryEntry {
  target: Constructor;
  metadata: PersonaMetadata;
}

/**
 * Stakeholder Registry Entry
 */
export interface StakeholderRegistryEntry {
  target: Constructor;
  metadata: StakeholderMetadata;
}

/**
 * Global Persona Registry
 * Stores all registered personas for easy lookup and analysis
 */
class PersonaRegistryClass {
  private personas = new Map<string, PersonaRegistryEntry>();

  /**
   * Register a persona
   * @param name - Persona name
   * @param target - Persona class
   * @param metadata - Persona metadata
   */
  register(name: string, target: Constructor, metadata: PersonaMetadata): void {
    if (this.personas.has(name)) {
      console.warn(
        `Persona "${name}" is already registered. ` +
        `This may indicate duplicate persona definitions.`
      );
    }
    this.personas.set(name, { target, metadata });
  }

  /**
   * Get persona by name
   * @param name - Persona name
   * @returns Persona entry or undefined
   */
  get(name: string): PersonaRegistryEntry | undefined {
    return this.personas.get(name);
  }

  /**
   * Get all personas
   * @returns Map of all personas
   */
  getAll(): Map<string, PersonaRegistryEntry> {
    return new Map(this.personas);
  }

  /**
   * Get personas by type
   * @param type - Persona type to filter by
   * @returns Array of matching personas
   */
  getByType(type: PersonaType): Array<{ name: string } & PersonaRegistryEntry> {
    return Array.from(this.personas.entries())
      .filter(([, { metadata }]) => metadata.type === type)
      .map(([name, entry]) => ({ name, ...entry }));
  }

  /**
   * Get personas by tag
   * @param tag - Tag to filter by
   * @returns Array of matching personas
   */
  getByTag(tag: string): Array<{ name: string } & PersonaRegistryEntry> {
    return Array.from(this.personas.entries())
      .filter(([, { metadata }]) => metadata.tags?.includes(tag))
      .map(([name, entry]) => ({ name, ...entry }));
  }

  /**
   * Check if persona exists
   * @param name - Persona name
   * @returns True if persona is registered
   */
  has(name: string): boolean {
    return this.personas.has(name);
  }

  /**
   * Get all persona names
   * @returns Array of persona names
   */
  getNames(): string[] {
    return Array.from(this.personas.keys());
  }

  /**
   * Get persona count
   * @returns Number of registered personas
   */
  count(): number {
    return this.personas.size;
  }

  /**
   * Clear registry (useful for testing)
   */
  clear(): void {
    this.personas.clear();
  }
}

/**
 * Global Stakeholder Registry
 * Stores all registered stakeholders for easy lookup and analysis
 */
class StakeholderRegistryClass {
  private stakeholders = new Map<string, StakeholderRegistryEntry>();

  /**
   * Register a stakeholder
   * @param id - Stakeholder ID (auto-generated from context + role)
   * @param target - Stakeholder class
   * @param metadata - Stakeholder metadata
   */
  register(id: string, target: Constructor, metadata: StakeholderMetadata): void {
    if (this.stakeholders.has(id)) {
      console.warn(
        `Stakeholder "${id}" is already registered. ` +
        `This may indicate duplicate stakeholder definitions.`
      );
    }
    this.stakeholders.set(id, { target, metadata });
  }

  /**
   * Get stakeholder by ID
   * @param id - Stakeholder ID
   * @returns Stakeholder entry or undefined
   */
  get(id: string): StakeholderRegistryEntry | undefined {
    return this.stakeholders.get(id);
  }

  /**
   * Get all stakeholders
   * @returns Map of all stakeholders
   */
  getAll(): Map<string, StakeholderRegistryEntry> {
    return new Map(this.stakeholders);
  }

  /**
   * Get stakeholders by persona
   * @param personaName - Persona name
   * @returns Array of stakeholders for this persona
   */
  getByPersona(personaName: string): Array<{ id: string } & StakeholderRegistryEntry> {
    return Array.from(this.stakeholders.entries())
      .filter(([, { metadata }]) => metadata.persona === personaName)
      .map(([id, entry]) => ({ id, ...entry }));
  }

  /**
   * Get stakeholders by context
   * @param contextName - Context name
   * @returns Array of stakeholders in this context
   */
  getByContext(contextName: string): Array<{ id: string } & StakeholderRegistryEntry> {
    return Array.from(this.stakeholders.entries())
      .filter(([, { metadata }]) => metadata.context === contextName)
      .map(([id, entry]) => ({ id, ...entry }));
  }

  /**
   * Get stakeholders by role
   * @param roleName - Role name
   * @returns Array of stakeholders with this role
   */
  getByRole(roleName: string): Array<{ id: string } & StakeholderRegistryEntry> {
    return Array.from(this.stakeholders.entries())
      .filter(([, { metadata }]) => metadata.role === roleName)
      .map(([id, entry]) => ({ id, ...entry }));
  }

  /**
   * Get stakeholders by tag
   * @param tag - Tag to filter by
   * @returns Array of matching stakeholders
   */
  getByTag(tag: string): Array<{ id: string } & StakeholderRegistryEntry> {
    return Array.from(this.stakeholders.entries())
      .filter(([, { metadata }]) => metadata.tags?.includes(tag))
      .map(([id, entry]) => ({ id, ...entry }));
  }

  /**
   * Check if stakeholder exists
   * @param id - Stakeholder ID
   * @returns True if stakeholder is registered
   */
  has(id: string): boolean {
    return this.stakeholders.has(id);
  }

  /**
   * Get all stakeholder IDs
   * @returns Array of stakeholder IDs
   */
  getIds(): string[] {
    return Array.from(this.stakeholders.keys());
  }

  /**
   * Get stakeholder count
   * @returns Number of registered stakeholders
   */
  count(): number {
    return this.stakeholders.size;
  }

  /**
   * Clear registry (useful for testing)
   */
  clear(): void {
    this.stakeholders.clear();
  }
}

/**
 * Global Persona Registry instance
 */
export const PersonaRegistry = new PersonaRegistryClass();

/**
 * Global Stakeholder Registry instance
 */
export const StakeholderRegistry = new StakeholderRegistryClass();
