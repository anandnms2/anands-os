/* Anands peer: puter.peer on this server.
 * Browser-to-browser WebRTC data channels and media. The only thing the server does is relay the connection set-up messages (see server/meet.js);
 * data and media then go directly between the two browsers (or through your TURN relay, if you set one up).
 * API: serve(opts) -> PeerServer, connect(invite, opts) -> PeerConnection, ensureTurnRelays(opts), createGuestGrant(). */
(function (g) {
  'use strict';
  var DEFAULT_RECOVERY = 60000, PING_MS = 4000, UNSTABLE_MS = 12000, DEAD_MS = 22000, RETRY_MS = 5000, SSE_SILENT_MS = 35000;

  function mk(code, msg) { var e = new Error(msg || code); e.code = code; return e; }
  function post(path, body) {
    return fetch('/_peer/' + path, { method: 'POST', credentials: 'same-origin', headers: { 'x-aos': '1', 'content-type': 'application/json' }, body: JSON.stringify(body || {}) }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw mk(j.code || 'http_' + r.status, j.error || j.message || r.statusText); return j; });
    }, function () { throw mk('unreachable', 'Could not reach the signaller.'); });
  }
  function ev(type, props) { var e = new Event(type); if (props) for (var k in props) e[k] = props[k]; return e; }
  function later(fn, ms) { var t = setTimeout(fn, ms); return function () { clearTimeout(t); }; }

  /* ---- relay servers (STUN, and TURN when the server has one) ---- */
  var iceCache = {};
  function getIce(opts) {
    opts = opts || {};
    if (Array.isArray(opts.iceServers)) return Promise.resolve(opts.iceServers);
    var key = opts.turnGrant || '', c = iceCache[key];
    if (c && Date.now() - c.at < 300000) return Promise.resolve(c.servers);
    return post('ice', { turnGrant: opts.turnGrant }).then(function (j) { var s = j.iceServers || []; iceCache[key] = { at: Date.now(), servers: s }; return s; }, function () { return [{ urls: ['stun:stun.l.google.com:19302'] }]; });
  }

  /* ---- the server-sent-events channel, with replay and silence detection ---- */
  function Channel(id, key, onmsg, ondead) {
    var self = this, es = null, seen = Date.now(), last = 0, closed = false, watch;
    function open() {
      if (closed) return;
      es = new EventSource('/_peer/events?id=' + encodeURIComponent(id) + '&key=' + encodeURIComponent(key) + (last ? '&last=' + last : ''));
      es.onmessage = function (m) { seen = Date.now(); if (m.lastEventId) last = Number(m.lastEventId) || last; var d; try { d = JSON.parse(m.data); } catch (e) { return; } if (d && d.t === 'hb') return; onmsg(d); };
      es.onerror = function () { if (closed) return; if (es.readyState === 2) { es = null; closed = true; clearInterval(watch); ondead(); } };
    }
    self.close = function () { closed = true; clearInterval(watch); try { es && es.close(); } catch (e) {} };
    watch = setInterval(function () { if (!closed && Date.now() - seen > SSE_SILENT_MS) { try { es && es.close(); } catch (e) {} seen = Date.now(); open(); } }, 10000);
    open();
  }

  /* ---- one connection to one peer (same class on both sides) ---- */
  class Conn extends EventTarget { constructor(o) {
    super();
    var self = this;
    self.owner = o.owner || null; self.connected = false; self.closed = false; self.linkState = 'connecting';
    self.publications = new Map(); self.media = new Map();
    var polite = !!o.polite, signal = o.signal, pc, data, ctl, makingOffer = false, ignoreOffer = false, canOffer = !!o.initiator;
    var names = {}, pendingTracks = {}, ents = {}, troubleAt = 0, attempt = 0, lastRx = Date.now(), timers = [], recTimeout = Number(o.recoveryTimeout) > 0 ? Number(o.recoveryTimeout) : DEFAULT_RECOVERY;
    self.peerconnection = pc = new RTCPeerConnection({ iceServers: o.iceServers || [], iceTransportPolicy: o.forceRelay ? 'relay' : 'all' });
    data = pc.createDataChannel('d', { negotiated: true, id: 0 }); data.binaryType = 'arraybuffer';
    ctl = pc.createDataChannel('c', { negotiated: true, id: 1 });

    function state(s, extra) { if (self.closed && s !== 'closed') return; if (self.linkState === s && s !== 'recovering') return; self.linkState = s; self.dispatchEvent(ev('linkstate', Object.assign({ state: s }, extra || {}))); }
    function sendCtl(m) { try { if (ctl.readyState === 'open') ctl.send(JSON.stringify(m)); } catch (e) {} }
    function sig(m) { return signal(m).catch(function () {}); }

    pc.onnegotiationneeded = function () {
      if (!canOffer) return;
      makingOffer = true;
      pc.setLocalDescription().then(function () { return sig({ d: pc.localDescription }); }).catch(function () {}).then(function () { makingOffer = false; });
    };
    pc.onicecandidate = function (e) { if (e.candidate) sig({ c: e.candidate }); };
    self._onSignal = function (m) {
      if (self.closed || !m) return;
      if (m.d) {
        var collision = m.d.type === 'offer' && (makingOffer || pc.signalingState !== 'stable');
        ignoreOffer = !polite && collision; if (ignoreOffer) return;
        pc.setRemoteDescription(m.d).then(function () {
          canOffer = true;
          if (m.d.type === 'offer') return pc.setLocalDescription().then(function () { return sig({ d: pc.localDescription }); });
        }).catch(function (e) { self.dispatchEvent(ev('error', { error: e })); });
      } else if (m.c) { pc.addIceCandidate(m.c).catch(function (e) { if (!ignoreOffer) self.dispatchEvent(ev('error', { error: e })); }); }
    };
    self._signalLost = function () {};

    /* data */
    data.onopen = function () { if (self.closed) return; self.connected = true; troubleAt = 0; attempt = 0; lastRx = Date.now(); state('connected'); self.dispatchEvent(ev('open')); };
    data.onmessage = function (m) { lastRx = Date.now(); self.dispatchEvent(new MessageEvent('message', { data: m.data })); };
    data.onerror = function (e) { self.dispatchEvent(ev('error', { error: (e && e.error) || new Error('Data channel error') })); };
    data.onclose = function () { if (!self.closed && !self._byeing) trouble(); };
    ctl.onmessage = function (m) {
      lastRx = Date.now(); var d; try { d = JSON.parse(m.data); } catch (e) { return; }
      if (d.t === 'pub') { names[d.streamId] = d.name; flush(d.streamId); }
      else if (d.t === 'unpub') { var s = self.media.get(d.name); if (s) { self.media.delete(d.name); self.dispatchEvent(ev('mediaended', { name: d.name, stream: s })); } for (var k in names) if (names[k] === d.name) delete names[k]; }
      else if (d.t === 'bye') shutdown(String(d.reason || 'closed').slice(0, 200), false);
    };
    ctl.onopen = function () { for (var n in ents) announce(n); };

    /* link health: ping, detect trouble, and (on the connecting side) restart the network path */
    timers.push(setInterval(function () {
      if (self.closed) return; sendCtl({ t: 'ping' });
      var quiet = Date.now() - lastRx;
      if (self.connected && quiet > UNSTABLE_MS && self.linkState === 'connected') state('unstable');
      if (self.connected && quiet > DEAD_MS) trouble();
    }, PING_MS));
    pc.oniceconnectionstatechange = function () {
      var s = pc.iceConnectionState;
      if (s === 'failed') trouble();
      else if (s === 'disconnected' && self.connected) { state('unstable'); timers.push(later(function () { if (!self.closed && pc.iceConnectionState === 'disconnected') trouble(); }, 4000)); }
      else if ((s === 'connected' || s === 'completed') && self.connected && ctl.readyState === 'open') { troubleAt = 0; attempt = 0; lastRx = Date.now(); state('connected'); }
    };
    var retrying = false;
    function trouble() {
      if (self.closed) return;
      if (!troubleAt) troubleAt = Date.now();
      if (Date.now() - troubleAt > recTimeout) return shutdown('The connection was lost.', true);
      attempt++; state('recovering', { attempt: attempt });
      if (o.initiator && !retrying) { try { pc.restartIce(); } catch (e) {} }
      if (!retrying) { retrying = true; timers.push(later(function () { retrying = false; if (!self.closed && self.linkState !== 'connected') trouble(); }, RETRY_MS)); }
    }

    /* media */
    function announce(name) { var en = ents[name]; if (en) sendCtl({ t: 'pub', name: name, streamId: en.wireId }); }
    function limits(sender, opt) {
      if (!opt || !sender || !sender.getParameters) return;
      try {
        var p = sender.getParameters(); if (!p.encodings || !p.encodings.length) p.encodings = [{}];
        ['maxBitrate', 'maxFramerate', 'scaleResolutionDownBy'].forEach(function (k) { if (opt[k] != null) p.encodings[0][k] = opt[k]; });
        if (opt.degradationPreference) p.degradationPreference = opt.degradationPreference;
        sender.setParameters(p).catch(function () {});
      } catch (e) {}
    }
    this.publish = function (name, source, options) {
      if (self.closed) throw mk('closed', 'The connection is closed');
      name = String(name); var tracks = !source ? [] : (source.getTracks ? source.getTracks() : [source]);
      var en = ents[name] || (ents[name] = { wireId: null, stream: null, senders: {}, opts: {} });
      if (options) en.opts = Object.assign(en.opts, options);
      if (!en.stream && tracks.length) { en.stream = new MediaStream(); en.wireId = en.stream.id; }
      var kinds = {};
      tracks.forEach(function (t) {
        kinds[t.kind] = 1; var s = en.senders[t.kind];
        if (s) s.replaceTrack(t).catch(function () {});
        else en.senders[t.kind] = pc.addTrack(t, en.stream || new MediaStream([t]));
        limits(en.senders[t.kind], en.opts[t.kind]);
      });
      for (var k in en.senders) if (!kinds[k]) en.senders[k].replaceTrack(null).catch(function () {});
      self.publications.set(name, source || null);
      if (en.wireId) announce(name);
    };
    this.unpublish = function (name) {
      name = String(name); var en = ents[name]; if (!en) return;
      for (var k in en.senders) { try { pc.removeTrack(en.senders[k]); } catch (e) {} }
      delete ents[name]; self.publications.delete(name); sendCtl({ t: 'unpub', name: name });
    };
    this.configure = function (name, options) {
      var en = ents[String(name)]; if (!en || !options) return;
      ['audio', 'video'].forEach(function (k) { if (options[k]) { en.opts[k] = Object.assign(en.opts[k] || {}, options[k]); limits(en.senders[k], en.opts[k]); } });
    };
    function deliver(name, stream, track) { self.media.set(name, stream); self.dispatchEvent(ev('media', { name: name, stream: stream, track: track })); }
    function flush(sid) { var list = pendingTracks[sid]; if (!list) return; delete pendingTracks[sid]; list.forEach(function (x) { x.cancel(); deliver(names[sid], x.stream, x.track); }); }
    pc.ontrack = function (e) {
      var stream = (e.streams && e.streams[0]) || new MediaStream([e.track]), sid = stream.id;
      if (names[sid]) return deliver(names[sid], stream, e.track);
      var item = { stream: stream, track: e.track }; (pendingTracks[sid] = pendingTracks[sid] || []).push(item);
      item.cancel = later(function () { // no name announced: use the media section id
        var list = pendingTracks[sid] || []; var i = list.indexOf(item); if (i < 0) return; list.splice(i, 1);
        var tr = pc.getTransceivers().filter(function (t) { return t.receiver && t.receiver.track === e.track; })[0];
        deliver(tr && tr.mid != null ? String(tr.mid) : e.track.id, stream, e.track);
      }, 1500);
    };

    /* data out */
    this.send = function (d) {
      if (self.closed) throw mk('closed', 'The connection is closed');
      if (data.readyState !== 'open') throw mk('not_open', 'The connection is not open yet');
      data.send(d);
    };

    function cleanup() { timers.forEach(function (t) { typeof t === 'function' ? t() : clearInterval(t); }); timers = []; try { pc.close(); } catch (e) {} if (o.onGone) o.onGone(); }
    function shutdown(reason, notify) {
      if (self.closed) return; self.closed = true; self.connected = false; self.linkState = 'closed';
      cleanup();
      self.dispatchEvent(ev('linkstate', { state: 'closed' })); self.dispatchEvent(ev('close', { reason: reason }));
    }
    this.close = function (reason) {
      if (self.closed) return; self._byeing = true;
      sendCtl({ t: 'bye', reason: reason == null ? 'left' : String(reason) });
      var t0 = Date.now();
      (function wait() { if (ctl.bufferedAmount > 0 && Date.now() - t0 < 300) return setTimeout(wait, 20); shutdown(reason == null ? 'closed' : String(reason), true); })();
    };
    this._shutdown = shutdown;
  } }

  /* ---- hosting ---- */
  class Server extends EventTarget { constructor(info, opts, ice) {
    super();
    var self = this, ch = null, dead = false;
    self.inviteCode = info.inviteCode; self.connections = new Map(); self.closed = false;
    var id = info.id, key = info.key, user = info.user;
    function open() { ch = new Channel(id, key, onmsg, lost); }
    function onmsg(m) {
      if (m.t === 'join') {
        var cid = m.cid, c = new Conn({
          polite: true, initiator: false, iceServers: ice, forceRelay: opts.forceRelay, recoveryTimeout: opts.recoveryTimeout, owner: user,
          signal: function (d) { return post('signal', { id: id, key: key, to: cid, data: d }); },
          onGone: function () { self.connections.delete(cid); }
        });
        self.connections.set(cid, c);
        self.dispatchEvent(ev('connection', { conn: c, user: m.user }));
      } else if (m.t === 'sig') { var cc = self.connections.get(m.cid); if (cc) cc._onSignal(m.data); }
    }
    function lost() { // the relay forgot us (it restarted): claim an invite again
      if (self.closed || dead) return; var n = 0;
      (function again() {
        post('serve', Object.assign({ id: id, key: key }, opts.anonToken ? { anonToken: opts.anonToken } : {})).then(function (j) {
          id = j.id; key = j.key; self.inviteCode = j.inviteCode; open();
          self.dispatchEvent(ev('reconnect', { inviteCode: j.inviteCode, resumed: !!j.resumed }));
        }, function (e) { if (self.closed) return; if (e && e.code === 'auth_required') return; setTimeout(again, Math.min(15000, 1000 * (++n))); });
      })();
    }
    self.close = function () {
      if (self.closed) return; self.closed = true; dead = true;
      self.connections.forEach(function (c) { try { c.close('closed'); } catch (e) {} });
      if (ch) ch.close(); post('close', { id: id, key: key, reason: 'closed' }).catch(function () {});
    };
    open();
  } }

  var peer = {
    serve: function (opts) {
      opts = opts || {};
      return Promise.all([post('serve', opts.anonToken ? { anonToken: opts.anonToken } : {}), getIce(opts)]).then(function (r) { return new Server(r[0], opts, r[1]); });
    },
    connect: function (invite, opts) {
      opts = opts || {}; invite = String(invite || '').trim();
      if (!invite) return Promise.reject(mk('invalid_invite', 'Invalid invite code'));
      return Promise.all([post('connect', { invite: invite, anonToken: opts.anonToken }), getIce(opts)]).then(function (r) {
        var info = r[0], id = info.id, key = info.key, ch = null, c;
        c = new Conn({
          polite: false, initiator: true, iceServers: r[1], forceRelay: opts.forceRelay, recoveryTimeout: opts.recoveryTimeout, owner: info.owner,
          signal: function (d) { return post('signal', { id: id, key: key, data: d }); },
          onGone: function () { if (ch) ch.close(); post('close', { id: id, key: key }).catch(function () {}); }
        });
        ch = new Channel(id, key, function (m) {
          if (m.t === 'sig') c._onSignal(m.data);
          else if (m.t === 'host-gone' && !c.connected && !c.closed) c._shutdown('The host left the session.', false);
        }, function () { /* signalling is gone; the direct link carries on, and closes if it fails */ });
        return c;
      });
    },
    ensureTurnRelays: function (opts) { return getIce(opts).then(function () {}); },
    createGuestGrant: function () { return post('grant', {}); }
  };
  g.__aosPeer = peer;
})(window);
