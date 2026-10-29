"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Laptop,
  Bot,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  Eye,
  RefreshCw,
  X,
  Check,
  Building2,
  Package,
  Wrench,
  Boxes,
  Layers,
  ChevronRight,
  Settings2,
  Sparkles,
  Tag,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// =========================================================================
// 1. DANH BẠ 6 PHÒNG LAB SKY-LINE & QUẢN LÝ PHÒNG LAB CHÍNH THỨC
// =========================================================================
export interface LabManagerInfo {
  id: string;
  name: string;
  shortName: string;
  sheet: string;
  campus: string;
  managerName: string;
  managerEmail: string;
  managerId: string;
}

export const SIX_LAB_MANAGERS: LabManagerInfo[] = [
  {
    id: "riverside_primary",
    name: "Phòng Lab Sky-Line Riverside Tiểu Học",
    shortName: "Riverside Tiểu Học",
    sheet: "CS1-TH",
    campus: "Cơ sở Riverside",
    managerName: "Cô Đào Thị Mỹ Linh",
    managerEmail: "linhdtm@skylineschool.edu.vn",
    managerId: "a0000001-0000-0000-0000-000000000003",
  },
  {
    id: "riverside_secondary",
    name: "Phòng Lab Sky-Line Riverside Trung Học",
    shortName: "Riverside Trung Học",
    sheet: "CS1-TrH",
    campus: "Cơ sở Riverside",
    managerName: "Thầy Đồng Nguyên Tuấn",
    managerEmail: "tuandn@skylineschool.edu.vn",
    managerId: "a0000001-0000-0000-0000-000000000002",
  },
  {
    id: "central",
    name: "Phòng Lab Sky-Line Central",
    shortName: "Central",
    sheet: "CS2",
    campus: "Cơ sở Central",
    managerName: "Cô Trần Thị Phi Yến",
    managerEmail: "yenttp@skylineschool.edu.vn",
    managerId: "a0000001-0000-0000-0000-000000000008",
  },
  {
    id: "global",
    name: "Phòng Lab Sky-Line Global",
    shortName: "Global",
    sheet: "CS3",
    campus: "Cơ sở Quốc Tế",
    managerName: "Cô Nguyễn Thị Mỹ Tâm",
    managerEmail: "tamntm@skylineschool.edu.vn",
    managerId: "a0000001-0000-0000-0000-000000000005",
  },
  {
    id: "beach",
    name: "Phòng Lab Sky-Line Beach",
    shortName: "Beach",
    sheet: "CS5",
    campus: "Cơ sở Beach",
    managerName: "Cô Trịnh Thị Đăng",
    managerEmail: "dangtt@skylineschool.edu.vn",
    managerId: "a0000001-0000-0000-0000-000000000006",
  },
  {
    id: "hill",
    name: "Phòng Lab Sky-Line Hill",
    shortName: "Hill",
    sheet: "CS4",
    campus: "Cơ sở Hill",
    managerName: "Cô Phạm Thị Thanh Bình",
    managerEmail: "binhptt@skylineschool.edu.vn",
    managerId: "a0000001-0000-0000-0000-000000000007",
  },
];

// Gợi ý đơn vị tính phổ biến
const COMMON_UNITS = ["Bộ", "Cái", "Máy", "Hộp", "Chiếc", "Con"];

export interface LabDeviceItem {
  id: string;
  lab_id: string;
  lab_name: string;
  device_name: string;
  unit: string;
  quantity: number;
  status: "Bình thường" | "Hư hỏng";
  notes?: string;
  manager_name?: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

// =========================================================================
// DANH MỤC THIẾT BỊ CHUẨN DÙNG CHUNG TOÀN TRƯỜNG (DO TỔ TRƯỞNG QUẢN LÝ)
// =========================================================================
export interface DeviceCatalogItem {
  id: string;
  name: string;
  default_unit?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface LabDevicesSectionProps {
  supabase: SupabaseClient;
  showToast: (text: string, type?: "success" | "warning" | "info") => void;
  currentUserProfile?: {
    id: string;
    email: string;
    name: string;
    role: "leader" | "teacher" | "guest";
    campus?: string;
  };
  selectedSchoolYear?: string;
}

export function LabDevicesSection({
  supabase,
  showToast,
  currentUserProfile,
  selectedSchoolYear = "2026-2027",
}: LabDevicesSectionProps) {
  // Phòng Lab đang chọn (Mặc định chọn phòng Lab do tài khoản hiện tại quản lý, hoặc Riverside Tiểu Học)
  const defaultLabId = useMemo(() => {
    if (!currentUserProfile) return SIX_LAB_MANAGERS[0].id;
    // Tìm xem tài khoản này có quản lý phòng Lab nào không
    const myLab = SIX_LAB_MANAGERS.find(
      (l) =>
        l.managerId === currentUserProfile.id ||
        l.managerEmail.toLowerCase() === currentUserProfile.email?.toLowerCase() ||
        currentUserProfile.name?.toLowerCase().includes(l.managerName.toLowerCase()) ||
        l.managerName.toLowerCase().includes(currentUserProfile.name?.toLowerCase())
    );
    return myLab ? myLab.id : SIX_LAB_MANAGERS[0].id;
  }, [currentUserProfile]);

  const [selectedLabId, setSelectedLabId] = useState<string>(defaultLabId);
  const [devicesList, setDevicesList] = useState<LabDeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Bình thường" | "Hư hỏng">("all");

  // Modal Thêm / Sửa Thiết Bị
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    device_name: "",
    unit: "Bộ",
    quantity: 1,
    status: "Bình thường" as "Bình thường" | "Hư hỏng",
    notes: "",
  });

