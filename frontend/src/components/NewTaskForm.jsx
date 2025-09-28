import React, { useState, useEffect } from "react";
import {
  X,
  Flag,
  Calendar,
  User,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

const NewTaskForm = ({
  taskForm,
  setTaskForm,
  errors,
  handleInputChange,
  handleSubmit,
  resetForm,
  setShowModal,
  editingTask,
  priorities,
  employees,
  projects,
  today,
  hideProjectSelection = false,
  currentProjectName = "",
  currentProject = null,
  projectTeamMembers = [],
}) => {
  // Dropdown açık/kapalı durumları
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showCreatorDropdown, setShowCreatorDropdown] = useState(false);

  /**
   * Seçilen projeyi belirler - form'dan veya props'tan geleni kullanır
   */
  const selectedProject =
    currentProject || projects.find((p) => p.id === taskForm.projectId);

  /**
   * Dropdown dışına tıklandığında dropdown'ları kapatır
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".assignee-dropdown-container")) {
        setShowAssigneeDropdown(false);
      }
      if (!event.target.closest(".creator-dropdown-container")) {
        setShowCreatorDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Proje tarih limitlerine göre görev için uygun tarih aralığını hesaplar
   */
  const getTaskDateLimits = () => {
    if (!selectedProject) {
      return { min: today, max: null };
    }

    const projectStart = selectedProject.startDate
      ? selectedProject.startDate.split("T")[0]
      : null;
    const projectEnd = selectedProject.endDate
      ? selectedProject.endDate.split("T")[0]
      : null;

    // Minimum tarih: Proje başlangıcı veya bugün (hangisi daha geçse)
    let minDate = today;
    if (projectStart && projectStart > today) {
      minDate = projectStart;
    }

    return {
      min: minDate,
      max: projectEnd,
      projectStart: projectStart,
      projectEnd: projectEnd,
    };
  };

  /**
   * Göreve atanabilecek çalışanları belirler
   * Proje türü ve takım yapısına göre filtreleme yapar
   */
  const getAssignableEmployees = () => {
    // Mevcut proje varsa ve takım üyeleri belirtilmişse
    if (currentProject && projectTeamMembers.length > 0) {
      return projectTeamMembers;
    }

    // Mevcut proje tek bir çalışana atanmışsa
    if (currentProject && currentProject.employee) {
      return [currentProject.employee];
    }

    // Form'da seçilen proje varsa
    if (taskForm.projectId) {
      const selectedProject = projects.find(
        (p) => p.id === parseInt(taskForm.projectId)
      );

      if (selectedProject) {
        // Projenin tek bir çalışanı varsa
        if (selectedProject.employee) {
          return [selectedProject.employee];
        }
        // Projenin takım üyeleri varsa
        if (
          selectedProject.teamMembers &&
          selectedProject.teamMembers.length > 0
        ) {
          return selectedProject.teamMembers;
        }
        // Proje team objesi ile tanımlanmışsa
        if (selectedProject.team && selectedProject.team.members) {
          return selectedProject.team.members;
        }
      }
    }

    // Varsayılan olarak tüm çalışanları döndür
    return employees;
  };

  const assignableEmployees = getAssignableEmployees();

  /**
   * Çoklu seçim için atanan kişileri yönetir
   * Kişi zaten seçiliyse kaldırır, değilse ekler
   */
  const handleAssigneeToggle = (employeeId) => {
    const currentAssignees = Array.isArray(taskForm.assignedToIds)
      ? taskForm.assignedToIds
      : [];

    let newAssignees;
    if (currentAssignees.includes(employeeId)) {
      // Kişi seçiliyse listeden çıkar
      newAssignees = currentAssignees.filter((id) => id !== employeeId);
    } else {
      // Kişi seçili değilse listeye ekle
      newAssignees = [...currentAssignees, employeeId];
    }

    handleInputChange("assignedToIds", newAssignees);
  };

  /**
   * Seçilen atanan kişilerin isimlerini formatlayarak döndürür
   * Kişi sayısına göre farklı gösterimler yapar
   */
  const getSelectedAssigneeNames = () => {
    const assignedIds = Array.isArray(taskForm.assignedToIds)
      ? taskForm.assignedToIds
      : [];

    if (assignedIds.length === 0) return "Kişi seçiniz";

    const selectedEmployees = assignableEmployees.filter((emp) =>
      assignedIds.includes(emp.id)
    );

    if (selectedEmployees.length === 0) return "Kişi seçiniz";
    if (selectedEmployees.length === 1) {
      return `${selectedEmployees[0].firstName} ${selectedEmployees[0].lastName}`;
    }

    // 3'e kadar olan isimleri göster
    if (selectedEmployees.length <= 3) {
      return selectedEmployees
        .map((emp) => `${emp.firstName} ${emp.lastName}`)
        .join(", ");
    }

    // 3'ten fazla varsa sadece ilk ikisini göster ve geri kalanını say
    return `${selectedEmployees
      .slice(0, 2)
      .map((emp) => `${emp.firstName} ${emp.lastName}`)
      .join(", ")} ve ${selectedEmployees.length - 2} kişi daha`;
  };

  /**
   * Seçilen oluşturan kişinin adını döndürür
   */
  const getSelectedCreatorName = () => {
    if (!taskForm.createdById) return "Oluşturan kişi seçiniz";

    const selectedEmployee = employees.find(
      (emp) => emp.id === taskForm.createdById
    );

    if (!selectedEmployee) return "Oluşturan kişi seçiniz";

    return `${selectedEmployee.firstName} ${selectedEmployee.lastName}`;
  };

  /**
   * Oluşturan kişi seçimini yönetir
   */
  const handleCreatorSelect = (employeeId) => {
    handleInputChange("createdById", employeeId);
    setShowCreatorDropdown(false);
  };

  /**
   * Tüm atanabilir kişileri seç/kaldır işlemi
   */
  const handleSelectAll = () => {
    const currentAssignees = Array.isArray(taskForm.assignedToIds)
      ? taskForm.assignedToIds
      : [];
    const allEmployeeIds = assignableEmployees.map((emp) => emp.id);

    if (currentAssignees.length === assignableEmployees.length) {
      // Tüm seçimleri kaldır
      handleInputChange("assignedToIds", []);
    } else {
      // Herkesi seç
      handleInputChange("assignedToIds", allEmployeeIds);
    }
  };

  const dateLimits = getTaskDateLimits();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Başlığı */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <CheckSquare size={24} color="#2563eb" />
            {editingTask ? "Görev Düzenle" : "Yeni Görev Oluştur"}
          </h2>
          <button
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Kapat"
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Form İçeriği */}
        <div className="p-6 space-y-6">
          {/* Genel Hata Mesajı */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
              <Flag size={16} className="text-red-500" />
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Görev Başlığı */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Görev Başlığı *
            </label>
            <input
              type="text"
              maxLength="200"
              value={taskForm.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Görev başlığını yazınız"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <Flag size={14} /> {errors.title}
              </p>
            )}
          </div>

          {/* Görev Açıklaması */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Görev Açıklaması
            </label>
            <textarea
              rows={4}
              value={taskForm.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 resize-none border-gray-300"
              placeholder="Görev ile ilgili detayları yazınız (opsiyonel)"
            />
          </div>

          {/* Öncelik Seçimi */}
          <div>
            <label className="block text-sm font-semibold mb-2">Öncelik</label>
            <select
              value={taskForm.priority}
              onChange={(e) => handleInputChange("priority", e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          {/* Proje Seçimi - Koşullu Görüntüleme */}
          {!hideProjectSelection && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Proje *
              </label>
              <select
                value={taskForm.projectId}
                onChange={(e) => handleInputChange("projectId", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors.projectId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Proje seçiniz</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <Flag size={14} /> {errors.projectId}
                </p>
              )}
            </div>
          )}

          {/* Mevcut Proje Bilgisi Gösterimi */}
          {hideProjectSelection && currentProjectName && (
            <div>
              <label className="block text-sm font-semibold mb-2">Proje</label>
              <div className="w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-700 border-gray-300">
                {currentProjectName}
              </div>
            </div>
          )}

          {/* Proje Tarih Aralığı Bilgilendirmesi */}
          {selectedProject && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Info
                  size={16}
                  className="text-blue-600 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-blue-800 font-medium text-sm mb-1">
                    Seçilen Proje: {selectedProject.name}
                  </p>
                  <p className="text-blue-700 text-sm">
                    Proje Tarih Aralığı:{" "}
                    <span className="font-semibold">
                      {selectedProject.startDate
                        ? new Date(
                            selectedProject.startDate
                          ).toLocaleDateString("tr-TR")
                        : "Belirtilmemiş"}
                      {" - "}
                      {selectedProject.endDate
                        ? new Date(selectedProject.endDate).toLocaleDateString(
                            "tr-TR"
                          )
                        : "Belirtilmemiş"}
                    </span>
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Görev tarihleri bu aralıkta seçilmelidir.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Başlangıç ve Bitiş Tarihleri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Başlangıç Tarihi */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1">
                <Calendar size={16} /> Başlangıç Tarihi *
              </label>
              <input
                type="date"
                value={taskForm.startDate}
                min={dateLimits.min}
                max={dateLimits.max}
                disabled={!taskForm.projectId && !currentProject}
                onChange={(e) => {
                  handleInputChange("startDate", e.target.value);
                  // Başlangıç tarihi değiştiğinde bitiş tarihini kontrol et
                  if (
                    taskForm.endDate &&
                    new Date(e.target.value) >= new Date(taskForm.endDate)
                  ) {
                    handleInputChange("endDate", "");
                  }
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? "border-red-500" : "border-gray-300"
                } ${
                  !taskForm.projectId && !currentProject
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <Flag size={14} /> {errors.startDate}
                </p>
              )}
              {!taskForm.projectId && !currentProject && (
                <p className="text-gray-500 text-xs mt-1">Önce proje seçiniz</p>
              )}
            </div>

            {/* Bitiş Tarihi */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1">
                <Calendar size={16} /> Bitiş Tarihi *
              </label>
              <input
                type="date"
                value={taskForm.endDate}
                min={
                  taskForm.startDate
                    ? (() => {
                        const nextDay = new Date(taskForm.startDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        return nextDay.toISOString().split("T")[0];
                      })()
                    : dateLimits.min
                }
                max={dateLimits.max}
                disabled={!taskForm.startDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? "border-red-500" : "border-gray-300"
                } ${
                  !taskForm.startDate ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <Flag size={14} /> {errors.endDate}
                </p>
              )}
              {!taskForm.startDate && (
                <p className="text-gray-500 text-xs mt-1">
                  Önce başlangıç tarihi seçiniz
                </p>
              )}
            </div>
          </div>

          {/* Atanan Kişiler - Çoklu Seçim Dropdown */}
          <div className="assignee-dropdown-container">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold flex items-center gap-1">
                <User size={16} /> Atanan Kişiler
              </label>

              {/* Tümünü Seç/Kaldır Butonu */}
              {assignableEmployees.length > 1 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {Array.isArray(taskForm.assignedToIds) &&
                  taskForm.assignedToIds.length === assignableEmployees.length
                    ? "Tümünü Kaldır"
                    : "Tümünü Seç"}
                </button>
              )}
            </div>

            <div className="relative">
              {/* Dropdown Açma Butonu */}
              <button
                type="button"
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 flex justify-between items-center text-left"
              >
                <span className="text-gray-700 truncate">
                  {getSelectedAssigneeNames()}
                </span>
                {showAssigneeDropdown ? (
                  <ChevronUp
                    size={20}
                    className="text-gray-400 flex-shrink-0"
                  />
                ) : (
                  <ChevronDown
                    size={20}
                    className="text-gray-400 flex-shrink-0"
                  />
                )}
              </button>

              {/* Dropdown Listesi */}
              {showAssigneeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  {assignableEmployees.map((employee) => {
                    const assignedIds = Array.isArray(taskForm.assignedToIds)
                      ? taskForm.assignedToIds
                      : [];
                    const isSelected = assignedIds.includes(employee.id);

                    return (
                      <label
                        key={employee.id}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleAssigneeToggle(employee.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />

                        {/* Çalışan Avatar */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                            isSelected
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {employee.firstName.charAt(0).toUpperCase()}
                          {employee.lastName.charAt(0).toUpperCase()}
                        </div>

                        {/* Çalışan Bilgileri */}
                        <div className="flex-1 min-w-0">
                          <span
                            className={`block truncate ${
                              isSelected
                                ? "text-blue-700 font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            {employee.firstName} {employee.lastName}
                          </span>
                          {employee.position && (
                            <span className="block text-xs text-gray-500 truncate">
                              {employee.position}
                            </span>
                          )}
                        </div>

                        {/* Seçildi İkonu */}
                        {isSelected && (
                          <CheckSquare
                            size={16}
                            className="text-blue-600 flex-shrink-0"
                          />
                        )}
                      </label>
                    );
                  })}

                  {/* Çalışan Bulunamadı Mesajı */}
                  {assignableEmployees.length === 0 && (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      Çalışan bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Seçim Bilgilendirme Mesajları */}
            {Array.isArray(taskForm.assignedToIds) &&
              taskForm.assignedToIds.length > 0 && (
                <p className="text-blue-600 text-xs mt-1">
                  {taskForm.assignedToIds.length} kişi seçildi
                </p>
              )}

            {assignableEmployees.length === 1 && (
              <p className="text-blue-600 text-xs mt-1">
                Bu proje sadece {assignableEmployees[0].firstName}{" "}
                {assignableEmployees[0].lastName} kişisine atanmış
              </p>
            )}

            {assignableEmployees.length > 1 &&
              assignableEmployees.length < employees.length && (
                <p className="text-blue-600 text-xs mt-1">
                  Sadece bu projeye atanmış {assignableEmployees.length} kişi
                  görüntüleniyor
                </p>
              )}
          </div>

          {/* Oluşturan Kişi Seçimi */}
          <div className="creator-dropdown-container">
            <label className="block text-sm font-semibold mb-2 flex items-center gap-1">
              <User size={16} /> Oluşturan Kişi *
            </label>

            <div className="relative">
              {/* Dropdown Açma Butonu */}
              <button
                type="button"
                onClick={() => setShowCreatorDropdown(!showCreatorDropdown)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white flex justify-between items-center text-left ${
                  errors.createdById ? "border-red-500" : "border-gray-300"
                }`}
              >
                <span
                  className={
                    taskForm.createdById ? "text-gray-700" : "text-gray-500"
                  }
                >
                  {getSelectedCreatorName()}
                </span>
                {showCreatorDropdown ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </button>

              {/* Dropdown Listesi */}
              {showCreatorDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                  {employees.map((employee) => {
                    const isSelected = taskForm.createdById === employee.id;

                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => handleCreatorSelect(employee.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer text-left transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {/* Çalışan Avatar */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isSelected
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {employee.firstName.charAt(0).toUpperCase()}
                          {employee.lastName.charAt(0).toUpperCase()}
                        </div>

                        {/* Çalışan Adı */}
                        <span>
                          {employee.firstName} {employee.lastName}
                        </span>

                        {/* Seçildi İkonu */}
                        {isSelected && (
                          <CheckSquare
                            size={16}
                            className="text-blue-600 ml-auto"
                          />
                        )}
                      </button>
                    );
                  })}

                  {/* Çalışan Bulunamadı Mesajı */}
                  {employees.length === 0 && (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      Çalışan bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hata Mesajı */}
            {errors.createdById && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <Flag size={14} /> {errors.createdById}
              </p>
            )}
          </div>
        </div>

        {/* Modal Alt Kısım - Butonlar */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            className="px-6 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <CheckSquare size={18} />
            {editingTask ? "Güncelle" : "Görevi Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTaskForm;
