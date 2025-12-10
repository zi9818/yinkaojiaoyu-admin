// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Input, useToast, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { Eye, EyeOff, Lock, User, Shield, LogIn } from 'lucide-react';

export default function LoginPage(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const checkRef = useRef(false);
  const mountedRef = useRef(true);

  // 检查是否已登录 - 简化逻辑，避免循环跳转
  useEffect(() => {
    // 设置组件挂载状态
    mountedRef.current = true;

    // 防止重复执行
    if (checkRef.current) return;
    checkRef.current = true;
    const checkLoginStatus = async () => {
      try {
        // 只检查本地存储的登录状态，不触发跳转
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          // 验证用户数据完整性
          if (user && user.userId && user.username) {
            // 如果有有效的登录状态，直接跳转，不再检查云开发状态
            if (mountedRef.current) {
              $w.utils.navigateTo({
                pageId: 'admin',
                params: {}
              });
              return;
            }
          } else {
            // 清除无效的登录状态
            localStorage.removeItem('adminUser');
          }
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
        // 清除可能损坏的登录状态
        localStorage.removeItem('adminUser');
      } finally {
        // 检查组件是否仍挂载
        if (mountedRef.current) {
          setIsChecking(false);
        }
      }
    };

    // 立即执行检查，不延迟
    checkLoginStatus();

    // 清理函数，防止内存泄漏
    return () => {
      mountedRef.current = false;
    };
  }, []); // 空依赖数组，只执行一次

  // 如果正在检查登录状态，显示加载界面
  if (isChecking) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">正在检查登录状态...</p>
      </div>
    </div>;
  }

  // 处理登录
  const handleLogin = async e => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      toast({
        title: "验证失败",
        description: "请输入用户名和密码",
        variant: "destructive"
      });
      return;
    }

    // 检查组件是否已挂载
    if (!mountedRef.current) return;
    setLoading(true);
    try {
      // 查询管理员用户
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'admin_users',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          filter: {
            where: {
              $and: [{
                username: {
                  $eq: formData.username
                }
              }, {
                password: {
                  $eq: formData.password
                }
              }, {
                isActive: {
                  $eq: true
                }
              }]
            }
          },
          pageSize: 1
        }
      });

      // 检查组件是否已挂载
      if (!mountedRef.current) return;
      if (result.records && result.records.length > 0) {
        const user = result.records[0];

        // 更新最后登录时间 - 添加错误处理
        try {
          await $w.cloud.callDataSource({
            dataSourceName: 'admin_users',
            methodName: 'wedaUpdateV2',
            params: {
              filter: {
                where: {
                  $and: [{
                    _id: {
                      $eq: user._id
                    }
                  }]
                }
              },
              data: {
                lastLoginTime: new Date().toISOString()
              }
            }
          });
        } catch (updateError) {
          console.warn('更新登录时间失败:', updateError);
          // 不影响登录流程，继续执行
        }
        toast({
          title: "登录成功",
          description: `欢迎回来，${user.realName || user.username}！`
        });

        // 保存登录状态到本地存储
        localStorage.setItem('adminUser', JSON.stringify({
          userId: user._id,
          username: user.username,
          realName: user.realName,
          role: user.role,
          permissions: user.permissions || []
        }));

        // 延迟跳转，确保 toast 显示完成
        setTimeout(() => {
          // 检查组件是否已挂载
          if (mountedRef.current) {
            $w.utils.navigateTo({
              pageId: 'admin',
              params: {}
            });
          }
        }, 1000);
      } else {
        // 检查组件是否已挂载
        if (!mountedRef.current) return;
        toast({
          title: "登录失败",
          description: "用户名或密码错误，或账号已被禁用",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('登录失败:', error);

      // 检查组件是否已挂载
      if (!mountedRef.current) return;
      toast({
        title: "登录失败",
        description: error.message || "网络错误，请稍后重试",
        variant: "destructive"
      });
    } finally {
      // 检查组件是否已挂载
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // 处理输入变化 - 优化事件处理
  const handleInputChange = field => e => {
    if (!e || !e.target) {
      console.warn('Invalid event object in handleInputChange');
      return;
    }
    const value = e.target.value || '';

    // 检查组件是否已挂载
    if (!mountedRef.current) return;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理密码显示切换
  const handleTogglePassword = () => {
    // 检查组件是否已挂载
    if (!mountedRef.current) return;
    setShowPassword(prev => !prev);
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理后台</h1>
          <p className="text-gray-600">请登录您的管理员账号</p>
        </div>

        {/* 登录表单 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">管理员登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* 用户名输入 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">用户名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input type="text" placeholder="请输入用户名" value={formData.username} onChange={handleInputChange('username')} className="pl-10" disabled={loading} autoComplete="username" />
                </div>
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="请输入密码" value={formData.password} onChange={handleInputChange('password')} className="pl-10 pr-10" disabled={loading} autoComplete="current-password" />
                  <button type="button" onClick={handleTogglePassword} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none" tabIndex="-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 登录按钮 */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    登录中...
                  </div> : <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    登录
                  </div>}
              </Button>
            </form>

            {/* 提示信息 */}
            <Alert className="mt-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="text-sm">
                  <p className="font-medium mb-1">测试账号：</p>
                  <p>管理员：admin / admin123</p>
                  <p>运维：operator / op123</p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 管理后台系统. 保留所有权利.</p>
        </div>
      </div>
    </div>;
}