import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

const reactHooksRecommended = reactHooks.configs.flat.recommended;

export default [
  {
    ignores: ['android/**', 'ios/**', 'dist/**', 'node_modules/**'],
  },
  {
    ...reactHooksRecommended,
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ...reactHooksRecommended.languageOptions,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
  },
];
