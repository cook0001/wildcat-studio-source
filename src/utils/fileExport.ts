import { save } from '@tauri-apps/plugin-dialog';
import { writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { openPath } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';

export interface SaveExportOptions {
  defaultFileName: string;
  filters?: { name: string; extensions: string[] }[];
  content: string | Uint8Array;
  mimeType?: string;
  title?: string;
}

export interface SaveResult {
  success: boolean;
  cancelled?: boolean;
  path?: string;
  error?: string;
}

/**
 * Universally saves a file using Tauri v2 native save dialog and filesystem API,
 * with graceful browser fallback if running in web/preview mode.
 */
export async function saveExportFile(options: SaveExportOptions): Promise<SaveResult> {
  const { defaultFileName, filters, content, mimeType = 'text/plain;charset=utf-8', title = 'Save File' } = options;

  try {
    // Attempt native Tauri save dialog
    const selectedPath = await save({
      title,
      defaultPath: defaultFileName,
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });

    if (!selectedPath) {
      return { success: false, cancelled: true };
    }

    if (typeof content === 'string') {
      await writeTextFile(selectedPath, content);
    } else {
      await writeFile(selectedPath, content);
    }

    return { success: true, path: selectedPath };
  } catch (tauriError) {
    console.warn('Native Tauri save dialog failed or unavailable, falling back to browser download:', tauriError);

    try {
      // Browser fallback via object URL
      const blob = typeof content === 'string'
        ? new Blob([content], { type: mimeType })
        : new Blob([content as unknown as BlobPart], { type: mimeType });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, path: defaultFileName };
    } catch (browserError) {
      return {
        success: false,
        error: browserError instanceof Error ? browserError.message : String(browserError),
      };
    }
  }
}

/**
 * Checks whether the native Typst CLI is installed and discoverable on the host system.
 */
export async function isTypstAvailable(): Promise<boolean> {
  try {
    return await invoke<boolean>('check_typst_available');
  } catch (err) {
    console.warn('Typst availability check failed:', err);
    return false;
  }
}

/**
 * Compiles Typst source markup directly to a raw PDF byte array using the native Rust command.
 */
export async function compileTypstToPdf(typstSource: string): Promise<Uint8Array> {
  const bytes = await invoke<number[]>('compile_typst_pdf', { typstSource });
  return new Uint8Array(bytes);
}

/**
 * Opens a local file path using the default OS viewer/handler.
 */
export async function openFileInSystem(filePath: string): Promise<void> {
  await openPath(filePath);
}

/**
 * Standalone zero-dependency system print bridge.
 * Passes the isolated vector document to the native Rust trigger_system_print command
 * which writes it to the OS temp directory and launches the system print sheet,
 * or falls back to window.open / window.print() in non-Tauri environments.
 */
export async function openStandalonePrintWindow(htmlContent: string, title: string = 'Print Document'): Promise<void> {
  try {
    // 1. Primary path: Native Rust system print bridge (bypasses WKWebView restrictions completely)
    await invoke<string>('trigger_system_print', { htmlContent, title });
    return;
  } catch (tauriErr) {
    console.warn('Native trigger_system_print failed or running in web mode, falling back to browser window:', tauriErr);
  }

  // 2. Fallback for plain browser / Vite preview environments
  const printWindow = window.open('', '_blank', 'width=1100,height=850');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.title = title;
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (err) {
        console.warn('Print call failed in print window:', err);
      }
    }, 400);
  } else {
    window.print();
  }
}

/**
 * Direct native PDF print/preview bridge.
 * Writes compiled Typst PDF bytes to a temporary file and launches the native system viewer
 * (Apple Preview.app on macOS) for immediate toolroom printing or review.
 */
export async function openNativePdfPrint(pdfBytes: Uint8Array, title: string = 'Document'): Promise<void> {
  try {
    await invoke<string>('trigger_system_pdf_print', {
      pdfData: Array.from(pdfBytes),
      title,
    });
  } catch (err) {
    console.error('Failed to launch native PDF print viewer:', err);
    throw err;
  }
}

