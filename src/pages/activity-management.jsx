// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Input, useToast } from '@/components/ui';

// @ts-ignore;
import { Activity } from 'lucide-react';
import { ensureAdminAccess, getAuthSingleton } from './auth-guard';

// @ts-ignore;
import { ActivityList } from '@/components/ActivityList';
// @ts-ignore;

import { ActivityFilters } from '@/components/ActivityFilters';

// @ts-ignore;
import { ActivityDialogs } from '@/components/ActivityDialogs';
export default function ActivityManagementPage(props) {
  const {
    $w
  } = props;
  const NAV_TARGET_KEY = '__yinkaojiaoyu_admin_nav_target__';

  const {
    toast
  } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [currentUid, setCurrentUid] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const [pageMeta, setPageMeta] = useState({
    totalKnown: true,
    hasMore: false
  });

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0
  });

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    desc: '',
    price: '',
    address: '',
    callNumber: '',
    startTime: '',
    endTime: '',
    tags: [],
    customerNumbers: [],
    bannerImages: [],
    detailImages: [],
    isActive: false,
    maxParticipants: ''
  });

  // 获取当前时间戳（毫秒）
  const getCurrentTimestamp = () => {
    return Date.now();
  };

  const isValidCustomerNumber = (num) => {
    if (typeof num !== 'string') return false;
    const v = num.trim();
    return /^1\d{10}$/.test(v);
  };

  // 优化后的活动数据加载 - 添加分页和字段投影，避免1MB限制
  const loadActivities = async (page = 1, reset = false, keepLoading = false, pageSizeOverride) => {
    if (!keepLoading) {
      setLoading(true);
    }
    try {
      // 构建查询条件
      const filter = {
        where: {
          $and: []
        }
      };

      // 添加搜索条件
      if (searchTerm) {
        filter.where.$and.push({
          $or: [{
            title: {
              $regex: searchTerm
            }
          }, {
            desc: {
              $regex: searchTerm
            }
          }, {
            address: {
              $regex: searchTerm
            }
          }]
        });
      }

      // 添加发布状态筛选 - 使用isActive字段
      if (statusFilter !== 'all') {
        filter.where.$and.push({
          isActive: {
            $eq: statusFilter === 'published'
          }
        });
      }

      // 如果没有筛选条件，移除 $and
      if (filter.where.$and.length === 0) {
        delete filter.where.$and;
      }

      // 优化查询：只选择必要字段，避免大字段导致1MB限制
      const projection = {
        _id: 1,
        title: 1,
        subtitle: 1,
        desc: 1,
        price: 1,
        address: 1,
        callNumber: 1,
        startTime: 1,
        endTime: 1,
        tags: 1,
        customerNumbers: 1,
        bannerImages: {
          $slice: 1 // 只返回第一张轮播图用于列表显示
        },
        type: 1,
        isActive: 1,
        maxParticipants: 1,
        createdAt: 1,
        updatedAt: 1
      };
      const pageSize = pageSizeOverride || pagination.pageSize;
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'activities',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: projection,
          filter: filter,
          orderBy: [{
            createdAt: 'desc'
          }],
          pageSize: pageSize,
          offset: (page - 1) * pageSize
        }
      });
      const records = result.records || [];

      // 处理图片数据，确保云存储链接正确显示
      const optimizedRecords = records.map(record => ({
        ...record,
        bannerImages: record.bannerImages && record.bannerImages.length > 0 ? record.bannerImages : []
      }));
      if (reset || page === 1) {
        setActivities(optimizedRecords);
      } else {
        setActivities(prev => [...prev, ...optimizedRecords]);
      }

      // 更新分页信息
      const candidates = [result?.total, result?.totalCount, result?.totalRecords, result?.count, result?.total_count];
      const explicitTotal = candidates.find(v => typeof v === 'number' && Number.isFinite(v));
      const minTotal = (page - 1) * pageSize + optimizedRecords.length;
      const totalKnown = typeof explicitTotal === 'number';
      const total = totalKnown ? Math.max(explicitTotal, minTotal) : minTotal;
      const hasMore = totalKnown ? page * pageSize < total : optimizedRecords.length === pageSize;
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize,
        total
      }));
      setPageMeta({
        totalKnown,
        hasMore
      });

      return {
        hasMore,
        total,
        totalKnown
      };
    } catch (error) {
      console.error('加载活动数据失败:', error);
      toast({
        title: "加载失败",
        description: error.message || "获取活动数据失败，请稍后重试",
        variant: "destructive"
      });
      setActivities([]);
      setPageMeta({
        totalKnown: true,
        hasMore: false
      });
      return {
        hasMore: false,
        total: 0
      };
    } finally {
      if (!keepLoading) {
        setLoading(false);
      }
    }
  };

  // 加载单个活动的完整数据（用于编辑和详情）
  const loadActivityDetail = async activityId => {
    try {
      // 详情页需要完整数据，但使用分页避免1MB限制
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'activities',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true // 详情页需要完整数据
          },
          filter: {
            where: {
              _id: {
                $eq: activityId
              }
            }
          },
          pageSize: 1
        }
      });
      return result.records && result.records.length > 0 ? result.records[0] : null;
    } catch (error) {
      console.error('加载活动详情失败:', error);
      toast({
        title: "加载失败",
        description: "加载活动详情失败，请重试",
        variant: "destructive"
      });
      return null;
    }
  };

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
          setLoading(false);
          return;
        }
        setForbidden(false);
        setAuthChecked(true);
      } catch (e) {
        if (cancelled) return;
        setForbidden(true);
        setAuthChecked(true);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 页面加载/筛选变更时获取活动数据
  useEffect(() => {
    if (!authChecked || forbidden) return;
    loadActivities(1, true);
  }, [searchTerm, statusFilter, authChecked, forbidden]);

  const consumeNavTarget = async () => {
    try {
      if (typeof window === 'undefined' || !window?.sessionStorage?.getItem) return;
      const raw = window.sessionStorage.getItem(NAV_TARGET_KEY);
      if (!raw) return;
      let target = null;
      try {
        target = JSON.parse(raw);
      } catch (e) {
        target = null;
      }
      if (!target || target.type !== 'activity' || !target.activityId) return;
      try {
        window.sessionStorage.removeItem(NAV_TARGET_KEY);
      } catch (e) {}

      setSearchTerm('');
      setStatusFilter('all');
      setPagination(prev => ({
        ...prev,
        current: 1
      }));

      await openEditDialog({
        _id: target.activityId
      });
    } catch (e) {}
  };

  // admin 跳转定位：自动打开对应活动编辑
  useEffect(() => {
    if (!authChecked || forbidden) return;
    consumeNavTarget();
  }, [authChecked, forbidden]);

  // 检查是否已有发布的活动 - 使用isActive字段
  const checkHasPublishedActivity = () => {
    return activities.some(activity => activity.isActive);
  };

  // 获取已发布的活动 - 使用isActive字段
  const getPublishedActivity = () => {
    return activities.find(activity => activity.isActive);
  };

  // 处理活动发布状态切换 - 使用isActive字段
  const handleTogglePublish = async activity => {
    // 如果要发布活动，检查是否已有发布的活动
    if (!activity.isActive) {
      const existingPublished = getPublishedActivity();
      if (existingPublished && existingPublished._id !== activity._id) {
        const confirmUnpublish = confirm(`已有活动"${existingPublished.title}"正在发布中，是否要下架该活动并发布"${activity.title}"？`);
        if (!confirmUnpublish) return;

        // 先下架已发布的活动
        try {
          await $w.cloud.callDataSource({
            dataSourceName: 'activities',
            methodName: 'wedaUpdateV2',
            params: {
              filter: {
                where: {
                  _id: {
                    $eq: existingPublished._id
                  }
                }
              },
              data: {
                isActive: false,
                updatedAt: getCurrentTimestamp() // 使用时间戳
              }
            }
          });
          toast({
            title: "下架成功",
            description: `活动"${existingPublished.title}"已下架`
          });
        } catch (error) {
          console.error('下架活动失败:', error);
          toast({
            title: "下架失败",
            description: error.message || "下架活动失败，请稍后重试",
            variant: "destructive"
          });
          return;
        }
      }
    }

    // 切换发布状态
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'activities',
        methodName: 'wedaUpdateV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: activity._id
              }
            }
          },
          data: {
            isActive: !activity.isActive,
            updatedAt: getCurrentTimestamp() // 使用时间戳
          }
        }
      });
      toast({
        title: activity.isActive ? "下架成功" : "发布成功",
        description: `活动"${activity.title}"已${activity.isActive ? '下架' : '发布'}`
      });
      loadActivities(1, true); // 重新加载数据
    } catch (error) {
      console.error('切换发布状态失败:', error);
      toast({
        title: "操作失败",
        description: error.message || "操作失败，请稍后重试",
        variant: "destructive"
      });
    }
  };

  // 创建活动
  const handleCreateActivity = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "验证失败",
        description: "请输入活动标题",
        variant: "destructive"
      });
      return;
    }

    const rawCustomerNumbers = Array.isArray(formData.customerNumbers) ? formData.customerNumbers : [];
    const invalidCustomerNumbers = rawCustomerNumbers.filter(num => num && typeof num === 'string' && num.trim() && !isValidCustomerNumber(num));
    if (invalidCustomerNumbers.length > 0) {
      toast({
        title: "验证失败",
        description: `客户号码格式不正确（仅支持11位手机号），请检查：${invalidCustomerNumbers.slice(0, 5).join('、')}${invalidCustomerNumbers.length > 5 ? '…' : ''}`,
        variant: "destructive"
      });
      return;
    }

    // 如果要创建的活动是发布状态，检查是否已有发布的活动
    if (formData.isActive && checkHasPublishedActivity()) {
      const existingPublished = getPublishedActivity();
      const confirmUnpublish = confirm(`已有活动"${existingPublished.title}"正在发布中，是否要下架该活动并发布新活动？`);
      if (!confirmUnpublish) return;

      // 先下架已发布的活动
      try {
        await $w.cloud.callDataSource({
          dataSourceName: 'activities',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: existingPublished._id
                }
              }
            },
            data: {
              isActive: false,
              updatedAt: getCurrentTimestamp() // 使用时间戳
            }
          }
        });
        toast({
          title: "下架成功",
          description: `活动"${existingPublished.title}"已下架`
        });
      } catch (error) {
        console.error('下架活动失败:', error);
        toast({
          title: "下架失败",
          description: error.message || "下架活动失败，请稍后重试",
          variant: "destructive"
        });
        return;
      }
    }
    try {
      const callNumberValue = (formData.callNumber || '').trim();
      // 准备活动数据，确保所有字段都符合数据集结构
      const activityData = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        desc: formData.desc.trim(),
        price: Math.round((parseFloat(formData.price) || 0) * 100), // 元转分存储
        address: formData.address.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        // 修复：添加空值检查，确保 tag 不为 undefined
        tags: formData.tags.filter(tag => tag && typeof tag === 'string' && tag.trim()),
        customerNumbers: (Array.isArray(formData.customerNumbers) ? formData.customerNumbers : []).filter(num => num && typeof num === 'string' && isValidCustomerNumber(num)),
        // 修复：添加空值检查，确保 img 不为 undefined
        bannerImages: formData.bannerImages.filter(img => img && typeof img === 'string' && img.trim()),
        // 修复：添加空值检查，确保 img 不为 undefined
        detailImages: formData.detailImages.filter(img => img && typeof img === 'string' && img.trim()),
        isActive: formData.isActive,
        maxParticipants: parseInt(formData.maxParticipants) || 0,
        createdAt: getCurrentTimestamp(),
        // 使用时间戳
        updatedAt: getCurrentTimestamp() // 使用时间戳
      };

      if (callNumberValue) {
        activityData.callNumber = callNumberValue;
      }

      await $w.cloud.callDataSource({
        dataSourceName: 'activities',
        methodName: 'wedaCreateV2',
        params: {
          data: activityData
        }
      });
      toast({
        title: "创建成功",
        description: "活动已成功创建并保存到数据集"
      });
      setShowCreateDialog(false);
      resetForm();
      loadActivities(1, true); // 重新加载数据
    } catch (error) {
      console.error('创建活动失败:', error);
      toast({
        title: "创建失败",
        description: error.message || "创建活动失败，请稍后重试",
        variant: "destructive"
      });
    }
  };

  // 更新活动
  const handleUpdateActivity = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "验证失败",
        description: "请输入活动标题",
        variant: "destructive"
      });
      return;
    }

    const rawCustomerNumbers = Array.isArray(formData.customerNumbers) ? formData.customerNumbers : [];
    const invalidCustomerNumbers = rawCustomerNumbers.filter(num => num && typeof num === 'string' && num.trim() && !isValidCustomerNumber(num));
    if (invalidCustomerNumbers.length > 0) {
      toast({
        title: "验证失败",
        description: `客户号码格式不正确（仅支持11位手机号），请检查：${invalidCustomerNumbers.slice(0, 5).join('、')}${invalidCustomerNumbers.length > 5 ? '…' : ''}`,
        variant: "destructive"
      });
      return;
    }

    // 如果要更新的活动是发布状态，且不是当前已发布的活动，检查是否已有发布的活动
    if (formData.isActive && !selectedActivity.isActive && checkHasPublishedActivity()) {
      const existingPublished = getPublishedActivity();
      const confirmUnpublish = confirm(`已有活动"${existingPublished.title}"正在发布中，是否要下架该活动并发布"${formData.title}"？`);
      if (!confirmUnpublish) return;

      // 先下架已发布的活动
      try {
        await $w.cloud.callDataSource({
          dataSourceName: 'activities',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: existingPublished._id
                }
              }
            },
            data: {
              isActive: false,
              updatedAt: getCurrentTimestamp() // 使用时间戳
            }
          }
        });
        toast({
          title: "下架成功",
          description: `活动"${existingPublished.title}"已下架`
        });
      } catch (error) {
        console.error('下架活动失败:', error);
        toast({
          title: "下架失败",
          description: error.message || "下架活动失败，请稍后重试",
          variant: "destructive"
        });
        return;
      }
    }
    try {
      const callNumberValue = (formData.callNumber || '').trim();
      // 准备更新数据，确保所有字段都符合数据集结构
      const activityData = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        desc: formData.desc.trim(),
        price: Math.round((parseFloat(formData.price) || 0) * 100), // 元转分存储
        address: formData.address.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        // 修复：添加空值检查，确保 tag 不为 undefined
        tags: formData.tags.filter(tag => tag && typeof tag === 'string' && tag.trim()),
        customerNumbers: (Array.isArray(formData.customerNumbers) ? formData.customerNumbers : []).filter(num => num && typeof num === 'string' && isValidCustomerNumber(num)),
        // 修复：添加空值检查，确保 img 不为 undefined
        bannerImages: formData.bannerImages.filter(img => img && typeof img === 'string' && img.trim()),
        // 修复：添加空值检查，确保 img 不为 undefined
        detailImages: formData.detailImages.filter(img => img && typeof img === 'string' && img.trim()),
        isActive: formData.isActive,
        maxParticipants: parseInt(formData.maxParticipants) || 0,
        updatedAt: getCurrentTimestamp() // 使用时间戳
      };

      if (callNumberValue) {
        activityData.callNumber = callNumberValue;
      }

      await $w.cloud.callDataSource({
        dataSourceName: 'activities',
        methodName: 'wedaUpdateV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: selectedActivity._id
              }
            }
          },
          data: activityData
        }
      });
      toast({
        title: "更新成功",
        description: "活动信息已更新并保存到数据集"
      });
      setShowEditDialog(false);
      resetForm();
      loadActivities(1, true); // 重新加载数据
    } catch (error) {
      console.error('更新活动失败:', error);
      toast({
        title: "更新失败",
        description: error.message || "更新活动失败，请稍后重试",
        variant: "destructive"
      });
    }
  };

  // 删除活动
  const handleDeleteActivity = async activity => {
    if (!confirm('确定要删除这个活动吗？此操作不可恢复。')) {
      return;
    }
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'activities',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: activity._id
              }
            }
          }
        }
      });
      toast({
        title: "删除成功",
        description: "活动已从数据集中删除"
      });
      loadActivities(1, true); // 重新加载数据
    } catch (error) {
      console.error('删除活动失败:', error);
      toast({
        title: "删除失败",
        description: error.message || "删除活动失败，请稍后重试",
        variant: "destructive"
      });
    }
  };

  // 图片上传回调函数
  const handleBannerImageUpload = (fileID) => {
    setFormData((prev) => ({
      ...prev,
      bannerImages: [...prev.bannerImages, fileID]
    }));
  };

  const handleRemoveBannerImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      bannerImages: prev.bannerImages.filter((_, i) => i !== index)
    }));
  };

  const handleDetailImageUpload = (fileID) => {
    setFormData((prev) => ({
      ...prev,
      detailImages: [...prev.detailImages, fileID]
    }));
  };

  const handleRemoveDetailImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      detailImages: prev.detailImages.filter((_, i) => i !== index)
    }));
  };

  // 标签回调函数
  const handleAddTag = (tag) => {
    if (tag && tag.trim() && formData.tags.length < 4) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag.trim().slice(0, 6)]
      }));
    }
  };

  const handleRemoveTag = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      desc: '',
      price: '',
      address: '',
      callNumber: '',
      startTime: '',
      endTime: '',
      tags: [],
      customerNumbers: [],
      bannerImages: [],
      detailImages: [],
      isActive: false,
      maxParticipants: ''
    });
    setSelectedActivity(null);
  };

  // 打开编辑对话框 - 加载完整数据
  const openEditDialog = async activity => {
    setLoading(true);
    try {
      // 加载活动的完整数据
      const fullActivity = await loadActivityDetail(activity._id);
      if (fullActivity) {
        setSelectedActivity(fullActivity);
        setFormData({
          title: fullActivity.title || '',
          subtitle: fullActivity.subtitle || '',
          desc: fullActivity.desc || '',
          price: fullActivity.price ? (fullActivity.price / 100).toString() : '', // 分转元显示
          address: fullActivity.address || '',
          callNumber: fullActivity.callNumber || '',
          startTime: fullActivity.startTime || '',
          endTime: fullActivity.endTime || '',
          tags: fullActivity.tags || [],
          customerNumbers: Array.isArray(fullActivity.customerNumbers) ? fullActivity.customerNumbers : [],
          bannerImages: fullActivity.bannerImages || [],
          detailImages: fullActivity.detailImages || [],
          isActive: fullActivity.isActive || false,
          maxParticipants: fullActivity.maxParticipants?.toString() || ''
        });
        setShowEditDialog(true);
      } else {
        toast({
          title: "加载失败",
          description: "无法加载活动详情，请重试",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('加载活动详情失败:', error);
      toast({
        title: "加载失败",
        description: "加载活动详情失败，请重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 打开详情对话框 - 加载完整数据
  const openDetailDialog = async activity => {
    setLoading(true);
    try {
      // 加载活动的完整数据
      const fullActivity = await loadActivityDetail(activity._id);
      if (fullActivity) {
        setSelectedActivity(fullActivity);
        setShowDetailDialog(true);
      } else {
        toast({
          title: "加载失败",
          description: "无法加载活动详情，请重试",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('加载活动详情失败:', error);
      toast({
        title: "加载失败",
        description: "加载活动详情失败，请重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取发布状态显示 - 使用isActive字段
  const getStatusDisplay = isActive => {
    return isActive ? '已发布' : '未发布';
  };

  // 获取状态颜色 - 使用isActive字段
  const getStatusColor = isActive => {
    return isActive ? 'default' : 'secondary';
  };

  // 格式化时间 - 处理时间戳和字符串格式
  const formatDateTime = dateValue => {
    if (!dateValue) return '未设置';
    try {
      let date;
      // 如果是数字（时间戳），转换为Date对象
      if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      } else {
        // 如果是字符串，直接转换为Date对象
        date = new Date(dateValue);
      }
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('时间格式化错误:', error);
      return '时间格式错误';
    }
  };

  // 格式化价格（分转元显示）
  const formatPrice = price => {
    const numPrice = parseFloat(price) || 0;
    const priceInYuan = numPrice / 100;
    return priceInYuan === 0 ? '免费' : `¥${priceInYuan.toFixed(2)}`;
  };

  // 加载更多数据
  const handleLoadMore = () => {
    if (!loading && pagination.current * pagination.pageSize < pagination.total) {
      loadActivities(pagination.current + 1, false);
    }
  };

  // 检查是否还有更多数据
  const totalPages = pageMeta.totalKnown ? Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize)) : 0;
  const hasMore = pageMeta.totalKnown ? pagination.current * pagination.pageSize < pagination.total : pageMeta.hasMore;

  const handlePrevPage = () => {
    if (pagination.current <= 1) return;
    loadActivities(pagination.current - 1, true);
  };

  const handleNextPage = () => {
    if (!hasMore) return;
    loadActivities(pagination.current + 1, true);
  };

  const handleJumpPage = () => {
    if (!pageMeta.totalKnown) return;
    const target = parseInt(pageInput, 10);
    if (!target || target < 1 || target > totalPages) return;
    loadActivities(target, true);
  };

  const handleChangePageSize = (newSize) => {
    const pageSize = parseInt(newSize, 10);
    if (!pageSize || pageSize <= 0) return;
    setPagination(prev => ({
      ...prev,
      pageSize,
      current: 1
    }));
    loadActivities(1, true, false, pageSize);
  };

  // 返回管理后台
  const handleBackToAdmin = () => {
    $w.utils.navigateTo({
      pageId: 'admin',
      params: {}
    });
  };
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
            <button type="button" onClick={handleLogout} className="px-4 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50">退出登录</button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">活动管理</h1>
          <p className="text-gray-600 mt-2">管理所有活动信息，包括创建、编辑、发布和删除</p>
        </div>

        {/* 筛选和操作区域 */}
        <ActivityFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onCreateActivity={() => setShowCreateDialog(true)} onBackToAdmin={handleBackToAdmin} />

        {/* 活动列表 */}
        <ActivityList activities={activities} loading={loading} onEdit={openEditDialog} onDelete={handleDeleteActivity} onView={openDetailDialog} onTogglePublish={handleTogglePublish} getStatusDisplay={getStatusDisplay} getStatusColor={getStatusColor} formatDateTime={formatDateTime} formatPrice={formatPrice} onLoadMore={handleLoadMore} hasMore={false} />

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            {pageMeta.totalKnown ? `共 ${pagination.total || 0} 条，当前第 ${pagination.current}/${totalPages} 页` : `当前已加载 ${activities.length} 条${hasMore ? '，可能还有更多' : ''}`}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 px-2 rounded-md border border-gray-200 bg-white text-sm"
              value={String(pagination.pageSize)}
              onChange={(e) => {
              const value = e.target.value;
              handleChangePageSize(value);
            }}
            >
              <option value="20">20/页</option>
              <option value="50">50/页</option>
              <option value="100">100/页</option>
            </select>
            <Button variant="outline" disabled={pagination.current <= 1} onClick={handlePrevPage}>上一页</Button>
            <Button variant="outline" disabled={!hasMore} onClick={handleNextPage}>下一页</Button>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                placeholder="页码"
                value={pageInput}
                disabled={!pageMeta.totalKnown}
                onChange={(e) => {
                const value = e.target.value;
                setPageInput(value);
              }}
                className="w-24"
              />
              <Button variant="outline" disabled={!pageMeta.totalKnown} onClick={handleJumpPage}>跳转</Button>
            </div>
          </div>
        </div>

        {/* 对话框 */}
        <ActivityDialogs showCreateDialog={showCreateDialog} setShowCreateDialog={setShowCreateDialog} showEditDialog={showEditDialog} setShowEditDialog={setShowEditDialog} showDetailDialog={showDetailDialog} setShowDetailDialog={setShowDetailDialog} selectedActivity={selectedActivity} formData={formData} setFormData={setFormData} onCreateActivity={handleCreateActivity} onUpdateActivity={handleUpdateActivity} onEdit={openEditDialog} onTogglePublish={handleTogglePublish} getStatusDisplay={getStatusDisplay} getStatusColor={getStatusColor} formatDateTime={formatDateTime} formatPrice={formatPrice} handleBannerImageUpload={handleBannerImageUpload} handleRemoveBannerImage={handleRemoveBannerImage} handleDetailImageUpload={handleDetailImageUpload} handleRemoveDetailImage={handleRemoveDetailImage} handleAddTag={handleAddTag} handleRemoveTag={handleRemoveTag} />
      </div>
    </div>;
}