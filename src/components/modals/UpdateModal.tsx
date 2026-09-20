import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RotateCcw, 
  X, 
  Sparkles, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { check, Update, DownloadEvent } from '@tauri-apps/plugin-updater';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateAvailableChange?: (available: boolean, version?: string) => void;
}

type UpdateStatus = 'idle' | 'checking' | 'available' | 'up-to-date' | 'downloading' | 'ready-restart' | 'error';

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  onUpdateAvailableChange
}) => {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  const [newVersion, setNewVersion] = useState<string>('');
  const [releaseNotes, setReleaseNotes] = useState<string>('');
  const [releaseDate, setReleaseDate] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeUpdate, setActiveUpdate] = useState<Update | null>(null);
  
  const [autoCheck, setAutoCheck] = useState<boolean>(() => {
    const saved = localStorage.getItem('wildcat_auto_check_updates');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleAutoCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAutoCheck(checked);
    localStorage.setItem('wildcat_auto_check_updates', String(checked));
  };

  const checkForUpdates = useCallback(async (isManual: boolean = true) => {
    if (status === 'downloading') return;
    setStatus('checking');
    setErrorMessage('');

    try {
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      
      if (!isTauri) {
        setTimeout(() => {
          setStatus('up-to-date');
          setCurrentVersion('1.0.0 (Web Preview)');
        }, 600);
        return;
      }

      const update = await check();

      if (update && update.available) {
        setActiveUpdate(update);
        setCurrentVersion(update.currentVersion);
        setNewVersion(update.version);
        setReleaseNotes(update.body || 'No release notes provided.');
        setReleaseDate(update.date || '');
        setStatus('available');
        onUpdateAvailableChange?.(true, update.version);
      } else {
        setActiveUpdate(null);
        setStatus('up-to-date');
        onUpdateAvailableChange?.(false);
      }
    } catch (err: unknown) {
      console.warn('Wildcat Studio update check error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Unable to connect to release endpoint.');
      setStatus('error');
      if (!isManual) {
        onUpdateAvailableChange?.(false);
      }
    }
  }, [status, onUpdateAvailableChange]);

  useEffect(() => {
    if (isOpen && status === 'idle') {
      checkForUpdates(true);
    }
  }, [isOpen, status, checkForUpdates]);

  const handleDownloadAndInstall = async () => {
    if (!activeUpdate) return;
    setStatus('downloading');
    setDownloadProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(0);

    try {
      let total = 0;
      let currentDownloaded = 0;

      await activeUpdate.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === 'Started') {
          total = event.data.contentLength || 0;
          setTotalBytes(total);
        } else if (event.event === 'Progress') {
          currentDownloaded += event.data.chunkLength;
          setDownloadedBytes(currentDownloaded);
          if (total > 0) {
            const pct = Math.min(100, Math.round((currentDownloaded / total) * 100));
            setDownloadProgress(pct);
          }
        } else if (event.event === 'Finished') {
          setDownloadProgress(100);
        }
      });

      setStatus('ready-restart');
    } catch (err: unknown) {
      console.error('Update download failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Failed to download and install update.');
      setStatus('error');
    }
  };

  const handleRelaunch = async () => {
    window.location.reload();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(5, 8, 14, 0.78)',
      WebkitBackdropFilter: 'blur(10px)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #111722, #0c1018)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(0, 210, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 210, 255, 0.12)',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cad-cyan)'
            }}>
              <Sparkles style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                Software Updates
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Wildcat Studio Standalone Suite
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Current Version Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck style={{ width: '16px', height: '16px', color: 'var(--cad-cyan)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Installed Version:</span>
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#fff',
              background: 'rgba(0, 210, 255, 0.1)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(0, 210, 255, 0.25)'
            }}>
              v{currentVersion}
            </span>
          </div>

          {/* Status Panes */}
          {status === 'checking' && (
            <div style={{
              padding: '32px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              textAlign: 'center'
            }}>
              <RefreshCw style={{ width: '28px', height: '28px', color: 'var(--cad-cyan)' }} />
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                Querying official release feed...
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Validating cryptographic Minisign payload signatures
              </span>
            </div>
          )}

          {status === 'up-to-date' && (
            <div style={{
              padding: '24px 18px',
              background: 'rgba(63, 185, 80, 0.06)',
              border: '1px solid rgba(63, 185, 80, 0.25)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(63, 185, 80, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cad-green)',
                marginBottom: '4px'
              }}>
                <CheckCircle2 style={{ width: '24px', height: '24px' }} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                You're Up to Date!
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '360px', lineHeight: 1.5 }}>
                Wildcat Studio v{currentVersion} is currently the newest available release.
              </p>
            </div>
          )}

          {status === 'available' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                padding: '16px',
                background: 'rgba(0, 210, 255, 0.06)',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(0, 210, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--cad-cyan)'
                  }}>
                    <Download style={{ width: '20px', height: '20px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                      Wildcat Studio v{newVersion}
                    </div>
                    {releaseDate && (
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        Released: {new Date(releaseDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0, 210, 255, 0.18)',
                  color: 'var(--cad-cyan)',
                  border: '1px solid rgba(0, 210, 255, 0.4)'
                }}>
                  New Release
                </span>
              </div>

              {/* Release Notes Box */}
              {releaseNotes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <FileText style={{ width: '14px', height: '14px' }} />
                    <span>What's New in v{newVersion}</span>
                  </div>
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    fontSize: '0.82rem',
                    color: '#d1d5db',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {releaseNotes}
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'downloading' && (
            <div style={{
              padding: '20px',
              background: 'rgba(0, 210, 255, 0.05)',
              border: '1px solid rgba(0, 210, 255, 0.25)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                  Downloading &amp; Verifying Package...
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--cad-cyan)' }}>
                  {downloadProgress}%
                </span>
              </div>

              {/* Progress Bar Container */}
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${downloadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00d2ff, #388bfd)',
                  borderRadius: '999px',
                  transition: 'width 0.2s ease-out'
                }} />
              </div>

              {totalBytes > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.76rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
                </div>
              )}
            </div>
          )}

          {status === 'ready-restart' && (
            <div style={{
              padding: '22px 18px',
              background: 'rgba(63, 185, 80, 0.08)',
              border: '1px solid rgba(63, 185, 80, 0.35)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 style={{ width: '32px', height: '32px', color: 'var(--cad-green)' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Update Ready to Apply
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '380px' }}>
                The update package has been downloaded and cryptographically verified. Relaunch Wildcat Studio now to finalize the upgrade.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div style={{
              padding: '16px',
              background: 'rgba(248, 81, 73, 0.08)',
              border: '1px solid rgba(248, 81, 73, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--cad-red)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                  Update Check Failed
                </span>
                <span style={{ fontSize: '0.8rem', color: '#f87171', lineHeight: 1.45 }}>
                  {errorMessage}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  If offline or behind an air-gapped firewall, Wildcat Studio continues functioning fully without updates.
                </span>
              </div>
            </div>
          )}

          {/* Preferences Row */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px 0',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={autoCheck}
              onChange={handleToggleAutoCheck}
              style={{
                accentColor: 'var(--cad-cyan)',
                width: '15px',
                height: '15px',
                cursor: 'pointer'
              }}
            />
            <span>Automatically check for software updates on launch</span>
          </label>
        </div>

        {/* Action Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.25)'
        }}>
          <div>
            {status !== 'checking' && status !== 'downloading' && (
              <button
                type="button"
                onClick={() => checkForUpdates(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw style={{ width: '13px', height: '13px' }} />
                <span>Check Again</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {status === 'available' && (
              <button
                type="button"
                onClick={handleDownloadAndInstall}
                style={{
                  background: 'linear-gradient(135deg, #00d2ff, #0099cc)',
                  border: 'none',
                  color: '#000',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 4px 14px rgba(0, 210, 255, 0.35)'
                }}
              >
                <Download style={{ width: '15px', height: '15px' }} />
                <span>Install Update</span>
              </button>
            )}

            {status === 'ready-restart' && (
              <button
                type="button"
                onClick={handleRelaunch}
                style={{
                  background: 'linear-gradient(135deg, #3fb950, #2ea043)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 4px 14px rgba(63, 185, 80, 0.35)'
                }}
              >
                <RotateCcw style={{ width: '15px', height: '15px' }} />
                <span>Relaunch Wildcat Studio</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: '8px',
                padding: '7px 16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {status === 'ready-restart' ? 'Later' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
