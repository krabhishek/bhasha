/**
 * Behavioral tests for @Attribute decorator
 * Tests only the public API and observable behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Attribute,
  getAttributes,
  hasAttributes,
  getAttribute,
  getRequiredAttributes,
  Persona,
  PersonaRegistry,
  PersonaType,
} from '../../../src/index.js';
import { METADATA_KEYS } from '../../../src/constants/metadata-keys.js';

describe('@Attribute Decorator - Basic Behavior', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should decorate a property as an Attribute', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'number', description: 'Customer age' })
      age!: number;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata).toBeDefined();
    expect(metadata[0].name).toBe('age');
    expect(metadata[0].type).toBe('number');
    expect(metadata[0].description).toBe('Customer age');
  });

  it('should throw error if type is missing', () => {
    expect(() => {
      @Persona({ type: PersonaType.Human, name: 'Customer' })
      class Customer {
        @Attribute({} as any)
        age!: number;
      }
    }).toThrow(/requires an explicit "type" field/);
  });

  it('should only be applied to fields', () => {
    expect(() => {
      @Persona({ type: PersonaType.Human, name: 'Customer' })
      class Customer {
        @Attribute({ type: 'string' } as any)
        getAge() {
          return 30;
        }
      }
    }).toThrow(/can only be applied to class fields/);
  });

  it('should support multiple attributes on a class', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'number', description: 'Customer age' })
      age!: number;

      @Attribute({ type: 'string', description: 'Customer name' })
      name!: string;

      @Attribute({ type: 'string', description: 'Email address' })
      email!: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata).toHaveLength(3);
    expect(metadata[0].name).toBe('age');
    expect(metadata[1].name).toBe('name');
    expect(metadata[2].name).toBe('email');
  });
});

describe('@Attribute Decorator - Type Support', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should support string type', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'string' })
      name!: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].type).toBe('string');
  });

  it('should support number type', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'number' })
      age!: number;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].type).toBe('number');
  });

  it('should support boolean type', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'boolean' })
      isActive!: boolean;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].type).toBe('boolean');
  });

  it('should support Date type', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'Date' })
      birthDate!: Date;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].type).toBe('Date');
  });

  it('should support array types', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'string[]' })
      tags!: string[];
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].type).toBe('string[]');
  });

  it('should support object types', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'object' })
      address!: object;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].type).toBe('object');
  });
});

describe('@Attribute Decorator - Validation', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should store validation rules', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({
        type: 'number',
        validation: {
          min: 18,
          max: 120,
        },
      })
      age!: number;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].validation).toEqual({
      min: 18,
      max: 120,
    });
  });

  it('should support enum validation', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({
        type: 'string',
        validation: {
          enum: ['bronze', 'silver', 'gold', 'platinum'],
        },
      })
      tier!: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].validation?.enum).toEqual(['bronze', 'silver', 'gold', 'platinum']);
  });

  it('should support pattern validation', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({
        type: 'string',
        validation: {
          pattern: '^[A-Z]{3}$',
        },
      })
      currencyCode!: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].validation?.pattern).toBe('^[A-Z]{3}$');
  });

  it('should support custom validation function', () => {
    const customValidator = (value: number) => value > 0;

    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({
        type: 'number',
        validation: {
          custom: customValidator,
        },
      })
      amount!: number;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].validation?.custom).toBe(customValidator);
  });

  it('should support minLength and maxLength for strings', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({
        type: 'string',
        validation: {
          minLength: 3,
          maxLength: 50,
        },
      })
      username!: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].validation?.minLength).toBe(3);
    expect(metadata[0].validation?.maxLength).toBe(50);
  });
});

describe('@Attribute Decorator - Required and Optional', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should mark attribute as required', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'string', required: true })
      email!: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].required).toBe(true);
  });

  it('should mark attribute as optional', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'string', required: false })
      middleName?: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].required).toBe(false);
  });

  it('should default to optional if not specified', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'string' })
      nickname?: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].required).toBeUndefined();
  });
});

describe('@Attribute Decorator - Default Values', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should store default value', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'string', defaultValue: 'unknown' })
      name!: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].defaultValue).toBe('unknown');
  });

  it('should support numeric default values', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'number', defaultValue: 0 })
      balance!: number;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].defaultValue).toBe(0);
  });

  it('should support boolean default values', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'boolean', defaultValue: false })
      isActive!: boolean;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].defaultValue).toBe(false);
  });
});

describe('@Attribute Decorator - Additional Properties', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  it('should store description', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'string', description: 'Customer email address' })
      email!: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].description).toBe('Customer email address');
  });

  it('should store example value', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({ type: 'string', example: 'john@example.com' })
      email!: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].example).toBe('john@example.com');
  });

  it('should store metadata', () => {
    @Persona({ type: PersonaType.Human, name: 'Customer' })
    class Customer {
      @Attribute({
        type: 'string',
        metadata: {
          sensitive: true,
          encrypted: true,
        },
      })
      password!: string;
    }

    const metadata = (Customer as any)[Symbol.metadata]?.[METADATA_KEYS.ATTRIBUTE];
    expect(metadata[0].metadata).toEqual({
      sensitive: true,
      encrypted: true,
    });
  });
});

describe('Attribute Utility Functions', () => {
  beforeEach(() => {
    PersonaRegistry.clear?.();
  });

  describe('getAttributes', () => {
    it('should return all attributes for a class', () => {
      @Persona({ type: PersonaType.Human, name: 'Customer' })
      class Customer {
        @Attribute({ type: 'string' })
        name!: string;

        @Attribute({ type: 'number' })
        age!: number;
      }

      const attrs = getAttributes(Customer);
      expect(attrs).toHaveLength(2);
      expect(attrs[0].name).toBe('name');
      expect(attrs[1].name).toBe('age');
    });

    it('should return empty array if no attributes', () => {
      @Persona({ type: PersonaType.Human, name: 'Customer' })
      class Customer {}

      const attrs = getAttributes(Customer);
      expect(attrs).toEqual([]);
    });
  });

  describe('hasAttributes', () => {
    it('should return true if class has attributes', () => {
      @Persona({ type: PersonaType.Human, name: 'Customer' })
      class Customer {
        @Attribute({ type: 'string' })
        name!: string;
      }

      expect(hasAttributes(Customer)).toBe(true);
    });

    it('should return false if class has no attributes', () => {
      @Persona({ type: PersonaType.Human, name: 'Customer' })
      class Customer {}

      expect(hasAttributes(Customer)).toBe(false);
    });
  });

  describe('getAttribute', () => {
    it('should return specific attribute by name', () => {
      @Persona({ type: PersonaType.Human, name: 'Customer' })
      class Customer {
        @Attribute({ type: 'string' })
        name!: string;

        @Attribute({ type: 'number' })
        age!: number;
      }

      const attr = getAttribute(Customer, 'age');
      expect(attr).toBeDefined();
      expect(attr?.name).toBe('age');
      expect(attr?.type).toBe('number');
    });

    it('should return undefined if attribute not found', () => {
      @Persona({ type: PersonaType.Human, name: 'Customer' })
      class Customer {
        @Attribute({ type: 'string' })
        name!: string;
      }

      const attr = getAttribute(Customer, 'nonexistent');
      expect(attr).toBeUndefined();
    });
  });

  describe('getRequiredAttributes', () => {
    it('should return only required attributes', () => {
      @Persona({ type: PersonaType.Human, name: 'Customer' })
      class Customer {
        @Attribute({ type: 'string', required: true })
        email!: string;

        @Attribute({ type: 'string', required: false })
        middleName?: string;

        @Attribute({ type: 'number', required: true })
        age!: number;
      }

      const required = getRequiredAttributes(Customer);
      expect(required).toHaveLength(2);
      expect(required[0].name).toBe('email');
      expect(required[1].name).toBe('age');
    });

    it('should return empty array if no required attributes', () => {
      @Persona({ type: PersonaType.Human, name: 'Customer' })
      class Customer {
        @Attribute({ type: 'string' })
        name?: string;
      }

      const required = getRequiredAttributes(Customer);
      expect(required).toEqual([]);
    });
  });
});
