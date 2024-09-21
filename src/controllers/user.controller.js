import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser=asyncHandler( async (req,res)=>{
   const {fullname,email,username,password}=req.body;
   console.log("email",email,"password",password);
   
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
    const coverImagepath=req.files?.coverImage[0]?.path;
    console.log(req.files);
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
   const userCreated = await User.findOne({ 
    $or: [{ email: user.email }, { username: user.username }]
 }).select("-password -refreshToken");

   if(!userCreated)
   {    
    throw new ApiError(500,"Something went wrong while registernig user")
   }
   else{
    console.log("Succcess")
   }
   return res.status(201).json(new ApiResponse(200,userCreated,"User Registered Successfully"))
})
export {registerUser}