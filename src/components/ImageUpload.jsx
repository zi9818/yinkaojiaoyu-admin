// @ts-ignore;
import React, { useState, useRef } from 'react';
// @ts-ignore;
import { Button } from '@/components/ui';
// @ts-ignore;
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export function ImageUpload({
  images = [],
  onChange,
  maxImages = 5,
  maxSize = 5 * 1024 * 1024,
  // 5MB
  accept = 'image/*',
  className = '',
  showPreview = true,
  previewSize = 'w-full h-32'
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 处理文件上传到云存储
  const handleFileUpload = async file => {
    if (!file) return null;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return null;
    }

    // 检查文件大小
    if (file.size > maxSize) {
      alert(`图片大小不能超过${Math.round(maxSize / 1024 / 1024)}MB`);
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
      const fileName = `uploads/${timestamp}_${randomStr}.${fileExtension}`;

      // 上传文件到云存储
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });

      // 返回云存储文件ID（云存储链接）
      console.log('文件上传成功，云存储链接:', uploadResult.fileID);
      return uploadResult.fileID;
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败: ' + (error.message || '请重试'));
      return null;
    }
  };

  // 处理文件选择
  const handleFileSelect = async event => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // 检查图片数量限制
    if (images.length + files.length > maxImages) {
      alert(`最多只能上传${maxImages}张图片`);
      return;
    }
    setUploading(true);
    try {
      const newImages = [];
      for (const file of files) {
        // 上传到云存储，获取云存储链接
        const cloudStorageUrl = await handleFileUpload(file);
        if (cloudStorageUrl) {
          newImages.push(cloudStorageUrl);
        }
      }
      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    } catch (error) {
      console.error('图片上传失败:', error);
    } finally {
      setUploading(false);
      // 清空input值，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除图片
  const handleRemoveImage = index => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

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
        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA2MEgxMTVWOTBIODVWNjBaIiBmaWxsPSIjRDFEREIiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4MCIgeT0iNTUiPgo8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEyIDIwSDI4VjI4SDEyVjIwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=';
      }} />;
    }

    // 普通URL或base64图片（保持向后兼容）
    return <img src={src} alt={alt} className={className} onError={e => {
      console.error('图片加载失败:', src);
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0BveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA2MEgxMTVWOTBIODVWNjBaIiBmaWxsPSIjRDFEREIiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4MCIgeT0iNTUiPgo8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEyIDIwSDI4VjI4SDEyVjIwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=';
    }} />;
  };
  return <div className={`space-y-4 ${className}`}>
      {/* 上传区域 - 保持原有UI样式 */}
      {images.length < maxImages && <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  点击上传图片
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  支持 PNG, JPG, GIF 格式，单个文件不超过 {Math.round(maxSize / 1024 / 1024)}MB
                </span>
              </label>
              <input id="file-upload" ref={fileInputRef} name="file-upload" type="file" className="sr-only" accept={accept} multiple={maxImages > 1} onChange={handleFileSelect} disabled={uploading} />
            </div>
            {uploading && <div className="mt-2">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  上传中...
                </div>
              </div>}
          </div>
        </div>}

      {/* 图片预览 - 保持原有UI样式 */}
      {showPreview && images.length > 0 && <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              已上传图片 ({images.length}/{maxImages})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => <div key={index} className="relative group">
                <div className={`${previewSize} bg-gray-100 rounded-lg overflow-hidden border border-gray-200`}>
                  {renderImage(image, `图片${index + 1}`, "w-full h-full object-cover")}
                </div>
                <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" title="删除图片">
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>)}
          </div>
        </div>}

      {/* 上传提示 - 保持原有UI样式 */}
      {images.length >= maxImages && <div className="text-center py-4">
          <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            已达到最大上传数量限制 ({maxImages}张)
          </p>
        </div>}
    </div>;
}