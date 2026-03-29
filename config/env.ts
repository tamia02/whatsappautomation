import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
    META_PHONE_NUMBER_ID: process.env.META_PHONE_NUMBER_ID || '',
};
