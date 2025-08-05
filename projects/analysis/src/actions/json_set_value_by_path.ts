const jsonSetValueByPath = (obj: Record<string, unknown>, path: string, value: unknown): boolean => {
  const pathParts = path
    .replace(/^\$\./, '')
    .replaceAll(/\[(\d+)\]/g, '.$1')
    .split('.');
  let current: Record<string, unknown> | null = obj;

  for (let i = 0; i < pathParts.length - 1; i += 1) {
    const part = pathParts[i];

    if (!(part in current)) {
      return false;
    }

    current = current[part] as Record<string, unknown> | null;

    if (!current || typeof current !== 'object') {
      return false;
    }
  }

  // eslint-disable-next-line unicorn/prefer-at
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart in current) {
    current[lastPart] = value;

    return true;
  }

  return false;
};

export default jsonSetValueByPath;
