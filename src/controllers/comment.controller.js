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
    //* Get the user inputs from req body attribute and perform sanity check
    const { videoId, tweetId, content, type } = req.body;
    if (!content.trim()) throw new ApiError(400, "Comment is required.");

    //* Add comment by comment subject type
    if (type.toLowerCase() === "video") {
        //* Check if videoId is valid or not
        if (!videoId) throw new ApiError(400, "Video not found.");
        
        //* Insert the comment into Database
        const videoComment = await Comment.create({
            content,
            video: videoId,
            owner: req.user?._id,
        });
        if (!videoComment)
            throw new ApiError(400, "Comment was not added. Please try again.");
        
        return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                videoComment,
                "Comment added successfully."
            )
        );
    } else if (type.toLowerCase() === "tweet") {
        //* Check if tweetId is valid or not
        if (!tweetId) throw new ApiError(400, "Tweet not found.");

        //* Insert the comment into Database
        const tweetComment = await Comment.create({
            content,
            tweet: tweetId,
            owner: req.user?._id,
        });
        if (!tweetComment)
            throw new ApiError(400, "Comment was not added. Please try again.");

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    tweetComment,
                    "Comment added successfully."
                )
            );
    }else{
        //* If type doesn't match with post objects then throw error
        throw new ApiError(400, "Invalid type for comment.")
    }
});

const updateComment = asyncHandler(async (req, res) => {
    //* Get commentId and content from req params and body attributes
    const { commentId } = req.params;
    const { content } = req.body;

    //* Perform sanity check
    if (!mongoose.isValidObjectId(commentId))
        throw new ApiError(400, "Comment not found.");
    if (!content.trim())
        throw new ApiError(400, "Comment content is required.");

    //* Fetch comment details from Database
    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(400, "Comment not found.");

    //* Check if the comment owner is same as signed in user
    if (!comment.owner.equals(req.user?._id))
        throw new ApiError(401, "User not authorized.");

    //* Update the comment object and save it to database
    comment.content = content;
    await comment.save();
    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully."));
});

const deleteComment = asyncHandler(async (req, res) => {
    //* Get commentId from req params attribute and perform sanity check
    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId))
        throw new ApiError(400, "Comment not found.");

    //* Fetch comment details from Database and validate the result
    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(400, "Comment not found.");

    //* Check if comment owner is same as signed in user
    if (!comment.owner.equals(req.user?._id))
        throw new ApiError(401, "User not authorized.");

    //* Delete the record from Database
    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if(!deletedComment)
        throw new ApiError(400, "Comment not deleted. Please try again.")
    return res
    .status(200)
    .json(new ApiResponse(200, deletedComment,"Comment has been deleted."))
});

export { getVideoComments, addComment, updateComment, deleteComment };
