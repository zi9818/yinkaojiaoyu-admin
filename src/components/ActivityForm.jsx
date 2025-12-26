// @ts-ignore;
import React, { useState, useRef } from 'react';
// @ts-ignore;
import { Button, Input, Badge } from '@/components/ui';
// @ts-ignore;
import { X, Tag, Upload, Image as ImageIcon, Plus, GripVertical } from 'lucide-react';

// 独立的图片组件，支持云存储fileID
function CloudImage({
  src,
  alt,
  className })
{
  const [imageUrl, setImageUrl] = useState(src);

  // 获取云存储文件的临时访问链接
  const getTempFileURL = async (fileID) => {
    try {
      const tcb = await window.$w?.cloud?.getCloudInstance();
      if (!tcb) {
        return fileID; // 如果无法获取云实例，直接返回fileID
      }
      const result = await tcb.getTempFileURL({
        fileList: [fileID] });

      if (result.fileList && result.fileList.length > 0) {
        return result.fileList[0].tempFileURL;
      }
      return fileID;
    } catch (error) {
      console.error('获取临时链接失败:', error);
      return fileID;
    }
  };
  React.useEffect(() => {
    // 如果是云存储的fileID格式，获取临时链接
    if (src && typeof src === 'string' && (src.includes('cloud://') || src.includes('tcb://'))) {
      getTempFileURL(src).then((url) => {
        if (url !== src) {
          setImageUrl(url);
        }
      });
    }
  }, [src]);
  const handleError = (e) => {
    console.error('图片加载失败:', src);
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA2MEgxMTVWOTBIODVWNjBaIiBmaWxsPSIjRDFEREIiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWg9IjQwIiB2aWV3Qm94PSIwIDAgNDAgNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeD0iODAiIHk9IjU1Ij4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRTVEQTQiLz4KPHBhdGggZD0iTTEyIDIwSDI4VjI4SDEyVjIwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=';
  };
  return <img src={imageUrl} alt={alt} className={className} onError={handleError} />;
}
export function ActivityForm({
  formData,
  setFormData,
  onBannerImageUpload,
  onRemoveBannerImage,
  onDetailImageUpload,
  onRemoveDetailImage,
  onAddTag,
  onRemoveTag,
  isEdit = false })
{
  const [bannerUploading, setBannerUploading] = useState(false);
  const [detailUploading, setDetailUploading] = useState(false);
  const [customerNumbersText, setCustomerNumbersText] = useState('');
  const [customerNumbersError, setCustomerNumbersError] = useState('');
  const [draggedBannerIndex, setDraggedBannerIndex] = useState(null);
  const [dragOverBannerIndex, setDragOverBannerIndex] = useState(null);
  const [draggedDetailIndex, setDraggedDetailIndex] = useState(null);
  const [dragOverDetailIndex, setDragOverDetailIndex] = useState(null);
  const bannerInputRef = useRef(null);
  const detailInputRef = useRef(null);
  const customerNumbersInputRef = useRef(null);

  const isValidCustomerNumber = (num) => {
    if (typeof num !== 'string') return false;
    const v = num.trim();
    return /^1\d{10}$/.test(v);
  };

  const parseCustomerNumbers = (text) => {
    return (text || '')
      .split(/\r?\n/)
      .map(line => (line || '').trim())
      .filter(Boolean);
  };

  React.useEffect(() => {
    const current = Array.isArray(formData.customerNumbers) ? formData.customerNumbers : [];

    if (typeof document === 'undefined') {
      setCustomerNumbersText(current.join('\n'));
      return;
    }

    const input = customerNumbersInputRef.current;
    const isFocused = !!input && document.activeElement === input;
    if (isFocused) return;

    setCustomerNumbersText(current.join('\n'));
  }, [formData.customerNumbers]);

  // 轮播图拖拽排序处理
  const handleBannerDragStart = (e, index) => {
    setDraggedBannerIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleBannerDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedBannerIndex !== index) {
      setDragOverBannerIndex(index);
    }
  };

  const handleBannerDragLeave = () => {
    setDragOverBannerIndex(null);
  };

  const handleBannerDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedBannerIndex === null || draggedBannerIndex === dropIndex) {
      setDraggedBannerIndex(null);
      setDragOverBannerIndex(null);
      return;
    }

    const newImages = [...formData.bannerImages];
    const draggedImage = newImages[draggedBannerIndex];
    newImages.splice(draggedBannerIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    setFormData((prev) => ({
      ...prev,
      bannerImages: newImages
    }));

    setDraggedBannerIndex(null);
    setDragOverBannerIndex(null);
  };

  const handleBannerDragEnd = () => {
    setDraggedBannerIndex(null);
    setDragOverBannerIndex(null);
  };

  // 详情图拖拽排序处理
  const handleDetailDragStart = (e, index) => {
    setDraggedDetailIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDetailDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedDetailIndex !== index) {
      setDragOverDetailIndex(index);
    }
  };

  const handleDetailDragLeave = () => {
    setDragOverDetailIndex(null);
  };

  const handleDetailDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedDetailIndex === null || draggedDetailIndex === dropIndex) {
      setDraggedDetailIndex(null);
      setDragOverDetailIndex(null);
      return;
    }

    const newImages = [...formData.detailImages];
    const draggedImage = newImages[draggedDetailIndex];
    newImages.splice(draggedDetailIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    setFormData((prev) => ({
      ...prev,
      detailImages: newImages
    }));

    setDraggedDetailIndex(null);
    setDragOverDetailIndex(null);
  };

  const handleDetailDragEnd = () => {
    setDraggedDetailIndex(null);
    setDragOverDetailIndex(null);
  };

  // 处理文件上传到云存储
  const handleFileUpload = async (file, type) => {
    if (!file) return null;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return null;
    }

    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return null;
    }
    try {
      // 获取云开发实例
      const tcb = await window.$w?.cloud?.getCloudInstance();
      if (!tcb) {
        throw new Error('无法获取云开发实例');
      }

      // 生成唯一的文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${type}/${timestamp}_${randomStr}.${fileExtension}`;

      // 上传文件到云存储
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file });


      // 返回云存储文件ID
      console.log('文件上传成功:', uploadResult.fileID);
      return uploadResult.fileID;
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败: ' + (error.message || '请重试'));
      return null;
    }
  };

  // 处理轮播图文件选择
  const handleBannerFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    setBannerUploading(true);
    try {
      for (const file of files) {
        const fileID = await handleFileUpload(file, 'banner');
        if (fileID) {
          onBannerImageUpload(fileID);
        }
      }
    } catch (error) {
      console.error('轮播图上传失败:', error);
    } finally {
      setBannerUploading(false);
      // 清空input值，允许重复选择同一文件
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  // 处理详情图片文件选择
  const handleDetailFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    setDetailUploading(true);
    try {
      for (const file of files) {
        const fileID = await handleFileUpload(file, 'detail');
        if (fileID) {
          onDetailImageUpload(fileID);
        }
      }
    } catch (error) {
      console.error('详情图片上传失败:', error);
    } finally {
      setDetailUploading(false);
      // 清空input值，允许重复选择同一文件
      if (detailInputRef.current) {
        detailInputRef.current.value = '';
      }
    }
  };

  return <div className="space-y-6">
      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">活动标题 *</label>
            <Input value={formData.title} onChange={(e) => {
            const value = e.target.value;
            setFormData((prev) => ({
            ...prev,
            title: value }));
          }}
          placeholder="请输入活动标题" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">活动副标题</label>
            <Input value={formData.subtitle} onChange={(e) => {
            const value = e.target.value;
            setFormData((prev) => ({
            ...prev,
            subtitle: value }));
          }}
          placeholder="请输入副标题" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">活动描述</label>
          <textarea value={formData.desc} onChange={(e) => {
          const value = e.target.value;
          setFormData((prev) => ({
          ...prev,
          desc: value }));
        }}
        placeholder="请输入活动描述" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" rows={4} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">价格（元）</label>
            <Input type="number" value={formData.price} onChange={(e) => {
            const value = e.target.value;
            setFormData((prev) => ({
            ...prev,
            price: value }));
          }}
          placeholder="0" min="0" step="0.01" />
          </div>
        </div>
      </div>

      {/* 时间和地点 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">时间和地点</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">开始时间</label>
            <Input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  startTime: value
                }));
              }}
              className="w-48 cursor-pointer"
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">结束时间</label>
            <Input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  endTime: value
                }));
              }}
              className="w-48 cursor-pointer"
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">活动地址</label>
          <Input value={formData.address} onChange={(e) => {
          const value = e.target.value;
          setFormData((prev) => ({
          ...prev,
          address: value }));
        }}
        placeholder="请输入活动地址" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">联系电话</label>
          <Input value={formData.callNumber || ''} onChange={(e) => {
          const value = e.target.value;
          setFormData((prev) => ({
          ...prev,
          callNumber: value }));
        }}
        placeholder="请输入联系电话（手机号/座机）" />
        </div>
      </div>

      {/* 标签 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">标签</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">活动标签（最多4个，每个最多6个字）</label>

          {/* 已添加的标签 - 一行展示 */}
          <div className="flex flex-wrap items-center gap-2">
            {formData.tags.map((tag, index) => (
              <div key={index} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                <span className="text-sm text-blue-700">{tag}</span>
                <X
                  className="w-4 h-4 text-blue-400 hover:text-red-500 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newTags = formData.tags.filter((_, i) => i !== index);
                    setFormData((prev) => ({ ...prev, tags: newTags }));
                  }}
                />
              </div>
            ))}
          </div>

          {/* 新增标签输入 - 一行紧凑布局 */}
          {formData.tags.length < 4 && (
            <div className="flex items-center gap-2">
              <Input
                id="new-tag-input"
                placeholder="输入标签"
                maxLength={6}
                className="w-32"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = e.target.value.trim().slice(0, 6);
                    if (value && formData.tags.length < 4) {
                      setFormData((prev) => ({
                        ...prev,
                        tags: [...prev.tags, value]
                      }));
                      e.target.value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new-tag-input');
                  if (!input) return;
                  const value = input.value.trim().slice(0, 6);
                  if (value && formData.tags.length < 4) {
                    setFormData((prev) => ({
                      ...prev,
                      tags: [...prev.tags, value]
                    }));
                    input.value = '';
                  }
                }}
                className="p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
                title="添加标签"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400">{formData.tags.length}/4</span>
            </div>
          )}

          {/* 已满提示 */}
          {formData.tags.length >= 4 && (
            <p className="text-xs text-gray-500">已添加 4/4 个标签</p>
          )}
        </div>
      </div>

      {/* 客户号码 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">客户号码</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">每行一个号码</label>
          <textarea
            ref={customerNumbersInputRef}
            value={customerNumbersText}
            onChange={(e) => {
              const value = e.target.value;
              const parsed = parseCustomerNumbers(value);
              const invalid = parsed.filter(item => !isValidCustomerNumber(item));
              setCustomerNumbersText(value);
              setCustomerNumbersError(invalid.length > 0 ? `存在 ${invalid.length} 条格式不正确（仅支持11位手机号）：${invalid.slice(0, 5).join('、')}${invalid.length > 5 ? '…' : ''}` : '');
              setFormData((prev) => ({
                ...prev,
                customerNumbers: parsed
              }));
            }}
            placeholder="例如：\n13800138000\n13900139000"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
          {customerNumbersError ? (
            <div className="text-xs text-red-600">
              {customerNumbersError}
            </div>
          ) : null}
          <div className="text-xs text-gray-500">
            已导入 {Array.isArray(formData.customerNumbers) ? formData.customerNumbers.length : 0} 个
          </div>
        </div>
      </div>

      {/* 轮播图图片 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">轮播图图片</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">上传轮播图</label>
          <label
            htmlFor="banner-upload"
            className={`block border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${bannerUploading || formData.bannerImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  点击上传图片
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  支持 PNG, JPG, GIF 格式，单个文件不超过 5MB，最多5张
                </span>
              </div>
              {bannerUploading && <div className="mt-2">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  上传中...
                </div>
              </div>}
            </div>
          </label>
          <input
            id="banner-upload"
            ref={bannerInputRef}
            name="banner-upload"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleBannerFileSelect}
            disabled={bannerUploading || formData.bannerImages.length >= 5}
          />

          {formData.bannerImages.length > 0 && <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">已上传的轮播图 ({formData.bannerImages.length}/5) <span className="text-gray-400 font-normal">- 拖拽可调整顺序</span></h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.bannerImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative group cursor-move ${draggedBannerIndex === index ? 'opacity-50' : ''} ${dragOverBannerIndex === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    draggable
                    onDragStart={(e) => handleBannerDragStart(e, index)}
                    onDragOver={(e) => handleBannerDragOver(e, index)}
                    onDragLeave={handleBannerDragLeave}
                    onDrop={(e) => handleBannerDrop(e, index)}
                    onDragEnd={handleBannerDragEnd}
                  >
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <CloudImage src={image} alt={`轮播图${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                    </div>
                    <div className="absolute top-2 left-2 bg-white bg-opacity-80 text-gray-600 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveBannerImage(index); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" title="删除图片">
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>}
        </div>
      </div>

      {/* 活动详情图片 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">活动详情图片</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">上传详情图片</label>
          <label
            htmlFor="detail-upload"
            className={`block border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${detailUploading || formData.detailImages.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  点击上传图片
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  支持 PNG, JPG, GIF 格式，单个文件不超过 5MB，最多10张
                </span>
              </div>
              {detailUploading && <div className="mt-2">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  上传中...
                </div>
              </div>}
            </div>
          </label>
          <input
            id="detail-upload"
            ref={detailInputRef}
            name="detail-upload"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleDetailFileSelect}
            disabled={detailUploading || formData.detailImages.length >= 10}
          />

          {formData.detailImages.length > 0 && <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">已上传的详情图片 ({formData.detailImages.length}/10) <span className="text-gray-400 font-normal">- 拖拽可调整顺序</span></h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.detailImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative group cursor-move ${draggedDetailIndex === index ? 'opacity-50' : ''} ${dragOverDetailIndex === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    draggable
                    onDragStart={(e) => handleDetailDragStart(e, index)}
                    onDragOver={(e) => handleDetailDragOver(e, index)}
                    onDragLeave={handleDetailDragLeave}
                    onDrop={(e) => handleDetailDrop(e, index)}
                    onDragEnd={handleDetailDragEnd}
                  >
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <CloudImage src={image} alt={`详情图${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                    </div>
                    <div className="absolute top-2 left-2 bg-white bg-opacity-80 text-gray-600 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveDetailImage(index); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" title="删除图片">
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>}
        </div>
      </div>

      {/* 参与信息 */}
      <div className="space-y-4">
        
        






      </div>
    </div>;
}