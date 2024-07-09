const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");

const verifyJwt = asyncHandler(async (req, _, next) => {
    try {
        //* Get token from cookie or Authorization token
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        if (!token) throw new ApiError(401, "User unauthorized.");
    
        //* Decode token using JWT
        const decodedToken = await jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
    
        //* Fetch user using _id from decoded token
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );
    
        //! If user not found then throw error
        if (!user) throw new ApiError(401, "Invalid token.");
    
        //* If user found then add user attribute into request
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token.")
    }
});

module.exports = verifyJwt;
