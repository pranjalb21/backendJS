const cloudinary = require("cloudinary");
const fs = require("fs");

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCoudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null; //! If no file path is provided return with null

        //* File upload into cloudinary
        const uploadResult = await cloudinary.v2.uploader.upload(
            localFilePath,
            {
                resource_type: "auto",
            }
        );
        fs.unlinkSync(localFilePath);

        //* Return upload result
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath); //! If upload not successful then delete the local file from server
        return null;
    }
};

const deleteFromCloudinary = async (publicId) => {
    //* Delete files from cloudinary using public id
    try {
        if (!publicId) return null;
        await cloudinary.v2.api.delete_resources([publicId]);
    } catch (error) {
        return null;
    }
};

module.exports = { uploadOnCoudinary, deleteFromCloudinary };
