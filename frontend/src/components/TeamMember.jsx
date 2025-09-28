import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Calendar,
  User,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Edit3,
  Trash2,
  Crown,
  X,
  Check,
  Info,
} from "lucide-react";

const TeamMember = () => {
  // LocalStorage'dan kullanıcı ID'sini al
  const getCurrentUserId = () => {
    const storedUserId = localStorage.getItem("currentUserId");
    return storedUserId ? parseInt(storedUserId) : null;
  };

  // State tanımlamaları
  const [currentUserId] = useState(getCurrentUserId());
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal durumları
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Silme onayları
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [confirmName, setConfirmName] = useState("");

  // Form verileri
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
  });
  const [editTeam, setEditTeam] = useState({
    name: "",
    description: "",
  });
  const [teamToEdit, setTeamToEdit] = useState(null);

  // Üye ekleme
  const [selectedTeamForMember, setSelectedTeamForMember] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [defaultRole, setDefaultRole] = useState("MEMBER");
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  // Alert sistemi
  const [alert, setAlert] = useState(null);

  // Alert gösterme
  const showAlert = (message, type = "info") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Kullanıcı giriş kontrolü
  useEffect(() => {
    if (!currentUserId) {
      showAlert("Lütfen önce giriş yapın!", "error");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return;
    }
  }, [currentUserId]);

  // Takımları getir
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/teams", {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Takımlar yüklenemedi");
      const data = await response.json();
      setTeams(data.reverse());
      setError(null);
    } catch (err) {
      setError(err.message);
      showAlert(`Hata: ${err.message}`, "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Çalışanları getir
  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/employees", {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Çalışanlar yüklenemedi");
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      showAlert("Çalışan listesi yüklenemedi", "error");
      console.error("Çalışan listesi yüklenemedi:", err);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchTeams();
      fetchEmployees();
    }
  }, [currentUserId]);

  // Modal açma işlemleri
  const handleCreateTeam = () => setIsModalOpen(true);

  const handleEditTeam = (team) => {
    setTeamToEdit(team);
    setEditTeam({
      name: team.name,
      description: team.description || "",
    });
    setIsEditModalOpen(true);
  };

  // Yeni takım kaydet
  const handleSaveTeam = async () => {
    try {
      if (!newTeam.name.trim()) {
        showAlert("Takım adı boş olamaz!", "error");
        return;
      }

      const requestData = {
        name: newTeam.name.trim(),
        description: newTeam.description.trim(),
      };

      const response = await fetch("http://localhost:8080/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`Takım kaydedilemedi: ${errorMessage}`);
      }

      await fetchTeams();
      setIsModalOpen(false);
      setNewTeam({ name: "", description: "" });
      showAlert("Takım başarıyla oluşturuldu!", "success");
    } catch (error) {
      console.error("Takım kaydetme hatası:", error);
      showAlert(`Hata: ${error.message}`, "error");
    }
  };

  // Takım güncelle
  const handleUpdateTeam = async () => {
    try {
      if (!editTeam.name.trim()) {
        showAlert("Takım adı boş olamaz!", "error");
        return;
      }

      const requestData = {
        name: editTeam.name.trim(),
        description: editTeam.description.trim(),
      };

      const response = await fetch(
        `http://localhost:8080/api/teams/${teamToEdit.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`Takım güncellenemedi: ${errorMessage}`);
      }

      await fetchTeams();
      setIsEditModalOpen(false);
      setTeamToEdit(null);
      setEditTeam({ name: "", description: "" });
      showAlert("Takım başarıyla güncellendi!", "success");
    } catch (error) {
      console.error("Takım güncelleme hatası:", error);
      showAlert(`Hata: ${error.message}`, "error");
    }
  };

  // Takım sil
  const handleDeleteTeam = async (teamId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/teams/${teamId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Takım silinemedi!");
      }

      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      showAlert("Takım başarıyla silindi!", "success");
    } catch (error) {
      console.error("Silme hatası:", error);
      showAlert(`Hata: ${error.message}`, "error");
    }
  };

  // Üye çıkar
  const handleRemoveMember = async (teamId, memberId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/teamMembers/${memberId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`Üye silinemedi: ${errorMessage}`);
      }

      await fetchTeams();
      showAlert("Üye takımdan çıkarıldı!", "success");
    } catch (error) {
      console.error("Üye silme hatası:", error);
      showAlert(`Hata: ${error.message}`, "error");
    }
  };

  // Çoklu üye ekleme
  const handleAddMultipleMembers = async () => {
    if (selectedMembers.length === 0) {
      showAlert("Lütfen en az bir çalışan seçin!", "error");
      return;
    }

    setIsAddingMembers(true);

    try {
      // Mevcut üyeleri kontrol et
      const currentMemberIds = selectedTeamForMember.members
        ? selectedTeamForMember.members.map((member) => member.id)
        : [];

      const alreadyAddedMembers = [];
      const newMembersToAdd = [];

      selectedMembers.forEach((employeeId) => {
        const empId = parseInt(employeeId);
        if (currentMemberIds.includes(empId)) {
          const employee = employees.find((emp) => emp.id === empId);
          if (employee) {
            alreadyAddedMembers.push(
              `${employee.firstName} ${employee.lastName}`
            );
          }
        } else {
          newMembersToAdd.push(empId);
        }
      });

      // Zaten mevcut üyeler varsa uyarı ver
      if (alreadyAddedMembers.length > 0) {
        const message =
          alreadyAddedMembers.length === 1
            ? `${alreadyAddedMembers[0]} zaten bu takımda mevcut.`
            : `Şu kişiler zaten bu takımda mevcut: ${alreadyAddedMembers.join(
                ", "
              )}`;

        if (newMembersToAdd.length === 0) {
          showAlert(message, "info");
          setIsAddingMembers(false);
          return;
        } else {
          showAlert(`${message} Diğer üyeler eklenecek.`, "info");
        }
      }

      if (newMembersToAdd.length > 0) {
        // Üyeleri takıma ekle
        const promises = newMembersToAdd.map(async (employeeId) => {
          const requestData = {
            team: { id: selectedTeamForMember.id },
            employee: { id: parseInt(employeeId) },
            role: defaultRole,
          };

          const response = await fetch(
            "http://localhost:8080/api/teamMembers",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              credentials: "include",
              body: JSON.stringify(requestData),
            }
          );

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
              const errorData = await response.json();
              errorMessage =
                errorData.message || errorData.error || errorMessage;
            } catch (parseError) {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            }
            throw new Error(`Üye eklenemedi: ${errorMessage}`);
          }

          return response.json();
        });

        await Promise.all(promises);
        await fetchTeams();

        showAlert(
          `${newMembersToAdd.length} üye başarıyla eklendi!`,
          "success"
        );
      }

      // Modal'ı kapat
      setIsAddMemberModalOpen(false);
      setSelectedTeamForMember(null);
      setSelectedMembers([]);
      setMemberSearchTerm("");
      setDefaultRole("MEMBER");
    } catch (error) {
      console.error("Çoklu üye ekleme hatası:", error);
      showAlert(`Hata: ${error.message}`, "error");
    } finally {
      setIsAddingMembers(false);
    }
  };

  // Çalışan seçimi toggle
  const toggleEmployeeSelection = (employeeId) => {
    setSelectedMembers((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  // Tümünü seç/kaldır
  const toggleAllVisibleEmployees = () => {
    const filteredEmployees = getAvailableEmployees();
    const allVisible = filteredEmployees.every((emp) =>
      selectedMembers.includes(emp.id.toString())
    );

    if (allVisible) {
      const visibleIds = filteredEmployees.map((emp) => emp.id.toString());
      setSelectedMembers((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      const visibleIds = filteredEmployees.map((emp) => emp.id.toString());
      setSelectedMembers((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  // Eklenebilir çalışanları getir
  const getAvailableEmployees = () => {
    if (!selectedTeamForMember) return [];

    const teamMemberIds = selectedTeamForMember.members
      ? selectedTeamForMember.members.map((member) => member.id)
      : [];

    return employees
      .filter((employee) => !teamMemberIds.includes(employee.id))
      .filter(
        (employee) =>
          memberSearchTerm === "" ||
          `${employee.firstName} ${employee.lastName}`
            .toLowerCase()
            .includes(memberSearchTerm.toLowerCase())
      );
  };

  // Rol ikonu
  const getRoleIcon = (role) => {
    switch (role) {
      case "TEAM_LEAD":
        return <Crown size={14} />;
      default:
        return <User size={14} />;
    }
  };

  // Rol rengi
  const getRoleColor = (role) => {
    switch (role) {
      case "TEAM_LEAD":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Tarih formatla
  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("tr-TR")
      : "Belirtilmedi";

  // Takım filtrele
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Loading durumu
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mb-4"></div>
        <p className="text-gray-500 text-lg">Takımlar yükleniyor...</p>
      </div>
    );

  // Error durumu
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
        <AlertCircle size={48} color="#ef4444" className="mb-4" />
        <h2 className="text-red-500 text-xl font-semibold mb-2">Hata Oluştu</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchTeams}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Tekrar Dene
        </button>
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Alert */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md ${
            alert.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : alert.type === "error"
              ? "bg-red-100 text-red-800 border border-red-200"
              : alert.type === "info"
              ? "bg-blue-100 text-blue-800 border border-blue-200"
              : "bg-gray-100 text-gray-800 border border-gray-200"
          }`}
        >
          {alert.type === "success" && <CheckCircle size={20} />}
          {alert.type === "error" && <AlertCircle size={20} />}
          {alert.type === "info" && <Info size={20} />}
          <span className="flex-1">{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            className="text-current opacity-70 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Users size={32} color="#2563eb" />
          Takım Yönetimi
        </h1>
        <button
          onClick={handleCreateTeam}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Yeni Takım
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="relative min-w-[300px]">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Takım ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg border-gray-300 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Teams */}
      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-2xl shadow border transition-transform hover:shadow-lg hover:-translate-y-1"
            >
              <div className="p-6 border-b">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex-1">
                    {team.name}
                  </h3>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => handleEditTeam(team)}
                      className="text-gray-400 hover:text-green-600 transition"
                      title="Takımı Düzenle"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTeamForMember(team);
                        setIsAddMemberModalOpen(true);
                      }}
                      className="text-gray-400 hover:text-blue-600 transition"
                      title="Üye Ekle"
                    >
                      <UserPlus size={18} />
                    </button>
                    <button
                      onClick={() => setTeamToDelete(team)}
                      className="text-gray-400 hover:text-red-600 transition"
                      title="Takımı Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-500 text-sm mb-4">
                  {team.description || "Açıklama bulunmuyor"}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {team.members ? team.members.length : 0} üye
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(team.createdAt)}
                  </span>
                </div>
              </div>

              {/* Team Members */}
              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User size={14} />
                  Takım Üyeleri
                </h4>

                {team.members && team.members.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {team.members
                      .slice()
                      .sort((a, b) => {
                        // Lider önce
                        if (a.role === "TEAM_LEAD" && b.role !== "TEAM_LEAD")
                          return -1;
                        if (a.role !== "TEAM_LEAD" && b.role === "TEAM_LEAD")
                          return 1;
                        return 0;
                      })
                      .map((member, index) => (
                        <div
                          key={member.id || index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User size={14} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {member.firstName} {member.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.role && (
                              <div
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRoleColor(
                                  member.role
                                )}`}
                              >
                                {getRoleIcon(member.role)}
                                {member.role}
                              </div>
                            )}
                            <button
                              onClick={() =>
                                handleRemoveMember(team.id, member.id)
                              }
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
                              title="Üyeyi Takımdan Çıkar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Henüz üye yok</p>
                    <button
                      onClick={() => {
                        setSelectedTeamForMember(team);
                        setIsAddMemberModalOpen(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                    >
                      İlk üyeyi ekle
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Users size={64} color="#d1d5db" className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Henüz takım yok
          </h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            İlk takımınızı oluşturarak takım yönetimine başlayın
          </p>
          <button
            onClick={handleCreateTeam}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition"
          >
            <Plus size={18} /> İlk Takımı Oluştur
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {teamToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Takımı Sil
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-bold text-red-500">
                {teamToDelete.name}
              </span>{" "}
              adlı takımı silmek üzeresiniz. Bu işlem geri alınamaz.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Onaylamak için takım adını yazın:
            </p>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4 focus:border-red-500 outline-none"
              placeholder="Takım adını yazın..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setTeamToDelete(null);
                  setConfirmName("");
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  if (confirmName === teamToDelete.name) {
                    handleDeleteTeam(teamToDelete.id);
                    setTeamToDelete(null);
                    setConfirmName("");
                  } else {
                    showAlert("Takım adı eşleşmiyor!", "error");
                  }
                }}
                disabled={confirmName !== teamToDelete.name}
                className={`px-4 py-2 rounded-lg text-white ${
                  confirmName === teamToDelete.name
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

      {/* Create Team Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Yeni Takım Oluştur
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Takım Adı *
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 outline-none"
                  placeholder="Takım adını girin..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 outline-none h-20 resize-none"
                  placeholder="Takım açıklaması..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewTeam({ name: "", description: "" });
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSaveTeam}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {isEditModalOpen && teamToEdit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Takımı Düzenle: {teamToEdit.name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Takım Adı *
                </label>
                <input
                  type="text"
                  value={editTeam.name}
                  onChange={(e) =>
                    setEditTeam({ ...editTeam, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 outline-none"
                  placeholder="Takım adını girin..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={editTeam.description}
                  onChange={(e) =>
                    setEditTeam({ ...editTeam, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 outline-none h-20 resize-none"
                  placeholder="Takım açıklaması..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setTeamToEdit(null);
                  setEditTeam({ name: "", description: "" });
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Vazgeç
              </button>
              <button
                onClick={handleUpdateTeam}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Multiple Members Modal */}
      {isAddMemberModalOpen && selectedTeamForMember && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl h-[600px] shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedTeamForMember.name} Takımına Üye Ekle
              </h2>
              <button
                onClick={() => {
                  setIsAddMemberModalOpen(false);
                  setSelectedTeamForMember(null);
                  setSelectedMembers([]);
                  setMemberSearchTerm("");
                  setDefaultRole("MEMBER");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Varsayılan Rol */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Varsayılan Rol (Tüm seçili üyeler için)
                  </label>
                  <select
                    value={defaultRole}
                    onChange={(e) => setDefaultRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 outline-none"
                  >
                    <option value="MEMBER">Üye</option>
                    <option value="TEAM_LEAD">Takım Lideri</option>
                  </select>
                </div>

                {/* Çalışan Arama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Çalışan Ara
                  </label>
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-blue-500 outline-none"
                      placeholder="Çalışan adı ara..."
                    />
                  </div>
                </div>

                {/* Seçim Kontrolü */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {selectedMembers.length} çalışan seçildi
                  </div>
                  <button
                    onClick={toggleAllVisibleEmployees}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {getAvailableEmployees().every((emp) =>
                      selectedMembers.includes(emp.id.toString())
                    )
                      ? "Tüm Seçimleri Kaldır"
                      : "Tümünü Seç"}
                  </button>
                </div>

                {/* Çalışan Listesi */}
                <div className="border rounded-lg h-64 overflow-y-auto">
                  {getAvailableEmployees().length > 0 ? (
                    <div className="p-2">
                      {getAvailableEmployees().map((employee) => (
                        <div
                          key={employee.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedMembers.includes(employee.id.toString())
                              ? "bg-blue-50 border border-blue-200"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() =>
                            toggleEmployeeSelection(employee.id.toString())
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User size={16} className="text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {employee.email || "Email belirtilmemiş"}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedMembers.includes(employee.id.toString())
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedMembers.includes(
                              employee.id.toString()
                            ) && <Check size={12} className="text-white" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">
                        {memberSearchTerm
                          ? "Arama kriterine uygun çalışan bulunamadı"
                          : "Eklenebilecek çalışan bulunamadı"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Seçili Üyeler Özeti */}
                {selectedMembers.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      Seçili Çalışanlar ({selectedMembers.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((employeeId) => {
                        const employee = employees.find(
                          (emp) => emp.id.toString() === employeeId
                        );
                        return employee ? (
                          <div
                            key={employeeId}
                            className="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs"
                          >
                            <span>
                              {employee.firstName} {employee.lastName}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEmployeeSelection(employeeId);
                              }}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-6 pt-4 border-t flex-shrink-0">
              <button
                onClick={() => {
                  setIsAddMemberModalOpen(false);
                  setSelectedTeamForMember(null);
                  setSelectedMembers([]);
                  setMemberSearchTerm("");
                  setDefaultRole("MEMBER");
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={handleAddMultipleMembers}
                disabled={selectedMembers.length === 0 || isAddingMembers}
                className={`px-4 py-2 rounded-lg text-white transition flex items-center gap-2 ${
                  selectedMembers.length === 0 || isAddingMembers
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isAddingMembers ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    {selectedMembers.length} Üyeyi Ekle
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMember;
