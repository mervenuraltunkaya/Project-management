// utils/roleUtils.js
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error parsing current user:", error);
    return null;
  }
};

export const getCurrentUserId = () => {
  const storedUserId = localStorage.getItem("currentUserId");
  return storedUserId ? parseInt(storedUserId) : null;
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.role && user.role.roleName === "Admin";
};

export const isUser = () => {
  const user = getCurrentUser();
  return user && user.role && user.role.roleName === "User";
};

export const hasRole = (roleName) => {
  const user = getCurrentUser();
  return user && user.role && user.role.roleName === roleName;
};

// Kullanıcının görebileceği projeleri filtrele
export const filterProjectsForUser = (projects) => {
  if (isAdmin()) {
    return projects; // Admin tüm projeleri görebilir
  }

  const currentUserId = getCurrentUserId();
  if (!currentUserId) return [];

  // User sadece kendisinin dahil olduğu projeleri görebilir
  return projects.filter((project) => {
    // Projenin kendisine atanmış olması
    if (project.employee && project.employee.id === currentUserId) {
      return true;
    }

    // Projeyi kendisinin oluşturmuş olması
    if (project.createdBy && project.createdBy.id === currentUserId) {
      return true;
    }

    // Proje manager'ı olması
    if (
      project.assignedManager &&
      project.assignedManager.id === currentUserId
    ) {
      return true;
    }

    // Projenin takımında üye olması (takım kontrolü)
    if (project.team && project.team.members) {
      return project.team.members.some((member) => member.id === currentUserId);
    }

    return false;
  });
};

// Kullanıcının görebileceği görevleri filtrele
export const filterTasksForUser = (tasks) => {
  if (isAdmin()) {
    return tasks; // Admin tüm görevleri görebilir
  }

  const currentUserId = getCurrentUserId();
  if (!currentUserId) return [];

  // User sadece kendisinin dahil olduğu görevleri görebilir
  return tasks.filter((task) => {
    // Görevi kendisinin oluşturmuş olması
    if (task.createdBy && task.createdBy.id === currentUserId) {
      return true;
    }

    // Görevin kendisine atanmış olması
    if (task.assignedTo && task.assignedTo.id === currentUserId) {
      return true;
    }

    // Çoklu assignment varsa kendisinin dahil olması
    if (task.assignedEmployees && task.assignedEmployees.length > 0) {
      return task.assignedEmployees.some((emp) => emp.id === currentUserId);
    }

    return false;
  });
};

// Kullanıcının görebileceği takımları filtrele
export const filterTeamsForUser = (teams) => {
  if (isAdmin()) {
    return teams; // Admin tüm takımları görebilir
  }

  const currentUserId = getCurrentUserId();
  if (!currentUserId) return [];

  // User sadece üyesi olduğu takımları görebilir
  return teams.filter((team) => {
    if (team.members && team.members.length > 0) {
      return team.members.some((member) => member.id === currentUserId);
    }
    return false;
  });
};
