const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /api/medication-lookup/:barcode
 * @desc 根据条形码通过 ShowAPI 查询药品信息
 * @access Private (Logged in users)
 */
router.get('/lookup/:barcode', authenticateToken, async (req, res) => {
    const { barcode } = req.params;
    const appId = process.env.SHOWAPI_APPID;
    const appKey = process.env.SHOWAPI_APPKEY;

    if (!appId || !appKey) {
        return res.status(500).json({ message: '后端未配置 ShowAPI 凭据' });
    }

    try {
        // 接口文档参考：https://www.showapi.com/api/view/1145 (根据条码查询) 
        // 或者类似接口。万维易源的商品通用查询接口通常是 1145
        // 注意：具体 endpoint 需根据用户购买的具体接口调整。
        // 这里先尝试使用万维易源通用的条码查商品接口路由示例
        const response = await axios.get('https://route.showapi.com/1145-2', {
            params: {
                showapi_appid: appId,
                showapi_sign: appKey,
                code: barcode
            }
        });

        if (response.data && response.data.showapi_res_code === 0) {
            const info = response.data.showapi_res_body;
            if (info.ret_code === 0) {
                // 映射结果到前端需要的格式
                return res.json({
                    name: info.name || info.goodsName,
                    spec: info.spec || info.standard,
                    brand: info.brandName,
                    price: info.price,
                    raw: info // 保留原始数据以备后用
                });
            } else {
                return res.status(404).json({ message: info.remark || '未找到该条码对应的药品信息' });
            }
        } else {
            return res.status(500).json({ message: response.data.showapi_res_error || 'ShowAPI 请求失败' });
        }
    } catch (error) {
        console.error('ShowAPI Lookup Error:', error);
        res.status(500).json({ message: '服务器内部错误，无法连接到查询服务' });
    }
});


/**
 * @route GET /api/medication-lookup/categories
 * @desc 获取药品分类信息 (1468-1)
 * @access Private
 */
router.get('/categories', authenticateToken, async (req, res) => {
    const appId = process.env.SHOWAPI_APPID;
    const appKey = process.env.SHOWAPI_APPKEY;

    if (!appId || !appKey) {
        return res.status(500).json({ message: '后端未配置 ShowAPI 凭据' });
    }

    try {
        const response = await axios.get('https://route.showapi.com/1468-1', {
            params: { showapi_appid: appId, showapi_sign: appKey }
        });
        return res.json(response.data.showapi_res_body || {});
    } catch (error) {
        console.error('ShowAPI Categories Error:', error);
        res.status(500).json({ message: '获取分类失败' });
    }
});

/**
 * @route POST /api/medication-lookup/encyclopedia
 * @desc 通过 ShowAPI 1468-3/4 查询药品详细百科信息
 * @access Private
 */
router.post('/encyclopedia', authenticateToken, async (req, res) => {
    const { searchKey, searchType = '1', classifyId = '', page = 1 } = req.body;
    const appId = process.env.SHOWAPI_APPID;
    const appKey = process.env.SHOWAPI_APPKEY;

    if (!appId || !appKey) {
        return res.status(500).json({ message: '后端未配置 ShowAPI 凭据' });
    }

    try {
        // 如果 searchType 是 1 (药品名称)，其实也可以尝试调用 1468-4 (名医名药?) 
        // 但根据用户提供的 1468-3 说明，它最灵活，支持 ID、名称、药企、准字号。
        const response = await axios.get('https://route.showapi.com/1468-3', {
            params: {
                showapi_appid: appId,
                showapi_sign: appKey,
                searchKey,
                searchType,
                classifyId,
                page,
                maxResult: 20
            }
        });

        if (response.data && response.data.showapi_res_code === 0) {
            const body = response.data.showapi_res_body;
            return res.json(body);
        } else {
            return res.status(500).json({ message: response.data.showapi_res_error || '百科查询失败' });
        }
    } catch (error) {
        console.error('ShowAPI Encyclopedia Error:', error);
        res.status(500).json({ message: '连接百科服务失败' });
    }
});

module.exports = router;
