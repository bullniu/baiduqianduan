import * as XLSX from 'xlsx';
import { WeldingProcedure, Statistics } from '@/types';

/**
 * 导出工艺评定数据为Excel文件
 */
export function exportToExcel(procedure: WeldingProcedure): void {
  const wb = XLSX.utils.book_new();
  
  // 创建基础信息表
  const basicInfo = [
    ['焊接工艺评定报告'],
    [''],
    ['工艺评定编号', procedure.procedureNumber],
    ['项目名称', procedure.projectName],
    ['材料信息', procedure.materialInfo],
    ['焊接类型', procedure.weldType],
    ['创建时间', new Date(procedure.createdAt).toLocaleString('zh-CN')],
    ['更新时间', new Date(procedure.updatedAt).toLocaleString('zh-CN')],
    [''],
  ];
  
  // 创建参数数据表头
  const paramHeader = ['层号', '道号', '焊接电流(A)', '焊接电压(V)', '焊接速度(mm/min)', '热输入(J/mm)'];
  const paramData: (string | number)[][] = [paramHeader];
  
  // 填充参数数据
  procedure.layers.forEach(layer => {
    layer.passes.forEach(pass => {
      paramData.push([
        layer.layerNumber,
        pass.passNumber,
        pass.current,
        pass.voltage,
        pass.travelSpeed,
        Number(pass.heatInput.toFixed(2))
      ]);
    });
  });
  
  // 计算统计数据
  const stats = calculateStatistics(procedure);
  
  // 添加统计信息
  const statsInfo = [
    [''],
    ['统计信息'],
    ['总层数', stats.totalLayers],
    ['总道数', stats.totalPasses],
    ['平均热输入(J/mm)', Number(stats.averageHeatInput.toFixed(2))],
    ['最小热输入(J/mm)', Number(stats.minHeatInput.toFixed(2))],
    ['最大热输入(J/mm)', Number(stats.maxHeatInput.toFixed(2))],
    ['平均电流(A)', Number(stats.averageCurrent.toFixed(2))],
    ['平均电压(V)', Number(stats.averageVoltage.toFixed(2))],
    ['平均速度(mm/min)', Number(stats.averageTravelSpeed.toFixed(2))],
  ];
  
  // 合并所有数据
  const allData = [...basicInfo, ...paramData, ...statsInfo];
  
  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(allData);
  
  // 设置列宽
  ws['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, '焊接参数');
  
  // 生成文件名
  const fileName = `焊接工艺评定_${procedure.procedureNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // 下载文件
  XLSX.writeFile(wb, fileName);
}

/**
 * 计算统计数据
 */
function calculateStatistics(procedure: WeldingProcedure): Statistics {
  const allPasses = procedure.layers.flatMap(layer => layer.passes);
  
  if (allPasses.length === 0) {
    return {
      totalPasses: 0,
      totalLayers: procedure.layers.length,
      averageHeatInput: 0,
      minHeatInput: 0,
      maxHeatInput: 0,
      averageCurrent: 0,
      averageVoltage: 0,
      averageTravelSpeed: 0,
    };
  }
  
  const heatInputs = allPasses.map(p => p.heatInput).filter(h => h > 0);
  const currents = allPasses.map(p => p.current).filter(c => c > 0);
  const voltages = allPasses.map(p => p.voltage).filter(v => v > 0);
  const speeds = allPasses.map(p => p.travelSpeed).filter(s => s > 0);
  
  return {
    totalPasses: allPasses.length,
    totalLayers: procedure.layers.length,
    averageHeatInput: heatInputs.length > 0 ? heatInputs.reduce((a, b) => a + b, 0) / heatInputs.length : 0,
    minHeatInput: heatInputs.length > 0 ? Math.min(...heatInputs) : 0,
    maxHeatInput: heatInputs.length > 0 ? Math.max(...heatInputs) : 0,
    averageCurrent: currents.length > 0 ? currents.reduce((a, b) => a + b, 0) / currents.length : 0,
    averageVoltage: voltages.length > 0 ? voltages.reduce((a, b) => a + b, 0) / voltages.length : 0,
    averageTravelSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
  };
}