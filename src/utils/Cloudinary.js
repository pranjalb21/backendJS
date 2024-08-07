import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: "dw0vujhhh", //String(process.env.CLOUDINARY_CLOUD_NAME),
    api_key: 329132951352666, //Number(process.env.CLOUDINARY_API_KEY),
    api_secret: "TJca5Ks04xTJHVt3WDjAkrS0IEg" //String(process.env.CLOUDINARY_API_SECRET),
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null; //! If no file path is provided return with null

        //* File upload into cloudinary
        const uploadResult = await cloudinary.uploader.upload(
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
        await cloudinary.api.delete_resources([publicId]);
    } catch (error) {
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
