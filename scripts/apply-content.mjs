import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {validatePublic} from '../assets/js/admin-schema.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
try {
  if (process.argv.length !== 3) throw new Error('Uso: node scripts/apply-content.mjs /caminho/naka-site.json');
  const raw = JSON.parse(await readFile(process.argv[2], 'utf8'));
  if ('members' in raw) throw new Error('Use a configuração pública, não o backup completo da guilda.');
  const data = validatePublic(raw);
  const result = spawnSync('python3', ['scripts/apply-fallback.py'], {cwd:root, input:JSON.stringify(data), encoding:'utf8'});
  if (result.status !== 0) throw new Error(result.stderr || 'Não foi possível atualizar os HTMLs.');
  await writeFile(new URL('../assets/data/site.json', import.meta.url), JSON.stringify(data, null, 2) + '\n');
  console.log('Conteúdo público e HTMLs atualizados. Valide e envie o commit para publicar.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
