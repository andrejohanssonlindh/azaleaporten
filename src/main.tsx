import { render } from 'preact';
import { App } from './app';
import { setupUpdates } from './platform/device';
import { setupTabGuard } from './platform/tabs';
import { onSpaceFreed, StorageFullError } from './platform/storage/kv';
import { toast } from './state';
import './styles.css';

setupUpdates();
setupTabGuard();

// Full lagring: först rensas gammal statistik och gamla backuper (kv.set). Räcker inte det sparas inget,
// och då ska någon få veta det i stället för att knappen bara slutar fungera.
onSpaceFreed(() => toast('Minnet var fullt, så jag rensade gammal statistik. Allt du har klarat finns kvar.'));
const full = (e: unknown) => {
  if (e instanceof StorageFullError) toast('Minnet är fullt och det gick inte att spara. Be en vuxen titta i Vuxenläge.');
};
addEventListener('error', (e) => full(e.error));
addEventListener('unhandledrejection', (e) => full(e.reason));

render(<App />, document.getElementById('app')!);
