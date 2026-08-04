rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Solo el usuario autenticado puede acceder a sus propios backups
    match /users/{userId}/backups/{fileName} {
      // Lectura: solo el dueño de los archivos
      allow read: if request.auth != null && request.auth.uid == userId;
      // Escritura: solo el dueño puede subir archivos (PDFs, máx 50MB)
      allow create: if request.auth != null
                     && request.auth.uid == userId
                     && request.resource.contentType.matches('application/pdf')
                     && request.resource.size < 50 * 1024 * 1024;
      // Eliminación: solo el dueño puede borrar sus backups
      allow delete: if request.auth != null && request.auth.uid == userId;
      // No se permite modificar backups existentes (solo crear/eliminar)
      allow update: if false;
    }

    // Bloquear todo lo demás
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}