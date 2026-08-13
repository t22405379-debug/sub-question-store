const STORAGE_KEYS = {
  PRACTICED_PAPERS: 'cse_study_practiced_papers_v1',
  STUDY_NOTES: 'cse_study_notes_v1',
};

class StudyTrackerService {
  public getPracticedPapers(): string[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRACTICED_PAPERS) || '[]');
    } catch {
      return [];
    }
  }

  public togglePracticed(paperId: string): boolean {
    const list = this.getPracticedPapers();
    const isPracticed = list.includes(paperId);
    const updated = isPracticed ? list.filter((id) => id !== paperId) : [...list, paperId];
    localStorage.setItem(STORAGE_KEYS.PRACTICED_PAPERS, JSON.stringify(updated));
    return !isPracticed;
  }

  public isPracticed(paperId: string): boolean {
    return this.getPracticedPapers().includes(paperId);
  }

  public getNote(paperId: string): string {
    try {
      const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDY_NOTES) || '{}');
      return notes[paperId] || '';
    } catch {
      return '';
    }
  }

  public saveNote(paperId: string, noteText: string): void {
    try {
      const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDY_NOTES) || '{}');
      if (!noteText.trim()) {
        delete notes[paperId];
      } else {
        notes[paperId] = noteText.trim();
      }
      localStorage.setItem(STORAGE_KEYS.STUDY_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save study note', e);
    }
  }
}

export const studyTrackerService = new StudyTrackerService();
