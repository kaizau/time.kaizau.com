import { render } from 'preact';
import { html } from 'htm/preact';
import { App } from './app';
import './index.css'

render(html`<${App} />`, document.getElementById('app'))
