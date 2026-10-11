import { addPruner, kv } from '../storage/kv';
import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { heroKey } from '../profiles';

// Händelseloggen: ett kort inlägg per första svar. Driver repetitionen och (senare) Biblioteket.
// t = tid (ISO), a = område, n = nod, k = färdighet, c = rätt, ms = svarstid, e = felkod, h = ledtråd.

export interface LogEvent { t: string; a: string; n: string; k: string; c: boolean; ms: number; e?: string; h?: boolean }
interface EventLog { v: number; log: LogEvent[] }
export const EVENTS: RecordSpec<EventLog> = { version: 1, defaults: () => ({ v: 1, log: [] }) };
const EVENT_CAP = 3000;

export function getEvents(hid: string): LogEvent[] { return loadRecord(heroKey(hid, 'events'), EVENTS).value.log; }

export function logEvents(hid: string, events: LogEvent[], prepend = false) {
  const r = loadRecord(heroKey(hid, 'events'), EVENTS).value;
  const log = prepend ? [...events, ...r.log] : [...r.log, ...events];
  saveRecord(heroKey(hid, 'events'), EVENTS, { ...r, log: log.slice(-EVENT_CAP) });
}

/** Full lagring: halvera loggen (de äldsta svaren går), men aldrig under EVENT_KEEP. Repetitionsschemat och
 *  framstegen ligger i egna poster, så det enda som försvinner är gammal statistik. */
const EVENT_KEEP = 200;
addPruner(2, () => {
  let freed = false;
  for (const k of kv.keys('h:').filter((x) => x.endsWith(':events'))) {
    const r = kv.get<EventLog>(k);
    if (!r?.log || r.log.length <= EVENT_KEEP) continue;
    try {
      kv.set(k, { ...r, log: r.log.slice(-Math.max(EVENT_KEEP, Math.floor(r.log.length / 2))) });
      freed = true;
    } catch { /* nästa hjälte */ }
  }
  return freed;
});
