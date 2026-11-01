// Texto copiável dos resultados: mantém a mesma ordem da tabela e não inventa posições.
const PLACE_MISSING='Não informada';
export function placementLabel(value) {return String(value||'').trim()||PLACE_MISSING;}
export function resultCopyText(records,{gameName='Naka Gaming',platform='',format='cards',includePlacement=true}={}) {
  const list=Array.isArray(records)?records:[];
  const head=[gameName,platform].filter(Boolean).join(' / ')+' — RESULTADOS';
  if(!list.length)return head+'\n\nNenhum resultado encontrado neste filtro.';
  const position=r=>includePlacement?'Colocação: '+placementLabel(r.placement):'';
  const card=r=>{
    const meta=[r.date,r.tier,position(r)].filter(Boolean).join(' • ');
    return [r.tournament,meta,r.note].filter(Boolean).join('\n');
  };
  const line=r=>{
    if(format==='list')return '• '+r.tournament;
    if(format==='compact')return '• '+r.tournament+(includePlacement?' — '+placementLabel(r.placement):'');
    return '• '+[r.date,r.tournament,includePlacement?placementLabel(r.placement):null,r.tier,r.note].filter(Boolean).join(' — ');
  };
  const body=list.map(r=>format==='cards'?card(r):line(r)).join(format==='cards'?'\n\n':'\n');
  return head+'\n'+list.length+' participações neste filtro\n\n'+body;
}
