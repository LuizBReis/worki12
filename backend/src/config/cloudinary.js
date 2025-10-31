// backend/src/config/cloudinary.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configura o Cloudinary com as suas chaves (lidas do .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configura o "storage" (onde e como salvar)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'worki_avatars', // Nome da pasta no Cloudinary onde as fotos ficarão
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }] // Opcional: redimensiona a imagem
  },
});

// Cria a instância do Multer para ser usada como middleware
const uploadAvatar = multer({ storage: storage });

module.exports = uploadAvatar;