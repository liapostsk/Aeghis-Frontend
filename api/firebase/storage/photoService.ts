import { storage } from '@/firebaseconfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Sube una foto de usuario a Firebase Storage
 * @param localUri - URI local de la imagen (file://, content://, etc.)
 * @param firebaseUid - UID del usuario en Firebase/Clerk
 * @param photoType - Tipo de foto ('profile' | 'verification_live' | 'verification_gallery')
 * @returns URL de descarga de la imagen subida
 */
export async function uploadUserPhotoAsync(
  localUri: string, 
  firebaseUid: string,
  photoType: 'profile' | 'verification_live' | 'verification_gallery' = 'profile'
): Promise<string> {
    try {
        console.log('Iniciando subida de foto...');
        console.log('URI local:', localUri);
        console.log('Firebase UID:', firebaseUid);
        console.log('Tipo de foto:', photoType);

        // Leer el archivo como blob
        const blob = await fetch(localUri).then(res => res.blob());

        // Crear referencia en Firebase Storage
        const timestamp = Date.now();
        const fileName = `${photoType}_${timestamp}.jpg`;
        const storagePath = `users/${firebaseUid}/${fileName}`;
        
        console.log('Ruta de almacenamiento:', storagePath);
        
        const fileRef = ref(storage, storagePath);

        // Subir con metadata
        const metadata = {
            contentType: 'image/jpeg',
            customMetadata: {
                uploadedAt: new Date().toISOString(),
                photoType: photoType,
                userId: firebaseUid,
            }
        };

        console.log('⬆️ Subiendo archivo...');
        const snapshot = await uploadBytes(fileRef, blob, metadata);
        console.log('✅ Archivo subido exitosamente:', snapshot.metadata.fullPath);

        // Obtener URL de descarga
        const downloadUrl = await getDownloadURL(fileRef);
        console.log('🔗 URL de descarga generada:', downloadUrl);

        return downloadUrl;

    } catch (error) {
        console.error('❌ Error subiendo foto a Firebase Storage:', error);
        
        // Errores específicos
        if (error instanceof Error) {
            if (error.message.includes('storage/unauthorized')) {
                throw new Error('No tienes permisos para subir archivos. Verifica las reglas de Firebase Storage.');
            }
            if (error.message.includes('storage/quota-exceeded')) {
                throw new Error('Cuota de almacenamiento excedida.');
            }
            if (error.message.includes('storage/unauthenticated')) {
                throw new Error('Usuario no autenticado. Inicia sesión primero.');
            }
        }
        
        throw error;
    }
}

export async function uploadVerificationPhotos(
  profileImageUri: string,
  livePhotoUri: string,
  firebaseUid: string
): Promise<{ profileUrl: string; liveUrl: string }> {
  console.log('📤 Subiendo fotos de verificación...');

  const [profileUrl, liveUrl] = await Promise.all([
    uploadUserPhotoAsync(profileImageUri, firebaseUid, 'verification_gallery'),
    uploadUserPhotoAsync(livePhotoUri, firebaseUid, 'verification_live'),
  ]);

  console.log('✅ Ambas fotos subidas exitosamente');
  
  return { profileUrl, liveUrl };
}

/**
 * Elimina una foto de Firebase Storage
 * @param photoUrl - URL completa de la foto a eliminar
 */
export async function deleteUserPhoto(photoUrl: string): Promise<void> {
  try {
    const photoRef = ref(storage, photoUrl);
    await deleteObject(photoRef);
    console.log('🗑️ Foto eliminada exitosamente');
  } catch (error) {
    console.error('❌ Error eliminando foto:', error);
    throw error;
  }
}

/**
 * Sube una foto de grupo a Firebase Storage
 * @param localUri - URI local de la imagen
 * @param groupId - ID del grupo
 * @returns URL de descarga de la imagen subida
 */
export async function uploadGroupPhotoAsync(
  localUri: string,
  groupId: number
): Promise<string> {
  try {
    console.log('Iniciando subida de foto de grupo...');
    console.log('URI local:', localUri);
    console.log('Group ID:', groupId);

    // Leer el archivo como blob
    const blob = await fetch(localUri).then(res => res.blob());

    // Crear referencia en Firebase Storage
    const timestamp = Date.now();
    const fileName = `group_${timestamp}.jpg`;
    const storagePath = `groups/${groupId}/${fileName}`;
    
    console.log('📂 Ruta de almacenamiento:', storagePath);
    
    const fileRef = ref(storage, storagePath);

    // Subir con metadata
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        groupId: groupId.toString(),
      }
    };

    console.log('Subiendo archivo...');
    const snapshot = await uploadBytes(fileRef, blob, metadata);
    console.log('Archivo subido exitosamente:', snapshot.metadata.fullPath);

    // Obtener URL de descarga
    const downloadUrl = await getDownloadURL(fileRef);
    console.log('URL de descarga generada:', downloadUrl);

    return downloadUrl;

  } catch (error) {
    console.error('Error subiendo foto de grupo a Firebase Storage:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('storage/unauthorized')) {
        throw new Error('No tienes permisos para subir archivos. Verifica las reglas de Firebase Storage.');
      }
      if (error.message.includes('storage/quota-exceeded')) {
        throw new Error('Cuota de almacenamiento excedida.');
      }
    }
    
    throw error;
  }
}

