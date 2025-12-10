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
  const [dateRange, setDateRange] = useState('all'); // 改为预设选项
  const [selectedFields, setSelectedFields] = useState([]);
  const [format, setFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('idle'); // idle, preparing, exporting, completed, error
  // idle, preparing, exporting, completed, error
  const [exportResult, setExportResult] = useState(null);
  // 根据数据源实际字段定义可选字段
  // 根据数据源实际字段定义可选字段
  const fieldOptions = {
    activities: [{
      id: '_id',
      label: '活动ID',
      checked: false
    }, {
      id: 'title',
      label: '活动标题',
      checked: true
    }, {
      id: 'subtitle',
      label: '活动副标题',
      checked: true
    }, {
      id: 'desc',
      label: '活动描述',
      checked: false
    }, {
      id: 'price',
      label: '价格',
      checked: true
    }, {
      id: 'startTime',
      label: '开始时间',
      checked: true
    }, {
      id: 'endTime',
      label: '结束时间',
      checked: true
    }, {
      id: 'address',
      label: '活动地址',
      checked: true
    }, {
      id: 'tags',
      label: '活动标签',
      checked: false
    }, {
      id: 'isActive',
      label: '发布状态',
      checked: true
    }, {
      id: 'createdAt',
      label: '创建时间',
      checked: true
    }, {
      id: 'updatedAt',
      label: '更新时间',
      checked: false
    }],
    orders: [{
      id: '_id',
      label: '订单ID',
      checked: false
    }, {
      id: 'orderNo',
      label: '订单号',
      checked: true
    }, {
      id: 'userId',
      label: '用户ID',
      checked: false
    }, {
      id: 'userName',
      label: '用户姓名',
      checked: true
    }, {
      id: 'userPhone',
      label: '用户手机',
      checked: true
    }, {
      id: 'activityId',
      label: '活动ID',
      checked: false
    }, {
      id: 'activityTitle',
      label: '活动标题',
      checked: true
    }, {
      id: 'totalAmount',
      label: '总金额',
      checked: true
    }, {
      id: 'status',
      label: '订单状态',
      checked: true
    }, {
      id: 'paymentMethod',
      label: '支付方式',
      checked: false
    }, {
      id: 'paymentTime',
      label: '支付时间',
      checked: false
    }, {
      id: 'createdAt',
      label: '创建时间',
      checked: true
    }, {
      id: 'updatedAt',
      label: '更新时间',
      checked: false
    }],
    users: [{
      id: '_id',
      label: '用户ID',
      checked: false
    }, {
      id: 'name',
      label: '用户姓名',
      checked: true
    }, {
      id: 'phone',
      label: '手机号码',
      checked: true
    }, {
      id: 'email',
      label: '邮箱地址',
      checked: false
    }, {
      id: 'type',
      label: '用户类型',
      checked: true
    }, {
      id: 'avatarUrl',
      label: '头像URL',
      checked: false
    }, {
      id: 'nickName',
      label: '昵称',
      checked: false
    }, {
      id: 'createdAt',
      label: '注册时间',
      checked: true
    }, {
      id: 'updatedAt',
      label: '更新时间',
      checked: false
    }]
  };

  // 时间范围选项
  const dateRangeOptions = [{
    value: 'all',
    label: '所有数据'
  }, {
    value: 'week',
    label: '最近一周'
  }, {
    value: 'month',
    label: '最近一月'
  }, {
    value: 'halfYear',
    label: '最近半年'
  }, {
    value: 'year',
    label: '最近一年'
  }];

  // 初始化选中字段
  // 初始化选中字段
  useEffect(() => {
    const defaultFields = fieldOptions[exportType].filter(field => field.checked).map(field => field.id);
    setSelectedFields(defaultFields);
  }, [exportType]);

  // 处理字段选择
  // 处理字段选择
  const handleFieldChange = (fieldId, checked) => {
    if (checked) {
      setSelectedFields([...selectedFields, fieldId]);
    } else {
      setSelectedFields(selectedFields.filter(id => id !== fieldId));
    }
  };

  // 全选/取消全选
  // 全选/取消全选
  const handleSelectAll = checked => {
    if (checked) {
      setSelectedFields(fieldOptions[exportType].map(field => field.id));
    } else {
      setSelectedFields([]);
    }
  };

  // 构建查询条件
  // 构建查询条件
  const buildQuery = () => {
    let query = {};

    // 根据时间范围选项构建查询条件
    // 根据时间范围选项构建查询条件
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
  // 格式化时间戳为可读格式
  const formatDateTime = value => {
    if (!value) return '';
    try {
      // 如果是时间戳数字，转换为Date对象
      const date = typeof value === 'number' ? new Date(value) : new Date(value);

      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return value; // 如果无法解析，返回原值
      }

      // 格式化为 YYYY-MM-DD HH:mm:ss
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('时间格式化错误:', error);
      return value; // 出错时返回原值
    }
  };

  // 判断是否为时间字段
  // 判断是否为时间字段
  const isTimeField = fieldId => {
    const timeFields = ['createdAt', 'updatedAt', 'startTime', 'endTime', 'paymentTime'];
    return timeFields.includes(fieldId);
  };

  // 直接导出数据功能
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
      // 构建查询条件
      const query = buildQuery();

      // 获取云开发实例
      // 获取云开发实例
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();

      // 根据导出类型获取数据
      // 根据导出类型获取数据
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

      // 查询数据
      // 查询数据
      const result = await db.collection(collectionName).where(query).get();
      const data = result.data || [];
      setExportProgress(60);

      // 过滤选中的字段
      // 过滤选中的字段
      const filteredData = data.map(item => {
        const filteredItem = {};
        selectedFields.forEach(field => {
          let value = item[field];

          // 对时间字段进行格式化
          if (isTimeField(field)) {
            value = formatDateTime(value);
          }
          filteredItem[field] = value;
        });
        return filteredItem;
      });
      setExportProgress(80);

      // 根据格式生成文件内容
      // 根据格式生成文件内容
      let fileContent = '';
      let fileName = '';
      let mimeType = '';
      if (format === 'csv') {
        fileContent = generateCSV(filteredData, selectedFields);
        fileName = `${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      } else if (format === 'excel') {
        // 简单的Excel格式（实际上是CSV格式，Excel可以打开）
        fileContent = generateCSV(filteredData, selectedFields);
        fileName = `${exportType}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;';
      }
      setExportProgress(90);

      // 创建下载链接
      // 创建下载链接
      const blob = new Blob(['\ufeff' + fileContent], {
        type: mimeType
      });
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
      // 3秒后重置状态
      // 3秒后重置状态
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
        setExportResult(null);
      }, 3000);
    }
  };

  // 生成CSV内容 - 完全重写版本
  // 生成CSV内容 - 完全重写版本
  const generateCSV = (data, fields) => {
    if (data.length === 0) return '';

    // 获取字段标签
    // 获取字段标签
    const fieldLabels = fieldOptions[exportType].filter(field => fields.includes(field.id)).map(field => field.label);

    // 创建表头行 - 确保用逗号分隔
    // 创建表头行 - 确保用逗号分隔
    const headers = fieldLabels.map(label => {
      // 处理包含逗号或引号的表头
      if (typeof label === 'string' && (label.includes(',') || label.includes('"'))) {
        return `"${label.replace(/"/g, '""')}"`;
      }
      return label;
    }).join(',');

    // 创建数据行 - 确保每行的字段用逗号分隔
    // 创建数据行 - 确保每行的字段用逗号分隔
    const rows = data.map(item => {
      return fields.map(field => {
        let value = item[field];

        // 处理空值
        // 处理空值
        if (value === null || value === undefined) {
          return '';
        }

        // 处理数组类型字段（如tags）
        // 处理数组类型字段（如tags）
        if (Array.isArray(value)) {
          value = value.join(';');
        }

        // 处理对象类型字段
        // 处理对象类型字段
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }

        // 转换为字符串
        // 转换为字符串
        value = String(value);

        // 处理包含逗号、引号或换行符的值
        // 处理包含逗号、引号或换行符的值
        if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','); // 关键：确保字段之间用逗号分隔
    });

    // 合并表头和数据行，用换行符分隔
    // 合并表头和数据行，用换行符分隔
    return [headers, ...rows].join('\n');
  };
  return <div className="min-h-screen p-6 bg-emerald-200">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Database className="w-8 h-8 mr-3 text-blue-600" />
            数据导出
          </h1>
          <p className="text-gray-600 mt-2">导出系统数据，支持多种格式和自定义字段</p>
          
          {/* 返回按钮 - 移到描述文字下方 */}
          <div className="mt-4">
            <Button variant="outline" onClick={() => $w.utils.navigateBack()} className="flex items-center space-x-2 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>返回管理页面</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧配置面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 导出类型选择 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  导出类型
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* 时间范围选择 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  时间范围
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择时间范围" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRangeOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* 导出格式 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">导出格式</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择导出格式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV 格式</SelectItem>
                    <SelectItem value="excel">Excel 格式</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* 右侧字段选择和预览 */}
          <div className="lg:col-span-2 space-y-6">
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
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-3 gap-3">
                    {fieldOptions[exportType].map(field => <div key={field.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                        <Checkbox id={field.id} checked={selectedFields.includes(field.id)} onCheckedChange={checked => handleFieldChange(field.id, checked)} />
                        <Label htmlFor={field.id} className="text-sm font-medium cursor-pointer flex-1">{field.label}</Label>
                      </div>)}
                  </div>
                </div>
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
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{
                    width: `${exportProgress}%`
                  }}>
                  </div>
                      </div>
                    </div>}
                  
                  {exportStatus === 'completed' && exportResult && <div className="text-center py-4">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                      <p className="text-green-600 font-medium">导出完成！</p>
                      <p className="text-sm text-gray-600 mt-1">
                        共导出 {exportResult.exportedRecords} 条记录
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        文件名: {exportResult.fileName}
                      </p>
                    </div>}
                  
                  {exportStatus === 'error' && exportResult && <div className="text-center py-4">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-600" />
                      <p className="text-red-600 font-medium">导出失败</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {exportResult.error}
                      </p>
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
      </div>
    </div>;
}