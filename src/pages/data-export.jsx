// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, Label } from '@/components/ui';
// @ts-ignore;
import { Download, FileText, Users, Calendar, Database, CheckCircle, AlertCircle, Clock, RefreshCw, ArrowLeft } from 'lucide-react';

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

  // 订单字段（不包含活动相关字段）
  const orderOnlyFields = [
    { id: '_id', label: '订单ID', checked: false },
    { id: 'userId', label: '用户ID', checked: false },
    { id: 'userName', label: '用户姓名', checked: true },
    { id: 'userPhone', label: '用户手机', checked: true },
    { id: 'activityId', label: '活动ID', checked: false },
    { id: 'amount', label: '总金额', checked: true },
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
    { id: 'activity_price', label: '活动价格', checked: false, sourceField: 'price' },
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
      { id: 'price', label: '价格', checked: true },
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
      { id: 'name', label: '用户姓名', checked: true },
      { id: 'phone', label: '手机号码', checked: true },
      { id: 'email', label: '邮箱地址', checked: false },
      { id: 'type', label: '用户类型', checked: true },
      { id: 'avatarUrl', label: '头像URL', checked: false },
      { id: 'nickName', label: '昵称', checked: false },
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

  // 处理字段选择
  const handleFieldChange = (fieldId, checked) => {
    if (checked) {
      setSelectedFields([...selectedFields, fieldId]);
    } else {
      setSelectedFields(selectedFields.filter(id => id !== fieldId));
    }
  };

  // 全选/取消全选
  const handleSelectAll = checked => {
    if (checked) {
      setSelectedFields(fieldOptions[exportType].map(field => field.id));
    } else {
      setSelectedFields([]);
    }
  };

  // 构建查询条件
  const buildQuery = () => {
    let query = {};
    if (dateRange !== 'all') {
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
      query.createdAt = {
        $gte: startDate.toISOString(),
        $lte: now.toISOString()
      };
    }
    return query;
  };

  // 格式化时间戳为可读格式
  const formatDateTime = value => {
    if (!value) return '';
    try {
      const date = typeof value === 'number' ? new Date(value) : new Date(value);
      if (isNaN(date.getTime())) {
        return value;
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
      return value;
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
    return (amount / 100).toFixed(2);
  };

  // 检查是否选择了活动关联字段
  const hasActivityFields = () => {
    return selectedFields.some(fieldId => fieldId.startsWith('activity_'));
  };

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
    if (selectedFields.length === 0) {
      alert('请至少选择一个字段');
      return;
    }
    setIsExporting(true);
    setExportStatus('preparing');
    setExportProgress(0);
    try {
      const query = buildQuery();
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

      // 查询主数据
      const result = await db.collection(collectionName).where(query).get();
      let data = result.data || [];
      setExportProgress(50);

      // 如果是订单导出且选择了活动关联字段，则关联查询活动数据
      if (exportType === 'orders' && hasActivityFields()) {
        const activityIds = [...new Set(data.map(order => order.activityId).filter(Boolean))];

        if (activityIds.length > 0) {
          // 批量查询活动数据
          const activitiesResult = await db.collection('activities')
            .where({ _id: db.command.in(activityIds) })
            .get();
          const activitiesMap = {};
          (activitiesResult.data || []).forEach(activity => {
            activitiesMap[activity._id] = activity;
          });

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

      // 过滤选中的字段并进行格式化
      const filteredData = data.map(item => {
        const filteredItem = {};
        selectedFields.forEach(field => {
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

          filteredItem[field] = value;
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
        fileContent = generateCSV(filteredData, selectedFields);
        fileName = `${exportType}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;';
      }
      setExportProgress(95);

      // 创建下载链接
      const blob = new Blob(['\ufeff' + fileContent], { type: mimeType });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
        if (value === null || value === undefined) {
          return '';
        }
        if (Array.isArray(value)) {
          value = value.join(';');
        }
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
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

  // 获取订单基础字段
  const getOrderBaseFields = () => orderOnlyFields;

  // 获取活动关联字段
  const getActivityRelatedFields = () => activityRelatedFields;

  return <div className="min-h-screen p-6 bg-gray-50">
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
            <Button variant="outline" onClick={() => $w.utils.navigateBack()} className="flex items-center space-x-2 hover:bg-gray-50 transition-colors">
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
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择导出类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activities">活动数据</SelectItem>
                    <SelectItem value="orders">订单数据</SelectItem>
                    <SelectItem value="users">用户数据</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 时间范围 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  时间范围
                </Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择时间范围" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRangeOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* 导出格式 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  导出格式
                </Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择导出格式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV 格式</SelectItem>
                    <SelectItem value="excel">Excel 格式</SelectItem>
                  </SelectContent>
                </Select>
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

          {/* 导出按钮 */}
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleDirectExport} disabled={isExporting || selectedFields.length === 0} className="w-full" size="lg">
                {isExporting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />导出中...</> : <><Download className="w-4 h-4 mr-2" />开始导出</>}
              </Button>
              {selectedFields.length === 0 && <p className="text-sm text-red-500 mt-2 text-center">请至少选择一个字段</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}
