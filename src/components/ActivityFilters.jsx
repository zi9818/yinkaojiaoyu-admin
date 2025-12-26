// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Input, Button } from '@/components/ui';
// @ts-ignore;
import { Search, Filter, Plus, ArrowLeft } from 'lucide-react';

export function ActivityFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onCreateActivity,
  onBackToAdmin
}) {
  return <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* 返回按钮 */}
      <Button variant="outline" onClick={onBackToAdmin} className="flex items-center">
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回管理后台
      </Button>

      {/* 搜索框 */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="搜索活动标题、描述或地址..." value={searchTerm} onChange={(e) => {
          const value = e.target.value;
          setSearchTerm(value);
        }} className="pl-10" />
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-2">
        <div className="relative w-40">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Filter className="w-4 h-4" />
          </div>
          <select
            className="w-full h-10 pl-9 pr-3 rounded-md border border-gray-200 bg-white"
            value={statusFilter}
            onChange={(e) => {
            const value = e.target.value;
            setStatusFilter(value);
          }}
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">未发布</option>
          </select>
        </div>

        <Button onClick={onCreateActivity} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          创建活动
        </Button>
      </div>
    </div>;
}