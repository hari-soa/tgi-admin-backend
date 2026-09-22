import { ClassGroup } from "./classGroupEnum";

export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  targetClasses: ClassGroup[];
  description?: string;
}
