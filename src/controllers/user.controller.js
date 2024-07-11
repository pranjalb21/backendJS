const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const uploadOnCoudinary = require("../utils/Cloudinary");
const jwt = require("jsonwebtoken");

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating token.");
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
        throw new ApiError(400, "All fields are required.");
    }

    //* validation for existing user
    const userExists = await User.findOne({
        $or: [{ userName }, { email }],
    });
    if (userExists) {
        throw new ApiError(409, "Username or Email already exists.");
    }
    //* validation for user image and avatar
    const avatarLocalPath =
        req.files.avatar === undefined ? null : req.files?.avatar[0].path;
    const coverImageLocalPath =
        req.files.coverImage === undefined
            ? null
            : req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) throw new ApiError(400, "Avatar image is required.");

    //* upload image and avatar into cloudinary
    const avatar = await uploadOnCoudinary(avatarLocalPath);
    const coverImage = await uploadOnCoudinary(coverImageLocalPath);
    if (!avatar) throw new ApiError(400, "Avatar image is required...");

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
        throw new ApiError(500, "Something went wrong while registration.");

    //* send the response
    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User Registered Successfully.")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    //* Destructure the username and the password from req body
    const { userName, email, password } = req.body;

    //console.log(userName, email, password);

    //* Validate if inputs are non empty
    if (!(userName || email) || !password) {
        throw new ApiError(400, "All fields are required.");
    }
    //* Check if user exists in database or not
    const user = await User.findOne({ $or: [{ userName }, { email }] });
    if (!user) throw new ApiError(404, `User doesn't exist.`);

    //* Validate if the password matches with the user name stored in the database
    const isPasswordValid = await user.isPasswordValid(password.toString());
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials. ");

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
            $set: { refreshToken: null },
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
        const incomingRefreshToken =
            req.cookies?.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) throw new ApiError(401, "Token not found.");

        const decodedToken = await jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );
        if (!user) throw new ApiError(401, "Invalid refresh token.");

        if (user?.refreshToken !== incomingRefreshToken)
            throw new ApiError(401, "Invalid token.");

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user._id);

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
                    { user, accessToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(400, "Invalid token.");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    //* Get old, new and confirm password from request body
    const { oldPassword, newPassword, confirmPassword } = req.body;

    //* Fetch user details from req user attribute(Added by auth middleware)
    const user = await User.findById(req.user?._id);

    //* Check if old password and the password of user is same or not
    const isPasswordValid = await user.isPasswordValid(oldPassword);
    if (!isPasswordValid) throw new ApiError(400, "Old password is not valid.");

    //* Validate if new password and the confirm password are same or not
    if (newPassword !== confirmPassword)
        throw new ApiError(
            400,
            "New password and confirm password do not match."
        );

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

const userAccountUpdate = asyncHandler(async (req, res) => {
    //* Get details of the fields needed to be changed
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required.");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account has been updated."));
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    userAccountUpdate
};