/**
 * Elimina una foto de grupo de Firebase Storage
 * @param photoUrl - URL completa de la foto a eliminar
 */
export async function deleteGroupPhoto(photoUrl: string): Promise<void> {
  try {
    const photoRef = ref(storage, photoUrl);
    await deleteObject(photoRef);
    console.log('Foto de grupo eliminada exitosamente');
  } catch (error) {
    console.error('Error eliminando foto de grupo:', error);
    throw error;
  }
}

/**
 * Sube una foto de SELFIE para verificación
 */
export const uploadVerificationSelfie = async (
  localUri: string,
  firebaseUid: string
): Promise<string> => {
  try {
    console.log('Subiendo selfie de verificación...');
    
    const response = await fetch(localUri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const filename = `selfie_${timestamp}.jpg`;
    const storageRef = ref(storage, `verification/${firebaseUid}/${filename}`);

    console.log(`Subiendo selfie a: verification/${firebaseUid}/${filename}`);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    console.log('Selfie de verificación subido:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error al subir selfie:', error);
    throw error;
  }
};

/**
 * Sube una foto de DOCUMENTO (DNI/ID) para verificación
 */
export const uploadVerificationDocument = async (
  localUri: string,
  firebaseUid: string
): Promise<string> => {
  try {
    console.log('Subiendo documento de verificación...');
    
    const response = await fetch(localUri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const filename = `document_${timestamp}.jpg`;
    const storageRef = ref(storage, `verification/${firebaseUid}/${filename}`);

    console.log(`Subiendo documento a: verification/${firebaseUid}/${filename}`);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    console.log('Documento de verificación subido:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error al subir documento:', error);
    throw error;
  }
};

/**
 * Obtener la URL de la selfie de verificación de un usuario
 */
export const getVerificationSelfieUrl = async (firebaseUid: string): Promise<string | null> => {
  try {
    const { listAll } = await import('firebase/storage');
    const folderRef = ref(storage, `verification/${firebaseUid}`);
    const filesList = await listAll(folderRef);
    
    const selfieFile = filesList.items.find(item => item.name.startsWith('selfie_'));
    
    if (!selfieFile) {
      console.log(`No se encontró selfie para usuario ${firebaseUid}`);
      return null;
    }

    const url = await getDownloadURL(selfieFile);
    console.log(`Selfie encontrado: ${selfieFile.name}`);
    return url;
  } catch (error) {
    console.error('Error obteniendo selfie:', error);
    return null;
  }
};

/**
 * Obtener la URL del documento de verificación de un usuario
 */
export const getVerificationDocumentUrl = async (firebaseUid: string): Promise<string | null> => {
  try {
    const { listAll } = await import('firebase/storage');
    const folderRef = ref(storage, `verification/${firebaseUid}`);
    const filesList = await listAll(folderRef);
    
    const documentFile = filesList.items.find(item => item.name.startsWith('document_'));
    
    if (!documentFile) {
      console.log(`No se encontró documento para usuario ${firebaseUid}`);
      return null;
    }

    const url = await getDownloadURL(documentFile);
    console.log(`Documento encontrado: ${documentFile.name}`);
    return url;
  } catch (error) {
    console.error('Error obteniendo documento:', error);
    return null;
  }
};

/**
 * Obtener ambas fotos de verificación de un usuario
 */
export const getVerificationPhotos = async (
  firebaseUid: string
): Promise<{ selfieUrl: string; documentUrl: string } | null> => {
  try {
    console.log(`Obteniendo fotos de verificación para ${firebaseUid}...`);
    
    const [selfieUrl, documentUrl] = await Promise.all([
      getVerificationSelfieUrl(firebaseUid),
      getVerificationDocumentUrl(firebaseUid)
    ]);

    if (!selfieUrl || !documentUrl) {
      console.log(`Fotos incompletas para usuario ${firebaseUid}`);
      return null;
    }

    console.log(`Ambas fotos encontradas para ${firebaseUid}`);
    return { selfieUrl, documentUrl };
  } catch (error) {
    console.error('Error obteniendo fotos de verificación:', error);
    return null;
  }
};

/**
 * Verificar si un usuario tiene fotos de verificación pendientes
 */
export const hasVerificationPhotos = async (firebaseUid: string): Promise<boolean> => {
  try {
    const { listAll } = await import('firebase/storage');
    const folderRef = ref(storage, `verification/${firebaseUid}`);
    const filesList = await listAll(folderRef);
    
    const hasSelfie = filesList.items.some(item => item.name.startsWith('selfie_'));
    const hasDocument = filesList.items.some(item => item.name.startsWith('document_'));
    
    return hasSelfie && hasDocument;
  } catch (error) {
    return false;
  }
};

/**
 * Elimina fotos de verificación de un usuario
 */
export const deleteVerificationPhotos = async (firebaseUid: string): Promise<void> => {
  try {
    console.log(`Eliminando fotos de verificación de ${firebaseUid}...`);
    
    const { listAll } = await import('firebase/storage');
    const folderRef = ref(storage, `verification/${firebaseUid}`);
    const filesList = await listAll(folderRef);
    
    await Promise.all(
      filesList.items.map(item => deleteObject(item))
    );
    
    console.log('Fotos de verificación eliminadas');
  } catch (error) {
    console.error('Error eliminando fotos:', error);
    throw error;
  }
};