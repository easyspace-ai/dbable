import baseConfig from '@easygrid/eslint-config/base.js'

export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // 允许 console.log 在开发环境中使用
      'no-console': 'warn',
      // 允许未使用的变量以 _ 开头
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }
      ]
    }
  }
]
