import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'build/**', '.git/**', 'out/**']
  },
  {
    plugins: {
      '@next/next': nextPlugin
    },
    rules: {
      ...nextPlugin.rules
    }
  }
];
