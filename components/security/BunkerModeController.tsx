'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface NetworkInterceptionLog {
  timestamp: string;
  api: 'FETCH' | 'XHR' | 'BEACON' | 'WEBSOCKET';
  targetUrl: string;
  blocked: boolean;
}

export const BunkerModeController: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isKillSwitchActive, setIsKillSwitchActive] = useState<boolean>(false);
  const [blockedAttempts, setBlockedAttempts] = useState<NetworkInterceptionLog[]>([]);

  // Referencias a las primitivas nativas del navegador para restaurarlas al desactivar
  const nativeApis = useRef<{
    fetch?: typeof window.fetch;
    xhrOpen?: typeof XMLHttpRequest.prototype.open;
    sendBeacon?: typeof navigator.sendBeacon;
    WebSocket?: typeof window.WebSocket;
  }>({});

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const logBlockedAttempt = useCallback((api: NetworkInterceptionLog['api'], targetUrl: string) => {
    setBlockedAttempts((prev) => [
      { timestamp: new Date().toISOString(), api, targetUrl, blocked: true },
      ...prev.slice(0, 19),
    ]);
  }, []);

  const engageNetworkKillSwitch = useCallback(() => {
    if (isKillSwitchActive || typeof window === 'undefined') return;

    // Guardar referencias originales
    nativeApis.current = {
      fetch: window.fetch.bind(window),
      xhrOpen: XMLHttpRequest.prototype.open,
      sendBeacon: navigator.sendBeacon?.bind(navigator),
      WebSocket: window.WebSocket,
    };

    // 1. Anular window.fetch (permitiendo únicamente blobs locales y datos data:)
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (urlStr.startsWith('blob:') || urlStr.startsWith('data:')) {
        return nativeApis.current.fetch!(input, init);
      }
      logBlockedAttempt('FETCH', urlStr);
      throw new Error(
        `[BUNKER_MODE_KILLSWITCH] Petición de red saliente bloqueada por directiva Zero-Knowledge: ${urlStr}`,
      );
    };

    // 2. Anular XMLHttpRequest
    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null,
    ) {
      const urlStr = String(url);
      logBlockedAttempt('XHR', `${method} ${urlStr}`);
      throw new Error(
        `[BUNKER_MODE_KILLSWITCH] XHR bloqueado por directiva Zero-Knowledge: ${urlStr}`,
      );
    } as typeof XMLHttpRequest.prototype.open;

    // 3. Anular navigator.sendBeacon (usado por trackers de telemetría en unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon = (url: string | URL): boolean => {
        logBlockedAttempt('BEACON', String(url));
        return false;
      };
    }

    // 4. Anular WebSockets
    window.WebSocket = new Proxy(window.WebSocket, {
      construct(target, args: [string | URL]) {
        logBlockedAttempt('WEBSOCKET', String(args[0]));
        throw new Error(`[BUNKER_MODE_KILLSWITCH] Creación de túnel WebSocket denegada.`);
      },
    });

    setIsKillSwitchActive(true);
  }, [isKillSwitchActive, logBlockedAttempt]);

  const disengageNetworkKillSwitch = useCallback(() => {
    if (!isKillSwitchActive || typeof window === 'undefined') return;

    if (nativeApis.current.fetch) window.fetch = nativeApis.current.fetch;
    if (nativeApis.current.xhrOpen) XMLHttpRequest.prototype.open = nativeApis.current.xhrOpen;
    if (nativeApis.current.sendBeacon) navigator.sendBeacon = nativeApis.current.sendBeacon;
    if (nativeApis.current.WebSocket) window.WebSocket = nativeApis.current.WebSocket;

    setIsKillSwitchActive(false);
  }, [isKillSwitchActive]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isOffline
                ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                : isKillSwitchActive
                  ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-zinc-600'
            }`}
          />
          <span className="font-mono font-semibold tracking-wider uppercase text-zinc-100">
            {isOffline
              ? 'AIR-GAP FÍSICO VERIFICADO (OFFLINE)'
              : isKillSwitchActive
                ? 'MODO BÚNKER ACTIVO (KILL-SWITCH DE RED)'
                : 'CONECTADO A RED (PROCESAMIENTO LOCAL)'}
          </span>
        </div>

        <button
          onClick={isKillSwitchActive ? disengageNetworkKillSwitch : engageNetworkKillSwitch}
          className={`rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition cursor-pointer ${
            isKillSwitchActive
              ? 'bg-red-950/80 text-red-300 border border-red-800 hover:bg-red-900'
              : 'bg-zinc-900 text-zinc-200 border border-zinc-700 hover:bg-zinc-800'
          }`}
        >
          {isKillSwitchActive ? 'DESBLOQUEAR SOCKETS' : 'ACTIVAR KILL-SWITCH DE RED'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 font-mono text-[11px]">
        <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px]">ESTADO DE INTERFAZ NIC:</span>
          <span className={isOffline ? 'text-emerald-400 font-bold' : 'text-zinc-300'}>
            {isOffline ? 'DESCONECTADA (0.0.0.0)' : 'ONLINE'}
          </span>
        </div>
        <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px]">APIS DE RED (FETCH/XHR/WS):</span>
          <span className={isKillSwitchActive ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
            {isKillSwitchActive ? 'INTERCEPTADAS Y ANULADAS' : 'PERMITIDAS (CSP SELF)'}
          </span>
        </div>
        <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px]">INTENTOS BLOQUEADOS:</span>
          <span className="text-zinc-100 font-bold">{blockedAttempts.length}</span>
        </div>
      </div>

      {blockedAttempts.length > 0 && (
        <div className="mt-3 max-h-24 overflow-y-auto rounded-lg bg-black p-2 font-mono text-[10px] text-red-400 border border-red-950">
          {blockedAttempts.map((log, index) => (
            <div key={index}>
              [{log.timestamp.split('T')[1]?.slice(0, 8)}] BLOCKED {log.api} -&gt; {log.targetUrl}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
