const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const uploadFile = async (file, bucket, folder = '') => {
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder ? folder + '/' : ''}${uuidv4()}${fileExt}`;

    const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });

    if (error) {
        throw error;
    }

    const { data: { publicUrl } } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(fileName);

    return publicUrl;
};

const deleteFile = async (fileUrl, bucket) => {
    // Extract path from URL
    const urlParts = fileUrl.split(`${bucket}/`);
    if (urlParts.length < 2) return;
    const filePath = urlParts[1];

    const { error } = await supabase
        .storage
        .from(bucket)
        .remove([filePath]);

    if (error) {
        throw error;
    }
};

module.exports = {
    uploadFile,
    deleteFile
};
