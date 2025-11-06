import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, shouldIgnoreKeyboardEvent, EMAIL_KEYBOARD_SHORTCUTS } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let handleJ: ReturnType<typeof vi.fn>;
  let handleK: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handleJ = vi.fn();
    handleK = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register keyboard shortcuts', () => {
    renderHook(() =>
      useKeyboardShortcuts([
        {
          key: 'j',
          handler: handleJ,
          description: 'Next email',
          category: 'navigation',
        },
        {
          key: 'k',
          handler: handleK,
          description: 'Previous email',
          category: 'navigation',
        },
      ])
    );

    // Simulate pressing 'j'
    const eventJ = new KeyboardEvent('keydown', { key: 'j' });
    window.dispatchEvent(eventJ);

    expect(handleJ).toHaveBeenCalledTimes(1);
    expect(handleK).not.toHaveBeenCalled();
  });

  it('should ignore shortcuts when disabled', () => {
    renderHook(() =>
      useKeyboardShortcuts(
        [
          {
            key: 'j',
            handler: handleJ,
            description: 'Next email',
            category: 'navigation',
          },
        ],
        false // disabled
      )
    );

    const eventJ = new KeyboardEvent('keydown', { key: 'j' });
    window.dispatchEvent(eventJ);

    expect(handleJ).not.toHaveBeenCalled();
  });

  it('should ignore shortcuts when typing in input fields', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      useKeyboardShortcuts([
        {
          key: 'j',
          handler: handleJ,
          description: 'Next email',
          category: 'navigation',
        },
      ])
    );

    const eventJ = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
    input.dispatchEvent(eventJ);

    expect(handleJ).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});

describe('shouldIgnoreKeyboardEvent', () => {
  it('should return true when typing in input', () => {
    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', { key: 'j' });
    Object.defineProperty(event, 'target', { value: input, writable: false });

    expect(shouldIgnoreKeyboardEvent(event)).toBe(true);
  });

  it('should return true when typing in textarea', () => {
    const textarea = document.createElement('textarea');
    const event = new KeyboardEvent('keydown', { key: 'j' });
    Object.defineProperty(event, 'target', { value: textarea, writable: false });

    expect(shouldIgnoreKeyboardEvent(event)).toBe(true);
  });

  it('should return false when not typing in input', () => {
    const div = document.createElement('div');
    const event = new KeyboardEvent('keydown', { key: 'j' });
    Object.defineProperty(event, 'target', { value: div, writable: false });

    expect(shouldIgnoreKeyboardEvent(event)).toBe(false);
  });

  it('should return true when modifier keys are pressed', () => {
    const div = document.createElement('div');
    const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
    Object.defineProperty(event, 'target', { value: div, writable: false });

    expect(shouldIgnoreKeyboardEvent(event)).toBe(true);
  });
});

describe('EMAIL_KEYBOARD_SHORTCUTS', () => {
  it('should have all expected shortcut categories', () => {
    expect(EMAIL_KEYBOARD_SHORTCUTS.navigation).toHaveLength(2);
    // Action shortcuts were expanded; verify full set
    expect(EMAIL_KEYBOARD_SHORTCUTS.action).toHaveLength(7);
    expect(EMAIL_KEYBOARD_SHORTCUTS.search).toHaveLength(1);
    expect(EMAIL_KEYBOARD_SHORTCUTS.modal).toHaveLength(1);
    expect(EMAIL_KEYBOARD_SHORTCUTS.help).toHaveLength(1);
  });

  it('should have correct keyboard keys', () => {
    expect(EMAIL_KEYBOARD_SHORTCUTS.navigation[0].key).toBe('j');
    expect(EMAIL_KEYBOARD_SHORTCUTS.navigation[1].key).toBe('k');
    const actionKeys = EMAIL_KEYBOARD_SHORTCUTS.action.map(a => a.key);
    expect(actionKeys).toEqual([
      'r', // reply
      'f', // forward
      'c', // compose
      'e', // archive
      'Backspace', // delete
      'm', // mark read
      'u', // mark unread
    ]);
    expect(EMAIL_KEYBOARD_SHORTCUTS.search[0].key).toBe('/');
    expect(EMAIL_KEYBOARD_SHORTCUTS.modal[0].key).toBe('Escape');
    expect(EMAIL_KEYBOARD_SHORTCUTS.help[0].key).toBe('?');
  });
});
