import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, Calendar, Layers, Zap } from 'lucide-react';
import { useProcedureStore } from '@/store';
import { WeldingProcedure } from '@/types';

export function ProcedureList() {
  const navigate = useNavigate();
  const { procedures, loadProcedures, deleteProcedure } = useProcedureStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProcedures();
  }, [loadProcedures]);

  // 过滤方案
  const filteredProcedures = procedures.filter(p => 
    p.procedureNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 处理删除
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除此工艺评定方案吗？')) {
      deleteProcedure(id);
    }
  };

  // 计算总道数
  const getTotalPasses = (procedure: WeldingProcedure): number => {
    return procedure.layers.reduce((sum, layer) => sum + layer.passes.length, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">焊接工艺评定记录系统</h1>
                <p className="text-sm text-slate-500 mt-1">多层多道焊参数记录与管理</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/procedure/new')}
              className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">新建方案</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索栏 */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="搜索工艺评定编号或项目名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* 空状态 */}
        {filteredProcedures.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {searchTerm ? '未找到匹配的方案' : '暂无工艺评定方案'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm ? '请尝试其他搜索条件' : '点击右上角"新建方案"开始记录'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/procedure/new')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>创建第一个方案</span>
              </button>
            )}
          </div>
        )}

        {/* 方案卡片列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProcedures.map((procedure) => (
            <div
              key={procedure.id}
              onClick={() => navigate(`/procedure/${procedure.id}`)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 hover:border-blue-300 overflow-hidden group"
            >
              {/* 卡片头部 */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <FileText className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-mono text-slate-400">编号</span>
                    </div>
                    <h3 className="text-lg font-bold text-white font-mono">
                      {procedure.procedureNumber}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => handleDelete(procedure.id, e)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 卡片内容 */}
              <div className="p-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 line-clamp-1">
                  {procedure.projectName}
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-slate-600">
                    <span className="text-slate-400 w-20">材料信息:</span>
                    <span className="font-medium">{procedure.materialInfo}</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <span className="text-slate-400 w-20">焊接类型:</span>
                    <span className="font-medium">{procedure.weldType}</span>
                  </div>
                </div>

                {/* 统计信息 */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-slate-500">
                      <Layers className="w-4 h-4" />
                      <span className="font-mono">{procedure.layers.length} 层</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-500">
                      <Zap className="w-4 h-4" />
                      <span className="font-mono">{getTotalPasses(procedure)} 道</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400 text-xs">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(procedure.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}