// Ordenação do histórico competitivo público, sem modificar os registros do admin.
export const DEFAULT_RESULTS_SORT = Object.freeze({key:'date',direction:'desc'});
export const RESULTS_SORT_KEYS = ['date','placement','tier','tournament'];
const compareText=(a,b)=>String(a??'').localeCompare(String(b??''),'pt-BR',{numeric:true,sensitivity:'base'});
const positionNumber=value=>{
  const match=String(value??'').trim().match(/^(\d+)/);
  return match?Number(match[1]):null;
};
const tierWeight=tier=>{
  const v=String(tier??'').trim().toUpperCase();
  const match=v.match(/^([SABCD])-TIER\b/);
  if(match)return {S:7,A:6,B:5,C:4,D:3}[match[1]];
  if(v==='QUALIFIER'||v==='QUALIFICATION')return 2;
  if(v==='WEEKLY')return 1;
  return null;
};
export function sortedResults(records,{key='date',direction='desc'}={}){
  if(!RESULTS_SORT_KEYS.includes(key)||!['asc','desc'].includes(direction))throw new Error('Ordenação inválida');
  const factor=direction==='asc'?1:-1;
  return [...records].sort((a,b)=>{
    let cmp=0;
    if(key==='date')cmp=compareText(a.date,b.date);
    else if(key==='tournament')cmp=compareText(a.tournament,b.tournament);
    else if(key==='placement'||key==='tier'){
      const left=key==='placement'?positionNumber(a.placement):tierWeight(a.tier);
      const right=key==='placement'?positionNumber(b.placement):tierWeight(b.tier);
      // Colocações/tier não informados ficam sempre no final, nos dois sentidos.
      if(left===null||right===null){
        if(left===null && right!==null)return 1;
        if(right===null && left!==null)return -1;
      }else cmp=left-right;
      if(cmp!==0)return cmp*factor;
      if(key==='tier')cmp=compareText(a.tier,b.tier);
      if(cmp!==0)return cmp*factor;
    }
    if(cmp!==0)return cmp*factor;
    // Empates: evento mais recente primeiro e depois nome do torneio.
    return compareText(b.date,a.date)||compareText(a.tournament,b.tournament);
  });
}
export function resultDisplayRows(records,{key='date',direction='desc'}={}){
  const sorted=sortedResults(records,{key,direction});
  let lastYear=null;
  const output=[];
  for(const record of sorted){
    if(key==='date'){
      const year=record.date.slice(0,4);
      if(year!==lastYear){output.push({type:'year',year});lastYear=year;}
    }
    output.push({type:'record',record});
  }
  return output;
}
export function nextResultSort(current,key){
  if(!RESULTS_SORT_KEYS.includes(key))throw new Error('Coluna inválida');
  if(current.key===key)return {key,direction:current.direction==='asc'?'desc':'asc'};
  return {key,direction:key==='date'||key==='tier'?'desc':'asc'};
}
