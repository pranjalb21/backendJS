import mongoose from "mongoose";

import Subscription from "../models/subscription.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const subscribeChannel = asyncHandler(async (req, res) => {
    //* Get channel id from request body attribute and perform sanity check
    const { channel } = req.params;
    if (!mongoose.isValidObjectId(channel))
        return res
            .status(404)
            .json(new ApiResponse(404, {}, "Channel not found."));
    //throw new ApiError(404, "Channel not found.");

    //* Check if user is already subscribed to this channel or not
    const checkIfSubscribed = await Subscription.find({
        channel,
        subscriber: req.user?._id,
    });
    if (checkIfSubscribed.length > 0)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Already subscribed."));
    //throw new ApiError(400, "Already subscribed.");

    //* Insert a new record of subscription
    const result = await Subscription.create({
        subscriber: req.user?._id,
        channel,
    });

    //* Check if subscription is successfull or not
    if (!result)
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    {},
                    "Subscription not successful. Please try again."
                )
            );
    // throw new ApiError(
    //     400,
    //     "Subscription not successful. Please try again."
    // );

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Subscribed successfully."));
});


const unsubscribeChannel = asyncHandler(async (req, res) => {
    //* Get channel id from request body attribute and perform sanity check
    const { channel } = req.body;
    if (channel === undefined || !channel)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "No channel provided."));
    //throw new ApiError(400, "No channel provided.");

    //* Check if user is already subscribed to this channel or not
    const isSubscribed = await Subscription.findOne({
        channel,
        subscriber: req.user?._id,
    });
    if (!isSubscribed)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Channel is not subscribed."));
    //throw new ApiError(400, "Channel is not subscribed.");

    //* Delete subscribe document from Database
    const unsubscribeResult = await Subscription.findByIdAndDelete(
        isSubscribed._id
    );
    if (!unsubscribeResult)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Channel not found."));
    //throw new ApiError(400, "Channel not found.");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                unsubscribeResult,
                "Unsubscribed successfully."
            )
        );
});

const toggleSubscription = asyncHandler(async (req, res) => {
    //* Get channel id from req params attribute
    const { channelId } = req.params;

    //* Sanity check
    if (!mongoose.isValidObjectId(channelId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Channel not found."));
    //throw new ApiError(400, "No channel found.");

    //* Check if user is subscribed
    const isSubscribed = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id,
    });

    //* If subscribed then unsubscribe else subscribe
    if (isSubscribed) {
        const result = await Subscription.findByIdAndDelete(isSubscribed._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unubscribed successfully."));
    } else {
        const result = await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id,
        });
        return res
            .status(201)
            .json(new ApiResponse(201, {}, "Subscribed successfully."));
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    //* Sanity check
    if (!mongoose.isValidObjectId(channelId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "No channel found."));
    //throw new ApiError(400, "No channel found.");

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
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
                subscriberCount: {
                    $size: "$subscribers",
                },
            },
        },
        {
            $project: {
                subscribers: 1,
                subscriberCount: 1,
                _id: 0,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers[0]
                    ? subscribers[0]
                    : { subscribers: [], subscriberCount: 0 },
                "Subscribers fetched successfully."
            )
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    //* Sanity check
    const isSubscriberIdValid = sanityCheck(subscriberId);
    if (!isSubscriberIdValid) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "User not found."));
        //throw new ApiError(400, "User not found.");
    }

    //* Get all channels which user is subscribed
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            userName: 1,
                            email: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                subscribedChannelsCount: {
                    $size: "$subscribedChannels",
                },
            },
        },
        {
            $project: {
                _id: 0,
                subscribedChannels: 1,
                subscribedChannelsCount: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels[0]
                    ? subscribedChannels[0]
                    : { subscribedChannels: [], subscribedChannelsCount: 0 },
                "Subscribed channel list fetched."
            )
        );
});

export {
    subscribeChannel,
    unsubscribeChannel,
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
