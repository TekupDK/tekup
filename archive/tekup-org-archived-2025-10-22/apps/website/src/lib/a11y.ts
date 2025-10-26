export function onActivate(callback: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };
}

export function pressableProps(options?: { disabled?: boolean; label?: string }) {
  const { disabled, label } = options || {};
  return {
    role: 'button' as const,
    tabIndex: disabled ? -1 : 0,
    'aria-disabled': disabled || undefined,
    'aria-label': label,
  };
}