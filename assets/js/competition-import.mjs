// Importa o texto "TODOS OS RESULTADOS" sem depender do HTML da Liquipedia.
const normal=name=>String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim();
const recordKey=r=>[r.game,r.platform,r.date,normal(r.tournament)].join('|');
function validDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===value;
}
const metadataPattern=/^(\d{4}-\d{2}-\d{2})\s*[•·|]\s*(.+)$/u;
const ignoredLine=line=>/^(?:User\s*:|\d+\s+participa(?:ç|c)ões\s+neste\s+filtro\b|[\w\s/]+\s+—\s+(?:TODOS OS )?RESULTADOS\b)/iu.test(line);
function parseMetadata(line,at){
  const match=line.match(metadataPattern);
  if(!match)return {error:'Linha '+at+': informe a data e o tier, por exemplo 2026-01-22 • D-Tier • Colocação: 8th'};
  const [_,date,detail]=match;
  if(!validDate(date))return {error:'Linha '+at+': data inválida ('+date+').'};
  const columns=detail.split(/\s*[•·|]\s*/u).filter(Boolean);
  const tier=(columns.shift()||'').trim();
  if(!tier||tier.length>30)return {error:'Linha '+at+': tier vazio ou muito longo.'};
  let placement='',note='';
  for(const column of columns){
    const part=column.trim();
    const place=part.match(/^(?:coloca(?:ç|c)[aã]o|placement)\s*:\s*(.+)$/iu);
    if(place){if(placement)return {error:'Linha '+at+': colocação repetida.'};placement=place[1].trim();}
    else if(/^(?:nota|obs(?:erva(?:ç|c)[aã]o)?)\s*:/iu.test(part))note=part.replace(/^[^:]+:\s*/u,'').trim();
    else return {error:'Linha '+at+': informação não reconhecida ('+part+').'};
  }
  if(placement.length>24 || note.length>250)return {error:'Linha '+at+': colocação ou observação longa demais.'};
  return {date,tier,placement,note};
}
export function parseResultsText(raw){
  const text=String(raw||'').replace(/[\u00a0\u202f]/g,' ').replace(/\r\n?/g,'\n');
  if(text.length>60000)return {results:[],errors:['Texto acima de 60 mil caracteres. Divida em lotes menores.']};
  const lines=text.split('\n').map((line,i)=>({text:line.trim(),number:i+1}));
  const blocks=[],errors=[],results=[];
  let current=[];
  for(const line of lines){
    if(!line.text){if(current.length)blocks.push(current);current=[];}
    else current.push(line);
  }
  if(current.length)blocks.push(current);
  for(const block of blocks){
    let index=0;
    while(index<block.length){
      const line=block[index];
      if(ignoredLine(line.text)){index++;continue;}
      const title=line.text;
      if(metadataPattern.test(title)){errors.push('Linha '+line.number+': data sem nome de torneio.');index++;continue;}
      if(title.length>130){errors.push('Linha '+line.number+': nome do torneio ultrapassa 130 caracteres.');index++;continue;}
      const next=block[index+1];
      if(!next){errors.push('Linha '+line.number+': falta a linha de data, tier e colocação para '+title+'.');index++;continue;}
      const metadata=parseMetadata(next.text,next.number);
      if(metadata.error){errors.push(metadata.error+' (torneio: '+title+').');index+=2;continue;}
      index+=2;
      let note=metadata.note;
      const possible=block[index];
      // Textos exportados podem conter uma terceira linha com uma observação.
      if(possible && !metadataPattern.test(possible.text) && !ignoredLine(possible.text) && !block[index+1] && !note){
        note=possible.text;index++;
      }
      if(note.length>250){errors.push('Linha '+line.number+': observação longa demais.');continue;}
      results.push({tournament:title,date:metadata.date,tier:metadata.tier,placement:metadata.placement,note});
    }
  }
  if(results.length>200)errors.push('Limite de 200 resultados por importação. Divida o texto em mais de um lote.');
  if(!results.length&&!errors.length)errors.push('Nenhum campeonato reconhecido. Cole nome e depois a linha com data e tier.');
  return {results,errors};
}
// Mesmo nome/data em Mobile e Emulador é permitido: são históricos distintos.
export function planResultsImport(records,existing,{game='free-fire',platform='emulador',mode='skip'}={}){
  if(!['free-fire','hok','valorant','cs2'].includes(game))throw new Error('Modalidade inválida.');
  if(game==='free-fire'?!['mobile','emulador'].includes(platform):platform!=='geral')throw new Error('Plataforma inválida.');
  if(!['skip','update'].includes(mode))throw new Error('Escolha uma opção válida de duplicatas.');
  const known=new Map(existing.map(record=>[recordKey(record),record]));
  const seen=new Set();
  const entries=[],counts={add:0,update:0,skip:0};
  for(const record of records){
    const prepared={...record,game,platform};
    const key=recordKey(prepared);
    let status,prior=null,merged=null;
    if(seen.has(key)){status='skip';}
    else {
      seen.add(key);
      prior=known.get(key)||null;
      if(!prior)status='add';
      else if(mode==='skip')status='skip';
      else {
        merged={...prior,
          tier:record.tier||prior.tier,
          placement:record.placement||prior.placement,
          note:record.note||prior.note};
        status=['tier','placement','note'].some(field=>merged[field]!==prior[field])?'update':'skip';
      }
    }
    counts[status]++;
    entries.push({record:prepared,prior,merged,status});
  }
  return {entries,counts};
}
export function applyResultsImport(existing,plan,createId){
  const rows=existing.map(row=>({...row}));
  const byId=new Map(rows.map((r,i)=>[r.id,i]));
  for(const entry of plan.entries){
    if(entry.status==='add'){
      const id=createId();
      if(!/^[a-zA-Z0-9_-]+$/.test(id)||byId.has(id))throw new Error('Identificador duplicado no lote.');
      rows.push({id,...entry.record,link:'',visible:true});
      byId.set(id,rows.length-1);
    }else if(entry.status==='update'){
      const index=byId.get(entry.prior?.id);
      if(index===undefined)throw new Error('Um resultado existente mudou. Gere a prévia novamente.');
      rows[index]={...entry.merged};
    }
  }
  return rows;
}
