import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
// import { cookie } from "express-validator";
const options={
    httpOnly:true,
    secure:true,
}
const generateAccessAndRefreshToken =async(userID)=>
{
    try {
        const user=await User.findById(userID)
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
            throw new ApiError(500,"Something went wrong while generating access and refresh tokens");
        
    }
}
const registerUser=asyncHandler( async (req,res)=>{
   const {fullname,email,username,password}=req.body;
//    console.log("email",email,"password",password);
   
    if(
        [fullname,email,username,password].some((field)=> field?.trim()==="")
    
    )
    {
        throw new ApiError(400,"All fields are required");
    }
    try {
        const existedUser = await User.findOne({
           $or: [{ email }, { username }]
        });
     
        if (existedUser) {
            console.log('User already exists:', existedUser);
        } else {
            console.log('No existing user found.');
        }
     } catch (error) {
        console.error('Error finding user:', error);
     }
     

    const avatarLocalpath=req.files?.avatar[0]?.path;
    // const coverImagepath=req.files?.coverImage[0]?.path;
    let coverImagepath=null;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImagepath=req.files.coverImage[0].path;
    }
    // console.log(req.files);  
    if(!avatarLocalpath)
    {
        throw new ApiError(400,"Avatar is required");
    }
   const avatar= await uploadCloudinary(avatarLocalpath)
   const coverImage= await uploadCloudinary(coverImagepath);
   if(!avatar)
   {
    throw new ApiError(400,"Avatar is required");

   }
  const user=await User.create(
    {fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url|| "",
    email,
    password,
    username:username.toLowerCase()
}
   )
   const userCreated = await User.findById(user._id).select("-password -refreshToken");

   if(!userCreated)
   {    
    throw new ApiError(500,"Something went wrong while registernig user")
   }
   else{
    console.log("Succcess")
   }
   return res.status(201).json(new ApiResponse(200,userCreated,"User Registered Successfully"))
})
const loginUser=asyncHandler( async (req,res)=>{
    console.log(req.body)
    const {username,email,password}=req.body;
    console.log(username,password)
    if(!username && !email)
    {
        throw new ApiError(400,"Username or email is required");
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    console.log(user)
    if(!user)
        {
            throw new ApiError(404,"User does not exist");
        }
    const isPasswordCorrect=  await user.isPasswordCorrect(password)
    if(!isPasswordCorrect)
    {
        throw new ApiError(401,"Invalid credentials")
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)  
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{
        user:loggedInUser,
        accessToken,
        refreshToken
    },
    "user logged in Successfully"))



})
const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken:undefined,
            },
        },
            {
                new :true,
            }
            
    )
    
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
         new ApiResponse(200,{},"User logged out successfully"

        )
    )

})
const refreshAccessToken=asyncHandler( async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken|| req.body.refreshToken
    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorized request");
    }
    try {
        const decodedToken=jwt.verify(process.env.REFRESH_TOKEN_SECRET,
            incomingRefreshToken);
        
        const user=await User.findById(decodedToken._id)
        if(!user)
        {
            throw new ApiError(401,"Invalid refresh token");
        }
        if(incomingRefreshToken!==user?.refreshToken)
        {
            throw new ApiError(401,"Refresh token is expired");
        }
       const [accessToken,newRefreshToken] =await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookies("accessToken",accessToken,options)
        .cookies("RefreshToken",newRefreshToken,options)
        .json(new ApiResponse(200,{
            accessToken,refreshToken:newRefreshToken
        },"AccessToken is refreshed"));
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refreshToken")
        
    }
    // .json(new ApiResponse(200,{
    //     accessToken,refreshToken:newRefreshToken}
    // })
})
export {registerUser,loginUser,logoutUser,refreshAccessToken}