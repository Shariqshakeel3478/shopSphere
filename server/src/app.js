import cookieParser from 'cookie-parser'
import express from 'express'
const app = express()

app.use(cookieParser())
app.use(express.json({limit:'16kb'}))



export {app}

import userRouter from '../src/routes/user.route.js'
app.use('/api/v1/user',userRouter)
