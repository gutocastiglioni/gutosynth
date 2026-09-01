/**
 * WAV Audio Export Modal Component
 * Mixes down active recorded stems into a master 16-bit 44.1kHz WAV file for direct download
 */

import React, { useState } from 'react';
import { Download, Music, CheckCircle2 } from 'lucide-react';
import { exportMasterMixdown } from '../../utils/wavExporter';
import { Modal } from '../common/Modal';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [filename, setFilename] = useState('synth-gesture-session');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const cleanName = filename.trim().endsWith('.wav') ? filename.trim() : `${filename.trim()}.wav`;
      await exportMasterMixdown(cleanName);
      onSuccess(`Successfully exported "${cleanName}"`);
      onClose();
    } catch (err) {
      console.error('Failed to export mixdown:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleExport}
      title="Export Master WAV Audio"
      subtitle="Render and download your multi-track gesture loop session"
      confirmText={isExporting ? 'Rendering...' : 'Download WAV'}
      confirmVariant="cyan"
      maxWidth="md"
    >
      <div className="space-y-5 text-slate-200 text-sm">
        {/* Filename Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Track File Name
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="my-gesture-jam"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#121520] text-slate-100 border border-white/20 text-sm font-mono focus:border-cyan-400"
            />
            <span className="text-slate-400 font-mono text-sm">.wav</span>
          </div>
        </div>

        {/* Audio Specs Info Card */}
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-bold font-display">
            <Music size={16} />
            <span>Master Export Specification</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
            <div>• Format: Linear PCM WAV</div>
            <div>• Sample Rate: 44,100 Hz</div>
            <div>• Bit Depth: 16-bit Stereo</div>
            <div>• Channels: Left & Right Stems</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
