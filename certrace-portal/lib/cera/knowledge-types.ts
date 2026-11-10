/* One thing Cera knows. A question is matched to an entry by its `keys` — short
   phrases a person would actually say — and answered with `answer` as written:
   plain sentences, no citations, nothing the reader has to look up elsewhere to
   understand. `related` are other questions worth asking next. */
export type Entry = {
  id: string;
  topic: "cbam" | "platform";
  title: string;
  keys: string[];
  answer: string;
  related?: string[];
};

export const entry = (
  topic: Entry["topic"],
  id: string,
  title: string,
  keys: string[],
  answer: string,
  related?: string[],
): Entry => ({
  topic,
  id,
  title,
  keys,
  answer: answer.trim(),
  related,
});
