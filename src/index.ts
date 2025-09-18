import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ContentModel, Signupschema, UserModel, linkModel } from "./db";
import { any, z } from "zod";
import { userMiddleware } from "./Middleware";
import { random } from "./util";
import cors from "cors";

const JWT_SECRET = "iamyash";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {
  try {
    console.log("Signup request received");
    const { username, password, email } = Signupschema.parse(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({
      username,
      password: hashedPassword,
      email,
    });

    res.json({
      message: "user signed up",
    });
  } catch (e:any) {
    console.error("Error during signup:", e);
    if (e instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: e.errors,
      });
    } else {
      res.status(500).json({
        errors: e.errors,
        message: "Internal server error",
      });
    }
  }
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.post("/api/v1/signin", async (req, res) => {
  try {
    console.log("Signin request received");
    const { username, password, email } = Signupschema.parse(req.body);

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
    console.error("Error during signin:", e);
    res.status(400).json({
      message: "Invalid credentials",
    });
  }
});

// app.use(userMiddleware);
app.post("/api/v1/content",userMiddleware, async (req, res): Promise<void> => {
  try {
    console.log("Content creation request received");
    const { title, link, type } = req.body;

    if (!(req as any).user || !(req as any).user.id) {
      res.status(401).json({ message: "Unauthorized: User ID missing" });
      return;
    }

    const content = await ContentModel.create({
      title,
      link,
      type,
      userid: (req as any).user.id,
      tags: [],
    });

    res.json({ message: "Content created successfully", content });
  } catch (e: any) {
    console.error("Error during content creation:", e);
    res
      .status(500)
      .json({ message: "Internal server error", error: e.message });
  }
});

app.get("/api/v1/content",userMiddleware, async (req, res) => {
  try {
    console.log("Content retrieval request received");
    //@ts-ignore
    const user = req.user;
    const content = await ContentModel.find({
      userid: user.id,
    }).populate("userid", "username");
    res.json({ content });
  } catch (e: any) {
    console.error("Error during content retrieval:", e);
    res
      .status(500)
      .json({ message: "Internal server error", error: e.message });
  }
});

app.delete("/api/v1/content",userMiddleware, async (req, res) => {
  try {
    console.log("Content deletion request received");
    const contentid = req.body.contentid;
    //@ts-ignore
    await ContentModel.deleteMany({ contentid, userid: req.userid });
    res.json({ message: "Content deleted successfully" });
  } catch (e: any) {
    console.error("Error during content deletion:", e);
    res
      .status(500)
      .json({ message: "Internal server error", error: e.message });
  }
});
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  try {
    console.log("Share request received");
    const { share } = req.body;
    //@ts-ignore
    const user = req.user;
    if (share) {
      let hash = random(10);
      const existinguser = await linkModel.findOne({
        userId: user.id,
      });
      if (existinguser && existinguser.hash) {
        hash = existinguser.hash;
      } else {
        await linkModel.create({
          userId: user.id,
          hash: hash,
        });
      }
      const fullShareLink = `/share/${hash}`; 
      res.json({ message: fullShareLink }); 
    } else {
      await linkModel.deleteOne({
        userId: user.id,
      });
      res.json({ message: "Link sharing disabled" });
    }
  } catch (e: any) {
    console.error("Error during share request:", e);
    res.status(500).json({ message: e.message });
  }
});

app.get("/api/v1/brain/:sharelink",userMiddleware, async (req, res) => {
  try {
    console.log("Share link retrieval request received");
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
  } catch (e: any) {
    console.error("Error during share link retrieval:", e);
    res
      .status(500)
      .json({ message: "Internal server error", error: e.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
