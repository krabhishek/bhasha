/**
 * Journey Registry
 * Singleton registry for all journeys with semantic discovery
 * @module @bhumika/bhasha/decorators/journey
 */

import type { JourneyMetadata } from '../../types/decorator-metadata.types.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Registry entry containing both metadata and constructor
 */
interface JourneyRegistryEntry {
  metadata: JourneyMetadata;
  constructor: Constructor;
}

/**
 * JourneyRegistry - Singleton registry for all journeys
 *
 * Provides:
 * - Registration and lookup by slug, name, or stakeholder
 * - Journey-wide queries and statistics
 * - Stakeholder journey tracking
 *
 * @example
 * ```typescript
 * const registry = JourneyRegistry.getInstance();
 *
 * // Get journey by slug
 * const journey = registry.getBySlug('deposit-money');
 *
 * // Get all journeys for a stakeholder
 * const journeys = registry.getByStakeholder('Account Owner');
 *
 * // Get critical journeys
 * const critical = registry.getCritical();
 * ```
 */
export class JourneyRegistry {
  private static instance: JourneyRegistry;

  /**
   * Map of journey slug -> registry entry
   */
  private readonly journeysBySlug = new Map<string, JourneyRegistryEntry>();

  /**
   * Map of journey name -> registry entry
   */
  private readonly journeysByName = new Map<string, JourneyRegistryEntry>();

