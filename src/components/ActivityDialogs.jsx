// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Badge } from '@/components/ui';
// @ts-ignore;
import { MapPin, Tag, ImageIcon, Phone } from 'lucide-react';
// @ts-ignore;
import { RichTextContent } from '@/components/RichTextContent';

// @ts-ignore;
import { ActivityForm } from './ActivityForm';

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

export function ActivityDialogs({
  showCreateDialog,
  setShowCreateDialog,
  showEditDialog,
  setShowEditDialog,
  showDetailDialog,
  setShowDetailDialog,
  selectedActivity,
  formData,
  setFormData,
  onCreateActivity,
  onUpdateActivity,
  onEdit,
  onTogglePublish,
  getStatusDisplay,
  getStatusColor,
  formatDateTime,
  formatPrice,
  handleBannerImageUpload,
  handleRemoveBannerImage,
  handleDetailImageUpload,
  handleRemoveDetailImage,
  handleAddTag,
  handleRemoveTag
}) {
  const normalizeContacts = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => ({
          name: typeof item?.name === 'string' ? item.name : '',
          phone: typeof item?.phone === 'string' ? item.phone : ''
        }))
        .map((item) => ({
          name: (item.name || '').trim(),
          phone: String(item.phone || '').replace(/\D/g, '').slice(0, 11)
        }))
        .filter((c) => c.name || c.phone);
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const digits = String(value).replace(/\D/g, '').slice(0, 11);
      return digits ? [{ name: '', phone: digits }] : [];
    }
    return [];
  };

  const contactText = (() => {
    const list = normalizeContacts(selectedActivity?.callNumber);
    const normalized = list
      .filter((c) => c && c.phone)
      .map((c) => (c.name ? `${c.name} ${c.phone}` : c.phone));
    return normalized.join('，');
  })();

  const normalizePhoneList = (value) => {
    if (Array.isArray(value)) {
      return value
        .filter(v => typeof v === 'string')
        .map(v => v.trim())
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(/[\n,，、\s]+/)
        .map(v => (v || '').trim())
        .filter(Boolean);
    }
    return [];
  };

  const customerNumbersList = normalizePhoneList(selectedActivity?.customerNumbers);

  // 处理表单提交
  const handleCreateSubmit = () => {
    onCreateActivity();
  };
  const handleUpdateSubmit = () => {
    onUpdateActivity();
  };
  return <>
    {/* 创建活动对话框 */}
    <InlineModal open={showCreateDialog} onOpenChange={setShowCreateDialog} className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="text-2xl font-bold">创建新活动</div>

        <ActivityForm formData={formData} setFormData={setFormData} onBannerImageUpload={handleBannerImageUpload} onRemoveBannerImage={handleRemoveBannerImage} onDetailImageUpload={handleDetailImageUpload} onRemoveDetailImage={handleRemoveDetailImage} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} isEdit={false} />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" size="lg" onClick={() => setShowCreateDialog(false)}>
            取消
          </Button>
          <Button size="lg" onClick={handleCreateSubmit}>
            创建活动
          </Button>
        </div>
      </div>
    </InlineModal>

    {/* 编辑活动对话框 */}
    <InlineModal open={showEditDialog} onOpenChange={setShowEditDialog} className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="text-2xl font-bold">编辑活动</div>

        <ActivityForm formData={formData} setFormData={setFormData} onBannerImageUpload={handleBannerImageUpload} onRemoveBannerImage={handleRemoveBannerImage} onDetailImageUpload={handleDetailImageUpload} onRemoveDetailImage={handleRemoveDetailImage} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} isEdit={true} />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button size="lg" onClick={handleUpdateSubmit}>
            更新活动
          </Button>
          <Button variant="outline" size="lg" onClick={() => setShowEditDialog(false)}>
            取消
          </Button>
        </div>
      </div>
    </InlineModal>

    {/* 活动详情对话框 */}
    <InlineModal open={showDetailDialog} onOpenChange={setShowDetailDialog} className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="text-2xl font-bold">{selectedActivity?.title}</div>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">基本信息</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">状态</label>
                <div className="mt-1">
                  <Badge variant={getStatusColor(selectedActivity?.isActive)}>
                    {getStatusDisplay(selectedActivity?.isActive)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">价格（元）</label>
                <div className="mt-1 font-medium text-gray-900">
                  {formatPrice(selectedActivity?.price)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">联系电话</label>
                <div className="mt-1 text-gray-900 whitespace-pre-wrap">{contactText || '-'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">开始时间</label>
                <div className="mt-1 text-gray-900">{formatDateTime(selectedActivity?.startTime)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">结束时间</label>
                <div className="mt-1 text-gray-900">{formatDateTime(selectedActivity?.endTime)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">最大参与人数</label>
                <div className="mt-1 text-gray-900">{selectedActivity?.maxParticipants || '不限'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">创建时间</label>
                <div className="mt-1 text-gray-900">{formatDateTime(selectedActivity?.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* 活动描述 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">活动描述</h3>
            <RichTextContent html={selectedActivity?.descRich} fallbackText={selectedActivity?.desc} />
          </div>

          {/* 活动地址 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              活动地址
            </h3>
            <p className="text-gray-700">{selectedActivity?.address}</p>
          </div>

          {/* 客户号码 */}
          {customerNumbersList.length > 0 && <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              客户号码
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {customerNumbersList.map((phone, index) => <div key={index} className="flex items-center space-x-2 text-sm text-gray-700 bg-white px-3 py-2 rounded border border-gray-200">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span>{phone}</span>
                </div>)}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                共 {customerNumbersList.length} 个客户号码
              </div>
            </div>
          </div>}

          {/* 活动标签 */}
          {selectedActivity?.tags && selectedActivity.tags.length > 0 && <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              活动标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedActivity.tags.map((tag, index) => <Badge key={index} variant="outline">
                {tag}
              </Badge>)}
            </div>
          </div>}

          {/* 轮播图 */}
          {selectedActivity?.bannerImages && selectedActivity.bannerImages.length > 0 && <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" />
              轮播图
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {selectedActivity.bannerImages.map((img, index) => <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img src={img} alt={`轮播图 ${index + 1}`} className="w-full h-full object-cover" />
              </div>)}
            </div>
          </div>}

          {/* 详情图 */}
          {selectedActivity?.detailImages && selectedActivity.detailImages.length > 0 && <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" />
              详情图
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {selectedActivity.detailImages.map((img, index) => <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img src={img} alt={`详情图 ${index + 1}`} className="w-full h-full object-cover" />
              </div>)}
            </div>
          </div>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" size="lg" onClick={() => setShowDetailDialog(false)}>
            关闭
          </Button>
          <Button size="lg" onClick={() => {
            onEdit(selectedActivity);
            setShowDetailDialog(false);
          }}>
            编辑
          </Button>
          <Button variant={selectedActivity?.isActive ? "destructive" : "default"} size="lg" onClick={() => {
            onTogglePublish(selectedActivity);
            setShowDetailDialog(false);
          }}>
            {selectedActivity?.isActive ? '下架' : '发布'}
          </Button>
        </div>
      </div>
    </InlineModal>
  </>;
}
