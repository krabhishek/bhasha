import { describe, it, expect, beforeEach } from 'vitest';
import { Domain, DomainRegistry } from '../../../src/decorators/domain/index.js';

describe('@Domain Decorator - Public API', () => {
  beforeEach(() => {
    // Clear registry between tests
    DomainRegistry.clear();
  });

  describe('Basic Behavior', () => {
    it('should mark a class as a domain component', () => {
      @Domain({
        name: 'Order Management',
        description: 'Handles order processing'
      })
      class OrderDomain {}

      const metadata = DomainRegistry.get('OrderDomain');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('Order Management');
      expect(metadata?.description).toBe('Handles order processing');
    });

    it('should auto-generate name from class name if not provided', () => {
      @Domain({})
      class InventoryManagement {}

      const metadata = DomainRegistry.get('InventoryManagement');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('InventoryManagement');
    });

    it('should register domain with all metadata fields', () => {
      @Domain({
        name: 'Payment',
        description: 'Payment processing domain',
        ubiquitousLanguage: {
          'Transaction': 'A payment transaction',
          'Settlement': 'Finalization of payment'
        }
      })
      class PaymentDomain {}

      const metadata = DomainRegistry.get('PaymentDomain');
      expect(metadata).toBeDefined();
      expect(metadata?.ubiquitousLanguage).toEqual({
        'Transaction': 'A payment transaction',
        'Settlement': 'Finalization of payment'
      });
    });
  });

  describe('Registry Operations', () => {
    it('should allow querying domain by class name', () => {
      @Domain({ name: 'User Management' })
      class UserDomain {}

      const metadata = DomainRegistry.get('UserDomain');
      expect(metadata?.name).toBe('User Management');
    });

    it('should return all registered domains', () => {
      @Domain({ name: 'Domain A' })
      class DomainA {}

      @Domain({ name: 'Domain B' })
      class DomainB {}

      const allDomains = DomainRegistry.getAll();
      expect(allDomains).toHaveLength(2);
      expect(allDomains.map(d => d.name)).toContain('Domain A');
      expect(allDomains.map(d => d.name)).toContain('Domain B');
    });

    it('should check if domain exists', () => {
      @Domain({ name: 'Existing Domain' })
      class ExistingDomain {}

      expect(DomainRegistry.has('ExistingDomain')).toBe(true);
      expect(DomainRegistry.has('NonExistentDomain')).toBe(false);
    });
  });

  describe('Multiple Decorators', () => {
    it('should allow multiple domains in same file', () => {
      @Domain({ name: 'Catalog' })
      class CatalogDomain {}

      @Domain({ name: 'Pricing' })
      class PricingDomain {}

      expect(DomainRegistry.has('CatalogDomain')).toBe(true);
      expect(DomainRegistry.has('PricingDomain')).toBe(true);
    });
  });
});
