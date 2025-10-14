# Bhasha

> **Product Management as Code (PMAC)** - A TypeScript DSL for modeling application requirements with the rigor of software engineering

[![npm version](https://img.shields.io/npm/v/@pathakabhishek/bhasha.svg)](https://www.npmjs.com/package/@pathakabhishek/bhasha)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

**Bhasha** is a declarative TypeScript framework that brings the discipline and precision of software engineering to product management. It enables you to model your entire application—from stakeholder personas and user journeys to domain entities and business expectations—as structured, type-safe, testable code.

### What is Product Management as Code (PMAC)?

Traditional product management relies on scattered documents, wikis, and verbal agreements that quickly become outdated. **PMAC** treats product requirements as first-class code:

- **Version controlled** - Track changes, review diffs, and maintain history
- **Type-safe** - Catch errors at compile time, not in production
- **Testable** - Validate requirements with automated tests
- **AI-ready** - Enable AI-assisted development with structured metadata
- **Single source of truth** - All requirements live in code, not disparate documents

## A Pure Modeling Framework

Bhasha is **purely a modeling framework**—it provides no runtime behavior. By leveraging TypeScript's type system and decorator validation, a **successful build represents a logically consistent application model** with a high degree of confidence.

### Compilation = Validation

When your Bhasha model compiles successfully, you gain confidence that:

- ✅ **Type Safety** - All stakeholder references, journey compositions, and expectation contracts are type-checked
- ✅ **Structural Integrity** - Decorators validate required fields, relationships, and constraints at build time
- ✅ **Cross-Reference Consistency** - Stakeholders reference valid personas, expectations reference valid stakeholders, behaviors link to expectations
- ✅ **Context Coherence** - Journey compositions across contexts are validated, ensuring stakeholders from referenced contexts exist
- ✅ **Contract Alignment** - Behavior contracts match expectation requirements (inputs, outputs, SLAs)

### Beyond Traditional Documentation

Unlike traditional documentation in Confluence, wikis, or spreadsheets:

| Traditional Docs | Bhasha Model |
|-----------------|--------------|
| ❌ No validation | ✅ Compile-time validation |
| ❌ References break silently | ✅ Type-checked references |
| ❌ Inconsistencies undetected | ✅ Structural integrity enforced |
| ❌ Manual maintenance | ✅ Refactoring-safe (IDE support) |
| ❌ Scattered across tools | ✅ Single source of truth in code |

### What Bhasha Does NOT Do

- ❌ **No runtime framework** - Bhasha doesn't execute your application
- ❌ **No code generation** - Bhasha models requirements; implementation is separate (though can be AI-generated from the model)
- ❌ **No deployment** - Bhasha is compile-time only

### What You Get

A **validated, type-safe, version-controlled application model** that serves as the single source of truth for:
- Product requirements
- Stakeholder needs
- Domain structure
- Business logic contracts
- Test specifications

With confidence that if it compiles, your model is **logically consistent**.

## AI-Assisted Development with High-Fidelity Context

Bhasha's structured metadata enables AI coding assistants to **discover and understand high-fidelity application context**, leading to better and more robust AI-assisted development.

### How AI Discovers Context

AI can query Bhasha's registries to understand your application at multiple levels:

```typescript
import {
  JourneyRegistry,
  StakeholderRegistry,
  ExpectationRegistry,
  BehaviorRegistry
} from '@pathakabhishek/bhasha';

// AI discovers: "Who are the users?"
const stakeholders = StakeholderRegistry.getAllByContext('Banking');
// Result: Account Owner, Bank Administrator, Fraud Detector

// AI discovers: "What do they need?"
const journey = JourneyRegistry.getBySlug('deposit-money');
const expectations = ExpectationRegistry.getByJourneySlug('deposit-money');
// Result: User expects deposit validation, fraud checking, transaction recording

// AI discovers: "How should it work?"
const behaviors = BehaviorRegistry.getByExpectation('deposit-money-EXP-001');
// Result: Behavior contracts with inputs, outputs, error handling, performance SLAs

// AI discovers: "What's the domain?"
const domainModel = /* Query entity metadata */
// Result: Entities, aggregates, value objects, their relationships
```

### High-Fidelity Context for AI

Traditional development with AI lacks structured context:

**Without Bhasha:**
```
👤 Developer: "Create a deposit validation function"
🤖 AI: "Sure, here's a generic validator..."
❌ AI doesn't know: Who needs it? What are the requirements? What contracts must it satisfy?
```

**With Bhasha:**
```typescript
// AI reads the expectation
@Expectation({
  expectingStakeholder: AccountOwnerStakeholder,
  providingStakeholder: BankingSystemStakeholder,
  description: 'Amount must be positive and within limits',
  behaviors: [ValidateDepositBehavior],
  scenario: {
    given: 'User enters deposit amount',
    when: 'Amount is submitted',
    then: 'System validates amount is positive and within daily limit'
  }
})
class ValidateDepositExpectation {}

// AI reads the behavior contract
@Behavior({
  behaviorContract: {
    type: 'sync',
    inputs: { amount: 'number', accountId: 'string' },
    outputs: { isValid: 'boolean', errors: 'string[]' },
    sla: { maxLatency: '50ms' }
  }
})
class ValidateDepositBehavior {}

👤 Developer: "Implement ValidateDepositBehavior"
🤖 AI: "I'll implement it with the contract requirements..."
✅ AI knows: Who expects it (Account Owner), what it must do (validate positive + limits),
   input/output contracts, performance requirements (50ms), and Given/When/Then scenarios
```

### Benefits for AI-Assisted Development

1. **Context-Aware Code Generation**
   - AI generates code that aligns with stakeholder expectations
   - Implementation follows declared behavior contracts
   - Generated code includes proper error handling based on expectation scenarios

2. **Consistent Implementation Patterns**
   - AI follows existing patterns in your Bhasha model
   - Reuses behaviors, logic components across similar journeys
   - Maintains architectural consistency (DDD patterns, bounded contexts)

3. **Traceability from Requirements to Code**
   - AI-generated code links back to expectations
   - Every behavior ties to a stakeholder need
   - Tests are generated for behavior contracts automatically

4. **Contract Validation**
   - AI validates generated code against behavior contracts (inputs, outputs, SLAs)
   - Type safety ensures implementations match interfaces
   - AI can suggest contract violations before runtime

5. **Living Documentation**
   - AI generates stakeholder-specific documentation from the model
   - User journey diagrams from `@Journey` metadata
   - API docs from behavior contracts
   - Domain diagrams from entity relationships

6. **Robust, Requirement-Aligned Code**
   - Generated code satisfies explicit stakeholder expectations
   - Business logic aligns with domain model
   - Cross-context integrations respect bounded context boundaries

### Model-First AI Development Workflow

```
1. Model Requirements in Bhasha
   ├─ Define personas, stakeholders, contexts
   ├─ Model journeys with milestones
   ├─ Specify expectations with behavior contracts
   └─ Build model → Validate logical consistency ✓

2. AI Discovers Context from Model
   ├─ Queries registries for stakeholders, journeys, expectations
   ├─ Understands domain model (entities, aggregates)
   └─ Reads behavior contracts (inputs, outputs, SLAs)

3. AI Generates Implementation
   ├─ Implements behaviors following contracts
   ├─ Generates tests based on expectation scenarios
   ├─ Creates domain entities with proper DDD patterns
   └─ Links code back to requirements (traceability)

4. Validate & Iterate
   ├─ Run tests (behavior validation)
   ├─ Check contracts (type safety)
   ├─ Update model as requirements evolve
   └─ Rebuild → Re-validate consistency ✓
```

### Why This Matters

Traditional AI-assisted development operates with **low-fidelity context** (natural language descriptions, scattered docs, incomplete information). This leads to:
- ❌ Generic, requirement-misaligned code
- ❌ Missing edge cases and error handling
- ❌ No traceability from requirements to implementation
- ❌ Inconsistent patterns across codebase

Bhasha provides **high-fidelity, structured context** that AI can reliably query, leading to:
- ✅ Requirement-aligned, stakeholder-focused code
- ✅ Complete error handling from expectation scenarios
- ✅ Full traceability (expectation → behavior → test → implementation)
- ✅ Consistent patterns following your domain model

**Result**: More robust, maintainable, and requirement-aligned AI-assisted development.

## Key Concepts

Bhasha enables **composable, context-aware application modeling** where building blocks evolve with context and compose across bounded contexts:

1. **Personas** - WHO your users are (context-free identity: demographics, motivations, behaviors)
2. **Stakeholders** - WHAT roles personas play in specific contexts (context-bound evolution)
3. **Journeys** - HOW stakeholders accomplish goals by composing across contexts
4. **Milestones** - Significant waypoints in a journey (reusable across contexts)
5. **Expectations** - Bilateral contracts between stakeholders (can span contexts)
6. **Behaviors** - HOW expectations are fulfilled (composable implementations)
7. **Domain Models** - Entities, aggregates, value objects using DDD patterns
8. **Logic** - Executable business logic components
9. **Events** - Domain events and event handlers

This **composable context design** enables incremental, enterprise-wide shared context development where the same building blocks adapt and compose across different bounded contexts.

## Features

- ✨ **Declarative API** - Define requirements using intuitive TypeScript decorators
- 🎯 **Type Safety** - Full TypeScript support with modern Stage 3 decorators (no reflect-metadata needed)
- ✅ **Compile-Time Validation** - Successful build = logically consistent model with high confidence
- 🏗️ **Domain-Driven Design** - Built-in support for DDD patterns (aggregates, entities, value objects)
- 🌐 **Composable Context Design** - Build enterprise-wide shared context incrementally with reusable, context-aware components
- 🔗 **Traceability** - Link journeys, expectations, behaviors, and tests
- 📊 **Metadata Extraction** - Programmatic access to all requirements via registries
- 🤖 **High-Fidelity AI Context** - AI discovers structured context for robust, requirement-aligned code generation (see detailed section below)
- 🧪 **Test Integration** - Link tests to behaviors and expectations

## Installation

```bash
npm install @pathakabhishek/bhasha
```

**Requirements:**
- TypeScript 5.0 or higher
- `experimentalDecorators: false` in tsconfig.json (uses native Stage 3 decorators)

## Quick Start

Here's a simple example modeling a banking deposit journey:

```typescript
import {
  Persona,
  PersonaType,
  Stakeholder,
  Journey,
  Milestone,
  Expectation,
  Behavior
} from '@pathakabhishek/bhasha';

// Define WHO the user is
@Persona({
  type: PersonaType.Human,
  name: 'Tech-Savvy Millennial',
  demographics: {
    ageRange: '25-35',
    techSavviness: 'high'
  },
  motivations: ['Financial independence', 'Convenient banking']
})
class TechSavvyMillennial {}

// Define WHAT role they play in this context
@Stakeholder({
  persona: TechSavvyMillennial,
  role: 'Account Owner',
  context: 'Banking',
  goals: ['Deposit money securely', 'Track transactions']
})
class AccountOwnerStakeholder {}

// Define the System stakeholder
@Stakeholder({
  persona: 'System',
  role: 'Banking System',
  context: 'Banking'
})
class BankingSystemStakeholder {}

// Define a behavior (HOW to fulfill the expectation)
@Behavior({
  name: 'Validate Positive Amount',
  behaviorContract: {
    type: 'sync',
    inputs: { amount: 'number' },
    outputs: { isValid: 'boolean' }
  }
})
class ValidatePositiveAmountBehavior {
  execute(amount: number): boolean {
    return amount > 0;
  }
}

// Define a user journey
@Journey({
  name: 'Deposit Money',
  primaryStakeholder: AccountOwnerStakeholder,
  slug: 'deposit-money',
  outcomes: ['Money deposited', 'Balance updated'],
  description: 'Account owner deposits money into their account'
})
class DepositMoneyJourney {}

// Define a milestone in the journey
@Milestone({
  journey: DepositMoneyJourney,
  stakeholder: BankingSystemStakeholder,
  order: 1,
  name: 'Amount Validated',
  businessEvent: 'amount.validated'
})
class AmountValidatedMilestone {}

// Define an expectation (contract between stakeholders)
@Expectation({
  expectingStakeholder: AccountOwnerStakeholder,
  providingStakeholder: BankingSystemStakeholder,
  description: 'Amount must be positive',
  journeySlug: 'deposit-money',
  milestone: AmountValidatedMilestone,
  behaviors: [ValidatePositiveAmountBehavior]
})
class PositiveAmountExpectation {}
```

## Core Concepts

### Personas - WHO

Personas represent the intrinsic identity of actors, independent of any context.

```typescript
@Persona({
  type: PersonaType.Human,
  name: 'Tech-Savvy Millennial',
  demographics: {
    ageRange: '25-35',
    location: 'Urban',
    occupation: 'Software Engineer'
  },
  behaviors: {
    techSavviness: 'high',
    riskTolerance: 'medium'
  },
  motivations: [
    'Financial independence',
    'Work-life balance'
  ],
  painPoints: [
    'Slow traditional banking',
    'Lack of real-time insights'
  ]
})
class TechSavvyMillennial {}
```

**Persona Types:**
- `PersonaType.Human` - Individual users
- `PersonaType.Organization` - Companies, institutions
- `PersonaType.Group` - Teams, departments, user segments
- `PersonaType.System` - Software services, APIs, external systems

### Stakeholders - WHAT (in a Context)

Stakeholders represent roles that personas play in specific bounded contexts.

```typescript
@Stakeholder({
  persona: TechSavvyMillennial,
  role: 'Investor',
  context: 'Investment Management',
  goals: [
    'Maximize returns',
    'Track portfolio in real-time'
  ],
  responsibilities: [
    'Review investment performance',
    'Rebalance portfolio'
  ],
  permissions: ['view_portfolio', 'execute_trades'],
  contextAttributes: {
    riskProfile: 'moderate',
    investmentLimit: 50000
  }
})
class InvestorStakeholder {}
```

### Journeys - User Experiences

Journeys represent stakeholder experiences by **composing stakeholders across contexts**. Context emerges from which stakeholders participate, enabling journeys to naturally span multiple bounded contexts.

```typescript
@Journey({
  name: 'Deposit Money',
  primaryStakeholder: AccountOwnerStakeholder,
  slug: 'deposit-money',
  participatingStakeholders: [
    AccountOwnerStakeholder,        // Banking context
    BankingSystemStakeholder,       // Banking context
    FraudDetectionStakeholder       // Security context - spans contexts!
  ],
  outcomes: [
    'Money deposited',
    'Balance updated',
    'Transaction recorded'
  ],
  milestones: [
    { milestone: AuthenticationMilestone, order: 1 },
    { milestone: AmountValidatedMilestone, order: 2 },
    { milestone: TransactionProcessedMilestone, order: 3 }
  ],
  triggeringEvent: 'deposit.initiated',
  description: 'Account owner deposits money into their account'
})
class DepositMoneyJourney {}
```

**Key Insight**: The journey doesn't declare a single context. Instead, it composes stakeholders from different contexts (Banking, Security), and the journey naturally orchestrates across these contexts.

**Journey Patterns:**

**Pattern 1: Declarative Milestones (Recommended)**
```typescript
@Journey({
  primaryStakeholder: AccountOwnerStakeholder,
  milestones: [
    { milestone: AuthenticationMilestone, order: 1 },
    { milestone: AmountValidatedMilestone, order: 2 }
  ]
})
class DepositMoneyJourney {}
```

**Pattern 2: Inline Milestones**
```typescript
@Journey({ primaryStakeholder: AccountOwnerStakeholder })
class SimpleJourney {
  @Milestone({ stakeholder: AccountOwnerStakeholder, order: 1 })
  authenticate() {}
}
```

**Pattern 3: Detour Journeys** (for alternative flows)
```typescript
@Journey({
  primaryStakeholder: CustomerStakeholder,
  milestones: [
    { milestone: CheckBalanceMilestone, order: 1 },
    { milestone: ProcessPaymentMilestone, order: 2 }
  ],
  detours: [
    {
      journey: InsufficientFundsJourney,
      order: 1.5, // Fractional order = detour
      triggeredAfter: CheckBalanceMilestone,
      triggeredBy: 'balance < amount',
      rejoinsAt: 2
    }
  ]
})
class MakePaymentJourney {}
```

### Milestones - Significant Waypoints

Milestones represent business-significant points in a journey.

```typescript
@Milestone({
  journey: DepositMoneyJourney,
  stakeholder: BankingSystemStakeholder,
  order: 2,
  name: 'Amount Validated',
  businessEvent: 'amount.validated',
  stateful: true,
  description: 'System validates deposit amount meets requirements',
  steps: [
    { step: ValidateFormatStep, order: 1 },
    { step: ValidatePositiveStep, order: 2 },
    { step: ValidateLimitsStep, order: 3 }
  ]
})
class AmountValidatedMilestone {}
```

### Expectations - Bilateral Contracts

Expectations represent contracts between two stakeholders: one who expects (consumer) and one who provides (provider).

```typescript
@Expectation({
  expectingStakeholder: AccountOwnerStakeholder, // Consumer
  providingStakeholder: BankingSystemStakeholder, // Provider
  description: 'Deposit amount must be positive',
  journeySlug: 'deposit-money',
  milestone: AmountValidatedMilestone,
  priority: ExpectationPriority.High,
  criticalPath: true,
  behaviors: [
    ValidateFormatBehavior,
    ValidatePositiveBehavior
  ],
  scenario: {
    given: 'User enters deposit amount',
    when: 'Amount is submitted',
    then: 'System validates amount is positive number'
  }
})
class PositiveAmountExpectation {}
```

**Inline Expectations** (within milestones):
```typescript
@Milestone({
  journey: DepositMoneyJourney,
  stakeholder: BankingSystemStakeholder,
  order: 1
})
class AmountValidatedMilestone {
  @Expectation({
    expectingStakeholder: AccountOwnerStakeholder,
    providingStakeholder: BankingSystemStakeholder,
    behaviors: [ValidateFormatBehavior]
  })
  positiveAmount() {} // Auto-inherits milestone and journey context
}
```

### Behaviors - Implementation Contracts

Behaviors define HOW expectations are fulfilled.

```typescript
@Behavior({
  name: 'Validate Positive Amount',
  behaviorContract: {
    type: 'sync',
    inputs: { amount: 'number' },
    outputs: { isValid: 'boolean', error?: 'string' },
    sla: {
      maxLatency: '50ms',
      availability: '99.9%'
    }
  },
  executionMode: 'immediate',
  errorHandling: {
    strategy: 'fail-fast'
  },
  performance: {
    timeout: '100ms',
    caching: true
  },
  context: 'Banking',
  tests: [ValidatePositiveAmountTests],
  description: 'Validates that amount is a positive number'
})
class ValidatePositiveAmountBehavior implements IExecutableLogic<number, boolean> {
  execute(amount: number): boolean {
    return amount > 0;
  }
}
```

### Domain Models - DDD Patterns

Bhasha provides base classes for Domain-Driven Design patterns:

**Entities** (identity-based equality):
```typescript
import { BaseEntity } from '@pathakabhishek/bhasha';

class Order extends BaseEntity<string> {
  id: string;
  customerId: string;
  total: number;

  constructor(id: string, customerId: string, total: number) {
    super();
    this.id = id;
    this.customerId = customerId;
    this.total = total;
  }
}
```

**Value Objects** (structural equality):
```typescript
import { BaseValueObject } from '@pathakabhishek/bhasha';

class Money extends BaseValueObject {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    super();
  }

  protected getEqualityComponents(): unknown[] {
    return [this.amount, this.currency];
  }
}
```

**Aggregate Roots** (consistency boundaries):
```typescript
import { BaseAggregateRoot } from '@pathakabhishek/bhasha';

class Order extends BaseAggregateRoot<string> {
  id: string;
  items: OrderItem[] = [];

  addItem(item: OrderItem): void {
    this.items.push(item);
    this.addDomainEvent(new OrderItemAddedEvent(this.id, item));
  }
}
```

### Logic Components

The `@Logic` decorator categorizes executable business logic:

```typescript
@Logic({
  type: 'validation',
  inputs: { email: 'string' },
  outputs: { isValid: 'boolean' },
  pure: true,
  cacheable: true
})
class ValidateEmailLogic implements IExecutableLogic<string, boolean> {
  execute(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

**Logic Types:**
- `validation` - Input validation
- `transformation` - Data transformation
- `calculation` - Business calculations
- `orchestration` - Coordination of multiple logic components
- `behavior` - Implementation of stakeholder expectations
- `query` - Data retrieval
- `command` - State-changing operations

**Orchestration Example:**
```typescript
@Logic({
  type: 'orchestration',
  composedOf: [
    { logic: ValidateInputLogic },
    { logic: ProcessDataLogic },
    { logic: SaveResultLogic }
  ],
  strategy: 'sequence'
})
class ProcessOrderLogic implements IExecutableLogic<Order, OrderResult> {
  execute(order: Order): OrderResult {
    // Orchestration implementation
  }
}
```

### Domain Events

Model domain events and their handlers:

```typescript
@DomainEvent({
  name: 'Order Placed',
  eventType: 'order.placed',
  version: 1,
  schema: {
    orderId: 'string',
    customerId: 'string',
    total: 'number'
  }
})
class OrderPlacedEvent implements IDomainEvent {
  eventType = 'order.placed';
  occurredAt: Date = new Date();

  constructor(
    public orderId: string,
    public customerId: string,
    public total: number
  ) {}
}

@EventHandler({
  eventType: 'order.placed',
  context: 'Notifications'
})
class SendOrderConfirmationHandler {
  async handle(event: OrderPlacedEvent): Promise<void> {
    // Send confirmation email
  }
}
```

## Architecture

### Composable Context Design

Bhasha embraces a **composable context design** where building blocks are explicitly context-aware but compose freely across bounded contexts:

**Core Principles:**

1. **Context is Explicit** - Stakeholders require a `context` field, making context a first-class concern
2. **Building Blocks Evolve** - Same persona evolves into different stakeholders in different contexts
3. **Journeys Compose Contexts** - Journeys orchestrate stakeholders from multiple contexts without prescribing a single context
4. **Incremental Development** - Add new contexts without modifying existing ones

**How Components Compose:**

- **Personas** (context-free) → evolve into → **Stakeholders** (context-bound)
  ```typescript
  // One persona, multiple contexts
  TechSavvyMillennial → banking:account-owner
                      → investments:investor
                      → lending:loan-applicant
  ```

- **Journeys** don't declare context; they **compose** stakeholders from any context
  ```typescript
  // Journey spanning Banking + Security + Compliance contexts
  @Journey({
    participatingStakeholders: [
      BankingAccountOwner,      // banking:account-owner
      FraudDetector,            // security:fraud-detector
      ComplianceValidator       // compliance:validator
    ]
  })
  ```

- **Expectations** can span contexts (cross-context contracts)
  ```typescript
  @Expectation({
    expectingStakeholder: CustomerStakeholder,  // Banking context
    providingStakeholder: PaymentGateway        // Payments context
  })
  ```

- **Milestones, Behaviors, Logic** - Reusable across contexts and journeys

**Enterprise-Wide Shared Context:**

This design enables building a shared enterprise context incrementally:

1. **Start with one bounded context** (e.g., Banking)
2. **Add contexts independently** (Payments, Lending, Investments)
3. **Compose across contexts** - Journeys naturally orchestrate multiple contexts
4. **Share building blocks** - Same personas, milestones, behaviors reused
5. **Evolve organically** - New contexts integrate without breaking existing ones

**Benefits:**

- ✅ **Flexibility** - Journeys naturally span contexts through stakeholder composition
- ✅ **Reusability** - Components (milestones, behaviors) shared across contexts
- ✅ **Context Clarity** - Explicit context attribution for stakeholders
- ✅ **Scalability** - Add contexts incrementally as enterprise needs grow
- ✅ **Traceability** - Clear relationships between contexts via stakeholder composition

### Metadata & Registries

All decorated components register themselves in type-safe registries:

```typescript
import {
  JourneyRegistry,
  StakeholderRegistry,
  ExpectationRegistry
} from '@pathakabhishek/bhasha';

// Query journeys
const registry = JourneyRegistry.getInstance();
const journey = registry.getBySlug('deposit-money');

// Query stakeholders
const stakeholders = StakeholderRegistry.getAllByContext('Banking');

// Query expectations
const expectations = ExpectationRegistry.getByJourneySlug('deposit-money');
```

This enables:
- **Code generation** - Generate tests, docs, diagrams from metadata
- **Validation** - Ensure consistency across requirements
- **Discovery** - Find components by various criteria
- **AI assistance** - Structured metadata for LLM-based development

## API Reference

### Decorators

#### Stakeholder Decorators
- `@Persona` - Define WHO an actor is (context-free)
- `@Stakeholder` - Define WHAT role a persona plays in a context

#### Journey Decorators
- `@Journey` - Define a user journey
- `@Milestone` - Define significant waypoints
- `@Step` - Define granular actions within milestones

#### Contract Decorators
- `@Expectation` - Define bilateral contracts between stakeholders
- `@Behavior` - Define HOW expectations are fulfilled

#### Domain Decorators
- `@Domain` - Mark classes as domain components
- `@BoundedContext` - Define bounded contexts
- `@ValueObject` - Mark value objects

#### Logic Decorators
- `@Logic` - Mark executable logic components
- `@AttachLogic` - Attach logic to domain entities
- `@Specification` - Define business specifications
- `@Policy` - Define business policies
- `@Rule` - Define business rules

#### Event Decorators
- `@DomainEvent` - Define domain events
- `@EventHandler` - Define event handlers

#### Test Decorators
- `@Test` - Link tests to behaviors and expectations

#### Universal Decorator
- `@Attribute` - Add custom attributes to any component

### Base Classes

- `BaseEntity<TId>` - Base class for entities
- `BaseValueObject` - Base class for value objects
- `BaseAggregateRoot<TId>` - Base class for aggregate roots

### Interfaces

- `IEntity<TId>` - Entity interface
- `IValueObject` - Value object interface
- `IAggregateRoot<TId>` - Aggregate root interface
- `IExecutableLogic<TInput, TOutput>` - Executable logic interface
- `IDomainEvent` - Domain event interface

### Enums

- `PersonaType` - Human | Organization | Group | System
- `ExpectationPriority` - Critical | High | Medium | Low
- `ContextRelationshipType` - Upstream | Downstream | Partnership | Shared

## TypeScript Configuration

Bhasha uses native TypeScript 5.0+ Stage 3 decorators (no `reflect-metadata` required):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false
  }
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the library
npm run build
```

## Use Cases

Bhasha is ideal for:

- 🎯 **Model-Driven Development** - Build changes to the model first, validate consistency, then let AI generate aligned implementations
- 🤖 **High-Fidelity AI-Assisted Development** - Enable AI to discover structured, high-fidelity context for generating robust, requirement-aligned code
- 🧠 **AI-Augmented Product Management** - Let AI understand, validate, and suggest improvements to product requirements from the structured model
- 📋 **Living Documentation** - Self-documenting requirements that stay in sync with code through TypeScript compilation
- 📊 **Automated Documentation Generation** - AI generates stakeholder-specific docs, journey diagrams, and API specifications from the model
- 🔍 **Requirements Traceability** - Full traceability from stakeholder expectations → behaviors → tests → implementation
- 🏗️ **Domain Modeling** - Apply DDD principles systematically with validated aggregates, entities, and bounded contexts
- ✅ **Requirement Validation** - Catch inconsistencies, broken references, and contract mismatches at compile time
- 📝 **Compliance & Audit** - Demonstrate requirement coverage with traceable, validated models
- 🚀 **Developer Onboarding** - New team members query registries to understand stakeholders, journeys, and domain structure
- 🔄 **Requirement Evolution** - Refactor requirements safely with IDE support (rename, find references, type checking)

## Example: Enterprise-Wide Context Composition

Here's an example showing how the same persona composes across multiple contexts in an enterprise:

```typescript
// ============================================================================
// 1. Define Context-Free Persona
// ============================================================================

@Persona({
  type: PersonaType.Human,
  name: 'Tech-Savvy Millennial',
  demographics: {
    ageRange: '25-35',
    techSavviness: 'high'
  },
  motivations: ['Financial independence', 'Convenience']
})
class TechSavvyMillennial {}

// ============================================================================
// 2. Persona Evolves into Different Stakeholders per Context
// ============================================================================

// Banking Context
@Stakeholder({
  persona: TechSavvyMillennial,
  role: 'Account Owner',
  context: 'Banking',
  goals: ['Manage accounts', 'Transfer money']
})
class BankingAccountOwner {}

// Investment Context
@Stakeholder({
  persona: TechSavvyMillennial,
  role: 'Investor',
  context: 'Investment Management',
  goals: ['Maximize returns', 'Track portfolio']
})
class InvestorStakeholder {}

// Payments Context
@Stakeholder({
  persona: TechSavvyMillennial,
  role: 'Payer',
  context: 'Payments',
  goals: ['Quick checkout', 'Secure payments']
})
class PayerStakeholder {}

// Security Context (System)
@Stakeholder({
  persona: 'System',
  role: 'Fraud Detector',
  context: 'Security',
  goals: ['Detect fraud', 'Protect customers']
})
class FraudDetectorStakeholder {}

// ============================================================================
// 3. Journey Composes Across Multiple Contexts
// ============================================================================

@Journey({
  name: 'Invest from Bank Account',
  primaryStakeholder: InvestorStakeholder,  // Investment context
  slug: 'invest-from-bank',
  participatingStakeholders: [
    InvestorStakeholder,        // Investment Management context
    BankingAccountOwner,        // Banking context
    PayerStakeholder,           // Payments context
    FraudDetectorStakeholder    // Security context
  ],
  outcomes: [
    'Investment executed',
    'Funds transferred from bank',
    'Fraud checks passed'
  ]
})
class InvestFromBankAccountJourney {}

// ============================================================================
// 4. Cross-Context Expectations
// ============================================================================

@Expectation({
  expectingStakeholder: InvestorStakeholder,     // Investment context
  providingStakeholder: BankingAccountOwner,     // Banking context
  description: 'Sufficient funds available in bank account',
  journeySlug: 'invest-from-bank'
})
class SufficientFundsExpectation {}

@Expectation({
  expectingStakeholder: PayerStakeholder,        // Payments context
  providingStakeholder: FraudDetectorStakeholder, // Security context
  description: 'Transaction cleared by fraud detection',
  journeySlug: 'invest-from-bank'
})
class FraudClearedExpectation {}
```

**Key Insights from this Example:**

1. **One Persona, Multiple Contexts** - `TechSavvyMillennial` evolves into different stakeholders: Account Owner (Banking), Investor (Investments), Payer (Payments)

2. **Journey Spans Contexts** - `InvestFromBankAccountJourney` naturally orchestrates across 4 contexts: Investment Management, Banking, Payments, and Security

3. **Cross-Context Contracts** - Expectations create bilateral contracts between stakeholders in different contexts

4. **Incremental Growth** - Each context (Banking, Investments, Payments, Security) was developed independently, yet they compose seamlessly

5. **Enterprise-Wide Reuse** - The same `TechSavvyMillennial` persona and shared milestones/behaviors are reused across all contexts

## Example: Complete Feature Model

Here's a complete example modeling a money transfer feature:

```typescript
// 1. Define Personas
@Persona({ type: PersonaType.Human, name: 'Customer' })
class CustomerPersona {}

@Persona({ type: PersonaType.System, name: 'Payment System' })
class PaymentSystemPersona {}

// 2. Define Stakeholders
@Stakeholder({
  persona: CustomerPersona,
  role: 'Sender',
  context: 'Payments',
  goals: ['Send money securely']
})
class SenderStakeholder {}

@Stakeholder({
  persona: PaymentSystemPersona,
  role: 'Payment Processor',
  context: 'Payments'
})
class PaymentProcessorStakeholder {}

// 3. Define Journey
@Journey({
  name: 'Transfer Money',
  primaryStakeholder: SenderStakeholder,
  slug: 'transfer-money',
  outcomes: ['Money transferred', 'Recipient notified'],
  milestones: [
    { milestone: ValidateRecipientMilestone, order: 1 },
    { milestone: ValidateAmountMilestone, order: 2 },
    { milestone: ProcessTransferMilestone, order: 3 }
  ]
})
class TransferMoneyJourney {}

// 4. Define Milestones with Expectations
@Milestone({
  journey: TransferMoneyJourney,
  stakeholder: PaymentProcessorStakeholder,
  order: 2,
  businessEvent: 'amount.validated'
})
class ValidateAmountMilestone {
  @Expectation({
    expectingStakeholder: SenderStakeholder,
    providingStakeholder: PaymentProcessorStakeholder,
    description: 'Amount must be within limits',
    behaviors: [CheckLimitsBehavior]
  })
  checkLimits() {}
}

// 5. Define Behaviors
@Behavior({
  behaviorContract: {
    type: 'sync',
    inputs: { amount: 'number', accountId: 'string' },
    outputs: { isValid: 'boolean' }
  },
  tests: [CheckLimitsTests]
})
class CheckLimitsBehavior {
  execute(input: { amount: number; accountId: string }): boolean {
    // Implementation
    return input.amount <= 10000;
  }
}

// 6. Define Domain Models
class Transfer extends BaseAggregateRoot<string> {
  id: string;
  senderId: string;
  recipientId: string;
  amount: Money;
  status: TransferStatus;

  process(): void {
    // Business logic
    this.status = TransferStatus.Processing;
    this.addDomainEvent(new TransferProcessedEvent(this.id));
  }
}

// 7. Define Events
@DomainEvent({
  eventType: 'transfer.processed',
  version: 1
})
class TransferProcessedEvent implements IDomainEvent {
  eventType = 'transfer.processed';
  occurredAt = new Date();

  constructor(public transferId: string) {}
}
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

---

**Built with ❤️ to make AI-assisted product development lifecycle practical and enjoyable for everyone!**
