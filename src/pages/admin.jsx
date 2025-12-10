// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
// @ts-ignore;
import { Users, FileText, Database, TrendingUp, Calendar, DollarSign, Activity, ArrowRight, LogOut, User, Settings, BarChart3, Package, Download } from 'lucide-react';

export default function AdminDashboard(props) {
  const {
    $w
  } = props;
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalActivities: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取统计数据
  useEffect(() => {
    fetchStats();
    fetchRecentData();
  }, []);
  const fetchStats = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();

      // 获取用户总数
      const usersResult = await db.collection('users').count();
      const totalUsers = usersResult.total;

      // 获取订单总数和总收入
      const ordersResult = await db.collection('orders').get();
      const orders = ordersResult.data || [];
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0) / 100;

      // 获取活动总数
      const activitiesResult = await db.collection('activities').count();
      const totalActivities = activitiesResult.total;
      setStats({
        totalUsers,
        totalOrders,
        totalActivities,
        totalRevenue
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };
  const fetchRecentData = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();

      // 获取最近订单
      const recentOrdersResult = await db.collection('orders').orderBy('createdAt', 'desc').limit(5).get();
      setRecentOrders(recentOrdersResult.data || []);

      // 获取最近活动
      const recentActivitiesResult = await db.collection('activities').orderBy('createdAt', 'desc').limit(5).get();
      setRecentActivities(recentActivitiesResult.data || []);
    } catch (error) {
      console.error('获取最近数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  const formatAmount = amount => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount || 0);
  };
  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };
  const getStatusColor = status => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  const getStatusText = status => {
    const texts = {
      pending: '待支付',
      paid: '已支付',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消'
    };
    return texts[status] || status;
  };
  const getActiveStatusColor = isActive => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };
  const getActiveStatusText = isActive => {
    return isActive ? '已发布' : '未发布';
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
          <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
          <p className="text-gray-600 mt-2">欢迎使用活动管理系统</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">注册用户总数</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总订单数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">所有订单总数</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总活动数</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActivities}</div>
              <p className="text-xs text-muted-foreground">发布活动总数</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总收入</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">所有订单收入</p>
            </CardContent>
          </Card>
        </div>

        {/* 功能卡片 - 改为两列布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 第一行：活动管理 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => $w.utils.navigateTo({
          pageId: 'activity-management',
          params: {}
        })}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                活动管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">管理所有活动信息，包括创建、编辑、删除和发布活动</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-500">总活动数：</span>
                    <span className="font-semibold">{stats.totalActivities}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* 第一行：订单管理 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => $w.utils.navigateTo({
          pageId: 'order-management',
          params: {}
        })}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                订单管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">管理所有用户订单，包括查看、处理和状态更新</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-500">总订单数：</span>
                    <span className="font-semibold">{stats.totalOrders}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 第二行：数据导出 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 数据导出卡片 - 占据第二行左侧 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => $w.utils.navigateTo({
          pageId: 'data-export',
          params: {}
        })}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2 text-purple-600" />
                数据导出
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">导出系统数据，支持多种格式和自定义字段</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-500">支持格式：</span>
                    <span className="font-semibold">CSV, Excel</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* 第二行右侧占位卡片 - 可以添加其他功能或留空 */}
          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-400" />
                更多功能
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">更多管理功能即将推出...</p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  敬请期待
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近活动 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                最近活动
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 ? <p className="text-gray-500 text-center py-4">暂无活动</p> : recentActivities.map(activity => <div key={activity._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-500">{formatDate(activity.startTime)}</p>
                    </div>
                    <Badge className={getActiveStatusColor(activity.isActive)}>
                      {getActiveStatusText(activity.isActive)}
                    </Badge>
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {/* 最近订单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                最近订单
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? <p className="text-gray-500 text-center py-4">暂无订单</p> : recentOrders.map(order => <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{order.orderNo}</h4>
                      <p className="text-sm text-gray-500">{order.userName} - {formatAmount(order.totalAmount)}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}