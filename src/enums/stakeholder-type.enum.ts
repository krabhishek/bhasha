/**
 * Persona and Stakeholder type enumerations
 * @module @bhumika/bhasha/enums
 */

/**
 * Persona type enumeration
 * Defines the fundamental types of entities (context-free)
 */
export enum PersonaType {
  /**
   * Individual human (employee, customer, user, etc.)
   */
  Human = 'human',

  /**
   * Organization (company, institution, government body, etc.)
   */
  Organization = 'organization',

  /**
   * Group (team, department, committee, user segment, etc.)
   */
  Group = 'group',

  /**
   * System (software service, API, database, external system, etc.)
   */
  System = 'system',
}
