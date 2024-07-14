const { default: mongoose } = require("mongoose");
const Subscription = require("../models/subscription.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const subscribeChannel = asyncHandler(async (req, res) => {
    //* Get channel id from request body attribute and perform sanity check
    const { channel } = req.body;
    if (channel === undefined || !channel)
        throw new ApiError(404, "Channel not found.");

    //* Check if user is already subscribed to this channel or not
    const checkIfSubscribed = await Subscription.find({
        channel,
        subscriber: req.user?._id,
    });
    if (checkIfSubscribed.length > 0)
        throw new ApiError(400, "Already subscribed.");

    //* Insert a new record of subscription
    const result = await Subscription.create({
        subscriber: req.user?._id,
        channel,
    });

    //* Check if subscription is successfull or not
    if (!result)
        throw new ApiError(
            400,
            "Subscription not successful. Please try again."
        );

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Subscribed successfully."));
});

const unsubscribeChannel = asyncHandler(async (req, res) => {
    //* Get channel id from request body attribute and perform sanity check
    const { channel } = req.body;
    if (channel === undefined || !channel)
        throw new ApiError(400, "No channel provided.");

    //* Check if user is already subscribed to this channel or not
    const isSubscribed = await Subscription.findOne({
        channel,
        subscriber: req.user?._id,
    });
    if (!isSubscribed) throw new ApiError(400, "Channel is not subscribed.");

    //* Delete subscribe document from Database
    const unsubscribeResult = await Subscription.findByIdAndDelete(
        isSubscribed._id
    );
    if (!unsubscribeResult) throw new ApiError(400, "Channel not found.");

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
    if (channelId === undefined || !channelId)
        throw new ApiError(400, "No channel found.");
    try {
        new mongoose.Types.ObjectId(channelId);
    } catch (error) {
        throw new ApiError(400, "Invalid channel.");
    }

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
            .json(new ApiResponse(200, result, "Unubscribed successfully."));
    } else {
        const result = await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id,
        });
        return res
            .status(201)
            .json(new ApiResponse(201, result, "Subscribed successfully."));
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    //* Sanity check
    if (channelId === undefined || !channelId)
        throw new ApiError(400, "No channel found.");
    try {
        new mongoose.Types.ObjectId(channelId);
    } catch (error) {
        throw new ApiError(400, "Invalid channel.");
    }

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
                pipeline:[
                    {
                        $project:{
                            userName:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            },
        },
        {
            $addFields:{
                subscriberCount: {
                    $size:"$subscribers"
                }
            }
        },
        {
            $project: {
                subscribers: 1,
                subscriberCount:1,
                _id:0
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers[0],
                "Subscribers fetched successfully."
            )
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
});

module.exports = {
    subscribeChannel,
    unsubscribeChannel,
    toggleSubscription,
    getUserChannelSubscribers
};
