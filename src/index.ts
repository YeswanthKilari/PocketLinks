import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ContentModel, signupschema, UserModel } from "./db";
import { z } from "zod";
import { userMiddleware } from "./Middleware";

const JWT_SECRET = "iamyash";

const app = express();
app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {
  try {
    const { username, password, email } = signupschema.parse(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({
      username,
      password: hashedPassword,
      email,
    });

    res.json({
      message: "user signed up",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: e.errors,
      });
    } else {
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
});

app.post("/api/v1/signin", async (req, res) => {
  try {
    const { username, password, email } = signupschema.parse(req.body);

    const existinguser = await UserModel.findOne({
      username,
      email,
    });

    if (existinguser && existinguser.password) {
      const isPasswordValid = await bcrypt.compare(
        password,
        existinguser.password
      );
      if (isPasswordValid) {
        const token = jwt.sign(
          {
            id: existinguser._id,
          },
          JWT_SECRET
        );

        res.json({
          token: token,
        });
      } else {
        res.status(400).json({
          message: "Invalid credentials",
        });
      }
    } else {
      res.status(400).json({
        message: "Invalid credentials",
      });
    }
  } catch (e) {
    res.status(400).json({
      message: "Invalid credentials",
    });
  }
});


app.use(userMiddleware);
app.post("/api/v1/content", async (req, res): Promise<void> => {
  try {
    const { title, link } = req.body;

    if (!(req as any).user || !(req as any).user.id) {
      res.status(401).json({ message: "Unauthorized: User ID missing" });
      return;
    }

    const content = await ContentModel.create({
      title,
      link,
      userid: (req as any).user.id,
      tags: [],
    });

    res.json({ message: "Content created successfully", content });
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: e.message });
  }
});



app.get("/api/v1/content",async (req, res) => {
    //@ts-ignore
    const user = req.user;
    const content = await ContentModel.find({
        userid: user.id
    }).populate("userid" , "username")
    res.json({ content });
 
});

app.delete("/api/v1/content",async (req, res) => {
    const contentid = req.body.contentid;
    //@ts-ignore
    await ContentModel.deleteMany({ contentid, userid: req.userid });
    res.json({ message: "Content deleted successfully" });
});

app.post("/api/v1/brain/share", (req, res) => {

});

app.get("/api/v1/brain/:sharelink", (req, res) => {
 
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
