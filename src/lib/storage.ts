
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

export type UploadProgress = {
  progress: number;
  state: 'running' | 'paused' | 'success' | 'error';
};

export const useFileUpload = () => {
    const { toast } = useToast();

    const uploadFile = (
        file: File,
        path: string,
        onProgress: (progress: UploadProgress) => void,
        allowedTypes: string[],
        maxSizeMB: number
    ): Promise<string> => {
        // --- Validation ---
        const fileTypeMatch = allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
        });

        if (!fileTypeMatch) {
            const errorMsg = `Tipe file tidak valid. Hanya menerima: ${allowedTypes.join(', ')}`;
            toast({ variant: 'destructive', title: 'Upload Gagal', description: errorMsg });
            onProgress({ progress: 0, state: 'error' });
            return Promise.reject(new Error(errorMsg));
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            const errorMsg = `Ukuran file terlalu besar. Maksimal: ${maxSizeMB}MB`;
            toast({ variant: 'destructive', title: 'Upload Gagal', description: errorMsg });
            onProgress({ progress: 0, state: 'error' });
            return Promise.reject(new Error(errorMsg));
        }

        const storageRef = ref(storage, path);
        
        return new Promise((resolve, reject) => {
            const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (snapshot.state === 'running') {
                       onProgress({ progress, state: 'running' });
                    }
                },
                (error) => {
                    console.error("Upload error:", error);
                    let description = 'Terjadi kesalahan saat mengupload file.';
                    switch (error.code) {
                        case 'storage/unauthorized':
                            description = 'Anda tidak memiliki izin untuk mengupload file. Pastikan Anda adalah admin dan aturan storage sudah benar.';
                            break;
                        case 'storage/canceled':
                            description = 'Upload dibatalkan.';
                            break;
                        case 'storage/unknown':
                            description = 'Terjadi error yang tidak diketahui.';
                            break;
                    }
                    toast({ variant: 'destructive', title: 'Upload Gagal', description });
                    onProgress({ progress: 0, state: 'error' });
                    reject(error);
                },
                async () => {
                    // Upload completed successfully
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        onProgress({ progress: 100, state: 'success' });
                        resolve(downloadURL);
                    } catch (getError) {
                         console.error("Get Download URL error:", getError);
                         toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal mendapatkan URL file setelah upload.' });
                         onProgress({ progress: 100, state: 'error' }); // Still error state overall
                         reject(getError);
                    }
                }
            );
        });
    };
    
    return { uploadFile };
};
