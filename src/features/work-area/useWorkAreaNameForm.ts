import { useForm, useSelector } from '@tanstack/react-form';
import {
  getWorkAreaNameValidationIssue,
  workAreaNameFormSchema,
} from '@/domain/work-area/validation';

type WorkAreaNameFormValues = { name: string };

type UseWorkAreaNameFormOptions = {
  initialName: string;
  onSubmitName: (name: string) => Promise<void> | void;
};

export function useWorkAreaNameForm({
  initialName,
  onSubmitName,
}: Readonly<UseWorkAreaNameFormOptions>) {
  const form = useForm({
    defaultValues: { name: initialName },
    validators: { onSubmit: workAreaNameFormSchema },
    onSubmit: async ({ value }: { value: WorkAreaNameFormValues }) => {
      await onSubmitName(value.name);
    },
  });
  const name = useSelector(form.store, (state) => state.values.name);
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);
  const validationIssue = getWorkAreaNameValidationIssue(name);

  return {
    form,
    name,
    isSubmitting,
    validationIssue,
    canSubmit: validationIssue === null,
  };
}
