import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/Cloudinary.js";
import { getPublicId } from "./common.methods.js";
import Video from "../models/video.model.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    {},
                    "Something went wrong while generating token."
                )
            );
        //throw new ApiError(500, "Something went wrong while generating token.");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    //* Get user data from frontend
    const { userName, email, fullName, password } = req.body;
    // console.log(userName, email, fullName, password);

    //* validation for non empty data
    if (
        [userName, email, fullName, password].some(
            (field) => field?.trim() === "" || field === undefined
        )
    ) {
        return res
            .status(401)
            .json(new ApiResponse(400, {}, "All fields are required."));
        //throw new ApiError(400, "All fields are required.");
    }

    //* validation for existing user
    const userExists = await User.findOne({
        $or: [{ userName }, { email }],
    });
    if (userExists) {
        return res
            .status(409)
            .json(
                new ApiResponse(409, {}, "Username or Email already exists.")
            );
        //throw new ApiError(409, "Username or Email already exists.");
    }
    //* validation for user image and avatar
    const avatarLocalPath =
        req.files.avatar === undefined ? null : req.files?.avatar[0].path;
    const coverImageLocalPath =
        req.files.coverImage === undefined
            ? null
            : req.files?.coverImage[0]?.path;

    if (!avatarLocalPath)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Avatar image is required."));
    //throw new ApiError(400, "Avatar image is required.");

    //* upload image and avatar into cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Avatar image is required."));
    //throw new ApiError(400, "Avatar image is required...");

    //* create user object with all the inputs including image link from cloudinary
    const userData = {
        userName: userName.toLowerCase(),
        email: email.toLowerCase(),
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
    };

    //* push the user object into database
    const user = await User.create(userData);

    //* remove the password and the refresh token from database upload result
    const createdUser = await User.findOne(user._id).select(
        "-password -refreshToken"
    );

    //* check for user creation
    if (!createdUser)
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    {},
                    "Something went wrong while registration."
                )
            );
    //throw new ApiError(500, "Something went wrong while registration.");

    //* send the response
    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User Registered Successfully.")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    //* Destructure the username and the password from req body
    const { userNameOrEmail, password } = req.body;

    //console.log(userName, email, password);

    //* Validate if inputs are non empty
    if (!userNameOrEmail || !password) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "All fields are required."));
        //throw new ApiError(400, "All fields are required.");
    }
    //* Check if user exists in database or not
    const user = await User.findOne({
        $or: [{ userName: userNameOrEmail }, { email: userNameOrEmail }],
    });
    if (!user)
        return res
            .status(404)
            .json(new ApiResponse(404, {}, "User doesn't exist."));
    //throw new ApiError(404, `User doesn't exist.`);

    //* Validate if the password matches with the user name stored in the database
    const isPasswordValid = await user.isPasswordValid(password.toString());
    if (!isPasswordValid)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Invalid credentials."));
    //throw new ApiError(401, "Invalid credentials. ");

    //* Generate tokens using generateAccessAndRefreshToken function
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken },
                "Login successful"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    //* Delete refreshToken from database
    const logoutUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            //* $set: { refreshToken: null }, //* This will set null
            $unset: {
                refreshToken: 1, //* This will remove the value
            },
        },
        { new: true }
    );

    //* Clear cookies and logout
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "Logout successfull."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        //* Get refresh toke from cookies or body and sanity check
        const incomingRefreshToken =
            req.cookies?.refreshToken || req.body.refreshToken;
        if (!incomingRefreshToken) 
            return res
            .status(401)
            .json(new ApiResponse(401, {}, "Token not found."));
            //throw new ApiError(401, "Token not found.");

        //* Verify if token is valid or not
        const decodedToken = await jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken?._id).select("-password");
        if (!user)
            return res
            .status(401)
            .json(new ApiResponse(401, {}, "Invalid refresh token."));
        //throw new ApiError(401, "Invalid refresh token.");
        if (user.refreshToken !== incomingRefreshToken)
            return res
            .status(401)
            .json(new ApiResponse(401, {}, "Invalid token."));
        //throw new ApiError(401, "Invalid token.");

        //* Generate new tokens
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user._id);

        const newUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );
        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { newUser, accessToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Invalid token."));
        //throw new ApiError(400, "Invalid token.");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    //* Get old, new and confirm password from request body
    const { oldPassword, newPassword, confirmPassword } = req.body;

    //* Sanity check on the input fields
    if (
        oldPassword === undefined ||
        newPassword === undefined ||
        confirmPassword === undefined
    )
    return res
            .status(400)
            .json(new ApiResponse(400, {}, "All fields are required."));
        //throw new ApiError(400, "All fields are required.");

    if (
        newPassword.length < process.env.PASSWORD_LENGTH ||
        confirmPassword.length < process.env.PASSWORD_LENGTH ||
        oldPassword.length < process.env.PASSWORD_LENGTH
    )
    return res
            .status(400)
            .json(new ApiResponse(400, {}, "Password length should be minimum 5 characters."));
        //throw new ApiError(400,"Password length should be minimum 5 characters.");

    //* Validate if new password and the confirm password are same or not
    if (newPassword !== confirmPassword)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "New password and confirm password do not match."));
        // throw new ApiError(
        //     400,
        //     "New password and confirm password do not match."
        // );

    //* Fetch user details from req user attribute(Added by auth middleware)
    const user = await User.findById(req.user?._id);

    //* Check if old password and the password of user is same or not
    const isPasswordValid = await user.isPasswordValid(oldPassword);
    if (!isPasswordValid) 
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Old password is not valid."));
        //throw new ApiError(400, "Old password is not valid.");

    //* Update new password into database
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password has been changed successfully.")
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    //* Get user id from req user attribute
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully.")
        );
});

