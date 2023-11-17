/* eslint-disable import/prefer-default-export */
import { useState } from 'react';

export function useForceUpdate(): [null | Record<string, never>, () => void] {
  const [data, setData] = useState<null | Record<string, never>>(null);

  return [
    data,
    function forceUpdateHook() {
      setData({});
    },
  ];
}
