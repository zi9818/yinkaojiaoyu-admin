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

  const NAV_TARGET_KEY = '__yinkaojiaoyu_admin_nav_target__';

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalKnown, setTotalKnown] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [pageInput, setPageInput] = useState('');
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
        fetchOrders(1, pageSize);
        consumeNavTarget();
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

  const escapeRegExp = (str) => {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const buildWhere = (db) => {
    const cmd = db.command;
    const whereList = [];
    let searchApplied = false;
    if (statusFilter && statusFilter !== 'all') {
      try {
        whereList.push({ status: cmd.eq(statusFilter) });
      } catch (e) {
        whereList.push({ status: statusFilter });
      }
    }

    const q = String(searchTerm || '').trim();
    if (q) {
      let reg = null;
      try {
        if (db?.RegExp) {
          reg = db.RegExp({
            regexp: escapeRegExp(q),
            options: 'i'
          });
        }
      } catch (e) {
        reg = null;
      }

      if (reg && cmd?.or) {
        try {
          whereList.push(cmd.or([
            { userName: reg },
            { userPhone: reg },
            { activityTitle: reg }
          ]));
          searchApplied = true;
        } catch (e) {}
      }
    }

    if (whereList.length === 0) return { whereObj: null, searchApplied };
    if (whereList.length === 1) return { whereObj: whereList[0], searchApplied };
    if (cmd?.and) {
      try {
        return { whereObj: cmd.and(whereList), searchApplied };
      } catch (e) {
        // 兜底：至少保证状态筛选可用
        const statusOnly = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : null;
        return { whereObj: statusOnly, searchApplied: false };
      }
    }
    // 兜底：至少保证状态筛选可用
    const statusOnly = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : null;
    return { whereObj: statusOnly, searchApplied: false };
  };

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
      if (!target || target.type !== 'order' || !target.orderId) return;
      try {
        window.sessionStorage.removeItem(NAV_TARGET_KEY);
      } catch (e) {}

      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();
      let order = null;
      try {
        const res = await db.collection('orders').doc(target.orderId).get();
        order = res?.data || null;
      } catch (e) {
        order = null;
      }
      if (!order) return;
      setSelectedOrder(order);
      setIsDetailDialogOpen(true);
      setSearchTerm('');
      setStatusFilter('all');
      setPage(1);
    } catch (e) {}
  };

  // 获取订单数据
  const fetchOrders = async (pageOverride, pageSizeOverride) => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();
      const nextPage = typeof pageOverride === 'number' && pageOverride > 0 ? pageOverride : page;
      const nextPageSize = typeof pageSizeOverride === 'number' && pageSizeOverride > 0 ? pageSizeOverride : pageSize;

      const whereBuild = buildWhere(db) || { whereObj: null, searchApplied: false };
      const whereObj = whereBuild.whereObj;
      const searchApplied = Boolean(whereBuild.searchApplied);

      let nextTotalKnown = true;
      let nextTotal = 0;
      try {
        let countQuery = db.collection('orders');
        try {
          if (whereObj && countQuery?.where) {
            countQuery = countQuery.where(whereObj);
          }
        } catch (e) {}
        if (countQuery?.count) {
          const countRes = await countQuery.count();
          nextTotal = typeof countRes?.total === 'number' ? countRes.total : 0;
        } else {
          nextTotalKnown = false;
          nextTotal = 0;
        }
      } catch (e) {
        nextTotalKnown = false;
        nextTotal = 0;
      }

      // 如果搜索条件没有真正下发服务端，则 total 无法可信
      if (String(searchTerm || '').trim() && !searchApplied) {
        nextTotalKnown = false;
        nextTotal = 0;
      }

      let query = db.collection('orders');
      try {
        if (whereObj && query?.where) {
          query = query.where(whereObj);
        }
      } catch (e) {}
      try {
        if (query?.orderBy) {
          query = query.orderBy('createdAt', 'desc');
        }
      } catch (e) {}
      const offset = (nextPage - 1) * nextPageSize;
      try {
        if (query?.skip) {
          query = query.skip(offset);
        }
      } catch (e) {}
      try {
        if (query?.limit) {
          query = query.limit(nextPageSize);
        }
      } catch (e) {}

      const result = await query.get();
      let ordersData = result.data || [];

      // 搜索兜底：当环境不支持 RegExp/or 时，只能在当前页做前端过滤
      const q = String(searchTerm || '').trim();
      if (q && !searchApplied) {
        const lowered = q.toLowerCase();
        ordersData = ordersData.filter(order => order.userName?.toLowerCase().includes(lowered) || order.userPhone?.includes(q) || order.activityTitle?.toLowerCase().includes(lowered));
      }

      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setTotal(nextTotal);
      setTotalKnown(nextTotalKnown);
      setHasMore(nextTotalKnown ? nextPage * nextPageSize < nextTotal : (result.data || []).length === nextPageSize);
      setPage(nextPage);
      setPageSize(nextPageSize);
    } catch (error) {
      console.error('获取订单数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索/筛选变化时，回到第一页并重新请求
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      if (!authChecked || forbidden) return;
      setLoading(true);
      fetchOrders(1, pageSize);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, statusFilter, pageSize, authChecked, forbidden]);

  // 导出订单数据
  const exportOrders = async () => {
    setIsExporting(true);
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();
      const whereBuild = buildWhere(db) || { whereObj: null, searchApplied: false };
      const whereObj = whereBuild.whereObj;
      const searchApplied = Boolean(whereBuild.searchApplied);

      const batchSize = 500;
      let ordersData = [];
      let offset = 0;
      let safety = 0;
      while (safety < 2000) {
        safety += 1;
        let q = db.collection('orders');
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
        ordersData.push(...part);
        if (part.length < batchSize) {
          break;
        }
        offset += batchSize;
      }

      // 搜索兜底：当环境不支持 RegExp/or 时，这里只能做前端过滤
      const qStr = String(searchTerm || '').trim();
      if (qStr && !searchApplied) {
        const lowered = qStr.toLowerCase();
        ordersData = ordersData.filter(order => order.userName?.toLowerCase().includes(lowered) || order.userPhone?.includes(qStr) || order.activityTitle?.toLowerCase().includes(lowered));
      }

      const headers = ['用户姓名', '用户手机', '活动标题', '总金额（元）', '状态', '创建时间'];
      const rows = ordersData.map(order => ([
        order.userName || '',
        order.userPhone || '',
        order.activityTitle || '',
        ((order.amount || 0) / 100).toFixed(2),
        getStatusText(order.status),
        formatDate(order.createdAt)
      ]));

      let blob;
      let fileExt;
      let mimeType;
      if (exportFormat === 'excel') {
        const table = [
          '<table border="1">',
          '<thead><tr>',
          ...headers.map(h => `<th>${htmlEscape(h)}</th>`),
          '</tr></thead>',
          '<tbody>',
          ...rows.map(row => `<tr>${row.map(cell => `<td>${htmlEscape(cell)}</td>`).join('')}</tr>`),
          '</tbody>',
          '</table>'
        ].join('');
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${table}</body></html>`;
        fileExt = 'xls';
        mimeType = 'application/vnd.ms-excel;charset=utf-8;';
        blob = new Blob([html], {
          type: mimeType
        });
      } else {
        const csvRows = rows.map(row => row.map(csvEscape).join(','));
        const csvContent = [headers.map(csvEscape).join(','), ...csvRows].join('\n');
        fileExt = 'csv';
        mimeType = 'text/csv;charset=utf-8;';
        blob = new Blob(['\ufeff' + csvContent], {
          type: mimeType
        });
      }

      // 创建下载链接
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.${fileExt}`);
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
            <select
              className="w-32 h-10 px-3 rounded-md border border-blue-100 bg-white/80"
              value={exportFormat}
              onChange={(e) => {
              const value = e.target.value;
              setExportFormat(value);
            }}
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
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

        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <div className="text-sm text-gray-600">
            {totalKnown ? `共 ${total} 条，${Math.max(1, page)} / ${Math.max(1, Math.ceil((total || 0) / pageSize))} 页` : `第 ${Math.max(1, page)} 页`}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">每页</span>
              <select
                className="border rounded px-2 py-1 text-sm bg-white"
                value={String(pageSize)}
                onChange={(e) => {
                  const value = e.target.value;
                  const next = Number(value);
                  if (Number.isFinite(next) && next > 0) {
                    setPageSize(next);
                    setPage(1);
                  }
                }}
                disabled={loading}
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
              disabled={loading || page <= 1}
              onClick={() => {
                const next = Math.max(1, page - 1);
                setLoading(true);
                fetchOrders(next, pageSize);
              }}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              disabled={loading || (totalKnown ? page >= Math.max(1, Math.ceil((total || 0) / pageSize)) : !hasMore)}
              onClick={() => {
                const next = totalKnown ? Math.min(Math.max(1, Math.ceil((total || 0) / pageSize)), page + 1) : page + 1;
                setLoading(true);
                fetchOrders(next, pageSize);
              }}
            >
              下一页
            </Button>

            <div className="flex items-center gap-2">
              <Input
                className="w-24"
                type="number"
                min={1}
                placeholder="跳转页"
                value={pageInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setPageInput(value);
                }}
                disabled={loading}
              />
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => {
                  const raw = String(pageInput || '').trim();
                  const next = Number(raw);
                  if (!Number.isFinite(next) || next < 1) return;
                  const maxPage = totalKnown ? Math.max(1, Math.ceil((total || 0) / pageSize)) : next;
                  const safeNext = totalKnown ? Math.min(maxPage, Math.max(1, next)) : Math.max(1, next);
                  setLoading(true);
                  fetchOrders(safeNext, pageSize);
                }}
              >
                跳转
              </Button>
            </div>
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