import mongoose from "mongoose";

import Video from "../models/video.model.js";
import Comment from "../models/comment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Video not found.");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(400, "Video not found.");
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
