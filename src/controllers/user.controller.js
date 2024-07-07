const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const uploadOnCoudinary = require("../utils/Cloudinary");

const registerUser = asyncHandler(async (req, res) => {
  //* Get user data from frontend
  const { userName, email, fullName, password } = req.body;
  // console.log(userName, email, fullName, password);

  //* validation for non empty data
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  //* validation for existing user
  const userExists = User.findOne({
    $or: [{ userName }, { email }],
  });
  if (userExists) {
    throw new ApiError(409, "Username or Email already exists.");
  }

  //* validation for user image and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar image is required.");

  //* upload image and avatar into cloudinary
  const avatar = await uploadOnCoudinary(avatarLocalPath);
  const coverImage = await uploadOnCoudinary(coverImageLocalPath);
  if (!avatar) throw new ApiError(400, "Avatar image is required.");

  //* create user object with all the inputs including image link from cloudinary
  const userData = {
    userName: userName.toLowerCase(),
    email: email.toLowerCase(),
    fullName,
    avatar,
    coverImage: coverImage?.url || "",
    password,
  };

  //* push the user object into database
  const user = await User.create(userData);

  //* remove the password and the refresh token from database upload result
  const createdUser = await User.findOne(user._id).select("-password -refreshToken")

  //* check for user creation
  if(!createdUser) throw new ApiError(500, "Something went wrong while registration.")

  //* send the response
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Successfully.")
  )
});

module.exports = { registerUser };
