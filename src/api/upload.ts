export interface UploadResponse {
    success: boolean;
    url?: string;
    filename?: string;
    error?: string;
}

export async function uploadImage(file: File): Promise<UploadResponse> {
    const url = URL.createObjectURL(file);
    return {
        success: true,
        url,
        filename: file.name,
    };
}

export async function uploadVideo(file: File): Promise<UploadResponse> {
    const url = URL.createObjectURL(file);
    return {
        success: true,
        url,
        filename: file.name,
    };
}

export async function uploadAudio(file: File): Promise<UploadResponse> {
    const url = URL.createObjectURL(file);
    return {
        success: true,
        url,
        filename: file.name,
    };
}
