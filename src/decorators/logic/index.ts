/**
 * Logic decorators and registry
 * @module @bhumika/bhasha/decorators/logic
 */

// Decorators
export { Logic, type LogicOptions } from './logic.decorator.js';
export {
  AttachLogic,
  type AttachLogicOptions,
  type AttachableLogicClass,
  type AttachableLogicName,
  type AttachableLogic,
  type AttachableLogicList,
  type AttachedLogicEntry,
  getAttachedLogic,
  getAllAttachedLogic,
  hasAttachedLogic,
  getMembersWithAttachedLogic,
} from './attach-logic.decorator.js';

// Registry
export { LogicRegistry } from './logic.registry.js';
