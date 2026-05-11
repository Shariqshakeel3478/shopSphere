import mongoose from "mongoose";

const DB_NAME = "shopSphere"

const connectDB =async()=>{

    try {
        const connect =await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("Db connected",connect.connection.host)
    } catch (error) {
     console.log("Failed while connecting to db",error)
     process.exit(1)
    }


}

export {connectDB}
