import { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileVideo,
  FileImage,
  FileArchive,
  FileText,
  Server,
  Zap,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { assetApi } from '../../../services/api';
import { Button } from '../../../components/ui';

export default function CloudStorageUploader({ isOpen, onClose, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [assetType, setAssetType] = useState('Raw Video');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [speed, setSpeed] = useState('');
  const [statusText, setStatusText] = useState('');
  const [queueStatus, setQueueStatus] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      assetApi
        .getQueueStatus()
        .then(setQueueStatus)
        .catch(() => {});
    }
  }, [isOpen]);

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return;
    setFile(selectedFile);
    if (selectedFile.type.startsWith('video/')) {
      setAssetType('Raw Video');
    } else if (selectedFile.type.startsWith('image/')) {
      setAssetType('Thumbnail');
    } else if (selectedFile.name.endsWith('.zip') || selectedFile.name.endsWith('.rar')) {
      setAssetType('Project File');
    } else {
      setAssetType('Document');
    }
    setProgress(0);
    setStatusText('');
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  async function handleStartUpload() {
    if (!file) {
      toast.error('Select a file to upload first.');
      return;
    }
    try {
      setUploading(true);
      setStatusText('Requesting secure presigned URL from Cloudflare R2 / S3...');
      startTimeRef.current = Date.now();

      const result = await assetApi.uploadDirect(
        file,
        { assetType },
        ({ percent, loaded, total }) => {
          setProgress(percent);
          setUploadedBytes(loaded);
          setTotalBytes(total);
          const elapsedSecs = (Date.now() - startTimeRef.current) / 1000;
          if (elapsedSecs > 0.5) {
            const bytesPerSec = loaded / elapsedSecs;
            setSpeed(`${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`);
          }
          if (percent < 100) {
            setStatusText(`Streaming raw binary directly to cloud storage (${percent}%)...`);
          } else {
            setStatusText('Verifying payload and enqueuing background BullMQ worker...');
          }
        },
      );

      setStatusText('Asset successfully stored in cloud and registered in database.');
      toast.success(`Uploaded ${file.name} to cloud storage!`);
      if (onUploadComplete) onUploadComplete(result);
      setTimeout(() => {
        setFile(null);
        setProgress(0);
        setUploading(false);
        onClose();
      }, 1200);
    } catch (err) {
      setUploading(false);
      setStatusText('');
      toast.error(err.message || 'Direct cloud upload failed.');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-line bg-[#10141f] p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          disabled={uploading}
          className="absolute right-5 top-5 text-[#8c94a6] transition hover:text-white disabled:opacity-40"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <UploadCloud size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Direct-to-Cloud Upload</h3>
            <p className="text-xs text-[#8c94a6]">AWS S3 & Cloudflare R2 Presigned Engine</p>
          </div>
        </div>

        {queueStatus && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[#1b2338] bg-[#0c101c] px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2 text-[#8c94a6]">
              <Server size={13} className="text-primary" />
              <span>{queueStatus.engine}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span>Active</span>
            </div>
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            isDragOver
              ? 'border-primary bg-primary/10'
              : 'border-[#232c42] bg-[#0a0e18] hover:border-primary/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          {file ? (
            <div className="flex flex-col items-center">
              {file.type.startsWith('video/') ? (
                <FileVideo size={36} className="text-indigo-400" />
              ) : file.type.startsWith('image/') ? (
                <FileImage size={36} className="text-emerald-400" />
              ) : file.name.endsWith('.zip') ? (
                <FileArchive size={36} className="text-amber-400" />
              ) : (
                <FileText size={36} className="text-primary" />
              )}
              <p className="mt-3 text-sm font-semibold text-white">{file.name}</p>
              <p className="mt-0.5 text-xs text-[#8c94a6]">{formatBytes(file.size)}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud size={32} className="text-[#8c94a6]" />
              <p className="mt-3 text-xs font-medium text-white sm:text-sm">
                Drop your 4K video, RAW footage, or project file
              </p>
              <p className="mt-1 text-[11px] text-[#8c94a6]">
                MP4, MOV, ProRes, PNG, ZIP · Up to 5 GB direct streaming
              </p>
            </div>
          )}
        </div>

        {file && !uploading && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#c6ccdb]">
                Asset Classification
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {['Raw Video', 'Final Cut', 'Thumbnail', 'Project File'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAssetType(type)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                      assetType === type
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-[#222b40] bg-[#121624] text-[#8c94a6] hover:bg-[#182032]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-primary">{statusText}</span>
              <span className="text-white">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#182030]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8c94a6]">
              <span>
                {formatBytes(uploadedBytes)} of {formatBytes(totalBytes)}
              </span>
              {speed && <span>Speed: {speed}</span>}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#1b2338] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="btn btn-secondary text-xs disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            variant="primary"
            onClick={handleStartUpload}
            loading={uploading}
            disabled={!file || uploading}
            className="text-xs"
          >
            <Zap size={13} />
            Start Direct Cloud Upload
          </Button>
        </div>
      </div>
    </div>
  );
}
