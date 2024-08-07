import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        //* Get token from cookie or Authorization token
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        if (!token)
            return res
                .status(401)
                .json(new ApiResponse(401, {}, "User unauthorized."));
        // throw new ApiError(401, "User unauthorized.");

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
        if (!user)
            return res
                .status(401)
                .json(new ApiResponse(401, {}, "Invalid token."));
        // throw new ApiError(401, "Invalid token.");

        //* If user found then add user attribute into request
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token.");
    }
});
export default verifyJwt;
