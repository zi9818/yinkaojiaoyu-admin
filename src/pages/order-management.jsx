// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';
// @ts-ignore;
import { Search, Filter, ArrowLeft, Eye, Edit, Trash2, Calendar, DollarSign, User, Phone, Mail, MapPin, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Download, FileText } from 'lucide-react';
import { ensureAdminAccess, getAuthSingleton } from './auth-guard';

function InlineModal({
  open,
  onOpenChange,
  className,
  children
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (onOpenChange) onOpenChange(false);
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full mx-4 bg-white rounded-lg shadow-lg ${className || ''}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          onClick={() => {
            if (onOpenChange) onOpenChange(false);
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

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
  const [authChecked, setAuthChecked] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [currentUid, setCurrentUid] = useState('');

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
        fetchOrders();
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
      filtered = filtered.filter(order => order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || order.userPhone?.includes(searchTerm) || order.activityTitle?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  // 格式化金额（分转元）
  const formatAmount = amount => {
    const amountInYuan = (amount || 0) / 100;
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amountInYuan);
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

  const csvEscape = value => {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
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
      amount: order.amount ? (order.amount / 100).toString() : '0' // 分转元显示
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
        amount: Math.round((parseFloat(editForm.amount) || 0) * 100), // 元转分存储
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
      const headers = ['用户姓名', '用户手机', '活动标题', '总金额（元）', '状态', '创建时间'];
      const rows = ordersData.map(order => {
        const row = [
          order.userName || '',
          order.userPhone || '',
          order.activityTitle || '',
          ((order.amount || 0) / 100).toFixed(2),
          getStatusText(order.status),
          formatDate(order.createdAt)
        ];
        return row.map(csvEscape).join(',');
      });
      const csvContent = [headers.map(csvEscape).join(','), ...rows].join('\n');

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
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      } catch (e) {}
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    } catch (error) {
      console.error('导出订单失败:', error);
    } finally {
      setIsExporting(false);
    }
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
            <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">退出登录</Button>
          </div>
        </div>
      </div>;
  }

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>;
  }

  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">订单管理</h1>
          <p className="text-gray-600 mt-2">管理所有用户订单，包括查看、处理和状态更新</p>
          
          {/* 返回按钮 - 移到描述文字下方 */}
          <div className="mt-4">
            <Button variant="outline" onClick={() => $w.utils.navigateBack()} className="flex items-center space-x-2 border-blue-200 text-blue-700 bg-white/70 hover:bg-blue-50 transition-colors">
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
              <Input placeholder="搜索用户姓名、手机号或活动标题..." value={searchTerm} onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
            }} className="pl-10" />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="w-48 h-10 px-3 rounded-md border border-blue-100 bg-white/80"
              value={statusFilter}
              onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value);
            }}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Button onClick={exportOrders} disabled={isExporting} className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-70">
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
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-300 mb-3" />
                        <p>暂无订单数据</p>
                      </div>
                    </td>
                  </tr> : filteredOrders.map(order => <tr key={order._id} className="hover:bg-gray-50">
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
                      <div className="text-sm font-medium text-gray-900">{formatAmount(order.amount)}</div>
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
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* 订单详情弹窗 */}
        <InlineModal open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen} className="max-w-2xl">
          <div className="p-6">
            <div className="text-lg font-semibold">订单详情</div>
            {selectedOrder && <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">订单状态</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusText(selectedOrder.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">总金额</label>
                  <p className="mt-1 text-sm text-gray-900">{formatAmount(selectedOrder.amount)}</p>
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
                  <label className="text-sm font-medium text-gray-500">创建时间</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
            </div>}
          </div>
        </InlineModal>

        {/* 编辑订单弹窗 */}
        <InlineModal open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} className="max-w-md">
          <div className="p-6">
            <div className="text-lg font-semibold">编辑订单</div>
            {selectedOrder && <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700">订单状态</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white"
                  value={editForm.status}
                  onChange={(e) => {
                  const value = e.target.value;
                  setEditForm({
                    ...editForm,
                    status: value
                  });
                }}
                >
                  <option value="REGISTERED">已报名</option>
                  <option value="PAID">已支付</option>
                  <option value="CANCELLED">已取消</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">金额（元）</label>
                <Input type="number" value={editForm.amount} onChange={(e) => {
                const value = e.target.value;
                setEditForm({
                  ...editForm,
                  amount: value
                });
              }} step="0.01" min="0" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={saveEdit}>
                  保存
                </Button>
              </div>
            </div>}
          </div>
        </InlineModal>
      </div>
    </div>;
}