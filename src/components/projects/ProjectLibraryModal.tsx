/**
 * Project Library & Factory Presets Modal Component
 * Load factory templates (Synthwave, Cyber Rock, Future Trap) and save custom user sessions
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, FolderOpen, Save, Trash2, Play } from 'lucide-react';
import { storageService, FACTORY_PRESETS } from '../../utils/storage';
import { ProjectData, PresetLibraryItem } from '../../types/project';
import { ScaleName } from '../../types/audio';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface ProjectLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBpm: number;
  currentScale: ScaleName;
  currentRootNote: string;
  onLoadPreset: (preset: PresetLibraryItem) => void;
  onNotify: (msg: string) => void;
}

export const ProjectLibraryModal: React.FC<ProjectLibraryModalProps> = ({
  isOpen,
  onClose,
  currentBpm,
  currentScale,
  currentRootNote,
  onLoadPreset,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'saved'>('presets');
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSavedProjects(storageService.getProjects());
    }
  }, [isOpen]);

  const handleSaveCurrent = () => {
    if (!newTitle.trim()) return;
    const project: ProjectData = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      bpm: currentBpm,
      scale: currentScale,
      rootNote: currentRootNote,
      tracks: [],
      synthParams: {} as any,
      guitarParams: {} as any,
      bassParams: {} as any,
      drumSequence: {} as any,
      micParams: {} as any,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storageService.saveProject(project);
    setSavedProjects(storageService.getProjects());
    setNewTitle('');
    onNotify(`Saved project "${project.title}"`);
  };

  const handleDelete = (id: string) => {
    storageService.deleteProject(id);
    setSavedProjects(storageService.getProjects());
    onNotify('Deleted project from local storage');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Library & Presets"
      subtitle="Load high-craftsmanship studio templates or manage your saved tracks"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Button
            variant={activeTab === 'presets' ? 'cyan' : 'ghost'}
            size="sm"
            icon={<Sparkles size={14} />}
            onClick={() => setActiveTab('presets')}
          >
            Factory Presets
          </Button>
          <Button
            variant={activeTab === 'saved' ? 'purple' : 'ghost'}
            size="sm"
            icon={<FolderOpen size={14} />}
            onClick={() => setActiveTab('saved')}
          >
            Saved Sessions ({savedProjects.length})
          </Button>
        </div>

        {/* Tab 1: Factory Templates */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FACTORY_PRESETS.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl glass-panel border border-white/10 hover:border-cyan-400/50 flex flex-col justify-between gap-3 transition-all group"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {p.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100 mt-2 font-display">{p.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[11px] font-mono text-slate-400">
                    {p.bpm} BPM • Key: {p.rootNote}
                  </span>
                  <Button
                    variant="cyan"
                    size="sm"
                    icon={<Play size={12} />}
                    onClick={() => {
                      onLoadPreset(p);
                      onNotify(`Loaded preset: ${p.title}`);
                      onClose();
                    }}
                  >
                    Load
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: User Saved Projects */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {/* Save New Session Bar */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2">
              <input
                type="text"
                placeholder="Session name (e.g. Midnight Cyber Jam)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#121520] text-xs text-slate-100 border border-white/20"
              />
              <Button variant="purple" size="sm" icon={<Save size={14} />} onClick={handleSaveCurrent}>
                Save Active
              </Button>
            </div>

            {/* List of Saved Projects */}
            {savedProjects.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No saved user sessions found.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {savedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">{proj.title}</h5>
                      <span className="text-[10px] font-mono text-slate-400">
                        {proj.bpm} BPM • Key {proj.rootNote} • {new Date(proj.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(proj.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
