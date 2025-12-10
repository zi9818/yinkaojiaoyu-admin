// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from '@/components/ui';
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
          <Input placeholder="搜索活动标题、描述或地址..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="发布状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="published">已发布</SelectItem>
            <SelectItem value="draft">未发布</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={onCreateActivity} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          创建活动
        </Button>
      </div>
    </div>;
}