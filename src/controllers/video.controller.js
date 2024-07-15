import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/Cloudinary.js";
import { getPublicId, sanityCheck } from "./common.methods.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    //* Sanity check
    const isVideoIdValid = sanityCheck(videoId);
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
                pipeLine: [
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
    //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const isVideoIdValid = sanityCheck(videoId);
    if (!isVideoIdValid) throw new ApiError(400, "Video not found.");

    const videoDetails = await Video.findByIdAndDelete(videoId);
    if (!videoDetails) throw new ApiError(400, "Video not found.");

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
    const isVideoIdValid = sanityCheck(videoId);
    if (!isVideoIdValid) throw new ApiError(400, "Video not found.");

    //* Check if video exists or not
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(400, "Video not found.");

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

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
