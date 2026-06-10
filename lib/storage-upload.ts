import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { SupportDocument } from '@/types';
import { getFileCategory } from '@/lib/file-utils';

export async function uploadSupportDocuments(
  packageId: string,
  files: File[]
): Promise<SupportDocument[]> {
  const uploads = files.map(async (file) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `packages/${packageId}/support/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || undefined,
    });
    const url = await getDownloadURL(snapshot.ref);

    return {
      name: file.name,
      url,
      type: getFileCategory(file.name, file.type),
      uploadedAt: new Date().toISOString(),
    } satisfies SupportDocument;
  });

  return Promise.all(uploads);
}
