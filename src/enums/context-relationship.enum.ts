/**
 * Bounded context relationship enumeration
 * @module @bhumika/bhasha/enums
 */

/**
 * Relationship types between bounded contexts
 * Based on Domain-Driven Design strategic patterns
 */
export enum ContextRelationshipType {
  /**
   * Upstream context (provides data/services)
   * The upstream context influences the downstream context
   */
  Upstream = 'upstream',

  /**
   * Downstream context (consumes data/services)
   * The downstream context depends on the upstream context
   */
  Downstream = 'downstream',

  /**
   * Partnership (mutual dependency)
   * Two contexts cooperate and depend on each other
   */
  Partnership = 'partnership',

  /**
   * Customer-Supplier (formal dependency)
   * Formal relationship where downstream is the customer
   */
  CustomerSupplier = 'customer-supplier',
}
