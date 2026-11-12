/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function safeGetStorage(key: string, fallback: string = ''): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) ?? fallback;
    }
  } catch {
    // Ignore restricted iframe / incognito errors
  }
  return fallback;
}

export function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore restricted iframe / quota errors
  }
}

export function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}
