import { MemoryBackend, setBackend } from '../src/platform/storage/kv';
import { _resetRecordState } from '../src/platform/storage/record';

/** Ny tom lagring före varje test. */
export function freshStorage(): MemoryBackend {
  const b = new MemoryBackend();
  setBackend(b);
  _resetRecordState();
  return b;
}
