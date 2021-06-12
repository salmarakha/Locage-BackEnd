const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const CartItem = require('../models/cartItem');
const Product = require('../models/product');
const Cart = require('../models/cart');
const User = require('../models/user');
const Shipment = require('../models/shipment');
const customError = require('../functions/errorHandler');
const { isEmpty } = require('../functions/checks');

// check that user is logged-in
function userIsLoggedin(loggedUser) {
    if (!loggedUser) customError("UNAUTHORIZED", 401);
}

// check all cart items are valid and available for purchase
async function cartItemsAreValid(cartItems) {
    for (const item of cartItems){
        const product = await Product.findById(item.productId);

        if (!product) customError("PRODUCT_NOT_FOUND", 404);

        if (product.quantity === 0) customError("PRODUCT_OUT_OF_STOCK", 400);

        if(item.quantity > product.quantity) 
            customError("ITEM_QUANTITY_EXCEEDS_AVAILABLE_QUANTITY", 400);
    }
}

/*
    shipmentAndDiscount: {
        shipmentId: "...", (ObjectId)
        discountCode: "..." (String)
    }
*/
const createOrder = async (userId, shipmentAndDiscount) => {
    const loggedUser = await User.findById(userId);
    
    // check
    userIsLoggedin(loggedUser);
    isEmpty(shipmentAndDiscount);

    if(!shipmentAndDiscount.shipmentId) customError("SHIPMENTID_NOT_PROVIDED", 400);
    const shipmentData = await Shipment.findById(shipmentAndDiscount.shipmentId);

    // check that the discont code exists in database (pass for now)

    const userCart = await Cart.findOne({ userId: userId });
    const cartItems = await CartItem.find({ cartId: userCart._id }); // array

    if (cartItems.length === 0) customError("CART_IS_EMPTY", 400);

    // Create initial order data
    let orderData = new Order({
        name: shipmentData.fullName,
        address: shipmentData.address,
        phoneNumber: shipmentData.phoneNumber,
        userId: userId,
        totalprice: userCart.totalprice
    });

    try{
        // check the validity of cart items
        cartItemsAreValid(cartItems);
        
        // create orderItems
        let totalItems = 0;
        for (const item of cartItems){
            totalItems += item.quantity;
            await OrderItem.create({
                productId: item.productId,
                price: item.price,
                quantity: item.quantity,
                orderId: orderData._id,
                vendorId: item.vendorId
            });
            await CartItem.findByIdAndDelete(item._id);
            await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } });
        }

        orderData.totalProducts = totalItems;
        return await Order.create(orderData);
    } catch(error){
        // if an error occures the created order should not be completed
        customError(error.toString(), 500);
    }
}

const getOrders = async (page, limit) => {

    const options = {
        limit: parseInt(limit) || 10,
        page: parseInt(page) || 1
    }

    try{
        return await Order.paginate({}, options);
    } catch(error) {
        customError(error.toString(), 500);
    }
}

module.exports = {
    createOrder,
    getOrders
}