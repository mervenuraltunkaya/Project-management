import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";
import UpdateProjectModal from "./UpdateProjectModal";
import SubTaskList from "./SubTaskList";
import NewTaskForm from "./NewTaskForm";

// Proje detay sayfası - görevlerle birlikte tek proje yönetimi
export default function ProjectDetail() {
  const { id } = useParams(); // URL'den proje ID'sini al

  // Temel state'ler
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [currentProgress, setCurrentProgress] = useState(0);

  // Yeni görev modal state'leri
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(false);
  const [errors, setErrors] = useState({});
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "Orta",
    startDate: "",
    endDate: "",
    projectId: parseInt(id) || 0,
    assignedToIds: [],
    createdById: "",
  });

  // Silme onay modal
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    taskId: null,
    taskTitle: "",
  });

  const today = new Date().toISOString().split("T")[0];
  const priorities = ["Düşük", "Orta", "Yüksek"];

  // İlerleme hesaplama - alt görevleri de dahil eder
  const calculateProjectProgress = async () => {
    if (!tasks || tasks.length === 0) return 0;

    try {
      let totalItems = 0;
      let completedItems = 0;

      const subtaskPromises = tasks.map(async (task) => {
        try {
          const response = await fetch(
            `http://localhost:8080/api/subtasks/task/${task.id}`,
            { credentials: "include" }
          );

          if (response.ok) {
            const subtasks = await response.json();

            if (subtasks.length === 0) {
              // Alt görev yoksa ana görevi say
              totalItems += 1;
              if (task.status === "COMPLETED" || task.status === "DONE") {
                completedItems += 1;
              }
            } else {
              // Alt görevler varsa sadece onları say
              totalItems += subtasks.length;
              completedItems += subtasks.filter(
                (st) => st.status === "DONE"
              ).length;
            }
          } else {
            // API hatası durumunda ana görevi say
            totalItems += 1;
            if (task.status === "COMPLETED" || task.status === "DONE") {
              completedItems += 1;
            }
          }
        } catch (error) {
          console.warn(`Task ${task.id} subtask'ları alınamadı:`, error);
          totalItems += 1;
          if (task.status === "COMPLETED" || task.status === "DONE") {
            completedItems += 1;
          }
        }
      });

      await Promise.all(subtaskPromises);
      return totalItems > 0
        ? Math.round((completedItems / totalItems) * 100)
        : 0;
    } catch (error) {
      console.error("Progress hesaplama hatası:", error);
      return currentProgress;
    }
  };

  // Progress hesapla ve güncelle
  const updateProgressDisplay = async () => {
    const newProgress = await calculateProjectProgress();

    if (newProgress !== currentProgress) {
      setCurrentProgress(newProgress);

      // Backend'e de gönder
      try {
        const response = await fetch(
          `http://localhost:8080/api/projects/${id}/progress`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ progress: newProgress }),
          }
        );

        if (response.ok) {
          const updatedProject = await response.json();
          setProject((prev) => ({
            ...prev,
            progress: updatedProject.progress,
          }));
        }
      } catch (error) {
        console.error("Backend progress güncellemesi başarısız:", error);
      }
    }
  };

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    if (!id || isNaN(parseInt(id))) {
      console.error("Geçersiz proje ID:", id);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const [projectRes, tasksRes, employeesRes] = await Promise.all([
          fetch(`http://localhost:8080/api/projects/${id}`, {
            credentials: "include",
          }),
          fetch(`http://localhost:8080/api/tasks/project/${id}`, {
            credentials: "include",
          }),
          fetch("http://localhost:8080/api/employees", {
            credentials: "include",
          }),
        ]);

        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProject(projectData);
          setCurrentProgress(projectData.progress || 0);
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const tasksWithCompleted = Array.isArray(tasksData)
            ? tasksData.map((task) => ({
                ...task,
                completed:
                  task.status === "COMPLETED" || task.status === "DONE",
              }))
            : [];
          setTasks(tasksWithCompleted);
        }

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          setEmployees(Array.isArray(employeesData) ? employeesData : []);
        }
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
      }
    };

    fetchInitialData();
  }, [id]);

  // Görevler değiştiğinde progress'i güncelle
  useEffect(() => {
    if (tasks.length > 0) {
      const timeoutId = setTimeout(() => {
        updateProgressDisplay();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [tasks]);

  // Görev durumunu değiştir
  const handleTaskStatusChange = async (taskId, newStatus) => {
    console.log("Task status güncelleniyor:", taskId, newStatus);

    const backendStatus = newStatus === "COMPLETED" ? "DONE" : newStatus;

    try {
      const response = await fetch(
        `http://localhost:8080/api/tasks/${taskId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: backendStatus }),
        }
      );

      if (response.ok) {
        const updatedTask = await response.json();

        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...updatedTask,
                  completed: updatedTask.status === "DONE",
                }
              : task
          )
        );

        setTimeout(() => {
          updateProgressDisplay();
        }, 200);
      }
    } catch (error) {
      console.error("Task status güncelleme hatası:", error);
    }
  };

  // Alt görev değişiminde progress'i güncelle
  const handleSubtaskChange = () => {
    setTimeout(() => {
      updateProgressDisplay();
    }, 300);
  };

  // Görev sil
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/tasks/${taskId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));

        setExpandedTasks((prev) => {
          const newExpanded = new Set(prev);
          newExpanded.delete(taskId);
          return newExpanded;
        });

        setTimeout(() => {
          updateProgressDisplay();
        }, 200);

        console.log("Görev başarıyla silindi");
      }
    } catch (error) {
      console.error("Görev silinemedi:", error);
      setErrors({ general: `Görev silinirken hata oluştu: ${error.message}` });
    }
  };

  // Silme modalını göster
  const showDeleteConfirmation = (task) => {
    setDeleteConfirm({
      show: true,
      taskId: task.id,
      taskTitle: task.title,
    });
  };

  // Silme modalını gizle
  const hideDeleteConfirmation = () => {
    setDeleteConfirm({
      show: false,
      taskId: null,
      taskTitle: "",
    });
  };

  // Silme işlemini onayla
  const confirmDelete = async () => {
    if (deleteConfirm.taskId) {
      await handleDeleteTask(deleteConfirm.taskId);
      hideDeleteConfirmation();
    }
  };

  // Form input değişikliği
  const handleInputChange = (field, value) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  // Form sıfırla
  const resetForm = () => {
    setTaskForm({
      title: "",
      description: "",
      status: "TODO",
      priority: "Orta",
      startDate: "",
      endDate: "",
      projectId: parseInt(id) || 0,
      assignedToIds: [],
      createdById: "",
    });
    setErrors({});
    setEditingTask(false);
  };

  // Görev kaydet
  const handleTaskSubmit = async () => {
    // Form kontrolü
    const newErrors = {};
    if (!taskForm.title.trim()) newErrors.title = "Başlık zorunludur";
    if (!taskForm.startDate)
      newErrors.startDate = "Başlangıç tarihi zorunludur";
    if (!taskForm.endDate) newErrors.endDate = "Bitiş tarihi zorunludur";
    if (!taskForm.createdById)
      newErrors.createdById = "Oluşturan kişi seçilmelidir";

    // Tarih kontrolü
    if (taskForm.startDate && taskForm.endDate) {
      if (new Date(taskForm.startDate) > new Date(taskForm.endDate)) {
        newErrors.endDate = "Bitiş tarihi başlangıç tarihinden sonra olmalıdır";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const priorityMapping = { Düşük: "LOW", Orta: "MEDIUM", Yüksek: "HIGH" };
    const backendPriority = priorityMapping[taskForm.priority] || "MEDIUM";

    // Tarih formatla
    const formatToLocalDateTime = (dateString, isEndOfDay = false) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      if (isEndOfDay) {
        date.setHours(23, 59, 59, 999);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date.toISOString().slice(0, -1);
    };

    // Görev verisi hazırla
    const taskData = {
      title: taskForm.title.trim(),
      description: taskForm.description?.trim() || null,
      priority: backendPriority,
      startDate: formatToLocalDateTime(taskForm.startDate, false),
      endDate: formatToLocalDateTime(taskForm.endDate, true),
      project: { id: parseInt(id) },
      createdBy: { id: parseInt(taskForm.createdById) },
    };

    if (taskForm.assignedToIds && taskForm.assignedToIds.length > 0) {
      taskData.assignedEmployees = taskForm.assignedToIds.map((id) => ({
        id: parseInt(id),
      }));
    }

    const url = editingTask
      ? `http://localhost:8080/api/tasks/${editingTask.id}`
      : "http://localhost:8080/api/tasks";
    const method = editingTask ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
        credentials: "include",
      });

      if (response.ok) {
        const savedTask = await response.json();

        // Çalışan bilgilerini tamamla
        if (
          savedTask.assignedEmployees &&
          Array.isArray(savedTask.assignedEmployees)
        ) {
          savedTask.assignedEmployees = savedTask.assignedEmployees.map(
            (assignedEmp) => {
              if (assignedEmp.id && !assignedEmp.firstName) {
                const fullEmployee = employees.find(
                  (emp) => emp.id === assignedEmp.id
                );
                return fullEmployee || assignedEmp;
              }
              return assignedEmp;
            }
          );
        }

        if (editingTask) {
          setTasks((prev) =>
            prev.map((t) => (t.id === savedTask.id ? savedTask : t))
          );
        } else {
          setTasks((prev) => [...prev, savedTask]);
        }

        setTimeout(() => {
          updateProgressDisplay();
        }, 200);

        setShowTaskModal(false);
        resetForm();
        setErrors({});
      } else {
        const errorText = await response.text();
        setErrors({ general: `Görev kaydedilemedi: ${errorText}` });
      }
    } catch (error) {
      console.error("Task submit hatası:", error);
      setErrors({ general: `Ağ hatası: ${error.message}` });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleTaskSubmit();
  };

  // Modal açma fonksiyonları
  const handleOpenTaskModal = () => {
    setTaskForm((prev) => ({ ...prev, projectId: parseInt(id) }));
    setShowTaskModal(true);
  };

  const handleEdit = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleProjectUpdate = (updatedProject) => {
    setProject(updatedProject);
    setCurrentProgress(updatedProject.progress || 0);
    setIsModalOpen(false);
  };

  // Görev genişlet/daralt
  const toggleTask = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // CSS class'ları için yardımcı fonksiyonlar
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "tamamlandı":
      case "completed":
      case "done":
        return "text-green-600 bg-green-50";
      case "devam ediyor":
      case "in_progress":
        return "text-blue-600 bg-blue-50";
      case "beklemede":
      case "pending":
      case "todo":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "yüksek":
      case "high":
        return "text-red-600 bg-red-50";
      case "orta":
      case "medium":
        return "text-orange-600 bg-orange-50";
      case "düşük":
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  // Yükleme durumu
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Proje başlığı ve genel bilgiler */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {project.name}
            </h1>
            <p className="text-gray-700 text-lg leading-relaxed max-w-4xl">
              {project.description}
            </p>
          </div>
          <button
            onClick={handleEdit}
            className="ml-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <Edit3 size={16} />
            Düzenle
          </button>
        </div>

        {/* Proje bilgi kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-500">Durum</span>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                project.status
              )}`}
            >
              {project.status}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-500">Öncelik</span>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                project.priority
              )}`}
            >
              {project.priority}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-500">
                Başlangıç
              </span>
            </div>
            <span className="text-gray-900 font-medium">
              {formatDate(project.startDate)}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-500">Bitiş</span>
            </div>
            <span className="text-gray-900 font-medium">
              {formatDate(project.endDate)}
            </span>
          </div>
        </div>

        {/* İlerleme çubuğu */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Proje İlerlemesi
            </h3>
            <span className="text-sm font-medium text-gray-600">
              {currentProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Görevler bölümü */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Görevler</h2>
          <button
            onClick={handleOpenTaskModal}
            className="ml-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <Plus size={16} />
            Yeni Görev
          </button>
        </div>

        {/* Hata mesajları */}
        {errors.general && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Görev listesi */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz görev eklenmemiş.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Görev başlığı ve durum ikonu */}
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => toggleTask(task.id)}
                    >
                      <div className="flex items-center gap-2">
                        {/* Açılır/kapanır ok */}
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown size={20} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-400" />
                        )}
                        {/* Tamamlanma durumu */}
                        {task.status === "COMPLETED" ||
                        task.status === "DONE" ||
                        task.completed ? (
                          <CheckCircle2 size={20} className="text-green-500" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <span
                        className={`font-medium ${
                          task.status === "DONE" || task.status === "COMPLETED"
                            ? "text-gray-500 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Görev bilgileri ve butonlar */}
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(task.endDate)}
                      </span>

                      {/* Silme butonu */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteConfirmation(task);
                        }}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                        title="Görevi Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Alt görevler - görev açıkken göster */}
                {expandedTasks.has(task.id) && (
                  <SubTaskList
                    taskId={task.id}
                    expanded={expandedTasks.has(task.id)}
                    employees={employees}
                    taskData={task}
                    onSubtaskChange={handleSubtaskChange}
                    onTaskStatusChange={handleTaskStatusChange}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Yeni görev formu */}
        {showTaskModal && (
          <NewTaskForm
            taskForm={taskForm}
            setTaskForm={setTaskForm}
            errors={errors}
            handleInputChange={handleInputChange}
            handleSubmit={handleFormSubmit}
            resetForm={resetForm}
            setShowModal={setShowTaskModal}
            editingTask={editingTask}
            priorities={priorities}
            employees={employees}
            projects={[project]}
            today={today}
            hideProjectSelection={true}
            currentProjectName={project.name}
          />
        )}
      </div>

      {/* Silme onay modalı */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Görevi Sil
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  "
                  <span className="font-medium">{deleteConfirm.taskTitle}</span>
                  " görevini silmek istediğinizden emin misiniz? Bu işlem geri
                  alınamaz ve görevle ilişkili tüm alt görevler de silinecektir.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={hideDeleteConfirmation}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proje bilgileri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Proje Bilgileri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-gray-500">Yaratılma Tarihi:</span>
            <span className="ml-2 text-gray-900">
              {formatDate(project.createdAt)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Son Güncellenme:</span>
            <span className="ml-2 text-gray-900">
              {formatDate(project.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Proje düzenleme modalı */}
      {isModalOpen && (
        <UpdateProjectModal
          project={project}
          onClose={handleCloseModal}
          onUpdate={handleProjectUpdate}
        />
      )}
    </div>
  );
}
