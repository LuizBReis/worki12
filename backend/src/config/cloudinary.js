// backend/src/config/cloudinary.js

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');

const hasCloudinary = (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let uploadAvatar;
let uploadVideo;

if (hasCloudinary) {
  // Configuração Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Storage para avatar
  const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'worki_avatars',
      allowed_formats: ['jpg', 'png', 'jpeg'],
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    },
  });
  uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

  // Storage para vídeo
  const videoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'worki_videos',
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'webm'],
    },
  });
  uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 1024 * 1024 * 100 }
  });
} else {
  // Fallback local quando Cloudinary não está configurado
  const avatarsDir = path.join(__dirname, '../../uploads/avatars');
  const videosDir = path.join(__dirname, '../../uploads/videos');
  fs.mkdirSync(avatarsDir, { recursive: true });
  fs.mkdirSync(videosDir, { recursive: true });

  const diskAvatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarsDir),
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    }
  });

  const diskVideoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, videosDir),
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    }
  });

  const imageMimes = ['image/jpeg', 'image/png', 'image/jpg'];
  const videoMimes = ['video/mp4', 'video/quicktime', 'video/webm'];

  const imageFilter = (_req, file, cb) => cb(null, imageMimes.includes(file.mimetype));
  const videoFilter = (_req, file, cb) => cb(null, videoMimes.includes(file.mimetype));

  uploadAvatar = multer({
    storage: diskAvatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFilter
  });

  uploadVideo = multer({
    storage: diskVideoStorage,
    limits: { fileSize: 1024 * 1024 * 100 },
    fileFilter: videoFilter
  });
}

module.exports = { uploadAvatar, uploadVideo };