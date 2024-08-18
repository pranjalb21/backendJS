import mongoose from "mongoose";

import Tweet from "../models/tweet.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //* Get tweet body from req body attribute and check if not empty
    const { content } = req.body;
    console.log(content);
    if (!content)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Tweet content is required."));
    //throw new ApiError(400, "Tweet content is required.");

    //* Post tweet into database taking owner id from req user attribute
    const tweet = await Tweet.create({ owner: req.user?.id, content });
    if (!tweet)
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    {},
                    "Something went wrong while posting the tweet."
                )
            );
    // throw new ApiError(
    //     400,
    //     "Something went wrong while posting the tweet."
    // );

    return res
        .status(201)
        .json(
            new ApiResponse(201, tweet, "Tweet has been successfully posted.")
        );
});

const getUserTweets = asyncHandler(async (req, res) => {
    //* Get number of pages and userId from req query attribute
    const { page = 1 } = req.query;
    const { user } = req.params;
    if (!mongoose.isValidObjectId(user)) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "User not found."));
    }
    //* Define the pipeline query
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

    //* Define page number and the number of posts limit per page
    const options = {
        page,
        limit: Number(process.env.NO_OF_POSTS_PER_PAGE),
    };
    const tweets = await Tweet.aggregatePaginate(pipeline, options);

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets are fetched."));
});

const getTweetById = asyncHandler(async (req, res) => {
    //* Get tweetId from req params attribute
    const { tweetId } = req.params;
    if (!mongoose.isValidObjectId(tweetId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Tweet not found."));
    //throw new ApiError(400, "Tweet not found.");

    const tweet = await Tweet.findById(tweetId);

    if (!tweet)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Tweet not found."));

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "User tweets are fetched."));
});

const getAllTweets = asyncHandler(async (req, res) => {
    //* Get all the tweets for the user id
    const { page = 1 } = req.query;

    //* Define the pipeline query
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
            $sort: { createdAt: -1 },
        },
    ];

    //* Define page number and the number of posts limit per page
    const options = {
        page,
        limit: Number(process.env.NO_OF_POSTS_PER_PAGE),
    };
    const tweets = await Tweet.aggregatePaginate(pipeline, options);

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets are fetched."));
});

const updateTweet = asyncHandler(async (req, res) => {
    //* Get tweet id from req params attribute and sanity check
    const { tweetId } = req.params;
    if (!mongoose.isValidObjectId(tweetId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Tweet not found."));
    //throw new ApiError(400, "Tweet not found.");

    //* Get tweet content from req body attribute and check if empty
    const { content } = req.body;
    if (!content.trim())
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Tweet content is required."));
    //throw new ApiError(400, "Tweet content is required.");

    //* Fetch tweet details from Database and check if it returns the tweet
    const tweet = await Tweet.findById(tweetId);
    if (!tweet)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Tweet not found."));
    //throw new ApiError(400, "Tweet not found.");

    //* Check if tweet owner and the current logged in user is same
    if (!tweet.owner.equals(req.user?._id))
        return res
            .status(401)
            .json(new ApiResponse(401, {}, "User not authorized."));
    //throw new ApiError(400, "User not authorized.");

    //* Update the tweet with new content and save
    tweet.content = content.trim();
    await tweet.save();

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet has been updated."));
});

const deleteTweet = asyncHandler(async (req, res) => {
    //* Get tweet id from req params attribute and sanity check
    const { tweetId } = req.params;
    if (!mongoose.isValidObjectId(tweetId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Tweet not found."));
    //throw new ApiError(400, "Tweet not found.");

    //* Fetch tweet details from Database and check if it returns the tweet
    const tweet = await Tweet.findById(tweetId);
    if (!tweet)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Tweet not found."));
    //throw new ApiError(400, "Tweet not found.");

    //* Check if tweet owner and the current logged in user is same
    if (!tweet.owner.equals(req.user?._id))
        return res
            .status(401)
            .json(new ApiResponse(401, {}, "User not authorized."));

    //* Delete the tweet from Database
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deleteTweet)
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    {},
                    "Something went wrong while deleting the tweet."
                )
            );
    // throw new ApiError(
    //     400,
    //     "Something went wrong while deleting the tweet."
    // );

    return res
        .status(200)
        .json(new ApiResponse(200, deletedTweet, "Tweet has been deleted."));
});

export {
    createTweet,
    getUserTweets,
    getAllTweets,
    getTweetById,
    updateTweet,
    deleteTweet,
};
