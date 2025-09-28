import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Plus,
  Search,
  Calendar,
  User,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import NewProjectModal from "./NewProjectModal";
import {
  getCurrentUserId,
  getCurrentUser,
  isAdmin,
  isUser,
  filterProjectsForUser,
} from "../utils/roleUtils";

// Ana proje yönetimi sayfası - projeler listelenir, filtrelenir ve yönetilir
const Project = () => {
  const navigate = useNavigate();

  // Kullanıcı bilgileri
  const [currentUserId] = useState(getCurrentUserId());
  const [currentUser] = useState(getCurrentUser());

  // Proje verileri
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);

  // Filtreler
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Silme işlemi için
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [confirmName, setConfirmName] = useState("");

  // Sayfa durumları
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Yeni proje formu
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    startDate: "",
    endDate: "",
    employeeId: null,
    teamId: null,
  });

  // Projenin kaç yüzde tamamlandığını hesapla
  // Task'lardaki subtask'lara bakarak hesaplama yapıyor
  const calculateProjectProgress = async (projectId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/tasks/project/${projectId}`,
        { credentials: "include" }
      );

      if (!response.ok) return 0;
      const tasks = await response.json();
      if (!tasks || tasks.length === 0) return 0;

      let totalItems = 0;
      let completedItems = 0;

      // Her task için subtask'larını kontrol et
      const subtaskPromises = tasks.map(async (task) => {
        try {
          const subtaskResponse = await fetch(
            `http://localhost:8080/api/subtasks/task/${task.id}`,
            { credentials: "include" }
          );

          if (subtaskResponse.ok) {
            const subtasks = await subtaskResponse.json();

            if (subtasks.length === 0) {
              // Subtask yoksa ana task'ı say
              totalItems += 1;
              if (task.status === "COMPLETED" || task.status === "DONE") {
                completedItems += 1;
              }
            } else {
              // Subtask varsa sadece subtask'ları say
              totalItems += subtasks.length;
              completedItems += subtasks.filter(
                (st) => st.status === "DONE"
              ).length;
            }
          } else {
            // API hatası varsa ana task'ı say
            totalItems += 1;
            if (task.status === "COMPLETED" || task.status === "DONE") {
              completedItems += 1;
            }
          }
        } catch (error) {
          // Hata durumunda ana task'ı say
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
      return 0;
    }
  };

  // Giriş yapmış mı kontrol et
  useEffect(() => {
    if (!currentUserId) {
      alert("Lütfen önce giriş yapın!");
      window.location.href = "/login";
      return;
    }
  }, [currentUserId]);

  // Projeleri backend'den getir
  const fetchProjects = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:8080/api/projects", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Projeler yüklenemedi");
      const data = await response.json();

      // Kullanıcının rolüne göre filtrele
      const filteredData = filterProjectsForUser(data);

      // Her proje için progress hesapla
      const projectsWithProgress = await Promise.all(
        filteredData.map(async (project) => {
          const calculatedProgress = await calculateProjectProgress(project.id);
          return { ...project, calculatedProgress };
        })
      );

      // Tamamlanmış projeleri sona koy, diğerlerini ID'ye göre sırala
      const sortedProjects = projectsWithProgress.sort((a, b) => {
        if (a.status === "DONE" && b.status !== "DONE") return 1;
        if (a.status !== "DONE" && b.status === "DONE") return -1;
        return b.id - a.id;
      });

      setProjects(sortedProjects);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Proje getirme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa açıldığında projeleri getir
  useEffect(() => {
    if (currentUserId) {
      fetchProjects();
    }
  }, [currentUserId]);

  // Yeni proje modalını aç
  const handleCreateProject = () => {
    if (!isAdmin() && !isUser()) {
      alert("Proje oluşturma yetkiniz bulunmamaktadır!");
      return;
    }
    setIsModalOpen(true);
  };

  // Yeni proje kaydet
  const handleSaveProject = async (projectData) => {
    try {
      if (!currentUserId) {
        throw new Error(
          "Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        );
      }

      // Tarihleri düzelt
      const formatDate = (date) => {
        if (!date) return null;
        return date.includes("T") ? date : date + "T10:00:00";
      };

      // Backend için veri hazırla
      const requestData = {
        name: projectData.name?.trim(),
        description: projectData.description?.trim(),
        status: projectData.status || "TODO",
        priority: projectData.priority || "MEDIUM",
        startDate: formatDate(projectData.startDate),
        endDate: formatDate(projectData.endDate),
        actualEndDate: null,
        createdBy: { id: parseInt(currentUserId) },
        assignedManager: projectData.managerId
          ? { id: parseInt(projectData.managerId) }
          : { id: parseInt(currentUserId) },
        employee: projectData.employeeId
          ? { id: parseInt(projectData.employeeId) }
          : projectData.employee
          ? { id: parseInt(projectData.employee.id) }
          : null,
        team: projectData.teamId
          ? { id: parseInt(projectData.teamId) }
          : projectData.team
          ? { id: parseInt(projectData.team.id) }
          : null,
        progress: parseFloat(projectData.progress) || 0.0,
      };

      // Boş değerleri temizle
      Object.keys(requestData).forEach((key) => {
        if (requestData[key] === null || requestData[key] === undefined) {
          delete requestData[key];
        }
      });

      // Backend'e gönder
      const response = await fetch("http://localhost:8080/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = `HTTP ${response.status}`;

        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = responseText || errorMessage;
        }

        throw new Error(`Proje kaydedilemedi: ${errorMessage}`);
      }

      // Başarılıysa listeyi yenile
      await fetchProjects();
    } catch (error) {
      console.error("Proje kaydetme hatası:", error);
      alert(`Hata: ${error.message}`);
      throw error;
    }
  };

  // Proje sil
  const handleDeleteProject = async (projectId) => {
    const projectToDeleteObj = projects.find((p) => p.id === projectId);

    // Yetkisi var mı kontrol et
    if (!isAdmin() && projectToDeleteObj.createdBy?.id !== currentUserId) {
      alert("Bu projeyi silme yetkiniz bulunmamaktadır!");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/projects/${projectId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Proje silinemedi!");
      }

      // Listeden kaldır
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error("Silme hatası:", error);
      alert(`Hata: ${error.message}`);
    }
  };

  // Filtreleme işlemi
  useEffect(() => {
    let filtered = [...projects];

    const matchesSearch = (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = (project) =>
      !statusFilter || project.status === statusFilter;

    const matchesPriority = (project) =>
      !priorityFilter || project.priority === priorityFilter;

    const matchesEmployee = (project) =>
      !employeeFilter ||
      (project.employee &&
        `${project.employee.firstName} ${project.employee.lastName}`
          .toLowerCase()
          .includes(employeeFilter.toLowerCase()));

    const matchesStartDate = (project) =>
      !startDateFilter ||
      (project.startDate &&
        new Date(project.startDate) >= new Date(startDateFilter));

    const matchesEndDate = (project) =>
      !endDateFilter ||
      (project.endDate && new Date(project.endDate) <= new Date(endDateFilter));

    // Tüm filtreleri uygula
    filtered = filtered.filter((project) => {
      return (
        matchesSearch(project) &&
        matchesStatus(project) &&
        matchesPriority(project) &&
        matchesEmployee(project) &&
        matchesStartDate(project) &&
        matchesEndDate(project)
      );
    });

    setFilteredProjects(filtered);
  }, [
    projects,
    searchTerm,
    statusFilter,
    priorityFilter,
    employeeFilter,
    startDateFilter,
    endDateFilter,
  ]);

  // Durum rengini al
  const getStatusColor = (status) =>
    ({
      TODO: "bg-yellow-100 text-yellow-500",
      IN_PROGRESS: "bg-blue-100 text-blue-500",
      DONE: "bg-green-100 text-green-500",
      CANCELLED: "bg-red-100 text-red-500",
    }[status] || "bg-gray-100 text-gray-500");

  // Durum ikonunu al
  const getStatusIcon = (status) =>
    ({
      TODO: <Clock size={16} />,
      IN_PROGRESS: <Play size={16} />,
      DONE: <CheckCircle size={16} />,
      CANCELLED: <AlertCircle size={16} />,
    }[status] || <Clock size={16} />);

  // Öncelik rengini al
  const getPriorityColor = (priority) =>
    ({
      HIGH: "bg-red-100 text-red-500",
      MEDIUM: "bg-yellow-100 text-yellow-500",
      LOW: "bg-green-100 text-green-500",
    }[priority] || "bg-gray-100 text-gray-500");

  // Tarihi Türkçe formatta göster
  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("tr-TR")
      : "Belirtilmedi";

  // Progress yüzdesini al
  const getProgressPercentage = (project) => {
    return Math.round(
      project.calculatedProgress !== undefined
        ? project.calculatedProgress
        : project.progress || 0
    );
  };

  // Silme yetkisi var mı
  const canDeleteProject = (project) => {
    return isAdmin() || project.createdBy?.id === currentUserId;
  };

  // Giriş yapmamışsa yönlendir
  if (!currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg">Yönlendiriliyor...</p>
      </div>
    );
  }

  // Yükleniyor
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mb-4"></div>
        <p className="text-gray-500 text-lg">Projeler yükleniyor...</p>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
        <AlertCircle size={48} color="#ef4444" className="mb-4" />
        <h2 className="text-red-500 text-xl font-semibold mb-2">Hata Oluştu</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchProjects}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Üst başlık */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FolderOpen size={32} color="#2563eb" />
            Proje Yönetimi
          </h1>
          {!isAdmin() && (
            <div className="text-xs text-gray-500 italic">
              (Sadece size atanan projeler gösteriliyor)
            </div>
          )}
        </div>

        {(isAdmin() || isUser()) && (
          <button
            onClick={handleCreateProject}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Yeni Proje
          </button>
        )}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        {/* Proje ara */}
        <div className="relative min-w-[200px]">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Proje ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg border-gray-300 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Çalışan ara */}
        <div className="relative min-w-[200px]">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Çalışan adı ara..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg border-gray-300 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Durum filtresi */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-300 bg-white focus:border-blue-500 outline-none"
        >
          <option value="">Tüm Durumlar</option>
          <option value="TODO">Yapılacak</option>
          <option value="IN_PROGRESS">Devam Ediyor</option>
          <option value="DONE">Tamamlandı</option>
          <option value="CANCELLED">İptal Edildi</option>
        </select>

        {/* Öncelik filtresi */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-300 bg-white focus:border-blue-500 outline-none"
        >
          <option value="">Tüm Öncelikler</option>
          <option value="HIGH">Yüksek</option>
          <option value="MEDIUM">Orta</option>
          <option value="LOW">Düşük</option>
        </select>

        {/* Tarih filtreleri */}
        <input
          type="date"
          value={startDateFilter}
          onChange={(e) => setStartDateFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-300 bg-white focus:border-blue-500 outline-none"
        />

        <input
          type="date"
          value={endDateFilter}
          onChange={(e) => setEndDateFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-300 bg-white focus:border-blue-500 outline-none"
        />
      </div>

      {/* Proje kartları */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-white rounded-2xl shadow border cursor-pointer transition-transform hover:shadow-lg hover:-translate-y-1"
            >
              {/* Üst kısım */}
              <div className="p-6 border-b">
                <div className="flex justify-between mb-3 gap-2">
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {getStatusIcon(project.status)} {project.status}
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold ${getPriorityColor(
                      project.priority
                    )}`}
                  >
                    {project.priority}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {project.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {project.description || "Açıklama bulunmuyor"}
                </p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Proje İlerlemesi
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {getProgressPercentage(project)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${getProgressPercentage(project)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Alt detaylar */}
              <div className="p-6 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={12} /> Başlangıç:{" "}
                  {formatDate(project.startDate)}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} /> Bitiş: {formatDate(project.endDate)}
                </div>
                {project.employee && (
                  <div className="flex items-center gap-1">
                    <User size={12} /> {project.employee?.firstName || ""}{" "}
                    {project.employee?.lastName || ""}
                  </div>
                )}
                {project.team && (
                  <div className="flex items-center gap-1">
                    <Users size={12} />{" "}
                    {project.team?.name || `Takım #${project.team?.id || ""}`}
                  </div>
                )}

                {/* Sil butonu - yetkisi olanlara */}
                {canDeleteProject(project) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectToDelete(project);
                    }}
                    className="text-red-700 hover:text-red-800 transition ml-40"
                    title="Projeyi Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Boş durum */
        <div className="text-center py-20">
          <FolderOpen size={64} color="#d1d5db" className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {isAdmin() ? "Henüz proje yok" : "Size atanan proje bulunamadı"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            {isAdmin()
              ? "İlk projenizi oluşturarak proje yönetimine başlayın"
              : "Size atanan veya oluşturduğunuz projeler burada görünecek"}
          </p>
          {(isAdmin() || isUser()) && (
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition"
            >
              <Plus size={18} /> İlk Projeyi Oluştur
            </button>
          )}
        </div>
      )}

      {/* Silme onay modalı */}
      {projectToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Projeyi Sil
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-bold text-red-500">
                {projectToDelete.name}
              </span>{" "}
              adlı projeyi silmek üzeresiniz. Bu işlem geri alınamaz.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Onaylamak için proje adını yazın:
            </p>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4 focus:border-red-500 outline-none"
              placeholder="Proje adını yazın..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setProjectToDelete(null);
                  setConfirmName("");
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  if (confirmName === projectToDelete.name) {
                    handleDeleteProject(projectToDelete.id);
                    setProjectToDelete(null);
                    setConfirmName("");
                  } else {
                    alert("Proje adı eşleşmiyor!");
                  }
                }}
                disabled={confirmName !== projectToDelete.name}
                className={`px-4 py-2 rounded-lg text-white transition ${
                  confirmName === projectToDelete.name
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
                }`}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni proje modalı */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        project={newProject}
        setProject={setNewProject}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default Project;
