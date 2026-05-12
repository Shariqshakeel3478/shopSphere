import { Product } from '../models/product.model.js'
import { ApiError } from '../utils/apiError.js'
import { ApiResponse } from '../utils/apiResponse.js'
import { uploadOnCloudinary } from '../utils/cloudinary.utils.js'

const addProduct = async (req, res) => {
   
    const vendorId = req.user?._id;
    console.log(vendorId)
    if (!vendorId) {
        throw new ApiError(401, "Please login first");
    }

    // 2. Body data extraction
    const { title, description, price, category, stock, ratings, featured, numOfReviews, isAvailable } = req.body;
    // 3. Validation
    if (!title || !description || !category || !price || !stock) {
        throw new ApiError(400, "Required fields are missing in the request");
    }
    
    
    const files = req.files?.images; 
    
    if (!files || files.length === 0) {
        throw new ApiError(400, "At least one product image is required");
    }

    let imagesArray = [];

    // Loop through all files
    for (const file of files) {
        const fileUpload = await uploadOnCloudinary(file.path);

        if (fileUpload) {
            imagesArray.push({
                public_id: fileUpload.public_id,
                url: fileUpload.url
            });
        }
    }

    // 5. Database entry
    const product = await Product.create({
        title,
        description,
        price,
        category,
        stock,
        images: imagesArray,
        vendorId, 
        ratings: ratings || 0,
        numOfReviews: numOfReviews || 0,
        featured: featured || false,
        isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    if (!product) {
        throw new ApiError(500, "Failed to add product");
    }

    return res.status(201).json(
        new ApiResponse(201, "Product added successfully", product)
    );
};

const updateProduct = async (req, res) => {

    const { id } = req.params;
    console.log(id)

    const {
        title,
        description,
        price,
        category,
        stock,
        ratings,
        numOfReviews,
        featured,
        isAvailable
    } = req.body;

    const files = req.files?.images;

    const vendorId = req.user?._id;

    if (!id) {
        throw new ApiError(400, "Product id required");
    }

    const product = await Product.findById(id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (vendorId.toString() !== product.vendorId.toString()) {
        throw new ApiError(403, "Wrong vendor");
    }

    let imagesArray = product.images;

    // agar new images aaye hain
    if (files && files.length > 0) {

        imagesArray = [];

        for (const file of files) {

            const uploaded = await uploadOnCloudinary(file.path);

            if (uploaded) {
                imagesArray.push({
                    public_id: uploaded.public_id,
                    url: uploaded.url
                });
            }
        }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
            title,
            description,
            price,
            category,
            stock,
            ratings,
            numOfReviews,
            featured,
            isAvailable,
            images: imagesArray
        },
        {
            new: true
        }
    );

    return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        updatedProduct
    });
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "id required");
    }

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const product = await Product.findById(id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.vendorId.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not allowed to delete this product");
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, "Product deleted successfully")
    );
};

const getAllProducts = async (req, res) => {
    const products = await Product.find();

    if (!products || products.length === 0) {
        throw new ApiError(404, "No products found");
    }

    return res.status(200).json(
        new ApiResponse(200, products, "Products fetched successfully")
    );
};


const getVendorProducts = async (req, res) => {
    const vendorId = req.user?._id;

    if (!vendorId) {
        throw new ApiError(401, "Unauthorized: Vendor not found");
    }

    const products = await Product.find({ vendorId });

    return res.status(200).json(
        new ApiResponse(200, products, "Vendor products fetched successfully")
    );
};

export { addProduct,updateProduct,deleteProduct,getAllProducts,getVendorProducts};