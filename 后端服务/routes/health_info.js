const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

const appId = process.env.SHOWAPI_APPID;
const appKey = process.env.SHOWAPI_APPKEY;

// 中间件：确保配置了 ShowAPI 凭据
const checkConfig = (req, res, next) => {
    if (!appId || !appKey) {
        return res.status(500).json({ message: '后端未配置 ShowAPI 凭据' });
    }
    next();
};

// --- 常见疾病查询 (546) ---

/**
 * @route GET /api/health-info/disease/categories
 * @desc 获取疾病分类信息 (546-1)
 */
router.get('/disease/categories', authenticateToken, checkConfig, async (req, res) => {
    try {
        const response = await axios.get('https://route.showapi.com/546-1', {
            params: { showapi_appid: appId, showapi_sign: appKey }
        });
        res.json(response.data.showapi_res_body || {});
    } catch (error) {
        res.status(500).json({ message: '获取疾病分类失败' });
    }
});

/**
 * @route POST /api/health-info/disease/list
 * @desc 查询疾病列表 (546-2)
 */
router.post('/disease/list', authenticateToken, checkConfig, async (req, res) => {
    const { key, classifyId, page = 1 } = req.body;
    try {
        const response = await axios.get('https://route.showapi.com/546-2', {
            params: {
                showapi_appid: appId,
                showapi_sign: appKey,
                key,
                classifyId,
                page
            }
        });
        res.json(response.data.showapi_res_body || {});
    } catch (error) {
        res.status(500).json({ message: '查询疾病列表失败' });
    }
});

/**
 * @route GET /api/health-info/disease/detail/:id
 * @desc 获取疾病明细 (546-3)
 */
router.get('/disease/detail/:id', authenticateToken, checkConfig, async (req, res) => {
    try {
        const response = await axios.get('https://route.showapi.com/546-3', {
            params: {
                showapi_appid: appId,
                showapi_sign: appKey,
                id: req.params.id
            }
        });
        res.json(response.data.showapi_res_body || {});
    } catch (error) {
        res.status(500).json({ message: '获取疾病详情失败' });
    }
});

// --- 健康知识 (90) ---

/**
 * @route GET /api/health-info/knowledge/categories
 * @desc 获取健康知识分类 (90-86)
 */
router.get('/knowledge/categories', authenticateToken, checkConfig, async (req, res) => {
    try {
        const response = await axios.get('https://route.showapi.com/90-86', {
            params: { showapi_appid: appId, showapi_sign: appKey }
        });
        res.json(response.data.showapi_res_body || {});
    } catch (error) {
        res.status(500).json({ message: '获取知识分类失败' });
    }
});

/**
 * @route POST /api/health-info/knowledge/search
 * @desc 搜索健康知识 (90-87)
 */
router.post('/knowledge/search', authenticateToken, checkConfig, async (req, res) => {
    const { key, tid, page = 1 } = req.body;
    try {
        const response = await axios.get('https://route.showapi.com/90-87', {
            params: {
                showapi_appid: appId,
                showapi_sign: appKey,
                key,
                tid,
                page
            }
        });
        res.json(response.data.showapi_res_body || {});
    } catch (error) {
        res.status(500).json({ message: '搜索健康知识失败' });
    }
});

/**
 * @route GET /api/health-info/knowledge/detail/:id
 * @desc 查看单条知识详情 (90-88)
 */
router.get('/knowledge/detail/:id', authenticateToken, checkConfig, async (req, res) => {
    try {
        const response = await axios.get('https://route.showapi.com/90-88', {
            params: {
                showapi_appid: appId,
                showapi_sign: appKey,
                id: req.params.id
            }
        });
        res.json(response.data.showapi_res_body || {});
    } catch (error) {
        res.status(500).json({ message: '获取知识详情失败' });
    }
});

module.exports = router;
