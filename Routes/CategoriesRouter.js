import express from "express";
import * as categoriesController from "../Controllers/CategoriesController.js";
//{ importMovies, getMovies, getMovieById, getTopRatedMovies, getRandomMovies } 
import { protect, admin } from "../middlewares/Auth.js";

const router = express.Router();

/******RUTAS PUBLICAS ****/
router.get("/", categoriesController.getCategories);

/*****RUTAS DEL ADMIN******/
router.post("/", protect, admin, categoriesController.createCategory);
router.put("/:id", protect, admin, categoriesController.updateCategory);
router.delete("/:id", protect, admin, categoriesController.deleteCategory);


export default router;
