import multer from "multer";

const storage = multer.memoryStorage(); // store in RAM
const upload = multer({ storage });

export default upload;
