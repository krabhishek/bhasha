/**
 * Milestone Registry
 * Singleton registry for all milestones with dependency tracking
 * @module @bhumika/bhasha/decorators/milestone
 */

import type { MilestoneMetadata } from '../../types/decorator-metadata.types.js';

/**
 * Type alias for class constructors
 */
type Constructor = new (...args: never[]) => unknown;

/**
 * Registry entry containing both metadata and constructor
 */
interface MilestoneRegistryEntry {
  metadata: MilestoneMetadata;
  constructor: Constructor;
}

/**
 * MilestoneRegistry - Singleton registry for all milestones
 *
 * Provides:
 * - Registration and lookup by name, ID, journey
 * - Milestone dependency tracking (prerequisites)
 * - Journey-milestone relationships
 * - Reusable milestone discovery
 *
 * @example
 * ```typescript
 * const registry = MilestoneRegistry.getInstance();
 *
 * // Get milestone by name
 * const milestone = registry.getByName('UserAuthenticated');
 *
 * // Get all milestones in a journey
 * const milestones = registry.getByJourney('login-journey');
 *
 * // Get reusable milestones
 * const reusable = registry.getReusable();
 *
 * // Check prerequisites
 * const prereqs = registry.getPrerequisites('PaymentAuthorized');
 * ```
 */
export class MilestoneRegistry {
  private static instance: MilestoneRegistry;

  /**
   * Map of milestone name -> registry entry
   */
  private readonly milestonesByName = new Map<string, MilestoneRegistryEntry>();

  /**
   * Map of milestone ID -> registry entry (for standalone milestones)
   */
  private readonly milestonesById = new Map<string, MilestoneRegistryEntry>();

  /**
   * Map of journey slug -> array of milestone names
   */
  private readonly milestonesByJourney = new Map<string, string[]>();

  /**
   * Map of stakeholder -> array of milestone names
   */
  private readonly milestonesByStakeholder = new Map<string, string[]>();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MilestoneRegistry {
    if (!MilestoneRegistry.instance) {
      MilestoneRegistry.instance = new MilestoneRegistry();
    }
    return MilestoneRegistry.instance;
  }

  /**
   * Register milestone in the registry
   * Called automatically by @Milestone decorator
   *
   * @param metadata - Milestone metadata
   * @param constructor - Milestone class constructor
   * @param journeySlug - Optional journey slug (for inline milestones)
   */
  public register(
    metadata: MilestoneMetadata,
    constructor: Constructor,
    journeySlug?: string
  ): void {
    const { name, stakeholder, id } = metadata;

    // Check for duplicates by name
    if (this.milestonesByName.has(name)) {
      console.warn(
        `@Milestone "${name}": Milestone with this name already registered. ` +
          `This may be intentional if the milestone is reusable across journeys.`
      );
    }

    // Store in main registry
    const entry: MilestoneRegistryEntry = { metadata, constructor };
    this.milestonesByName.set(name, entry);

    // Store by ID if provided (standalone milestones)
    if (id) {
      this.milestonesById.set(id, entry);
    }

    // Index by journey (if provided or if this is inline milestone)
    if (journeySlug) {
      const journeyIndex = this.milestonesByJourney.get(journeySlug) || [];
      if (!journeyIndex.includes(name)) {
        journeyIndex.push(name);
        this.milestonesByJourney.set(journeySlug, journeyIndex);
      }
    }

    // Also index by journeys array in metadata (for reusable milestones)
    if (metadata.journeys) {
      for (const journey of metadata.journeys) {
        const journeyIndex = this.milestonesByJourney.get(journey) || [];
        if (!journeyIndex.includes(name)) {
          journeyIndex.push(name);
          this.milestonesByJourney.set(journey, journeyIndex);
        }
      }
    }

    // Index by stakeholder
    if (stakeholder) {
      const stakeholderIndex =
        this.milestonesByStakeholder.get(stakeholder) || [];
      if (!stakeholderIndex.includes(name)) {
        stakeholderIndex.push(name);
        this.milestonesByStakeholder.set(stakeholder, stakeholderIndex);
      }
    }
  }

  /**
   * Get milestone by name
   * @param name - Milestone name
   * @returns Registry entry or undefined
   */
  public getByName(name: string): MilestoneRegistryEntry | undefined {
    return this.milestonesByName.get(name);
  }

  /**
   * Get milestone by ID
   * @param id - Milestone ID
   * @returns Registry entry or undefined
   */
  public getById(id: string): MilestoneRegistryEntry | undefined {
    return this.milestonesById.get(id);
  }

