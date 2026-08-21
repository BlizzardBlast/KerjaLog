import * as Sentry from '@sentry/react-native';

type WorkflowFeature = 'onboarding' | 'work-entry';
type WorkflowOperation =
  | 'complete'
  | 'discard-draft'
  | 'persist-draft'
  | 'save';
type WorkflowScreen = 'log' | 'onboarding';
type WorkflowMode = 'developed' | 'quick';
type WorkflowStatus = 'failed' | 'started';

export type WorkflowTelemetry = {
  readonly feature: WorkflowFeature;
  readonly mode?: WorkflowMode;
  readonly operation: WorkflowOperation;
  readonly screen: WorkflowScreen;
  readonly step: string;
};

function recordWorkflowBreadcrumb(
  workflow: WorkflowTelemetry,
  status: WorkflowStatus,
): void {
  Sentry.addBreadcrumb({
    category: 'workflow',
    data: { ...workflow, status },
    level: status === 'failed' ? 'error' : 'info',
    message: `${workflow.feature}.${workflow.operation}.${status}`,
  });
}

export function recordWorkflowStart(workflow: WorkflowTelemetry): void {
  recordWorkflowBreadcrumb(workflow, 'started');
}

export function captureWorkflowFailure(
  error: unknown,
  workflow: WorkflowTelemetry,
): void {
  recordWorkflowBreadcrumb(workflow, 'failed');

  Sentry.withScope((scope) => {
    scope.setTags({
      'failure.kind': 'persistence',
      feature: workflow.feature,
      operation: workflow.operation,
    });
    scope.setContext('workflow', {
      ...workflow,
      state: 'failed',
    });
    Sentry.captureException(error);
  });
}
