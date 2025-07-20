const allUserOrders = (req)=>{

    const { 
        page,
        skip,
        sortOrder = 'desc'
    } = req.query;
    const sortConditions = {};
    sortConditions.createdAt = sortOrder === 'asc' ? 1 : -1;
    
    const { limit, offset } = paginationWrapper(page, skip);
    return [
        { $match: {userId: req.user.userId} },
        {
            $lookup: {
                from: 'shops',
                localField: 'shopId',
                foreignField: 'shopId',
                as: 'shop'
            }
        },
        {
            $unwind: {
                path: "$shop",
            }
        },
                {
            $project: {
                _id: 0,
                orderId: 1,
                status: 1,
                products: 0,
                totalAmount: 1,
                deliveredAt: 1,
                'shop.shopId': 1,
                'shop.shopName': 1,
            }
        },
        
        // Sort results
        { $sort: sortConditions },
        
        // Add pagination info
        {
            $facet: {
                products: [
                    { $skip: offset },
                    { $limit: Number(limit) }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ]
}