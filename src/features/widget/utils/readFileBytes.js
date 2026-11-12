/** Reads a file into bytes. Rejects if the browser cannot read it. */
export function readFileBytes(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsArrayBuffer(file);
  });
}
