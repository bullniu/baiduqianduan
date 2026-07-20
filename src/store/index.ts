import { create } from 'zustand';
import { WeldingProcedure } from '@/types';
import {
  getAllProcedures,
  getProcedureById,
  createProcedure as createProcedureStorage,
  updateProcedure as updateProcedureStorage,
  deleteProcedure as deleteProcedureStorage,
  addLayer as addLayerStorage,
  deleteLayer as deleteLayerStorage,
  addPass as addPassStorage,
  updatePass as updatePassStorage,
  deletePass as deletePassStorage,
} from '@/utils/storage';

interface ProcedureState {
  procedures: WeldingProcedure[];
  currentProcedure: WeldingProcedure | null;
  
  // 加载所有方案
  loadProcedures: () => void;
  
  // 加载单个方案
  loadProcedure: (id: string) => void;
  
  // 创建新方案
  createProcedure: (data: Omit<WeldingProcedure, 'id' | 'layers' | 'createdAt' | 'updatedAt'>) => WeldingProcedure;
  
  // 更新方案基础信息
  updateProcedure: (id: string, data: Partial<WeldingProcedure>) => void;
  
  // 删除方案
  deleteProcedure: (id: string) => void;
  
  // 添加层
  addLayer: (procedureId: string) => void;
  
  // 删除层
  deleteLayer: (procedureId: string, layerId: string) => void;
  
  // 添加道次
  addPass: (procedureId: string, layerId: string) => void;
  
  // 更新道次参数
  updatePass: (
    procedureId: string,
    layerId: string,
    passId: string,
    data: { current: number; voltage: number; travelSpeed: number }
  ) => void;
  
  // 删除道次
  deletePass: (procedureId: string, layerId: string, passId: string) => void;
  
  // 清空当前方案
  clearCurrentProcedure: () => void;
}

export const useProcedureStore = create<ProcedureState>((set, get) => ({
  procedures: [],
  currentProcedure: null,
  
  loadProcedures: () => {
    const procedures = getAllProcedures();
    set({ procedures });
  },
  
  loadProcedure: (id: string) => {
    const procedure = getProcedureById(id);
    set({ currentProcedure: procedure });
  },
  
  createProcedure: (data) => {
    const newProcedure = createProcedureStorage(data);
    set((state) => ({
      procedures: [...state.procedures, newProcedure],
      currentProcedure: newProcedure,
    }));
    return newProcedure;
  },
  
  updateProcedure: (id, data) => {
    const updatedProcedure = updateProcedureStorage(id, data);
    if (updatedProcedure) {
      set((state) => ({
        procedures: state.procedures.map(p => p.id === id ? updatedProcedure : p),
        currentProcedure: state.currentProcedure?.id === id ? updatedProcedure : state.currentProcedure,
      }));
    }
  },
  
  deleteProcedure: (id) => {
    deleteProcedureStorage(id);
    set((state) => ({
      procedures: state.procedures.filter(p => p.id !== id),
      currentProcedure: state.currentProcedure?.id === id ? null : state.currentProcedure,
    }));
  },
  
  addLayer: (procedureId) => {
    const updatedProcedure = addLayerStorage(procedureId);
    if (updatedProcedure) {
      set((state) => ({
        procedures: state.procedures.map(p => p.id === procedureId ? updatedProcedure : p),
        currentProcedure: state.currentProcedure?.id === procedureId ? updatedProcedure : state.currentProcedure,
      }));
    }
  },
  
  deleteLayer: (procedureId, layerId) => {
    const updatedProcedure = deleteLayerStorage(procedureId, layerId);
    if (updatedProcedure) {
      set((state) => ({
        procedures: state.procedures.map(p => p.id === procedureId ? updatedProcedure : p),
        currentProcedure: state.currentProcedure?.id === procedureId ? updatedProcedure : state.currentProcedure,
      }));
    }
  },
  
  addPass: (procedureId, layerId) => {
    const updatedProcedure = addPassStorage(procedureId, layerId);
    if (updatedProcedure) {
      set((state) => ({
        procedures: state.procedures.map(p => p.id === procedureId ? updatedProcedure : p),
        currentProcedure: state.currentProcedure?.id === procedureId ? updatedProcedure : state.currentProcedure,
      }));
    }
  },
  
  updatePass: (procedureId, layerId, passId, data) => {
    const updatedProcedure = updatePassStorage(procedureId, layerId, passId, data);
    if (updatedProcedure) {
      set((state) => ({
        procedures: state.procedures.map(p => p.id === procedureId ? updatedProcedure : p),
        currentProcedure: state.currentProcedure?.id === procedureId ? updatedProcedure : state.currentProcedure,
      }));
    }
  },
  
  deletePass: (procedureId, layerId, passId) => {
    const updatedProcedure = deletePassStorage(procedureId, layerId, passId);
    if (updatedProcedure) {
      set((state) => ({
        procedures: state.procedures.map(p => p.id === procedureId ? updatedProcedure : p),
        currentProcedure: state.currentProcedure?.id === procedureId ? updatedProcedure : state.currentProcedure,
      }));
    }
  },
  
  clearCurrentProcedure: () => {
    set({ currentProcedure: null });
  },
}));