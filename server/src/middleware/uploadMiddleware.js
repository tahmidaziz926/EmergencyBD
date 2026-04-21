import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// ── Existing: single image upload (for emergency reports) ────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "emergencybd",
    allowed_formats: ["jpeg", "jpg", "png"],
    transformation: [{ width: 1200, crop: "limit" }],
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(file.originalname.split(".").pop().toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Images only! (jpeg, jpg, png)"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// ── New: mass fund upload — images + documents via Cloudinary ────────────────
const massFundImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "emergencybd/mass_fund_images",
    allowed_formats: ["jpeg", "jpg", "png", "webp"],
    transformation: [{ width: 1200, crop: "limit" }],
    resource_type: "image",
  },
});

const massFundDocStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "emergencybd/mass_fund_docs",
    resource_type: "raw",   // required for non-image files in Cloudinary
    public_id: `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`,
  }),
});

// Multer instance that handles BOTH fields using a custom storage
// We use a combined storage that routes based on fieldname
const massFundStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.fieldname === "images";
    return {
      folder: isImage
        ? "emergencybd/mass_fund_images"
        : "emergencybd/mass_fund_docs",
      resource_type: isImage ? "image" : "raw",
      allowed_formats: isImage
        ? ["jpeg", "jpg", "png", "webp"]
        : ["pdf", "doc", "docx", "txt"],
      ...(isImage ? { transformation: [{ width: 1200, crop: "limit" }] } : {}),
      public_id: isImage
        ? undefined  // let Cloudinary auto-generate
        : `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`,
    };
  },
});

const massFundFileFilter = (req, file, cb) => {
  if (file.fieldname === "images") {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(file.originalname.split(".").pop().toLowerCase())
             && allowed.test(file.mimetype.replace("image/", ""));
    if (ok) cb(null, true);
    else cb(new Error("Images must be jpeg, jpg, png or webp"));
  } else if (file.fieldname === "documents") {
    const allowedExts = ["pdf", "doc", "docx", "txt"];
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Documents must be PDF, DOC, DOCX or TXT"));
    }
  } else {
    cb(new Error("Unexpected field: " + file.fieldname));
  }
};

export const massFundUpload = multer({
  storage: massFundStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: massFundFileFilter,
}).fields([
  { name: "images",    maxCount: 5 },
  { name: "documents", maxCount: 3 },
]);

export default upload;