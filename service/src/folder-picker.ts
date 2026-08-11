import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const WINDOWS_FOLDER_PICKER_SCRIPT = [
  'Add-Type -AssemblyName System.Windows.Forms',
  "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog",
  "$dialog.Description = 'Choose an outreach project folder'",
  '$dialog.ShowNewFolderButton = $false',
  "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($dialog.SelectedPath) }",
].join('; ');

export type FolderPickerProcessResult = {
  exitCode: number;
  stdout: string;
  stderr?: string;
};

export type FolderPickerRunner = () => Promise<FolderPickerProcessResult>;

async function runWindowsFolderPicker(): Promise<FolderPickerProcessResult> {
  const { stdout, stderr } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-STA', '-Command', WINDOWS_FOLDER_PICKER_SCRIPT],
    { windowsHide: true, maxBuffer: 1024 * 1024, encoding: 'utf8' },
  );

  return { exitCode: 0, stdout, stderr };
}

export function createFolderPicker(
  runner: FolderPickerRunner = runWindowsFolderPicker,
  platform: NodeJS.Platform = process.platform,
) {
  return async (): Promise<FolderPickerResult> => {
    if (platform !== 'win32') {
      throw new Error('The native folder picker is only supported on Windows');
    }

    let result: FolderPickerProcessResult;
    try {
      result = await runner();
    } catch {
      throw new Error('Could not open the Windows folder picker');
    }

    if (result.exitCode !== 0) {
      throw new Error('Could not open the Windows folder picker');
    }

    const folderPath = result.stdout.trim();
    return folderPath ? { kind: 'selected', folderPath } : { kind: 'cancelled' };
  };
}

export type FolderPickerResult =
  | { kind: 'selected'; folderPath: string }
  | { kind: 'cancelled' };

export const pickProjectFolder = createFolderPicker();
