const express = require("express");
const router = express.Router();
const imageFile = require("../middlewares/image");
const { storeValidationRules, validate } = require('../middlewares/storeValidator');
const { getAll, getOne, create, update, remove } = require("../services/store");
const authjwt = require("../middlewares/authjwt");

//store router
router.get('/', getAllStores);
router.get('/:id', authjwt, getOneStore);
router.post('/', authjwt, storeValidationRules(), validate, imageFile.single("photo"), createStore);
router.patch('/:id', authjwt, imageFile.single("photo"), updateStore);
router.delete('/:id',authjwt, deleteStore);


//Get all stores 
function getAllStores(req, res, next) {
    getAll(req, res)
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            next(err);
        });

}

//Get one store 
function getOneStore(req, res, next) {
    getOne(req, res)
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            next(err);
        });

}

//create one store 
function createStore(req, res, next) {
    create(req, res)
        .then((result) => {
            res.json({ message: "Store has been added.", result: result});
        })
        .catch((err) => {
            next(err);
        });

}


//update one store 
function updateStore(req, res, next) {
    update(req, res)
        .then((result) => {
            res.json({ message: "Store has been updated.", result: result});
        })
        .catch((err) => {
            next(err);
        });

}

//delete one store 
function deleteStore(req, res, next) {
    remove(req, res)
        .then((result) => {
            res.json({ message: "Store has been deleted.", result: result});
        })
        .catch((err) => {
            next(err);
        });

}

module.exports = router;