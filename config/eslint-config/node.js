/** @type { import('eslint').Linter.Config } */
module.exports = {
  extends: ['@rocketseat/eslint-config/node'],
  plugins: ['simple-import-sort'],
  rules: {
    'simple-import-sort/imports': 'error',
    // Descarta as opções cravadas pelo preset do Rocketseat (semi/trailingComma)
    // para que o ESLint use a config de @saas/prettier.
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
  },
};
