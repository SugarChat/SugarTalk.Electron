export const secondsToDateFormat = (seconds: number) => {
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const secs = seconds % 60;
  minutes %= 60;

  const pad = (num: number) => {
    return `0${num}`.slice(-2);
  };

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
};
