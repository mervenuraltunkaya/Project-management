import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  User,
  Calendar,
  Hash,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Paperclip,
  List,
  Download,
  Trash2,
  Search,
  RefreshCw,
} from "lucide-react";

/**
 * TaskAttachment Komponenti
 * Proje yönetim sisteminde görevlere dosya ekleme ve yönetme işlevlerini sağlar
 *
 * Özellikler:
 * - Dosya yükleme (drag & drop desteği)
 * - Dosya listeleme ve filtreleme
 * - Dosya indirme ve silme
 * - Revizyon takibi
 * - Kullanıcı yetkilendirmesi
 */
const FileUpload = () => {
  // ============================================================================
  // KULLANICI YETKİLENDİRME
  // ============================================================================

  /**
   * localStorage'dan mevcut kullanıcı ID'sini alır
   * @returns {number|null} Kullanıcı ID'si veya null
   */
  const getCurrentUserId = () => {
    const storedUserId = localStorage.getItem("currentUserId");
    return storedUserId ? parseInt(storedUserId) : null;
  };

  // Mevcut kullanıcı ID'si - sayfa yüklendiğinde bir kez alınır
  const [currentUserId] = useState(getCurrentUserId());

  // Aktif sekme kontrolü (upload/list)
  const [activeTab, setActiveTab] = useState("upload");

  // ============================================================================
  // DOSYA YÜKLEME STATE'LERİ
  // ============================================================================

  const [selectedFiles, setSelectedFiles] = useState([]); // Yüklenmeyi bekleyen dosyalar
  const [tasks, setTasks] = useState([]); // Mevcut görevler listesi
  const [selectedTask, setSelectedTask] = useState(""); // Seçilen görev ID'si
  const [revisionNumber, setRevisionNumber] = useState(1); // Revizyon numarası
  const [isUploading, setIsUploading] = useState(false); // Yükleme durumu
  const [uploadProgress, setUploadProgress] = useState(0); // Yükleme yüzdesi
  const [isDragging, setIsDragging] = useState(false); // Drag & drop durumu

  // ============================================================================
  // DOSYA LİSTELEME STATE'LERİ
  // ============================================================================

  const [attachments, setAttachments] = useState([]); // Tüm ekler
  const [filteredAttachments, setFilteredAttachments] = useState([]); // Filtrelenmiş ekler
  const [isLoading, setIsLoading] = useState(false); // Yükleme durumu
  const [searchTerm, setSearchTerm] = useState(""); // Arama terimi
  const [taskFilter, setTaskFilter] = useState(""); // Görev filtresi
  const [typeFilter, setTypeFilter] = useState(""); // Dosya türü filtresi

  // ============================================================================
  // SİLME MODAL STATE'LERİ
  // ============================================================================

  const [attachmentToDelete, setAttachmentToDelete] = useState(null); // Silinecek ek
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Modal durumu

  // ============================================================================
  // GENEL STATE'LER
  // ============================================================================

  const [message, setMessage] = useState({ type: "", text: "" }); // Bildirim mesajları
  const fileInputRef = useRef(null); // Dosya input referansı
  const dragCounter = useRef(0); // Drag event sayacı

  // ============================================================================
  // KULLANICI GİRİŞ KONTROLÜ
  // ============================================================================

  useEffect(() => {
    if (!currentUserId) {
      alert("Lütfen önce giriş yapın!");
      window.location.href = "/login";
      return;
    }
  }, [currentUserId]);

  // ============================================================================
  // VERİ YÜKLEME FONKSİYONLARI
  // ============================================================================

  /**
   * Backend'den görevleri yükler
   */
  const fetchTasks = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/tasks", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Görevler yüklenemedi");

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Görev yükleme hatası:", error);
      setMessage({ type: "error", text: "Görevler yüklenirken hata oluştu" });
    }
  };

  /**
   * Backend'den ekleri yükler
   */
  const fetchAttachments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8080/api/attachments", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Ekler yüklenemedi");

      const data = await response.json();
      setAttachments(data.reverse()); // En yeni dosyaları önce göster
    } catch (error) {
      console.error("Ek yükleme hatası:", error);
      setMessage({ type: "error", text: "Ekler yüklenirken hata oluştu" });
    } finally {
      setIsLoading(false);
    }
  };

  // Sayfa yüklendiğinde ve sekme değiştiğinde verileri yükle
  useEffect(() => {
    if (currentUserId) {
      fetchTasks();
      if (activeTab === "list") {
        fetchAttachments();
      }
    }
  }, [currentUserId, activeTab]);

  // ============================================================================
  // FİLTRELEME LOGİĞİ
  // ============================================================================

  /**
   * Ekler listesini arama ve filtre kriterlerine göre filtreler
   */
  useEffect(() => {
    let filtered = attachments;

    // Dosya adına göre arama
    if (searchTerm) {
      filtered = filtered.filter((attachment) =>
        attachment.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Göreve göre filtreleme
    if (taskFilter) {
      filtered = filtered.filter(
        (attachment) => attachment.task?.id.toString() === taskFilter
      );
    }

    // Dosya türüne göre filtreleme
    if (typeFilter) {
      filtered = filtered.filter((attachment) => {
        const fileName = attachment.fileName.toLowerCase();
        switch (typeFilter) {
          case "image":
            return /\.(jpg|jpeg|png|gif|webp|svg)$/.test(fileName);
          case "document":
            return /\.(pdf|doc|docx|txt|rtf)$/.test(fileName);
          case "spreadsheet":
            return /\.(xls|xlsx|csv)$/.test(fileName);
          case "archive":
            return /\.(zip|rar|7z|tar)$/.test(fileName);
          default:
            return true;
        }
      });
    }

    setFilteredAttachments(filtered);
  }, [attachments, searchTerm, taskFilter, typeFilter]);

  // ============================================================================
  // DRAG & DROP FONKSİYONLARI
  // ============================================================================

  /**
   * Dosya sürüklenmeye başlandığında tetiklenir
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  /**
   * Dosya sürükleme alanından çıkıldığında tetiklenir
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  /**
   * Dosya sürükleme esnasında tetiklenir
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Dosya bırakıldığında tetiklenir
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  // ============================================================================
  // DOSYA İŞLEME FONKSİYONLARI
  // ============================================================================

  /**
   * Dosya seçim input'u değiştiğinde tetiklenir
   */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  /**
   * Seçilen dosyaları işler ve listeye ekler
   * Aynı isim ve boyuttaki dosyaları tekrar eklemeyi önler
   */
  const handleFiles = (files) => {
    const newFiles = files.filter(
      (file) =>
        !selectedFiles.some(
          (existingFile) =>
            existingFile.name === file.name && existingFile.size === file.size
        )
    );

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  /**
   * Seçili dosyalar listesinden belirtilen dosyayı kaldırır
   */
  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Belirtilen ID'ye sahip eki siler
   */
  const deleteAttachment = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/attachments/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Ek silinemedi");

      // Eki listeden kaldır
      setAttachments((prev) => prev.filter((att) => att.id !== id));
      setMessage({ type: "success", text: "Ek başarıyla silindi!" });
    } catch (error) {
      console.error("Silme hatası:", error);
      setMessage({ type: "error", text: "Ek silinirken hata oluştu" });
    }
  };

  /**
   * Belirtilen eki indirir
   */
  const downloadFile = async (attachment) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/attachments/download/${attachment.id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("İndirme başarısız");

      // Blob oluştur ve indirmeyi başlat
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();

      // Temizlik
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: "success", text: "Dosya başarıyla indirildi!" });
    } catch (error) {
      console.error("İndirme hatası:", error);
      setMessage({ type: "error", text: "Dosya indirilemedi" });
    }
  };

  // ============================================================================
  // YARDIMCI FONKSİYONLAR
  // ============================================================================

  /**
   * Dosya uzantısına göre uygun ikonu döndürür
   */
  const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split(".").pop();

    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
      return <Image size={20} className="text-blue-500" />;
    }
    if (["mp4", "avi", "mkv", "mov"].includes(extension)) {
      return <Video size={20} className="text-purple-500" />;
    }
    if (["mp3", "wav", "flac", "ogg"].includes(extension)) {
      return <Music size={20} className="text-green-500" />;
    }
    if (["pdf", "doc", "docx", "txt"].includes(extension)) {
      return <FileText size={20} className="text-red-500" />;
    }
    if (["zip", "rar", "7z", "tar"].includes(extension)) {
      return <Archive size={20} className="text-yellow-500" />;
    }
    return <File size={20} className="text-gray-500" />;
  };

  /**
   * Byte cinsinden dosya boyutunu okunabilir formata çevirir
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  /**
   * Tarih string'ini Türkçe formatta gösterir
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Belirtilen görev ve dosya için maksimum revizyon numarasını bulur
   */
  const getMaxRevisionForFile = (taskId, fileName) => {
    const fileRevisions = attachments.filter(
      (att) => att.task?.id.toString() === taskId && att.fileName === fileName
    );
    if (fileRevisions.length === 0) return 0;
    return Math.max(...fileRevisions.map((att) => att.revisionNumber));
  };

  // ============================================================================
  // DOSYA YÜKLEME FONKSİYONLARI
  // ============================================================================

  /**
   * Ana dosya yükleme fonksiyonu
   * Tüm seçili dosyaları sırayla yükler ve revizyon kontrolü yapar
   */
  const handleUpload = async () => {
    // Validasyon kontrolleri
    if (selectedFiles.length === 0 || !selectedTask) {
      setMessage({
        type: "error",
        text: "Lütfen dosya seçin ve görev belirtin!",
      });
      return;
    }

    // Her dosya için revizyon kontrolü
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const maxRevision = getMaxRevisionForFile(selectedTask, file.name);

      if (revisionNumber + i <= maxRevision) {
        setMessage({
          type: "error",
          text: `Dosya "${file.name}" için revizyon numarası önceki revizyonlardan düşük veya eşit olamaz. Mevcut en yüksek revizyon: ${maxRevision}`,
        });
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage({ type: "", text: "" });

    try {
      // Her dosyayı sırayla yükle
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        await uploadSingleFile(file, i);
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      // Başarılı yükleme sonrası temizlik
      setMessage({
        type: "success",
        text: `${selectedFiles.length} dosya başarıyla yüklendi!`,
      });

      setSelectedFiles([]);
      setRevisionNumber((prev) => prev + selectedFiles.length);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Liste sekmesindeyse ekleri yenile
      if (activeTab === "list") fetchAttachments();
    } catch (error) {
      console.error("Upload hatası:", error);
      setMessage({ type: "error", text: `Yükleme hatası: ${error.message}` });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Tek bir dosyayı backend'e yükler
   * İki aşamalı process: 1) Dosya upload, 2) Attachment kaydı
   */
  const uploadSingleFile = async (file, index) => {
    // 1. Aşama: Dosyayı backend'e yükle
    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", selectedTask);
    formData.append("revisionNumber", revisionNumber + index);
    formData.append("uploadedBy", currentUserId);

    const uploadResponse = await fetch(
      "http://localhost:8080/api/attachments/upload",
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error(`Dosya yüklenemedi: ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();

    // 2. Aşama: Attachment kaydını veritabanına oluştur
    const attachmentData = {
      fileUrl: uploadResult.fileUrl || uploadResult.url,
      fileName: file.name,
      revisionNumber: revisionNumber + index,
      task: { id: parseInt(selectedTask) },
      uploadedBy: { id: currentUserId },
    };

    const response = await fetch("http://localhost:8080/api/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(attachmentData),
    });

    if (!response.ok) {
      throw new Error(`Kayıt oluşturulamadı: ${response.status}`);
    }

    return await response.json();
  };

  // ============================================================================
  // MESAJ YÖNETİMİ
  // ============================================================================

  /**
   * Mesajları 5 saniye sonra otomatik olarak gizler
   */
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ============================================================================
  // RENDER GUARD
  // ============================================================================

  // Kullanıcı girişi yoksa loading göster
  if (!currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg">Yönlendiriliyor...</p>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Sayfa Başlığı */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Paperclip size={32} className="text-blue-600" />
          Dosya Yönetimi
        </h1>
        <p className="text-gray-600 mt-2">
          Görev dosyalarınızı yükleyin ve yönetin
        </p>
      </div>

      {/* Sekme Navigasyonu */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "list"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <List size={18} />
              Dosya Listesi
            </div>
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Upload size={18} />
              Dosya Yükle
            </div>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Dosya Listesi Sekmesi */}
        {activeTab === "list" && (
          <div className="space-y-6">
            {/* Arama ve Filtreleme Paneli */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Arama Kutusu */}
                <div className="relative min-w-[250px]">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Dosya adında ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>

                {/* Görev Filtresi */}
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                >
                  <option value="">Tüm Görevler</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>

                {/* Dosya Türü Filtresi */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                >
                  <option value="">Tüm Türler</option>
                  <option value="image">Resimler</option>
                  <option value="document">Belgeler</option>
                  <option value="spreadsheet">Tablolar</option>
                  <option value="archive">Arşivler</option>
                </select>

                {/* Yenileme Butonu */}
                <button
                  onClick={fetchAttachments}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isLoading}
                >
                  <RefreshCw
                    size={16}
                    className={isLoading ? "animate-spin" : ""}
                  />
                  Yenile
                </button>
              </div>
            </div>

            {/* Dosya Listesi */}
            <div className="bg-white rounded-2xl shadow-sm border">
              {isLoading ? (
                // Yükleme Durumu
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Dosyalar yükleniyor...</p>
                  </div>
                </div>
              ) : filteredAttachments.length > 0 ? (
                // Dosya Listesi
                <div className="divide-y divide-gray-200">
                  {filteredAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        {/* Dosya Bilgileri */}
                        <div className="flex items-center space-x-4">
                          {getFileIcon(attachment.fileName)}
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {attachment.fileName}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center gap-1">
                                <FolderOpen size={14} />
                                {attachment.task?.title ||
                                  `Görev #${attachment.task?.id}`}
                              </div>
                              <div className="flex items-center gap-1">
                                <Hash size={14} />
                                Rev. {attachment.revisionNumber}
                              </div>
                              <div className="flex items-center gap-1">
                                <User size={14} />
                                {attachment.uploadedBy?.firstName}{" "}
                                {attachment.uploadedBy?.lastName}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(attachment.uploadedAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Aksiyon Butonları */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => downloadFile(attachment)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Dosyayı indir"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setAttachmentToDelete(attachment);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Dosyayı sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Boş Durum
                <div className="text-center py-20">
                  <File size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {searchTerm || taskFilter || typeFilter
                      ? "Eşleşen dosya bulunamadı"
                      : "Henüz dosya yok"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || taskFilter || typeFilter
                      ? "Farklı filtreler deneyebilirsiniz"
                      : 'İlk dosyanızı yüklemek için "Dosya Yükle" sekmesini kullanın'}
                  </p>
                  {!(searchTerm || taskFilter || typeFilter) && (
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Upload size={18} />
                      Dosya Yükle
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Silme Onay Modalı */}
        {isDeleteModalOpen && attachmentToDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Silme Onayı
              </h2>
              <p className="text-gray-600 mb-6">
                "{attachmentToDelete.fileName}" dosyasını silmek istediğinizden
                emin misiniz?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  İptal
                </button>
                <button
                  onClick={async () => {
                    await deleteAttachment(attachmentToDelete.id);
                    setIsDeleteModalOpen(false);
                    setAttachmentToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dosya Yükleme Sekmesi */}
        {activeTab === "upload" && (
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <div className="space-y-6">
              {/* Görev Seçimi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Görev Seçin
                </label>
                <div className="relative">
                  <FolderOpen
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                    required
                  >
                    <option value="">Lütfen bir görev seçin...</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title} - {task.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Revizyon Numarası */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Revizyon Numarası
                </label>
                <div className="relative">
                  <Hash
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    value={revisionNumber}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setRevisionNumber(isNaN(value) ? 1 : value);
                    }}
                    min={1}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl 
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                             outline-none transition-all bg-gradient-to-r from-gray-50 to-blue-50"
                    required
                  />
                </div>
              </div>

              {/* Dosya Upload Alanı */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Dosya Seçin
                </label>
                <div
                  className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                    isDragging
                      ? "border-blue-500 bg-blue-50 scale-105"
                      : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div
                    className={`transition-all ${
                      isDragging ? "scale-110" : ""
                    }`}
                  >
                    <Upload
                      size={48}
                      className={`mx-auto mb-4 transition-colors ${
                        isDragging ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    <p className="text-xl font-semibold text-gray-700 mb-2">
                      Dosyaları buraya sürükleyin
                    </p>
                    <p className="text-gray-500">veya tıklayarak dosya seçin</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Seçilen Dosyalar Listesi */}
              {selectedFiles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Seçilen Dosyalar ({selectedFiles.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.name)}
                          <div>
                            <p className="font-medium text-gray-800">
                              {file.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)} •{" "}
                              {file.type || "Bilinmeyen tür"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Dosyayı kaldır"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yükleme Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Yükleme İlerlemesi</span>
                    <span className="font-semibold">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Yükleme Butonu */}
              <button
                onClick={handleUpload}
                disabled={
                  selectedFiles.length === 0 || !selectedTask || isUploading
                }
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                  selectedFiles.length > 0 && selectedTask && !isUploading
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:-translate-y-1"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Yükleniyor...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Upload size={20} />
                    Dosyaları Yükle
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Bildirim Mesajları */}
        {message.text && (
          <div
            className={`fixed bottom-4 right-4 flex items-center gap-3 p-4 rounded-xl border shadow-lg z-50 ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <p className="font-medium">{message.text}</p>
            <button
              onClick={() => setMessage({ type: "", text: "" })}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
