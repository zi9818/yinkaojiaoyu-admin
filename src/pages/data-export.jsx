// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Checkbox, Label } from '@/components/ui';
// @ts-ignore;
import { Download, FileText, Users, Activity, Database, ArrowLeft, Calendar, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { ensureAdminAccess, getAuthSingleton } from './auth-guard';

export default function DataExport(props) {
  const {
    $w
  } = props;
  const [exportType, setExportType] = useState('activities');
  const [dateRange, setDateRange] = useState('all');
  const [selectedFields, setSelectedFields] = useState([]);
  const [format, setFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('idle');
  const [exportResult, setExportResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(20);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewTotalKnown, setPreviewTotalKnown] = useState(true);
  const [previewHasMore, setPreviewHasMore] = useState(false);
  const [previewPageInput, setPreviewPageInput] = useState('');
  const [previewLastUpdatedAt, setPreviewLastUpdatedAt] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [currentUid, setCurrentUid] = useState('');

  const createdAtTypeCacheRef = useRef({});

  // 订单字段（不包含活动相关字段）
  const orderOnlyFields = [
    { id: '_id', label: '订单ID', checked: false },
    { id: 'userId', label: '用户ID', checked: false },
    { id: 'userName', label: '用户姓名', checked: true },
    { id: 'userPhone', label: '用户手机', checked: true },
    { id: 'activityId', label: '活动ID', checked: false },
    { id: 'amount', label: '总金额（元）', checked: true },
    { id: 'status', label: '订单状态', checked: true },
    { id: 'payTime', label: '支付时间', checked: false },
    { id: 'createdAt', label: '订单创建时间', checked: true },
    { id: 'updatedAt', label: '订单更新时间', checked: false }
  ];

  // 活动关联字段（仅在订单导出时可选）
  const activityRelatedFields = [
    { id: 'activity_title', label: '活动标题', checked: true, sourceField: 'title' },
    { id: 'activity_subtitle', label: '活动副标题', checked: false, sourceField: 'subtitle' },
    { id: 'activity_desc', label: '活动描述', checked: false, sourceField: 'desc' },
    { id: 'activity_price', label: '活动价格（元）', checked: false, sourceField: 'price' },
    { id: 'activity_startTime', label: '活动开始时间', checked: false, sourceField: 'startTime' },
    { id: 'activity_endTime', label: '活动结束时间', checked: false, sourceField: 'endTime' },
    { id: 'activity_address', label: '活动地址', checked: false, sourceField: 'address' },
    { id: 'activity_tags', label: '活动标签', checked: false, sourceField: 'tags' },
    { id: 'activity_isActive', label: '活动发布状态', checked: false, sourceField: 'isActive' }
  ];

  // 根据数据源定义可选字段
  const fieldOptions = {
    activities: [
      { id: '_id', label: '活动ID', checked: false },
      { id: 'title', label: '活动标题', checked: true },
      { id: 'subtitle', label: '活动副标题', checked: true },
      { id: 'desc', label: '活动描述', checked: false },
      { id: 'price', label: '价格（元）', checked: true },
      { id: 'startTime', label: '开始时间', checked: true },
      { id: 'endTime', label: '结束时间', checked: true },
      { id: 'address', label: '活动地址', checked: true },
      { id: 'tags', label: '活动标签', checked: false },
      { id: 'isActive', label: '发布状态', checked: true },
      { id: 'createdAt', label: '创建时间', checked: true },
      { id: 'updatedAt', label: '更新时间', checked: false }
    ],
    orders: [...orderOnlyFields, ...activityRelatedFields],
    users: [
      { id: '_id', label: '用户ID', checked: false },
      { id: 'nickName', label: '用户昵称', checked: true },
      { id: 'phoneNumber', label: '手机号码', checked: true },
      { id: 'openid', label: 'OpenID', checked: false },
      { id: 'avatarUrl', label: '头像URL', checked: false },
      { id: 'createdAt', label: '注册时间', checked: true },
      { id: 'updatedAt', label: '更新时间', checked: false }
    ]
  };

  // 时间范围选项
  const dateRangeOptions = [
    { value: 'all', label: '所有数据' },
    { value: 'week', label: '最近一周' },
    { value: 'month', label: '最近一月' },
    { value: 'halfYear', label: '最近半年' },
    { value: 'year', label: '最近一年' }
  ];

  // 初始化选中字段
  useEffect(() => {
    const defaultFields = fieldOptions[exportType].filter(field => field.checked).map(field => field.id);
    setSelectedFields(defaultFields);
  }, [exportType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ensureAdminAccess($w);
        if (cancelled) return;
        if (res.status === 'redirected') {
          return;
        }
        setCurrentUid(res.uid || '');
        if (res.status !== 'ok') {
          setForbidden(true);
          setAuthChecked(true);
          return;
        }
        setForbidden(false);
        setAuthChecked(true);
      } catch (e) {
        if (cancelled) return;
        setForbidden(true);
        setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 处理字段选择
  const handleFieldChange = (fieldId, checked) => {
    setSelectedFields((prev) => {
      if (checked) {
        if (prev.includes(fieldId)) return prev;
        return [...prev, fieldId];
      }
      return prev.filter(id => id !== fieldId);
    });
  };

  // 全选/取消全选
  const handleSelectAll = checked => {
    if (checked) {
      setSelectedFields(() => fieldOptions[exportType].map(field => field.id));
    } else {
      setSelectedFields(() => []);
    }
  };

  useEffect(() => {
    setPreviewPage(1);
  }, [exportType, dateRange, selectedFields.length, previewPageSize]);

  const formatDisplayValue = (field, rawValue) => {
    let value = rawValue;

    if (isTimeField(field)) {
      return formatDateTime(value);
    }
    if (field === 'status' && exportType === 'orders') {
      return formatOrderStatus(value);
    }
    if (field === 'isActive' || field === 'activity_isActive') {
      return formatActiveStatus(value);
    }
    if (field === 'amount' || field === 'price' || field === 'activity_price') {
      return formatAmount(value);
    }

    if (Array.isArray(value)) {
      return value.join('、');
    }
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  };

  const detectCreatedAtType = async (db, collectionName) => {
    try {
      const cached = createdAtTypeCacheRef.current?.[collectionName];
      if (cached) return cached;

      let q = db.collection(collectionName);
      try {
        if (q?.field) {
          q = q.field({
            createdAt: true
          });
        }
      } catch (e) {}
      try {
        if (q?.orderBy) {
          q = q.orderBy('createdAt', 'desc');
        }
      } catch (e) {}
      try {
        if (q?.limit) {
          q = q.limit(10);
        }
      } catch (e) {}

      const res = await q.get();
      const data = res?.data;
      const list = Array.isArray(data) ? data : (data ? [data] : []);
      const firstWithCreatedAt = list.find((item) => item && item.createdAt !== undefined && item.createdAt !== null);
      const v = firstWithCreatedAt?.createdAt;
      const t = typeof v === 'number' ? 'number' : (typeof v === 'string' ? 'string' : 'unknown');
      createdAtTypeCacheRef.current = {
        ...(createdAtTypeCacheRef.current || {}),
        [collectionName]: t
      };
      return t;
    } catch (e) {
      return 'unknown';
    }
  };

  const loadPreviewData = async (pageOverride, pageSizeOverride) => {
    if (!authChecked || forbidden) {
      setPreviewData([]);
      setPreviewError('');
      return;
    }
    if (selectedFields.length === 0) {
      setPreviewData([]);
      setPreviewError('');
      return;
    }

    const page = typeof pageOverride === 'number' && pageOverride > 0 ? pageOverride : previewPage;
    const pageSize = typeof pageSizeOverride === 'number' && pageSizeOverride > 0 ? pageSizeOverride : previewPageSize;

    setPreviewLoading(true);
    setPreviewError('');
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();
      const cmd = db.command;

      let collectionName = '';
      if (exportType === 'activities') {
        collectionName = 'activities';
      } else if (exportType === 'orders') {
        collectionName = 'orders';
      } else if (exportType === 'users') {
        collectionName = 'users';
      }

      const range = getDateRange();
      let whereObj = null;
      if (range && cmd?.gte && cmd?.lte) {
        const { startDate, endDate } = range;
        const createdAtType = await detectCreatedAtType(db, collectionName);
        if (createdAtType === 'string') {
          const startStr = formatDateTime(startDate);
          const endStr = formatDateTime(endDate);
          try {
            whereObj = {
              createdAt: cmd.gte(startStr).and(cmd.lte(endStr))
            };
          } catch (e) {
            whereObj = null;
          }
        } else if (createdAtType === 'number') {
          const startTs = startDate.getTime();
          const endTs = endDate.getTime();
          try {
            whereObj = {
              createdAt: cmd.gte(startTs).and(cmd.lte(endTs))
            };
          } catch (e) {
            whereObj = null;
          }
        } else {
          whereObj = null;
        }
      }

      let totalKnown = true;
      let total = 0;
      try {
        let countQuery = db.collection(collectionName);
        try {
          if (whereObj && countQuery?.where) {
            countQuery = countQuery.where(whereObj);
          }
        } catch (e) {}
        if (countQuery?.count) {
          const countRes = await countQuery.count();
          total = typeof countRes?.total === 'number' ? countRes.total : 0;
        } else {
          totalKnown = false;
        }
      } catch (e) {
        totalKnown = false;
        total = 0;
      }

      let query = db.collection(collectionName);
      try {
        if (query?.orderBy) {
          query = query.orderBy('createdAt', 'desc');
        }
      } catch (e) {}

      try {
        if (whereObj && query?.where) {
          query = query.where(whereObj);
        }
      } catch (e) {}

      const offset = (page - 1) * pageSize;
      try {
        if (query?.skip) {
          query = query.skip(offset);
        }
      } catch (e) {}
      try {
        if (query?.limit) {
          query = query.limit(pageSize);
        }
      } catch (e) {}

      const result = await query.get();
      let data = result.data || [];

      if (range && !whereObj) {
        const { startDate, endDate } = range;
        data = data.filter(item => {
          const value = item.createdAt;
          if (!value) return false;
          const d = new Date(value);
          if (isNaN(d.getTime())) {
            return false;
          }
          return d >= startDate && d <= endDate;
        });
        totalKnown = false;
        total = 0;
      }

      if (exportType === 'orders' && hasActivityFields()) {
        const activityIds = [...new Set(data.map(order => order.activityId).filter(Boolean))];
        if (activityIds.length > 0) {
          const activitiesMap = {};
          for (let i = 0; i < activityIds.length; i += 100) {
            const chunk = activityIds.slice(i, i + 100);
            const activitiesResult = await db.collection('activities')
              .where({ _id: db.command.in(chunk) })
              .get();
            (activitiesResult.data || []).forEach(activity => {
              activitiesMap[activity._id] = activity;
            });
          }
          const activityFieldMapping = getActivityFieldMapping();
          data = data.map(order => {
            const activity = activitiesMap[order.activityId] || {};
            const enrichedOrder = { ...order };
            Object.entries(activityFieldMapping).forEach(([exportFieldId, sourceField]) => {
              enrichedOrder[exportFieldId] = activity[sourceField];
            });
            return enrichedOrder;
          });
        }
      }

      const filteredData = data.map(item => {
        const filteredItem = {};
        selectedFields.forEach(field => {
          filteredItem[field] = item[field];
        });
        return filteredItem;
      });

      setPreviewData(filteredData);
      setPreviewTotal(total);
      setPreviewTotalKnown(totalKnown);
      setPreviewHasMore(totalKnown ? page * pageSize < total : (result.data || []).length === pageSize);
      setPreviewLastUpdatedAt(Date.now());
    } catch (e) {
      setPreviewError(e?.message || '加载预览失败');
      setPreviewData([]);
      setPreviewTotal(0);
      setPreviewTotalKnown(true);
      setPreviewHasMore(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      loadPreviewData(previewPage, previewPageSize);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [authChecked, forbidden, exportType, dateRange, selectedFields.join('|'), previewPage, previewPageSize]);

  // 计算当前选择的时间范围（统一按 createdAt 时间筛选）
  const getDateRange = () => {
    if (dateRange === 'all') return null;
    const now = new Date();
    let startDate = new Date();
    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'halfYear':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    try {
      startDate.setHours(0, 0, 0, 0);
    } catch (e) {}
    return { startDate, endDate: now };
  };

  // 格式化时间戳为可读格式
  const formatDateTime = value => {
    if (!value) return '';
    try {
      // 导出/预览：字符串类型直接按数据库原值展示，避免被 Date 解析后产生时区偏移（如 08:00:00）
      if (typeof value === 'string') {
        return value;
      }

      const date = (value instanceof Date)
        ? value
        : (typeof value === 'number' ? new Date(value) : new Date(String(value)));

      if (isNaN(date.getTime())) {
        return String(value);
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('时间格式化错误:', error);
      return typeof value === 'string' ? value : String(value);
    }
  };

  // 判断是否为时间字段
  const isTimeField = fieldId => {
    const timeFields = ['createdAt', 'updatedAt', 'startTime', 'endTime', 'payTime', 'activity_startTime', 'activity_endTime'];
    return timeFields.includes(fieldId);
  };

  // 订单状态转义
  const formatOrderStatus = status => {
    const statusMap = {
      REGISTERED: '已报名',
      PAID: '已支付',
      CANCELLED: '已取消',
      PENDING: '待支付'
    };
    return statusMap[status] || status;
  };

  // 活动发布状态转义
  const formatActiveStatus = isActive => {
    return isActive ? '已发布' : '未发布';
  };

  // 金额格式化（分转元）
  const formatAmount = amount => {
    if (amount === null || amount === undefined) return '';
    const num = Number(amount);
    if (!Number.isFinite(num)) return String(amount);
    return (num / 100).toFixed(2);
  };

  // 检查是否选择了活动关联字段
  const hasActivityFields = () => {
    return selectedFields.some(fieldId => fieldId.startsWith('activity_'));
  };

  const previewTotalPages = previewTotalKnown ? Math.max(1, Math.ceil((previewTotal || 0) / previewPageSize)) : 0;
  const safePreviewPage = previewTotalKnown ? Math.min(Math.max(previewPage, 1), previewTotalPages) : Math.max(1, previewPage);
  const previewPageData = previewData || [];

  // 获取选中的活动字段映射
  const getActivityFieldMapping = () => {
    const mapping = {};
    activityRelatedFields.forEach(field => {
      if (selectedFields.includes(field.id)) {
        mapping[field.id] = field.sourceField;
      }
    });
    return mapping;
  };

  // 直接导出数据功能
  const handleDirectExport = async () => {
    if (!authChecked || forbidden) {
      return;
    }
    if (selectedFields.length === 0) {
      alert('请至少选择一个字段');
      return;
    }
    setIsExporting(true);
    setExportStatus('preparing');
    setExportProgress(0);
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();

      let collectionName = '';
      if (exportType === 'activities') {
        collectionName = 'activities';
      } else if (exportType === 'orders') {
        collectionName = 'orders';
      } else if (exportType === 'users') {
        collectionName = 'users';
      }
      setExportStatus('exporting');
      setExportProgress(30);

      // 查询主数据（不带时间条件，避免类型不兼容），统一在前端按 createdAt 过滤
      const cmd = db.command;
      const range = getDateRange();
      let whereObj = null;
      if (range && cmd?.gte && cmd?.lte) {
        const { startDate, endDate } = range;
        const createdAtType = await detectCreatedAtType(db, collectionName);
        if (createdAtType === 'string') {
          const startStr = formatDateTime(startDate);
          const endStr = formatDateTime(endDate);
          try {
            whereObj = {
              createdAt: cmd.gte(startStr).and(cmd.lte(endStr))
            };
          } catch (e) {
            whereObj = null;
          }
        } else if (createdAtType === 'number') {
          const startTs = startDate.getTime();
          const endTs = endDate.getTime();
          try {
            whereObj = {
              createdAt: cmd.gte(startTs).and(cmd.lte(endTs))
            };
          } catch (e) {
            whereObj = null;
          }
        } else {
          whereObj = null;
        }
      }

      const batchSize = 500;
      let data = [];
      let offset = 0;
      let safety = 0;
      while (safety < 2000) {
        safety += 1;
        let q = db.collection(collectionName);
        try {
          if (whereObj && q?.where) {
            q = q.where(whereObj);
          }
        } catch (e) {}
        try {
          if (q?.orderBy) {
            q = q.orderBy('createdAt', 'desc');
          }
        } catch (e) {}
        try {
          if (q?.skip) {
            q = q.skip(offset);
          }
        } catch (e) {}
        try {
          if (q?.limit) {
            q = q.limit(batchSize);
          }
        } catch (e) {}

        const res = await q.get();
        const part = res.data || [];
        if (range && !whereObj) {
          const { startDate, endDate } = range;
          data.push(...part.filter(item => {
            const value = item.createdAt;
            if (!value) return false;
            const d = new Date(value);
            if (isNaN(d.getTime())) {
              return false;
            }
            return d >= startDate && d <= endDate;
          }));
        } else {
          data.push(...part);
        }
        if (part.length < batchSize) {
          break;
        }
        offset += batchSize;
      }
      setExportProgress(50);

      // 如果是订单导出且选择了活动关联字段，则关联查询活动数据
      if (exportType === 'orders' && hasActivityFields()) {
        const activityIds = [...new Set(data.map(order => order.activityId).filter(Boolean))];

        if (activityIds.length > 0) {
          // 批量查询活动数据
          const activitiesMap = {};
          for (let i = 0; i < activityIds.length; i += 100) {
            const chunk = activityIds.slice(i, i + 100);
            const activitiesResult = await db.collection('activities')
              .where({ _id: db.command.in(chunk) })
              .get();
            (activitiesResult.data || []).forEach(activity => {
              activitiesMap[activity._id] = activity;
            });
          }

          // 关联活动数据到订单
          const activityFieldMapping = getActivityFieldMapping();
          data = data.map(order => {
            const activity = activitiesMap[order.activityId] || {};
            const enrichedOrder = { ...order };
            Object.entries(activityFieldMapping).forEach(([exportFieldId, sourceField]) => {
              enrichedOrder[exportFieldId] = activity[sourceField];
            });
            return enrichedOrder;
          });
        }
      }
      setExportProgress(70);

      // 只筛选字段，具体格式化在 generateCSV 中统一处理，避免双重格式化导致金额再次 /100
      const filteredData = data.map(item => {
        const filteredItem = {};
        selectedFields.forEach(field => {
          filteredItem[field] = item[field];
        });
        return filteredItem;
      });
      setExportProgress(85);

      // 根据格式生成文件内容
      let fileContent = '';
      let fileName = '';
      let mimeType = '';
      if (format === 'csv') {
        fileContent = generateCSV(filteredData, selectedFields);
        fileName = `${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      } else if (format === 'excel') {
        fileContent = generateExcelHtml(filteredData, selectedFields);
        fileName = `${exportType}_export_${new Date().toISOString().split('T')[0]}.xls`;
        mimeType = 'application/vnd.ms-excel;charset=utf-8;';
      }
      setExportProgress(95);

      // 创建下载链接
      const blob = new Blob([format === 'csv' ? '\ufeff' + fileContent : fileContent], { type: mimeType });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      } catch (e) {}
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
      setExportProgress(100);
      setExportStatus('completed');
      setExportResult({
        totalRecords: data.length,
        exportedRecords: filteredData.length,
        fileName: fileName
      });
    } catch (error) {
      console.error('导出失败:', error);
      setExportStatus('error');
      setExportResult({
        error: error.message || '导出过程中发生错误'
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
        setExportResult(null);
      }, 3000);
    }
  };

  // 生成CSV内容
  const generateCSV = (data, fields) => {
    if (data.length === 0) return '';

    const fieldLabels = fieldOptions[exportType].filter(field => fields.includes(field.id)).map(field => field.label);
    const headers = fieldLabels.map(label => {
      if (typeof label === 'string' && (label.includes(',') || label.includes('"'))) {
        return `"${label.replace(/"/g, '""')}"`;
      }
      return label;
    }).join(',');

    const rows = data.map(item => {
      return fields.map(field => {
        let value = item[field];

        // 时间字段格式化
        if (isTimeField(field)) {
          value = formatDateTime(value);
        }
        // 订单状态格式化
        else if (field === 'status' && exportType === 'orders') {
          value = formatOrderStatus(value);
        }
        // 活动发布状态格式化
        else if (field === 'isActive' || field === 'activity_isActive') {
          value = formatActiveStatus(value);
        }
        // 金额格式化（分转元）
        else if (field === 'amount' || field === 'price' || field === 'activity_price') {
          value = formatAmount(value);
        }

        value = String(value);
        if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    return [headers, ...rows].join('\n');
  };

  const escapeHtml = value => {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const generateExcelHtml = (data, fields) => {
    const fieldDefs = fieldOptions[exportType].filter(field => fields.includes(field.id));
    const headers = fieldDefs.map(f => `<th style="border:1px solid #ddd;padding:6px;background:#f5f5f5;">${escapeHtml(f.label)}</th>`).join('');

    const rows = (data || []).map(item => {
      const tds = fields.map(field => {
        let value = item[field];

        // 时间字段格式化
        if (isTimeField(field)) {
          value = formatDateTime(value);
        }
        // 订单状态格式化
        else if (field === 'status' && exportType === 'orders') {
          value = formatOrderStatus(value);
        }
        // 活动发布状态格式化
        else if (field === 'isActive' || field === 'activity_isActive') {
          value = formatActiveStatus(value);
        }
        // 金额格式化（分转元）
        else if (field === 'amount' || field === 'price' || field === 'activity_price') {
          const formatted = formatAmount(value);
          const num = Number(formatted);
          if (Number.isFinite(num)) {
            return `<td style="border:1px solid #ddd;padding:6px;mso-number-format:'0.00';">${num.toFixed(2)}</td>`;
          }
          value = formatted;
        }

        return `<td style="border:1px solid #ddd;padding:6px;">${escapeHtml(value)}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table style="border-collapse:collapse;">` +
      `<thead><tr>${headers}</tr></thead>` +
      `<tbody>${rows}</tbody>` +
      `</table></body></html>`;
  };

  // 获取订单基础字段
  const getOrderBaseFields = () => orderOnlyFields;

  // 获取活动关联字段
  const getActivityRelatedFields = () => activityRelatedFields;

  const handleLogout = async () => {
    try {
      try {
        if (typeof window !== 'undefined' && window?.sessionStorage?.setItem) {
          window.sessionStorage.setItem('__yinkaojiaoyu_admin_force_login__', '1');
        }
      } catch (e) {}
      const tcb = await $w.cloud.getCloudInstance();
      const auth = getAuthSingleton(tcb);
      if (auth?.signOut) {
        await auth.signOut();
      }
    } catch (error) {
      console.warn('退出登录失败:', error);
    }

    try {
      const res = await ensureAdminAccess($w);
      if (res?.status === 'redirected') {
        return;
      }
    } catch (e) {}

    $w.utils.navigateTo({
      pageId: 'admin',
      params: {
        forceLogin: '1',
        _t: String(Date.now())
      }
    });
  };

  if (authChecked && forbidden) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white/80 rounded-lg border border-blue-100 shadow p-6">
          <div className="text-lg font-semibold text-gray-900">无权限访问后台</div>
          <div className="text-sm text-gray-600 mt-2">请联系管理员将你的账号加入白名单后再访问。</div>
          {currentUid ? <div className="mt-3 text-xs text-gray-500 break-all">UID: {currentUid}</div> : null}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">退出登录</Button>
          </div>
        </div>
      </div>;
  }

  return <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Database className="w-8 h-8 mr-3 text-blue-600" />
            数据导出
          </h1>
          <p className="text-gray-600 mt-2">导出系统数据，支持多种格式和自定义字段</p>

          {/* 返回按钮 */}
          <div className="mt-4">
            <Button variant="outline" onClick={() => $w.utils.navigateBack()} className="flex items-center space-x-2 border-blue-200 text-blue-700 bg-white/70 hover:bg-blue-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>返回管理页面</span>
            </Button>
          </div>
        </div>

        {/* 导出配置选项 - 一行展示 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 导出类型 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  导出类型
                </Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white"
                  value={exportType}
                  onChange={(e) => {
                    const value = e.target.value;
                    setExportType(value);
                  }}
                >
                  <option value="activities">活动数据</option>
                  <option value="orders">订单数据</option>
                  <option value="users">用户数据</option>
                </select>
              </div>

              {/* 时间范围 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  时间范围
                </Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white"
                  value={dateRange}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDateRange(value);
                  }}
                >
                  {dateRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* 导出格式 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  导出格式
                </Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white"
                  value={format}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormat(value);
                  }}
                >
                  <option value="csv">CSV（.csv）</option>
                  <option value="excel">Excel（.xls）</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* 字段选择 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  选择导出字段
                </span>
                <div className="flex items-center space-x-2">
                  <Checkbox id="select-all" checked={selectedFields.length === fieldOptions[exportType].length} onCheckedChange={handleSelectAll} />
                  <Label htmlFor="select-all" className="text-sm">全选</Label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exportType === 'orders' ? (
                <div className="space-y-6">
                  {/* 订单基础字段 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">订单字段</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {getOrderBaseFields().map(field => (
                        <div key={field.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                          <Checkbox id={field.id} checked={selectedFields.includes(field.id)} onCheckedChange={checked => handleFieldChange(field.id, checked)} />
                          <Label htmlFor={field.id} className="text-sm font-medium cursor-pointer flex-1">{field.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 活动关联字段 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">活动关联字段（关联查询）</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {getActivityRelatedFields().map(field => (
                        <div key={field.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                          <Checkbox id={field.id} checked={selectedFields.includes(field.id)} onCheckedChange={checked => handleFieldChange(field.id, checked)} />
                          <Label htmlFor={field.id} className="text-sm font-medium cursor-pointer flex-1">{field.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {fieldOptions[exportType].map(field => (
                    <div key={field.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                      <Checkbox id={field.id} checked={selectedFields.includes(field.id)} onCheckedChange={checked => handleFieldChange(field.id, checked)} />
                      <Label htmlFor={field.id} className="text-sm font-medium cursor-pointer flex-1">{field.label}</Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 导出状态显示 */}
          {exportStatus !== 'idle' && <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                {exportStatus === 'completed' ? <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> : exportStatus === 'error' ? <AlertCircle className="w-5 h-5 mr-2 text-red-600" /> : <Clock className="w-5 h-5 mr-2 text-blue-600" />}
                导出状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exportStatus === 'preparing' && <div className="text-center py-4">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 text-blue-600 animate-spin" />
                <p className="text-gray-600">正在准备导出...</p>
              </div>}

              {exportStatus === 'exporting' && <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>导出进度</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${exportProgress}%` }}></div>
                </div>
              </div>}

              {exportStatus === 'completed' && exportResult && <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p className="text-green-600 font-medium">导出完成！</p>
                <p className="text-sm text-gray-600 mt-1">共导出 {exportResult.exportedRecords} 条记录</p>
                <p className="text-xs text-gray-500 mt-1">文件名: {exportResult.fileName}</p>
              </div>}

              {exportStatus === 'error' && exportResult && <div className="text-center py-4">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-600" />
                <p className="text-red-600 font-medium">导出失败</p>
                <p className="text-sm text-gray-600 mt-1">{exportResult.error}</p>
              </div>}
            </CardContent>
          </Card>}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  数据预览
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      loadPreviewData(previewPage, previewPageSize);
                    }}
                    disabled={previewLoading || !authChecked || forbidden || selectedFields.length === 0}
                    className="bg-white/70"
                  >
                    {previewLoading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />刷新</> : <><RefreshCw className="w-4 h-4 mr-2" />刷新</>}
                  </Button>
                  <Button
                    onClick={handleDirectExport}
                    disabled={isExporting || !authChecked || forbidden || selectedFields.length === 0}
                    className="bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-70"
                  >
                    {isExporting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />导出中...</> : <><Download className="w-4 h-4 mr-2" />导出</>}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <div>
                  {previewTotalKnown ? `共 ${previewTotal} 条` : `已加载 ${previewPageData.length} 条${previewHasMore ? '（可能还有更多）' : ''}`}
                </div>
                <div>
                  {previewLastUpdatedAt ? `更新于：${new Date(previewLastUpdatedAt).toLocaleString('zh-CN')}` : ''}
                </div>
              </div>

              {previewError ? (
                <div className="text-sm text-red-600">{previewError}</div>
              ) : null}

              {selectedFields.length === 0 ? (
                <div className="text-sm text-gray-500">请先选择导出字段后查看预览</div>
              ) : null}

              {selectedFields.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {selectedFields.map((field) => {
                          const def = fieldOptions[exportType].find((f) => f.id === field);
                          const label = def?.label || field;
                          return (
                            <th key={field} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                              {label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {previewLoading ? (
                        <tr>
                          <td colSpan={selectedFields.length} className="px-3 py-6 text-center text-gray-500">
                            <RefreshCw className="w-5 h-5 inline-block mr-2 animate-spin" />
                            加载中...
                          </td>
                        </tr>
                      ) : previewPageData.length === 0 ? (
                        <tr>
                          <td colSpan={selectedFields.length} className="px-3 py-6 text-center text-gray-500">
                            暂无数据
                          </td>
                        </tr>
                      ) : (
                        previewPageData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {selectedFields.map((field) => (
                              <td key={field} className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                {formatDisplayValue(field, row[field])}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {selectedFields.length > 0 ? (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    {previewTotalKnown ? `第 ${safePreviewPage} / ${previewTotalPages} 页` : `第 ${safePreviewPage} 页`}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">每页</span>
                      <select
                        className="border rounded px-2 py-1 text-sm bg-white"
                        value={String(previewPageSize)}
                        onChange={(e) => {
                          const value = e.target.value;
                          const next = Number(value);
                          if (Number.isFinite(next) && next > 0) {
                            setPreviewPageSize(next);
                          }
                        }}
                        disabled={previewLoading}
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <span className="text-sm text-gray-600">条</span>
                    </div>

                    <Button
                      variant="outline"
                      disabled={safePreviewPage <= 1}
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      disabled={previewTotalKnown ? safePreviewPage >= previewTotalPages : !previewHasMore}
                      onClick={() => {
                        if (previewTotalKnown) {
                          setPreviewPage((p) => Math.min(previewTotalPages, p + 1));
                        } else {
                          setPreviewPage((p) => p + 1);
                        }
                      }}
                    >
                      下一页
                    </Button>

                    <div className="flex items-center gap-2">
                      <input
                        className="border rounded px-2 py-1 text-sm w-24"
                        type="number"
                        min={1}
                        placeholder="跳转页"
                        value={previewPageInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPreviewPageInput(value);
                        }}
                        disabled={previewLoading}
                      />
                      <Button
                        variant="outline"
                        disabled={previewLoading || (previewTotalKnown && previewTotalPages <= 1 && safePreviewPage === 1)}
                        onClick={() => {
                          const raw = String(previewPageInput || '').trim();
                          const next = Number(raw);
                          if (!Number.isFinite(next) || next < 1) {
                            return;
                          }
                          if (previewTotalKnown) {
                            setPreviewPage(Math.min(previewTotalPages, Math.max(1, next)));
                          } else {
                            setPreviewPage(Math.max(1, next));
                          }
                        }}
                      >
                        跳转
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>;
}