  /**
   * Get all milestones in a journey
   * @param journeySlug - Journey slug
   * @returns Array of milestone entries (ordered if order is specified)
   */
  public getByJourney(journeySlug: string): MilestoneRegistryEntry[] {
    const names = this.milestonesByJourney.get(journeySlug) || [];
    const entries = names
      .map((name) => this.milestonesByName.get(name))
      .filter((entry): entry is MilestoneRegistryEntry => entry !== undefined);

    // Sort by order if specified
    return entries.sort((a, b) => {
      const orderA = a.metadata.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.metadata.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }

  /**
   * Get all milestones for a stakeholder
   * @param stakeholder - Stakeholder name
   * @returns Array of milestone entries
   */
  public getByStakeholder(stakeholder: string): MilestoneRegistryEntry[] {
    const names = this.milestonesByStakeholder.get(stakeholder) || [];
    return names
      .map((name) => this.milestonesByName.get(name))
      .filter((entry): entry is MilestoneRegistryEntry => entry !== undefined);
  }

  /**
   * Get prerequisites for a milestone
   * @param milestoneName - Milestone name
   * @returns Array of prerequisite milestone entries
   */
  public getPrerequisites(milestoneName: string): MilestoneRegistryEntry[] {
    const entry = this.milestonesByName.get(milestoneName);
    if (!entry || !entry.metadata.prerequisites) {
      return [];
    }

    return entry.metadata.prerequisites
      .map((name) => this.milestonesByName.get(name))
      .filter((entry): entry is MilestoneRegistryEntry => entry !== undefined);
  }

  /**
   * Get all reusable milestones
   * @returns Array of reusable milestone entries
   */
  public getReusable(): MilestoneRegistryEntry[] {
    const allMilestones = Array.from(this.milestonesByName.values());
    return allMilestones.filter(
      (entry) => entry.metadata.reusable === true
    );
  }

  /**
   * Get all stateful milestones
   * @returns Array of stateful milestone entries
   */
  public getStateful(): MilestoneRegistryEntry[] {
    const allMilestones = Array.from(this.milestonesByName.values());
    return allMilestones.filter(
      (entry) => entry.metadata.stateful !== false
    );
  }

  /**
   * Check if milestone has circular dependencies in prerequisites
   * @param milestoneName - Milestone name to check
   * @param visited - Set of visited milestone names (used for recursion)
   * @param path - Current dependency path (used for recursion)
   * @returns True if circular dependency detected
   */
  public hasCircularDependency(
    milestoneName: string,
    visited: Set<string> = new Set(),
    path: Set<string> = new Set()
  ): boolean {
    // If we've seen this milestone in the current path, we have a cycle
    if (path.has(milestoneName)) {
      return true;
    }

    // If we've already fully explored this milestone, no need to check again
    if (visited.has(milestoneName)) {
      return false;
    }

    // Mark as visited and add to current path
    visited.add(milestoneName);
    path.add(milestoneName);

    // Check all prerequisites
    const entry = this.milestonesByName.get(milestoneName);
    if (entry && entry.metadata.prerequisites) {
      for (const prereq of entry.metadata.prerequisites) {
        if (this.hasCircularDependency(prereq, visited, path)) {
          return true;
        }
      }
    }

    // Remove from current path (backtrack)
    path.delete(milestoneName);

    return false;
  }

  /**
   * Get all registered milestones
   * @returns Array of all milestone entries
   */
  public getAll(): MilestoneRegistryEntry[] {
    return Array.from(this.milestonesByName.values());
  }

  /**
   * Get all journey slugs that have milestones
   * @returns Array of journey slugs
   */
  public getAllJourneySlugs(): string[] {
    return Array.from(this.milestonesByJourney.keys());
  }

  /**
   * Clear all registered milestones (useful for testing)
   */
  public clear(): void {
    this.milestonesByName.clear();
    this.milestonesById.clear();
    this.milestonesByJourney.clear();
    this.milestonesByStakeholder.clear();
  }

  /**
   * Get registry statistics
   * @returns Statistics about registered milestones
   */
  public getStats(): {
    totalMilestones: number;
    reusableMilestones: number;
    statefulMilestones: number;
    byJourney: Record<string, number>;
    byStakeholder: Record<string, number>;
  } {
    const byJourney: Record<string, number> = {};
    for (const [journey, names] of this.milestonesByJourney.entries()) {
      byJourney[journey] = names.length;
    }

    const byStakeholder: Record<string, number> = {};
    for (const [stakeholder, names] of this.milestonesByStakeholder.entries()) {
      byStakeholder[stakeholder] = names.length;
    }

    return {
      totalMilestones: this.milestonesByName.size,
      reusableMilestones: this.getReusable().length,
      statefulMilestones: this.getStateful().length,
      byJourney,
      byStakeholder,
    };
  }
}
