
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask, uploadBytes } from 'firebase/storage';
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
        if (!allowedTypes.some(type => file.type.startsWith(type) || allowedTypes.includes(file.type))) {
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
        
        // --- Simplified Upload for Images ---
        const isImage = file.type.startsWith('image/');
        if (isImage) {
            try {
                onProgress({ progress: 50, state: 'running' }); // Show initial progress
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                onProgress({ progress: 100, state: 'success' });
                return downloadURL;
            } catch(error: any) {
                console.error("Image upload error:", error);
                toast({ variant: 'destructive', title: 'Upload Gagal', description: 'Gagal mengunggah gambar.' });
                throw error;
            }
        }


        // --- Resumable Upload for Other File Types (e.g., Audio) ---
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
