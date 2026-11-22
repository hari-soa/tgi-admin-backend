import { ClassGroup } from "./userDto";

export type TargetScopeValue = "ALL" | "CLASS";
export type AnnouncementPriorityValue = "NORMAL" | "URGENT";

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  targetScope: TargetScopeValue;
  targetValue?: string | null;
  priority: AnnouncementPriorityValue;
  targetClasses?: ClassGroup[];
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  targetScope?: TargetScopeValue;
  targetValue?: string | null;
  priority?: AnnouncementPriorityValue;
  targetClasses?: ClassGroup[];
}
