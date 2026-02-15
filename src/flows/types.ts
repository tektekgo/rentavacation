/**
 * Flow Manifest Type Definitions
 * 
 * Declarative data structures that describe user journeys through the application.
 * The /architecture page auto-generates interactive Mermaid diagrams from these manifests.
 * 
 * Convention: When adding a new route or workflow step, update the relevant manifest.
 * See CLAUDE.md for AI agent instructions.
 */

/** A single step in a user journey */
export interface FlowStep {
  /** Unique step ID within this flow (e.g., 'signup', 'list_property') */
  id: string;
  /** The app route for this step (e.g., '/signup', '/owner-dashboard') */
  route: string;
  /** Human-readable label shown on the diagram node */
  label: string;
  /** Optional tab/section within the page (e.g., 'listings', 'earnings') */
  tab?: string;
  /** React component name for reference */
  component: string;
  /** Required role(s) to access this step */
  roles?: string[];
  /** Edge functions invoked during this step */
  edgeFunctions?: string[];
  /** Database tables read/written during this step */
  tables?: string[];
  /** Conditional branches from this step */
  branches?: FlowBranch[];
  /** Visual styling hint for the diagram node */
  nodeStyle?: 'default' | 'start' | 'end' | 'decision' | 'external';
  /** Short description shown on hover */
  description?: string;
}

/** A conditional branch from one step to another */
export interface FlowBranch {
  /** Human-readable condition (e.g., 'Bid accepted') */
  condition: string;
  /** Target step ID within the same flow */
  targetStepId: string;
  /** Label shown on the diagram edge */
  label?: string;
  /** Visual style for the edge */
  edgeStyle?: 'solid' | 'dashed' | 'dotted';
}

/** A complete user journey flow */
export interface FlowDefinition {
  /** Unique flow ID (e.g., 'owner-lifecycle') */
  id: string;
  /** Display name for the flow (e.g., 'Property Owner Journey') */
  label: string;
  /** Short description of what this flow covers */
  description: string;
  /** The primary user role this flow is for */
  primaryRole: string;
  /** Role badge emoji */
  roleEmoji: string;
  /** Ordered steps in the flow */
  steps: FlowStep[];
  /** Mermaid diagram direction */
  direction?: 'TD' | 'LR';
}

/**
 * Generate Mermaid diagram code from a FlowDefinition.
 * This is the core automation — manifests become diagrams without hand-authored Mermaid.
 */
export function flowToMermaid(flow: FlowDefinition): string {
  const dir = flow.direction || 'TD';
  const lines: string[] = [`graph ${dir}`];

  // Define nodes
  for (const step of flow.steps) {
    const shape = getNodeShape(step);
    lines.push(`    ${step.id}${shape}`);
  }

  lines.push('');

  // Define edges (sequential flow)
  for (let i = 0; i < flow.steps.length - 1; i++) {
    const current = flow.steps[i];
    const next = flow.steps[i + 1];

    // If current step has branches, use those instead of sequential
    if (current.branches && current.branches.length > 0) {
      for (const branch of current.branches) {
        const style = branch.edgeStyle === 'dashed' ? '-.->' : '-->';
        const label = branch.label || branch.condition;
        lines.push(`    ${current.id} ${style}|"${label}"| ${branch.targetStepId}`);
      }
    } else {
      lines.push(`    ${current.id} --> ${next.id}`);
    }
  }

  // Add branch edges for the last step if it has branches
  const lastStep = flow.steps[flow.steps.length - 1];
  if (lastStep?.branches) {
    for (const branch of lastStep.branches) {
      const style = branch.edgeStyle === 'dashed' ? '-.->' : '-->';
      const label = branch.label || branch.condition;
      lines.push(`    ${lastStep.id} ${style}|"${label}"| ${branch.targetStepId}`);
    }
  }

  // Add styling
  lines.push('');
  for (const step of flow.steps) {
    const className = getNodeClass(step);
    if (className) {
      lines.push(`    class ${step.id} ${className}`);
    }
  }

  // Define styles
  lines.push('');
  lines.push('    classDef startNode fill:#0d7377,stroke:#0a5c5f,color:#fff,stroke-width:2px');
  lines.push('    classDef endNode fill:#e86c3a,stroke:#c45a2f,color:#fff,stroke-width:2px');
  lines.push('    classDef decisionNode fill:#f5f0e8,stroke:#0d7377,color:#1a3038,stroke-width:2px');
  lines.push('    classDef externalNode fill:#fef3c7,stroke:#d97706,color:#92400e,stroke-width:2px');
  lines.push('    classDef defaultNode fill:#f0fafa,stroke:#0d7377,color:#1a3038,stroke-width:1px');

  return lines.join('\n');
}

function getNodeShape(step: FlowStep): string {
  const label = step.tab ? `${step.label}<br/><small>${step.tab}</small>` : step.label;
  switch (step.nodeStyle) {
    case 'start': return `([${label}])`;
    case 'end': return `([${label}])`;
    case 'decision': return `{${label}}`;
    case 'external': return `[/${label}/]`;
    default: return `[${label}]`;
  }
}

function getNodeClass(step: FlowStep): string | null {
  switch (step.nodeStyle) {
    case 'start': return 'startNode';
    case 'end': return 'endNode';
    case 'decision': return 'decisionNode';
    case 'external': return 'externalNode';
    default: return 'defaultNode';
  }
}
