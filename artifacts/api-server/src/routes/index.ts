import { Router, type IRouter } from "express";
import healthRouter from "./health";
import countriesRouter from "./countries";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(countriesRouter);
router.use(chatRouter);

export default router;
