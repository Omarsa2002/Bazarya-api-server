const allUserCarts = (userId)=>{
    return [
        {
            $match: {
                userId,
            }
        },
        {
            $lookup: {
                from: "shops",
                localField: "shopId",
                foreignField: "shopId",
                as: "shop"
            }
        },
        {
            $addFields: {
                shop: {$arrayElemAt:['$shop' , 0]},
                deliveryFee: {$arrayElemAt:['$shop.deliveryFee', 0]}
            }
        },
        {
            $project: {
                _id:0,
                userId:1,
                cartId:1,
                'shop.shopId':1,
                'shop.shopName':1,
                'shop.profileImage':1,
                deliveryFee:1,
                //items:1,
                deliveryFee:1,
                totalItems: { $sum: "$items.quantity" },
                subTotal: "$totalAmount",
                totalAmount: { $add: [
                    { $ifNull: ["$deliveryFee", 0] },
                    { $ifNull: ["$totalAmount", 0] }
                ]},
                updatedAt:1
            }
        },
        {
            $facet: {
                carts: [],
                totalCount:  [{$count:"count"}]
            }
        },
        {
            $project: {
                carts: 1,
                summary:{
                    totalItems: {$sum: "$carts.totalItems"},
                    totalCarts: { $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0] }
                }
            }
        }
    ]
}
const getCartByShop = (userId, shopId)=>{
    return [
        {
            $match: {
                userId,
                shopId
            }
        },
        {
            $lookup: {
                from: "shops",
                localField: "shopId",
                foreignField: "shopId",
                as: "shop"
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "productId",
                as: "products"
            }
        },
        {
            $addFields: {
                shop: {$arrayElemAt:['$shop' , 0]},
                deliveryFee: {$arrayElemAt:['$shop.deliveryFee', 0]}
            }
        },
        {
            $project: {
                _id:0,
                userId:1,
                cartId:1,
                'shop.shopId':1,
                'shop.shopName':1,
                'shop.profileImage':1,
                deliveryFee:1,
                items: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: {
                            productId: "$$item.productId",
                            quantity: "$$item.quantity",
                            productName: "$$item.productName",
                            addedAt: "$$item.addedAt",
                            totalPrice: "$$item.totalPrice",
                            unitPrice: "$$item.unitPrice",
                            productImages: {
                                $let: {
                                    vars: {
                                        matchedProduct: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$products",
                                                        as: "p",
                                                        cond: { $eq: ["$$p.productId", "$$item.productId"] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    },
                                    in: { $arrayElemAt: ["$$matchedProduct.productImages", 0] }
                                }
                            }
                        }
                    }
                },
                deliveryFee:1,
                totalItems: { $sum: "$items.quantity" },
                subTotal: "$totalAmount",
                totalAmount: { $add: [
                    { $ifNull: ["$deliveryFee", 0] },
                    { $ifNull: ["$totalAmount", 0] }
                ]},
                updatedAt:1
            }
        },
    ]
}

module.exports = {
    allUserCarts,
    getCartByShop
}