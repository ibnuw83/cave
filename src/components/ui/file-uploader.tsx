
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFileUpload, UploadProgress } from '@/lib/storage';
import { Upload, X, CheckCircle, AlertCircle, File as FileIcon } from 'lucide-react';
import Image from 'next/image';

interface FileUploaderProps {
  label: string;
  filePath: string;
  currentFileUrl?: string;
  onUploadSuccess: (downloadURL: string) => void;
  onUploadStateChange: (isUploading: boolean) => void;
  allowedTypes: string[];
  maxSizeMB: number;
}

export function FileUploader({
  label,
  filePath,
  currentFileUrl,
  onUploadSuccess,
  onUploadStateChange,
  allowedTypes,
  maxSizeMB,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { uploadFile } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onUploadStateChange(uploadState?.state === 'running');
  }, [uploadState, onUploadStateChange]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setUploadState(null);
      
      // Immediately start upload after selecting
      handleUpload(selectedFile);
    }
  };

  const handleUpload = async (fileToUpload: File) => {
    if (!fileToUpload) return;

    setError(null);
    const finalFilePath = `${filePath}/${fileToUpload.name}`;

    try {
      const downloadURL = await uploadFile(
        fileToUpload,
        finalFilePath,
        (progress) => setUploadState(progress),
        allowedTypes,
        maxSizeMB
      );
      onUploadSuccess(downloadURL);
      setFile(null); // Clear file after successful upload
    } catch (err: any) {
      setError(err.message || 'Upload gagal.');
      setUploadState({ progress: 0, state: 'error' });
    }
  };
  
  const handleRemoveFile = () => {
      setFile(null);
      setUploadState(null);
      setError(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  }
  
  const isImage = (currentFileUrl && (/\.(jpg|jpeg|png|gif|svg)$/i.test(currentFileUrl))) || (allowedTypes.some(t => t.startsWith('image/')));

  return (
    <div className="space-y-4 rounded-lg border p-4">
        <label className="text-sm font-medium">{label}</label>
        {currentFileUrl && !file && !uploadState && (
            <div className="relative group">
                {isImage ? (
                    <Image src={currentFileUrl} alt="Current file" width={128} height={128} className="rounded-md object-cover h-32 w-32"/>
                ) : (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                        <FileIcon className="h-6 w-6"/>
                        <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm truncate hover:underline">{currentFileUrl.split('/').pop()?.split('?')[0]}</a>
                    </div>
                )}
            </div>
        )}
      
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          id={`file-input-${label}`}
          accept={allowedTypes.join(',')}
        />
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadState?.state === 'running'}>
            <Upload className="mr-2 h-4 w-4" />
            {currentFileUrl ? 'Ganti File' : 'Pilih File'}
        </Button>

        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
            <span>{file.name}</span>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveFile}>
                <X className="h-4 w-4"/>
            </Button>
          </div>
        )}
      </div>

      {uploadState && uploadState.state === 'running' && (
        <div className="space-y-2">
          <Progress value={uploadState.progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Status: {uploadState.state} ({Math.round(uploadState.progress)}%)
          </p>
        </div>
      )}

      {uploadState?.state === 'success' && (
        <Alert variant="default" className="border-green-500 text-green-700">
            <CheckCircle className="h-4 w-4 !text-green-500" />
            <AlertTitle>Berhasil</AlertTitle>
            <AlertDescription>File berhasil diunggah. Perubahan akan tersimpan secara otomatis.</AlertDescription>
        </Alert>
      )}

      {uploadState?.state === 'error' && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Terjadi kesalahan saat mengunggah.'}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
