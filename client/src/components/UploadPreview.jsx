import { useEffect, useState } from 'react';
export default function UploadPreview({ file }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  if (!file || !url) return null;
  return (
    <div className="mt-4 rounded-xl border border-line p-3">
      {file.type.startsWith('image/') ? (
        <img
          src={url}
          alt="Selected upload preview"
          className="max-h-52 w-full rounded-lg object-contain"
        />
      ) : file.type.startsWith('video/') ? (
        <video src={url} controls className="max-h-52 w-full rounded-lg" />
      ) : (
        <p className="text-xs text-muted">Document selected: {file.name}</p>
      )}
      <p className="mt-2 text-[10px] text-muted">
        {(file.size / 1024 / 1024).toFixed(2)} MB · Your file is uploaded only when you click Upload
        asset.
      </p>
    </div>
  );
}