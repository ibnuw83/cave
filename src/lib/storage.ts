
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

export type UploadProgress = {
  progress: number;
  state: 'running' | 'paused' | 'success' | 'error';
};

export const useFileUpload = () => {
    const { toast } = useToast();

    const uploadFile = async (
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
            throw new Error(errorMsg);
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            const errorMsg = `Ukuran file terlalu besar. Maksimal: ${maxSizeMB}MB`;
            toast({ variant: 'destructive', title: 'Upload Gagal', description: errorMsg });
            throw new Error(errorMsg);
        }

        const storageRef = ref(storage, path);
        
        // --- Resumable Upload for All File Types ---
        return new Promise((resolve, reject) => {
            const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress({ progress, state: snapshot.state });
                },
                (error) => {
                    console.error("Upload error:", error);
                    let description = 'Terjadi kesalahan saat mengupload file.';
                    switch (error.code) {
                        case 'storage/unauthorized':
                            description = 'Anda tidak memiliki izin untuk mengupload file. Pastikan Anda adalah admin.';
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
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        onProgress({ progress: 100, state: 'success' });
                        resolve(downloadURL);
                    } catch (error) {
                         console.error("Get Download URL error:", error);
                         toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal mendapatkan URL file setelah upload.' });
                         onProgress({ progress: 100, state: 'error' });
                         reject(error);
                    }
                }
            );
        });
    };
    
    return { uploadFile };
};
