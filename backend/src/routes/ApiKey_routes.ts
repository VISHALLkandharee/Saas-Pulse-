import { Router } from "express";
import { generateApiKey, getApiKeys, deleteApiKey } from "../controllers/ApiKey_controllers";
import { authMiddleware } from "../middlewares/Auth_Middleware";

const router = Router();

// All API key routes require standard authentication (founder role)
router.use(authMiddleware);

router.post("/generate", generateApiKey);
router.get("/", getApiKeys);
router.delete("/:id", deleteApiKey);

export default router;
