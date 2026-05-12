import cookieParser from 'cookie-parser'
import express from 'express'
const app = express()

app.use(cookieParser())
app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true,limit:'16kb'})) // html form se jo data aata hai wo url form me hota hai usko samjhne ke liye ye hai aur agar data me arrays aur objects ka use hua ho to usko samjhne ke liye extended lagaya hai
app.use(express.static("public")) //"public" folder ke andar jo files hain, unko direct browser me access karne do.



export {app}
import userRouter from '../src/routes/user.route.js'
import productRouter from '../src/routes/product.route.js'

app.use('/api/v1/user',userRouter)
app.use('/api/v1/product',productRouter)
