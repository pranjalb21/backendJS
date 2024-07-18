const mongoose = require("mongoose");
const Like = require("../models/like.model.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asyncHandler.js");

const toggleVideoLike = asyncHandler(async (req, res) => {
    //* Get video Id and perform sanity check.
    const { videoId } = req.params;
    //TODO: toggle like on video
    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Video not found.");

    //* Check if the user has already liked the video or not
    const like = await Like.findOne({ video: videoId, likedBy: req.user?._id });

    //* If the user liked then delete the record else add a new like record
    let newLike = null;
    let deleteLike = null;
    if (!like) {
        newLike = await Like.create({
            video: videoId,
            likedBy: req.user?._id,
        });
    } else {
        deleteLike = await Like.findByIdAndDelete(like._id);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newLike ? newLike : deleteLike,
                newLike ? "Liked successfully." : "Unliked successfully."
            )
        );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    //* Get video Id and perform sanity check.
    const { commentId } = req.params;
    //TODO: toggle like on comment
    if (!mongoose.isValidObjectId(commentId))
        throw new ApiError(400, "Comment not found.");

    //* Check if the user has already liked the video or not
    const like = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    });

    //* If the user liked then delete the record else add a new like record
    let newLike = null;
    let deleteLike = null;
    if (!like) {
        newLike = await Like.create({
            comment: commentId,
            likedBy: req.user?._id,
        });
    } else {
        deleteLike = await Like.findByIdAndDelete(like._id);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newLike ? newLike : deleteLike,
                newLike ? "Liked successfully." : "Unliked successfully."
            )
        );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    //* Get video Id and perform sanity check.
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    //TODO: toggle like on video
    if (!mongoose.isValidObjectId(tweetId))
        throw new ApiError(400, "Tweet not found.");

    //* Check if the user has already liked the video or not
    const like = await Like.findOne({ tweet: tweetId, likedBy: req.user?._id });

    //* If the user liked then delete the record else add a new like record
    let newLike = null;
    let deleteLike = null;
    if (!like) {
        newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id,
        });
    } else {
        deleteLike = await Like.findByIdAndDelete(like._id);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newLike ? newLike : deleteLike,
                newLike ? "Liked successfully." : "Unliked successfully."
            )
        );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: { $ne: null },
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "All liked videos are fetched.")
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
