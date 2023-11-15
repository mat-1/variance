/* eslint-disable import/prefer-default-export */
import { useEffect, useRef } from 'react';

export interface Store<S> {
  getItem: () => S | null;
  setItem: (event: S) => S;
}

export function useStore<S>(...args: unknown[]): Store<S> {
  const itemRef = useRef<S | null>(null);

  const getItem = () => itemRef.current;

  const setItem = (event: S): S => {
    itemRef.current = event;
    return itemRef.current;
  };

  useEffect(() => {
    itemRef.current = null;
    return () => {
      itemRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, args);

  return { getItem, setItem };
}