  // Modal Xác nhận Xóa
  const [deleteConfirmDevice, setDeleteConfirmDevice] = useState<LabDeviceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // =========================================================================
  // STATE DANH MỤC THIẾT BỊ CHUẨN (DO TỔ TRƯỞNG QUẢN LÝ THÊM/SỬA/XÓA)
  // =========================================================================
  const [catalogList, setCatalogList] = useState<DeviceCatalogItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);

  // Modal Quản Lý Danh Mục Thiết Bị Chuẩn (Chỉ dành riêng cho Tổ trưởng)
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [newCatalogName, setNewCatalogName] = useState<string>("");
  const [newCatalogUnit, setNewCatalogUnit] = useState<string>("Bộ");
  const [isSubmittingNewCatalog, setIsSubmittingNewCatalog] = useState<boolean>(false);

  // Modal Sửa Tên Thiết Bị trong Catalog
  const [editingCatalogItem, setEditingCatalogItem] = useState<DeviceCatalogItem | null>(null);
  const [editCatalogName, setEditCatalogName] = useState<string>("");
  const [editCatalogUnit, setEditCatalogUnit] = useState<string>("Bộ");
  const [isSubmittingEditCatalog, setIsSubmittingEditCatalog] = useState<boolean>(false);

  // Modal Xác Nhận Xóa Tên Thiết Bị khỏi Catalog
  const [deleteConfirmCatalogItem, setDeleteConfirmCatalogItem] = useState<DeviceCatalogItem | null>(null);
  const [isDeletingCatalog, setIsDeletingCatalog] = useState<boolean>(false);

  // Thiết bị được chọn nhanh trong Modal Thêm Thiết Bị của Giáo viên
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");

  // Thông tin phòng Lab hiện tại
  const currentLab = useMemo(
    () => SIX_LAB_MANAGERS.find((l) => l.id === selectedLabId) || SIX_LAB_MANAGERS[0],
    [selectedLabId]
  );

  // =========================================================================
  // KIỂM TRA PHÂN QUYỀN (Tổ trưởng có toàn quyền; Quản lý có quyền phòng mình)
  // =========================================================================
  const isLeader = currentUserProfile?.role === "leader";
  const isCurrentLabManager = useMemo(() => {
    if (!currentUserProfile) return false;
    if (isLeader) return true; // Tổ trưởng có quyền bao quát tất cả phòng Lab
    return (
      currentUserProfile.id === currentLab.managerId ||
      currentUserProfile.email?.toLowerCase() === currentLab.managerEmail.toLowerCase() ||
      currentUserProfile.name?.toLowerCase().includes(currentLab.managerName.toLowerCase()) ||
      currentLab.managerName.toLowerCase().includes(currentUserProfile.name?.toLowerCase())
    );
  }, [currentUserProfile, isLeader, currentLab]);

  // =========================================================================
  // TẢI DỮ LIỆU TỪ CƠ SỞ DỮ LIỆU SUPABASE (LỌC THEO NĂM HỌC ĐANG CHỌN)
  // =========================================================================
  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("lab_devices")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDevicesList(data || []);
    } catch (err: any) {
      console.error("Lỗi tải danh mục thiết bị:", err);
      showToast(err.message || "Không thể tải danh sách thiết bị!", "warning");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, showToast, selectedSchoolYear]);

  // Tải danh mục thiết bị chuẩn (device_catalog) theo năm học
  const loadCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const { data, error } = await supabase
        .from("device_catalog")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCatalogList(data || []);
    } catch (err: any) {
      console.error("Lỗi tải danh mục thiết bị chuẩn:", err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [supabase, selectedSchoolYear]);

  useEffect(() => {
    loadDevices();
    loadCatalog();

    // Lắng nghe Realtime trên bảng lab_devices
    const deviceChannel = supabase
      .channel("realtime_lab_devices")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lab_devices" },
        () => {
          loadDevices();
        }
      )
      .subscribe();

    // Lắng nghe Realtime trên bảng device_catalog
    const catalogChannel = supabase
      .channel("realtime_device_catalog")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "device_catalog" },
        () => {
          loadCatalog();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deviceChannel);
      supabase.removeChannel(catalogChannel);
    };
  }, [loadDevices, loadCatalog, supabase]);

  // Lọc thiết bị theo phòng Lab đang chọn, từ khóa tìm kiếm và tình trạng
  const currentLabAllDevices = useMemo(() => {
    return devicesList.filter((d) => d.lab_id === selectedLabId);
  }, [devicesList, selectedLabId]);

  const filteredDevices = useMemo(() => {
    return currentLabAllDevices.filter((d) => {
      const matchSearch =
        d.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.notes && d.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        d.unit.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [currentLabAllDevices, searchTerm, statusFilter]);

  // Thống kê nhanh của phòng Lab đang chọn
  const stats = useMemo(() => {
    const total = currentLabAllDevices.length;
    const normalCount = currentLabAllDevices.filter((d) => d.status === "Bình thường").length;
    const brokenCount = currentLabAllDevices.filter((d) => d.status === "Hư hỏng").length;
    const totalQuantity = currentLabAllDevices.reduce((sum, d) => sum + (d.quantity || 0), 0);
    return { total, normalCount, brokenCount, totalQuantity };
  }, [currentLabAllDevices]);

  // =========================================================================
  // XỬ LÝ MỞ MODAL THÊM / SỬA THIẾT BỊ
  // =========================================================================
  const handleOpenAddModal = () => {
    if (!isCurrentLabManager) {
      showToast(
        `Thầy/Cô không phải là Quản lý của ${currentLab.shortName}. Chỉ ${currentLab.managerName} và Tổ trưởng mới được thêm thiết bị!`,
        "warning"
      );
      return;
    }
    setModalMode("add");
    setEditingDeviceId(null);
    setSelectedCatalogId("");
    setFormData({
      device_name: "",
      unit: "Bộ",
      quantity: 1,
      status: "Bình thường",
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Chọn nhanh thiết bị từ danh mục có sẵn của Tổ trưởng
  const handleSelectCatalogItem = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    const matched = catalogList.find((c) => c.id === catalogId);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        device_name: matched.name,
        unit: matched.default_unit || "Bộ",
      }));
    }
  };

  // Tự động đồng bộ Đơn Vị Tính theo chuẩn của Tổ trưởng khi nhập tên thiết bị
  const handleDeviceNameChange = (name: string) => {
    const matched = catalogList.find(
      (c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (matched) {
      setSelectedCatalogId(matched.id);
    }
    setFormData((prev) => ({
      ...prev,
      device_name: name,
      unit: matched ? (matched.default_unit || "Bộ") : prev.unit || "Bộ",
    }));
  };

  // =========================================================================
  // CÁC HÀM QUẢN TRỊ DANH MỤC THIẾT BỊ CHUẨN (DÀNH RIÊNG CHO TỔ TRƯỞNG)
  // =========================================================================
  // 1. Thêm tên thiết bị mới vào danh mục toàn trường
  const handleCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) {
      showToast("Chức năng chỉ dành riêng cho Tổ trưởng chuyên môn!", "warning");
      return;
    }
    const trimmed = newCatalogName.trim();
    if (!trimmed) {
      showToast("Vui lòng nhập tên thiết bị mới!", "warning");
      return;
    }

    setIsSubmittingNewCatalog(true);
    try {
      const { error } = await supabase.from("device_catalog").insert({
        name: trimmed,
        default_unit: newCatalogUnit.trim() || "Bộ",
        school_year: selectedSchoolYear,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error(`Thiết bị "${trimmed}" đã có sẵn trong danh mục năm học ${selectedSchoolYear}!`);
        }
        throw error;
      }

      showToast(`Đã thêm thiết bị "${trimmed}" vào danh mục chuẩn toàn trường!`, "success");
      setNewCatalogName("");
      setNewCatalogUnit("Bộ");
      await loadCatalog();
    } catch (err: any) {
      console.error("Lỗi thêm thiết bị mới vào danh mục:", err);
      showToast(err.message || "Lỗi khi thêm thiết bị mới!", "warning");
    } finally {
      setIsSubmittingNewCatalog(false);
    }
  };

  // 2. Mở dialog sửa tên thiết bị trong danh mục
  const handleOpenEditCatalogItem = (item: DeviceCatalogItem) => {
    if (!isLeader) return;
    setEditingCatalogItem(item);
    setEditCatalogName(item.name);
    setEditCatalogUnit(item.default_unit || "Bộ");
  };

  // 3. Lưu chỉnh sửa tên thiết bị và đồng bộ tới tất cả phòng Lab
  const handleSaveEditCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader || !editingCatalogItem) return;
    const oldName = editingCatalogItem.name.trim();
    const trimmed = editCatalogName.trim();
    const trimmedUnit = editCatalogUnit.trim() || "Bộ";
    if (!trimmed) {
      showToast("Vui lòng nhập tên thiết bị!", "warning");
      return;
    }

    setIsSubmittingEditCatalog(true);
    try {
      const { error } = await supabase
        .from("device_catalog")
        .update({
          name: trimmed,
          default_unit: trimmedUnit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingCatalogItem.id);

      if (error) {
        if (error.code === "23505") {
          throw new Error(`Tên thiết bị "${trimmed}" bị trùng với thiết bị khác!`);
        }
        throw error;
      }

      // Đồng bộ cập nhật tên và đơn vị tính cho tất cả phòng Lab đang lưu thiết bị này trong năm học đang chọn
      await supabase
        .from("lab_devices")
        .update({
          device_name: trimmed,
          unit: trimmedUnit,
          updated_at: new Date().toISOString(),
        })
        .eq("school_year", selectedSchoolYear)
        .ilike("device_name", oldName);

      showToast(`Đã cập nhật thiết bị thành "${trimmed}" và đồng bộ tới các phòng Lab!`, "success");
      setEditingCatalogItem(null);
      await Promise.all([loadCatalog(), loadDevices()]);
    } catch (err: any) {
      console.error("Lỗi cập nhật thiết bị trong danh mục:", err);
      showToast(err.message || "Lỗi cập nhật danh mục!", "warning");
    } finally {
      setIsSubmittingEditCatalog(false);
    }
  };

  // 4. Xóa tên thiết bị khỏi danh mục chuẩn và ĐỒNG BỘ XÓA TẤT CẢ THIẾT BỊ NÀY Ở CÁC PHÒNG LAB
  const handleDeleteCatalogItem = async () => {
    if (!isLeader || !deleteConfirmCatalogItem) return;
    const targetDeviceName = deleteConfirmCatalogItem.name.trim();
    setIsDeletingCatalog(true);
    try {
      // BƯỚC 1: Xóa toàn bộ dữ liệu thiết bị này đang lưu ở các phòng Lab trong năm học hiện tại
      const { error: labError } = await supabase
        .from("lab_devices")
        .delete()
        .eq("school_year", selectedSchoolYear)
        .ilike("device_name", targetDeviceName);

      if (labError) {
        console.warn("Cảnh báo khi xóa ở bảng lab_devices:", labError);
      }

      // BƯỚC 2: Xóa tên thiết bị khỏi danh mục chuẩn (device_catalog)
      const { error: catalogError } = await supabase
        .from("device_catalog")
        .delete()
        .eq("id", deleteConfirmCatalogItem.id);

      if (catalogError) throw catalogError;

      showToast(
        `Đã xóa thiết bị "${targetDeviceName}" khỏi danh mục chuẩn và tự động xóa dữ liệu tại tất cả các phòng Lab!`,
        "success"
      );
      setDeleteConfirmCatalogItem(null);
      await Promise.all([loadCatalog(), loadDevices()]);
    } catch (err: any) {
      console.error("Lỗi xóa thiết bị khỏi danh mục:", err);
      showToast(err.message || "Lỗi xóa thiết bị!", "warning");
    } finally {
      setIsDeletingCatalog(false);
    }
  };

  const handleOpenEditModal = (device: LabDeviceItem) => {
    if (!isCurrentLabManager) {
      showToast(
        `Thầy/Cô không có quyền chỉnh sửa thiết bị của ${currentLab.shortName}!`,
        "warning"
      );
      return;
    }
    const matchedCatalog = catalogList.find(
      (c) => c.name.trim().toLowerCase() === device.device_name.trim().toLowerCase()
    );
    setModalMode("edit");
    setEditingDeviceId(device.id);
    setSelectedCatalogId(matchedCatalog ? matchedCatalog.id : "");
    setFormData({
      device_name: device.device_name,
      unit: matchedCatalog?.default_unit || device.unit || "Bộ",
      quantity: device.quantity,
      status: device.status,
      notes: device.notes || "",
    });
    setIsModalOpen(true);
  };

  // =========================================================================
  // XỬ LÝ LƯU (THÊM HOẶC SỬA) VÀO SUPABASE
  // =========================================================================
  const handleSubmitDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentLabManager) {
      showToast("Thao tác bị từ chối: Thầy/Cô không có quyền quản lý phòng Lab này!", "warning");
      return;
    }

    if (!formData.device_name.trim()) {
      showToast("Vui lòng nhập tên thiết bị!", "warning");
      return;
    }

    if (formData.quantity < 0) {
      showToast("Số lượng thiết bị không được là số âm!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        const newRecord = {
          lab_id: currentLab.id,
          lab_name: currentLab.name,
          device_name: formData.device_name.trim(),
          unit: formData.unit.trim() || "Bộ",
          quantity: Number(formData.quantity) || 1,
          status: formData.status,
          notes: formData.notes.trim(),
          manager_name: currentLab.managerName,
          manager_id: currentLab.managerId,
          school_year: selectedSchoolYear,
        };

        const { error } = await supabase.from("lab_devices").insert(newRecord);
        if (error) throw error;

        showToast(`Đã thêm thiết bị "${formData.device_name.trim()}" vào ${currentLab.shortName}!`, "success");
      } else {
        if (!editingDeviceId) return;
        const updateData = {
          device_name: formData.device_name.trim(),
          unit: formData.unit.trim() || "Bộ",
          quantity: Number(formData.quantity) || 1,
          status: formData.status,
          notes: formData.notes.trim(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("lab_devices")
          .update(updateData)
          .eq("id", editingDeviceId);
        if (error) throw error;

        showToast(`Đã cập nhật thông tin thiết bị "${formData.device_name.trim()}"!`, "success");
      }

      setIsModalOpen(false);
      await loadDevices();
    } catch (err: any) {
      console.error("Lỗi lưu thiết bị:", err);
      showToast(err.message || "Lỗi khi lưu dữ liệu thiết bị!", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // XỬ LÝ XÓA THIẾT BỊ
  // =========================================================================
  const handleDeleteDevice = async () => {
    if (!deleteConfirmDevice) return;
    if (!isCurrentLabManager) {
      showToast("Thầy/Cô không có quyền xóa thiết bị của phòng Lab này!", "warning");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("lab_devices")
        .delete()
        .eq("id", deleteConfirmDevice.id);

      if (error) throw error;

      showToast(`Đã xóa thiết bị "${deleteConfirmDevice.device_name}" khỏi danh mục!`, "success");
      setDeleteConfirmDevice(null);
      await loadDevices();
    } catch (err: any) {
      console.error("Lỗi xóa thiết bị:", err);
      showToast(err.message || "Lỗi khi xóa thiết bị!", "warning");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KHUNG TIÊU ĐỀ & THANH CHỌN 6 PHÒNG LAB */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Bot className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  Quản Trị Trang Thiết Bị & Robot 6 Phòng Lab
                  <Badge variant="outline" className="text-[11px] font-bold border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60">
                    Phân Quyền Theo Quản Lý Lab
                  </Badge>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mỗi tài khoản Quản lý phụ trách khai báo, cập nhật số lượng, tình trạng (Bình thường / Hư hỏng) của phòng Lab mình.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* NÚT QUẢN LÝ DANH MỤC DÀNH RIÊNG CHO TỔ TRƯỞNG CHUYÊN MÔN */}
            {isLeader && (
              <Button
                size="sm"
                onClick={() => setIsCatalogModalOpen(true)}
                className="font-bold text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                title="Dành riêng cho Tổ trưởng: Thêm, sửa, xóa danh mục tên thiết bị chuẩn"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Quản Lý Danh Mục Thiết Bị ({catalogList.length})</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                loadDevices();
                loadCatalog();
                showToast("Đã đồng bộ lại danh mục thiết bị từ cơ sở dữ liệu!", "success");
              }}
              className="font-bold text-xs h-8"
              title="Làm mới dữ liệu từ cơ sở dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading || isLoadingCatalog ? "animate-spin" : ""}`} />
              Đồng bộ
            </Button>
          </div>
        </div>

        {/* 6 THẺ NÚT CHỌN 6 PHÒNG LAB SKY-LINE */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Chọn phòng Lab để theo dõi và quản lý thiết bị:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {SIX_LAB_MANAGERS.map((lab) => {
              const isSelected = selectedLabId === lab.id;
              const labDevs = devicesList.filter((d) => d.lab_id === lab.id);
              const brokenDevs = labDevs.filter((d) => d.status === "Hư hỏng").length;
              const isUserManagedThis =
                currentUserProfile &&
                (currentUserProfile.id === lab.managerId ||
                  currentUserProfile.email?.toLowerCase() === lab.managerEmail.toLowerCase() ||
                  currentUserProfile.name?.toLowerCase().includes(lab.managerName.toLowerCase()));

              return (
                <button
                  key={lab.id}
                  onClick={() => {
                    setSelectedLabId(lab.id);
                    showToast(`Đang xem thiết bị: ${lab.shortName} (Quản lý: ${lab.managerName})`, "info");
                  }}
                  className={`p-3 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400 shadow-md shadow-amber-500/25 scale-[1.02]"
                      : "bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {lab.sheet}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        isSelected ? "text-white" : brokenDevs > 0 ? "text-rose-600 dark:text-rose-400 font-extrabold" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {labDevs.length} món {brokenDevs > 0 ? `(${brokenDevs} hỏng)` : ""}
                    </span>
                  </div>

                  <div className="font-extrabold text-xs line-clamp-1 leading-snug">
                    {lab.shortName}
                  </div>
                  <div className={`text-[10px] mt-0.5 truncate flex items-center gap-1 ${isSelected ? "text-amber-100" : "text-slate-500 dark:text-slate-400"}`}>
                    <span>QL:</span>
                    <span className="font-semibold truncate">{lab.managerName}</span>
                  </div>

                  {isUserManagedThis && (
                    <div className="mt-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white text-amber-700" : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"}`}>
                        ★ Phòng của Thầy/Cô
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* THẺ TÓM TẮT THÔNG TIN PHÒNG LAB HIỆN TẠI VÀ NÚT THAO TÁC */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 to-sky-50/80 dark:from-amber-950/20 dark:to-sky-950/20 border border-amber-200/80 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <span>{currentLab.name}</span>
                <Badge variant="outline" className="text-[10px] font-bold bg-white dark:bg-slate-900">
                  {currentLab.campus}
                </Badge>
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 flex items-center gap-2 flex-wrap">
                <span>
                  Quản lý phụ trách chính: <strong>{currentLab.managerName}</strong> ({currentLab.managerEmail})
                </span>
                <span>•</span>
                {isCurrentLabManager ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5" /> Có toàn quyền Quản trị (Thêm, Sửa, Xóa)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    <Eye className="w-3.5 h-3.5" /> Chế độ chỉ xem
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCurrentLabManager ? (
              <Button
                onClick={handleOpenAddModal}
                size="sm"
                className="font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 rounded-xl"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" /> + Thêm Thiết Bị Mới
              </Button>
            ) : (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                🔒 Thầy/Cô đang xem danh mục của {currentLab.managerName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* THẺ THỐNG KÊ NHANH VỀ SỐ LƯỢNG & TÌNH TRẠNG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Danh Mục Thiết Bị</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {stats.total} <span className="text-xs font-medium text-slate-400">món</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng Số Lượng Cá Thể</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {stats.totalQuantity} <span className="text-xs font-medium text-slate-400">cái/bộ</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-2xs cursor-pointer hover:border-emerald-400 transition-all" onClick={() => setStatusFilter("Bình thường")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Tình Trạng: Bình Thường</p>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                {stats.normalCount} <span className="text-xs font-medium text-emerald-500">món tốt</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-2xs cursor-pointer hover:border-rose-400 transition-all" onClick={() => setStatusFilter("Hư hỏng")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Tình Trạng: Hư Hỏng</p>
              <h3 className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
                {stats.brokenCount} <span className="text-xs font-medium text-rose-500">món cần sửa</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* THANH TÌM KIẾM VÀ BỘ LỌC TÌNH TRẠNG */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên thiết bị, ghi chú hoặc đơn vị tính..."
            className="pl-9 h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc trạng thái:
          </span>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Tất cả ({currentLabAllDevices.length})
            </button>
            <button
              onClick={() => setStatusFilter("Bình thường")}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                statusFilter === "Bình thường"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600"
              }`}
            >
              Bình thường ({stats.normalCount})
            </button>
            <button
              onClick={() => setStatusFilter("Hư hỏng")}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                statusFilter === "Hư hỏng"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
              }`}
            >
              Hư hỏng ({stats.brokenCount})
            </button>
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH TRANG THIẾT BỊ THEO PHÒNG LAB */}
      <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <th className="p-3.5 font-bold w-12 text-center">STT</th>
              <th className="p-3.5 font-bold">Tên Thiết Bị / Bộ Dụng Cụ</th>
              <th className="p-3.5 font-bold w-28 text-center">Đơn Vị Tính</th>
              <th className="p-3.5 font-bold w-24 text-center">Số Lượng</th>
              <th className="p-3.5 font-bold w-36 text-center">Tình Trạng</th>
              <th className="p-3.5 font-bold">Ghi Chú</th>
              <th className="p-3.5 font-bold w-28 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDevices.length > 0 ? (
              filteredDevices.map((device, index) => {
                const isNormal = device.status === "Bình thường";

                return (
                  <tr
                    key={device.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 text-center font-bold text-slate-400 dark:text-slate-500">
                      {index + 1}
                    </td>

                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                          <Package className="w-4 h-4" />
                        </span>
                        <span>{device.device_name}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
                        {device.unit}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {device.quantity}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      {isNormal ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bình thường
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Hư hỏng
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {device.notes ? (
                        <div className="text-slate-700 dark:text-slate-300 font-medium text-xs max-w-md line-clamp-2">
                          {device.notes}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 italic">-</span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      {isCurrentLabManager ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(device)}
                            className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 hover:text-sky-700 transition-all"
                            title="Sửa thông tin thiết bị"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmDevice(device)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 hover:text-rose-700 transition-all"
                            title="Xóa thiết bị"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-[11px] italic" title="Chỉ Quản lý mới được chỉnh sửa">
                          Chỉ xem
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                        {searchTerm || statusFilter !== "all"
                          ? "Không tìm thấy thiết bị phù hợp"
                          : `Chưa có thiết bị nào trong ${currentLab.shortName}`}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {searchTerm || statusFilter !== "all"
                          ? "Thầy/Cô hãy thử tìm từ khóa khác hoặc bỏ lọc trạng thái."
                          : isCurrentLabManager
                          ? "Hãy bấm nút dưới đây để khai báo thiết bị đầu tiên cho phòng Lab của Thầy/Cô."
                          : `Quản lý ${currentLab.managerName} chưa cập nhật thiết bị cho phòng Lab này.`}
                      </p>
                    </div>
                    {isCurrentLabManager && !searchTerm && statusFilter === "all" && (
                      <Button
                        size="sm"
                        onClick={handleOpenAddModal}
                        className="font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                      >
                        <PlusCircle className="w-4 h-4 mr-1.5" /> + Thêm Thiết Bị Đầu Tiên
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL THÊM / CHỈNH SỬA THIẾT BỊ PHÒNG LAB                                 */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Tiêu đề Modal (Cố định ở trên) */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 px-5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Package className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {modalMode === "add" ? "Thêm Thiết Bị Mới" : "Chỉnh Sửa Thông Tin Thiết Bị"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Phòng Lab: <strong>{currentLab.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Biểu mẫu nhập liệu (Có thanh cuộn nội dung, nút xác nhận cố định bên dưới) */}
            <form onSubmit={handleSubmitDevice} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
                {/* DANH SÁCH THIẾT BỊ CÓ SẴN ĐỂ GIÁO VIÊN LỰA CHỌN (GỌN GÀNG, BỎ CHIP GỢI Ý) */}
                {modalMode === "add" && (
                  <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-amber-950 dark:text-amber-200 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Chọn Thiết Bị Từ Danh Mục Chuẩn:</span>
                      </label>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Tự động điền tên & ĐVT</span>
                    </div>

                    {/* Dropdown danh sách thiết bị chuẩn */}
                    <select
                      aria-label="Chọn thiết bị từ danh mục chuẩn"
                      value={selectedCatalogId}
                      onChange={(e) => handleSelectCatalogItem(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Bấm để chọn từ danh mục ({catalogList.length} thiết bị) --</option>
                      {catalogList.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.default_unit || "Bộ"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* TÊN THIẾT BỊ */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tên Thiết Bị / Bộ Dụng Cụ: <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.device_name}
                    onChange={(e) => handleDeviceNameChange(e.target.value)}
                    placeholder="Chọn từ danh sách trên hoặc tự nhập tên thiết bị..."
                    className="rounded-xl border-slate-200 dark:border-slate-800 font-semibold text-xs h-9"
                  />
                </div>

                {/* ĐƠN VỊ TÍNH VÀ SỐ LƯỢNG */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Ô ĐƠN VỊ TÍNH: CHỈ HIỂN THỊ, KHÔNG CHO CHỈNH SỬA */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Đơn Vị Tính: <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        readOnly
                        tabIndex={-1}
                        value={formData.unit || "Bộ"}
                        className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs h-9 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 cursor-not-allowed select-none pl-8 shadow-xs"
                        placeholder="Theo danh mục..."
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Tự động theo danh mục thiết bị</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Số Lượng: <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      type="number"
                      min={0}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="rounded-xl border-slate-200 dark:border-slate-800 font-black text-xs h-9"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Số nguyên dương (≥ 0)</span>
                  </div>
                </div>

                {/* TÌNH TRẠNG SỬ DỤNG (BÌNH THƯỜNG / HƯ HỎNG) */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tình Trạng Sử Dụng: <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border cursor-pointer transition-all ${
                        formData.status === "Bình thường"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="Bình thường"
                        checked={formData.status === "Bình thường"}
                        onChange={() => setFormData({ ...formData, status: "Bình thường" })}
                        className="accent-emerald-600"
                      />
                      <div>
                        <div className="font-extrabold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bình thường
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Sẵn sàng dạy học
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border cursor-pointer transition-all ${
                        formData.status === "Hư hỏng"
                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="Hư hỏng"
                        checked={formData.status === "Hư hỏng"}
                        onChange={() => setFormData({ ...formData, status: "Hư hỏng" })}
                        className="accent-rose-600"
                      />
                      <div>
                        <div className="font-extrabold text-xs flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Hư hỏng
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Cần sửa chữa / bảo trì
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* GHI CHÚ */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Ghi Chú Chi Tiết:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ghi chú thêm về linh kiện, vị trí ngăn tủ, hoặc tình trạng lỗi nếu có..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* NÚT THAO TÁC (LUÔN CỐ ĐỊNH Ở ĐÁY MODAL, ĐẢM BẢO 100% HIỂN THỊ RÕ RÀNG) */}
              <div className="p-3.5 px-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/90 dark:bg-slate-900/90 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmitting}
                  className="rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {modalMode === "add" ? "Lưu Thiết Bị" : "Cập Nhật Thay Đổi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XÁC NHẬN XÓA THIẾT BỊ                                               */}
      {/* ========================================================================= */}
      {deleteConfirmDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Xác Nhận Xóa Thiết Bị?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Thầy/Cô có chắc chắn muốn gỡ bỏ thiết bị{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  "{deleteConfirmDevice.device_name}"
                </strong>{" "}
                khỏi danh mục phòng Lab <strong>{currentLab.shortName}</strong>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmDevice(null)}
                className="rounded-xl font-bold"
              >
                Hủy Bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteDevice}
                className="rounded-xl font-bold"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Xác Nhận Xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL QUẢN LÝ DANH MỤC THIẾT BỊ CHUẨN (DÀNH RIÊNG CHO TỔ TRƯỞNG CHUYÊN MÔN) */}
      {/* ========================================================================= */}
      {isLeader && isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <Settings2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Quản Lý Danh Mục Thiết Bị Dùng Chung
                    <Badge variant="default" className="text-[10px] font-bold bg-sky-600">
                      Tổ Trưởng
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Thêm, sửa, xóa các tên thiết bị chuẩn để toàn bộ giáo viên quản lý 6 phòng Lab lựa chọn khi khai báo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KHỐI 1: FORM THÊM TÊN THIẾT BỊ MỚI */}
            <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h4 className="font-extrabold text-xs text-sky-900 dark:text-sky-200 uppercase tracking-wider">
                  + Thêm Tên Thiết Bị Mới Vào Danh Mục
                </h4>
              </div>

              <form onSubmit={handleCreateCatalogItem} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                      Tên Thiết Bị Mới: <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      value={newCatalogName}
                      onChange={(e) => setNewCatalogName(e.target.value)}
                      placeholder="Ví dụ: Kính VR Meta Quest, Cánh tay Robot DoBot..."
                      className="rounded-xl border-slate-200 dark:border-slate-800 font-semibold text-xs h-9 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                      Đơn Vị Tính:
                    </label>
                    <Input
                      required
                      value={newCatalogUnit}
                      onChange={(e) => setNewCatalogUnit(e.target.value)}
                      placeholder="Bộ, Cái, Máy..."
                      className="rounded-xl border-slate-200 dark:border-slate-800 font-semibold text-xs h-9 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                    <span className="font-medium">Gợi ý ĐVT:</span>
                    {COMMON_UNITS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setNewCatalogUnit(u)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          newCatalogUnit === u
                            ? "bg-sky-600 text-white border-sky-600 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isSubmittingNewCatalog}
                    className="font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs"
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Xác Nhận Thêm Thiết Bị
                  </Button>
                </div>
              </form>
            </div>

            {/* KHỐI 2: DANH SÁCH CÁC THIẾT BỊ HIỆN CÓ TRONG HỆ THỐNG */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-slate-500" />
                  Danh Sách Thiết Bị Chuẩn Hiện Có ({catalogList.length} thiết bị):
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hiển thị trong hộp chọn của giáo viên quản lý
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold">
                      <th className="p-2.5 text-center w-12">STT</th>
                      <th className="p-2.5">Tên Thiết Bị / Bộ Dụng Cụ</th>
                      <th className="p-2.5 text-center w-24">Đơn Vị Tính</th>
                      <th className="p-2.5 text-right w-24">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {catalogList.length > 0 ? (
                      catalogList.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="p-2.5 text-center text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="p-2.5">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {item.name}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                              {item.default_unit || "Bộ"}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditCatalogItem(item)}
                                className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/60 text-sky-600 dark:text-sky-400 transition-all cursor-pointer"
                                title="Chỉnh sửa tên thiết bị"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmCatalogItem(item)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                                title="Xóa tên thiết bị này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                          Chưa có thiết bị nào trong danh mục.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCatalogModalOpen(false)}
                className="font-bold text-xs rounded-xl"
              >
                Đóng Lại
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CON: CHỈNH SỬA TÊN THIẾT BỊ TRONG DANH MỤC (TỔ TRƯỞNG)              */}
      {/* ========================================================================= */}
      {editingCatalogItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-600" /> Chỉnh Sửa Tên Thiết Bị Chuẩn
              </h3>
              <button
                onClick={() => setEditingCatalogItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCatalogItem} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tên Thiết Bị: <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={editCatalogName}
                  onChange={(e) => setEditCatalogName(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 font-semibold text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Đơn Vị Tính Mặc Định: <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={editCatalogUnit}
                  onChange={(e) => setEditCatalogUnit(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 font-semibold text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCatalogItem(null)}
                  className="rounded-xl font-bold"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingEditCatalog}
                  className="rounded-xl font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
                >
                  <Check className="w-4 h-4 mr-1.5" /> Lưu Thay Đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CON: XÁC NHẬN XÓA TÊN THIẾT BỊ KHỎI DANH MỤC (TỔ TRƯỞNG)             */}
      {/* ========================================================================= */}
      {deleteConfirmCatalogItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Xác Nhận Xóa Thiết Bị Khỏi Toàn Trường?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Thầy có chắc chắn muốn xóa tên thiết bị{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  "{deleteConfirmCatalogItem.name}"
                </strong>{" "}
                khỏi danh mục chuẩn?
              </p>
              <div className="mt-3 p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-300 font-semibold text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>
                  Lưu ý: Toàn bộ thiết bị "{deleteConfirmCatalogItem.name}" đang lưu trữ ở 6 phòng Lab cũng sẽ được tự động xóa sạch khỏi cơ sở dữ liệu.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmCatalogItem(null)}
                className="rounded-xl font-bold"
              >
                Hủy Bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isDeletingCatalog}
                onClick={handleDeleteCatalogItem}
                className="rounded-xl font-bold"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Xác Nhận Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
