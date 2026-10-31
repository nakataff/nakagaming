import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validatePublic, validateBackup} from '../assets/js/admin-schema.mjs';
import {createDraftRepository} from '../assets/js/admin-store.mjs';
import {isAdminUser, safeAdminPath, ADMIN_EMAIL} from '../assets/js/admin-auth-policy.mjs';
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
function harness(initialUser = {uid:'owner-1', email:ADMIN_EMAIL}) {
  let user = initialUser, remote = null, writes = 0, readError = null;
  const repo = createDraftRepository({
    getUser:()=>user,
    read:async()=>{ if (readError) throw readError; return structuredClone(remote); },
    transact:async(update)=>{
      const next = update(structuredClone(remote));
      if (next === undefined) return {committed:false, value:remote};
      writes++; remote = {...next, updatedAt:1793480000000};
      return {committed:true, value:remote};
    },
    loadBase:async()=>config,
    timestamp:()=>1793480000000
  });
  return {repo, get remote(){return remote;}, get writes(){return writes;}, setUser:v=>{user=v;}, failRead:e=>{readError=e;}};
}
test('nenhuma leitura ou gravação ocorre sem a conta administrativa', async () => {
  for (const user of [null, {uid:'visitor',email:'someone@example.com'}, {email:ADMIN_EMAIL}, {uid:'anonymous'}]) {
    const h=harness(user);
    await assert.rejects(()=>h.repo.loadDraft(), /conta administrativa/);
    await assert.rejects(()=>h.repo.saveDraft(backup(),0), /conta administrativa/);
    assert.equal(h.writes,0);
  }
  assert.equal(isAdminUser({uid:'owner',email:ADMIN_EMAIL}),true);
});
test('salva na conta e detecta conflito sem sobrescrever a versão mais nova', async () => {
  const h=harness();
  const initial=await h.repo.loadDraft(); assert.equal(initial.revision,0);
  const saved=await h.repo.saveDraft(backup(),0); assert.equal(saved.revision,1);
  assert.deepEqual((await h.repo.loadDraft()).data.members,[member]);
  await assert.rejects(()=>h.repo.saveDraft({...config,members:[]},0), /Outra sessão/);
  assert.equal(h.remote.revision,1); assert.equal(h.writes,1);
});
test('falha de permissão do servidor não abre uma cópia local como se fosse autenticada', async () => {
  const h=harness(); h.failRead(new Error('PERMISSION_DENIED'));
  await assert.rejects(()=>h.repo.loadDraft(),/PERMISSION_DENIED/);
  assert.equal(h.writes,0);
});
test('a transação tolera cache vazio sem ignorar conflitos na resposta do servidor', async () => {
  const user={uid:'owner',email:ADMIN_EMAIL};
  let current={revision:1};
  const repo=createDraftRepository({getUser:()=>user,read:async()=>current,loadBase:async()=>config,timestamp:()=>1793480000000,
    transact:async(update)=>{
      assert.equal(update(null).revision,2);
      const next=update(current);
      if (!next) return {committed:false,value:current};
      current=next;return {committed:true,value:current};
    }});
  assert.equal((await repo.saveDraft(backup(),1)).revision,2);
  await assert.rejects(()=>repo.saveDraft(backup(),1),/Outra sessão/);
  assert.equal(current.revision,2);
});
test('não entrega dados se a sessão termina durante a leitura', async () => {
  let user={uid:'owner',email:ADMIN_EMAIL};
  const repo=createDraftRepository({getUser:()=>user,read:async()=>null,
    loadBase:async()=>{user=null;return config;}});
  await assert.rejects(()=>repo.loadDraft(),/conta administrativa/);
});
test('não aceita retorno externo nem rotas arbitrárias depois do login', () => {
  for (const path of ['https://evil.example','//evil.example','/admin/login/','/admin/?next=https://evil.example',null]) assert.equal(safeAdminPath(path),'/admin/');
  assert.equal(safeAdminPath('/admin/guilda/'),'/admin/guilda/');
});
test('as permissões isoladas no Firebase exigem a conta administrativa', async () => {
  const policy=JSON.parse(await readFile(new URL('../firebase/naka-admin.rules.json',import.meta.url))).nakaGamingAdmin;
  for (const key of ['.read','.write']) {
    const allowed=new Function('auth','return '+policy[key]);
    assert.equal(allowed(null),false);
    assert.equal(allowed({uid:'visitor',token:{email:'someone@example.com'}}),false);
    assert.equal(allowed({uid:'owner',token:{email:ADMIN_EMAIL}}),true);
  }
  assert.equal(policy.$other['.validate'],false);
  assert.equal(policy.state.$other['.validate'],false);
  assert.match(policy.state.updatedBy['.validate'],/auth.uid/);
  assert.match(policy.state.revision['.validate'],/data.val\(\) \+ 1/);
});
