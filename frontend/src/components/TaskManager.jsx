import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  User,
  Flag,
  CheckSquare,
  Crown,
} from "lucide-react";
import NewTaskForm from "./NewTaskForm";
import {
  getCurrentUserId,
  getCurrentUser,
  isAdmin,
  isUser,
  filterTasksForUser,
} from "../utils/roleUtils";

const TaskManager = () => {
  const navigate = useNavigate();

  // Mevcut kullanıcı bilgileri
  const [currentUserId] = useState(getCurrentUserId());
  const [currentUser] = useState(getCurrentUser());

  // Ana veri state'leri
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  // UI state'leri
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filtreleme state'leri
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // Form state'i
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    projectId: "",
    assignedToIds: [],
    createdById: "",
    startDate: "",
    endDate: "",
  });

  const [errors, setErrors] = useState({});

  // Sabitler
  const API_BASE = "http://localhost:8080/api";
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const statuses = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
  const today = new Date().toISOString().split("T")[0];

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    loadData();
  }, []);

  // Görevler ve filtre kriterleri değiştiğinde filtreleme yap
  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, selectedPriority, selectedProject, selectedEmployee]);

  /**
   * API'den tüm verileri (görevler, çalışanlar, projeler) getirir
   */
  const loadData = async () => {
    try {
      setLoading(true);

      // Paralel olarak tüm verileri getir
      const [tasksRes, employeesRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/tasks`),
        fetch(`${API_BASE}/employees`),
        fetch(`${API_BASE}/projects`),
      ]);

      if (tasksRes.ok && employeesRes.ok && projectsRes.ok) {
        const tasksData = await tasksRes.json();
        const employeesData = await employeesRes.json();
        const projectsData = await projectsRes.json();

        // Görevleri kullanıcı rolüne göre filtrele
        const filteredTasksData = filterTasksForUser(tasksData);

        setTasks(filteredTasksData);
        setEmployees(employeesData);
        setProjects(projectsData);
        setError("");
      } else {
        throw new Error("API yanıtlarında hata var");
      }
    } catch (err) {
      setError("Veriler yüklenirken hata oluştu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Görevleri seçili filtrelere göre filtreler
   */
  const filterTasks = () => {
    let filtered = [...tasks];

    // Arama terimi ile filtreleme
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          (task.title || "").toLowerCase().includes(q) ||
          (task.description || "").toLowerCase().includes(q)
      );
    }

    // Öncelik filtreleme
    if (selectedPriority) {
      filtered = filtered.filter((task) => task.priority === selectedPriority);
    }

    // Proje filtreleme
    if (selectedProject) {
      const pid = Number(selectedProject);
      filtered = filtered.filter((task) => task.project?.id === pid);
    }

    // Çalışan filtreleme
    if (selectedEmployee) {
      const eid = Number(selectedEmployee);
      filtered = filtered.filter((task) => {
        if (task.assignedEmployees && task.assignedEmployees.length > 0) {
          return task.assignedEmployees.some((emp) => emp.id === eid);
        }
        if (task.assignedTo) {
          return task.assignedTo.id === eid;
        }
        return false;
      });
    }

    setFilteredTasks(filtered);
  };

  /**
   * Kullanıcının görevi silme yetkisi olup olmadığını kontrol eder
   */
  const canDeleteTask = (task) => {
    return isAdmin() || task.createdBy?.id === currentUserId;
  };

  /**
   * Kullanıcının görevi düzenleme yetkisi olup olmadığını kontrol eder
   */
  const canEditTask = (task) => {
    return (
      isAdmin() ||
      task.createdBy?.id === currentUserId ||
      (task.assignedEmployees &&
        task.assignedEmployees.some((emp) => emp.id === currentUserId)) ||
      (task.assignedTo && task.assignedTo.id === currentUserId)
    );
  };

  /**
   * Form input değişikliklerini yönetir
   */
  const handleInputChange = (field, value) => {
    setTaskForm((prev) => {
      let newValue = value;

      // Sayısal alanları dönüştür
      if (field === "projectId" || field === "createdById") {
        newValue = value === "" || value === null ? "" : Number(value);
      } else if (field === "assignedToIds") {
        newValue = Array.isArray(value) ? value.map((v) => Number(v)) : value;
      }

      // Proje değiştiğinde tarihleri sıfırla
      if (field === "projectId") {
        return {
          ...prev,
          [field]: newValue,
          startDate: "",
          endDate: "",
        };
      }

      return { ...prev, [field]: newValue };
    });

    // Hata varsa temizle
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  /**
   * Form validasyonu yapar
   */
  const validateForm = () => {
    const newErrors = {};

    // Zorunlu alanları kontrol et
    if (!taskForm.title?.trim()) newErrors.title = "Görev başlığı zorunludur";
    if (!taskForm.projectId) newErrors.projectId = "Proje seçimi zorunludur";
    if (!taskForm.createdById)
      newErrors.createdById = "Oluşturan kişi seçimi zorunludur";
    if (!taskForm.startDate)
      newErrors.startDate = "Başlangıç tarihi zorunludur";
    if (!taskForm.endDate) newErrors.endDate = "Bitiş tarihi zorunludur";

    const selectedProject = projects.find((p) => p.id === taskForm.projectId);

    // Görev başlangıç tarihi proje başlangıcından önce olamaz
    if (selectedProject && taskForm.startDate) {
      const projectStartDate = selectedProject.startDate
        ? new Date(selectedProject.startDate)
        : null;
      const taskStartDate = new Date(taskForm.startDate);

      if (projectStartDate && taskStartDate < projectStartDate) {
        newErrors.startDate = `Görev başlangıç tarihi, proje başlangıcından (${projectStartDate.toLocaleDateString(
          "tr-TR"
        )}) önce olamaz`;
      }
    }

    // Görev bitiş tarihi proje bitişinden sonra olamaz
    if (selectedProject && taskForm.endDate) {
      const projectEndDate = selectedProject.endDate
        ? new Date(selectedProject.endDate)
        : null;
      const taskEndDate = new Date(taskForm.endDate);

      if (projectEndDate && taskEndDate > projectEndDate) {
        newErrors.endDate = `Görev bitiş tarihi, proje bitişinden (${projectEndDate.toLocaleDateString(
          "tr-TR"
        )}) sonra olamaz`;
      }
    }

    // Bitiş tarihi başlangıçtan sonra olmalı
    if (taskForm.startDate && taskForm.endDate) {
      if (new Date(taskForm.endDate) <= new Date(taskForm.startDate)) {
        newErrors.endDate = "Bitiş tarihi başlangıçtan sonra olmalı";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Yeni görev oluşturma veya mevcut görevi güncelleme
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Yetki kontrolü
    if (!isAdmin() && !isUser()) {
      setErrors((prev) => ({
        ...prev,
        general: "Görev oluşturma yetkiniz bulunmamaktadır!",
      }));
      return;
    }

    try {
      // API için görev verisini hazırla
      const taskData = {
        title: taskForm.title,
        description: taskForm.description || null,
        status: taskForm.status,
        priority: taskForm.priority,
        project: { id: parseInt(taskForm.projectId) },
        assignedEmployees:
          taskForm.assignedToIds.length > 0
            ? taskForm.assignedToIds.map((id) => ({ id: parseInt(id) }))
            : [],
        createdBy: { id: parseInt(taskForm.createdById) },
        startDate: taskForm.startDate ? taskForm.startDate + "T00:00:00" : null,
        endDate: taskForm.endDate ? taskForm.endDate + "T00:00:00" : null,
      };

      const url = editingTask
        ? `${API_BASE}/tasks/${editingTask.id}`
        : `${API_BASE}/tasks`;
      const method = editingTask ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const savedTask = await response.json();

        // Görevi listeye ekle veya güncelle
        setTasks((prev) => {
          if (editingTask) {
            const updatedTasks = prev.filter((t) => t.id !== savedTask.id);
            return [savedTask, ...updatedTasks];
          } else {
            return [savedTask, ...prev];
          }
        });

        resetForm();
        setShowModal(false);
        setErrors({});

        // Yeni görev oluşturulduysa proje sayfasına yönlendir
        if (!editingTask && savedTask.project?.id) {
          navigate(`/projects/${savedTask.project.id}`);
        }
      } else {
        const errText = await response.text();
        setErrors((prev) => ({
          ...prev,
          general: errText || "Görev kaydedilemedi",
        }));
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general: "Görev kaydedilirken hata oluştu: " + err.message,
      }));
    }
  };

  /**
   * Görevi siler
   */
  const handleDelete = async (taskId) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);

    if (!canDeleteTask(taskToDelete)) {
      setError("Bu görevi silme yetkiniz bulunmamaktadır!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
        setDeleteConfirm(null);
      } else {
        throw new Error("Görev silinemedi");
      }
    } catch (err) {
      setError("Görev silinirken hata oluştu: " + err.message);
      setDeleteConfirm(null);
    }
  };

  /**
   * Görev düzenleme modalını açar
   */
  const handleEdit = (task) => {
    if (!canEditTask(task)) {
      alert("Bu görevi düzenleme yetkiniz bulunmamaktadır!");
      return;
    }

    setEditingTask(task);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "TODO",
      priority: task.priority || "MEDIUM",
      projectId: task.project?.id ?? "",
      assignedToIds:
        task.assignedEmployees && task.assignedEmployees.length > 0
          ? task.assignedEmployees.map((emp) => Number(emp.id))
          : task.assignedTo
          ? [Number(task.assignedTo.id)]
          : [],
      createdById: task.createdBy?.id ?? "",
      startDate: task.startDate ? task.startDate.split("T")[0] : "",
      endDate: task.endDate ? task.endDate.split("T")[0] : "",
    });
    setShowModal(true);
  };

  /**
   * Formu sıfırlar
   */
  const resetForm = () => {
    setTaskForm({
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      projectId: "",
      assignedToIds: [],
      createdById: "",
      startDate: "",
      endDate: "",
    });
    setEditingTask(null);
    setErrors({});
  };

  /**
   * Görev kartına tıklandığında proje sayfasına yönlendirir
   */
  const handleTaskCardClick = (task) => {
    if (task.project?.id) {
      navigate(`/projects/${task.project.id}`);
    }
  };

  /**
   * Öncelik seviyesine göre renk döndürür
   */
  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-green-100 text-green-500",
      MEDIUM: "bg-yellow-100 text-yellow-500",
      HIGH: "bg-orange-100 text-orange-500",
      URGENT: "bg-red-100 text-red-500",
    };
    return colors[priority] || "bg-gray-100 text-gray-500";
  };

  /**
   * Tarihi Türkçe formatta biçimlendirir
   */
  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmedi";

    // ISO formatındaki tarihi düzenle
    if (dateString.includes("T")) {
      const dateOnly = dateString.split("T")[0];
      return new Date(dateOnly + "T00:00:00").toLocaleDateString("tr-TR");
    }

    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  // Yükleme durumu
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mb-4"></div>
        <p className="text-gray-500 text-lg">Görevler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Sayfa Başlığı ve Yeni Görev Butonu */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <CheckSquare size={32} color="#2563eb" />
            Görev Yönetimi
          </h1>

          {/* Kullanıcı Rol Göstergesi */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              isAdmin()
                ? "bg-purple-100 text-purple-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {isAdmin() ? <Crown size={12} /> : <User size={12} />}
            {currentUser?.role?.roleName || "User"}
          </div>

          {/* Admin olmayan kullanıcılar için bilgi notu */}
          {!isAdmin() && (
            <div className="text-xs text-gray-500 italic">
              (Sadece size atanan görevler gösteriliyor)
            </div>
          )}
        </div>

        {/* Yeni Görev Butonu - Sadece yetkili kullanıcılar için */}
        {(isAdmin() || isUser()) && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Yeni Görev
          </button>
        )}
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Filtreleme Alanları */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        {/* Arama Kutusu */}
        <div className="relative min-w-[200px]">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Görev ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg border-gray-300 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Öncelik Filtresi */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-300 bg-white focus:border-blue-500 outline-none"
        >
          <option value="">Tüm Öncelikler</option>
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        {/* Proje Filtresi */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-300 bg-white focus:border-blue-500 outline-none"
        >
          <option value="">Tüm Projeler</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        {/* Çalışan Filtresi */}
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-300 bg-white focus:border-blue-500 outline-none"
        >
          <option value="">Tüm Çalışanlar</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.firstName} {employee.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Görev Kartları */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-2xl shadow border transition-transform hover:shadow-lg hover:-translate-y-1 cursor-pointer"
              onClick={() => handleTaskCardClick(task)}
            >
              {/* Görev Başlığı ve Öncelik */}
              <div className="p-6 border-b">
                <div className="flex justify-between mb-3 gap-2">
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    <Flag size={16} /> {task.priority}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {task.title}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {task.description || "Açıklama bulunmuyor"}
                </p>
              </div>

              {/* Görev Detayları */}
              <div className="p-6 space-y-3 text-xs text-gray-500">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} /> Başlangıç:{" "}
                    {formatDate(task.startDate)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} /> Bitiş: {formatDate(task.endDate)}
                  </div>
                  <div className="flex items-center gap-1">
                    Proje: {task.project?.name || "-"}
                  </div>
                  <div className="flex items-center gap-1">
                    Oluşturan:{" "}
                    {task.createdBy
                      ? `${task.createdBy.firstName} ${task.createdBy.lastName}`
                      : "-"}
                  </div>
                </div>

                {/* Atanan Kişiler */}
                {(task.assignedEmployees &&
                  task.assignedEmployees.length > 0) ||
                task.assignedTo ? (
                  <div className="border-t pt-2">
                    <div className="flex items-start gap-1 mb-1">
                      <User size={12} className="mt-0.5 flex-shrink-0" />
                      <span className="font-medium">Atanan:</span>
                    </div>
                    <div className="ml-4 space-y-1">
                      {task.assignedEmployees &&
                      task.assignedEmployees.length > 0
                        ? task.assignedEmployees.map((employee) => (
                            <div key={employee.id} className="text-gray-600">
                              • {employee.firstName} {employee.lastName}
                            </div>
                          ))
                        : task.assignedTo && (
                            <div className="text-gray-600">
                              • {task.assignedTo.firstName}{" "}
                              {task.assignedTo.lastName}
                            </div>
                          )}
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-2 text-gray-400">
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <span>Henüz kimse atanmamış</span>
                    </div>
                  </div>
                )}

                {/* Düzenle ve Sil Butonları */}
                <div className="flex gap-2 justify-end pt-2 border-t">
                  {canEditTask(task) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(task);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                      title="Düzenle"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {canDeleteTask(task) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(task.id);
                      }}
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Boş Durum Mesajı
        <div className="text-center py-20">
          <CheckSquare size={64} color="#d1d5db" className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {isAdmin() ? "Henüz görev yok" : "Size atanan görev bulunamadı"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            {isAdmin()
              ? "İlk görevinizi oluşturarak görev yönetimine başlayın"
              : "Size atanan veya oluşturduğunuz görevler burada görünecek"}
          </p>
          {(isAdmin() || isUser()) && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition"
            >
              <Plus size={18} /> İlk Görevi Oluştur
            </button>
          )}
        </div>
      )}

      {/* Yeni Görev / Düzenleme Modalı */}
      {showModal && (
        <NewTaskForm
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          errors={errors}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          resetForm={resetForm}
          setShowModal={setShowModal}
          editingTask={editingTask}
          priorities={priorities}
          employees={employees}
          projects={projects}
          today={today}
        />
      )}

      {/* Silme Onay Modalı */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Görevi Sil
            </h3>
            <p className="text-gray-600 mb-6">
              Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri
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
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
