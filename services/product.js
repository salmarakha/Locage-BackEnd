const customError = require('../functions/errorHandler');
const Product = require('../models/product');
const User = require('../models/user');
const { checkId, isEmpty } = require('../functions/checks');
const cloudinary = require("../functions/cloudinary");


const getProducts = async (req) => {
    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const options = {
        limit: limit,
        page: page
    }
    return await Product.paginate({}, options);
}

const getProduct = async (id) => {
    checkId(id);
    const product = await Product.findById(id);
    if(!product) customError("PRODUCT_NOT_FOUND", 404);
    return product;
}

const add = async (product, files, userId) => {
    // check
    const existingProduct = await Product.findOne({ title: product.title })
    if(existingProduct) customError("TITLE_MUST_BE_UNIQUE", 400);

    const loggedUser = await User.findById(userId);
    if(!loggedUser) customError("UNAUTHORIZED", 401);
    if(loggedUser.role != "vendor") customError("UNAUTHORIZED", 401); 

    const photos = [];
    if(files.length !== 0){
        for(const file of files){
            const { path } = file;
            const result = await cloudinary.uploader.upload(path);
            photos.push(result.secure_url);
        }
    }
    
    isEmpty(product);
    const newProduct = new Product({...product, photos: photos});
    return await newProduct.save();
}

const edit = async (editedData, id, files, userId) => {
    // check 
    checkId(id);
    
    const existingProduct = await Product.findOne({ title: editedData.title })
    if(existingProduct) customError("TITLE_MUST_BE_UNIQUE", 400);

    const loggedUser = await User.findById(userId);
    if(!loggedUser) customError("UNAUTHORIZED", 401);
    if(loggedUser.role != "vendor") customError("UNAUTHORIZED", 401);
    
    // check that product exists
    const productToEdit = await Product.findById(id);
    if(!productToEdit) customError("PRODUCT_NOT_FOUND", 404);

    // check that editedData is not empty
    isEmpty(editedData);

    const photos = productToEdit.photos;
    if(files.length !== 0){
        for(const file of files){
            const { path } = file;
            const result = await cloudinary.uploader.upload(path);
            photos.push(result.secure_url);
        }
    }

    return await Product.findByIdAndUpdate(id, {...editedData, photos: photos}, {new: true});
}

const remove = async (id) => {
    checkId(id);
    const productToDelete = await Product.findById(id);
    if(!productToDelete) customError("PRODUCT_NOT_FOUND", 404);
    return await Product.findByIdAndDelete(id);
}

module.exports = {
    add,
    getProducts,
    getProduct,
    edit,
    remove
}