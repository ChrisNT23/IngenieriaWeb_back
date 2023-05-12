import Categories from "../Models//CategoriesModal.js";
import asyncHandler from "express-async-handler";


/****************ONTROLADORES PUBLICOS************************/

// @desc get all categories
// @route GET /api/categories
// Public
const getCategories = asyncHandler(async (req, res) => {
    try {
        // encontramos todas las categorias en la base de datos
        const categories = await Categories.find({});
        // enviamos todas las categorias al cliente = front
        res.json(categories);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


/******************CONTROLADORES PRIVADOS**********************/

// @desc crear nueva categoria
// @route GET /api/categories
// Provate/admin
const createCategory = asyncHandler(async (req, res) => {
    try {
        // obtenemos el titulo desde el request body
        const { title } = req.body;
        // creamos una nueva categoria
        const category = new Categories({
            title,
        });
        //guardamos la categoria en la BD
        const createdCategory = await category.save();
        //enviamos la nueva categoria al cliente 
        res.status(201).json(createdCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// @desc actualizar categoria
// @route GET /api/categories/:id
// Provate/admin
const updateCategory = asyncHandler(async (req, res) => {
    try {
        // obtenemos la category id desde el request paramns
        const category = await Categories.findById(req.params.id);

        if (category) {
            //actualizamos el titulo de la categoria
            category.title = req.body.title || category.title;
            // guardamos la categoria actualizada en la base de datos
            const updatedCategory = await category.save();
            // enviamos la categoria actualizada al cliente
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: "No se encontró la categoria" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// @desc eliminar categoria
// @route GET /api/categories/:id
// Provate/admin
const deleteCategory = asyncHandler(async (req, res) => {
    try {
        // obtenemos la category id desde el request paramns
        const category = await Categories.findById(req.params.id);

        if (category) {
            //eliminamos la categoria de la BD
            //await category.remove();
            await category.deleteOne();
            //enviamos un mensaje de exito al clliente
            res.json({message : "Categoria eliminada exitosamente"});
        } else {
            res.status(404).json({message: "Categoria no encontrada"});
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export {getCategories,createCategory,updateCategory, deleteCategory };