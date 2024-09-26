import mongoose, { Schema } from "mongoose";
const subscriptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"Users",
        
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"Users"
    }

},{
    timestamps:true
})
export const subscription=mongoose.model("Subscription",subscriptionSchema)