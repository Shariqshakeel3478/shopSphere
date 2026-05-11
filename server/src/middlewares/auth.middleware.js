import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import jwt from 'jsonwebtoken'


const verifyJWT = async(req,res,next)=>{

    const token = req.cookies.accessToken
    if(!token){
        throw new ApiError(400,"Unauthorized")
    }

    const verifiedToken = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(verifiedToken.id)
    if(!user){
        throw new ApiError(400,"Invalid Token")
    }

    req.user = user
    next()
}

export default verifyJWT