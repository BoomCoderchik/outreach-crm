import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function buildWindowsFolderPickerScript() {
  return String.raw`Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class NativeFolderPicker
{
    private const uint FOS_PICKFOLDERS = 0x20;
    private const uint FOS_FORCEFILESYSTEM = 0x40;
    private const uint FOS_PATHMUSTEXIST = 0x800;
    private const uint SIGDN_FILESYSPATH = 0x80058000;
    private const int S_OK = 0;
    private const int ERROR_CANCELLED = unchecked((int)0x800704C7);
    private static readonly Guid CLSID_FileOpenDialog = new Guid("DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7");

    [ComImport]
    [Guid("42f85136-db7e-439c-85f1-e4075d135fc8")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IFileDialog
    {
        [PreserveSig] int Show(IntPtr parent);
        void SetFileTypes(uint count, IntPtr filters);
        void SetFileTypeIndex(uint index);
        void GetFileTypeIndex(out uint index);
        void Advise(IntPtr events, out uint cookie);
        void Unadvise(uint cookie);
        void SetOptions(uint options);
        void GetOptions(out uint options);
        void SetDefaultFolder(IShellItem folder);
        void SetFolder(IShellItem folder);
        void GetFolder(out IShellItem folder);
        void GetCurrentSelection(out IShellItem selection);
        void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string name);
        void GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string name);
        void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string title);
        void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string text);
        void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string label);
        void GetResult(out IShellItem result);
        void AddPlace(IShellItem place, uint alignment);
        void RemovePlace(IShellItem place);
        void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string extension);
        void Close(int result);
        void SetClientGuid(ref Guid guid);
        void ClearClientData();
        void SetFilter(IntPtr filter);
    }

    [ComImport]
    [Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IShellItem
    {
        void BindToHandler(IntPtr bindContext, ref Guid handlerId, ref Guid interfaceId, out IntPtr handler);
        void GetParent(out IShellItem parent);
        void GetDisplayName(uint displayName, out IntPtr name);
        void GetAttributes(uint attributes, out uint result);
        void Compare(IShellItem item, uint hint, out int result);
    }

    public static string PickFolder()
    {
        var dialogType = Type.GetTypeFromCLSID(CLSID_FileOpenDialog);
        var dialog = (IFileDialog)Activator.CreateInstance(dialogType);
        try
        {
            uint options;
            dialog.GetOptions(out options);
            dialog.SetOptions(options | FOS_PICKFOLDERS | FOS_FORCEFILESYSTEM | FOS_PATHMUSTEXIST);

            int result = dialog.Show(IntPtr.Zero);
            if (result == ERROR_CANCELLED) return string.Empty;
            if (result != S_OK) Marshal.ThrowExceptionForHR(result);

            IShellItem item;
            dialog.GetResult(out item);
            try
            {
                IntPtr name;
                item.GetDisplayName(SIGDN_FILESYSPATH, out name);
                try { return Marshal.PtrToStringUni(name) ?? string.Empty; }
                finally { Marshal.FreeCoTaskMem(name); }
            }
            finally { Marshal.ReleaseComObject(item); }
        }
        finally { Marshal.ReleaseComObject(dialog); }
    }
}
'@ -Language CSharp; [Console]::Out.Write([NativeFolderPicker]::PickFolder())`;
}

const WINDOWS_FOLDER_PICKER_SCRIPT = buildWindowsFolderPickerScript();

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

export type FolderPickerResult = { kind: 'selected'; folderPath: string } | { kind: 'cancelled' };

export const pickProjectFolder = createFolderPicker();
