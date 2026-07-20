import { useState, useEffect, FormEvent } from "react";
import { GroupChat } from "../types";
import { safeSetLocalStorage } from "../utils/helpers";

export function useGroupChats(
  setGossipNotification: (text: string | null) => void,
  onGroupCreated: (groupId: string) => void
) {
  const [groupChats, setGroupChats] = useState<GroupChat[]>(() => {
    const saved = localStorage.getItem("roleplay_group_chats_v2");
    return saved ? JSON.parse(saved) : [];
  });

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  useEffect(() => {
    safeSetLocalStorage("roleplay_group_chats_v2", JSON.stringify(groupChats));
  }, [groupChats]);

  const handleCreateGroup = (e: FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedParticipants.length === 0) {
      setGossipNotification("⚠️ Ошибка: Укажите название группы и выберите хотя бы одного участника!");
      setTimeout(() => setGossipNotification(null), 4000);
      return;
    }

    const groupId = `group-${Date.now()}`;
    const newGroup: GroupChat = {
      id: groupId,
      name: groupName.trim(),
      avatarColor: ["from-teal-400 to-emerald-600", "from-fuchsia-500 to-purple-800", "from-orange-400 to-red-600", "from-sky-400 to-blue-600"][Math.floor(Math.random() * 4)],
      participantIds: selectedParticipants
    };

    setGroupChats(prev => [...prev, newGroup]);
    onGroupCreated(groupId);
    setShowGroupModal(false);
    setGroupName("");
    setSelectedParticipants([]);

    setGossipNotification(`👥 Создан групповой чат "${newGroup.name}"!`);
    setTimeout(() => setGossipNotification(null), 4000);
  };

  return {
    groupChats,
    setGroupChats,
    showGroupModal,
    setShowGroupModal,
    groupName,
    setGroupName,
    selectedParticipants,
    setSelectedParticipants,
    handleCreateGroup
  };
}
