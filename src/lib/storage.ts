
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask, uploadBytes } from 'firebase/storage';
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

        // The promise constructor is kept here because uploadBytesResumable
        // uses a callback-based progress reporter, which doesn't fit neatly
        // into a pure async/await structure for progress updates.
        return new Promise((resolve, reject) => {
            // Validate file type
            if (!allowedTypes.some(type => file.type.startsWith(type) || allowedTypes.includes(file.type))) {
                const errorMsg = `Tipe file tidak valid. Hanya menerima: ${allowedTypes.join(', ')}`;
                toast({ variant: 'destructive', title: 'Upload Gagal', description: errorMsg });
                reject(new Error(errorMsg));
                return;
            }

            // Validate file size
            if (file.size > maxSizeMB * 1024 * 1024) {
                const errorMsg = `Ukuran file terlalu besar. Maksimal: ${maxSizeMB}MB`;
                toast({ variant: 'destructive', title: 'Upload Gagal', description: errorMsg });
                reject(new Error(errorMsg));
                return;
            }

            const storageRef = ref(storage, path);
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
                            description = 'Anda tidak memiliki izin untuk mengupload file.';
                            break;
                        case 'storage/canceled':
                            description = 'Upload dibatalkan.';
                            break;
                        case 'storage/unknown':
                            description = 'Terjadi error yang tidak diketahui.';
                            break;
                    }
                    toast({ variant: 'destructive', title: 'Upload Gagal', description });
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
                         reject(error);
                    }
                }
            );
        });
    };
    
    return { uploadFile };
};
