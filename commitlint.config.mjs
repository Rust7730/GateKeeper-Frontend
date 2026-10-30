// Conventional Commits con scope obligatorio: mNN (módulo), context, deps o ci.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'],
    'scope-enum': [
      2,
      'always',
      [
        ...Array.from({ length: 30 }, (_, i) => `m${String(i).padStart(2, '0')}`),
        'context',
        'deps',
        'ci',
      ],
    ],
    'subject-case': [0],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
