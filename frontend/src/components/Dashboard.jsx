import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FolderOpen,
  CheckCircle2,
  Users,
  AlertTriangle,
  Clock,
  Calendar,
  BarChart3,
} from "lucide-react";

const Dashboard = () => {
  // Ana istatistik verileri
  const [stats, setStats] = useState({
    projects: 0, // Toplam proje sayısı
    activeProjects: 0, // Aktif proje sayısı
    completedProjects: 0, // Tamamlanan proje sayısı
    tasks: 0, // Toplam görev sayısı
    teams: 0, // Takım sayısı
    overdue: 0, // Gecikmiş görev sayısı
    upcoming: 0, // Yaklaşan görev sayısı
    completion: 0, // Tamamlanma oranı (%)
  });

  // UI durumları
  const [loading, setLoading] = useState(true); // Yükleme durumu
  const [error, setError] = useState(null); // Hata durumu
  const [upcomingTasks, setUpcomingTasks] = useState([]); // Yaklaşan görevler listesi

  // ============================================================================
  // YARDIMCI FONKSİYONLAR
  // ============================================================================

  // Geçerli tarih nesnesi oluşturur

  const getValidDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  };

  // Görevin bitiş tarihini bulur (çoklu alan desteği)

  const getTaskDueDate = (task) => {
    const possibleFields = [
      task.endDate,
      task.deadline,
      task.end_date,
      task.targetDate,
    ];

    for (const field of possibleFields) {
      if (field) return field;
    }
    return null;
  };

  // Tarihi Türkçe formatta formatlar

  const formatDate = (dateValue) => {
    if (!dateValue) return "Tarih yok";
    const date = getValidDate(dateValue);
    if (!date) return "Geçersiz tarih";

    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Verilen tarihten bugüne kadar kalan gün sayısını hesaplar

  const getDaysLeft = (dateValue) => {
    if (!dateValue) return 0;
    const date = getValidDate(dateValue);
    if (!date) return 0;

    const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // ============================================================================
  // CHART KOMPONENTLERİ
  // ============================================================================

  /**
   * Proje Durumu Donut Chart Komponenti
   * Projeleri durumlarına göre görselleştirir
   */
  const ProjectStatusChart = ({ projects }) => {
    // Proje durumlarını say
    const todoProjects = projects.filter((p) => p.status === "TODO").length;
    const inProgressProjects = projects.filter(
      (p) => p.status === "IN_PROGRESS"
    ).length;
    const doneProjects = projects.filter((p) => p.status === "DONE").length;
    const cancelledProjects = projects.filter(
      (p) => p.status === "CANCELLED"
    ).length;

    // Chart için veri hazırla
    const data = [
      { name: "Yapılacak", value: todoProjects, color: "#f2a885" },
      { name: "Devam Ediyor", value: inProgressProjects, color: "#3b82f6" },
      { name: "Tamamlanan", value: doneProjects, color: "#10b981" },
      { name: "İptal Edildi", value: cancelledProjects, color: "#ef4444" },
    ].filter((item) => item.value > 0); // Sıfır değerli kategorileri filtrele

    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Boş durum gösterimi
    if (total === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-slate-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">Henüz proje bulunmuyor</p>
          </div>
        </div>
      );
    }

    let currentAngle = -90; // Chart başlangıç açısı

    return (
      <div className="flex items-center justify-between h-full">
        {/* SVG Donut Chart */}
        <div className="relative">
          <svg width="240" height="240" className="transform -rotate-90">
            {/* Arka plan dairesi */}
            <circle
              cx="120"
              cy="120"
              r="100"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="20"
            />
            {/* Veri segmentleri */}
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage * 360) / 100;
              const circumference = 2 * Math.PI * 100;
              const length = (percentage / 100) * circumference;

              const strokeDasharray = `${length} ${circumference - length}`;
              const strokeDashoffset = -(currentAngle / 360) * circumference;

              const result = (
                <circle
                  key={index}
                  cx="120"
                  cy="120"
                  r="100"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-in-out"
                />
              );

              currentAngle += angle;
              return result;
            })}
          </svg>

          {/* Merkez bilgi alanı */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-slate-900">{total}</div>
            <div className="text-sm text-slate-500 text-center">
              Toplam
              <br />
              Proje
            </div>
          </div>
        </div>

        {/* Legend (Açıklama) */}
        <div className="flex flex-col space-y-4 ml-8">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3 group">
              <div
                className="w-4 h-4 rounded-full transition-transform group-hover:scale-125"
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">
                  {item.name}
                </div>
                <div className="text-xs text-slate-500">{item.value} proje</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {Math.round((item.value / total) * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // VERİ YÜKLEME FONKSİYONU
  // ============================================================================

  useEffect(() => {
    /**
     * Tüm dashboard verilerini paralel olarak yükler
     */
    const fetchAll = async () => {
      try {
        // Paralel API çağrıları
        const [projectsRes, tasksRes, teamsRes] = await Promise.all([
          axios.get("/api/projects"),
          axios.get("/api/tasks"),
          axios.get("/api/teams"),
        ]);

        const projects = projectsRes.data;
        const tasks = tasksRes.data;
        const teams = teamsRes.data;

        console.log("Projects data:", projects.slice(0, 2));
        console.log("Tasks data:", tasks.slice(0, 2));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Proje istatistikleri hesaplama
        const activeProjects = projects.filter(
          (p) => p.status === "TODO" || p.status === "IN_PROGRESS"
        ).length;
        const completedProjects = projects.filter(
          (p) => p.status === "DONE"
        ).length;

        // Görev istatistikleri hesaplama
        const overdueCount = tasks.filter(
          (t) => t.status === "overdue" || t.status === "OVERDUE"
        ).length;

        const completedTasks = tasks.filter(
          (t) =>
            t.status === "completed" ||
            t.status === "COMPLETED" ||
            t.status === "done" ||
            t.status === "DONE"
        ).length;

        // Yaklaşan görevleri filtrele (3 gün içinde)
        const upcomingTasks = tasks.filter((t) => {
          const possibleDateFields = [
            t.endDate,
            t.deadline,
            t.end_date,
            t.targetDate,
          ];

          for (const dateField of possibleDateFields) {
            const taskDate = getValidDate(dateField);
            if (taskDate) {
              taskDate.setHours(0, 0, 0, 0);
              const daysDiff = Math.ceil(
                (taskDate - today) / (1000 * 60 * 60 * 24)
              );
              if (daysDiff <= 3 && daysDiff > 0) {
                return true;
              }
            }
          }
          return false;
        });

        // Tamamlanma oranını hesapla
        const completionRate =
          tasks.length > 0
            ? Math.round((completedTasks / tasks.length) * 100)
            : 0;

        // State güncelleme
        setStats({
          projects: projects.length,
          activeProjects: activeProjects,
          completedProjects: completedProjects,
          tasks: tasks.length,
          teams: teams.length,
          overdue: overdueCount,
          upcoming: upcomingTasks.length,
          completion: completionRate,
          projectsData: projects, // Chart için
        });

        // Yaklaşan görevleri tarihe göre sırala ve sınırla
        const upcoming = upcomingTasks
          .sort((a, b) => {
            const getTaskDueDate = (task) => {
              const possibleFields = [
                task.endDate,
                task.deadline,
                task.end_date,
              ];
              for (const field of possibleFields) {
                const date = getValidDate(field);
                if (date) return date;
              }
              return new Date();
            };

            return getTaskDueDate(a) - getTaskDueDate(b);
          })
          .slice(0, 6);

        setUpcomingTasks(upcoming);

        console.log("Final stats:", {
          total: projects.length,
          active: activeProjects,
          completed: completedProjects,
        });
      } catch (err) {
        console.error("API Error:", err);
        setError(`Veriler alınamadı: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ============================================================================
  // UI KOMPONENTLERİ
  // ============================================================================

  /**
   * İstatistik Kartı Komponenti
   */
  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );

  // ============================================================================
  // LOADING VE ERROR DURUMU
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center text-red-500 bg-white p-8 rounded-2xl shadow-lg">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ANA RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* CSS Animasyonları */}
      <style jsx>{`
        @keyframes drawCircle {
          from {
            stroke-dasharray: 0 628;
          }
          to {
            stroke-dasharray: var(--target-dash) 628;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Ana İstatistik Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FolderOpen}
            title="Aktif Projeler"
            value={stats.activeProjects}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            icon={CheckCircle2}
            title="Tamamlanan Projeler"
            value={stats.completedProjects}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            icon={Clock}
            title="Yaklaşan Görevler"
            value={stats.upcoming}
            color="bg-gradient-to-r from-orange-500 to-orange-600"
          />
          <StatCard
            icon={AlertTriangle}
            title="Gecikmiş Görevler"
            value={stats.overdue}
            color="bg-gradient-to-r from-red-500 to-red-600"
          />
        </div>

        {/* Proje Durumu Chart */}
        <div className="grid grid-cols-1 gap-8 mb-8 w-full">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 col-span-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-500" />
              Proje Durumu Dağılımı
            </h2>
            <div className="h-80 flex items-center justify-center">
              <ProjectStatusChart projects={stats.projectsData || []} />
            </div>
          </div>
        </div>

        {/* Ek İstatistikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <StatCard
            icon={Users}
            title="Takım Üyeleri"
            value={stats.teams}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatCard
            icon={BarChart3}
            title="Görev Tamamlanma Oranı"
            value={`${stats.completion}%`}
            color="bg-gradient-to-r from-indigo-500 to-indigo-600"
          />
        </div>

        {/* Yaklaşan Görevler Listesi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Yaklaşan Görevler
            </h2>
            <span className="text-sm text-slate-500">3 gün içinde</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task, index) => (
                <div
                  key={task.id || index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-1">
                      {task.title || task.name || `Görev ${index + 1}`}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatDate(getTaskDueDate(task))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs bg-orange-200 text-orange-800 px-3 py-1 rounded-full font-medium">
                      {getDaysLeft(getTaskDueDate(task))} gün
                    </span>
                  </div>
                </div>
              ))
            ) : (
              // Boş durum gösterimi
              <div className="col-span-full text-slate-500 text-center py-12 bg-slate-50 rounded-xl">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium mb-2">
                  Yaklaşan görev bulunmuyor
                </p>
                <p className="text-sm">
                  Önümüzdeki 3 gün içinde tamamlanması gereken görev yok
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
