import { fileTypeFromBuffer } from "file-type";

const getFileType = async (base64String: any) => {
  let fileType;
  try {
    const imgBuffer = Buffer.from(base64String, "base64");
    fileType = await fileTypeFromBuffer(imgBuffer);
    console.log(`fileType: ${JSON.stringify(fileType)}`);
  } catch (e) {
    console.log(e);
    return undefined;
  }
  return fileType;
};

export default getFileType;
