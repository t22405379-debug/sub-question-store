import React, { useState } from 'react';
import {
  Layers,
  Calendar,
  Tag,
  Building,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { showDeleteConfirmAlert, showSuccessAlert, showErrorAlert } from '../../services/alert';

export const HierarchyManager: React.FC = () => {
  const {
    years,
    semesters,
    examTypes,
    departments,
    addYear,
    updateYear,
    deleteYear,
    addSemester,
    updateSemester,
    deleteSemester,
    addExamType,
    updateExamType,
    deleteExamType,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = usePapers();

  const [activeSubTab, setActiveSubTab] = useState<'years' | 'semesters' | 'exams' | 'departments'>('years');

  // Modal states
  const [modalType, setModalType] = useState<'year' | 'semester' | 'exam' | 'department' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [colorBadge, setColorBadge] = useState('bg-indigo-500/15 text-indigo-300 border-indigo-500/30');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const BADGE_COLOR_OPTIONS = [
    { label: 'Indigo / Midterm', value: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
    { label: 'Rose / Final Exam', value: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    { label: 'Amber / Class Test', value: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    { label: 'Emerald / Practical Lab', value: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    { label: 'Purple / Presentation', value: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
    { label: 'Cyan / Assignment', value: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
    { label: 'Slate / Other', value: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  ];

  // Open modals
  const handleOpenAdd = (type: 'year' | 'semester' | 'exam' | 'department') => {
    setModalType(type);
    setEditingItem(null);
    setName('');
    setCode('');
    setColorBadge(BADGE_COLOR_OPTIONS[0].value);
    setDescription('');
    setFormError(null);
  };

  const handleOpenEdit = (type: 'year' | 'semester' | 'exam' | 'department', item: any) => {
    setModalType(type);
    setEditingItem(item);
    setName(item.name || '');
    setCode(item.code || '');
    setColorBadge(item.color_badge || BADGE_COLOR_OPTIONS[0].value);
    setDescription(item.description || '');
    setFormError(null);
  };

  // Submit Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }

    try {
      if (modalType === 'year') {
        if (editingItem) {
          updateYear(editingItem.id, { name: name.trim() });
          showSuccessAlert('Academic Year Updated', name);
        } else {
          addYear(name.trim());
          showSuccessAlert('Academic Year Added', name);
        }
      } else if (modalType === 'semester') {
        if (editingItem) {
          updateSemester(editingItem.id, { name: name.trim() });
          showSuccessAlert('Semester Updated', name);
        } else {
          addSemester(name.trim());
          showSuccessAlert('Semester Added', name);
        }
      } else if (modalType === 'exam') {
        if (editingItem) {
          updateExamType(editingItem.id, {
            name: name.trim(),
            code: (code.trim().toUpperCase() || name.slice(0, 4).toUpperCase()) as any,
            color_badge: colorBadge,
          });
          showSuccessAlert('Exam Type Updated', name);
        } else {
          addExamType(name.trim(), code.trim().toUpperCase() || name.slice(0, 4).toUpperCase(), colorBadge);
          showSuccessAlert('Exam Type Added', name);
        }
      } else if (modalType === 'department') {
        if (editingItem) {
          updateDepartment(editingItem.id, {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description.trim(),
          });
          showSuccessAlert('Department Updated', name);
        } else {
          addDepartment({
            name: name.trim(),
            code: code.trim().toUpperCase() || 'DEPT',
            description: description.trim(),
          });
          showSuccessAlert('Department Added', name);
        }
      }

      setModalType(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save changes');
    }
  };

  // SweetAlert2 Delete Handlers
  const handleDeleteYear = async (y: any) => {
    const confirmed = await showDeleteConfirmAlert(`Academic Year (${y.name})`);
    if (confirmed) {
      deleteYear(y.id);
      showSuccessAlert('Deleted', `${y.name} removed.`);
    }
  };

  const handleDeleteSemester = async (s: any) => {
    const confirmed = await showDeleteConfirmAlert(`Semester (${s.name})`);
    if (confirmed) {
      deleteSemester(s.id);
      showSuccessAlert('Deleted', `${s.name} removed.`);
    }
  };

  const handleDeleteExam = async (e: any) => {
    const confirmed = await showDeleteConfirmAlert(`Exam Type (${e.name})`);
    if (confirmed) {
      deleteExamType(e.id);
      showSuccessAlert('Deleted', `${e.name} removed.`);
    }
  };

  const handleDeleteDepartment = async (d: any) => {
    const confirmed = await showDeleteConfirmAlert(`Department (${d.name})`);
    if (confirmed) {
      deleteDepartment(d.id);
      showSuccessAlert('Deleted', `${d.name} removed.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Hierarchy &amp; Taxonomy Customizer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamically add, edit, or remove Academic Years, Semesters, Exam Types, and Departments
          </p>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('years')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'years'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Academic Years ({years.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('semesters')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'semesters'
              ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Semesters ({semesters.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('exams')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'exams'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-amber-400" />
          <span>Exam Types ({examTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('departments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'departments'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-emerald-400" />
          <span>Departments ({departments.length})</span>
        </button>
      </div>

      {/* 1. Academic Years Tab */}
      {activeSubTab === 'years' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Configured Academic Years
            </h3>
            <Button variant="primary" size="sm" onClick={() => handleOpenAdd('year')} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Academic Year
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {years.map((y) => (
              <div
                key={y.id}
                className="glass-card rounded-2xl p-4 flex items-center justify-between border border-slate-800"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{y.name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">Order: #{y.order_index}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit('year', y)}
                    title="Edit Year"
                    className="text-slate-400 hover:text-indigo-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteYear(y)}
                    title="Delete Year"
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Semesters Tab */}
      {activeSubTab === 'semesters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Configured Semesters / Terms
            </h3>
            <Button variant="primary" size="sm" onClick={() => handleOpenAdd('semester')} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Semester
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {semesters.map((s) => (
              <div
                key={s.id}
                className="glass-card rounded-2xl p-4 flex items-center justify-between border border-slate-800"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{s.name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">Order: #{s.order_index}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit('semester', s)}
                    title="Edit Semester"
                    className="text-slate-400 hover:text-cyan-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSemester(s)}
                    title="Delete Semester"
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Exam Types Tab */}
      {activeSubTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Configured Exam Assessment Types
            </h3>
            <Button variant="primary" size="sm" onClick={() => handleOpenAdd('exam')} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Exam Type
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {examTypes.map((e) => (
              <div
                key={e.id}
                className="glass-card rounded-2xl p-4 flex items-center justify-between border border-slate-800"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${e.color_badge}`}>
                      {e.code}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">{e.name}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit('exam', e)}
                    title="Edit Exam Type"
                    className="text-slate-400 hover:text-amber-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteExam(e)}
                    title="Delete Exam Type"
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Departments Tab */}
      {activeSubTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Configured Categories / Departments
            </h3>
            <Button variant="primary" size="sm" onClick={() => handleOpenAdd('department')} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Department
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((d) => (
              <div
                key={d.id}
                className="glass-card rounded-2xl p-4 flex items-center justify-between border border-slate-800"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {d.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{d.name}</h4>
                  </div>
                  {d.description && (
                    <p className="text-[11px] text-slate-400">{d.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit('department', d)}
                    title="Edit Department"
                    className="text-slate-400 hover:text-emerald-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDepartment(d)}
                    title="Delete Department"
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        isOpen={Boolean(modalType)}
        onClose={() => setModalType(null)}
        title={
          editingItem
            ? `Edit ${modalType === 'year' ? 'Academic Year' : modalType === 'semester' ? 'Semester' : modalType === 'exam' ? 'Exam Type' : 'Department'}`
            : `Add New ${modalType === 'year' ? 'Academic Year' : modalType === 'semester' ? 'Semester' : modalType === 'exam' ? 'Exam Type' : 'Department'}`
        }
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Title / Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                modalType === 'year'
                  ? 'e.g. 5th Year or Masters 1st'
                  : modalType === 'semester'
                  ? 'e.g. 3rd Semester or Summer Term'
                  : modalType === 'exam'
                  ? 'e.g. Surprise Quiz or Viva'
                  : 'e.g. Software Engineering'
              }
              required
            />
          </div>

          {(modalType === 'exam' || modalType === 'department') && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Short Code
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={modalType === 'exam' ? 'e.g. QUIZ, VIVA, CT' : 'e.g. SWE, EEE'}
              />
            </div>
          )}

          {modalType === 'exam' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Badge Color Style
              </label>
              <select
                value={colorBadge}
                onChange={(e) => setColorBadge(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {BADGE_COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modalType === 'department' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief department overview..."
                className="w-full bg-slate-900/90 text-slate-100 rounded-xl border border-slate-700/80 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
