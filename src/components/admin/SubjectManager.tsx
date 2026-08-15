import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import { Subject } from '../../types';
import { usePapers } from '../../context/PaperContext';
import { storageService } from '../../services/storage';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Dialog } from '../ui/Dialog';
import { showToast } from '../ui/Toast';
import { showDeleteConfirmAlert, showSuccessAlert } from '../../services/alert';

export const SubjectManager: React.FC = () => {
  const { subjects, years, semesters, departments, refreshData, papers } = usePapers();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSem, setFilterSem] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [deptId, setDeptId] = useState(departments[0]?.id || 'dept-cse');
  const [yearId, setYearId] = useState(years[0]?.id || 'year-1');
  const [semesterId, setSemesterId] = useState(semesters[0]?.id || 'sem-1');
  const [credits, setCredits] = useState('3.0');
  const [syllabus, setSyllabus] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setDeptId(departments[0]?.id || 'dept-cse');
    setYearId(years[0]?.id || 'year-1');
    setSemesterId(semesters[0]?.id || 'sem-1');
    setCredits('3.0');
    setSyllabus('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Subject) => {
    setEditingSubject(s);
    setCode(s.code);
    setName(s.name);
    setDeptId(s.department_id || departments[0]?.id || 'dept-cse');
    setYearId(s.year_id);
    setSemesterId(s.semester_id);
    setCredits(s.credits.toString());
    setSyllabus(s.syllabus_overview || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setFormError('Subject code and title are required.');
      return;
    }

    try {
      if (editingSubject) {
        storageService.updateSubject(editingSubject.id, {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          department_id: deptId,
          year_id: yearId,
          semester_id: semesterId,
          credits: parseFloat(credits) || 3.0,
          syllabus_overview: syllabus.trim(),
        });
        showSuccessAlert('Subject Updated', `${code} has been updated.`);
      } else {
        storageService.addSubject({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          department_id: deptId,
          year_id: yearId,
          semester_id: semesterId,
          credits: parseFloat(credits) || 3.0,
          syllabus_overview: syllabus.trim(),
        });
        showSuccessAlert('Subject Created', `${code} (${name}) was added to the curriculum.`);
      }

      // Automatically sync live Cloudflare D1 database in background
      try {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            departments: storageService.getDepartments(),
            years: storageService.getYears(),
            semesters: storageService.getSemesters(),
            examTypes: storageService.getExamTypes(),
            subjects: storageService.getSubjects(),
            papers: storageService.getPapers(true),
          }),
        }).catch((e) => console.warn('D1 background sync note:', e));
      } catch (e) {
        console.warn('D1 background sync note:', e);
      }

      refreshData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save subject');
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    const paperCount = papers.filter((p) => p.subject_id === subject.id).length;
    const confirmed = await showDeleteConfirmAlert(
      `Course ${subject.code} (${subject.name})`,
      `Are you sure you want to delete ${subject.code}? ${
        paperCount > 0
          ? `WARNING: ${paperCount} question paper(s) linked to this course will also be permanently deleted.`
          : 'This course will be removed from curriculum lists.'
      }`
    );

    if (confirmed) {
      storageService.deleteSubject(subject.id);
      fetch(`/api/subjects/${encodeURIComponent(subject.id)}`, {
        method: 'DELETE',
      }).catch((e) => console.warn('D1 delete subject note:', e));

      refreshData();
      showSuccessAlert('Subject Deleted', `${subject.code} has been removed.`);
    }
  };

  // Filtered Subjects
  const displayedSubjects = subjects.filter((s) => {
    if (filterDept && s.department_id !== filterDept) return false;
    if (filterYear && s.year_id !== filterYear) return false;
    if (filterSem && s.semester_id !== filterSem) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Subject &amp; Course Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure course curriculum, codes, academic departments, years, and semesters
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openAddModal} className="text-xs shadow-md">
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Subject
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search subjects by code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {departments.length > 1 && (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          )}

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>

          <select
            value={filterSem}
            onChange={(e) => setFilterSem(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Semesters</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Course Code</th>
                <th className="px-5 py-3.5">Subject Title</th>
                <th className="px-5 py-3.5">Placement</th>
                <th className="px-5 py-3.5">Credits</th>
                <th className="px-5 py-3.5">Archived Papers</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {displayedSubjects.length > 0 ? (
                displayedSubjects.map((subject) => {
                  const dept = departments.find((d) => d.id === subject.department_id);
                  const year = years.find((y) => y.id === subject.year_id);
                  const semester = semesters.find((s) => s.id === subject.semester_id);
                  const paperCount = papers.filter((p) => p.subject_id === subject.id).length;

                  return (
                    <tr key={subject.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-indigo-400">
                        {subject.code}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-100 block">{subject.name}</span>
                        {subject.syllabus_overview && (
                          <span className="text-[11px] text-slate-500 truncate block max-w-xs mt-0.5">
                            {subject.syllabus_overview}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        <span className="font-semibold text-emerald-400 mr-1.5">{dept?.code || 'DEPT'}</span>
                        <span>•</span>
                        <span className="ml-1.5">{year?.name || 'Year'} • {semester?.name || 'Sem'}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">{subject.credits}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300">
                          {paperCount} papers
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(subject)}
                            title="Edit Subject"
                            className="text-slate-400 hover:text-indigo-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubject(subject)}
                            title="Delete Subject"
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No subjects match the search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Subject Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        description="Enter the course code, title, and curriculum placement"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Course Code
              </label>
              <Input
                placeholder="e.g. CSE 1101, EEE 2101"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Credits
              </label>
              <Input
                type="number"
                step="0.5"
                placeholder="3.0"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Subject Name / Title
            </label>
            <Input
              placeholder="e.g. Programming Fundamentals"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Select
              label="Department / Faculty"
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Academic Year"
              value={yearId}
              onChange={(e) => setYearId(e.target.value)}
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </Select>

            <Select
              label="Semester"
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Syllabus Summary (Optional)
            </label>
            <textarea
              rows={2}
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              placeholder="Key topic summary for student reference..."
              className="w-full bg-slate-900/90 text-slate-100 rounded-xl border border-slate-700/80 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
