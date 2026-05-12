import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ApiError } from "../utils/apiError.js";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    phoneNumber:{
        type:Number,
        required:true
    },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
    },
    profileImage:{
        type:String

    },
     vendorName: {
      type: String,
      default: null,
    },

    storeName: {
      type: String,
      default: null,
    },
     refreshToken:{
        type:String

    }
},{timestamps:true})

userSchema.pre("save",async function(){

    if(this.role === 'customer'){
        this.vendorName = null;
        this.storeName = null
    }
    if(this.role === 'vendor'){
        if(!this.vendorName || !this.storeName){
            throw new ApiError(400,"Vendor Name and Store Name are required")
        }
    }
    if (!this.isModified("password")) return ;

    const hashedPass = await bcrypt.hash(this.password,10);
    this.password = hashedPass
})

userSchema.methods.accessToken =async function(){
   return await jwt.sign({
        id:this._id,
        username:this.username,
        email:this.email,
        phone:this.phoneNumber
    },process.env.ACCESS_TOKEN_SECRET,{expiresIn:process.env.ACCESS_TOKEN_EXPIRY})
}

userSchema.methods.generateRefreshToken =async function(){
   return await jwt.sign({
        id:this._id
      
    },process.env.REFRESH_TOKEN_SECRET,{expiresIn:process.env.REFRESH_TOKEN_EXPIRY})
}

userSchema.methods.isPasswordCorrect =async function(password){
    return await bcrypt.compare(password,this.password)
}


export const User = mongoose.model("User",userSchema)

