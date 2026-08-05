import { Router, type IRouter } from "express";
import healthRouter from "./health";
import countriesRouter from "./countries";
import chatRouter from "./chat";
import visaRouter from "./visa";

const router: IRouter = Router();

router.use(healthRouter);
router.use(countriesRouter);
router.use(chatRouter);
router.use(visaRouter);

export default router;
