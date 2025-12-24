// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Badge } from '@/components/ui';
// @ts-ignore;
import { MapPin, Calendar, Users, Clock, Eye, Image as ImageIcon, Tag, DollarSign, Phone } from 'lucide-react';

export function ActivityDetailDialog({
  open,
  onOpenChange,
  activity,
  onEdit,
  onTogglePublish,
  getStatusDisplay,
  getStatusColor,
  formatDateTime,
  formatPrice
}) {
  if (!activity) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{activity.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">状态</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(activity.isActive)}>
                    {getStatusDisplay(activity.isActive)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">价格</label>
                <div className="mt-1 font-medium text-gray-900">
                  {formatPrice(activity.price)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">联系电话</label>
                <div className="mt-1 text-gray-900">{activity.callNumber || '-'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">开始时间</label>
                <div className="mt-1 text-gray-900">{formatDateTime(activity.startTime)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">结束时间</label>
                <div className="mt-1 text-gray-900">{formatDateTime(activity.endTime)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">最大参与人数</label>
                <div className="mt-1 text-gray-900">{activity.maxParticipants || '不限'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">创建时间</label>
                <div className="mt-1 text-gray-900">{formatDateTime(activity.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* 活动描述 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">活动描述</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{activity.desc}</p>
          </div>

          {/* 活动地址 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              活动地址
            </h3>
            <p className="text-gray-700">{activity.address}</p>
          </div>

          {/* 客户号码 */}
          {activity.customerNumbers && activity.customerNumbers.length > 0 && <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                客户号码
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {activity.customerNumbers.map((phone, index) => <div key={index} className="flex items-center space-x-2 text-sm text-gray-700 bg-white px-3 py-2 rounded border border-gray-200">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{phone}</span>
                    </div>)}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  共 {activity.customerNumbers.length} 个客户号码
                </div>
              </div>
            </div>}

          {/* 活动标签 */}
          {activity.tags && activity.tags.length > 0 && <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                活动标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {activity.tags.map((tag, index) => <Badge key={index} variant="outline">
                    {tag}
                  </Badge>)}
              </div>
            </div>}

          {/* 轮播图 */}
          {activity.bannerImages && activity.bannerImages.length > 0 && <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                轮播图
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {activity.bannerImages.map((img, index) => <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img src={img} alt={`轮播图 ${index + 1}`} className="w-full h-full object-cover" />
                  </div>)}
              </div>
            </div>}

          {/* 详情图 */}
          {activity.detailImages && activity.detailImages.length > 0 && <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                详情图
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {activity.detailImages.map((img, index) => <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img src={img} alt={`详情图 ${index + 1}`} className="w-full h-full object-cover" />
                  </div>)}
              </div>
            </div>}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={() => {
          onEdit(activity);
          onOpenChange(false);
        }}>
            编辑
          </Button>
          <Button variant={activity.isActive ? "destructive" : "default"} onClick={() => {
          onTogglePublish(activity);
          onOpenChange(false);
        }}>
            {activity.isActive ? '下架' : '发布'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}