import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ContentModel, signupschema, UserModel, linkModel } from "./db";
import { z } from "zod";
import { userMiddleware } from "./Middleware";
import { random } from "./util";
import cors from "cors";

const JWT_SECRET = "iamyash";

const app = express();
app.use(cors());
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
    console.error("Error during signup:", e);
    if (e instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: e.errors,
      });
    } 
    else {
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

app.get("/api/v1/content", async (req, res) => {
  //@ts-ignore
  const user = req.user;
  const content = await ContentModel.find({
    userid: user.id,
  }).populate("userid", "username");
  res.json({ content });
});

app.delete("/api/v1/content", async (req, res) => {
  const contentid = req.body.contentid;
  //@ts-ignore
  await ContentModel.deleteMany({ contentid, userid: req.userid });
  res.json({ message: "Content deleted successfully" });
});

app.post("/api/v1/brain/share", async (req, res) => {
  try {
    const { share } = req.body;
    //@ts-ignore
    const user = req.user;
    if (share) {
      const existinguser = await linkModel.findOne({
        userId: user.id,
      });
      if (existinguser) {
        res.json({
          hash: existinguser.hash,
        });

        return;
      }
      const hash = random(10);
      await linkModel.create({
        userId: user.id,
        hash: hash,
      });
      res.json({ message: "/share/" + hash });
    } else {
      await linkModel.deleteOne({
        userId: user.id,
      });
      res.json({ message: "Link sharing disabled" });
    }
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

app.get("/api/v1/brain/:sharelink", async (req, res) => {
  const hash = req.params.sharelink;
  let link = await linkModel.findOne({
    hash,
  });

  if (!link) {
    res.status(404).json({ message: "Link not found" });
    return;
  }

  let content = await ContentModel.find({
    userid: link.userId,
  });

  let user = await UserModel.findOne({
    _id: link.userId,
  });

  res.json({
    username: user?.username,
    content: content,
  });
});

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
