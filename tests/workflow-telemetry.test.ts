import * as Sentry from '@sentry/react-native';
import {
  captureWorkflowFailure,
  recordWorkflowStart,
} from '@/platform/observability/workflowTelemetry';

const mockScope = {
  setContext: jest.fn(),
  setTags: jest.fn(),
};

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  withScope: jest.fn((callback) => callback(mockScope)),
}));

const addBreadcrumbMock = jest.mocked(Sentry.addBreadcrumb);
const captureExceptionMock = jest.mocked(Sentry.captureException);

describe('workflow telemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('reports a work-entry save failure with controlled workflow state', () => {
    // Given
    const error = new Error('database unavailable');
    const workflow = {
      feature: 'work-entry' as const,
      mode: 'quick' as const,
      operation: 'save' as const,
      screen: 'log' as const,
      step: 'event',
    };

    // When
    recordWorkflowStart(workflow);
    captureWorkflowFailure(error, workflow);

    // Then
    expect(addBreadcrumbMock).toHaveBeenNthCalledWith(1, {
      category: 'workflow',
      data: {
        feature: 'work-entry',
        mode: 'quick',
        operation: 'save',
        screen: 'log',
        status: 'started',
        step: 'event',
      },
      level: 'info',
      message: 'work-entry.save.started',
    });
    expect(addBreadcrumbMock).toHaveBeenNthCalledWith(2, {
      category: 'workflow',
      data: {
        feature: 'work-entry',
        mode: 'quick',
        operation: 'save',
        screen: 'log',
        status: 'failed',
        step: 'event',
      },
      level: 'error',
      message: 'work-entry.save.failed',
    });
    expect(mockScope.setTags).toHaveBeenCalledWith({
      'failure.kind': 'persistence',
      feature: 'work-entry',
      operation: 'save',
    });
    expect(mockScope.setContext).toHaveBeenCalledWith('workflow', {
      feature: 'work-entry',
      mode: 'quick',
      operation: 'save',
      screen: 'log',
      state: 'failed',
      step: 'event',
    });
    expect(captureExceptionMock).toHaveBeenCalledWith(error);
  });
});
