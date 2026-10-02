import './os-userinfo-shim.mjs';
import { fileURLToPath } from 'node:url';

const shimPath = fileURLToPath(new URL('./os-userinfo-shim.cjs', import.meta.url)).replaceAll('\\', '/');
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --require="${shimPath}"`.trim();
await import('tsx/cli');
