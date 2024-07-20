import mongoose from "mongoose";

import Tweet from "../models/tweet.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //* Get tweet body from req body attribute and check if not empty
    const content = req.body;
    if (!content) throw new ApiError(400, "Tweet content is required.");

    //* Post tweet into database taking owner id from req user attribute
    const tweet = await Tweet.create({ owner: req.user?.id, content });
    if (!tweet)
        throw new ApiError(
            400,
            "Something went wrong while posting the tweet."
        );

    return res
        .status(201)
        .json(
            new ApiResponse(201, tweet, "Tweet has been successfully posted.")
        );
});

const getUserTweets = asyncHandler(async (req, res) => {
    //* Get all the tweets for the user id
    const tweets = await Tweet.find({ owner: req.user?._id });

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets are fetched."));
});

const updateTweet = asyncHandler(async (req, res) => {
    //* Get tweet id from req params attribute and sanity check
    const tweetId = req.params;
    if (!mongoose.isValidObjectId(tweetId))
        throw new ApiError(400, "Tweet not found.");

    //* Get tweet content from req body attribute and check if empty
    const content = req.body;
    if (!content) throw new ApiError(400, "Tweet content is required.");

    //* Fetch tweet details from Database and check if it returns the tweet
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(400, "Tweet not found.");

    //* Check if tweet owner and the current logged in user is same
    if (!tweet.owner.equals(req.user?._id))
        throw new ApiError(400, "User not authorized.");

    //* Update the tweet with new content and save
    tweet.content = content;
    await tweet.save();

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet has been updated."));
});

const deleteTweet = asyncHandler(async (req, res) => {
    //* Get tweet id from req params attribute and sanity check
    const tweetId = req.params;
    if (!mongoose.isValidObjectId(tweetId))
        throw new ApiError(400, "Tweet not found.");

    //* Fetch tweet details from Database and check if it returns the tweet
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(400, "Tweet not found.");

    //* Check if tweet owner and the current logged in user is same
    if (!tweet.owner.equals(req.user?._id))
        throw new ApiError(400, "User not authorized.");

    //* Delete the tweet from Database
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deleteTweet)
        throw new ApiError(
            400,
            "Something went wrong while deleting the tweet."
        );

    return res
        .status(200)
        .json(new ApiResponse(200, deleteTweet, "Tweet has been deleted."));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
