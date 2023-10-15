/* eslint-disable max-classes-per-file */

import React from 'react';

export function bytesToSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return 'n/a';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}

export function diffMinutes(dt2, dt1) {
  let diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

export function isInSameDay(dt2, dt1) {
  return (
    dt2.getFullYear() === dt1.getFullYear() &&
    dt2.getMonth() === dt1.getMonth() &&
    dt2.getDate() === dt1.getDate()
  );
}

/**
 * @param ev
 * @param targetSelector element selector for Element.matches([selector])
 */
export function getEventCords(
  ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  targetSelector?: string,
) {
  const path = ev.nativeEvent.composedPath();
  const target = (
    targetSelector
      ? path.find((element: HTMLElement) => element.matches?.(targetSelector))
      : ev.target
  ) as HTMLElement;
  const boxInfo = target.getBoundingClientRect();

  return {
    x: boxInfo.x,
    y: boxInfo.y,
    width: boxInfo.width,
    height: boxInfo.height,
    detail: ev.detail,
  };
}

export function abbreviateNumber(number: number): string {
  if (number > 99) return '99+';
  return number.toString();
}

export class Debounce {
  timeoutId: ReturnType<typeof setTimeout> | null;

  constructor() {
    this.timeoutId = null;
  }

  /**
   * @param func - callback function
   * @param wait - wait in milliseconds to call func
   * @returns debounceCallback - to pass arguments to func callback
   */
  _(func: () => void, wait: number): (...args: unknown[]) => void {
    return (...args) => {
      clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => {
        func.apply(this, args);
        this.timeoutId = null;
      }, wait);
    };
  }
}

export class Throttle {
  timeoutId: ReturnType<typeof setTimeout> | null;

  constructor() {
    this.timeoutId = null;
  }

  /**
   * @param func - callback function
   * @param wait - wait in milliseconds to call func
   * @returns throttleCallback - to pass arguments to func callback
   */
  _(func: () => void, wait: number): (...args: unknown[]) => void {
    return (...args) => {
      if (this.timeoutId !== null) return;
      this.timeoutId = setTimeout(() => {
        func.apply(this, args);
        this.timeoutId = null;
      }, wait);
    };
  }
}

export function getUrlPrams(paramName) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get(paramName);
}

interface ScrollInfo {
  top: number;
  height: number;
  viewHeight: number;
  isScrollable: boolean;
}

export function getScrollInfo(target: HTMLElement): ScrollInfo {
  const top = Math.round(target.scrollTop);
  const height = Math.round(target.scrollHeight);
  const viewHeight = Math.round(target.offsetHeight);
  const isScrollable = height > viewHeight;
  return {
    top,
    height,
    viewHeight,
    isScrollable,
  };
}

export function avatarInitials(text) {
  return [...text][0];
}

export function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name);
}

export function setFavicon(url) {
  const favicon = document.querySelector('#favicon');
  if (!favicon) return;
  favicon.setAttribute('href', url);
}

export function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const host = document.body;
    const copyInput = document.createElement('input');
    copyInput.style.position = 'fixed';
    copyInput.style.opacity = '0';
    copyInput.value = text;
    host.append(copyInput);

    copyInput.select();
    copyInput.setSelectionRange(0, 99999);
    document.execCommand('Copy');
    copyInput.remove();
  }
}

export function suffixRename(name, validator) {
  let suffix = 2;
  let newName = name;
  do {
    newName = name + suffix;
    suffix += 1;
  } while (validator(newName));

  return newName;
}

export function getImageDimension(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      resolve({
        w: img.width,
        h: img.height,
      });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export function scaleDownImage(imageFile, width, height) {
  return new Promise((resolve) => {
    const imgURL = URL.createObjectURL(imageFile);
    const img = new Image();

    img.onload = () => {
      let newWidth = img.width;
      let newHeight = img.height;
      if (newHeight <= height && newWidth <= width) {
        resolve(imageFile);
      }

      if (newHeight > height) {
        newWidth = Math.floor(newWidth * (height / newHeight));
        newHeight = height;
      }
      if (newWidth > width) {
        newHeight = Math.floor(newHeight * (width / newWidth));
        newWidth = width;
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob((thumbnail) => {
        URL.revokeObjectURL(imgURL);
        resolve(thumbnail);
      }, imageFile.type);
    };

    img.src = imgURL;
  });
}

/**
 * @param {sigil} string sigil to search for (for example '@', '#' or '$')
 * @param {flags} string regex flags
 * @param {prefix} string prefix appended at the beginning of the regex
 * @returns {RegExp}
 */
export function idRegex(sigil, flags, prefix) {
  const servername = '(?:[a-zA-Z0-9-.]*[a-zA-Z0-9]+|\\[\\S+?\\])(?::\\d+)?';
  return new RegExp(`${prefix}(${sigil}\\S+:${servername})`, flags);
}

const matrixToRegex = /^https?:\/\/matrix.to\/#\/(\S+:\S+)/;
/**
 * Parses a matrix.to URL into an matrix id.
 * This function can later be extended to support matrix: URIs
 * @param {string} uri The URI to parse
 * @returns {string|null} The id or null if the URI does not match
 */
export function parseIdUri(uri) {
  const res = decodeURIComponent(uri).match(matrixToRegex);
  if (!res) return null;
  return res[1];
}
