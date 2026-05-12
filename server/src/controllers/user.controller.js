import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from 'jsonwebtoken'
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js";


const generateAccessAndRefreshToken = async(userId)=>{

    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(400,"Failed to find user")

    }

    const accessToken =await user.accessToken();
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken 
await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}

}


const registerUser = async (req, res) => {
    try {
        const { username, email, password, role, phoneNumber, vendorName, storeName } = req.body;

        // 1. Validation (Check all required fields)
        if (
            [username, email, password, role, phoneNumber].some((field) => 
                field?.toString().trim() === "" || field === undefined
            )
        ) {
            throw new ApiError(400, "All fields are required");
        }

        // 2. Check if user already exists
        const existedUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existedUser) {
            throw new ApiError(400, "User with this email or username already exists");
        }

        // 3. Local File Path Check
        const profileImagePath = req.file?.path;
        if (!profileImagePath) {
            throw new ApiError(400, "Profile image is required");
        }

        // 4. Cloudinary Upload
        const profileImageUpload = await uploadOnCloudinary(profileImagePath);
        
        if (!profileImageUpload) {
            throw new ApiError(400, "Failed to upload on Cloudinary. Please try again.");
        }

        // 5. Database Creation
        const createUser = await User.create({
            username,
            email,
            password,
            role,
            phoneNumber,
            profileImage: profileImageUpload.url, // Cloudinary secure URL
            vendorName,
            storeName
        });

        // 6. Verification & Password Removal
        const user = await User.findById(createUser._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        // 7. Success Response
        return res.status(201).json(
            new ApiResponse(201, "User created Successfully", user)
        );

    } catch (error) {
        // Error response handling
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};


const loginUser = async (req, res) => {
    const { email, password } = req.body;

   if(!email || !password){
    throw new ApiError(400,"All fields are required")
   }

    const user = await User.findOne({ email }); 
    
    if (!user) {
        throw new ApiError(404, "User with this email is not found");
    }

    // 2. Password check karein (Instance method use karein)
    const isPasswordValid = await user.isPasswordCorrect(password);
    
    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect Password");
    }

    // 3. Tokens generate karein
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // 4. User object se password aur refresh token hata dein response ke liye
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    console.log(loggedInUser)
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User logged in Successfully", {
                user: loggedInUser,
                accessToken,
                refreshToken
            })
        );

};

const refreshAccessToken = async(req,res)=>{


   const incomingRefreshToken = req.cookies.refreshToken;

   if(!incomingRefreshToken){
      throw new ApiError(400,"Unauthorized")
   }

  try {
   const decodedToken =await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

  const user = await User.findById(decodedToken._id)

  if(!user){
   throw new ApiError(400,"Invalid Refresh Token")
  }

  if(incomingRefreshToken !== user.refreshToken){
   throw new ApiError(400,"Refresh Token expired or used")
  }

  const {accessToken,refreshToken} =await generateAccessAndRefreshToken(user._id)

  const options ={
   httpOnly:true,
   secure:true
  }
  res.status(200).cookie("Access Token",newAccessToken,options).cookie("Refresh Token",newRefreshToken,options).json(
   new ApiResponse(200,{
      newAccessToken,newRefreshToken
   })
  )

 

  } catch (error) {
   throw new ApiError(400,"Invalid Refresh Token")
  }


};


const logoutUser = async (req, res) => {

    if (!req.user) {
        throw new ApiError(400, "Unauthorized");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: null }
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    console.log("logged out user", user);


    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out"));
};

export {registerUser,loginUser,logoutUser,refreshAccessToken}