import { WeldingProcedure, WeldPass } from '@/types';
import { calculateTravelSpeed, calculateHeatInput } from './calculation';

const STORAGE_KEY = 'welding_procedures';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 规范化单个 pass，确保所有字段都存在且为有效数字
 * 兼容旧数据（没有 weldLength 和 duration 字段）
 */
function normalizePass(pass: Partial<WeldPass>): WeldPass {
  return {
    id: pass.id || generateId(),
    passNumber: Number(pass.passNumber) || 0,
    current: Number(pass.current) || 0,
    voltage: Number(pass.voltage) || 0,
    weldLength: Number(pass.weldLength) || 0,
    duration: Number(pass.duration) || 0,
    travelSpeed: Number(pass.travelSpeed) || 0,
    heatInput: Number(pass.heatInput) || 0,
    createdAt: pass.createdAt || new Date().toISOString(),
  };
}

/**
 * 从LocalStorage获取所有工艺评定方案
 */
export function getAllProcedures(): WeldingProcedure[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const procedures = JSON.parse(data) as WeldingProcedure[];
    // 使用 slice() 创建副本后再排序，避免修改原数组
    return procedures.map(procedure => ({
      ...procedure,
      layers: [...procedure.layers]
        .sort((a, b) => a.layerNumber - b.layerNumber)
        .map(layer => ({
          ...layer,
          passes: [...layer.passes]
            .sort((a, b) => a.passNumber - b.passNumber)
            .map(normalizePass)
        }))
    }));
  } catch (error) {
    console.error('读取存储数据失败:', error);
    return [];
  }
}

/**
 * 根据ID获取工艺评定方案
 */
export function getProcedureById(id: string): WeldingProcedure | null {
  const procedures = getAllProcedures();
  return procedures.find(p => p.id === id) || null;
}

/**
 * 创建新的工艺评定方案
 */
export function createProcedure(data: Omit<WeldingProcedure, 'id' | 'layers' | 'createdAt' | 'updatedAt'>): WeldingProcedure {
  const procedures = getAllProcedures();
  const now = new Date().toISOString();
  
  const newProcedure: WeldingProcedure = {
    id: generateId(),
    ...data,
    layers: [],
    createdAt: now,
    updatedAt: now,
  };
  
  procedures.push(newProcedure);
  saveToStorage(procedures);
  
  return newProcedure;
}

/**
 * 更新工艺评定方案
 */
