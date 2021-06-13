const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getVendorOrdersItems, cancel } = require('../services/order');
const authjwt = require("../middlewares/authjwt");
const { adminRole, vendorRole } = require("../middlewares/roles");


router.post('/', authjwt, placeOrder);
router.get('/', authjwt, adminRole, retrieveAllOrders);
router.get('/vendor', authjwt, vendorRole, retrieveVendorOrdersItems);
router.patch('/:id/cancel', authjwt, cancelOrder);
// vendor canchange the state of an order (patch)

/* Routes Handlers */
function placeOrder(req, res, next) {
    const { userId, body: shipmentAndDiscount } = req;
    createOrder(userId, shipmentAndDiscount)
    .then(result => res.status(201).json({message: "Order placed successfully.", result: result }))
    .catch(error => next(error));
}

function retrieveAllOrders(req, res, next) {
    const { page, limit } = req.query;
    getOrders(page, limit)
    .then(result => res.json({ result: result }))
    .catch(error => next(error));
}

function retrieveVendorOrdersItems(req, res, next) {
    const { page, limit } = req.query;
    const { user: vendor } = req;
    getVendorOrdersItems(vendor, page, limit)
    .then(result => res.json({ result: result }))
    .catch(error => next(error));
}

function cancelOrder(req, res, next) {
    const { id: orderId } = req.params;
    const { userId } = req;
    cancel(userId, orderId)
    .then(result => {
        if(result.status === 'cancelled')
            res.json({ message:"Order has been cancelled successfully.", result: result })
        res.json({ message:"Order couldn't be cancelled.", result: result })
    })
    .catch(error => next(error));
}



module.exports = router;