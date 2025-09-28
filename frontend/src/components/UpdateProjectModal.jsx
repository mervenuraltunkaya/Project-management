import { useState } from "react";
import { X, Save, Loader, AlertTriangle } from "lucide-react";

// Proje güncelleme modalı
export default function UpdateProjectModal({ project, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: project.name || "",
    description: project.description || "",
    status: project.status || "",
    priority: project.priority || "",
    startDate: project.startDate ? project.startDate.split("T")[0] : "",
    endDate: project.endDate ? project.endDate.split("T")[0] : "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form alanı değiştiğinde
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Hata varsa temizle
    if (error) setError("");
  };

  // Form gönderildiğinde
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Tarih kontrolü
    if (
      formData.startDate &&
      formData.endDate &&
      formData.endDate < formData.startDate
    ) {
      setError("Bitiş tarihi başlangıç tarihinden önce olamaz!");
      return;
    }

    setIsLoading(true);

    try {
      // Güncellenecek veriyi hazırla
      const updateData = {
        name: formData.name?.trim(),
        description: formData.description?.trim(),
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate ? formData.startDate + "T00:00:00" : null,
        endDate: formData.endDate ? formData.endDate + "T00:00:00" : null,
      };

      // Mevcut ilişkili verileri koru
      if (project.employee) {
        updateData.employee = project.employee;
      }
      if (project.team) {
        updateData.team = project.team;
      }
      if (project.createdBy) {
        updateData.createdBy = project.createdBy;
      }

      console.log("Güncellenecek veri:", updateData);

      // Backend'e PATCH isteği gönder
      const response = await fetch(
        `http://localhost:8080/api/projects/${project.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const updatedProject = await response.json();
        console.log("Güncellenmiş proje alındı:", updatedProject);

        // Task'ları koru
        updatedProject.tasks = project.tasks || [];

        onUpdate(updatedProject);
        onClose();
      } else {
        const errorText = await response.text();
        console.error("Proje güncellenirken hata oluştu:", errorText);
        setError("Proje güncellenirken hata oluştu: " + errorText);
      }
    } catch (error) {
      console.error("Ağ hatası:", error);
      setError("Ağ hatası: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Üst başlık */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Proje Düzenle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Proje Adı */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Proje Adı
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
              disabled={isLoading}
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Durum */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Durum
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
              disabled={isLoading}
            >
              <option value="">Durum Seçin</option>
              <option value="TODO">Yapılacak</option>
              <option value="IN_PROGRESS">Devam Ediyor</option>
              <option value="DONE">Tamamlandı</option>
              <option value="ON_HOLD">Beklemede</option>
            </select>
          </div>

          {/* Öncelik */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Öncelik
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
              disabled={isLoading}
            >
              <option value="">Öncelik Seçin</option>
              <option value="LOW">Düşük</option>
              <option value="MEDIUM">Orta</option>
              <option value="HIGH">Yüksek</option>
              <option value="CRITICAL">Kritik</option>
            </select>
          </div>

          {/* Tarihler */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={true}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                title="Başlangıç tarihi değiştirilemez"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Alt butonlar */}
          <div className="flex space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 disabled:opacity-50 font-semibold transition-colors"
              disabled={isLoading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Güncelle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
