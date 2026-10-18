import { useCallback, useEffect, useRef, useState } from 'react';
export function useData(loader, deps = []) {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  const count = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++count.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      if (request === count.current) setData(result);
    } catch (e) {
      if (request === count.current) setError(e);
    } finally {
      if (request === count.current) setLoading(false);
    }
  }, deps);
  useEffect(() => {
    refresh();
    return () => {
      count.current++;
    };
  }, [refresh]);
  return { data, loading, error, refresh, setData };
}
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}