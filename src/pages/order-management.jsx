// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui';
// @ts-ignore;
import { Search, Filter, ArrowLeft, Eye, Edit, Trash2, Calendar, DollarSign, User, Phone, Mail, MapPin, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Download, FileText } from 'lucide-react';

export default function OrderManagement(props) {
  const {
    $w
  } = props;
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  // 订单状态选项
  const statusOptions = [{
    value: 'all',
    label: '全部状态'
  }, {
    value: 'REGISTERED',
    label: '已报名'
  }, {
    value: 'PAID',
    label: '已支付'
  }, {
    value: 'CANCELLED',
    label: '已取消'
  }];

  // 获取订单数据
  useEffect(() => {
    fetchOrders();
  }, []);

  // 获取订单数据
  const fetchOrders = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();
      const result = await db.collection('orders').orderBy('createdAt', 'desc').get();
      const ordersData = result.data || [];
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error('获取订单数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索和筛选
  useEffect(() => {
    let filtered = orders;
    if (searchTerm) {
      filtered = filtered.filter(order => order.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) || order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || order.userPhone?.includes(searchTerm) || order.activityTitle?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  // 格式化金额
  const formatAmount = amount => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount || 0);
  };

  // 格式化日期
  const formatDate = dateString => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取状态颜色
  const getStatusColor = status => {
    const colors = {
      REGISTERED: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // 获取状态文本
  const getStatusText = status => {
    const texts = {
      REGISTERED: '已报名',
      PAID: '已支付',
      CANCELLED: '已取消'
    };
    return texts[status] || status;
  };

  // 查看订单详情
  const viewOrderDetail = order => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  // 编辑订单
  const editOrder = order => {
    setSelectedOrder(order);
    setEditForm({
      status: order.status,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod
    });
    setIsEditDialogOpen(true);
  };

  // 保存编辑
  const saveEdit = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();
      await db.collection('orders').doc(selectedOrder._id).update({
        status: editForm.status,
        totalAmount: editForm.totalAmount,
        paymentMethod: editForm.paymentMethod,
        updatedAt: new Date()
      });
      await fetchOrders();
      setIsEditDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('更新订单失败:', error);
    }
  };

  // 删除订单
  const deleteOrder = async orderId => {
    if (confirm('确定要删除这个订单吗？')) {
      try {
        const tcb = await $w.cloud.getCloudInstance();
        const db = tcb.database();
        await db.collection('orders').doc(orderId).remove();
        await fetchOrders();
      } catch (error) {
        console.error('删除订单失败:', error);
      }
    }
  };

  // 导出订单数据
  const exportOrders = async () => {
    setIsExporting(true);
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();
      const result = await db.collection('orders').get();
      const ordersData = result.data || [];

      // 生成CSV内容
      const headers = ['订单号', '用户姓名', '用户手机', '活动标题', '总金额', '状态', '支付方式', '创建时间'];
      const rows = ordersData.map(order => [order.orderNo || '', order.userName || '', order.userPhone || '', order.activityTitle || '', order.totalAmount || 0, getStatusText(order.status), order.paymentMethod || '', formatDate(order.createdAt)].join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');

      // 创建下载链接
      const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;'
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('导出订单失败:', error);
    } finally {
      setIsExporting(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">订单管理</h1>
          <p className="text-gray-600 mt-2">管理所有用户订单，包括查看、处理和状态更新</p>
          
          {/* 返回按钮 - 移到描述文字下方 */}
          <div className="mt-4">
            <Button variant="outline" onClick={() => $w.utils.navigateBack()} className="flex items-center space-x-2 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>返回管理后台</span>
            </Button>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="搜索订单号、用户姓名、手机号或活动标题..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={exportOrders} disabled={isExporting} variant="outline" className="flex items-center space-x-2">
              {isExporting ? <><RefreshCw className="w-4 h-4 animate-spin" />导出中...</> : <><Download className="w-4 h-4" />导出</>}
            </Button>
          </div>
        </div>

        {/* 订单列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">活动信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-300 mb-3" />
                        <p>暂无订单数据</p>
                      </div>
                    </td>
                  </tr> : filteredOrders.map(order => <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{order.userName}</div>
                        <div className="text-gray-500">{order.userPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{order.activityTitle}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatAmount(order.totalAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => viewOrderDetail(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => editOrder(order)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteOrder(order._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* 订单详情对话框 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>订单详情</DialogTitle>
            </DialogHeader>
            {selectedOrder && <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">订单号</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.orderNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">订单状态</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {getStatusText(selectedOrder.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">用户姓名</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.userName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">用户手机</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.userPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">活动标题</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.activityTitle}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">总金额</label>
                    <p className="mt-1 text-sm text-gray-900">{formatAmount(selectedOrder.totalAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">支付方式</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.paymentMethod || '未支付'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">创建时间</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
              </div>}
          </DialogContent>
        </Dialog>

        {/* 编辑订单对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>编辑订单</DialogTitle>
            </DialogHeader>
            {selectedOrder && <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">订单状态</label>
                  <Select value={editForm.status} onValueChange={value => setEditForm({
                ...editForm,
                status: value
              })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGISTERED">已报名</SelectItem>
                      <SelectItem value="PAID">已支付</SelectItem>
                      <SelectItem value="CANCELLED">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">总金额</label>
                  <Input type="number" value={editForm.totalAmount} onChange={e => setEditForm({
                ...editForm,
                totalAmount: parseFloat(e.target.value)
              })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">支付方式</label>
                  <Select value={editForm.paymentMethod} onValueChange={value => setEditForm({
                ...editForm,
                paymentMethod: value
              })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wechat">微信支付</SelectItem>
                      <SelectItem value="alipay">支付宝</SelectItem>
                      <SelectItem value="cash">现金</SelectItem>
                      <SelectItem value="bank">银行转账</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={saveEdit}>
                    保存
                  </Button>
                </div>
              </div>}
          </DialogContent>
        </Dialog>
      </div>
    </div>;
}