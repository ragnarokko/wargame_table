export const MM_PER_POLLICE = 25.4;

export function polliciAPx(pollici, pxPerPollice) {
  return pollici * pxPerPollice;
}

export function pxAPollici(px, pxPerPollice) {
  return px / pxPerPollice;
}

export function mmAPx(mm, pxPerPollice) {
  return (mm / MM_PER_POLLICE) * pxPerPollice;
}
