import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";


const generateAccessAndRefreshToken = async(userId)=>{

    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(400,"Failed to find user")

    }

    const accessToken =await user.accessToken();
    const refreshToken = await user.refreshToken()

    return {accessToken,refreshToken}

}


const registerUser = async(req,res)=>{
    const {username,email,password,role,profileImage,phoneNumber,vendorName,storeName} = req.body
    console.log("User data",req.body)

    if([username,email,password,role].some((field)=> field.trim()==="" || !phoneNumber)){
        throw new ApiError(400,"All fields are required")
    }

    // check if user already exist
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })

    console.log("Existed User",existedUser)

    if(existedUser){
        throw new ApiError(400,"User with this email or username already exist")
    }

   const createUser =await User.create({
        username,
      email,
        password,
        role,
        phoneNumber,
       profileImage,
        vendorName,
        storeName
    })

    if(!createUser){
        throw new ApiError(400,"Failed to create user")
    }

    // finding user on db

    const user = await User.findById(createUser._id).select("-password -refreshToken")


   return res.status(200).json(
    new ApiResponse(200,"User created Successfully",user)
   )
}


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


const logoutUser = async(req,res)=>{

    const user =await User.findByIdAndUpdate(req.user.id,{
        $set:{
            refreshToken:undefined
        }
    })

if(!req.user){
    throw new ApiError(400,"Unauthorized")
}

const options = {
    httpOnly:true,
    secure:true
}

return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
    new ApiResponse(200,"User loggedout")
)

   
}

export {registerUser,loginUser,logoutUser}