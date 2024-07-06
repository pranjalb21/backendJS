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

    const uploadResult = await cloudinary.v2.uploader.upload(localFilePath, {
      resource_type: "auto",
    }); //* File upload into cloudinary

    console.log("File has been uploaded successfully on ", uploadResult.url);
    return uploadResult; //* Return upload result
  } catch (error) {
    fs.unlinkSync(localFilePath); //! If upload not successful then delete the local file from server
    return null;
  }
};

module.exports = uploadOnCoudinary;
