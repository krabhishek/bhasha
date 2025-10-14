/**
 * Naming conventions for AST parsing
 * These patterns help the parser identify component types from files and class names
 * @module @bhumika/bhasha/constants
 */

/**
 * File naming conventions for AST parsing
 * These patterns help identify file types based on filename
 *
 * Example usage by parser:
 * ```typescript
 * if (FILE_PATTERNS.JOURNEY.test(filePath)) {
 *   // This is a journey file
 * }
 * ```
 */
export const FILE_PATTERNS = {
  /**
   * Journey files (e.g., place-order.journey.ts)
   */
  JOURNEY: /\.journey\.ts$/,

  /**
   * Stakeholder files (e.g., customer.stakeholder.ts)
   */
  STAKEHOLDER: /\.stakeholder\.ts$/,

  /**
   * Context files (e.g., order-management.context.ts)
   */
  CONTEXT: /\.context\.ts$/,

  /**
   * Entity files (e.g., order.entity.ts)
   */
  ENTITY: /\.entity\.ts$/,

  /**
   * Value object files (e.g., money.value-object.ts or money.vo.ts)
   */
  VALUE_OBJECT: /\.(value-object|vo)\.ts$/,

  /**
   * Aggregate files (e.g., order.aggregate.ts)
   */
  AGGREGATE: /\.aggregate\.ts$/,

  /**
   * Specification files (e.g., minimum-balance.specification.ts)
   * Note: Avoid .spec.ts as it conflicts with test files
   */
  SPECIFICATION: /\.specification\.ts$/,

  /**
   * Policy files (e.g., refund.policy.ts)
   */
  POLICY: /\.policy\.ts$/,

  /**
   * Rule files (e.g., age-verification.rule.ts)
   */
  RULE: /\.rule\.ts$/,

  /**
   * Service files (e.g., order.service.ts)
   */
  SERVICE: /\.service\.ts$/,

  /**
   * Repository files (e.g., order.repository.ts)
   */
  REPOSITORY: /\.repository\.ts$/,

  /**
   * Factory files (e.g., order.factory.ts)
   */
  FACTORY: /\.factory\.ts$/,

  /**
   * Event files (e.g., order-placed.event.ts)
   */
  EVENT: /\.event\.ts$/,
} as const;

/**
 * Class naming conventions
 * Help identify component types from class names when file patterns aren't enough
 *
 * Example:
 * ```typescript
 * if (CLASS_NAME_PATTERNS.JOURNEY.test(className)) {
 *   // This is likely a Journey class
 * }
 * ```
 */
export const CLASS_NAME_PATTERNS = {
  /**
   * Journey classes (e.g., "PlaceOrderJourney", "UserRegistrationJourney")
   */
  JOURNEY: /Journey$/,

  /**
   * Stakeholder classes (e.g., "CustomerStakeholder", "AdminStakeholder")
   * Note: Stakeholder suffix is optional, can be just "Customer"
   */
  STAKEHOLDER: /(Stakeholder)?$/,

  /**
   * Context classes (e.g., "OrderManagementContext", "PaymentContext")
   */
  CONTEXT: /Context$/,

  /**
   * Entity classes (e.g., "Order", "Customer", "Product")
   * PascalCase with no specific suffix
   */
  ENTITY: /^[A-Z][a-zA-Z0-9]+$/,

  /**
   * Value Object classes (e.g., "Money", "Address", "MoneyVO")
   * Can have optional VO or ValueObject suffix
   */
  VALUE_OBJECT: /(VO|ValueObject)?$/,

  /**
   * Specification classes (e.g., "MinimumBalanceSpec", "AgeRequirementSpecification")
   */
  SPECIFICATION: /(Spec|Specification)$/,

  /**
   * Policy classes (e.g., "RefundPolicy", "PricingPolicy")
   */
  POLICY: /Policy$/,

  /**
   * Rule classes (e.g., "AgeVerificationRule", "EmailFormatRule")
   */
  RULE: /Rule$/,

  /**
   * Service classes (e.g., "OrderService", "PaymentService")
   */
  SERVICE: /Service$/,

  /**
   * Repository classes (e.g., "OrderRepository", "CustomerRepository")
   */
  REPOSITORY: /Repository$/,

  /**
   * Factory classes (e.g., "OrderFactory", "ProductFactory")
   */
  FACTORY: /Factory$/,

  /**
   * Event classes (e.g., "OrderPlacedEvent", "PaymentReceivedEvent")
   */
  EVENT: /Event$/,
} as const;

/**
 * Recommended directory structure
 * Helps organize Bhasha models in a project
 */
export const RECOMMENDED_STRUCTURE = {
  /**
   * Root directory for Bhasha models
   */
  ROOT: 'src/bhasha' as const,

  /**
   * Bounded contexts directory
   */
  CONTEXTS: 'contexts' as const,

  /**
   * Entities directory
   */
  ENTITIES: 'entities' as const,

  /**
   * Value objects directory
   */
  VALUE_OBJECTS: 'value-objects' as const,

  /**
   * Aggregates directory
   */
  AGGREGATES: 'aggregates' as const,

  /**
   * Stakeholders directory
   */
  STAKEHOLDERS: 'stakeholders' as const,

  /**
   * Journeys directory
   */
  JOURNEYS: 'journeys' as const,

  /**
   * Specifications directory
   */
  SPECIFICATIONS: 'specifications' as const,

  /**
   * Policies directory
   */
  POLICIES: 'policies' as const,

  /**
   * Rules directory
   */
  RULES: 'rules' as const,

  /**
   * Services directory
   */
  SERVICES: 'services' as const,

  /**
   * Repositories directory
   */
  REPOSITORIES: 'repositories' as const,

  /**
   * Events directory
   */
  EVENTS: 'events' as const,
} as const;

/**
 * Expectation ID pattern
 * Format: {JOURNEY_CODE}-EXP-{NUMBER}
 * Example: PO-EXP-001, FT-EXP-042
 */
export const EXPECTATION_ID_PATTERN = /^[A-Z]{2,}-EXP-\d{3,}$/;

/**
 * Helper to validate expectation ID format
 * @param id - Expectation ID to validate
 * @returns True if ID follows the pattern
 */
export function isValidExpectationId(id: string): boolean {
  return EXPECTATION_ID_PATTERN.test(id);
}

/**
 * Helper to generate expectation ID
 * @param journeyCode - Journey code (e.g., "PO", "FT")
 * @param number - Expectation number
 * @returns Formatted expectation ID
 */
export function generateExpectationId(journeyCode: string, number: number): string {
  const code = journeyCode.toUpperCase();
  const num = String(number).padStart(3, '0');
  return `${code}-EXP-${num}`;
}