export function updateProcedure(id: string, data: Partial<WeldingProcedure>): WeldingProcedure | null {
  const procedures = getAllProcedures();
  const index = procedures.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  procedures[index] = {
    ...procedures[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  saveToStorage(procedures);
  return procedures[index];
}

/**
 * 删除工艺评定方案
 */
export function deleteProcedure(id: string): boolean {
  const procedures = getAllProcedures();
  const filtered = procedures.filter(p => p.id !== id);
  
  if (filtered.length === procedures.length) return false;
  
  saveToStorage(filtered);
  return true;
}

/**
 * 添加焊接层
 */
export function addLayer(procedureId: string): WeldingProcedure | null {
  const procedures = getAllProcedures();
  const index = procedures.findIndex(p => p.id === procedureId);
  if (index === -1) return null;
  
  const procedure = procedures[index];
  const layerNumber = procedure.layers.length + 1;
  
  procedure.layers.push({
    id: generateId(),
    layerNumber,
    passes: [],
    createdAt: new Date().toISOString(),
  });
  
  procedure.updatedAt = new Date().toISOString();
  saveToStorage(procedures);
  
  return procedure;
}

/**
 * 删除焊接层
 */
export function deleteLayer(procedureId: string, layerId: string): WeldingProcedure | null {
  const procedures = getAllProcedures();
  const index = procedures.findIndex(p => p.id === procedureId);
  if (index === -1) return null;
  
  const procedure = procedures[index];
  procedure.layers = procedure.layers.filter(l => l.id !== layerId);
  // 重新编号层
  procedure.layers.forEach((layer, i) => {
    layer.layerNumber = i + 1;
  });
  procedure.updatedAt = new Date().toISOString();
  
  saveToStorage(procedures);
  return procedure;
}

/**
 * 添加焊接道次
 */
export function addPass(procedureId: string, layerId: string): WeldingProcedure | null {
  const procedures = getAllProcedures();
  const index = procedures.findIndex(p => p.id === procedureId);
  if (index === -1) return null;
  
  const procedure = procedures[index];
  const layer = procedure.layers.find(l => l.id === layerId);
  if (!layer) return null;
  
  const passNumber = layer.passes.length + 1;
  const newPass = normalizePass({
    id: generateId(),
    passNumber,
    current: 0,
    voltage: 0,
    weldLength: 0,
    duration: 0,
    travelSpeed: 0,
    heatInput: 0,
    createdAt: new Date().toISOString(),
  });
  
  layer.passes.push(newPass);
  procedure.updatedAt = new Date().toISOString();
  
  saveToStorage(procedures);
  return procedure;
}

/**
 * 更新焊接道次参数
 */
export function updatePass(
  procedureId: string,
  layerId: string,
  passId: string,
  data: { current: number; voltage: number; weldLength: number; duration: number }
): WeldingProcedure | null {
  const procedures = getAllProcedures();
  const pIndex = procedures.findIndex(p => p.id === procedureId);
  if (pIndex === -1) return null;
  
  const procedure = procedures[pIndex];
  const layer = procedure.layers.find(l => l.id === layerId);
  if (!layer) return null;
  
  const pass = layer.passes.find(p => p.id === passId);
  if (!pass) return null;
  
  // 确保所有输入是有效数字
  const current = Number(data.current) || 0;
  const voltage = Number(data.voltage) || 0;
  const weldLength = Number(data.weldLength) || 0;
  const duration = Number(data.duration) || 0;
  
  const travelSpeed = calculateTravelSpeed(weldLength, duration);
  const heatInput = calculateHeatInput(current, voltage, travelSpeed);
  
  pass.current = current;
  pass.voltage = voltage;
  pass.weldLength = weldLength;
  pass.duration = duration;
  pass.travelSpeed = travelSpeed;
  pass.heatInput = heatInput;
  
  procedure.updatedAt = new Date().toISOString();
  
  saveToStorage(procedures);
  return procedure;
}

/**
 * 删除焊接道次
 */
export function deletePass(
  procedureId: string,
  layerId: string,
  passId: string
): WeldingProcedure | null {
  const procedures = getAllProcedures();
  const pIndex = procedures.findIndex(p => p.id === procedureId);
  if (pIndex === -1) return null;
  
  const procedure = procedures[pIndex];
  const layer = procedure.layers.find(l => l.id === layerId);
  if (!layer) return null;
  
  layer.passes = layer.passes.filter(p => p.id !== passId);
  // 重新编号道次
  layer.passes.forEach((pass, i) => {
    pass.passNumber = i + 1;
  });
  
  procedure.updatedAt = new Date().toISOString();
  
  saveToStorage(procedures);
  return procedure;
}

/**
 * 保存到LocalStorage
 */
function saveToStorage(procedures: WeldingProcedure[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(procedures));
  } catch (error) {
    console.error('保存数据失败:', error);
    throw error;
  }
}

/**
 * 导出数据为JSON
 */
export function exportToJSON(): string {
  const procedures = getAllProcedures();
  return JSON.stringify(procedures, null, 2);
}

/**
 * 从JSON导入数据
 */
export function importFromJSON(jsonString: string): boolean {
  try {
    const procedures = JSON.parse(jsonString) as WeldingProcedure[];
    saveToStorage(procedures);
    return true;
  } catch (error) {
    console.error('导入数据失败:', error);
    return false;
  }
}
