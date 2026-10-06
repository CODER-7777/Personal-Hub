export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('Image could not be read.'));
    reader.onabort = () => reject(new Error('Image reading was cancelled.'));
    reader.readAsDataURL(file);
  });
}
