// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Activity } from 'lucide-react';
// @ts-ignore;
import { Button } from '@/components/ui';

// @ts-ignore;
import { ActivityCard } from '@/components/ActivityCard';
export function ActivityList({
  activities,
  loading,
  onEdit,
  onDelete,
  onView,
  onTogglePublish,
  getStatusDisplay,
  getStatusColor,
  formatDateTime,
  formatPrice,
  onLoadMore,
  hasMore
}) {
  return <div>
      {loading && activities.length === 0 ? <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div> : activities.length === 0 ? <div className="text-center py-12">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无活动</h3>
          <p className="mt-1 text-sm text-gray-500">
            开始创建您的第一个活动吧
          </p>
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map(activity => <ActivityCard key={activity._id} activity={activity} onEdit={onEdit} onDelete={onDelete} onView={onView} onTogglePublish={onTogglePublish} getStatusDisplay={getStatusDisplay} getStatusColor={getStatusColor} formatDateTime={formatDateTime} formatPrice={formatPrice} />)}
        </div>}

      {/* 加载更多按钮 */}
      {!loading && hasMore && activities.length > 0 && <div className="flex justify-center mt-8">
          <Button onClick={onLoadMore} variant="outline">
            加载更多
          </Button>
        </div>}

      {/* 加载中状态 */}
      {loading && activities.length > 0 && <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>}
    </div>;
}