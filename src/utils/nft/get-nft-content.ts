import getFileType from "../get-file-type";

/// parses data and returns content as buffer.
const getNFTContent = async (content: any, filename?: string) => {
  let nftContent;
  let nftFilename;
  let mime;

  console.log("content typeof string");
  const base64String = content.includes(",") ? content.split(",")[1] : content;
  const imgBuffer = Buffer.from(base64String, "base64");
  nftContent = imgBuffer;
  const fileType = await getFileType(base64String);
  const extension = fileType ? fileType.ext : "png";
  mime = fileType ? fileType.mime : "image/png";
  nftFilename = `nft.${extension}`;

  if (filename) nftFilename = filename;

  return { nftContent, nftFilename, mime };
};

export default getNFTContent;
