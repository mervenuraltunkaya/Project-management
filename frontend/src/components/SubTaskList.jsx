import { useEffect, useState } from "react";
import AssigneeDropdown from "./AssigneeDropdown";

import {
  CheckCircle2,
  Plus,
  User,
  Calendar,
  Trash2,
  Edit3,
  X,
  Check,
  AlertCircle,
} from "lucide-react";

// Alt görev yönetimi yapan bileşen
export default function SubTaskList({
  taskId,
  expanded,
  employees = [],
  onTaskStatusChange,
  onSubtaskChange,
  taskData,
}) {
  // State'ler
  const [subtasks, setSubtasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTask, setEditingTask] = useState({
    name: "",
    description: "",
    assignedToId: "",
  });
  const [newSubTask, setNewSubTask] = useState({
    name: "",
    description: "",
    assignedToId: "",
  });
  const [errors, setErrors] = useState({});
  const [localEmployees, setLocalEmployees] = useState(employees);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [completeConfirm, setCompleteConfirm] = useState(null);

  // Çalışan listesini güncelle
  useEffect(() => {
    if (employees && employees.length > 0) {
      setLocalEmployees(employees);
    }
  }, [employees]);

  // Çalışanları API'den yükle (eğer prop olarak gelmediyse)
  useEffect(() => {
    const fetchEmployees = async () => {
      if (employees.length > 0) return;

      try {
        const res = await fetch("http://localhost:8080/api/employees", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setLocalEmployees(data);
        }
      } catch (err) {
        console.error("Çalışanlar yüklenemedi:", err);
      }
    };

    fetchEmployees();
  }, [employees.length]);

  // Ana göreve atanan kişileri bul
  const getTaskAssignees = () => {
    if (!taskData) return [];

    const assignees = [];
    const availableEmployees =
      employees.length > 0 ? employees : localEmployees;

    // Farklı atama formatlarını kontrol et
    if (
      taskData.assignedEmployees &&
      Array.isArray(taskData.assignedEmployees)
    ) {
      assignees.push(...taskData.assignedEmployees);
    } else if (
      taskData.assignedToIds &&
      Array.isArray(taskData.assignedToIds)
    ) {
      taskData.assignedToIds.forEach((employeeId) => {
        const employee = availableEmployees.find(
          (emp) => emp.id === employeeId
        );
        if (employee) assignees.push(employee);
      });
    } else if (taskData.assignedTo && Array.isArray(taskData.assignedTo)) {
      assignees.push(...taskData.assignedTo);
    } else if (taskData.assignedTo && !Array.isArray(taskData.assignedTo)) {
      assignees.push(taskData.assignedTo);
    } else if (taskData.assignedToId) {
      const employee = availableEmployees.find(
        (emp) => emp.id === taskData.assignedToId
      );
      if (employee) assignees.push(employee);
    }

    // Tekrar edenleri kaldır
    const uniqueAssignees = assignees.filter(
      (assignee, index, array) =>
        array.findIndex((a) => a.id === assignee.id) === index
    );

    return uniqueAssignees;
  };

  // Alt görevler değiştiğinde ana görevin durumunu güncelle
  useEffect(() => {
    if (subtasks.length === 0) return;

    const allCompleted = subtasks.every((subtask) => subtask.status === "DONE");

    if (allCompleted && onTaskStatusChange) {
      onTaskStatusChange(taskId, "COMPLETED");
    }

    if (onSubtaskChange && subtasks.length > 0) {
      const subtaskProgress = subtasks.map((st) => ({
        id: st.id,
        completed: st.status === "DONE",
      }));

      const timeoutId = setTimeout(() => {
        onSubtaskChange(taskId, subtaskProgress);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [subtasks.length, JSON.stringify(subtasks.map((s) => s.status))]);

  // Alt görevleri API'den çek
  const fetchSubtasks = async () => {
    if (!expanded) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/subtasks/task/${taskId}`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Alt görevler yüklenemedi");

      const data = await res.json();

      // Çalışan bilgilerini tamamla
      const enrichedSubtasks = data.map((subtask) => {
        if (subtask.assignedTo && subtask.assignedTo.id) {
          const availableEmployees =
            employees.length > 0 ? employees : localEmployees;
          const fullEmployee = availableEmployees.find(
            (emp) => emp.id === subtask.assignedTo.id
          );
          if (fullEmployee) {
            return { ...subtask, assignedTo: fullEmployee };
          }
        }
        return subtask;
      });

      setSubtasks(enrichedSubtasks);
      setErrors({});
    } catch (err) {
      console.error(err);
      setSubtasks([]);
      setErrors({ general: "Alt görevler yüklenemedi" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtasks();
  }, [taskId, expanded, employees.length, localEmployees.length]);

  if (!expanded) return null;

  // Alt görev durumunu değiştir (tamamla/geri al)
  const handleToggleSubTask = (subtaskId, currentStatus) => {
    const subtask = subtasks.find((st) => st.id === subtaskId);

    if (currentStatus === "TODO") {
      setCompleteConfirm({
        id: subtaskId,
        name: subtask.name,
      });
    } else {
      updateSubtaskStatus(subtaskId, "TODO");
    }
  };

  // Alt görev durumunu güncelle
  const updateSubtaskStatus = async (subtaskId, newStatus) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/subtasks/${subtaskId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error("Alt görev durumu güncellenemedi");

      const updatedSubtask = await res.json();

      // Çalışan bilgisini tamamla
      if (updatedSubtask.assignedTo && updatedSubtask.assignedTo.id) {
        const availableEmployees =
          employees.length > 0 ? employees : localEmployees;
        const fullEmployee = availableEmployees.find(
          (emp) => emp.id === updatedSubtask.assignedTo.id
        );
        if (fullEmployee) {
          updatedSubtask.assignedTo = fullEmployee;
        }
      }

      setSubtasks((prev) =>
        prev.map((st) => (st.id === subtaskId ? updatedSubtask : st))
      );

      setCompleteConfirm(null);
    } catch (err) {
      console.error(err);
      setErrors({ general: "Alt görev durumu güncellenemedi" });
    }
  };

  // Alt görev sil
  const handleDeleteSubTask = async (subtaskId) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/subtasks/${subtaskId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Alt görev silinemedi");

      setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      setErrors({ general: "Alt görev silinemedi" });
    }
  };

  // Düzenleme modunu başlat
  const startEdit = (subtask) => {
    setEditingId(subtask.id);
    setEditingTask({
      name: subtask.name,
      description: subtask.description || "",
      assignedToId: subtask.assignedTo?.id?.toString() || "",
    });
  };

  // Düzenlemeyi kaydet
  const saveEdit = async () => {
    if (!editingTask.name.trim()) {
      setErrors({ edit: "Alt görev adı zorunludur" });
      return;
    }

    try {
      const payload = {
        name: editingTask.name.trim(),
        description: editingTask.description || null,
        assignedTo: editingTask.assignedToId
          ? { id: parseInt(editingTask.assignedToId) }
          : null,
      };

      const res = await fetch(
        `http://localhost:8080/api/subtasks/${editingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Alt görev güncellenemedi");

      const updated = await res.json();

      // Çalışan bilgisini tamamla
      if (updated.assignedTo && updated.assignedTo.id) {
        const availableEmployees =
          employees.length > 0 ? employees : localEmployees;
        const fullEmployee = availableEmployees.find(
          (emp) => emp.id === updated.assignedTo.id
        );
        if (fullEmployee) {
          updated.assignedTo = fullEmployee;
        }
      }

      setSubtasks((prev) =>
        prev.map((st) => (st.id === editingId ? updated : st))
      );
      setEditingId(null);
      setErrors({});
    } catch (err) {
      console.error(err);
      setErrors({ edit: "Alt görev güncellenemedi" });
    }
  };

  // Yeni alt görev ekle
  const handleAddSubTask = async () => {
    if (!newSubTask.name.trim()) {
      setErrors({ add: "Alt görev adı zorunludur" });
      return;
    }

    const payload = {
      name: newSubTask.name.trim(),
      description: newSubTask.description || null,
      task: { id: taskId },
      assignedTo: newSubTask.assignedToId
        ? { id: parseInt(newSubTask.assignedToId) }
        : undefined,
    };

    try {
      const res = await fetch("http://localhost:8080/api/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Alt görev eklenemedi");

      const newSubtaskFromApi = await res.json();

      // Çalışan bilgisini tamamla
      if (newSubtaskFromApi.assignedTo && newSubtaskFromApi.assignedTo.id) {
        const availableEmployees =
          employees.length > 0 ? employees : localEmployees;
        const fullEmployee = availableEmployees.find(
          (emp) => emp.id === newSubtaskFromApi.assignedTo.id
        );
        if (fullEmployee) {
          newSubtaskFromApi.assignedTo = fullEmployee;
        }
      }

      setSubtasks((prev) => [...prev, newSubtaskFromApi]);

      setNewSubTask({ name: "", description: "", assignedToId: "" });
      setShowForm(false);
      setErrors({});
    } catch (err) {
      console.error(err);
      setErrors({ add: err.message });
    }
  };

  // Durum rengini belirle
  const getStatusColor = (status) =>
    status === "DONE"
      ? "text-green-600 bg-green-50 border-green-200"
      : "text-gray-600 bg-gray-50 border-gray-200";

  // Tarihi formatla
  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const taskAssignees = getTaskAssignees();

  return (
    <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
      <div className="p-6 space-y-4">
        {/* Başlık ve Yeni Görev Butonu */}
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-blue-600" />
            Alt Görevler ({subtasks.length})
            {subtasks.filter((st) => st.status === "DONE").length > 0 && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {subtasks.filter((st) => st.status === "DONE").length}/
                {subtasks.length} Tamamlandı
              </span>
            )}
          </h4>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm font-medium"
            >
              <Plus size={16} /> Yeni Alt Görev
            </button>
          )}
        </div>

        {/* Yükleme göstergesi */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">
              Alt görevler yükleniyor...
            </span>
          </div>
        )}

        {/* Hata mesajları */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errors.general}
          </div>
        )}

        {/* Ana görev atama bilgileri */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2 flex items-center gap-2">
            <User size={16} />
            Ana görev atama bilgileri:
          </p>

          {taskAssignees.length > 0 ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {taskAssignees.map((assignee) => (
                  <span
                    key={assignee.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                  >
                    <User size={12} />
                    {assignee.firstName} {assignee.lastName}
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-600">
                Alt görevler sadece bu kişilere atanabilir.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-amber-700 mb-1 flex items-center gap-1">
                <AlertCircle size={12} />
                Bu görevde atanmış kişi bulunmuyor
              </p>
              <p className="text-xs text-blue-600">
                Alt görevlerde kişi ataması yapılabilmesi için önce ana görevde
                atama yapılmalıdır.
              </p>
            </div>
          )}
        </div>

        {/* Yeni alt görev formu */}
        {showForm && (
          <div className="border border-gray-300 bg-white shadow-sm rounded-xl p-6">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-gray-600" />
              Yeni Alt Görev Ekle
            </h5>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Görev Adı *
                </label>
                <input
                  type="text"
                  value={newSubTask.name}
                  onChange={(e) =>
                    setNewSubTask((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="Örn: API dokümantasyonu hazırla"
                />
                {errors.add && (
                  <p className="text-red-600 text-sm mt-1">{errors.add}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={newSubTask.description}
                  onChange={(e) =>
                    setNewSubTask((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none"
                  rows="3"
                  placeholder="Alt görev hakkında detaylar..."
                />
              </div>

              <AssigneeDropdown
                taskAssignees={taskAssignees}
                newSubTask={newSubTask}
                setNewSubTask={setNewSubTask}
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setNewSubTask({
                      name: "",
                      description: "",
                      assignedToId: "",
                    });
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddSubTask}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Alt Görev Ekle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Boş durum mesajı */}
        {!loading && subtasks.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">Henüz alt görev yok</p>
            <p className="text-gray-400 text-sm mb-6">
              Bu görevi daha küçük parçalara bölebilirsiniz
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm font-medium"
              >
                <Plus size={18} /> İlk Alt Görevi Ekle
              </button>
            )}
          </div>
        )}

        {/* Alt görevler listesi */}
        <div className="space-y-3">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className={`group border rounded-xl p-4 transition-all hover:shadow-md ${getStatusColor(
                subtask.status
              )}`}
            >
              {editingId === subtask.id ? (
                /* Düzenleme modu */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingTask.name}
                    onChange={(e) =>
                      setEditingTask((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                    placeholder="Alt görev adı"
                  />

                  <textarea
                    value={editingTask.description}
                    onChange={(e) =>
                      setEditingTask((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none"
                    rows="2"
                    placeholder="Açıklama (opsiyonel)"
                  />

                  <select
                    value={editingTask.assignedToId}
                    onChange={(e) =>
                      setEditingTask((prev) => ({
                        ...prev,
                        assignedToId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                    disabled={taskAssignees.length === 0}
                  >
                    <option value="">
                      {taskAssignees.length > 0
                        ? "Atanan kişi seçin"
                        : "Ana görevde atama yapılmamış"}
                    </option>
                    {taskAssignees.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.firstName} {person.lastName}
                        {person.position && ` - ${person.position}`}
                      </option>
                    ))}
                  </select>

                  {errors.edit && (
                    <p className="text-red-600 text-sm">{errors.edit}</p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <X size={14} /> İptal
                    </button>
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Check size={14} /> Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                /* Görüntüleme modu */
                <div className="flex items-start gap-4">
                  <button
                    onClick={() =>
                      handleToggleSubTask(subtask.id, subtask.status)
                    }
                    className="flex-shrink-0 mt-0.5"
                  >
                    {subtask.status === "DONE" ? (
                      <CheckCircle2 size={20} className="text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-green-400 transition-colors"></div>
                    )}
                  </button>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h5
                        className={`font-medium text-gray-900 ${
                          subtask.status === "DONE"
                            ? "line-through text-gray-500"
                            : ""
                        }`}
                      >
                        {subtask.name}
                      </h5>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(subtask)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(subtask.id)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {subtask.description && (
                      <p
                        className={`text-sm mt-1 ${
                          subtask.status === "DONE"
                            ? "text-gray-400"
                            : "text-gray-600"
                        }`}
                      >
                        {subtask.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      {subtask.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>
                            {subtask.assignedTo.firstName}{" "}
                            {subtask.assignedTo.lastName}
                          </span>
                        </div>
                      )}

                      {subtask.createdDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>
                            Oluşturuldu: {formatDate(subtask.createdDate)}
                          </span>
                        </div>
                      )}

                      {subtask.status === "DONE" && subtask.updatedDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-green-500" />
                          <span>
                            Tamamlandı: {formatDate(subtask.updatedDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tamamlama onay modalı */}
        {completeConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Alt Görevi Tamamla
                  </h3>
                  <p className="text-sm text-gray-600">
                    "{completeConfirm.name}"
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Bu alt görevi tamamlandı olarak işaretlemek istediğinizden emin
                misiniz?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setCompleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={() =>
                    updateSubtaskStatus(completeConfirm.id, "DONE")
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Tamamlandı İşaretle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Silme onay modalı */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Alt Görevi Sil
              </h3>
              <p className="text-gray-600 mb-6">
                Bu alt görevi silmek istediğinizden emin misiniz? Bu işlem geri
                alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDeleteSubTask(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
