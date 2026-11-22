import { TokenPayload } from "./jwt";
import { AppError } from "./AppError";
import { User } from "../models/userModel";

const STAFF_ROLES = ["ADMIN", "SECRETARY"];

export const isStaff = (requester: TokenPayload): boolean =>
  STAFF_ROLES.includes(requester.role);

export const assertCanAccessStudentData = (
  requester: TokenPayload,
  studentId: string,
): void => {
  const isOwner =
    requester.role === "STUDENT" && requester.userId === studentId;

  if (!isStaff(requester) && !isOwner) {
    throw new AppError("You do not have access to this student's data.", 403);
  }
};

export const isVisibleTo = (requester: TokenPayload, user: User): boolean =>
  !user.isSuperAdmin || user.id === requester.userId;

export const filterVisibleUsers = (
  requester: TokenPayload,
  users: User[],
): User[] => users.filter((user) => isVisibleTo(requester, user));

export const assertCanReachUser = (
  requester: TokenPayload,
  user: User,
): void => {
  if (!isVisibleTo(requester, user)) {
    throw new AppError(
      "Only the super administrator can access this account.",
      403,
    );
  }
};

export const assertCanDeleteUser = (user: User): void => {
  if (user.isSuperAdmin) {
    throw new AppError("The super administrator can never be deleted.", 403);
  }
};
