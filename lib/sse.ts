"use client";

import { useEffect, useRef, useState } from "react";

export interface StreamFrame<TData = unknown> {
  v: number;
  type: string;
  ts: string;
  data: TData;
}

export interface SseConsumerOptions {
  topics: string[];
  onFrame?: (frame: StreamFrame) => void;
  onError?: (error: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  retryBaseMs?: number;
  maxRetryMs?: number;
  jitter?: number;
}

export interface SseConnection {
  close: () => void;
  reconnect: () => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyJitter(ms: number, jitter: number): number {
  const amount = ms * jitter;
  const delta = (Math.random() - 0.5) * 2 * amount;
  return Math.max(100, ms + delta);
}

export async function mintStreamTicket(topics: string[]): Promise<{ ticket: string }> {
  const res = await fetch("/api/stream/ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topics }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as Record<string, unknown>).message)
        : `Failed to mint stream ticket: ${res.status}`;
    const error = new Error(message) as Error & { status?: number; body?: unknown };
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return res.json() as Promise<{ ticket: string }>;
}

export function createSseConnection(options: SseConsumerOptions): SseConnection {
  const {
    topics,
    onFrame,
    onError,
    onOpen,
    onClose,
    retryBaseMs = 1000,
    maxRetryMs = 30_000,
    jitter = 0.2,
  } = options;

  let es: EventSource | null = null;
  let closed = false;
  let retryCount = 0;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let currentTicket: string | null = null;

  const cleanup = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (es) {
      es.close();
      es = null;
    }
    currentTicket = null;
  };

  const connect = async () => {
    try {
      const ticket = await mintStreamTicket(topics);
      currentTicket = ticket.ticket;

      const baseUrl = process.env.NEXT_PUBLIC_NEST_API_URL;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_NEST_API_URL is not configured");
      }
      const url = `${baseUrl.replace(/\/$/, "")}/api/v1/stream?ticket=${encodeURIComponent(ticket.ticket)}`;
      es = new EventSource(url);

      es.onopen = () => {
        retryCount = 0;
        onOpen?.();
      };

      es.onmessage = (event) => {
        try {
          const frame = JSON.parse(event.data) as StreamFrame;
          if (typeof frame.v === "number" && typeof frame.type === "string") {
            onFrame?.(frame);
          }
        } catch (err) {
          onError?.(err);
        }
      };

      es.onerror = (event) => {
        onError?.(event);
      };

      es.addEventListener("close", () => {
        if (closed) return;
        cleanup();
        scheduleReconnect();
      });

      es.addEventListener("error", () => {
        if (closed) return;
        cleanup();
        scheduleReconnect();
      });
    } catch (err) {
      onError?.(err);
      if (closed) return;
      scheduleReconnect();
    }
  };

  const scheduleReconnect = async () => {
    if (closed) return;
    retryCount++;
    const backoff = Math.min(retryBaseMs * Math.pow(2, retryCount), maxRetryMs);
    const delay = applyJitter(backoff, jitter);
    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      if (!closed) {
        connect();
      }
    }, delay);
  };

  const close = () => {
    closed = true;
    cleanup();
    onClose?.();
  };

  const reconnect = () => {
    if (closed) return;
    cleanup();
    retryCount = 0;
    connect();
  };

  connect();

  return { close, reconnect };
}

export function useSse(options: SseConsumerOptions) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const connectionRef = useRef<SseConnection | null>(null);

  useEffect(() => {
    const conn = createSseConnection({
      ...options,
      onOpen: () => {
        setConnected(true);
        setError(null);
        options.onOpen?.();
      },
      onClose: () => {
        setConnected(false);
        options.onClose?.();
      },
      onError: (err) => {
        setError(err);
        options.onError?.(err);
      },
    });
    connectionRef.current = conn;

    return () => {
      conn.close();
      connectionRef.current = null;
    };
  }, [JSON.stringify(options.topics)]);

  return {
    connected,
    error,
    close: () => connectionRef.current?.close(),
    reconnect: () => connectionRef.current?.reconnect(),
  };
}
