'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Crown,
  UserPlus,
  Search,
  Filter,
  Lock,
  Unlock,
  Trash2,
  Shield,
  Activity,
  Bookmark,
  MessageSquare,
  Plus,
  X,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useUsers } from '@/lib/users/useUsers';
import { useToast } from '@/components/admin/AdminToast';
import type { UserRole, UserAccountStatus } from '@/types/user-admin';

export default function AdminUsersPage() {
  const { users, stats, updateUserStatus, updateUserRole, deleteUser } = useUsers();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserAccountStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleToggleStatus = async (id: string, currentStatus: UserAccountStatus, name: string) => {
    const nextStatus: UserAccountStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const target = users.find((user) => user.id === id);
    if (!target) return;
    const ok = await updateUserStatus(target, nextStatus);
    if (ok) {
      showToast(
        nextStatus === 'suspended'
          ? `Đã khóa tài khoản "${name}"`
          : `Đã mở khóa tài khoản "${name}" thành công!`,
        nextStatus === 'suspended' ? 'warning' : 'success'
      );
    }
  };

  const handleRoleChange = async (id: string, newRole: UserRole, name: string) => {
    const target = users.find((user) => user.id === id);
    if (!target) return;
    const ok = await updateUserRole(target, newRole);
    if (ok) {
      showToast(`Đã nâng cấp quyền cho "${name}" thành ${newRole.toUpperCase()}`, 'success');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}" khỏi hệ thống?`)) {
      const ok = await deleteUser(id);
      if (ok) {
        showToast(`Đã xóa tài khoản "${name}"`, 'info');
      }
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Vui lòng nhập đầy đủ tên và email', 'warning');
      return;
    }
    showToast('Người dùng cần đăng ký qua trang đăng ký để Supabase tạo tài khoản an toàn.', 'warning');
  };

  return (
    <>
      <AdminHeader
        onToggleSidebar={() => {
          const sidebar = document.querySelector('.admin-sidebar');
          if (sidebar) sidebar.classList.toggle('open');
        }}
        title="Quản lý Người Dùng & Thành Viên"
        subtitle={`Theo dõi ${stats.totalUsers} tài khoản người dùng và trạng thái hoạt động`}
      />

      <div style={{ padding: '28px', maxWidth: '1400px', width: '100%' }}>
        {/* Metric Cards Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          {/* Total Users */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                TỔNG NGƯỜI DÙNG
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(130, 120, 255, 0.12)',
                  color: 'var(--accent-violet, #8278ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800 }}>
                {stats.totalUsers}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>tài khoản</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Bao gồm Admin, VIP và Thành viên
            </p>
          </div>

          {/* Active Users */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                ĐANG HOẠT ĐỘNG
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(46, 213, 115, 0.12)',
                  color: '#2ed573',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserCheck size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800, color: '#2ed573' }}>
                {stats.activeUsers}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                ({Math.round((stats.activeUsers / (stats.totalUsers || 1)) * 100)}%)
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#2ed573', marginTop: '8px' }}>
              🟢 Tài khoản hợp lệ, không bị chặn
            </p>
          </div>

          {/* VIP Users */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                THÀNH VIÊN VIP
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Crown size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800, color: '#F59E0B' }}>
                {stats.vipUsers}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>VIP members</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Khách hàng quyền lợi cao cấp & xem 4K
            </p>
          </div>

          {/* New This Month */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                MỚI TRONG THÁNG
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(117, 221, 243, 0.12)',
                  color: 'var(--accent-cyan, #75ddf3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserPlus size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                +{stats.newThisMonth}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>đăng ký mới</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Tăng trưởng người dùng ổn định
            </p>
          </div>
        </div>

        {/* Toolbar: Search, Filters, and Add User Button */}
        <div
          style={{
            background: '#101116',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '380px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Filters & Add Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <Filter size={14} /> Lọc:
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="vip">Thành viên VIP</option>
              <option value="user">Người dùng thông thường</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | UserAccountStatus)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">🟢 Đang hoạt động</option>
              <option value="suspended">🔴 Đã khóa</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--accent-crimson, #E50914)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Thêm thành viên
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div
          style={{
            background: '#101116',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg, 12px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '16px 20px' }}>Thành viên</th>
                  <th style={{ padding: '16px 20px' }}>Vai trò</th>
                  <th style={{ padding: '16px 20px' }}>Trạng thái</th>
                  <th style={{ padding: '16px 20px' }}>Đóng góp</th>
                  <th style={{ padding: '16px 20px' }}>Hoạt động gần nhất</th>
                  <th style={{ padding: '16px 20px' }}>Ngày đăng ký</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Users size={32} style={{ margin: '0 auto 10px auto', opacity: 0.3 }} />
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        Không tìm thấy người dùng nào
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSuspended = u.status === 'suspended';

                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background 0.15s ease',
                          opacity: isSuspended ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Member Info */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {u.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, var(--accent-crimson), var(--accent-violet))',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '14px',
                                }}
                              >
                                {u.name[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {u.name}
                                {u.role === 'admin' && (
                                  <Shield size={13} color="var(--accent-crimson)" />
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Selector */}
                        <td style={{ padding: '16px 20px' }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole, u.name)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background:
                                u.role === 'admin'
                                  ? 'rgba(229, 9, 20, 0.15)'
                                  : u.role === 'vip'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(255, 255, 255, 0.05)',
                              color:
                                u.role === 'admin'
                                  ? '#E50914'
                                  : u.role === 'vip'
                                  ? '#F59E0B'
                                  : 'var(--text-secondary)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="user">User Thường</option>
                            <option value="vip">VIP Khách quý</option>
                            <option value="admin">Quản trị viên</option>
                          </select>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 20px' }}>
                          {isSuspended ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: 'rgba(255, 71, 87, 0.12)',
                                color: '#ff4757',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              🔴 Đã khóa
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: 'rgba(46, 213, 115, 0.12)',
                                color: '#2ed573',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              🟢 Hoạt động
                            </span>
                          )}
                        </td>

                        {/* Contributions */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <span title="Số đánh giá đã đăng" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MessageSquare size={12} color="#F59E0B" /> {u.reviewsCount}
                            </span>
                            <span title="Phim trong danh sách theo dõi" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Bookmark size={12} color="var(--accent-cyan)" /> {u.watchlistCount}
                            </span>
                          </div>
                        </td>

                        {/* Last Active */}
                        <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Activity size={12} color={isSuspended ? '#ff4757' : '#2ed573'} />
                            <span>{new Date(u.lastActiveAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </td>

                        {/* Created At */}
                        <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u.id, u.status, u.name)}
                              title={isSuspended ? 'Mở khóa tài khoản' : 'Khóa tài khoản này'}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: isSuspended ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.12)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: isSuspended ? '#2ed573' : '#ff4757',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {isSuspended ? <Unlock size={13} /> : <Lock size={13} />}
                              {isSuspended ? 'Mở' : 'Khóa'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              title="Xóa tài khoản"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#14161F',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                Thêm Tài Khoản Thành Viên Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Anh"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="VD: vananh@gmail.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Vai trò thành viên
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '14px',
                  }}
                >
                  <option value="user">Người dùng thông thường (User)</option>
                  <option value="vip">Thành viên VIP (Quyền xem 4K & ưu tiên)</option>
                  <option value="admin">Quản trị viên (Super Admin)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    background: 'var(--accent-crimson, #E50914)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
