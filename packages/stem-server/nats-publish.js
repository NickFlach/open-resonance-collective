/**
 * nats-publish.js — minimal raw-TCP NATS publisher.
 *
 * Zero deps. Auto-reconnects. Drops on error rather than queueing — stem
 * submissions are persisted in SQLite first; the NATS event is best-effort
 * notification to the constellation. Losing one notification is fine.
 *
 * Subjects we use:
 *   ORC.stem.submitted   { stem_id, track_name, artist, phase, tags, ts }
 */
'use strict';

const net = require('net');

const HOST = process.env.NATS_HOST || '127.0.0.1';
const PORT = parseInt(process.env.NATS_PORT || '4222', 10);
const USER = process.env.NATS_USER || '';
const PASS = process.env.NATS_PASSWORD || '';

let client = null;
let connected = false;
let reconnectTimer = null;

function connect() {
  if (client) return;
  try {
    client = new net.Socket();
    client.setKeepAlive(true);
    client.connect(PORT, HOST, () => {
      const opts = {
        verbose: false, pedantic: false, tls_required: false,
        name: 'orc-stem-server', lang: 'node', version: '1.0.0', protocol: 1,
      };
      if (USER) opts.user = USER;
      if (PASS) opts.pass = PASS;
      client.write('CONNECT ' + JSON.stringify(opts) + '\r\n');
      connected = true;
      console.log('[orc-nats] connected to ' + HOST + ':' + PORT);
    });
    client.on('data', (chunk) => {
      // Eat PINGs to keep the connection alive.
      const s = chunk.toString();
      if (s.indexOf('PING') >= 0 && client) client.write('PONG\r\n');
    });
    client.on('error', (err) => {
      console.warn('[orc-nats] error: ' + err.message);
    });
    client.on('close', () => {
      connected = false;
      try { client && client.destroy(); } catch (_) {}
      client = null;
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, 5000);
      }
    });
  } catch (e) {
    console.warn('[orc-nats] connect threw: ' + e.message);
    client = null;
  }
}

function publish(subject, payload) {
  if (!connected || !client) return false;
  try {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const buf = Buffer.from(body, 'utf8');
    client.write('PUB ' + subject + ' ' + buf.length + '\r\n');
    client.write(buf);
    client.write('\r\n');
    return true;
  } catch (e) {
    console.warn('[orc-nats] publish failed: ' + e.message);
    return false;
  }
}

connect();

module.exports = { publish };
