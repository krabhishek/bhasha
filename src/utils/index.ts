/**
 * Utility functions exports (Stage 3 Decorators)
 * @module @bhumika/bhasha/utils
 */

export {
  getMetadata,
  setMetadata,
  hasMetadata,
  getAllMetadataKeys,
  isDecoratedWith,
  getAllMetadata,
  copyMetadata,
  isDecorated,
} from './metadata.utils.js';

export {
  extractStakeholderRole,
  extractStakeholderRoles,
  extractExpectationId,
  extractBehaviorName,
} from './class-reference.utils.js';
