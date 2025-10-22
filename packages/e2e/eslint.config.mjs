import { config } from '@easygrid/eslint-config/base';

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    rules: {
      quotes: 'off',
    },
  },
];