  /**
   * Map of primary stakeholder -> array of journey slugs
   */
  private readonly journeysByStakeholder = new Map<string, string[]>();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): JourneyRegistry {
    if (!JourneyRegistry.instance) {
      JourneyRegistry.instance = new JourneyRegistry();
    }
    return JourneyRegistry.instance;
  }

  /**
   * Register journey in the registry
   * Called automatically by @Journey decorator
   *
   * @param metadata - Journey metadata
   * @param constructor - Journey class constructor
   * @throws Error if journey with same slug already exists
   */
  public register(metadata: JourneyMetadata, constructor: Constructor): void {
    const { slug, name, primaryStakeholder } = metadata;

    // Ensure slug is present
    if (!slug) {
      throw new Error(
        `@Journey: slug is required but was not provided for "${name}"`
      );
    }

    // Check for duplicates by slug
    if (this.journeysBySlug.has(slug)) {
      throw new Error(
        `@Journey "${slug}": Journey with this slug already exists. ` +
          `Journey slugs must be unique.`
      );
    }

    // Store in main registries
    const entry: JourneyRegistryEntry = { metadata, constructor };
    this.journeysBySlug.set(slug, entry);
    this.journeysByName.set(name, entry);

    // Index by primary stakeholder
    if (primaryStakeholder) {
      const stakeholderIndex =
        this.journeysByStakeholder.get(primaryStakeholder) || [];
      stakeholderIndex.push(slug);
      this.journeysByStakeholder.set(primaryStakeholder, stakeholderIndex);
    }
  }

  /**
   * Get journey by slug
   * @param slug - Journey slug
   * @returns Registry entry or undefined
   */
  public getBySlug(slug: string): JourneyRegistryEntry | undefined {
    return this.journeysBySlug.get(slug);
  }

  /**
   * Get journey by name
   * @param name - Journey name
   * @returns Registry entry or undefined
   */
  public getByName(name: string): JourneyRegistryEntry | undefined {
    return this.journeysByName.get(name);
  }

  /**
   * Get all journeys for a specific stakeholder
   * @param stakeholder - Primary stakeholder name
   * @returns Array of journey entries
   */
  public getByStakeholder(stakeholder: string): JourneyRegistryEntry[] {
    const slugs = this.journeysByStakeholder.get(stakeholder) || [];
    return slugs
      .map((slug) => this.journeysBySlug.get(slug))
      .filter((entry): entry is JourneyRegistryEntry => entry !== undefined);
  }

  /**
   * Get all critical journeys (criticalPath = true)
   * @returns Array of critical journey entries
   */
  public getCritical(): JourneyRegistryEntry[] {
    const allJourneys = Array.from(this.journeysBySlug.values());
    return allJourneys.filter((entry) => entry.metadata.criticalPath === true);
  }

  /**
   * Get journeys by context
   * @param context - Bounded context name
   * @returns Array of journey entries in this context
   */
  public getByContext(context: string): JourneyRegistryEntry[] {
    const allJourneys = Array.from(this.journeysBySlug.values());
    return allJourneys.filter((entry) => entry.metadata.context === context);
  }

  /**
   * Get all registered journeys
   * @returns Array of all journey entries
   */
  public getAll(): JourneyRegistryEntry[] {
    return Array.from(this.journeysBySlug.values());
  }

  /**
   * Get all journey slugs
   * @returns Array of journey slugs
   */
  public getAllSlugs(): string[] {
    return Array.from(this.journeysBySlug.keys());
  }

  /**
   * Get all stakeholders who have journeys
   * @returns Array of stakeholder names
   */
  public getAllStakeholders(): string[] {
    return Array.from(this.journeysByStakeholder.keys());
  }

  /**
   * Get all detours for a specific journey
   * @param journeySlug - Journey slug
   * @returns Array of journey references (detours) or undefined if journey not found
   */
  public getDetours(journeySlug: string): import('../../types/decorator-metadata.types.js').JourneyReference[] | undefined {
    const entry = this.journeysBySlug.get(journeySlug);
    return entry?.metadata.detours;
  }

  /**
   * Get main path milestones (excluding detours) for a journey
   * @param journeySlug - Journey slug
   * @returns Array of milestone references in order, or undefined if journey not found
   */
  public getMainPath(journeySlug: string): import('../../types/decorator-metadata.types.js').MilestoneReference[] | undefined {
    const entry = this.journeysBySlug.get(journeySlug);
    if (!entry?.metadata.milestones) {
      return undefined;
    }

    // Return only milestones (not detours), sorted by order
    return [...entry.metadata.milestones].sort((a, b) => a.order - b.order);
  }

  /**
   * Get full path including main milestones and detours, sorted by order
   * @param journeySlug - Journey slug
   * @returns Array of milestones and detours sorted by order, or undefined if journey not found
   */
  public getFullPath(journeySlug: string): Array<
    | { type: 'milestone'; data: import('../../types/decorator-metadata.types.js').MilestoneReference }
    | { type: 'detour'; data: import('../../types/decorator-metadata.types.js').JourneyReference }
  > | undefined {
    const entry = this.journeysBySlug.get(journeySlug);
    if (!entry) {
      return undefined;
    }

    const path: Array<
      | { type: 'milestone'; data: import('../../types/decorator-metadata.types.js').MilestoneReference }
      | { type: 'detour'; data: import('../../types/decorator-metadata.types.js').JourneyReference }
    > = [];

    // Add milestones
    if (entry.metadata.milestones) {
      for (const milestone of entry.metadata.milestones) {
        path.push({ type: 'milestone', data: milestone });
      }
    }

    // Add detours
    if (entry.metadata.detours) {
      for (const detour of entry.metadata.detours) {
        path.push({ type: 'detour', data: detour });
      }
    }

    // Sort by order
    return path.sort((a, b) => a.data.order - b.data.order);
  }

  /**
   * Validate detour graph for a journey
   * Checks for circular dependencies, unreachable detours, etc.
   * @param journeySlug - Journey slug
   * @returns Validation result with any errors or warnings
   */
  public validateDetourGraph(journeySlug: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const entry = this.journeysBySlug.get(journeySlug);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!entry) {
      errors.push(`Journey "${journeySlug}" not found in registry`);
      return { valid: false, errors, warnings };
    }

    const { metadata } = entry;
    const { detours, milestones } = metadata;

    // No detours = valid by default
    if (!detours || detours.length === 0) {
      return { valid: true, errors, warnings };
    }

    // Check if detours reference valid sub-journeys
    for (const detour of detours) {
      // If it's a string, assume it's a slug, otherwise get metadata from the class
      let detourEntry: JourneyRegistryEntry | undefined;
      let detourIdentifier: string;

      if (typeof detour.journey === 'string') {
        // String reference - try as slug first, then as name
        detourIdentifier = detour.journey;
        detourEntry = this.getBySlug(detour.journey) || this.getByName(detour.journey);
      } else {
        // Class reference - need to find by matching constructor
        detourIdentifier = detour.journey.name;
        // Search all journeys for one with matching constructor
        const allJourneys = Array.from(this.journeysBySlug.values());
        detourEntry = allJourneys.find(entry => entry.constructor === detour.journey);
      }

      if (!detourEntry) {
        warnings.push(
          `Detour "${detour.label || detourIdentifier}" references journey "${detourIdentifier}" ` +
          `which is not yet registered. Make sure to import and register the detour journey.`
        );
      } else if (!detourEntry.metadata.isDetour) {
        warnings.push(
          `Journey "${detourEntry.metadata.name}" is used as a detour but is not marked with isDetour: true. ` +
          `Consider marking detour journeys explicitly.`
        );
      }
    }

    // Check for overlapping detour orders
    const detourOrders = detours.map(d => d.order);
    const uniqueOrders = new Set(detourOrders);
    if (detourOrders.length !== uniqueOrders.size) {
      errors.push('Duplicate detour orders detected');
    }

    // Check that detours fall between valid milestones
    if (milestones && milestones.length > 0) {
      const milestoneOrders = milestones.map(m => m.order).sort((a, b) => a - b);
      const minOrder = Math.min(...milestoneOrders);
      const maxOrder = Math.max(...milestoneOrders);

      for (const detour of detours) {
        if (detour.order < minOrder || detour.order > maxOrder) {
          warnings.push(
            `Detour "${detour.label || 'Unnamed'}" order ${detour.order} falls outside milestone range [${minOrder}, ${maxOrder}]`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get all journeys marked as detours
   * @returns Array of detour journey entries
   */
  public getDetourJourneys(): JourneyRegistryEntry[] {
    const allJourneys = Array.from(this.journeysBySlug.values());
    return allJourneys.filter((entry) => entry.metadata.isDetour === true);
  }

  /**
   * Get all journeys that use a specific detour
   * @param detourSlug - Slug of the detour journey
   * @returns Array of parent journey entries that use this detour
   */
  public getJourneysUsingDetour(detourSlug: string): JourneyRegistryEntry[] {
    const allJourneys = Array.from(this.journeysBySlug.values());
    const detourEntry = this.getBySlug(detourSlug);

    if (!detourEntry) {
      return [];
    }

    return allJourneys.filter((entry) => {
      if (!entry.metadata.detours) {
        return false;
      }

      return entry.metadata.detours.some((detour) => {
        // Check if this detour references our target detour journey
        if (typeof detour.journey === 'string') {
          // String reference - match against slug or name
          return detour.journey === detourSlug || detour.journey === detourEntry.metadata.name;
        } else {
          // Class reference - match constructor
          return detour.journey === detourEntry.constructor;
        }
      });
    });
  }

  /**
   * Clear all registered journeys (useful for testing)
   */
  public clear(): void {
    this.journeysBySlug.clear();
    this.journeysByName.clear();
    this.journeysByStakeholder.clear();
  }

  /**
   * Get registry statistics
   * @returns Statistics about registered journeys
   */
  public getStats(): {
    totalJourneys: number;
    criticalJourneys: number;
    byStakeholder: Record<string, number>;
    byContext: Record<string, number>;
  } {
    const byStakeholder: Record<string, number> = {};
    for (const [stakeholder, slugs] of this.journeysByStakeholder.entries()) {
      byStakeholder[stakeholder] = slugs.length;
    }

    const byContext: Record<string, number> = {};
    for (const entry of this.journeysBySlug.values()) {
      const context = entry.metadata.context;
      // Context is optional in journey (can be derived from milestones)
      if (context && typeof context === 'string') {
        byContext[context] = (byContext[context] || 0) + 1;
      }
    }

    return {
      totalJourneys: this.journeysBySlug.size,
      criticalJourneys: this.getCritical().length,
      byStakeholder,
      byContext,
    };
  }
}