const updateUserAccount = asyncHandler(async (req, res) => {
    //* Get details of the fields needed to be changed
    const { fullName, email } = req.body;

    //* Check if all fields are provided
    if (!fullName || !email) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "All fields are required."));
        //throw new ApiError(400, "All fields are required.");
    }

    //* Check if email already exists or not
    // const isEmailExists = await User.findOne({email})
    // console.log(isEmailExists);
    // if(isEmailExists)
    //     throw new ApiError(400, "Email already exists.")

    //* Update data into database
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account has been updated."));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    //* Get file from req file attribute
    const avatarLocalPath = req.file?.path;

    //* Check if any image is provided or not
    if (!avatarLocalPath)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Please provide an avatar image."));
        //throw new ApiError(400, "Please provide an avatar image.");

    //* Upload image on cloudinary and check if url is returned upon completion
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while avatar file upload."));
        // throw new ApiError(
        //     400,
        //     "Something went wrong while avatar file upload."
        // );

    //* Delete current cover image from cloudinary
    const deleteUserCoverImage = await User.findById(req.user?._id);
    const currentAvatar = getPublicId(deleteUserCoverImage.avatar);
    await deleteFromCloudinary(currentAvatar);

    //* Update the image URL into Database
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url },
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar has been updated successfully.")
        );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    //* Get image local path from request file attribute
    const coverImageLocalPath = req.file?.path;

    //* Check if any image is provided or not
    if (!coverImageLocalPath)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Please provide a cover image."));
        //throw new ApiError(400, "Please provide a cover image.");

    //* Upload image on cloudinary and check if url is returned upon completion
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while cover image upload."));
        // throw new ApiError(
        //     400,
        //     "Something went wrong while cover image upload."
        // );

    //* Delete current cover image from cloudinary
    const deleteUserCoverImage = await User.findById(req.user?._id);
    const currentCoverImage = getPublicId(deleteUserCoverImage.coverImage);
    await deleteFromCloudinary(currentCoverImage);

    //* Update the image URL into Database
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImage.url },
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover image has been updated successfully."
            )
        );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    //* Get channel name from request params attribute
    const { username } = req.params;
    if (username === undefined || !username.trim())
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "No channel found."));
        // throw new ApiError(400, "No channel found.");

    //* Get subscriber, subscribedTo, isSubscribed and
    //* rest of the required value from Database using Aggregate function
    const channel = await User.aggregate([
        {
            $match: {
                userName: username.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                subscribedChannelCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                userName: 1,
                fullName: 1,
                email: 1,
                coverImage: 1,
                avatar: 1,
                subscribersCount: 1,
                subscribedChannelCount: 1,
                isSubscribed: 1,
            },
        },
    ]);

    //* Check if Channel data is found or not
    if (!channel)
        return res
            .status(404)
            .json(new ApiResponse(404, {}, "No channel found."));
        //throw new ApiError(404, "No channel found.");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "Channel has been fetched successfully."
            )
        );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
    const userWatchHistory = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        useName: 1,
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
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userWatchHistory[0].watchHistory,
                "Watch history fetched successfully."
            )
        );
});

const addWatchHistory = asyncHandler(async (req, res) => {
    //* Get video id from req params attribute and perform sanity check
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Video not found."));
        //throw new ApiError(400, "Video not found.");

    //* Check if video exists or not
    const video = await Video.findById(videoId);
    if (!video)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Video not found."));
        //throw new ApiError(400, "Video not found.");

    //* Check if video already exists in user watch history or not
    const user = await User.findById(req.user?._id);
    if (user.watchHistory.includes(videoId))
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Video already present in watch history."));
        //throw new ApiError(400, "Video already present in watch history.");

    //* Push video id into user watch history
    user.watchHistory.push(video._id);
    await user.save();
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Video added into history."));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAccount,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory,
    addWatchHistory,
};
