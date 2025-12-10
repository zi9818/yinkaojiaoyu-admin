// @ts-ignore;
import React, { useState, useRef } from 'react';
// @ts-ignore;
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from '@/components/ui';
// @ts-ignore;
import { X, Tag, Upload, Image as ImageIcon } from 'lucide-react';

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
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA2MEgxMTVWOTBIODVWNjBaIiBmaWxsPSIjRDFEREIiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4MCIgeT0iNTUiPgo8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEyIDIwSDI4VjI4SDEyVjIwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=';
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
  const bannerInputRef = useRef(null);
  const detailInputRef = useRef(null);

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
            <Input value={formData.title} onChange={(e) => setFormData((prev) => ({
            ...prev,
            title: e.target.value }))}
          placeholder="请输入活动标题" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">活动副标题</label>
            <Input value={formData.subtitle} onChange={(e) => setFormData((prev) => ({
            ...prev,
            subtitle: e.target.value }))}
          placeholder="请输入副标题" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">活动描述</label>
          <textarea value={formData.desc} onChange={(e) => setFormData((prev) => ({
          ...prev,
          desc: e.target.value }))}
        placeholder="请输入活动描述" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" rows={4} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">价格（元）</label>
            <Input type="number" value={formData.price} onChange={(e) => setFormData((prev) => ({
            ...prev,
            price: e.target.value }))}
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
            <Input type="datetime-local" value={formData.startTime} onChange={(e) => setFormData((prev) => ({
            ...prev,
            startTime: e.target.value }))} />

          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">结束时间</label>
            <Input type="datetime-local" value={formData.endTime} onChange={(e) => setFormData((prev) => ({
            ...prev,
            endTime: e.target.value }))} />

          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">活动地址</label>
          <Input value={formData.address} onChange={(e) => setFormData((prev) => ({
          ...prev,
          address: e.target.value }))}
        placeholder="请输入活动地址" />
        </div>
      </div>

      {/* 标签 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">标签</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">活动标签</label>
          <div className="flex gap-2">
            <Input placeholder="输入标签后按回车添加" onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddTag(e.target.value);
              e.target.value = '';
            }
          }} />
          </div>
          {formData.tags.length > 0 && <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {tag}
                  <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveTag(index)} />
                </Badge>)}
            </div>}
        </div>
      </div>

      {/* 轮播图图片 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">轮播图图片</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">上传轮播图</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="banner-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    点击上传图片或拖拽文件到此处
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    支持 PNG, JPG, GIF 格式，单个文件不超过 5MB，最多5张
                  </span>
                </label>
                <input id="banner-upload" ref={bannerInputRef} name="banner-upload" type="file" className="sr-only" accept="image/*" multiple onChange={handleBannerFileSelect} disabled={bannerUploading || formData.bannerImages.length >= 5} />
              </div>
              {bannerUploading && <div className="mt-2">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    上传中...
                  </div>
                </div>}
            </div>
          </div>
          
          {formData.bannerImages.length > 0 && <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">已上传的轮播图 ({formData.bannerImages.length}/5)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.bannerImages.map((image, index) => <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <CloudImage src={image} alt={`轮播图${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button type="button" onClick={() => onRemoveBannerImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" title="删除图片">
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>)}
              </div>
            </div>}
        </div>
      </div>

      {/* 活动详情图片 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">活动详情图片</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">上传详情图片</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="detail-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    点击上传图片或拖拽文件到此处
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    支持 PNG, JPG, GIF 格式，单个文件不超过 5MB，最多10张
                  </span>
                </label>
                <input id="detail-upload" ref={detailInputRef} name="detail-upload" type="file" className="sr-only" accept="image/*" multiple onChange={handleDetailFileSelect} disabled={detailUploading || formData.detailImages.length >= 10} />
              </div>
              {detailUploading && <div className="mt-2">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    上传中...
                  </div>
                </div>}
            </div>
          </div>
          
          {formData.detailImages.length > 0 && <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">已上传的详情图片 ({formData.detailImages.length}/10)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.detailImages.map((image, index) => <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <CloudImage src={image} alt={`详情图${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button type="button" onClick={() => onRemoveDetailImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" title="删除图片">
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>)}
              </div>
            </div>}
        </div>
      </div>

      {/* 参与信息 */}
      <div className="space-y-4">
        
        






      </div>
    </div>;
}