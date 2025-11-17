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
    console.log('📤 Iniciando subida de foto...');
    console.log('📍 URI local:', localUri);
    console.log('👤 Firebase UID:', firebaseUid);
    console.log('📸 Tipo de foto:', photoType);

    // Leer el archivo como blob
    const blob = await fetch(localUri).then(res => res.blob());

    // Crear referencia en Firebase Storage
    const timestamp = Date.now();
    const fileName = `${photoType}_${timestamp}.jpg`;
    const storagePath = `users/${firebaseUid}/${fileName}`;
    
    console.log('📂 Ruta de almacenamiento:', storagePath);
    
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

/**
 * Sube las fotos de verificación de perfil
 * @param profileImageUri - URI de la foto de perfil/galería
 * @param livePhotoUri - URI de la selfie en vivo
 * @param firebaseUid - UID del usuario
 * @returns URLs de ambas imágenes
 */
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
    console.log('📤 Iniciando subida de foto de grupo...');
    console.log('📍 URI local:', localUri);
    console.log('👥 Group ID:', groupId);

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

    console.log('⬆️ Subiendo archivo...');
    const snapshot = await uploadBytes(fileRef, blob, metadata);
    console.log('✅ Archivo subido exitosamente:', snapshot.metadata.fullPath);

    // Obtener URL de descarga
    const downloadUrl = await getDownloadURL(fileRef);
    console.log('🔗 URL de descarga generada:', downloadUrl);

    return downloadUrl;

  } catch (error) {
    console.error('❌ Error subiendo foto de grupo a Firebase Storage:', error);
    
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
    console.log('🗑️ Foto de grupo eliminada exitosamente');
  } catch (error) {
    console.error('❌ Error eliminando foto de grupo:', error);
    throw error;
  }
}