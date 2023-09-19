/* eslint-disable import/prefer-default-export */
import { useEffect, useRef } from 'react';

export function useStore<S>(...args: unknown[]) {
  const itemRef = useRef(null);

  const getItem = (): S => itemRef.current;

  const setItem = (event: S): S => {
    itemRef.current = event;
    return itemRef.current;
  };

  useEffect(() => {
    itemRef.current = null;
    return () => {
      itemRef.current = null;
    };
  }, args);

  return { getItem, setItem };
}
