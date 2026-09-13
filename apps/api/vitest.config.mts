import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    /* resolve o alias `@/*` a partir do tsconfig deste app */
    tsconfigPaths: true,
  },
  test: {
    include: ['test/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
    /* um banco só, compartilhado: arquivos em paralelo truncariam tabelas
    uns dos outros no meio da execução */
    fileParallelism: false,
  },
});
