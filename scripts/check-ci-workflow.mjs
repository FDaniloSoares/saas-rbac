/* Asserções sobre o workflow de CI. Vive num arquivo, e não em `node -e`
inline, porque a primeira rodada de verificação demonstrou que cada uma das
versões curtas passava num workflow errado: `- main` sem âncora casava
`- maintenance`, a ordem de passos era enganada por um comentário, e a
tolerância a falha tem mais formas que `continue-on-error`. */
import { readFileSync } from 'node:fs';

const PATH = '.github/workflows/ci.yml';
/* CRLF num checkout Windows faria toda âncora `$` falhar, e o mesmo arquivo
passaria no Linux — um checador sensível a fim de linha não vale nada */
const raw = readFileSync(PATH, 'utf8').split('\r\n').join('\n');

/* comentários enganam toda checagem de ordem e de presença */
const lines = raw
  .split('\n')
  .map((line) => line.replace(/(^|\s)#.*$/, ''))
  .filter((line) => line.trim().length > 0);

const code = lines.join('\n');

const failures = [];

function check(name, ok, detail) {
  if (!ok) failures.push(`${name}: ${detail}`);
}

/* ---- C4: gatilhos ---- */
const onBlock = code.split(/^jobs:/m)[0];

for (const trigger of ['push', 'pull_request']) {
  /* o bloco do gatilho vai até a próxima chave de mesma indentação */
  const match = onBlock.match(
    new RegExp(`^ {2}${trigger}:\\n((?: {4,}.*\\n?)*)`, 'm')
  );

  check(`C4/${trigger}`, Boolean(match), 'gatilho ausente');

  if (!match) continue;

  /* `main` como item inteiro da lista, não como prefixo de `maintenance` */
  check(
    `C4/${trigger}/branch`,
    /^ +- main$/m.test(match[1]),
    'não restringe a branch main exatamente'
  );
}

/* ---- C5: Postgres e migrations antes do teste ---- */
for (const needle of [
  'POSTGRES_USER: docker',
  'POSTGRES_PASSWORD: docker',
  'POSTGRES_DB: next-saas-test',
  '5432:5432',
]) {
  check('C5/servico', code.includes(needle), `faltou ${needle}`);
}

/* o passo pode ser item de lista (`- run:`) ou chave de um item nomeado */
const migrateAt = code.search(
  /^ +(- )?run: pnpm --filter @saas\/api db:migrate:test$/m
);
const testAt = code.search(/^ +(- )?run: pnpm test$/m);

check('C5/migrate', migrateAt !== -1, 'passo de migrations ausente');
check('C5/test', testAt !== -1, 'passo `run: pnpm test` ausente');
check(
  'C5/ordem',
  migrateAt !== -1 && testAt !== -1 && migrateAt < testAt,
  'migrations não roda antes dos testes'
);

/* ---- C6: env escrito pelo workflow, sem segredo e sem arquivo do repo ---- */
check(
  'C6/escreve',
  /<<'ENV'[\s\S]*?\n +ENV$/m.test(code) && />\s*\.env\.test/.test(code),
  'o workflow não escreve .env.test por heredoc'
);

check(
  'C6/nao-le-do-repo',
  !/(cp|cat|mv)\s+[^\n]*\.env[^\n]*>\s*\.env\.test/.test(code) &&
    !/cp\s+[^\n]*\.env\.test/.test(code),
  'copia um arquivo do repositório em vez de escrever os valores'
);

for (const variable of [
  'DATABASE_URL',
  'JWT_SECRET',
  'GITHUB_OAUTH_CLIENT_ID',
  'GITHUB_OAUTH_CLIENT_SECRET',
  'GITHUB_OAUTH_CLIENT_REDIRECT_URI',
  'NEXT_PUBLIC_API_URL',
  'SERVER_PORT',
]) {
  check('C6/var', code.includes(variable), `faltou ${variable}`);
}

check('C6/sem-segredo', !/secrets\./.test(code), 'usa secrets, e não deveria');

/* ---- C7: o passo de teste não é tolerado ---- */
const TOLERANCE = [
  [/continue-on-error/, 'continue-on-error'],
  [/\|\|\s*(true|:)/, '|| true ou || :'],
  [/set\s+\+e/, 'set +e'],
  [/\|\s*tee\b/, 'pipe para tee mascara o código de saída'],
  [/\bif:\s*always\(\)/, 'if: always() no passo de teste'],
];

for (const [pattern, label] of TOLERANCE) {
  check('C7/tolerancia', !pattern.test(code), `encontrado: ${label}`);
}

check('C7/roda', testAt !== -1, 'nenhum passo roda `pnpm test`');

if (failures.length > 0) {
  console.error(`${PATH} reprovou:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('OK');
