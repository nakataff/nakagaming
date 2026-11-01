import test from 'node:test';
import assert from 'node:assert/strict';
import {photoLayout,frameStyles,dragPhoto} from '../assets/js/photo-frame.mjs';
import {validateLeaders,publicSnapshot} from '../assets/js/admin-schema.mjs';
import {readFile} from 'node:fs/promises';
test('mantém o recorte anterior em perfis sem novos campos',()=>{
 const layout=photoLayout(400,600,100,100,{photoFit:'cover',photoPosition:30});
 assert.equal(layout.width,100);assert.equal(layout.height,150);assert.equal(layout.left,0);assert.equal(layout.top,-15);
 const leader=validateLeaders([{id:'leader',nick:'Teste',photoPosition:30}])[0];
 assert.equal(leader.photoPositionX,50);assert.equal(leader.photoZoom,1);assert.equal(leader.photoPosition,30);
});
test('arrasta nos dois eixos e mantém o círculo coberto',()=>{
 const settings={photoFit:'cover',photoPositionX:50,photoPosition:50,photoZoom:2};
 const layout=photoLayout(400,600,100,100,settings);
 const moved=dragPhoto(layout,settings,25,-50);
 assert.deepEqual(moved,{photoPositionX:25,photoPosition:75});
 const after=photoLayout(400,600,100,100,{...settings,...moved});
 assert.equal(after.left,-25);assert.equal(after.top,-150);
 for(const delta of [-10000,10000]) {
  const position=dragPhoto(layout,settings,delta,delta);
  const result=photoLayout(400,600,100,100,{...settings,...position});
  assert.ok(result.left<=0&&result.top<=0);
  assert.ok(result.left+result.width>=100&&result.top+result.height>=100);
 }
});
test('foto quadrada precisa de zoom para deslocar sem descobrir o fundo',()=>{
 const settings={photoPositionX:50,photoPosition:50,photoZoom:1};
 assert.deepEqual(dragPhoto(photoLayout(500,500,100,100,settings),settings,15,20),{photoPositionX:50,photoPosition:50});
});
test('a prévia e o perfil público mantêm o mesmo enquadramento em tamanhos diferentes',()=>{
 const settings={photoFit:'cover',photoPositionX:73,photoPosition:21,photoZoom:1.5};
 const a=frameStyles(photoLayout(640,480,100,100,settings)),b=frameStyles(photoLayout(640,480,260,260,settings));
 for(const key of ['left','top','width','height'])assert.ok(Math.abs(parseFloat(a[key])-parseFloat(b[key]))<.00001);
});
test('valida os limites e preserva o enquadramento na publicação',async()=>{
 for(const values of [{photoZoom:0},{photoZoom:4},{photoZoom:NaN},{photoPositionX:-1},{photoPositionX:101}])assert.throws(()=>validateLeaders([{id:'leader',nick:'Teste',...values}]));
 const base=JSON.parse(await readFile(new URL('../assets/data/site.json',import.meta.url)));
 const published=publicSnapshot({...base,leaders:[{id:'leader',nick:'Teste',photoPositionX:20,photoPosition:70,photoZoom:1.8}]});
 assert.equal(published.leaders[0].photoPositionX,20);assert.equal(published.leaders[0].photoPosition,70);assert.equal(published.leaders[0].photoZoom,1.8);
});
