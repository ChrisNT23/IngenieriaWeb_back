import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import storage from "../config/firebaseStorage.js";


const Uploadrouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
});

Uploadrouter.post("/", upload.single("file"), async (req, res) => {
    try {
        //obtenemos el nombre y la extenison del archivo
        const file = req.file;
        //creamos nuevo nombre del file
        if (file) {
            const fileName = `${uuidv4()}${path.extname(file.originalname)}`;

            const blob = storage.file(fileName);
            const blobStream = blob.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: file.mimetype,
                },
            });
            // if error
            blobStream.on("error", (error) => {
                res.status(400), json({ message: error.message });
            });
            // en caso de exito
            blobStream.on("finish", () => {
                // obtenemos la URL publica 
                const publicURL = `https://firebasestorage.googleapis.com/v0/b/${storage.name}/o/${fileName}?alt=media`;
                //retornamos el nombre del archivo y su ruta publica
                res.status(200).json(publicURL);

            });
            blobStream.end(file.buffer);

            // cuando no hay archivo

        } else {
            res.status(400).json({ message: "Por favor cargue un archivo" });
        }
    } catch (error) {
        res.status(400), json({ message: error.message });
    }
});

export default Uploadrouter;