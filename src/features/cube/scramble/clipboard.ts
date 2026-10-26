/** No execCommand fallback: failure leaves the visible readonly text for manual copy. */
export async function copyScramble(
  text: string,
  write?: (text: string) => Promise<void>,
) {
  try {
    if (!write) return false;
    await write(text);
    return true;
  } catch {
    return false;
  }
}
