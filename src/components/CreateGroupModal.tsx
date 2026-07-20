import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, X } from "lucide-react";
import { Character } from "../types";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  groupName: string;
  setGroupName: (name: string) => void;
  selectedParticipants: string[];
  setSelectedParticipants: React.Dispatch<React.SetStateAction<string[]>>;
  handleCreateGroup: (e: React.FormEvent) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  characters,
  groupName,
  setGroupName,
  selectedParticipants,
  setSelectedParticipants,
  handleCreateGroup
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
              <div className="flex items-center gap-2 text-indigo-400">
                <Users className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Создать групповой чат</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4 overflow-y-auto custom-scrollbar text-xs">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-bold">Название группы *</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Например: Семья в сборе, Курилка-Пятница"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-bold">Выберите участников группы *</label>
                <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {characters.map(char => {
                    const isChecked = selectedParticipants.includes(char.id);
                    return (
                      <label
                        key={char.id}
                        className="flex items-center gap-3.5 p-1.5 hover:bg-neutral-900 rounded-lg cursor-pointer text-xs select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedParticipants(prev => prev.filter(id => id !== char.id));
                            } else {
                              setSelectedParticipants(prev => [...prev, char.id]);
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="font-semibold text-neutral-200">{char.name}</span>
                        <span className="text-[10px] text-neutral-500">({char.role})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-950 cursor-pointer"
                >
                  Создать группу
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
