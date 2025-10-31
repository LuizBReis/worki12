// backend/src/config/cloudinary.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuração (já existe)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- UPLOADER DE AVATAR (JÁ EXISTE) ---
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'worki_avatars',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  },
});

const uploadAvatar = multer({ storage: avatarStorage });


// ==========================================================
// --- ✅ NOVO UPLOADER DE VÍDEO ---
// ==========================================================
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'worki_videos',
    resource_type: 'video', // Diz ao Cloudinary que é um vídeo
    allowed_formats: ['mp4', 'mov', 'webm'], // Formatos de vídeo comuns
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 1024 * 1024 * 100 // Limite de 100 MB (aprox. 1-2 min de vídeo HD)
  }
});

// --- ✅ EXPORTE OS DOIS ---
module.exports = {
  uploadAvatar,
  uploadVideo 
};