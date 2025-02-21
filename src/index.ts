import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { signupschema, UserModel } from "./db";

const JWT_SECRET = "iamyash"

const app = express();
app.use(express.json());

app.post("/api/v1/signup",async (req, res) => {
    try {
        const { username, password,email } = signupschema.parse(req.body);
        const hashedPassword = await bcrypt.hash(password,5)
        await UserModel.create({
            username,
            password: hashedPassword,
            email
        })
    

        res.json({
            message: "user signed up"
        })
        
    } catch (e) {
        res.status(400).json({
            message: "Validation error"
         })
    }
})

app.post("/api/v1/signin", async (req, res) => {
    try {
        const { username, password ,email } = signupschema.parse(req.body);

        const existinguser =  await UserModel.findOne({
            username,
            email
        })

        if (existinguser) {
            const token = jwt.sign({
                id: existinguser._id
            }, JWT_SECRET)
            
            res.json({
            token : token
        })
        } else {
            res.json({
                message:"invalid credentials"
            })
        }

        
    } catch (e) {
        res.json({
            message:"invalid"
        })
    }
})

app.post("/api/v1/content", (req, res) => {
    
})

app.get("/api/v1/content", (req, res) => {
    
})

app.delete("/api/v1/content", (req, res) => {
    
})

app.post("/api/v1/brain/share", (req, res) => {
    
})

app.get("/api/v1/brain/:sharelink", (req, res) => { 

})

app.listen(3000)

