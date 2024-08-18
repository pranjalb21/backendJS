import mongoose from "mongoose";
import Image from "../models/image.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/Cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { getPublicId } from "./common.methods.js";

const createImage = asyncHandler(async (req, res) => {
    //* Get image local path from req file attribute and validate
    const imageLocalPath = req.file?.path;
    if (!imageLocalPath)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Please provide an image."));

    //* Uplode image to cloudinary and check if upload is successfull
    const image = await uploadOnCloudinary(imageLocalPath);
    if (!image.url)
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    {},
                    "Something went wrong while image upload."
                )
            );

    //* Upload the post into Database as check if upload is successfull
    const result = await Image.create({
        image: image.url,
        owner: req.user?.id,
    });
    if (!result) {
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    tweet,
                    "Something went wrong while posting the Image."
                )
            );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, result, "Image has been successfully posted.")
        );
});

const getUserImage = asyncHandler(async (req, res) => {
    //* Get userId and page number from req params and req query attribute
    const { userId } = req.params;
    const { page = 1 } = req.query;

    //* Validate if user id is a mongoDB object
    if (!mongoose.isValidObjectId(userId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "User not found."));

    //* Generate pipeline to find the tweets and add owner details in the result.
    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $sort: { createdAt: -1 },
        },
    ];

    //* Genrates option with number of pages and post limit per page.
    const options = {
        page,
        limit: Number(process.env.NO_OF_POSTS_PER_PAGE),
    };

    //* Fetch data from Database using pipeline and options
    const images = await Image.aggregatePaginate(pipeline, options);

    return res
        .status(200)
        .json(new ApiResponse(200, images, "Images are fetched successfully"));
});

const getImageById = asyncHandler(async (req, res) => {
    //* Get imageId from req params attribute and validate
    const { imageId } = req.params;
    if (!mongoose.isValidObjectId(imageId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Image not found."));

    //* Fetch the image from Database and check if it exists or not.
    const image = await Image.findById(imageId);
    if (!image)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Image not found."));

    return res
        .status(200)
        .json(new ApiResponse(200, image, "Image fetched successfully."));
});

const getAllImage = asyncHandler(async (req, res) => {
    //* Get page number from req query
    const { page = 1 } = req.query;

    //* Generate pipeline to fetch the tweets and add owner details in the result.
    const pipeline = [
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
    ];

    //* Genrates option with number of pages and post limit per page.
    const options = {
        page,
        limit: process.env.NO_OF_POSTS_PER_PAGE,
    };

    //* Fetch data from Database using pipeline and options
    const images = await Image.aggregatePaginate(pipeline, options);

    return res
        .status(200)
        .json(new ApiResponse(200, images, "Images fetched successfully."));
});

const updateImage = asyncHandler(async (req, res) => {
    //* Get image id from req params and validate if it's a mongoose ObjectId
    const { imageId } = req.params;
    if (!mongoose.isValidObjectId(imageId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Image not found."));

    //* Fetch the image record from the Database and check if it exists.
    const image = await Image.findById(imageId);

    //* Check if the image owner is same as the requested owner.
    if (!image.owner.equals(req.user?._id))
        return res
            .status(401)
            .json(new ApiResponse(401, {}, "User not authorized."));

    //* Get new image from req file and validate if it exists.
    const imageLocalPath = req.file?.path;
    
    if (!imageLocalPath)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Please provide an image."));

    //* Upload the image into cloudinary and validate the upload is successfull
    const uploadedImage = await uploadOnCloudinary(imageLocalPath);
    if (!uploadedImage)
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    {},
                    "Something went wrong while uploading the image into cloud."
                )
            );

    //* Delete the current image from cloudinary.
    const currentImagePublicId = getPublicId(image.image);
    await deleteFromCloudinary(currentImagePublicId);

    //* Update the new image url into database.
    image.image = uploadedImage.url;
    await image.save();

    return res
        .status(200)
        .json(new ApiResponse(200, image, "Post has been updated."));
});

const deleteImage = asyncHandler(async (req, res) => {
    //* Get imageId from req params and validate if it's a valid mongoose ObjectId
    const { imageId } = req.params;
    if (!mongoose.isValidObjectId(imageId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Image not found"));

    //* Check if image exist in the Database
    const image = await Image.findById(imageId);
    if (!image)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Image not found."));

    //* Check if the requested user is the owner of the image
    console.log(image);
    
    if (!image.owner.equals(req.user?._id))
        return res
            .status(401)
            .json(new ApiResponse(401, {}, "User not authorized."));

    //* Delete image from cloudinary
    const imagePublicId = getPublicId(image.image);
    await deleteFromCloudinary(imagePublicId);

    //* Delete image from database
    const deletedImage = await Image.findByIdAndDelete(imageId);

    return res
        .status(200)
        .json(new ApiResponse(200, deletedImage, "Post has been deleted."));
});

export {
    createImage,
    getAllImage,
    getImageById,
    getUserImage,
    updateImage,
    deleteImage,
};
