import { describe, expect, it } from 'vitest';

import { getProjectNameFromFolderPath } from './project';

describe('getProjectNameFromFolderPath', () => {
  it('returns the folder name from a Windows path', () => {
    expect(getProjectNameFromFolderPath('C:\\Work\\Founder outreach')).toBe('Founder outreach');
  });

  it('ignores trailing separators', () => {
    expect(getProjectNameFromFolderPath('C:\\Work\\Founder outreach\\')).toBe(
      'Founder outreach',
    );
  });

  it('returns an empty name for a root path', () => {
    expect(getProjectNameFromFolderPath('C:\\')).toBe('');
  });
});
