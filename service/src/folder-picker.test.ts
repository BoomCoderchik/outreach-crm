import { describe, expect, it } from 'vitest';

import { createFolderPicker, type FolderPickerProcessResult } from './folder-picker';

function pickerWith(result: FolderPickerProcessResult) {
  return createFolderPicker(async () => result, 'win32');
}

describe('native project folder picker', () => {
  it('returns the selected folder path', async () => {
    const pickFolder = pickerWith({ exitCode: 0, stdout: 'C:\\Work\\Founder outreach\r\n' });

    await expect(pickFolder()).resolves.toEqual({
      kind: 'selected',
      folderPath: 'C:\\Work\\Founder outreach',
    });
  });

  it('returns cancellation when the dialog produces no path', async () => {
    const pickFolder = pickerWith({ exitCode: 0, stdout: '' });

    await expect(pickFolder()).resolves.toEqual({ kind: 'cancelled' });
  });

  it('rejects on unsupported platforms', async () => {
    const pickFolder = createFolderPicker(
      async () => ({ exitCode: 0, stdout: 'ignored' }),
      'linux',
    );

    await expect(pickFolder()).rejects.toThrow('only supported on Windows');
  });

  it('turns picker process failures into a user-facing error', async () => {
    const pickFolder = createFolderPicker(async () => {
      throw new Error('powershell failed');
    }, 'win32');

    await expect(pickFolder()).rejects.toThrow('Could not open the Windows folder picker');
  });
});
