import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FolderOpen,
  CheckCircle2,
  Users,
  AlertTriangle,
  Clock,
  Calendar,
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    teams: 0,
    overdueProjects: 0,
    upcomingTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  const getValidDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  };

  const getTaskDueDate = (task) => {
    return (
      task.endDate || task.deadline || task.end_date || task.targetDate || null
    );
  };

  const formatDate = (dateValue) => {
    const date = getValidDate(dateValue);
    return date ? date.toLocaleDateString("tr-TR") : "Tarih yok";
  };

  const getDaysLeft = (dateValue) => {
    const date = getValidDate(dateValue);
    if (!date) return 0;
    const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, tasksRes, teamsRes] = await Promise.all([
          axios.get("/api/projects"),
          axios.get("/api/tasks"),
          axios.get("/api/teams"),
        ]);

        const projects = projectsRes.data;
        const tasks = tasksRes.data;
        const teams = teamsRes.data;

        const today = new Date();

        // İstatistikleri hesapla
        const activeProjects = projects.filter(
          (p) => p.status === "TODO" || p.status === "IN_PROGRESS"
        ).length;
        const completedProjects = projects.filter(
          (p) => p.status === "DONE"
        ).length;

        const overdueProjects = projects.filter((project) => {
          if (project.status === "DONE" || project.status === "CANCELLED")
            return false;
          const endDate = getValidDate(project.endDate);
          return endDate && endDate < today;
        }).length;

        // Yaklaşan görevler (3 gün içinde)
        const upcoming = tasks.filter((t) => {
          const taskDate = getValidDate(getTaskDueDate(t));
          if (!taskDate) return false;
          const daysDiff = Math.ceil(
            (taskDate - today) / (1000 * 60 * 60 * 24)
          );
          return daysDiff <= 3 && daysDiff > 0;
        });

        setStats({
          activeProjects,
          completedProjects,
          teams: teams.length,
          overdueProjects,
          upcomingTasks: upcoming.length,
        });

        setUpcomingTasks(upcoming.slice(0, 6));
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${color} w-fit mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Ana İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            icon={FolderOpen}
            title="Aktif Projeler"
            value={stats.activeProjects}
            color="bg-blue-500"
          />
          <StatCard
            icon={CheckCircle2}
            title="Tamamlanan Projeler"
            value={stats.completedProjects}
            color="bg-green-500"
          />
          <StatCard
            icon={AlertTriangle}
            title="Gecikmiş Projeler"
            value={stats.overdueProjects}
            color="bg-red-500"
          />
          <StatCard
            icon={Clock}
            title="Yaklaşan Görevler"
            value={stats.upcomingTasks}
            color="bg-orange-500"
          />
          <StatCard
            icon={Users}
            title="Takım Üyeleri"
            value={stats.teams}
            color="bg-purple-500"
          />
        </div>

        {/* Yaklaşan Görevler */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Yaklaşan Görevler (3 gün içinde)
          </h2>

          {upcomingTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingTasks.map((task, index) => (
                <div
                  key={task.id || index}
                  className="p-4 bg-gray-50 rounded-lg border"
                >
                  <p className="font-medium text-gray-900 mb-2">
                    {task.title || task.name || `Görev ${index + 1}`}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {formatDate(getTaskDueDate(task))}
                  </p>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {getDaysLeft(getTaskDueDate(task))} gün kaldı
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Yaklaşan görev bulunmuyor</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
