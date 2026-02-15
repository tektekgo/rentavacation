export { ownerLifecycle } from './owner-lifecycle';
export { travelerLifecycle } from './traveler-lifecycle';
export { adminLifecycle } from './admin-lifecycle';
export { flowToMermaid } from './types';
export type { FlowDefinition, FlowStep, FlowBranch } from './types';

import { ownerLifecycle } from './owner-lifecycle';
import { travelerLifecycle } from './traveler-lifecycle';
import { adminLifecycle } from './admin-lifecycle';
import type { FlowDefinition } from './types';

/** All registered flow manifests */
export const allFlows: FlowDefinition[] = [
  ownerLifecycle,
  travelerLifecycle,
  adminLifecycle,
];
