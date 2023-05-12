import express from "express";
import { 
    loginUser, 
    registerUser, 
    updateUserProfile,
    deleteUserProfile, 
    changeUserPassword, 
    getLikedMovies, 
    addLikedMovie, 
    deleteLikedMovies,
    getUsers,
    deleteUser} from "../Controllers/UserController.js";
import { protect, admin } from "../middlewares/Auth.js";

const router = express.Router();

/*Seteamos las rutas publicas*/

router.post("/", registerUser);
router.post("/login", loginUser);

//Rutas privadas
router.put("/", protect, updateUserProfile );
router.delete("/", protect, deleteUserProfile);
router.put("/password", protect, changeUserPassword);
router.get("/favorites", protect, getLikedMovies);
router.post("/favorites", protect, addLikedMovie);
router.delete("/favorites", protect, deleteLikedMovies);


/**********ADMIN ROUTES************/
router.get("/", protect, admin, getUsers);
router.delete("/:id", protect, admin, deleteUser);


export default router;