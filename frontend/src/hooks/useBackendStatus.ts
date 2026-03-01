import { useState, useEffect } from 'react';

export function useBackendStatus(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setOk(res.ok))
      .catch(() => setOk(false));
  }, []);

  return ok;
}
