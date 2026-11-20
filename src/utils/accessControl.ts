import { TokenPayload } from "./jwt";
import { AppError } from "./AppError";

const STAFF_ROLES = ["ADMIN", "SECRETARY"];

export const isStaff = (requester: TokenPayload): boolean =>
  STAFF_ROLES.includes(requester.role);

/**
 * Staff can read the data of any student. A student can only read their own.
 */
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
