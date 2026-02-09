import httpStatus from "http-status";
import { TUser, TUserRole } from "./user-interface";
import AppError from "../../error/appError";
import User from "./user-model";
import sendEmail from "../../utilities/sendEmail";
import registrationSuccessEmailBody from "../../mailTemplate/registerSucessEmail";
import { createToken } from "./user.utils";
import config from "../../config";

const generateVerifyCode = (): number => {
  return Math.floor(100000 + Math.random() * 900000);
};

const createUserIntoDB = async (payload: TUser & { playerId: string }) => {
  const emailExist = await User.findOne({ email: payload.email });
  if (emailExist) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This email already exists');
  }

  try {
    const verifyCode = generateVerifyCode();

    const userDataPayload: Partial<TUser> = {
      email: payload.email,
      fullName: payload.fullName,
      password: payload.password,
      role: payload.role,
      verifyCode,
      codeExpireIn: new Date(Date.now() + 5 * 60000),
      ...(payload.role === 'admin' ? { isVerified: true, isActive: true } : {}),
    };

    // Add playerId to the payload if provided
    if (payload.playerId) {
      userDataPayload.playerIds = [payload.playerId];
    }

    sendEmail({
      email: payload.email,
      subject: 'Activate Your Account',
      html: registrationSuccessEmailBody(payload.fullName, verifyCode),
    });

    const user = await User.create(userDataPayload);

    return user;
  } catch (error) {
    throw error;
  }
};



const verifyCode = async (email: string, verifyCode: number) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (user.codeExpireIn < new Date(Date.now())) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Verify code is expired');
  }
  if (verifyCode !== user.verifyCode) {
    throw new AppError(httpStatus.BAD_REQUEST, "Code doesn't match");
  }
  const result = await User.findOneAndUpdate(
    { email: email },
    { isVerified: true, isActive: true },
    { new: true, runValidators: true }
  );

  if (!result) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Server temporary unable please try again letter'
    );
  }

  const jwtPayload = {
    id: String(user!._id),
    email: user!.email,
    role: user!.role as TUserRole,
  };
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_screet as string,
    config.jwt_access_expires_in
  );
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_access_screet as string,
    config.jwt_access_expires_in
  );

  return {
    accessToken,
    refreshToken,
  };
};

const resendVerifyCode = async (email: string) => {
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  const verifyCode = generateVerifyCode();
  const updateUser = await User.findOneAndUpdate(
    { email: email },
    {
      verifyCode: verifyCode,
      codeExpireIn: new Date(Date.now() + 5 * 60000),
    },
    { new: true, runValidators: true }
  );
  if (!updateUser) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Something went wrong . Please again resend the code after a few second'
    );
  }
  console.log(user)
  try {
    sendEmail({
      email: user.email,
      subject: 'Activate Your Account',
      html: registrationSuccessEmailBody('Dear', updateUser.verifyCode),
    });
  } catch (err) {
    console.log(err)
  }
  return null;
};



const updateProfile = async (id: string, imageUrl: string | undefined, fullName: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  user.fullName = fullName;
  if (imageUrl) {
    user.profileImage = imageUrl;
  }

  await user.save();

  return user;
};


const blockUser = async (userId: string) => {
  // Find the user who is not deleted
  const user = await User.findOne({ _id: userId, isDeleted: false });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  // Toggle the 'isBlocked' status
  const newBlockedStatus = !user.isBlocked; // If user is blocked, set it to false (unblock), otherwise true (block)

  // Update the 'isBlocked' field in the database
  const result = await User.findByIdAndUpdate(
    userId,
    { isBlocked: newBlockedStatus },
    { new: true, runValidators: true }  // `new: true` ensures the updated document is returned
  );

  return result;
};




export const UserServices = {
  createUserIntoDB,
  resendVerifyCode,
  verifyCode,
  updateProfile,
  blockUser
};
