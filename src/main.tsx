import { render } from 'preact';
import { App } from './app';
import { setupUpdates } from './platform/device';
import './styles.css';

setupUpdates();
render(<App />, document.getElementById('app')!);
