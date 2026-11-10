import type { ReminderInput } from "@certrace/backend/src/modules/reminders/model";
import { api, result } from "./client";
export type ReminderSubject = Awaited<
  ReturnType<typeof listReminderSubjects>
>["subjects"][number];
export const registerReminderSubject = (key: string, body: ReminderInput) =>
  result(
    api()
      .api.v1["reminder-subjects"]({ subject_key: encodeURIComponent(key) })
      .put(body),
  );
export const markReminderSent = (key: string) =>
  result(
    api()
      .api.v1["reminder-subjects"]({ subject_key: encodeURIComponent(key) })
      .sent.post(),
  );
export const answerReminderSubject = (key: string) =>
  result(
    api()
      .api.v1["reminder-subjects"]({ subject_key: encodeURIComponent(key) })
      .answered.post(),
  );
export const cancelReminderSubject = (key: string) =>
  result(
    api()
      .api.v1["reminder-subjects"]({ subject_key: encodeURIComponent(key) })
      .delete(),
  );
export const listReminderSubjects = () =>
  result(api().api.v1["reminder-subjects"].get());
