import express from "express"
const app=express();
import cookieParser from "cookie-parser";
import cors from "cors"
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
//routes
import router from "./routes/user.router.js"
app.use("/api/v1/user",router);
export {app}    