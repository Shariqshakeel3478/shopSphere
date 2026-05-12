import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { addProduct,updateProduct,deleteProduct,getAllProducts,getVendorProducts } from "../controllers/product.controller.js";


const router = Router()

router.route('/add-product').post(verifyJWT,upload.fields([{name:'images',maxCount:5}]),addProduct)
router.route('/update-product/:id').post(verifyJWT,upload.fields([{name:'images',maxCount:5}]),updateProduct)
router.route('/delete-product/:id').post(verifyJWT,deleteProduct)
router.route('/all-products').get(getAllProducts)
router.route('/vendor-products').get(verifyJWT,getVendorProducts)

export default router