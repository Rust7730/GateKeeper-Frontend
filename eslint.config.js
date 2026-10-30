// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  { ignores: ['scripts/**', 'tools/**', 'dist/**', '.angular/**'] },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'gk',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'gk',
          style: 'kebab-case',
        },
      ],
      // 01-reglas § C
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // 01-reglas § B (S1, S6): también lo vigila scripts/check-security.mjs
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[property.name=/^bypassSecurityTrust/]',
          message: 'S1: bypassSecurityTrust* está prohibido.',
        },
        {
          selector:
            'AssignmentExpression > MemberExpression[property.name=/^(innerHTML|outerHTML)$/]',
          message: 'S1: usa interpolación en la plantilla.',
        },
        {
          selector: "NewExpression[callee.name='EventSource']",
          message: 'S6: usa fetch-event-source para enviar Authorization.',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },
]);
