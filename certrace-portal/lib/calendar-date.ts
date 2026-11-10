/** Calendar fields keep their written day when the backend serializes a timestamp. */
export function calendarDate(value?: string): Date | undefined {
  const day = value?.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (!day) return undefined;
  const date = new Date(`${day[1]}-${day[2]}-${day[3]}T00:00:00`);
  return date.getFullYear() === Number(day[1]) &&
    date.getMonth() === Number(day[2]) - 1 &&
    date.getDate() === Number(day[3])
    ? date
    : undefined;
}
