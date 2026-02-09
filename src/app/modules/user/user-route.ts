import { Router } from "express";
import { UserControllers } from "./user-controller";
import validateRequest from "../../middleware/validateRequest";
import { USER_ROLE } from "./user-constant";
import userValidations from "./user-validation";
import auth from "../../middleware/auth";
import { uploadFile } from "../../helper/fileUploader";

const router = Router();

router.post("/signup", validateRequest(userValidations.UserValidationSchema), UserControllers.createUser);

router.post(
    '/verify-code',
    validateRequest(userValidations.verifyCodeValidationSchema),
    UserControllers.verifyCode
);

router.post(
    '/resend-verify-code',
    validateRequest(userValidations.resendVerifyCodeSchema),
    UserControllers.resendVerifyCode
);


router.patch(
    '/update-profile',
    auth(USER_ROLE.admin, USER_ROLE.user),
    uploadFile(),
    UserControllers.updateProfile
);


router.patch('/block-user/:userId', 
    auth(USER_ROLE.admin), 
    UserControllers.blockUser
);



export const UserRoutes = router;
