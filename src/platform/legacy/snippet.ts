// Raden föräldern klistrar in i den gamla Klockövning-filens konsol: kopierar alla sparade klockframsteg.
export const CONSOLE_SNIPPET = "copy(JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('klocka_')).map(k=>[k,JSON.parse(localStorage[k])]))))";
