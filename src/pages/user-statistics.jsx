// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// @ts-ignore;
import { Users, TrendingUp, Calendar, ArrowLeft, BarChart3, UserPlus, Activity, DollarSign } from 'lucide-react';

// @ts-ignore;
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
export default function UserStatisticsPage(props) {
  const {
    $w
  } = props;
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    newUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    userGrowth: [],
    userDistribution: [],
    recentActivity: []
  });

  // 加载统计数据
  const loadStatistics = async () => {
    setLoading(true);
    try {
      // 获取用户数据
      const usersResult = await $w.cloud.callDataSource({
        dataSourceName: 'users',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          pageSize: 1000
        }
      });
      const users = usersResult.records || [];

      // 获取订单数据用于计算收入
      const ordersResult = await $w.cloud.callDataSource({
        dataSourceName: 'orders',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          pageSize: 1000
        }
      });
      const orders = ordersResult.records || [];

      // 计算统计数据
      const totalUsers = users.length;
      const now = new Date();
      const daysAgo = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 365;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const newUsers = users.filter(user => new Date(user.createdAt) > cutoffDate).length;
      const activeUsers = users.filter(user => user.lastLoginTime && new Date(user.lastLoginTime) > cutoffDate).length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

      // 生成用户增长数据（模拟数据）
      const userGrowth = [];
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric'
        });
        userGrowth.push({
          date: dateStr,
          newUsers: Math.floor(Math.random() * 20) + 5,
          totalUsers: Math.floor(Math.random() * 100) + 200
        });
      }

      // 生成用户分布数据（模拟数据）
      const userDistribution = [{
        name: '新用户',
        value: newUsers,
        color: '#10b981'
      }, {
        name: '活跃用户',
        value: activeUsers,
        color: '#3b82f6'
      }, {
        name: '沉默用户',
        value: totalUsers - activeUsers,
        color: '#6b7280'
      }];

      // 生成最近活动数据（模拟数据）
      const recentActivity = users.slice(0, 5).map(user => ({
        id: user._id,
        name: user.name || '未知用户',
        action: Math.random() > 0.5 ? '注册' : '登录',
        time: new Date(user.createdAt || Date.now()).toLocaleString('zh-CN')
      }));
      setStatistics({
        totalUsers,
        newUsers,
        activeUsers,
        totalRevenue,
        userGrowth,
        userDistribution,
        recentActivity
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  // 格式化金额
  const formatAmount = amount => {
    return `¥${amount.toLocaleString('zh-CN', {
      minimumFractionDigits: 2
    })}`;
  };
  return <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* 返回按钮 */}
              <Button variant="outline" onClick={() => $w.utils.navigateTo({
              pageId: 'admin',
              params: {}
            })} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <div className="p-2 bg-purple-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">用户统计</h1>
                <p className="text-gray-600">查看用户增长和活动统计</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">最近7天</SelectItem>
                  <SelectItem value="30days">最近30天</SelectItem>
                  <SelectItem value="90days">最近90天</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mr-4"></div>
            <span className="text-gray-600">加载中...</span>
          </div> : <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">总用户数</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.totalUsers}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">新增用户</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.newUsers}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <UserPlus className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">活跃用户</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.activeUsers}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">总收入</p>
                      <p className="text-2xl font-bold text-gray-900">{formatAmount(statistics.totalRevenue)}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 用户增长趋势 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    用户增长趋势
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={statistics.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={2} name="新增用户" />
                      <Line type="monotone" dataKey="totalUsers" stroke="#3b82f6" strokeWidth={2} name="总用户数" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 用户分布 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    用户分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={statistics.userDistribution} cx="50%" cy="50%" labelLine={false} label={({
                    name,
                    percent
                  }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {statistics.userDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* 最近活动 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  最近活动
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.recentActivity.map((activity, index) => <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.name}</p>
                          <p className="text-sm text-gray-600">{activity.action}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </div>}
      </div>
    </div>;
}