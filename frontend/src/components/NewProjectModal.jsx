import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  User,
  Users,
  FileText,
  AlertTriangle,
  Save,
  Loader,
  UserCheck,
} from "lucide-react";

// Yeni proje oluşturma modalı
const NewProjectModal = ({
  isOpen,
  onClose,
  onSave,
  project,
  setProject,
  currentUserId,
}) => {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [assignmentType, setAssignmentType] = useState("employee");

  const today = new Date().toISOString().split("T")[0];

  // Modal açıldığında verileri yükle
  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  // Tüm dropdown verilerini yükle
  const loadAllData = async () => {
    setDataLoading(true);
    setErrors({});

    try {
      await Promise.all([fetchEmployees(), fetchTeams(), fetchManagers()]);
    } catch (error) {
      console.error("Data loading error:", error);
      setErrors((prev) => ({
        ...prev,
        general:
          "Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.",
      }));
    } finally {
      setDataLoading(false);
    }
  };

  // Çalışanları backend'den getir
  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/employees");
      if (!response.ok) {
        // Backend yoksa dummy data göster
        setEmployees([
          { id: 1, firstName: "Ahmet", lastName: "Yılmaz" },
          { id: 2, firstName: "Mehmet", lastName: "Kaya" },
          { id: 3, firstName: "Ayşe", lastName: "Demir" },
        ]);
        return;
      }
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Çalışan listesi alınamadı:", err);
      setEmployees([]);
      setErrors((p) => ({
        ...p,
        general: "Çalışan listesi alınamadı, backend çalışıyor mu?",
      }));
      throw new Error("Çalışan listesi alınamadı");
    }
  };

  // Takımları backend'den getir
  const fetchTeams = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/teams");
      if (!response.ok) {
        // Alternatif endpoint'i dene
        const altResponse = await fetch(
          "http://localhost:8080/api/team-members"
        );
        if (!altResponse.ok) {
          // Dummy data göster
          setTeams([
            { id: 1, name: "Frontend Team", description: "React Takımı" },
            { id: 2, name: "Backend Team", description: "Java Takımı" },
          ]);
          return;
        }
        const altData = await altResponse.json();
        setTeams(Array.isArray(altData) ? altData : []);
        return;
      }
      const data = await response.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Takım listesi alınamadı:", err);
      setTeams([]);
      setErrors((p) => ({
        ...p,
        general: "Takım listesi alınamadı, backend çalışıyor mu?",
      }));
      throw new Error("Takım listesi alınamadı");
    }
  };

  // Yöneticileri backend'den getir
  const fetchManagers = async () => {
    try {
      // Önce managers endpoint'ini dene
      let response = await fetch("http://localhost:8080/api/managers");

      if (!response.ok) {
        // Managers endpoint'i yoksa, employees'dan filtrele
        response = await fetch("http://localhost:8080/api/employees");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allEmployees = await response.json();

        // Manager rolündeki çalışanları filtrele
        const managersData = Array.isArray(allEmployees)
          ? allEmployees.filter(
              (emp) =>
                emp.role === "MANAGER" ||
                emp.position?.includes("Manager") ||
                emp.position?.includes("Yönetici")
            )
          : [];

        // Filtreleme mümkün değilse tüm employees'ları manager olarak göster
        setManagers(
          managersData.length > 0
            ? managersData
            : Array.isArray(allEmployees)
            ? allEmployees
            : []
        );
        return;
      }

      const data = await response.json();
      setManagers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Yönetici listesi alınamadı:", err);
      setManagers([]);
      throw new Error("Yönetici listesi alınamadı");
    }
  };

  // Form validasyonu yap
  const validateForm = () => {
    const newErrors = {};

    if (!project.name?.trim()) newErrors.name = "Proje adı zorunludur";
    if (!project.description?.trim())
      newErrors.description = "Açıklama zorunludur";
    if (!project.startDate) newErrors.startDate = "Başlangıç tarihi zorunludur";
    if (!project.endDate) newErrors.endDate = "Bitiş tarihi zorunludur";

    // Manager kontrolü - sadece managers varsa zorunlu
    if (managers.length > 0 && !project.managerId) {
      newErrors.manager = "Proje yöneticisi seçmelisiniz";
    }

    // Tarih kontrolü
    if (project.startDate && project.endDate) {
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = "Bitiş tarihi başlangıçtan sonra olmalı";
      }
    }

    // Atama kontrolü
    if (assignmentType === "employee" && !project.employeeId) {
      newErrors.employee = "Bir çalışan seçmelisiniz";
    }
    if (assignmentType === "team" && !project.teamId) {
      newErrors.team = "Bir takım seçmelisiniz";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Input değişikliklerini handle et
  const handleInputChange = (field, value) => {
    setProject((prev) => ({ ...prev, [field]: value }));
    // İlgili hatayı temizle
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Atama tipi değiştiğinde
  const handleAssignmentTypeChange = (type) => {
    setAssignmentType(type);
    if (type === "employee") {
      setProject((p) => ({ ...p, teamId: null }));
      if (errors.team) {
        setErrors((prev) => ({ ...prev, team: "" }));
      }
    } else {
      setProject((p) => ({ ...p, employeeId: null }));
      if (errors.employee) {
        setErrors((prev) => ({ ...prev, employee: "" }));
      }
    }
  };

  // Projeyi kaydet
  const handleSave = async () => {
    if (!validateForm()) {
      console.log("Form validation failed:", errors);
      return;
    }

    setLoading(true);
    try {
      // Proje verisini hazırla
      const finalProject = {
        name: project.name?.trim(),
        description: project.description?.trim(),
        status: project.status || "TODO",
        priority: project.priority || "MEDIUM",
        startDate: project.startDate,
        endDate: project.endDate,
        progress: project.progress ?? 0,
      };

      // Manager varsa ekle
      if (project.managerId) {
        finalProject.managerId = project.managerId;
      }

      // Atama tipine göre employee veya team ekle
      if (assignmentType === "employee" && project.employeeId) {
        finalProject.employeeId = project.employeeId;
        finalProject.employee = { id: parseInt(project.employeeId) };
        finalProject.teamId = null;
      } else if (assignmentType === "team" && project.teamId) {
        finalProject.teamId = project.teamId;
        finalProject.team = { id: parseInt(project.teamId) };
        finalProject.employeeId = null;
      }

      console.log("Modal'dan gönderilen proje verisi:", finalProject);

      // Parent component'teki onSave fonksiyonunu çağır
      if (onSave) {
        await onSave(finalProject, currentUserId);
      }

      // Başarılı kayıt sonrası modalı kapat
      handleClose();
    } catch (err) {
      console.error("Proje kaydedilemedi:", err);
      setErrors((prev) => ({
        ...prev,
        general: "Proje kaydedilirken bir hata oluştu: " + err.message,
      }));
    } finally {
      setLoading(false);
    }
  };

  // Modal'ı kapat ve temizle
  const handleClose = () => {
    setProject({
      name: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      startDate: "",
      endDate: "",
      managerId: null,
      employeeId: null,
      teamId: null,
      employee: null,
      team: null,
      progress: 0,
    });
    setErrors({});
    setAssignmentType("employee");
    setEmployees([]);
    setTeams([]);
    setManagers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Üst başlık */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <FileText size={24} color="#2563eb" />
            Yeni Proje Oluştur
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Form alanları */}
        <div className="p-6 space-y-6">
          {/* Yükleniyor durumu */}
          {dataLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-2">
              <Loader size={16} className="text-blue-500 animate-spin" />
              <p className="text-blue-700 text-sm">Veriler yükleniyor...</p>
            </div>
          )}

          {/* Hata mesajı */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Proje Adı */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Proje Adı *
            </label>
            <input
              type="text"
              value={project.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Proje adını girin"
              disabled={loading || dataLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertTriangle size={14} /> {errors.name}
              </p>
            )}
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Proje Açıklaması *
            </label>
            <textarea
              rows={4}
              value={project.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 resize-none transition-all ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Proje açıklamasını girin"
              disabled={loading || dataLoading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertTriangle size={14} /> {errors.description}
              </p>
            )}
          </div>

          {/* Proje Yöneticisi - sadece managers varsa göster */}
          {managers.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1 text-gray-700">
                <UserCheck size={16} /> Proje Yöneticisi *
              </label>
              <select
                value={project.managerId || ""}
                onChange={(e) =>
                  handleInputChange(
                    "managerId",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white transition-all ${
                  errors.manager ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading || dataLoading || managers.length === 0}
              >
                <option value="">
                  {managers.length === 0
                    ? "Yönetici listesi yükleniyor..."
                    : "Proje yöneticisi seçiniz"}
                </option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName}
                    {manager.position && ` - ${manager.position}`}
                  </option>
                ))}
              </select>
              {errors.manager && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} /> {errors.manager}
                </p>
              )}
            </div>
          )}

          {/* Durum ve Öncelik */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Durum
              </label>
              <select
                value={project.status || "TODO"}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                disabled={loading || dataLoading}
              >
                <option value="TODO">Yapılacak</option>
                <option value="IN_PROGRESS">Devam Ediyor</option>
                <option value="DONE">Tamamlandı</option>
                <option value="CANCELLED">İptal Edildi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Öncelik
              </label>
              <select
                value={project.priority || "MEDIUM"}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                disabled={loading || dataLoading}
              >
                <option value="HIGH">Yüksek</option>
                <option value="MEDIUM">Orta</option>
                <option value="LOW">Düşük</option>
              </select>
            </div>
          </div>

          {/* Tarihler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1 text-gray-700">
                <Calendar size={16} /> Başlangıç Tarihi *
              </label>
              <input
                type="date"
                value={project.startDate || ""}
                min={today}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.startDate ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading || dataLoading}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} /> {errors.startDate}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1 text-gray-700">
                <Calendar size={16} /> Bitiş Tarihi *
              </label>
              <input
                type="date"
                value={project.endDate || ""}
                min={project.startDate || today}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.endDate ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading || dataLoading}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} /> {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Atama Tipi */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700">
              Atama Tipi *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignmentType"
                  value="employee"
                  checked={assignmentType === "employee"}
                  onChange={(e) => handleAssignmentTypeChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                  disabled={loading || dataLoading}
                />
                <User size={16} />
                <span className="text-gray-700">Çalışan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignmentType"
                  value="team"
                  checked={assignmentType === "team"}
                  onChange={(e) => handleAssignmentTypeChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                  disabled={loading || dataLoading}
                />
                <Users size={16} />
                <span className="text-gray-700">Takım</span>
              </label>
            </div>
          </div>

          {/* Çalışan Seçimi */}
          {assignmentType === "employee" && (
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1 text-gray-700">
                <User size={16} /> Atanacak Çalışan *
              </label>
              <select
                value={project.employeeId || ""}
                onChange={(e) =>
                  handleInputChange(
                    "employeeId",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className={`w-full px-4 py-3 border rounded-xl bg-white transition-all ${
                  errors.employee ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading || dataLoading || employees.length === 0}
              >
                <option value="">
                  {employees.length === 0
                    ? "Çalışan listesi yükleniyor..."
                    : "Çalışan seçiniz"}
                </option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                    {emp.position && ` - ${emp.position}`}
                  </option>
                ))}
              </select>
              {errors.employee && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} /> {errors.employee}
                </p>
              )}
            </div>
          )}

          {/* Takım Seçimi */}
          {assignmentType === "team" && (
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1 text-gray-700">
                <Users size={16} /> Atanacak Takım *
              </label>
              <select
                value={project.teamId || ""}
                onChange={(e) =>
                  handleInputChange(
                    "teamId",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className={`w-full px-4 py-3 border rounded-xl bg-white transition-all ${
                  errors.team ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading || dataLoading || teams.length === 0}
              >
                <option value="">
                  {teams.length === 0
                    ? "Takım listesi yükleniyor..."
                    : "Takım seçiniz"}
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                    {team.description && ` - ${team.description}`}
                  </option>
                ))}
              </select>
              {errors.team && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} /> {errors.team}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Alt butonlar */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={loading || dataLoading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? "Kaydediliyor..." : "Projeyi Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;
