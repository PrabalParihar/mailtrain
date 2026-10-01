'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
export type ResourcePage<T> = {
  data: T[];
  has_more: boolean;
  next_cursor: string | null;
  total_count: number;
};
export function useResourcePage<T extends { id: string }>(
  workspace: string,
  path: string,
  refreshToken = '',
) {
  const identity = workspace + ':' + path;
  const [state, setState] = useState<ResourcePage<T> & { identity: string }>({
    identity: '',
    data: [],
    has_more: false,
    next_cursor: null,
    total_count: 0,
  });
  const [error, setError] = useState<{ identity: string; message: string }>({
      identity: '',
      message: '',
    }),
    [busy, setBusy] = useState(false);
  const epoch = useRef(0),
    running = useRef(false),
    snapshot = useRef(state);

  const reload = useCallback(async () => {
    if (!workspace) return;
    const current = ++epoch.current;
    running.current = true;
    setBusy(true);
    try {
      const page = await api<ResourcePage<T>>(workspace, path);
      if (epoch.current === current) {
        const next = { ...page, identity };
        snapshot.current = next;
        setState(next);
        setError({ identity, message: '' });
      }
    } catch (e) {
      if (epoch.current === current)
        setError({
          identity,
          message: e instanceof Error ? e.message : 'Records could not be loaded.',
        });
    } finally {
      if (epoch.current === current) {
        running.current = false;
        setBusy(false);
      }
    }
  }, [workspace, path, identity]);
  useEffect(() => {
    void Promise.resolve().then(reload);
    const fence = epoch;
    return () => {
      fence.current++;
    };
  }, [reload, refreshToken]);
  const loadMore = async () => {
    const before = snapshot.current;
    if (running.current || before.identity !== identity || !before.next_cursor) return;
    const current = epoch.current;
    running.current = true;
    setBusy(true);
    try {
      const page = await api<ResourcePage<T>>(
        workspace,
        path + (path.includes('?') ? '&' : '?') + 'after=' + encodeURIComponent(before.next_cursor),
      );
      if (epoch.current !== current) return;
      const next = {
        ...page,
        identity,
        data: [
          ...before.data,
          ...page.data.filter((row) => !before.data.some((old) => old.id === row.id)),
        ],
      };
      snapshot.current = next;
      setState(next);
      setError({ identity, message: '' });
    } catch (e) {
      if (epoch.current === current)
        setError({
          identity,
          message: e instanceof Error ? e.message : 'Older records could not be loaded. Try again.',
        });
    } finally {
      if (epoch.current === current) {
        running.current = false;
        setBusy(false);
      }
    }
  };
  return {
    loaded: state.identity === identity,
    data: state.identity === identity ? state.data : [],
    total: state.identity === identity ? state.total_count : 0,
    hasMore: state.identity === identity && state.has_more,
    busy,
    error: error.identity === identity ? error.message : '',
    reload,
    loadMore,
  };
}
