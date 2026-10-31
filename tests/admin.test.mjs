import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validatePublic, validateBackup} from '../assets/js/admin-schema.mjs';
import {loadDraft, saveDraft} from '../assets/js/admin-store.mjs';
const config = JSON.parse(await readFile(new URL('../assets/data/site.json', import.meta.url)));
const member = {id:'member-1', nick:'Samurai', role:'Jogador', status:'Ativo'};
const backup = () => ({...structuredClone(config), members:[{...member}]});

test('a exportação pública exclui a lista da guilda e campos desconhecidos', () => {
  const raw = backup(); raw.privateField = 'não publicar';
  const result = validatePublic(raw);
  assert.equal(result.members, undefined); assert.equal(result.privateField, undefined);
  assert.deepEqual(result, config);
});
test('bloqueia links executáveis, credenciais e perfis fora do Instagram', () => {
  for (const url of ['javascript:alert(1)', 'http://instagram.com/naka/', 'https://user:pass@instagram.com/naka/', 'https://instagram.com.evil.example/naka/']) {
    const raw = backup(); raw.links.nakaInstagram = url;
    assert.throws(() => validateBackup(raw));
  }
});
test('valida o backup inteiro antes de substituir o rascunho', () => {
  assert.throws(() => validateBackup({schemaVersion:2}));
  assert.throws(() => validateBackup({...config, members:'invalido'}));
  const raw = backup(); raw.members.push({...member, id:'member-2', nick:'samurai'});
  assert.throws(() => validateBackup(raw), /duplicados/);
  raw.members = [{...member, role:'Admin irrestrito'}]; assert.throws(() => validateBackup(raw));
});
test('mantém nicks como texto; limita o tamanho dos campos e da lista', () => {
  const raw = backup(); raw.members[0].nick = '<b>Samurai</b>';
  assert.equal(validateBackup(raw).members[0].nick, '<b>Samurai</b>');
  raw.content.homeTitle = 'x'.repeat(41); assert.throws(() => validateBackup(raw));
  assert.throws(() => validateBackup({...config, members:Array(501).fill(member)}));
});
test('salva, recarrega e detecta edição concorrente sem perder dados', async () => {
  const memory = new Map();
  globalThis.localStorage = {getItem:key=>memory.get(key) ?? null, setItem:(key,value)=>memory.set(key,value)};
  globalThis.fetch = async () => ({ok:true, json:async()=>config});
  const initial = await loadDraft(); assert.equal(initial.revision, null);
  const saved = saveDraft(backup(), initial.revision);
  assert.deepEqual((await loadDraft()).data.members, [member]);
  assert.throws(() => saveDraft({...config,members:[]}, null), /outra aba/);
  assert.equal((await loadDraft()).data.members.length, 1);
  localStorage.setItem = () => {throw new Error('quota exceeded');};
  assert.throws(() => saveDraft(backup(), saved.revision), /Não foi possível salvar/);
});
