import type { WorkAreaNameValidationIssue } from '@/domain/work-area/validation';
import type { TranslationKey } from '@/i18n/catalog';

type WorkAreaNameErrorInput = {
  hasMutationError: boolean;
  isTouched: boolean;
  validationIssue: WorkAreaNameValidationIssue | null;
};

export function getWorkAreaNameErrorKey({
  hasMutationError,
  isTouched,
  validationIssue,
}: Readonly<WorkAreaNameErrorInput>): TranslationKey | null {
  if (isTouched && validationIssue === 'required') {
    return 'workArea.nameRequired';
  }

  if (isTouched && validationIssue === 'too_long') {
    return 'workArea.nameTooLong';
  }

  return hasMutationError ? 'workArea.mutationError' : null;
}
