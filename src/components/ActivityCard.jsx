// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, Button, Badge } from '@/components/ui';
// @ts-ignore;
import { Edit, Trash2, Eye, Calendar, MapPin, Users, Clock, ToggleLeft, ToggleRight, Phone } from 'lucide-react';

export function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onView,
  onTogglePublish,
  getStatusDisplay,
  getStatusColor,
  formatDateTime,
  formatPrice
}) {
  // 获取云存储文件的临时访问链接
  const getTempFileURL = async fileID => {
    try {
      const tcb = await window.$w?.cloud?.getCloudInstance();
      if (!tcb) {
        return fileID; // 如果无法获取云实例，直接返回fileID
      }
      const result = await tcb.getTempFileURL({
        fileList: [fileID]
      });
      if (result.fileList && result.fileList.length > 0) {
        return result.fileList[0].tempFileURL;
      }
      return fileID;
    } catch (error) {
      console.error('获取临时链接失败:', error);
      return fileID;
    }
  };

  // 渲染图片组件，支持云存储fileID
  // 渲染图片组件，支持云存储fileID
  const renderImage = (src, alt, className) => {
    // 如果是云存储的fileID格式，尝试获取临时链接
    if (src && typeof src === 'string' && (src.includes('cloud://') || src.includes('tcb://'))) {
      // 使用state来存储临时链接，避免重复请求
      const [tempUrl, setTempUrl] = React.useState(src);
      React.useEffect(() => {
        getTempFileURL(src).then(url => {
          if (url !== src) {
            setTempUrl(url);
          }
        });
      }, [src]);
      return <img src={tempUrl} alt={alt} className={className} onError={e => {
        console.error('图片加载失败:', src);
        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzUgNzVIMTY1VjEyNUgxMzVWNzVaIiBmaWxsPSIjRDFEREIiLz4KPHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMjAiIHk9IjcwIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRDFEREIiLz4KPHBhdGggZD0iTTE4IDMwSDQyVjQySDE4VjMwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=';
      }} />;
    }

    // 普通URL或base64图片
    // 普通URL或base64图片
    return <img src={src} alt={alt} className={className} onError={e => {
      console.error('图片加载失败:', src);
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzUgNzVIMTY1VjEyNUgxMzVWNzVaIiBmaWxsPSIjRDFEREIiLz4KPHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMjAiIHk9IjcwIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRDFEREIiLz4KPHBhdGggZD0iTTE4IDMwSDQyVjQySDE4VjMwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=';
    }} />;
  };
  return <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* 活动图片 */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {activity.bannerImages && activity.bannerImages.length > 0 ? renderImage(activity.bannerImages[0], activity.title, "w-full h-full object-cover") : <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>}
        
        {/* 发布状态标签 */}
        <div className="absolute top-2 right-2">
          <Badge variant={getStatusColor(activity.isActive)} className="bg-white/90 backdrop-blur-sm text-black">
            {getStatusDisplay(activity.isActive)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* 活动标题 */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {activity.title}
        </h3>

        {/* 活动副标题 */}
        {activity.subtitle && <p className="text-sm text-gray-600 mb-3 line-clamp-1">
            {activity.subtitle}
          </p>}

        {/* 活动描述 */}
        {activity.desc && <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {activity.desc}
          </p>}

        {/* 活动信息 */}
        <div className="space-y-2 mb-4">
          {/* 价格 */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(activity.price)}
            </span>
            {activity.maxParticipants > 0 && <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                限{activity.maxParticipants}人
              </div>}
          </div>

          {/* 时间 */}
          {activity.startTime && <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="line-clamp-1">
                {formatDateTime(activity.startTime)}
              </span>
            </div>}

          {/* 地址 */}
          {activity.address && <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="line-clamp-1">
                {activity.address}
              </span>
            </div>}

          {/* 客户号码 */}
          {activity.customerNumbers && activity.customerNumbers.length > 0 && <div className="flex items-center text-sm text-gray-500">
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="line-clamp-1">
                {activity.customerNumbers.length} 个客户号码
              </span>
            </div>}
        </div>

        {/* 标签 */}
        {activity.tags && activity.tags.length > 0 && <div className="flex flex-wrap gap-1 mb-4">
            {activity.tags.slice(0, 3).map((tag, index) => <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>)}
            {activity.tags.length > 3 && <Badge variant="secondary" className="text-xs">
                +{activity.tags.length - 3}
              </Badge>}
          </div>}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onView(activity)} className="flex-1">
            <Eye className="w-4 h-4 mr-1" />
            查看
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(activity)} className="flex-1">
            <Edit className="w-4 h-4 mr-1" />
            编辑
          </Button>
          <Button size="sm" variant="outline" onClick={() => onTogglePublish(activity)} className={`flex-1 ${activity.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`}>
            {activity.isActive ? <ToggleLeft className="w-4 h-4 mr-1" /> : <ToggleRight className="w-4 h-4 mr-1" />}
            {activity.isActive ? '下架' : '发布'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(activity)} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>;
}