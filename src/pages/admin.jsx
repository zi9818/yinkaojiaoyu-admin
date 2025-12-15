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
      REGISTERED: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  const getStatusText = status => {
    const texts = {
      REGISTERED: '已报名',
      PAID: '已支付',
      CANCELLED: '已取消'
    };
    return texts[status] || status;
  };
  const getActiveStatusColor = isActive => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };
  const getActiveStatusText = isActive => {
    return isActive ? '已发布' : '未发布';
  };
  const handleLogout = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb?.auth?.();
      if (auth?.signOut) {
        await auth.signOut();
      }
    } catch (error) {
      console.warn('退出登录失败:', error);
    }
    $w.utils.navigateTo({
      pageId: 'admin',
      params: {}
    });
  };
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
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">运营数据总览</p>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white">
                <BarChart3 className="w-5 h-5" />
              </span>
              <span>管理后台</span>
            </h1>
            <p className="text-gray-600 mt-2">欢迎使用活动管理系统</p>
          </div>
          <Button variant="outline" className="self-start md:self-auto flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-sky-50 border border-sky-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">注册用户总数</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border border-emerald-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总订单数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">所有订单总数</p>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50 border border-indigo-100 shadow-sm">
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

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 活动管理 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100" onClick={() => $w.utils.navigateTo({
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

          {/* 订单管理 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100" onClick={() => $w.utils.navigateTo({
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

          {/* 数据导出 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-r from-indigo-50 to-purple-50 border border-purple-100" onClick={() => $w.utils.navigateTo({
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
                      <h4 className="font-medium text-gray-900">{order.activityTitle}</h4>
                      <p className="text-sm text-gray-500">{order.userName} - {formatAmount(order.amount / 100)}</p>
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