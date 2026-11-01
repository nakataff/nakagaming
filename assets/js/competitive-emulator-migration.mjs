// Compatibilidade com dados já publicados no Firebase e rascunhos anteriores.
// Atualiza apenas posições que ainda correspondem exatamente à importação antiga.
// Nunca modifica times, Mobile, registros personalizados, links ou outros campos.
import {INITIAL_RESULTS} from './competitive-seed.mjs?v=20261101-emufix';
const OLD_EMULATOR_PLACEMENTS = {
  "ff-emu-2026-10-01-0": "9º",
  "ff-emu-2026-02-26-1": "11º",
  "ff-emu-2026-01-22-2": "",
  "ff-emu-2025-09-29-3": "22º",
  "ff-emu-2025-08-31-4": "17º",
  "ff-emu-2025-08-27-5": "17º",
  "ff-emu-2025-07-29-6": "15º–16º",
  "ff-emu-2025-07-02-7": "15º",
  "ff-emu-2025-06-29-8": "16º",
  "ff-emu-2025-06-20-9": "7º",
  "ff-emu-2025-06-07-10": "11º",
  "ff-emu-2025-05-27-11": "13º",
  "ff-emu-2025-04-28-12": "19º–20º",
  "ff-emu-2025-04-17-13": "11º",
  "ff-emu-2025-03-14-14": "16º",
  "ff-emu-2025-02-21-15": "13º",
  "ff-emu-2025-02-12-16": "10º",
  "ff-emu-2025-02-03-17": "12º",
  "ff-emu-2025-01-18-18": "8º",
  "ff-emu-2024-12-13-19": "",
  "ff-emu-2024-10-31-20": "",
  "ff-emu-2024-10-30-21": "",
  "ff-emu-2024-10-28-22": "",
  "ff-emu-2024-10-27-23": "",
  "ff-emu-2024-10-19-24": "2º",
  "ff-emu-2024-10-02-25": "",
  "ff-emu-2024-09-12-26": "",
  "ff-emu-2024-09-08-27": "",
  "ff-emu-2024-08-31-28": "",
  "ff-emu-2024-08-23-29": ""
};
const oldMobileRecord = {"id":"ff-emu-2026-01-22-2","date":"2026-01-22","tournament":"Liga UBFF Season 23"};
const correctedById=new Map(INITIAL_RESULTS.map(result=>[result.id,result]));
export function correctLegacyEmulatorHistory(config){
  if(!config||!Array.isArray(config.results))return config;
  const results=config.results.flatMap(row=>{
    if(!row||row.game!=='free-fire'||row.platform!=='emulador')return [row];
    if(row.id===oldMobileRecord.id&&row.date===oldMobileRecord.date&&row.tournament===oldMobileRecord.tournament)return [];
    const updated=correctedById.get(row.id);
    if(!updated||row.date!==updated.date||row.tournament!==updated.tournament)return [row];
    if(Object.hasOwn(OLD_EMULATOR_PLACEMENTS,row.id)&&row.placement===OLD_EMULATOR_PLACEMENTS[row.id]&&row.placement!==updated.placement){
      return [{...row,placement:updated.placement}];
    }
    return [row];
  });
  return {...config,results};
}
