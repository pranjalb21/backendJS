import mongoose from "mongoose";

import Video from "../models/video.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/Cloudinary.js";
import { getPublicId } from "./common.methods.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    //* Aggregate query for video list
    const pipeline = [
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
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
            $addFields: {
                owner: {
                    $first: "$ownerDetails",
                },
            },
        },
        {
            $project: {
                ownerDetails: 0,
            },
        },
        {
            $sort: {
                createdAt: "-1",
            },
        },
    ];

    //* Option to limit the number of result per page
    const options = {
        page,
        limit: process.env.NO_OF_POSTS_PER_PAGE,
    };
    const videos = await Video.aggregatePaginate(pipeline, options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully."));
});

const getUserVideos = asyncHandler(async (req, res) => {
    const { page = 1, query, sortBy, sortType, user } = req.query;
    //TODO: get all videos based on query, sort, pagination
    if (!mongoose.isValidObjectId(user))
        throw new ApiError(400, "User not found.");

    //* Aggregate query for video list
    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
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
            $addFields: {
                owner: {
                    $first: "$ownerDetails",
                },
            },
        },
        {
            $project: {
                ownerDetails: 0,
            },
        },
        {
            $sort: {
                createdAt: "-1",
            },
        },
    ];

    //* Option to limit the number of result per page
    const options = {
        page,
        limit: process.env.NO_OF_POSTS_PER_PAGE,
    };
    const videos = await Video.aggregatePaginate(pipeline, options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully."));
});

const postAVideo = asyncHandler(async (req, res) => {
    //* Sanity check of title and description
    const { title, description } = req.body;
    if (!title || !description)
        throw new ApiError(400, "All fields are required.");

    //* Get the uploaded file local path and perform sanity check
    const videoLocalFilePath = req.files?.video[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    if (!videoLocalFilePath || !thumbnailLocalPath)
        throw new ApiError(400, "All fields are required.");

    //* Upload the files into cloudinary and check if upload was successfull
    const video = await uploadOnCloudinary(videoLocalFilePath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!video || !thumbnail)
        throw new ApiError(
            400,
            "Something went wrong while uploading the file."
        );

    //* Create new video object and upload into Database
    const newVideo = {
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: parseFloat(video.duration).toFixed(2),
        isPublished: true,
        owner: req.user?._id,
    };
    const result = await Video.create(newVideo);
    if (!result)
        throw new ApiError(
            400,
            "Something went wrong while posting the video."
        );

    return res
        .status(201)
        .json(
            new ApiResponse(201, result, "Video has been posted successfully.")
        );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    //* Sanity check
    const isVideoIdValid = mongoose.isValidObjectId(videoId);
    if (!isVideoIdValid) throw new ApiError(400, "Video not found.");

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerField",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            userName: 1,
                            fullName: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                owner: {
                    $first: "$ownerField",
                },
            },
        },
        { $project: { ownerField: 0 } },
    ]);
    if (!video) throw new ApiError(400, "Video not found.");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video[0],
                "Video details fetched successfully."
            )
        );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    //* Sanity check
    const { title, description } = req.body;
    if (!title || !description)
        throw new ApiError(400, "All fields are required.");
    const isVideoIdValid = mongoose.isValidObjectId(videoId);
    if (!isVideoIdValid) throw new ApiError(400, "Video not found.");

    const thumbnailLocalPath = req.file?.path;
    let thumbnailUpload = null;
    if (thumbnailLocalPath) {
        thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
    }

    //* Check if video exists
    const videoDetails = await Video.findById(videoId);
    if (!videoDetails) throw new ApiError(400, "Video not found.");

    const newVideoDetails = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnailUpload
                    ? thumbnailUpload.url
                    : videoDetails.thumbnail,
            },
        },
        { new: true }
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newVideoDetails,
                "Video details updated successfully."
            )
        );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const isVideoIdValid = mongoose.isValidObjectId(videoId);
    if (!isVideoIdValid) throw new ApiError(400, "Video not found.");

    //* Check if video exists or not
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(400, "Video not found.");

    //* Check if current user is the owner of the video
    if (!video.owner.equals(req.user?._id))
        throw new ApiError(401, "User unuthorized.");

    const videoDetails = await Video.findByIdAndDelete(videoId);
    if (!videoDetails) throw new ApiError(400, "Video not found.");

    //* Delete existing thumbnail and video from cloudinary
    const currentVideoFile = getPublicId(videoDetails.videoFile);
    const currentThumbnail = getPublicId(videoDetails.thumbnail);
    await deleteFromCloudinary(currentVideoFile);
    await deleteFromCloudinary(currentThumbnail);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video has been deleted."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    //* Sanity check
    const isVideoIdValid = mongoose.isValidObjectId(videoId);
    if (!isVideoIdValid) throw new ApiError(400, "Video not found.");

    //* Check if video exists or not
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(400, "Video not found.");

    //* Check if current user is the owner of the video
    if (!video.owner.equals(req.user?._id))
        throw new ApiError(401, "User unuthorized.");

    //* Toggle the isPublished value and save the info in database
    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                video.isPublished
                    ? "Video published successfully"
                    : "Video has been made private."
            )
        );
});

const addView = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Video not found.");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(400, "Video not found.");
    video.views = video.views + 1;
    await video.save();
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video viewed successfully."));
});

export {
    getAllVideos,
    postAVideo,
    getVideoById,
    getUserVideos,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    addView,
};
