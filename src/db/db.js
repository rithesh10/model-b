import { db_name } from "../utils/constants.js";
import mongoose from "mongoose";
import express from "express"
// const app=express();
const connectDB= (async()=>{
    try {
       const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`)
        console.log(`Mongodb connected !! DB connexted:${connectionInstance.connection.host}`)
      
    } catch (error) {
        console.log("Mongodb connection error",error)
       process.exit(1);
    }
})
export default connectDB;